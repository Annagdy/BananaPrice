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

type OfertaNormalizada = {
  melhorPreco: number | null
  precoOriginal: number | null
  desconto: number
  loja: string | null
  status: 'PAGO' | 'FREE_TO_PLAY' | 'PROMO_GRATIS' | 'INDISPONIVEL'
}

function calcularMelhorOferta(promocoes: Promocao[]): OfertaNormalizada {
  const ofertasValidas = (promocoes ?? []).filter(
    (p) => p.loja?.nome && p.valor_atual !== null && p.valor_atual !== undefined
  )

  if (ofertasValidas.length === 0) {
    return {
      melhorPreco: null,
      precoOriginal: null,
      desconto: 0,
      loja: null,
      status: 'INDISPONIVEL',
    }
  }

  ofertasValidas.sort((a, b) => (a.valor_atual ?? Infinity) - (b.valor_atual ?? Infinity))
  const melhor = ofertasValidas[0]

  const valorAtual = melhor.valor_atual ?? 0
  const descontoBruto = melhor.percentual_desconto ?? 0
  const nomeLoja = melhor.loja?.nome ?? null

  if (valorAtual === 0 && descontoBruto === 100) {
    return {
      melhorPreco: 0,
      precoOriginal: null,
      desconto: 100,
      loja: nomeLoja,
      status: 'PROMO_GRATIS',
    }
  }

  if (valorAtual === 0) {
    return {
      melhorPreco: 0,
      precoOriginal: 0,
      desconto: 0,
      loja: nomeLoja ?? 'Resgatar Grátis',
      status: 'FREE_TO_PLAY',
    }
  }

  const precoOriginal =
    descontoBruto > 0 && descontoBruto < 100
      ? +(valorAtual / (1 - descontoBruto / 100)).toFixed(2)
      : valorAtual

  return {
    melhorPreco: valorAtual,
    precoOriginal,
    desconto: descontoBruto,
    loja: nomeLoja,
    status: 'PAGO',
  }
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

  const comandosPython = ['python3', 'python', 'py']
  let stdout = ''
  let sucesso = false

  for (const cmd of comandosPython) {
    try {
      const res = await execFileAsync(cmd, [script, busca], {
        encoding: 'utf8',
        timeout: 180000,
      })
      stdout = res.stdout
      sucesso = true
      break
    } catch (err: any) {
      if (err?.code !== 'ENOENT') break
    }
  }

  if (!sucesso || /\bNOT\s+JOGO\b/i.test(stdout)) return []

  try {
    const resultado = JSON.parse(stdout.trim())
    if (resultado.erro) return []

    const nomes: string[] = Array.isArray(resultado.nome)
      ? resultado.nome
      : typeof resultado.nome === 'string'
        ? resultado.nome.split(/\r?\n|,/)
        : []

    return [...new Set(nomes.map(limparNome).filter(Boolean))]
  } catch {
    return []
  }
}

async function enriquecerJogosComPromocoes(jogos: Jogo[]) {
  return Promise.all(
    jogos.map(async (jogo) => {
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

      const oferta = calcularMelhorOferta(promocoes)

      return {
        id: jogo.id_jogo,
        titulo: jogo.titulo,
        melhorPreco: oferta.melhorPreco,
        precoOriginal: oferta.precoOriginal,
        desconto: oferta.desconto,
        loja: oferta.loja,
        status: oferta.status,
        capa: jogo.itad_id ? urlCapaItad(String(jogo.itad_id)) : null,
        promocoes,
      }
    })
  )
}

function aplicarFiltroStatus(lista: any[], statusFiltro: string | null) {
  if (!statusFiltro || statusFiltro === 'TODOS') return lista
  return lista.filter((j) => {
    if (statusFiltro === 'GRATIS') {
      return j.status === 'FREE_TO_PLAY' || j.status === 'PROMO_GRATIS' || j.melhorPreco === 0
    }
    if (statusFiltro === 'INDISPONIVEL') {
      return j.status === 'INDISPONIVEL' || j.melhorPreco === null
    }
    return true
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const isTurbo = searchParams.get('turbo') === '1'
    const busca = (searchParams.get('busca') || searchParams.get('search'))?.trim()
    const modo = searchParams.get('modo') ?? 'nativa'
    const statusFiltro = searchParams.get('status')

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

      const jogosFormatados = await enriquecerJogosComPromocoes(jogos)
      return NextResponse.json({ jogos: aplicarFiltroStatus(jogosFormatados, statusFiltro) })
    }

    // 2. Busca por Termo
    if (busca) {
      if (modo === 'nativa') {
        await trieEngine.carregarCatalogo()
        let jogosMatcheados = trieEngine.buscar(busca, 50)

        if (jogosMatcheados.length === 0) {
          const { data } = await supabaseAdmin
            .from('jogo')
            .select('id_jogo, titulo, itad_id')
            .ilike('titulo', `%${busca}%`)
            .limit(50)

          jogosMatcheados = (data ?? []) as Jogo[]
        }

        const jogosComPromocoes = await enriquecerJogosComPromocoes(jogosMatcheados)
        const jogosEncontrados = aplicarFiltroStatus(jogosComPromocoes, statusFiltro)

        return NextResponse.json({
          tipo: 'nativa',
          busca,
          jogosEncontrados,
        })
      }

      if (modo === 'ia' || modo === 'gpt') {
        const nomesRetornados = await pesquisarNomesIA(busca)
        const listaBusca = nomesRetornados.length > 0 ? nomesRetornados : [busca]
        const candidatosMap = new Map<number, Jogo>()

        for (const nomeIA of listaBusca) {
          const nomeLimp = limparNome(nomeIA)
          if (!nomeLimp) continue

          const { data } = await supabaseAdmin
            .from('jogo')
            .select('id_jogo, titulo, itad_id')
            .ilike('titulo', `%${nomeLimp}%`)
            .limit(15)

          if (data) {
            for (const j of data) {
              candidatosMap.set(j.id_jogo, j)
            }
          }
        }

        const candidatos = Array.from(candidatosMap.values())
        const jogosComPromocoes = await enriquecerJogosComPromocoes(candidatos)
        const jogosEncontrados = aplicarFiltroStatus(jogosComPromocoes, statusFiltro)

        return NextResponse.json({
          tipo: 'ia',
          busca,
          jogosEncontrados,
        })
      }
    }

    // 3. Catálogo Padrão (com filtro por status e paginação no servidor)
    if (statusFiltro && statusFiltro !== 'TODOS') {
      const page = Number(searchParams.get('page')) || 1
      const limit = Number(searchParams.get('limit')) || 18

      const { data: todosJogos } = await supabaseAdmin
        .from('jogo')
        .select('id_jogo, titulo, itad_id')
        .order('id_jogo', { ascending: true })

      if (!todosJogos || todosJogos.length === 0) {
        return NextResponse.json({ jogos: [], total: 0 })
      }

      const jogosEnriquecidos = await enriquecerJogosComPromocoes(todosJogos)
      const jogosFiltrados = aplicarFiltroStatus(jogosEnriquecidos, statusFiltro)

      const total = jogosFiltrados.length
      const inicio = (page - 1) * limit
      const jogosPaginados = jogosFiltrados.slice(inicio, inicio + limit)

      return NextResponse.json({
        jogos: jogosPaginados,
        total,
        page,
        limit,
      })
    }

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