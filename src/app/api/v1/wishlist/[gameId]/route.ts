import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase.ts/server.ts";
import { supabase as supabaseAdmin } from "@/lib/supabase.ts";

/* Valida o gameId da URL. Devolve o número, ou null se for inválido. */
function lerIdJogo(gameId: string): number | null {
  const idJogo = Number(gameId);
  return Number.isInteger(idJogo) && idJogo > 0 ? idJogo : null;
}

/* Descobre o id_usuario (tabela "usuario") de quem está logado. */
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

/*
GET /api/v1/wishlist/[gameId]: diz se o jogo está na lista de desejos do usuário logado.

Leve de propósito (não monta preços): serve para o coração da página do jogo abrir cheio ou vazio.

@returns 200 { naLista }; 400 gameId inválido; 401 não autenticado.
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

/*
DELETE /api/v1/wishlist/[gameId] (RF10): remove um jogo da wishlist do usuário logado.

Só apaga da lista do próprio usuário, então não afeta a lista de outras pessoas.

@param params.gameId id_jogo a remover (Promise, como exige o Next 15+).
@returns 200 { ok }; 400 gameId inválido; 401 não autenticado; 404 usuário não encontrado; 500 erro no banco.
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