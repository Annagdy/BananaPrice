import { NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { supabase as supabaseAdmin } from '@/lib/supabase.ts'
import { urlCapaItad } from '@/lib/itad.ts'
import { trieEngine } from '@/lib/trieSearch'
import { listarCatalogo } from './catalogo'

const execFileAsync = promisify(execFile)

export const dynamic = 'force-dynamic'

type Jogo = {
  id_jogo: number
  titulo: string
  itad_id: string | number | null
}

type Promocao = {
  valor_atual: number | null
  percentual_desconto: number | null
  atualizado_em: string | null
  loja: { nome: string } | null
}

type JogoComPromocoes = Jogo & {
  promocoes: Promocao[]
}

function limparNome(nome: string): string {
  return nome
    .replace(/\bO\s+Gemini\s+disse\b[:,]?\s*/gi, '')
    .replace(/\bIsThereAnyDeal\b/gi, '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/[™®©]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Detecta se estamos rodando em Windows ou Linux/Mac para usar o comando correto de Python
async function pesquisarNomesIA(busca: string): Promise<string[]> {
  const script = path.join(
    process.cwd(),
    'src',
    'app',
    'api',
    'v1',
    'games',
    'pesquisaNomeGPT.py'
  )

  // Tenta comandos comuns de Python no sistema
  const comandosPython = ['python3', 'python', 'py']
  let stdout = ''
  let sucesso = false
  let ultimoErro = ''

  for (const cmd of comandosPython) {
    try {
      console.log(`[IA Search] Tentando executar via '${cmd}'...`)
      const res = await execFileAsync(cmd, [script, busca], {
        encoding: 'utf8',
        timeout: 180000, // 3 minutos de timeout para o Selenium rodar
      })
      stdout = res.stdout
      sucesso = true
      break
    } catch (err: any) {
      ultimoErro = err?.message || String(err)
      // Se for erro de 'comando não encontrado' (ENOENT), tenta o próximo comando
      if (err?.code !== 'ENOENT') {
        console.error(`[IA Search] Erro durante a execução do Selenium com ${cmd}:`, err)
        break
      }
    }
  }

  if (!sucesso) {
    console.error('[IA Search] Falha ao disparar o script Python. Verifique se o Python e Selenium estão instalados.', ultimoErro)
    return []
  }

  if (/\bNOT\s+JOGO\b/i.test(stdout)) return []

  try {
    const resultado = JSON.parse(stdout.trim())
    if (resultado.erro) {
      console.error('[IA Search] Erro retornado do script Python:', resultado.erro)
      return []
    }

    const nomes: string[] = Array.isArray(resultado.nome)
      ? resultado.nome
      : typeof resultado.nome === 'string'
        ? resultado.nome.split(/\r?\n|,/)
        : []

    return [...new Set(nomes.map(limparNome).filter(Boolean))]
  } catch (parseErr) {
    console.error('[IA Search] Erro ao fazer parse do JSON retornado pelo Python:', stdout)
    return []
  }
}

// Junta os dados do jogo com os preços das lojas no Supabase
async function enriquecerJogosComPromocoes(jogos: Jogo[]) {
  const resultados: JogoComPromocoes[] = []

  for (const jogo of jogos) {
    const { data: precos } = await supabaseAdmin
      .from('preco_jogo')
      .select(`
        valor_atual,
        percentual_desconto,
        atualizado_em,
        loja ( nome )
      `)
      .eq('id_jogo', jogo.id_jogo)

    const promocoes: Promocao[] = (precos ?? []).map((preco: any) => ({
      valor_atual: preco.valor_atual,
      percentual_desconto: preco.percentual_desconto,
      atualizado_em: preco.atualizado_em,
      loja: Array.isArray(preco.loja) ? preco.loja[0] ?? null : preco.loja ?? null,
    }))

    resultados.push({ ...jogo, promocoes })
  }

  return resultados
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const isTurbo = searchParams.get('turbo') === '1'
    
    // Aceita tanto 'busca' quanto 'search'
    const busca = (searchParams.get('busca') || searchParams.get('search'))?.trim()
    const modo = searchParams.get('modo') ?? 'nativa'

    // 1. Vitrine Turbo
    if (isTurbo) {
      const limit = Number(searchParams.get('limit')) || 6
      const DIAS_DE_TURBO = 7
      const dataLimite = new Date()
      dataLimite.setDate(dataLimite.getDate() - DIAS_DE_TURBO)

      const { data: turbos } = await supabaseAdmin
        .from('pagamento_turbo')
        .select('id_jogo')
        .eq('status', 'aprovado')
        .gte('criado_em', dataLimite.toISOString())

      const idsTurbinados = Array.from(new Set((turbos ?? []).map((t: any) => Number(t.id_jogo))))
      if (idsTurbinados.length === 0) return NextResponse.json({ jogos: [] })

      const { data: jogos } = await supabaseAdmin
        .from('jogo')
        .select('id_jogo, titulo, itad_id')
        .in('id_jogo', idsTurbinados)
        .limit(limit)

      if (!jogos) return NextResponse.json({ jogos: [] })

      const jogosFormatados = await Promise.all(
        jogos.map(async (j: any) => {
          const { data: precos } = await supabaseAdmin
            .from('preco_jogo')
            .select(`valor_atual, percentual_desconto, loja ( nome )`)
            .eq('id_jogo', j.id_jogo)
            .limit(1)

          const oferta = precos && precos.length > 0 ? precos[0] : null
          const lojaObj = Array.isArray(oferta?.loja) ? oferta.loja[0] : oferta?.loja
          const nomeLoja: string | null = lojaObj?.nome ?? null

          let melhorPreco: number | null = oferta?.valor_atual ?? null
          const descontoBruto = oferta?.percentual_desconto ?? 0

          if (!nomeLoja || (melhorPreco === 0 && descontoBruto < 100)) {
            melhorPreco = null
          }

          const isGratis = melhorPreco === 0
          const isIndisponivel = melhorPreco === null
          const desconto = isIndisponivel ? 0 : isGratis ? 100 : descontoBruto

          return {
            id: j.id_jogo,
            titulo: j.titulo,
            melhorPreco,
            precoOriginal: isIndisponivel
              ? null
              : isGratis
                ? 0
                : melhorPreco && descontoBruto > 0 && descontoBruto < 100
                  ? +(melhorPreco / (1 - descontoBruto / 100)).toFixed(2)
                  : melhorPreco,
            desconto,
            loja: isIndisponivel ? null : nomeLoja,
            capa: j.itad_id ? urlCapaItad(j.itad_id) : null,
          }
        })
      )

      return NextResponse.json({ jogos: jogosFormatados })
    }

    // 2. Busca por Termo
    if (busca) {
      // MODO A: BUSCA NATIVA (Árvore Trie + Fallback ilike)
      if (modo === 'nativa') {
        await trieEngine.carregarCatalogo()
        let jogosMatcheados = trieEngine.buscar(busca, 30)

        // Fallback: Se a Trie estiver vazia ou não encontrar match direto, busca no Supabase
        if (jogosMatcheados.length === 0) {
          const { data } = await supabaseAdmin
            .from('jogo')
            .select('id_jogo, titulo, itad_id')
            .ilike('titulo', `%${busca}%`)
            .limit(30)

          jogosMatcheados = (data ?? []) as Jogo[]
        }

        const jogosComPromocoes = await enriquecerJogosComPromocoes(jogosMatcheados)

        return NextResponse.json({
          tipo: 'nativa',
          busca,
          jogosEncontrados: jogosComPromocoes,
        })
      }

      // MODO B: BUSCA VIA IA / SELENIUM
      if (modo === 'ia' || modo === 'gpt') {
        const nomesRetornados = await pesquisarNomesIA(busca)

        // Se a IA não retornou nomes, faz fallback para busca parcial no banco
        const listaBusca = nomesRetornados.length > 0 ? nomesRetornados : [busca]

        const candidatosMap = new Map<number, Jogo>()

        for (const nomeIA of listaBusca) {
          const nomeLimp = limparNome(nomeIA)
          if (!nomeLimp) continue

          // Busca flexível via ILIKE para garantir que variações de título sejam encontradas
          const { data } = await supabaseAdmin
            .from('jogo')
            .select('id_jogo, titulo, itad_id')
            .ilike('titulo', `%${nomeLimp}%`)
            .limit(10)

          if (data) {
            for (const j of data) {
              candidatosMap.set(j.id_jogo, j)
            }
          }
        }

        const candidatos = Array.from(candidatosMap.values())
        const jogosComPromocoes = await enriquecerJogosComPromocoes(candidatos)

        return NextResponse.json({
          tipo: 'ia',
          busca,
          jogosEncontrados: jogosComPromocoes,
        })
      }
    }

    // 3. Catálogo Padrão
    return listarCatalogo(request)
  } catch (error) {
    console.error('Erro ao pesquisar jogos:', error)
    return NextResponse.json(
      {
        erro: 'Não foi possível pesquisar os jogos.',
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}