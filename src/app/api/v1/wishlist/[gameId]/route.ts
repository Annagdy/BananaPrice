import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase.ts/server";
import { supabase as supabaseAdmin } from "@/lib/supabase.ts";

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
  const idJogo = Number(gameId);
  if (!Number.isInteger(idJogo) || idJogo <= 0) {
    return NextResponse.json({ error: "gameId inválido." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: usuario } = await supabaseAdmin
    .from("usuario")
    .select("id_usuario")
    .eq("auth_id", user.id)
    .maybeSingle();
  if (!usuario) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const { data: lista } = await supabaseAdmin
    .from("lista_desejo")
    .select("id_lista")
    .eq("id_usuario", usuario.id_usuario)
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