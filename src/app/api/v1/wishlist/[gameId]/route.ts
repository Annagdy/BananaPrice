import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase.ts/server.ts";
import { supabase as supabaseAdmin } from "@/lib/supabase.ts";

/**
 * Converte e valida o identificador do jogo vindo dos parâmetros de URL.
 * | Converts and validates the game identifier coming from the URL parameters.
 * @param gameId String com o id informado na URL. | String with the id given in the URL.
 * @returns Número inteiro positivo válido ou null. | Valid positive integer, or null.
 */
function lerIdJogo(gameId: string): number | null {
  const idJogo = Number(gameId);
  return Number.isInteger(idJogo) && idJogo > 0 ? idJogo : null;
}

/**
 * Consulta o id do usuário logado através da sessão dos cookies da requisição.
 * | Looks up the logged-in user's id through the session in the request cookies.
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
 * Verifica se um jogo específico está presente na lista de desejos do usuário (GET /api/v1/wishlist/[gameId]).
 * | Checks whether a specific game is on the user's wishlist (GET /api/v1/wishlist/[gameId]).
 *
 * Utilizado pelos componentes de botão de ação e coração da interface para refletir o estado instantaneamente.
 * | Used by the interface's action button and heart components to reflect the state instantly.
 *
 * @param _request Objeto de requisição. | Request object.
 * @param context Parâmetros da rota contendo `gameId`. | Route parameters containing `gameId`.
 * @returns JSON `{ naLista: boolean }` ou erro 400/401. | JSON `{ naLista: boolean }` or a 400/401 error.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const idJogo = lerIdJogo(gameId);
  if (idJogo === null) {
    return NextResponse.json({ error: "gameId inválido." }, { status: 400 });
  }

  const idUsuario = await usuarioLogado();
  if (idUsuario === null) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: lista } = await supabaseAdmin
    .from("lista_desejo")
    .select("id_lista")
    .eq("id_usuario", idUsuario)
    .maybeSingle();

  if (!lista) {
    return NextResponse.json({ naLista: false }, { headers: { "Cache-Control": "private, no-store" } });
  }

  const { data: item } = await supabaseAdmin
    .from("lista_jogo")
    .select("id_jogo")
    .eq("id_lista", lista.id_lista)
    .eq("id_jogo", idJogo)
    .maybeSingle();

  return NextResponse.json({ naLista: !!item }, { headers: { "Cache-Control": "private, no-store" } });
}

/**
 * Endpoint para remover um jogo específico da lista de desejos do usuário (DELETE /api/v1/wishlist/[gameId] - RF10).
 * | Endpoint to remove a specific game from the user's wishlist (DELETE /api/v1/wishlist/[gameId] - RF10).
 *
 * @param _request Objeto de requisição. | Request object.
 * @param context Parâmetros da rota contendo `gameId`. | Route parameters containing `gameId`.
 * @returns JSON `{ ok: true }` ou erro correspondente. | JSON `{ ok: true }` or the corresponding error.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const idJogo = lerIdJogo(gameId);
  if (idJogo === null) {
    return NextResponse.json({ error: "gameId inválido." }, { status: 400 });
  }

  const idUsuario = await usuarioLogado();
  if (idUsuario === null) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: lista } = await supabaseAdmin
    .from("lista_desejo")
    .select("id_lista")
    .eq("id_usuario", idUsuario)
    .maybeSingle();
  if (!lista) return NextResponse.json({ ok: true }); // nada a remover

  const { error } = await supabaseAdmin
    .from("lista_jogo")
    .delete()
    .eq("id_lista", lista.id_lista)
    .eq("id_jogo", idJogo);
  if (error) {
    console.error("[wishlist DELETE]:", error);
    return NextResponse.json({ error: "Não foi possível remover." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}