import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase.ts/server.ts'
import { supabase as supabaseAdmin } from '@/lib/supabase.ts'
import {
  criarPagamentoPix,
  consultarStatusPagamento,
} from '@/services/pagamentoTurbo'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
}

/* Descobre o id_usuario (da tabela usuario) de quem está logado. */
async function usuarioLogado(): Promise<{ idUsuario: number; email: string } | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabaseAdmin
    .from('usuario')
    .select('id_usuario, email')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (!data?.id_usuario) return null
  return { idUsuario: data.id_usuario, email: data.email ?? user.email ?? '' }
}

/*
POST /api/v1/payment/pix — Cria um pagamento Pix via Mercado Pago.
@body { idJogo: number }
@returns 201 { ok, idPagamento, pixCopiaCola, qrCodeBase64, valor, expiraEm }
*/
export async function POST(request: Request) {
  const usuario = await usuarioLogado()
  if (!usuario) {
    return NextResponse.json(
      { error: 'Não autenticado.' },
      { status: 401, headers: NO_CACHE_HEADERS }
    )
  }

  const body = await request.json().catch(() => null)
  const idJogo = body?.idJogo ? Number(body.idJogo) : null

  if (!idJogo || isNaN(idJogo)) {
    return NextResponse.json(
      { error: 'Campo idJogo é obrigatório.' },
      { status: 400, headers: NO_CACHE_HEADERS }
    )
  }

  const resultado = await criarPagamentoPix({
    idUsuario: usuario.idUsuario,
    idJogo,
    emailPagador: usuario.email,
  })

  if (!resultado.ok) {
    return NextResponse.json(
      { error: resultado.erro },
      { status: 400, headers: NO_CACHE_HEADERS }
    )
  }

  return NextResponse.json(
    {
      ok: true,
      idPagamento: resultado.idPagamento,
      pixCopiaCola: resultado.pixCopiaCola,
      qrCodeBase64: resultado.qrCodeBase64,
      valor: resultado.valor,
      expiraEm: resultado.expiraEm,
    },
    { status: 201, headers: NO_CACHE_HEADERS }
  )
}

/*
GET /api/v1/payment/pix?id={idPagamento} — Consulta o status de um pagamento (polling).
@returns 200 { status }
*/
export async function GET(request: Request) {
  const usuario = await usuarioLogado()
  if (!usuario) {
    return NextResponse.json(
      { error: 'Não autenticado.' },
      { status: 401, headers: NO_CACHE_HEADERS }
    )
  }

  const url = new URL(request.url)
  const idPagamento = Number(url.searchParams.get('id'))

  if (!idPagamento || isNaN(idPagamento)) {
    return NextResponse.json(
      { error: 'Parâmetro id é obrigatório.' },
      { status: 400, headers: NO_CACHE_HEADERS }
    )
  }

  const resultado = await consultarStatusPagamento(idPagamento, usuario.idUsuario)

  if (resultado.erro) {
    return NextResponse.json(
      { error: resultado.erro, status: resultado.status },
      { status: 404, headers: NO_CACHE_HEADERS }
    )
  }

  return NextResponse.json(
    { status: resultado.status },
    { headers: NO_CACHE_HEADERS }
  )
}

