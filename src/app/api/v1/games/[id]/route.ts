import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase.ts";
import { buscarOfertasJogo, linksDasOfertas, buscarInfoBasica, urlCapaItad } from "@/lib/itad.ts";
import { adultoPermitido } from "@/lib/adulto";
import { atualizarPrecosDoJogo } from "@/services/atualizarPrecoJogo";
import { buscarDlcsDoJogo } from "@/services/dlcs";

const TTL_PRECO_MS = 30 * 60 * 1000;

function nomeDaLoja(rel: any): string | null {
  return Array.isArray(rel) ? (rel[0]?.nome ?? null) : (rel?.nome ?? null);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idJogo = Number(id);
  if (!Number.isInteger(idJogo) || idJogo <= 0) {
    return NextResponse.json({ error: "id inválido." }, { status: 400 });
  }

  const { data: jogo, error } = await supabase
    .from("jogo")
    .select("id_jogo, itad_id, titulo, slug, genero, adulto")
    .eq("id_jogo", idJogo)
    .maybeSingle();

  if (error) {
    console.error("[games/id GET] jogo:", error);
    return NextResponse.json({ error: "Erro ao buscar o jogo." }, { status: 500 });
  }
  if (!jogo) return NextResponse.json({ error: "Jogo não encontrado." }, { status: 404 });

  const liberaAdulto = adultoPermitido(request);
  if (jogo.adulto && !liberaAdulto) {
    return NextResponse.json({ error: "conteudo_adulto" }, { status: 403 });
  }

  // 1. Busca Info Básica
  const info = jogo.itad_id
    ? await buscarInfoBasica(jogo.itad_id)
    : { capa: null, appid: null };

  // 2. Busca Ofertas no ITAD / Fallback Steam
  const deals = jogo.itad_id
    ? await buscarOfertasJogo(jogo.itad_id, info.appid)
    : [];

  // Garante a capa via info.capa ou gerando diretamente do itad_id com a urlCapaItad
  const capa = info.capa ?? (jogo.itad_id ? urlCapaItad(jogo.itad_id) : null);
  const links = linksDasOfertas(deals);
  const dlcsPromise = buscarDlcsDoJogo(info.appid, liberaAdulto);

  // 3. Atualiza o banco de dados
  if (deals.length > 0) {
    const { data: recente } = await supabase
      .from("preco_jogo")
      .select("atualizado_em")
      .eq("id_jogo", idJogo)
      .order("atualizado_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    const ultima = recente?.atualizado_em ? new Date(recente.atualizado_em).getTime() : 0;
    const semRegistro = !recente;

    if (semRegistro || Date.now() - ultima > TTL_PRECO_MS) {
      await atualizarPrecosDoJogo(idJogo, deals);
    }
  }

  // 4. Consulta ofertas gravadas no Supabase
  const { data: precos } = await supabase
    .from("preco_jogo")
    .select("id_loja, valor_atual, percentual_desconto, atualizado_em, loja ( nome )")
    .eq("id_jogo", idJogo)
    .order("valor_atual", { ascending: true });

  const ofertas = ((precos ?? []) as unknown as any[]).map((p) => {
    const atual = Number(p.valor_atual);
    const desconto = Number(p.percentual_desconto ?? 0);
    const loja = nomeDaLoja(p.loja);
    return {
      idLoja: p.id_loja,
      loja,
      preco: atual,
      precoOriginal:
        desconto > 0 && desconto < 100
          ? Math.round((atual / (1 - desconto / 100)) * 100) / 100
          : atual,
      desconto,
      atualizadoEm: p.atualizado_em,
      url: links[(loja ?? "").toLowerCase()] ?? null,
    };
  });

  // Menor preço histórico
  const { data: minimo } = await supabase
    .from("preco_historico")
    .select("valor, data, id_loja")
    .eq("id_jogo", idJogo)
    .order("valor", { ascending: true })
    .limit(1)
    .maybeSingle();

  const dlcs = await dlcsPromise;

  return NextResponse.json(
    {
      jogo: {
        id: jogo.id_jogo,
        itadId: jogo.itad_id,
        titulo: jogo.titulo,
        slug: jogo.slug,
        genero: jogo.genero,
      },
      capa,
      melhorOferta: ofertas[0] ?? null,
      ofertas,
      menorPrecoHistorico: minimo
        ? { valor: Number(minimo.valor), data: minimo.data, idLoja: minimo.id_loja }
        : null,
      dlcs,
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}