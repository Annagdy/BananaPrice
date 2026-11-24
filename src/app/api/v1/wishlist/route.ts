import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase.ts/server.ts";
import { supabase as supabaseAdmin } from "@/lib/supabase.ts";
import { urlCapaItad } from "@/lib/itad.ts";

/**
 * Obtém o `id_usuario` na tabela local correspondente ao usuário autenticado no Supabase Auth.
 * | Gets the `id_usuario` in the local table that corresponds to the user authenticated in Supabase Auth.
 * @returns Identificador numérico do usuário ou null se não autenticado. | Numeric user identifier, or null if not authenticated.
 */
async function usuarioLogado(): Promise<number | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabaseAdmin
    .from("usuario")
    .select("id_usuario")
    .eq("auth_id", user.id)
    .maybeSingle();

  return data?.id_usuario ?? null;
}

/**
 * Endpoint para listar todos os jogos da lista de desejos do usuário autenticado (GET /api/v1/wishlist - RF10).
 * | Endpoint to list all games on the authenticated user's wishlist (GET /api/v1/wishlist - RF10).
 *
 * Enriquece cada jogo com melhor preço vigente, percentual de desconto, loja da melhor oferta e URL de capa.
 * | Enriches each game with the current best price, discount percentage, store of the best offer and cover URL.
 *
 * @returns Resposta com a lista de jogos ou 401 para requisições não autenticadas.
 *   | Response with the list of games, or 401 for unauthenticated requests.
 */
export async function GET() {
  const idUsuario = await usuarioLogado();
  if (idUsuario === null) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: lista } = await supabaseAdmin
    .from("lista_desejo")
    .select("id_lista")
    .eq("id_usuario", idUsuario)
    .maybeSingle();
  if (!lista) return NextResponse.json({ jogos: [] });

  const { data: itens, error } = await supabaseAdmin
    .from("lista_jogo")
    .select("jogo ( id_jogo, itad_id, titulo, slug, genero )")
    .eq("id_lista", lista.id_lista);
  if (error) {
    console.error("[wishlist GET] lista_jogo:", error);
    return NextResponse.json({ error: "Não foi possível carregar a lista." }, { status: 500 });
  }

  const jogos = (itens ?? []).map((i: any) => i.jogo).filter(Boolean);

  const ids = jogos.map((j: any) => j.id_jogo);
  const { data: precos } = ids.length
    ? await supabaseAdmin
        .from("preco_jogo")
        .select("id_jogo, valor_atual, percentual_desconto, loja ( nome )")
        .in("id_jogo", ids)
    : { data: [] };

  const resultado = jogos.map((j: any) => {
    const melhor: any = (precos ?? [])
      .filter((p: any) => p.id_jogo === j.id_jogo && p.valor_atual != null)
      .sort((a: any, b: any) => a.valor_atual - b.valor_atual)[0];

    const atual: number | null = melhor?.valor_atual != null ? Number(melhor.valor_atual) : null;
    const desconto = Number(melhor?.percentual_desconto ?? 0);
    const original =
      atual !== null && desconto > 0 && desconto < 100
        ? Math.round((atual / (1 - desconto / 100)) * 100) / 100
        : atual;

    const lojaRel = melhor?.loja;
    const nomeLoja: string | null = Array.isArray(lojaRel)
      ? (lojaRel[0]?.nome ?? null)
      : (lojaRel?.nome ?? null);

    return {
      id: j.id_jogo,
      nome: j.titulo,
      capa: j.itad_id ? urlCapaItad(j.itad_id) : null,
      precoOriginal: original,
      precoComDesconto: atual,
      desconto,
      loja: nomeLoja,
      url: `/jogos/${j.id_jogo}`, // página interna do jogo (detalhe + comparação de preços)
    };
  });

  return NextResponse.json({ jogos: resultado });
}

/**
 * Endpoint para adicionar um jogo à lista de desejos (POST /api/v1/wishlist - RF10).
 * Cria a lista automaticamente caso ainda não exista e ignora duplicatas.
 * | Endpoint to add a game to the wishlist (POST /api/v1/wishlist - RF10). Automatically creates the list if it does not exist yet and
 *   ignores duplicates.
 *
 * @param request Requisição HTTP contendo `{ idJogo: number }` no corpo. | HTTP request containing `{ idJogo: number }` in the body.
 * @returns Status 201 em caso de sucesso ou erro apropriado (400, 401, 404, 500).
 *   | Status 201 on success or the appropriate error (400, 401, 404, 500).
 */
export async function POST(request: Request) {
  const idUsuario = await usuarioLogado();
  if (idUsuario === null) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const idJogo = Number(body?.idJogo);
  if (!Number.isInteger(idJogo) || idJogo <= 0) {
    return NextResponse.json({ error: "idJogo inválido." }, { status: 400 });
  }

  // o jogo precisa existir no catálogo
  const { data: jogo } = await supabaseAdmin
    .from("jogo")
    .select("id_jogo")
    .eq("id_jogo", idJogo)
    .maybeSingle();
  if (!jogo) {
    return NextResponse.json({ error: "Jogo não encontrado." }, { status: 404 });
  }

  // lista do usuário (cria se ainda não existir)
  let { data: lista } = await supabaseAdmin
    .from("lista_desejo")
    .select("id_lista")
    .eq("id_usuario", idUsuario)
    .maybeSingle();

  if (!lista) {
    const { data: nova, error } = await supabaseAdmin
      .from("lista_desejo")
      .insert({ id_usuario: idUsuario })
      .select("id_lista")
      .single();
    if (error || !nova) {
      console.error("[wishlist POST] criar lista:", error);
      return NextResponse.json({ error: "Não foi possível criar a lista." }, { status: 500 });
    }
    lista = nova;
  }

  const { error } = await supabaseAdmin
    .from("lista_jogo")
    .upsert(
      { id_lista: lista!.id_lista, id_jogo: idJogo },
      { onConflict: "id_lista,id_jogo", ignoreDuplicates: true }
    );
  if (error) {
    console.error("[wishlist POST] lista_jogo:", error);
    return NextResponse.json({ error: "Não foi possível adicionar." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}