import { NextResponse } from 'next/server'
import { supabase as supabaseAdmin } from '@/lib/supabase.ts'
import { buscarOfertasJogo } from '@/lib/itad.ts'
import { atualizarPrecosDoJogo } from '@/services/atualizarPrecoJogo'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/*
GET /api/cron/sync-prices:
Percorre todos os jogos presentes nas listas de desejos dos usuários,
consulta as ofertas atuais na API da IsThereAnyDeal (ITAD) e atualiza o banco de dados.
Se o preço cair ou houver uma nova promoção, as notificações no site e por e-mail
são disparadas automaticamente pelo serviço atualizarPrecosDoJogo.

Segurança:
Se CRON_SECRET estiver definido no .env, exige o header "Authorization: Bearer <CRON_SECRET>"
ou o parâmetro de URL "?secret=<CRON_SECRET>".
*/
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    const url = new URL(request.url)
    const querySecret = url.searchParams.get('secret')

    if (authHeader !== `Bearer ${cronSecret}` && querySecret !== cronSecret) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }
  }

  try {
    // 1. Busca todos os jogos cadastrados nas listas de desejos
    const { data: itens, error } = await supabaseAdmin
      .from('lista_jogo')
      .select('id_jogo, jogo ( id_jogo, itad_id, titulo )')

    if (error) {
      console.error('[cron/sync-prices] Erro ao buscar lista_jogo:', error)
      return NextResponse.json({ error: 'Erro ao consultar banco.' }, { status: 500 })
    }

    // Deduplica os jogos (se 10 pessoas desejam o mesmo jogo, busca o preço apenas 1 vez)
    const mapaJogos = new Map<number, { id_jogo: number; itad_id: string; titulo: string }>()
    for (const item of itens ?? []) {
      const j: any = Array.isArray(item.jogo) ? item.jogo[0] : item.jogo
      if (j && j.id_jogo && j.itad_id) {
        mapaJogos.set(j.id_jogo, j)
      }
    }

    const jogosParaSincronizar = Array.from(mapaJogos.values())
    console.log(
      `[cron/sync-prices] Iniciando sincronização automática de ${jogosParaSincronizar.length} jogos da wishlist...`
    )

    let atualizados = 0
    let falhas = 0

    for (const jogo of jogosParaSincronizar) {
      try {
        const deals = await buscarOfertasJogo(jogo.itad_id)
        if (deals && deals.length > 0) {
          const gravou = await atualizarPrecosDoJogo(jogo.id_jogo, deals)
          if (gravou) atualizados++
        }
      } catch (err: any) {
        console.error(
          `[cron/sync-prices] Erro ao atualizar jogo ${jogo.id_jogo} (${jogo.titulo}):`,
          err?.message ?? err
        )
        falhas++
      }
    }

    console.log(`[cron/sync-prices] Concluído! Atualizados: ${atualizados}, Falhas: ${falhas}`)

    return NextResponse.json({
      ok: true,
      totalJogosDesejados: jogosParaSincronizar.length,
      atualizados,
      falhas,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('[cron/sync-prices] Erro fatal:', err?.message ?? err)
    return NextResponse.json(
      { error: err?.message ?? 'Erro interno na sincronização.' },
      { status: 500 }
    )
  }
}

