import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase.ts";

const DIAS_PADRAO = 90;
const DIAS_MAXIMO = 3650;

/* Data (YYYY-MM-DD) no fuso de Brasília, a mesma usada ao gravar em preco_historico. */
function dataBrasil(ms: number): string {
  return new Date(ms).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

/* Normaliza o embed "loja ( nome )", que o Supabase pode devolver como objeto ou array. */
function nomeDaLoja(rel: any): string | null {
  return Array.isArray(rel) ? (rel[0]?.nome ?? null) : (rel?.nome ?? null);
}

type Ponto = { data: string; valor: number };

/*
GET /api/v1/games/[id]/history (RF09): histórico de preços para o gráfico, uma série por loja.

Cada ponto é um valor registrado (o histórico guarda um registro sempre que o preço muda). O último ponto de
cada série é o preço atual de preco_jogo, com a data de hoje, para o gráfico terminar no valor mais recente.
Cada série traz também um resumo { atual, menor, maior } calculado sobre o período pedido.
A resposta não fica em cache, para refletir o preço que acabou de ser atualizado.

@query dias Quantos dias para trás (padrão 90, máximo 3650).
@query store Id da loja, para ver só uma série (opcional).
@returns 200 { idJogo, dias, menorGeral, series: [{ idLoja, loja, pontos, resumo }] }; 400 id inválido; 500 erro no banco.
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

  const { searchParams } = new URL(request.url);
  const dias = Math.min(
    DIAS_MAXIMO,
    Math.max(1, Math.floor(Number(searchParams.get("dias")) || DIAS_PADRAO))
  );
  const idLoja = Number(searchParams.get("store"));
  const filtraLoja = Number.isInteger(idLoja) && idLoja > 0;

  const hoje = dataBrasil(Date.now());
  const desde = dataBrasil(Date.now() - dias * 24 * 60 * 60 * 1000);

  let consulta = supabase
    .from("preco_historico")
    .select("data, valor, id_loja, loja ( nome )")
    .eq("id_jogo", idJogo)
    .gte("data", desde)
    .order("data", { ascending: true })
    .order("id_historico", { ascending: true })
    .limit(5000);

  if (filtraLoja) consulta = consulta.eq("id_loja", idLoja);

  const { data, error } = await consulta;
  if (error) {
    console.error("[games/id/history GET]:", error);
    return NextResponse.json({ error: "Erro ao buscar o histórico." }, { status: 500 });
  }

  // agrupa por loja: uma linha do gráfico por loja
  const porLoja = new Map<number, { idLoja: number; loja: string | null; pontos: Ponto[] }>();

  for (const h of (data ?? []) as unknown as any[]) {
    if (h.valor == null) continue;
    if (!porLoja.has(h.id_loja)) {
      porLoja.set(h.id_loja, { idLoja: h.id_loja, loja: nomeDaLoja(h.loja), pontos: [] });
    }
    porLoja.get(h.id_loja)!.pontos.push({ data: h.data, valor: Number(h.valor) });
  }

  // Preço atual de cada loja: entra como ponto de hoje (se já não for o último ponto registrado)
  let consultaAtual = supabase
    .from("preco_jogo")
    .select("id_loja, valor_atual, loja ( nome )")
    .eq("id_jogo", idJogo)
    .not("valor_atual", "is", null);

  if (filtraLoja) consultaAtual = consultaAtual.eq("id_loja", idLoja);

  const { data: atuais } = await consultaAtual;

  for (const p of (atuais ?? []) as unknown as any[]) {
    if (!porLoja.has(p.id_loja)) {
      porLoja.set(p.id_loja, { idLoja: p.id_loja, loja: nomeDaLoja(p.loja), pontos: [] });
    }

    const serie = porLoja.get(p.id_loja)!;
    const valor = Number(p.valor_atual);
    const ultimo = serie.pontos[serie.pontos.length - 1];

    // não apaga nada do que foi registrado: só acrescenta o ponto de hoje quando ele ainda não existe igual
    if (!ultimo || ultimo.data !== hoje || ultimo.valor !== valor) {
      serie.pontos.push({ data: hoje, valor });
    }
  }

  // resumo por loja, sobre o período pedido
  const series = Array.from(porLoja.values()).map((s) => {
    let menor = s.pontos[0];
    let maior = s.pontos[0];

    for (const ponto of s.pontos) {
      if (ponto.valor < menor.valor) menor = ponto;
      if (ponto.valor > maior.valor) maior = ponto;
    }

    return {
      ...s,
      resumo: { atual: s.pontos[s.pontos.length - 1].valor, menor, maior },
    };
  });

  // menor valor entre todas as lojas (para a linha de referência do gráfico)
  const menorGeral = series.reduce<Ponto | null>(
    (menor, s) => (!menor || s.resumo.menor.valor < menor.valor ? s.resumo.menor : menor),
    null
  );

  return NextResponse.json(
    { idJogo, dias, menorGeral, series },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
