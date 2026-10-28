import { supabase as supabaseAdmin } from "../src/lib/supabase.ts";
import { buscarOfertasJogo } from "../src/lib/itad.ts";
import { atualizarPrecosDoJogo } from "../src/services/atualizarPrecoJogo";

/*
Script autônomo para sincronizar preços e disparar notificações/e-mails automaticamente.
Pode ser executado manualmente ou agendado no Agendador de Tarefas do Windows / Cron:
npx tsx scripts/syncPrecosWishlist.ts
*/
async function main() {
  console.log("[BananaPrice Sync] Iniciando sincronização automática dos jogos na Wishlist...");

  const { data: itens, error } = await supabaseAdmin
    .from("lista_jogo")
    .select("id_jogo, jogo ( id_jogo, itad_id, titulo )");

  if (error) {
    console.error("[BananaPrice Sync] Erro ao buscar jogos da wishlist:", error);
    process.exit(1);
  }

  const mapaJogos = new Map<number, { id_jogo: number; itad_id: string; titulo: string }>();
  for (const item of itens ?? []) {
    const j: any = Array.isArray(item.jogo) ? item.jogo[0] : item.jogo;
    if (j && j.id_jogo && j.itad_id) {
      mapaJogos.set(j.id_jogo, j);
    }
  }

  const jogos = Array.from(mapaJogos.values());
  console.log(`[BananaPrice Sync] Encontrados ${jogos.length} jogos únicos sendo monitorados.`);

  if (jogos.length === 0) {
    console.log("[BananaPrice Sync] Ninguém adicionou jogos à lista de desejos ainda.");
    return;
  }

  let atualizados = 0;

  for (const jogo of jogos) {
    console.log(`-> Consultando ofertas: "${jogo.titulo}" (ID ${jogo.id_jogo})...`);
    try {
      const deals = await buscarOfertasJogo(jogo.itad_id);
      if (deals && deals.length > 0) {
        const gravou = await atualizarPrecosDoJogo(jogo.id_jogo, deals);
        if (gravou) atualizados++;
      }
    } catch (err: any) {
      console.error(`Erro ao consultar "${jogo.titulo}":`, err?.message ?? err);
    }
  }

  console.log(`[BananaPrice Sync] Concluído! ${atualizados}/${jogos.length} jogos atualizados.`);
  console.log("[BananaPrice Sync] Se houve queda de preço ou desconto, notificações e e-mails foram disparados.");
}

main().catch(console.error);

