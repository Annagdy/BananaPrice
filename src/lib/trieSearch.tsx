import { supabase as supabaseAdmin } from '@/lib/supabase.ts'

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export type JogoResumido = {
  id_jogo: number
  titulo: string
  itad_id: string | number | null
}

class TrieNode {
  filhos: Map<string, TrieNode> = new Map()
  jogos: Set<JogoResumido> = new Set()
}

export class EngineBuscaTrie {
  private raiz: TrieNode = new TrieNode()
  private inicializado: boolean = false
  private ultimaAtualizacao: number = 0
  private CACHE_TTL_MS = 1000 * 60 * 30 // Recarrega a árvore a cada 30 min

  private inserirPalavra(palavra: string, jogo: JogoResumido) {
    let no = this.raiz
    for (const char of palavra) {
      if (!no.filhos.has(char)) {
        no.filhos.set(char, new TrieNode())
      }
      no = no.filhos.get(char)!
      no.jogos.add(jogo)
    }
  }

  public indexarJogo(jogo: JogoResumido) {
    const tituloNorm = normalizar(jogo.titulo)
    const palavras = tituloNorm.split(' ').filter(p => p.length > 0)

    // Indexa cada palavra individualmente (ex: "Grand", "Theft", "Auto")
    for (const palavra of palavras) {
      this.inserirPalavra(palavra, jogo)
    }
  }

  public async carregarCatalogo() {
    const agora = Date.now()
    if (this.inicializado && agora - this.ultimaAtualizacao < this.CACHE_TTL_MS) {
      return
    }

    const { data: jogos, error } = await supabaseAdmin
      .from('jogo')
      .select('id_jogo, titulo, itad_id')

    if (error || !jogos) {
      console.error('[TrieEngine] Erro ao carregar jogos:', error?.message)
      return
    }

    this.raiz = new TrieNode()
    for (const j of jogos) {
      this.indexarJogo(j)
    }

    this.inicializado = true
    this.ultimaAtualizacao = agora
  }

  /**
   * Busca jogos que satisfaçam todos os tokens digitados pelo usuário
   */
  public buscar(termo: string, limite = 10): JogoResumido[] {
    const termoNorm = normalizar(termo)
    const tokens = termoNorm.split(' ').filter(t => t.length > 0)

    if (tokens.length === 0) return []

    let resultadosInterseccao: Set<JogoResumido> | null = null

    for (const token of tokens) {
      let no = this.raiz
      let encontrou = true

      for (const char of token) {
        if (!no.filhos.has(char)) {
          encontrou = false
          break
        }
        no = no.filhos.get(char)!
      }

      const jogosDoToken = encontrou ? no.jogos : new Set<JogoResumido>()

      if (resultadosInterseccao === null) {
        resultadosInterseccao = new Set(jogosDoToken)
      } else {
        // Realiza intersecção para garantir que todas as palavras pesquisadas existam no título
        const novosResultados = new Set<JogoResumido>()
        for (const j of resultadosInterseccao) {
          if (jogosDoToken.has(j)) {
            novosResultados.add(j)
          }
        }
        resultadosInterseccao = novosResultados
      }

      if (resultadosInterseccao.size === 0) break
    }

    return Array.from(resultadosInterseccao ?? []).slice(0, limite)
  }
}

// Instância única em memória (Singleton)
export const trieEngine = new EngineBuscaTrie()