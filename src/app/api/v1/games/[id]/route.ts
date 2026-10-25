import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase.ts";

function nomeDaLoja(rel: any): string | null {
  return Array.isArray(rel) ? (rel[0]?.nome ?? null) : (rel?.nome ?? null);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idJogo = Number(id);
  if (!Number.isInteger(idJogo) || idJogo <= 0) {
    return NextResponse.json({ error: "id inválido." }, { status: 400 });
  }

  const { data: jogo, error } = await supabase
    .from("jogo")
    .select("id_jogo, itad_id, titulo, slug, genero")
    .eq("id_jogo", idJogo)
    .maybeSingle();

  if (error) {
    console.error("[games/id GET] jogo:", error);
    return NextResponse.json({ error: "Erro ao buscar o jogo." }, { status: 500 });
  }
  if (!jogo) return NextResponse.json({ error: "Jogo não encontrado." }, { status: 404 });

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
    return {
      idLoja: p.id_loja,
      loja: nomeDaLoja(p.loja),
      preco: atual,
      precoOriginal:
        desconto > 0 && desconto < 100
          ? Math.round((atual / (1 - desconto / 100)) * 100) / 100
          : atual,
      desconto,
      atualizadoEm: p.atualizado_em,
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
      melhorOferta: ofertas[0] ?? null,
      ofertas,
      menorPrecoHistorico: minimo
        ? { valor: Number(minimo.valor), data: minimo.data, idLoja: minimo.id_loja }
        : null,
    },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
  );
}