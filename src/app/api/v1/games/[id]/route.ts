import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase.ts";
import { buscarOfertasJogo, linksDasOfertas, buscarCapa } from "@/lib/itad.ts";
import { adultoPermitido } from "@/lib/adulto";
import { atualizarPrecosDoJogo } from "@/services/atualizarPrecoJogo";

/* Depois de quanto tempo o preço guardado no banco é considerado velho e refeito ao abrir o jogo. */
const TTL_PRECO_MS = 30 * 60 * 1000;

/* Normaliza o embed "loja ( nome )", que o Supabase pode devolver como objeto ou array. */
function nomeDaLoja(rel: any): string | null {
  return Array.isArray(rel) ? (rel[0]?.nome ?? null) : (rel?.nome ?? null);
}

/*
GET /api/v1/games/[id] (RF07, RF08): detalhe do jogo, comparação de preços e melhor oferta.

Ao abrir o jogo, se o preço no banco tem mais de 30 minutos (ou não existe), consulta o ITAD e grava os
preços novos em preco_jogo e preco_historico antes de responder. Se o ITAD falhar, responde com o que já
está no banco. O mesmo retorno do ITAD também fornece os links das lojas.

@returns 200 { jogo, capa, melhorOferta, ofertas, menorPrecoHistorico }; 400 id inválido;
         403 conteúdo adulto não liberado; 404 jogo não encontrado; 500 erro no banco.
*/
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

  // jogo adulto só é entregue a quem ativou essa preferência (cookie)
  if (jogo.adulto && !adultoPermitido(request)) {
    return NextResponse.json({ error: "conteudo_adulto" }, { status: 403 });
  }

  // ofertas do ITAD (uma chamada, com cache de 10 min) e capa, ao mesmo tempo
  const [deals, capa] = jogo.itad_id
    ? await Promise.all([buscarOfertasJogo(jogo.itad_id), buscarCapa(jogo.itad_id)])
    : [[] as any[], null as string | null];

  const links = linksDasOfertas(deals);

  // atualiza o banco se o preço guardado está velho (ou não existe)
  if (deals.length > 0) {
    const { data: recente } = await supabase
      .from("preco_jogo")
      .select("atualizado_em")
      .eq("id_jogo", idJogo)
      .order("atualizado_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    const ultima = recente?.atualizado_em ? new Date(recente.atualizado_em).getTime() : 0;

    if (Date.now() - ultima > TTL_PRECO_MS) {
      await atualizarPrecosDoJogo(idJogo, deals);
    }
  }

  // ofertas atuais em todas as lojas, da mais barata para a mais cara (comparação de preços)
  const { data: precos } = await supabase
    .from("preco_jogo")
    .select("id_loja, valor_atual, percentual_desconto, atualizado_em, loja ( nome )")
    .eq("id_jogo", idJogo)
    .not("valor_atual", "is", null)
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

  // menor preço já registrado
  const { data: minimo } = await supabase
    .from("preco_historico")
    .select("valor, data, id_loja")
    .eq("id_jogo", idJogo)
    .not("valor", "is", null)
    .order("valor", { ascending: true })
    .limit(1)
    .maybeSingle();

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
    },
    // a rota pode gravar no banco, então a resposta não fica em cache compartilhado
    { headers: { "Cache-Control": "private, no-store" } }
  );
}