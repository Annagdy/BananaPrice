import fs from 'fs'
import path from 'path'

interface ParamDoc {
  name: string
  description: string
  type?: string
}

interface ItemDoc {
  name: string
  kind: 'function' | 'class' | 'type' | 'variable' | 'component' | 'api'
  description: string
  params: ParamDoc[]
  returns?: string
  throws?: string
  signature?: string
  line: number
}

interface FileDoc {
  filePath: string
  fileName: string
  module: string
  fileOverview: string
  items: ItemDoc[]
}

function scanDir(dir: string, baseDir: string): string[] {
  let results: string[] = []
  const list = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of list) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!['node_modules', '.next', '.git', 'docs', 'build', 'dist'].includes(entry.name)) {
        results = results.concat(scanDir(full, baseDir))
      }
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      results.push(full)
    }
  }
  return results
}

function parseFileDocs(filePath: string, projectRoot: string): FileDoc {
  const content = fs.readFileSync(filePath, 'utf8')
  const relPath = path.relative(projectRoot, filePath).replace(/\\/g, '/')
  const parts = relPath.split('/')
  const moduleName = parts.length > 2 ? parts.slice(1, -1).join('/') : (parts[1] || 'root')

  let fileOverview = ''
  const fileHeaderMatch = content.match(/^(\/\*\*[\s\S]*?\*\/|\/\*[\s\S]*?\*\/)/)
  if (fileHeaderMatch) {
    fileOverview = cleanDocComment(fileHeaderMatch[1])
  }

  const items: ItemDoc[] = []

  const blockRegex = /\/\*\*([\s\S]*?)\*\//g
  let match: RegExpExecArray | null

  while ((match = blockRegex.exec(content)) !== null) {
    const rawComment = match[1]
    const commentEndIndex = match.index + match[0].length
    const rest = content.slice(commentEndIndex)
    const nextLineMatch = rest.match(/^\s*([^\r\n]+)/)

    if (!nextLineMatch) continue

    const codeSnippet = nextLineMatch[1].trim()

    let kind: ItemDoc['kind'] = 'variable'
    let name = ''

    if (codeSnippet.startsWith('export default function ') || codeSnippet.startsWith('export async function ') || codeSnippet.startsWith('export function ') || codeSnippet.startsWith('async function ') || codeSnippet.startsWith('function ')) {
      kind = 'function'
      const fnMatch = codeSnippet.match(/function\s+([a-zA-Z0-9_]+)/)
      if (fnMatch) name = fnMatch[1]
      if (codeSnippet.startsWith('export default function') && /^[A-Z]/.test(name)) {
        kind = 'component'
      }
    } else if (codeSnippet.startsWith('export class ') || codeSnippet.startsWith('class ')) {
      kind = 'class'
      const clMatch = codeSnippet.match(/class\s+([a-zA-Z0-9_]+)/)
      if (clMatch) name = clMatch[1]
    } else if (codeSnippet.startsWith('export type ') || codeSnippet.startsWith('export interface ') || codeSnippet.startsWith('type ') || codeSnippet.startsWith('interface ')) {
      kind = 'type'
      const tMatch = codeSnippet.match(/(type|interface)\s+([a-zA-Z0-9_]+)/)
      if (tMatch) name = tMatch[2]
    } else if (codeSnippet.startsWith('export const ') || codeSnippet.startsWith('const ')) {
      const cMatch = codeSnippet.match(/const\s+([a-zA-Z0-9_]+)/)
      if (cMatch) {
        name = cMatch[1]
        kind = /^[A-Z]/.test(name) && filePath.endsWith('.tsx') ? 'component' : 'variable'
      }
    }

    if (!name && relPath.includes('api/')) {
      const routeMatch = codeSnippet.match(/export\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)/)
      if (routeMatch) {
        name = `${routeMatch[2]} (${relPath})`
        kind = 'api'
      }
    }

    if (!name) continue

    const parsed = parseDocBody(rawComment)
    const lineIndex = content.slice(0, match.index).split('\n').length

    items.push({
      name,
      kind,
      description: parsed.description,
      params: parsed.params,
      returns: parsed.returns,
      throws: parsed.throws,
      signature: codeSnippet.replace(/\{.*$/, '').trim(),
      line: lineIndex,
    })
  }

  return {
    filePath: relPath,
    fileName: path.basename(filePath),
    module: moduleName,
    fileOverview,
    items,
  }
}

function cleanDocComment(raw: string): string {
  return raw
    .replace(/^\/\*\*?/, '')
    .replace(/\*\/$/, '')
    .split('\n')
    .map(line => line.replace(/^\s*\*\s?/, '').trim())
    .join('\n')
    .trim()
}

function parseDocBody(body: string) {
  const lines = body.split('\n').map(l => l.replace(/^\s*\*\s?/, '').trim())
  const descLines: string[] = []
  const params: ParamDoc[] = []
  let returns: string | undefined
  let throws: string | undefined

  for (const line of lines) {
    if (line.startsWith('@param')) {
      const pMatch = line.match(/@param\s+(?:\{([^}]+)\}\s+)?([a-zA-Z0-9_$.]+)(?:\s+-\s*|\s+)(.*)/)
      if (pMatch) {
        params.push({
          type: pMatch[1],
          name: pMatch[2],
          description: pMatch[3]?.trim() || '',
        })
      } else {
        const simpleMatch = line.match(/@param\s+([a-zA-Z0-9_$.]+)(.*)/)
        if (simpleMatch) {
          params.push({
            name: simpleMatch[1],
            description: simpleMatch[2]?.replace(/^(\s*-\s*|\s+)/, '').trim() || '',
          })
        }
      }
    } else if (line.startsWith('@returns') || line.startsWith('@return')) {
      returns = line.replace(/@returns?\s+(?:\{[^}]+\}\s+)?/, '').trim()
    } else if (line.startsWith('@throws') || line.startsWith('@throw')) {
      throws = line.replace(/@throws?\s+/, '').trim()
    } else if (!line.startsWith('@')) {
      if (line) descLines.push(line)
    }
  }

  return {
    description: descLines.join(' ').trim(),
    params,
    returns,
    throws,
  }
}

export function buildDocumentationSite(projectRoot: string, outputDir: string) {
  const srcDir = path.join(projectRoot, 'src')
  const files = scanDir(srcDir, projectRoot)
  const parsedDocs: FileDoc[] = files.map(f => parseFileDocs(f, projectRoot))

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const jsonDump = JSON.stringify(parsedDocs)

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BananaPrice - Documentação e Referência de Funções</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@500;700;800&family=Nunito+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'bp-primary': '#facc15',
            'bp-on-primary': '#231b00',
            'bp-bg': '#150c09',
            'bp-surface': '#231916',
            'bp-nav': '#322824',
            'bp-input': '#271d1a',
            'bp-neutral': '#2c221e',
            'bp-text': '#f1dfd8',
            'bp-muted': '#d1c6ab',
            'bp-divisor': '#3d322e',
            'bp-steam': '#0088ff'
          },
          fontFamily: {
            head: ['Rubik', 'sans-serif'],
            body: ['"Nunito Sans"', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace']
          }
        }
      }
    }
  </script>
  <style>
    body {
      background-color: #150c09;
      color: #f1dfd8;
      font-family: 'Nunito Sans', sans-serif;
    }
    h1, h2, h3, h4, .font-head {
      font-family: 'Rubik', sans-serif;
    }
    code, pre, .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: #150c09;
    }
    ::-webkit-scrollbar-thumb {
      background: #322824;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #3d322e;
    }
  </style>
</head>
<body class="min-h-screen flex flex-col bg-bp-bg antialiased selection:bg-bp-primary selection:text-bp-on-primary">
  
  <!-- Linha divisória de topo padrão BananaPrice -->
  <div class="h-[5px] w-full bg-[#4a3a2a]"></div>

  <!-- Header BananaPrice -->
  <header class="border-b border-[#322824] bg-bp-nav/95 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between gap-4 shadow-lg shadow-black/40">
    <div class="flex items-center gap-3">
      <span class="text-3xl select-none">🍌</span>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-head font-extrabold text-bp-primary tracking-wide">BananaPrice</h1>
          <span class="text-[11px] font-mono bg-bp-primary/10 text-bp-primary border border-bp-primary/30 px-2 py-0.5 rounded-full font-bold">DOCS</span>
        </div>
        <p class="text-xs text-bp-muted/80">Radar técnico de funções, serviços e rotas de API</p>
      </div>
    </div>

    <div class="flex items-center gap-4">
      <div class="relative">
        <input id="search-input" type="search" placeholder="Buscar função, componente ou rota..." class="px-4 py-2 text-sm bg-bp-input border border-bp-neutral rounded-full text-bp-text placeholder-bp-muted/50 focus:outline-none focus:border-bp-primary w-72 md:w-96 transition-all" />
      </div>
      <span id="badge-count" class="text-xs bg-bp-surface text-bp-primary border border-bp-neutral px-3 py-1.5 rounded-full font-mono font-bold shadow-inner">0 itens</span>
    </div>
  </header>

  <!-- Divisor -->
  <div class="h-[1px] w-full bg-[#3d322e]"></div>

  <div class="flex flex-1 overflow-hidden">
    <!-- Sidebar de Módulos -->
    <aside class="w-80 border-r border-[#322824] bg-bp-surface/50 overflow-y-auto p-4 space-y-4">
      <div class="flex items-center justify-between px-2">
        <span class="text-xs font-head font-bold uppercase tracking-wider text-bp-primary">Módulos</span>
        <span class="text-[10px] text-bp-muted/60 uppercase">src/</span>
      </div>
      <div id="module-filters" class="space-y-1"></div>
    </aside>

    <!-- Área de Conteúdo -->
    <main class="flex-1 overflow-y-auto p-8 space-y-6 bg-bp-bg">
      <div id="active-filter-badge" class="hidden items-center gap-2 text-xs text-bp-muted mb-2">
        <span>Filtrando por módulo:</span>
        <span id="active-filter-name" class="font-bold text-bp-primary bg-bp-neutral px-2.5 py-1 rounded-md"></span>
        <button id="clear-filter" class="text-xs text-bp-muted hover:text-bp-primary underline ml-2 transition-colors">limpar filtro</button>
      </div>

      <div id="items-container" class="grid gap-5"></div>
      <div id="empty-state" class="hidden py-20 text-center text-bp-muted/60">
        <span class="text-4xl block mb-2">🔍</span>
        Nenhuma função ou item documentado encontrado para o termo pesquisado.
      </div>
    </main>
  </div>

  <!-- Footer padrão BananaPrice -->
  <div class="h-[5px] w-full bg-[#4a3a2a]"></div>
  <footer class="bg-bp-nav px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-bp-muted/70 gap-2 border-t border-[#322824]">
    <div>BananaPrice Documentation &bull; Referência Técnica</div>
    <div class="font-mono text-[11px] text-bp-primary">v1.0</div>
  </footer>

  <script>
    const docs = ${jsonDump};
    let currentModule = null;
    let searchTerm = '';

    const container = document.getElementById('items-container');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');
    const badgeCount = document.getElementById('badge-count');
    const moduleFilters = document.getElementById('module-filters');
    const activeFilterBadge = document.getElementById('active-filter-badge');
    const activeFilterName = document.getElementById('active-filter-name');
    const clearFilterBtn = document.getElementById('clear-filter');

    const moduleCounts = {};
    let totalItems = 0;

    docs.forEach(file => {
      file.items.forEach(() => {
        moduleCounts[file.module] = (moduleCounts[file.module] || 0) + 1;
        totalItems++;
      });
    });

    badgeCount.textContent = totalItems + ' funções & tipos';

    function renderModules() {
      moduleFilters.innerHTML = '';
      
      const allBtn = document.createElement('button');
      allBtn.className = 'w-full text-left px-3.5 py-2 rounded-xl text-sm flex items-center justify-between transition-colors ' + (!currentModule ? 'bg-bp-primary text-bp-on-primary font-bold shadow-md' : 'text-bp-muted hover:bg-bp-neutral hover:text-bp-text');
      allBtn.innerHTML = '<span>Todos os arquivos</span><span class="text-xs font-mono opacity-80">' + totalItems + '</span>';
      allBtn.onclick = () => { currentModule = null; render(); };
      moduleFilters.appendChild(allBtn);

      Object.entries(moduleCounts).sort((a,b) => b[1] - a[1]).forEach(([mod, count]) => {
        const btn = document.createElement('button');
        const isActive = currentModule === mod;
        btn.className = 'w-full text-left px-3.5 py-2 rounded-xl text-sm flex items-center justify-between transition-colors ' + (isActive ? 'bg-bp-primary text-bp-on-primary font-bold shadow-md' : 'text-bp-muted hover:bg-bp-neutral hover:text-bp-text');
        btn.innerHTML = '<span class="truncate pr-2 font-mono text-xs">' + mod + '</span><span class="text-xs font-mono opacity-80">' + count + '</span>';
        btn.onclick = () => { currentModule = mod; render(); };
        moduleFilters.appendChild(btn);
      });
    }

    function getKindBadge(kind) {
      const styles = {
        function: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
        component: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30',
        api: 'bg-sky-400/10 text-sky-300 border-sky-400/30',
        class: 'bg-orange-400/10 text-orange-300 border-orange-400/30',
        type: 'bg-rose-400/10 text-rose-300 border-rose-400/30',
        variable: 'bg-slate-400/10 text-slate-300 border-slate-400/30'
      };
      return '<span class="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full border ' + (styles[kind] || styles.variable) + '">' + kind + '</span>';
    }

    function render() {
      renderModules();

      if (currentModule) {
        activeFilterBadge.classList.remove('hidden');
        activeFilterBadge.classList.add('flex');
        activeFilterName.textContent = currentModule;
      } else {
        activeFilterBadge.classList.add('hidden');
        activeFilterBadge.classList.remove('flex');
      }

      container.innerHTML = '';
      let visibleCount = 0;

      docs.forEach(file => {
        if (currentModule && file.module !== currentModule) return;

        file.items.forEach(item => {
          const matchSearch = !searchTerm || 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            file.filePath.toLowerCase().includes(searchTerm.toLowerCase());

          if (!matchSearch) return;

          visibleCount++;

          const card = document.createElement('article');
          card.className = 'bg-bp-surface border border-bp-neutral hover:border-bp-primary/40 rounded-2xl p-6 transition shadow-lg shadow-black/30';

          const paramsHtml = item.params.length > 0 ? \`
            <div class="mt-4 pt-3 border-t border-bp-neutral">
              <span class="text-xs font-head font-bold text-bp-primary uppercase tracking-wider block mb-2.5">Parâmetros</span>
              <div class="grid gap-2">
                \${item.params.map(p => \`
                  <div class="flex items-baseline gap-2.5 text-xs bg-bp-input/80 px-3 py-2 rounded-lg border border-bp-neutral/50">
                    <span class="font-mono text-bp-primary font-bold">\${p.name}</span>
                    \${p.type ? \`<span class="text-bp-muted/60 font-mono">(\${p.type})</span>\` : ''}
                    <span class="text-bp-text/90">\${p.description}</span>
                  </div>
                \`).join('')}
              </div>
            </div>
          \` : '';

          const returnsHtml = item.returns ? \`
            <div class="mt-3.5 flex items-baseline gap-2 text-xs bg-bp-bg/60 px-3 py-2 rounded-lg border border-bp-neutral/40">
              <span class="font-head font-bold text-bp-muted uppercase tracking-wider text-[11px]">Retorno:</span>
              <span class="text-bp-text font-mono">\${item.returns}</span>
            </div>
          \` : '';

          const throwsHtml = item.throws ? \`
            <div class="mt-2.5 flex items-baseline gap-2 text-xs bg-rose-950/20 px-3 py-2 rounded-lg border border-rose-500/20 text-rose-300">
              <span class="font-head font-bold text-rose-400 uppercase tracking-wider text-[11px]">Lança:</span>
              <span>\${item.throws}</span>
            </div>
          \` : '';

          card.innerHTML = \`
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="flex items-center gap-3 flex-wrap">
                  <h2 class="text-lg font-bold text-bp-text font-head hover:text-bp-primary transition-colors">\${item.name}</h2>
                  \${getKindBadge(item.kind)}
                </div>
                <div class="text-xs text-bp-muted/60 font-mono mt-1">
                  \${file.filePath}:\${item.line}
                </div>
              </div>
            </div>

            \${item.signature ? \`
              <pre class="mt-3.5 p-3 bg-bp-input border border-bp-neutral rounded-xl text-xs text-bp-primary/90 overflow-x-auto"><code>\${item.signature}</code></pre>
            \` : ''}

            <p class="text-sm text-bp-text/90 mt-3.5 leading-relaxed font-body">\${item.description || '<span class=\"italic text-bp-muted/50\">Sem descrição informada</span>'}</p>

            \${paramsHtml}
            \${returnsHtml}
            \${throwsHtml}
          \`;

          container.appendChild(card);
        });
      });

      if (visibleCount === 0) {
        emptyState.classList.remove('hidden');
      } else {
        emptyState.classList.add('hidden');
      }
    }

    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim();
      render();
    });

    clearFilterBtn.onclick = () => {
      currentModule = null;
      render();
    };

    render();
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(outputDir, 'index.html'), html, 'utf8')
  fs.writeFileSync(path.join(outputDir, 'docs.json'), jsonDump, 'utf8')
  console.log(`Documentação gerada com sucesso em: ${path.join(outputDir, 'index.html')}`)
}

if (require.main === module) {
  const root = process.cwd()
  const out = path.join(root, 'docs')
  buildDocumentationSite(root, out)
}
