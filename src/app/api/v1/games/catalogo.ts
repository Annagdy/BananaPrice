import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase.ts";
import { urlCapaItad } from "@/lib/itad.ts";

const LIMITE_PADRAO = 20;
const LIMITE_MAXIMO = 50;

/* Converte um parâmetro da URL em número, ou null se vazio/inválido. */
function numeroOuNull(valor: string | null): number | null {
  if (valor === null || valor.trim() === "") return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

/* Normaliza o embed "loja ( nome )", que o Supabase pode devolver como objeto ou array. */
function nomeDaLoja(rel: any): string | null {
  return Array.isArray(rel) ? (rel[0]?.nome ?? null) : (rel?.nome ?? null);
}

/*
RF06: catálogo de jogos com filtros, lido do banco (alimentado pelo cron do ITAD).

@query search Trecho do título.
@query price Preço máximo em R$.
@query discount Desconto mínimo em %.
@query store Id ou nome da loja.
@query page, limit Paginação (padrão 20, máximo 50).
@returns { jogos, total, pagina, limite }
*/
export async function listarCatalogo(request: Request) {
  const { searchParams } = new URL(request.url);

  const busca = (searchParams.get("search") ?? "").trim().slice(0, 100);
  const precoMax = numeroOuNull(searchParams.get("price"));
  const descontoMin = numeroOuNull(searchParams.get("discount"));
  const pagina = Math.max(1, Math.floor(numeroOuNull(searchParams.get("page")) ?? 1));
  const limite = Math.min(
    LIMITE_MAXIMO,
    Math.max(1, Math.floor(numeroOuNull(searchParams.get("limit")) ?? LIMITE_PADRAO))
  );

  let idLoja: number | null = null;
  const lojaParam = (searchParams.get("store") ?? "").trim();
  if (lojaParam) {
    if (/^\d+$/.test(lojaParam)) {
      idLoja = Number(lojaParam);
    } else {
      const { data: loja } = await supabase
        .from("loja")
        .select("id_loja")
        .ilike("nome", lojaParam)
        .maybeSingle();
      if (!loja) return NextResponse.json({ jogos: [], total: 0, pagina, limite });
      idLoja = loja.id_loja;
    }
  }

  // com filtro de preço/desconto/loja, só entram jogos que tenham uma oferta que atenda
  const filtrando = precoMax !== null || descontoMin !== null || idLoja !== null;
  const embed = filtrando ? "preco_jogo!inner" : "preco_jogo";

  let consulta = supabase
    .from("jogo")
    .select(
      `id_jogo, titulo, slug, genero, ${embed} ( valor_atual, percentual_desconto, id_loja, loja ( nome ) )`,
      { count: "exact" }
    );

  if (busca) consulta = consulta.ilike("titulo", `%${busca.replace(/[\\%_]/g, "\\$&")}%`);
  if (precoMax !== null) consulta = consulta.lte("preco_jogo.valor_atual", precoMax);
  if (descontoMin !== null) consulta = consulta.gte("preco_jogo.percentual_desconto", descontoMin);
  if (idLoja !== null) consulta = consulta.eq("preco_jogo.id_loja", idLoja);

  const de = (pagina - 1) * limite;
  const { data, error, count } = await consulta.order("titulo").range(de, de + limite - 1);

  if (error) {
    console.error("[games catalogo]:", error);
    return NextResponse.json({ error: "Não foi possível buscar os jogos." }, { status: 500 });
  }

  const jogos = ((data ?? []) as unknown as any[]).map((j) => {
    const melhor = (j.preco_jogo ?? [])
      .filter((p: any) => p.valor_atual != null)
      .sort((a: any, b: any) => a.valor_atual - b.valor_atual)[0];

    const atual = melhor ? Number(melhor.valor_atual) : null;
    const desconto = Number(melhor?.percentual_desconto ?? 0);

    return {
      id: j.id_jogo,
      capa: urlCapaItad(j.itad_id, "banner300"),
      titulo: j.titulo,
      slug: j.slug,
      genero: j.genero,
      melhorPreco: atual,
      precoOriginal:
        atual !== null && desconto > 0 && desconto < 100
          ? Math.round((atual / (1 - desconto / 100)) * 100) / 100
          : atual,
      desconto,
      loja: nomeDaLoja(melhor?.loja),
    };
  });

  return NextResponse.json(
    { jogos, total: count ?? 0, pagina, limite },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
  );
}