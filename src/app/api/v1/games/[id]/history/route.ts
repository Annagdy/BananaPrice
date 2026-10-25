import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase.ts";

const DIAS_PADRAO = 90;
const DIAS_MAXIMO = 3650;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idJogo = Number(id);
  if (!Number.isInteger(idJogo) || idJogo <= 0) {
    return NextResponse.json({ error: "id inválido." }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const dias = Math.min(
    DIAS_MAXIMO,
    Math.max(1, Math.floor(Number(searchParams.get("dias")) || DIAS_PADRAO))
  );
  const idLoja = Number(searchParams.get("store"));

  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  let consulta = supabase
    .from("preco_historico")
    .select("data, valor, id_loja, loja ( nome )")
    .eq("id_jogo", idJogo)
    .gte("data", desde)
    .order("data", { ascending: true })
    .limit(5000);

  if (Number.isInteger(idLoja) && idLoja > 0) consulta = consulta.eq("id_loja", idLoja);

  const { data, error } = await consulta;
  if (error) {
    console.error("[games/id/history GET]:", error);
    return NextResponse.json({ error: "Erro ao buscar o histórico." }, { status: 500 });
  }

  // agrupa por loja: uma linha do gráfico por loja
  const porLoja = new Map<number, { idLoja: number; loja: string | null; pontos: { data: string; valor: number }[] }>();

  for (const h of (data ?? []) as unknown as any[]) {
    if (h.valor == null) continue;
    if (!porLoja.has(h.id_loja)) {
      const rel = h.loja;
      porLoja.set(h.id_loja, {
        idLoja: h.id_loja,
        loja: Array.isArray(rel) ? (rel[0]?.nome ?? null) : (rel?.nome ?? null),
        pontos: [],
      });
    }
    porLoja.get(h.id_loja)!.pontos.push({ data: h.data, valor: Number(h.valor) });
  }

  return NextResponse.json(
    { idJogo, dias, series: Array.from(porLoja.values()) },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } }
  );
}