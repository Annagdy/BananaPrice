import { supabase as supabaseAdmin } from '@/lib/supabase.ts'
import { paymentClient } from '@/lib/mercadopago'

export const VALOR_TURBO = 4.00
const EXPIRACAO_MINUTOS = 30

export type PagamentoTurboRow = {
  id_pagamento: number
  id_usuario: number
  id_jogo: number
  valor: number
  status: string
  id_pagamento_mp: number | null
  pix_copia_cola: string | null
  pix_qr_code_base64: string | null
  criado_em: string
  atualizado_em: string
  expira_em: string
}

export type CriarPagamentoResult = {
  ok: boolean
  erro?: string
  idPagamento?: number
  pixCopiaCola?: string
  qrCodeBase64?: string
  valor?: number
  expiraEm?: string
}

/**
 * Valida se a URL do site é pública e HTTPS.
 * Retorna undefined em localhost para não quebrar a API do Mercado Pago.
 */
function obterNotificationUrl(): string | undefined {
  const rawUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')

  if (!rawUrl || rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1')) {
    return undefined
  }

  const siteUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`
  return `${siteUrl}/api/v1/webhooks/pix`
}

/**
 * Cria um pagamento Pix via Mercado Pago e salva na tabela pagamento_turbo.
 */
export async function criarPagamentoPix(params: {
  idUsuario: number
  idJogo: number
  emailPagador?: string
}): Promise<CriarPagamentoResult> {
  const { idUsuario, idJogo, emailPagador } = params

  // Verifica se o jogo existe
  const { data: jogo } = await supabaseAdmin
    .from('jogo')
    .select('id_jogo, titulo')
    .eq('id_jogo', idJogo)
    .maybeSingle()

  if (!jogo) {
    return { ok: false, erro: `Jogo com id ${idJogo} não encontrado.` }
  }

  // Verifica se já existe pagamento aprovado para esse usuário+jogo
  const { data: jaAprovado } = await supabaseAdmin
    .from('pagamento_turbo')
    .select('id_pagamento')
    .eq('id_usuario', idUsuario)
    .eq('id_jogo', idJogo)
    .eq('status', 'aprovado')
    .maybeSingle()

  if (jaAprovado) {
    return { ok: false, erro: 'Você já possui Turbo ativo para este jogo.' }
  }

  // Verifica se existe pagamento pendente ainda válido
  const { data: pendente } = await supabaseAdmin
    .from('pagamento_turbo')
    .select('*')
    .eq('id_usuario', idUsuario)
    .eq('id_jogo', idJogo)
    .eq('status', 'pendente')
    .gte('expira_em', new Date().toISOString())
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (pendente && pendente.pix_copia_cola) {
    return {
      ok: true,
      idPagamento: pendente.id_pagamento,
      pixCopiaCola: pendente.pix_copia_cola,
      qrCodeBase64: pendente.pix_qr_code_base64 ?? undefined,
      valor: Number(pendente.valor),
      expiraEm: pendente.expira_em,
    }
  }

  // Cria pagamento no Mercado Pago
  const agora = new Date()
  const expiracao = new Date(agora.getTime() + EXPIRACAO_MINUTOS * 60 * 1000)
  const notificationUrl = obterNotificationUrl()

  let mpPayment: any
  try {
    mpPayment = await paymentClient.create({
      body: {
        transaction_amount: VALOR_TURBO,
        description: `BananaPrice Turbo - ${jogo.titulo}`,
        payment_method_id: 'pix',
        payer: {
          email: emailPagador || 'pagador@bananaprice.com',
        },
        date_of_expiration: expiracao.toISOString(),
        ...(notificationUrl && { notification_url: notificationUrl }),
      },
    })
  } catch (err: any) {
    console.error('[pagamentoTurbo] Erro ao criar pagamento no MP:', err?.message ?? err)
    return {
      ok: false,
      erro: `Erro ao comunicar com o Mercado Pago: ${err?.message ?? 'falha de rede'}`,
    }
  }

  const pixInfo = mpPayment?.point_of_interaction?.transaction_data
  const pixCopiaCola = pixInfo?.qr_code ?? null
  const qrCodeBase64 = pixInfo?.qr_code_base64
    ? `data:image/png;base64,${pixInfo.qr_code_base64}`
    : null

  if (!pixCopiaCola) {
    console.error('[pagamentoTurbo] MP não retornou dados Pix:', JSON.stringify(mpPayment, null, 2))
    return { ok: false, erro: 'Mercado Pago não retornou os dados do Pix. Tente novamente.' }
  }

  // Salva no banco
  const { data: registro, error: errInsert } = await supabaseAdmin
    .from('pagamento_turbo')
    .insert({
      id_usuario: idUsuario,
      id_jogo: idJogo,
      valor: VALOR_TURBO,
      status: 'pendente',
      id_pagamento_mp: mpPayment.id ? Number(mpPayment.id) : null,
      pix_copia_cola: pixCopiaCola,
      pix_qr_code_base64: qrCodeBase64,
      expira_em: expiracao.toISOString(),
    })
    .select('id_pagamento, expira_em')
    .single()

  if (errInsert || !registro) {
    console.error('[pagamentoTurbo] Erro ao salvar pagamento no banco:', errInsert)
    return { ok: false, erro: 'Erro ao salvar o pagamento no banco de dados.' }
  }

  return {
    ok: true,
    idPagamento: registro.id_pagamento,
    pixCopiaCola,
    qrCodeBase64: qrCodeBase64 ?? undefined,
    valor: VALOR_TURBO,
    expiraEm: registro.expira_em,
  }
}

/**
 * Consulta o status de um pagamento pelo ID interno (sincroniza com o MP se pendente).
 */
export async function consultarStatusPagamento(
  idPagamento: number,
  idUsuario: number
): Promise<{ status: string; erro?: string }> {
  const { data, error } = await supabaseAdmin
    .from('pagamento_turbo')
    .select('id_pagamento_mp, status, id_usuario, expira_em')
    .eq('id_pagamento', idPagamento)
    .maybeSingle()

  if (error || !data) {
    return { status: 'desconhecido', erro: 'Pagamento não encontrado.' }
  }

  if (data.id_usuario !== idUsuario) {
    return { status: 'desconhecido', erro: 'Pagamento não pertence a este usuário.' }
  }

  // Verifica se o pagamento expirou
  if (data.status === 'pendente' && data.expira_em && new Date(data.expira_em) < new Date()) {
    await supabaseAdmin
      .from('pagamento_turbo')
      .update({ status: 'expirado', atualizado_em: new Date().toISOString() })
      .eq('id_pagamento', idPagamento)
    return { status: 'expirado' }
  }

  // Se pendente, consulta no Mercado Pago para atualizar (essencial para ambiente local e polling)
  if (data.status === 'pendente' && data.id_pagamento_mp) {
    try {
      const mpPayment = await paymentClient.get({ id: data.id_pagamento_mp })
      const mpStatus = mpPayment?.status

      if (mpStatus && mpStatus !== 'pending') {
        const statusInterno = mapearStatusMp(mpStatus)
        await supabaseAdmin
          .from('pagamento_turbo')
          .update({
            status: statusInterno,
            atualizado_em: new Date().toISOString(),
          })
          .eq('id_pagamento', idPagamento)
        return { status: statusInterno }
      }
    } catch (err: any) {
      console.warn('[consultarStatusPagamento] Erro ao sincronizar com MP:', err?.message ?? err)
    }
  }

  return { status: data.status }
}

/**
 * Verifica se o usuário já tem Turbo ativo para um jogo.
 */
export async function verificarTurboAtivo(
  idUsuario: number,
  idJogo: number
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('pagamento_turbo')
    .select('id_pagamento')
    .eq('id_usuario', idUsuario)
    .eq('id_jogo', idJogo)
    .eq('status', 'aprovado')
    .maybeSingle()

  return !!data
}

/**
 * Processa notificação do webhook do Mercado Pago.
 * Consulta o pagamento diretamente na API do MP para confirmar o status real.
 */
export async function processarWebhookPagamento(
  idPagamentoMp: number
): Promise<{ ok: boolean; status?: string; erro?: string }> {
  let mpPayment: any
  try {
    mpPayment = await paymentClient.get({ id: idPagamentoMp })
  } catch (err: any) {
    console.error('[webhook] Erro ao consultar pagamento no MP:', err?.message ?? err)
    return { ok: false, erro: `Erro ao consultar MP: ${err?.message}` }
  }

  const mpStatus = mpPayment?.status
  const statusInterno = mapearStatusMp(mpStatus)

  const { error } = await supabaseAdmin
    .from('pagamento_turbo')
    .update({
      status: statusInterno,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id_pagamento_mp', idPagamentoMp)

  if (error) {
    console.error('[webhook] Erro ao atualizar pagamento no banco:', error)
    return { ok: false, erro: 'Erro ao atualizar status no banco.' }
  }

  console.log(`[webhook] Pagamento MP #${idPagamentoMp} → status: ${statusInterno}`)
  return { ok: true, status: statusInterno }
}

function mapearStatusMp(mpStatus: string | undefined): string {
  switch (mpStatus) {
    case 'approved':
      return 'aprovado'
    case 'pending':
    case 'in_process':
    case 'authorized':
      return 'pendente'
    case 'rejected':
      return 'rejeitado'
    case 'cancelled':
    case 'refunded':
    case 'charged_back':
      return 'cancelado'
    default:
      return 'pendente'
  }
}