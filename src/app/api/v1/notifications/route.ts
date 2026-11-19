import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase.ts/server'
import { supabase as supabaseAdmin } from '@/lib/supabase.ts'
import {
  buscarNotificacoesUsuario,
  marcarNotificacoesLidas,
  excluirNotificacoes,
  criarNotificacaoManual,
} from '@/services/notificacoes'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
}

/**
 * Helper privado para descobrir o `id_usuario` da tabela `usuario`
 * a partir do UUID da sessão do Supabase Auth (`auth_id`).
 */
async function usuarioLogado(): Promise<number | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data } = await supabaseAdmin
      .from('usuario')
      .select('id_usuario')
      .eq('auth_id', user.id)
      .maybeSingle()

    return data?.id_usuario ?? null
  } catch (error) {
    console.error('[notifications route] Erro ao identificar usuário:', error)
    return null
  }
}

/**
 * GET /api/v1/notifications
 * Retorna as notificações do usuário logado e a contagem de não lidas.
 */
export async function GET() {
  const idUsuario = await usuarioLogado()

  if (idUsuario === null) {
    return NextResponse.json(
      { error: 'Não autenticado.' },
      { status: 401, headers: NO_CACHE_HEADERS }
    )
  }

  try {
    const dados = await buscarNotificacoesUsuario(idUsuario)
    return NextResponse.json(dados, { headers: NO_CACHE_HEADERS })
  } catch (err: any) {
    console.error('[notifications GET]:', err?.message ?? err)
    return NextResponse.json(
      { error: 'Erro ao buscar notificações.' },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}

/**
 * PATCH /api/v1/notifications
 * Marca uma ou todas as notificações do usuário como lidas.
 * @body { idNotificacao?: number, todas?: boolean }
 */
export async function PATCH(request: Request) {
  const idUsuario = await usuarioLogado()

  if (idUsuario === null) {
    return NextResponse.json(
      { error: 'Não autenticado.' },
      { status: 401, headers: NO_CACHE_HEADERS }
    )
  }

  const body = await request.json().catch(() => null)
  const idNotificacao = body?.idNotificacao ? Number(body.idNotificacao) : undefined
  const todas = Boolean(body?.todas)

  if (!todas && !idNotificacao) {
    return NextResponse.json(
      { error: 'Informe idNotificacao ou todas=true.' },
      { status: 400, headers: NO_CACHE_HEADERS }
    )
  }

  const ok = await marcarNotificacoesLidas(idUsuario, { idNotificacao, todas })
  if (!ok) {
    return NextResponse.json(
      { error: 'Não foi possível atualizar a notificação.' },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }

  return NextResponse.json({ ok: true }, { headers: NO_CACHE_HEADERS })
}

/**
 * DELETE /api/v1/notifications
 * Exclui uma notificação específica ou todas do usuário logado.
 * @query ?id=123 ou ?todas=true
 * @body { idNotificacao?: number, todas?: boolean }
 */
export async function DELETE(request: Request) {
  const idUsuario = await usuarioLogado()

  if (idUsuario === null) {
    return NextResponse.json(
      { error: 'Não autenticado.' },
      { status: 401, headers: NO_CACHE_HEADERS }
    )
  }

  const url = new URL(request.url)
  const queryId = url.searchParams.get('id')
  const queryTodas = url.searchParams.get('todas') === 'true'

  let idNotificacao = queryId ? Number(queryId) : undefined
  let todas = queryTodas

  if (!idNotificacao && !todas) {
    const body = await request.json().catch(() => null)
    if (body?.idNotificacao) idNotificacao = Number(body.idNotificacao)
    if (body?.todas) todas = Boolean(body.todas)
  }

  if (!todas && !idNotificacao) {
    return NextResponse.json(
      { error: 'Informe id ou todas=true para exclusão.' },
      { status: 400, headers: NO_CACHE_HEADERS }
    )
  }

  const ok = await excluirNotificacoes(idUsuario, { idNotificacao, todas })
  if (!ok) {
    return NextResponse.json(
      { error: 'Não foi possível excluir a notificação.' },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }

  return NextResponse.json({ ok: true }, { headers: NO_CACHE_HEADERS })
}

/**
 * POST /api/v1/notifications
 * Cria uma notificação in-app para o usuário logado e valida a preferência `notificar_email` no banco.
 * @body { idJogo?, idLista?, titulo, mensagem, preco?, desconto?, loja?, enviarEmail? }
 */
export async function POST(request: Request) {
  const idUsuario = await usuarioLogado()

  if (idUsuario === null) {
    return NextResponse.json(
      { error: 'Não autenticado.' },
      { status: 401, headers: NO_CACHE_HEADERS }
    )
  }

  const body = await request.json().catch(() => null)
  const titulo = String(body?.titulo ?? '').trim()
  const mensagem = String(body?.mensagem ?? '').trim()

  if (!titulo || !mensagem) {
    return NextResponse.json(
      { error: 'Campos titulo e mensagem são obrigatórios.' },
      { status: 400, headers: NO_CACHE_HEADERS }
    )
  }

  const resultado = await criarNotificacaoManual({
    idUsuario,
    idJogo: body?.idJogo ? Number(body.idJogo) : undefined,
    idLista: body?.idLista ? Number(body.idLista) : undefined,
    titulo,
    mensagem,
    preco: body?.preco != null ? Number(body.preco) : undefined,
    desconto: body?.desconto != null ? Number(body.desconto) : undefined,
    loja: body?.loja ? String(body.loja) : undefined,
    enviarEmail: body?.enviarEmail !== false,
  })

  if (!resultado.ok) {
    return NextResponse.json(
      { error: resultado.erro || 'Erro ao registrar notificação.' },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }

  return NextResponse.json(
    {
      ok: true,
      emailEnviado: resultado.emailEnviado,
      erroEmail: resultado.erroEmail,
      destinoEmail: resultado.destinoEmail,
    },
    { status: 201, headers: NO_CACHE_HEADERS }
  )
}