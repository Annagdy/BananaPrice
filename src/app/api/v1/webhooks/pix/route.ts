import { NextResponse } from 'next/server'
import { processarWebhookPagamento } from '@/services/pagamentoTurbo'

export const dynamic = 'force-dynamic'

/**
 * Webhook assíncrono para notificações instantâneas de pagamento (IPN) do Mercado Pago (POST /api/v1/webhooks/pix).
 *
 * Suporta payloads nos formatos Webhook v2 e IPN tradicional. Atualiza a tabela `pagamento_turbo`
 * para status `aprovado` liberando o destaque turbo na vitrine do jogo.
 *
 * @param request Requisição HTTP enviada pelos servidores do Mercado Pago.
 * @returns HTTP 200 `{ recebido: true }` garantindo confirmação ao gateway.
 */
export async function POST(request: Request) {
  let idPagamentoMp: number | null = null

  try {
    const url = new URL(request.url)

    // Tenta extrair do body
    const body = await request.json().catch(() => null)

    if (body) {
      // Formato webhook v2
      if (body.action && body.data?.id) {
        if (body.type === 'payment' || body.action?.startsWith('payment.')) {
          idPagamentoMp = Number(body.data.id)
        }
      }
      // Formato IPN
      else if (body.topic === 'payment' && body.id) {
        idPagamentoMp = Number(body.id)
      }
    }

    // Fallback: query params
    if (!idPagamentoMp) {
      const topic = url.searchParams.get('topic') || url.searchParams.get('type')
      const id = url.searchParams.get('data.id') || url.searchParams.get('id')
      if ((topic === 'payment' || !topic) && id) {
        idPagamentoMp = Number(id)
      }
    }

    if (!idPagamentoMp || isNaN(idPagamentoMp)) {
      console.warn('[webhook/pix] Notificação ignorada — sem ID de pagamento válido:', body)
      // Retorna 200 para o MP não reenviar
      return NextResponse.json({ ok: true, ignored: true })
    }

    console.log(`[webhook/pix] Recebido: pagamento MP #${idPagamentoMp}`)

    const resultado = await processarWebhookPagamento(idPagamentoMp)

    if (!resultado.ok) {
      console.error('[webhook/pix] Falha ao processar:', resultado.erro)
    }

    // Sempre retorna 200 para o MP
    return NextResponse.json({ ok: true, status: resultado.status })
  } catch (err: any) {
    console.error('[webhook/pix] Erro inesperado:', err?.message ?? err)
    // Retorna 200 mesmo com erro para evitar retentativas infinitas do MP
    return NextResponse.json({ ok: true, error: 'handled' })
  }
}

