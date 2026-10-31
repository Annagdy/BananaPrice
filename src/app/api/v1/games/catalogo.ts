import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase.ts";
import { urlCapaItad } from "@/lib/itad.ts";
import { adultoPermitido } from "@/lib/adulto";

const LIMITE_PADRAO = 20;
const LIMITE_MAXIMO = 50;

/* Mínimo de letras para pesquisar (a busca por trigramas precisa de pelo menos 3). */
const MIN_BUSCA = 3;

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

/* Menor preço entre as ofertas de um jogo (ignora ofertas sem valor). */
function melhorOferta(precos: any[]): any | undefined {
  return precos
    .filter((p) => p.valor_atual != null)
    .sort((a, b) => a.valor_atual - b.valor_atual)[0];
}

/* Monta o jogo no formato que o front usa (mesmo para a listagem e para a pesquisa). */
function montarJogo(j: { id_jogo: number; itad_id: string | null; titulo: string; slug: string | null; genero: string | null }, melhor: any) {
  const atual = melhor ? Number(melhor.valor_atual) : null;
  const desconto = Number(melhor?.percentual_desconto ?? 0);

  return {
    id: j.id_jogo,
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
    capa: j.itad_id ? urlCapaItad(j.itad_id) : null,
  };
}

/*
RF06: catálogo de jogos com filtros e pesquisa por nome, lido do banco (alimentado pelo cron do ITAD).

A pesquisa (parâmetro "search", ou "busca" por compatibilidade) é feita pelo próprio Postgres, sem IA:
ignora acento e maiúsculas, perdoa erro de digitação (trigramas) e entende apelidos (tabela jogo_apelido).
Os filtros de preço, desconto e loja valem junto com a pesquisa.

@query search Nome do jogo (mínimo 3 letras).
@query price Preço máximo em R$.
@query discount Desconto mínimo em %.
@query store Nomes ou ids de lojas, separados por vírgula.
@query page, limit Paginação (padrão 20, máximo 50).
@returns { jogos, total, pagina, limite, aviso? }
*/
export async function listarCatalogo(request: Request) {
  const { searchParams } = new URL(request.url);

  const busca = (searchParams.get("search") ?? searchParams.get("busca") ?? "").trim().slice(0, 100);
  const precoMax = numeroOuNull(searchParams.get("price"));
  const descontoMin = numeroOuNull(searchParams.get("discount"));
  const pagina = Math.max(1, Math.floor(numeroOuNull(searchParams.get("page")) ?? 1));
  const limite = Math.min(
    LIMITE_MAXIMO,
    Math.max(1, Math.floor(numeroOuNull(searchParams.get("limit")) ?? LIMITE_PADRAO))
  );
  const de = (pagina - 1) * limite;

  const verAdulto = adultoPermitido(request);

  // resposta com conteúdo adulto nunca vai para cache compartilhado
  const cabecalhos: Record<string, string> = verAdulto
    ? { "Cache-Control": "private, no-store" }
    : { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600", Vary: "Cookie" };

  // lojas: aceita ids numéricos ou nomes, separados por vírgula
  const nomesLoja = (searchParams.get("store") ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean);

  let idsLoja: number[] = [];
  if (nomesLoja.length) {
    const { data: lojas } = await supabase.from("loja").select("id_loja, nome");
    idsLoja = (lojas ?? [])
      .filter((l) =>
        nomesLoja.some((n) =>
          /^\d+$/.test(n) ? Number(n) === l.id_loja : n.toLowerCase() === l.nome.toLowerCase()
        )
      )
      .map((l) => l.id_loja);

    if (idsLoja.length === 0) {
      return NextResponse.json({ jogos: [], total: 0, pagina, limite }, { headers: cabecalhos });
    }
  }

  // ---------------------------------------------------------------- PESQUISA POR NOME
  if (busca) {
    if (busca.length < MIN_BUSCA) {
      return NextResponse.json(
        { jogos: [], total: 0, pagina, limite, aviso: `Digite pelo menos ${MIN_BUSCA} letras.` },
        { headers: cabecalhos }
      );
    }

    const { data, error } = await supabase.rpc("buscar_jogos", {
      termo: busca,
      limite,
      deslocamento: de,
      permitir_adulto: verAdulto,
      preco_max: precoMax,
      desconto_min: descontoMin,
      lojas: idsLoja.length ? idsLoja : null,
    });

    if (error) {
      console.error("[games busca]:", error);
      return NextResponse.json({ error: "Não foi possível pesquisar os jogos." }, { status: 500 });
    }

    const linhas = (data ?? []) as any[];
    const total = Number(linhas[0]?.total ?? 0);

    // Pesquisa sem nenhum resultado (e sem filtros que expliquem): guarda o termo para a equipe criar um apelido
    if (total === 0 && pagina === 1 && precoMax === null && descontoMin === null && idsLoja.length === 0) {
      try {
        await supabase.rpc("registrar_busca_sem_resultado", { p_termo: busca });
      } catch {
        // o registro é só um apoio: nunca atrapalha a pesquisa
      }
    }

    // registra pesquisas sem resultado (sem filtros, para o zero não ser culpa deles): mostra que apelidos faltam
    if (
      total === 0 &&
      pagina === 1 &&
      precoMax === null &&
      descontoMin === null &&
      idsLoja.length === 0
    ) {
      await supabase.from("busca_sem_resultado").insert({ termo: busca });
    }
    const ids = linhas.map((l) => l.id_jogo);

    // ofertas dos jogos encontrados (com os mesmos filtros, para a "melhor oferta" respeitá-los)
    const ofertasPorJogo = new Map<number, any[]>();

    if (ids.length > 0) {
      let consultaPrecos = supabase
        .from("preco_jogo")
        .select("id_jogo, valor_atual, percentual_desconto, id_loja, loja ( nome )")
        .in("id_jogo", ids)
        .not("valor_atual", "is", null);

      if (precoMax !== null) consultaPrecos = consultaPrecos.lte("valor_atual", precoMax);
      if (descontoMin !== null) consultaPrecos = consultaPrecos.gte("percentual_desconto", descontoMin);
      if (idsLoja.length) consultaPrecos = consultaPrecos.in("id_loja", idsLoja);

      const { data: precos } = await consultaPrecos;

      for (const p of (precos ?? []) as any[]) {
        if (!ofertasPorJogo.has(p.id_jogo)) ofertasPorJogo.set(p.id_jogo, []);
        ofertasPorJogo.get(p.id_jogo)!.push(p);
      }
    }

    // mantém a ordem de relevância que o banco devolveu
    const jogos = linhas.map((j) => montarJogo(j, melhorOferta(ofertasPorJogo.get(j.id_jogo) ?? [])));

    return NextResponse.json({ jogos, total, pagina, limite }, { headers: cabecalhos });
  }

  // ---------------------------------------------------------------- LISTAGEM COM FILTROS
  // com filtro de preço/desconto/loja, só entram jogos que tenham uma oferta que atenda
  const filtrando = precoMax !== null || descontoMin !== null || idsLoja.length > 0;
  const embed = filtrando ? "preco_jogo!inner" : "preco_jogo";

  let consulta = supabase
    .from("jogo")
    .select(
      `id_jogo, itad_id, titulo, slug, genero, ${embed} ( valor_atual, percentual_desconto, id_loja, loja ( nome ) )`,
      { count: "exact" }
    );

  if (!verAdulto) consulta = consulta.or("adulto.is.null,adulto.eq.false");
  if (precoMax !== null) consulta = consulta.lte("preco_jogo.valor_atual", precoMax);
  if (descontoMin !== null) consulta = consulta.gte("preco_jogo.percentual_desconto", descontoMin);
  if (idsLoja.length) consulta = consulta.in("preco_jogo.id_loja", idsLoja);

  const { data, error, count } = await consulta.order("titulo").range(de, de + limite - 1);

  if (error) {
    console.error("[games catalogo]:", error);
    return NextResponse.json({ error: "Não foi possível buscar os jogos." }, { status: 500 });
  }

  const jogos = ((data ?? []) as unknown as any[]).map((j) => montarJogo(j, melhorOferta(j.preco_jogo ?? [])));

  return NextResponse.json({ jogos, total: count ?? 0, pagina, limite }, { headers: cabecalhos });
}