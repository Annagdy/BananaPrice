import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase.ts/server";
import { supabase as supabaseAdmin } from "@/lib/supabase.ts";
import { validarLoginSteam, importarWishlistSteam } from "@/lib/steam.ts";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? origin;

  const falhou = (motivo: string, detalhe?: unknown) => {
    console.error("[steam callback] falhou em:", motivo, detalhe ?? "");
    return NextResponse.redirect(`${origin}/login?erro=steam`);
  };

  // 1) valida a resposta da Steam e extrai o SteamID64 (ESTAVA FALTANDO)
  const steamId = await validarLoginSteam(searchParams, site);
  if (!steamId) return falhou("validação OpenID", { site });

  // importa sem nunca derrubar o fluxo
  const importar = async (idUsuario: number) => {
    try {
      await importarWishlistSteam(idUsuario, steamId);
    } catch (e) {
      console.error("Falha ao importar wishlist da Steam:", e);
    }
  };

  const supabase = await createClient(); // client com cookies
  const { data: { user: logado } } = await supabase.auth.getUser();

  const { data: conta, error: erroBuscaConta } = await supabaseAdmin
    .from("conta_steam")
    .select("id_usuario")
    .eq("id_steam", steamId) // sempre como string: o int8 passa de 2^53
    .maybeSingle();
  if (erroBuscaConta) return falhou("buscar conta_steam", erroBuscaConta);

  // CASO 2: já está logado -> vincular a Steam a essa conta
  if (logado) {
    const { data: usuarioLogado } = await supabaseAdmin
      .from("usuario")
      .select("id_usuario")
      .eq("auth_id", logado.id)
      .maybeSingle();
    if (!usuarioLogado) return falhou("usuario do logado não encontrado");

    if (conta && conta.id_usuario !== usuarioLogado.id_usuario) {
      return NextResponse.redirect(`${origin}/conta?erro=steam_em_uso`);
    }
    if (!conta) {
      const { error } = await supabaseAdmin
        .from("conta_steam")
        .insert({ id_steam: steamId, id_usuario: usuarioLogado.id_usuario });
      if (error) return falhou("insert conta_steam (logado)", error);
    }

    await importar(usuarioLogado.id_usuario);
    return NextResponse.redirect(`${origin}/conta`);
  }

  // CASO 1 ou 3: não está logado
  let idUsuario: number | null = conta?.id_usuario ?? null;

  if (!idUsuario) {
    // CASO 3: Steam nova -> criar usuário (o trigger cria a linha em "usuario")
    const { data: criado, error: erroCriar } = await supabaseAdmin.auth.admin.createUser({
      email: `${steamId}@steam.local`,
      email_confirm: true,
      user_metadata: { provider: "steam", nome_usuario: `steam_${steamId}` },
    });
    if (erroCriar || !criado.user) return falhou("createUser", erroCriar);

    const { data: novo } = await supabaseAdmin
      .from("usuario")
      .select("id_usuario")
      .eq("auth_id", criado.user.id)
      .maybeSingle();

    const { error: erroConta } = novo
      ? await supabaseAdmin
          .from("conta_steam")
          .insert({ id_steam: steamId, id_usuario: novo.id_usuario })
      : { error: new Error("usuario não criado pelo trigger") };

    if (erroConta || !novo) {
      // não deixa usuário órfão (o cascade apaga a linha em "usuario")
      await supabaseAdmin.auth.admin.deleteUser(criado.user.id);
      return falhou("conta_steam/usuario", erroConta);
    }
    idUsuario = novo.id_usuario;
  }

  // abre a sessão usando o e-mail da conta dona dessa Steam
  const { data: usuario } = await supabaseAdmin
    .from("usuario")
    .select("email")
    .eq("id_usuario", idUsuario)
    .maybeSingle();
  if (!usuario?.email) return falhou("email do usuario não encontrado");

  const { data: link, error: erroLink } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: usuario.email,
  });
  if (erroLink || !link.properties?.hashed_token) return falhou("generateLink", erroLink);

  const { error: erroOtp } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
  });
  if (erroOtp) return falhou("verifyOtp", erroOtp);

  if (idUsuario === null) return falhou("idUsuario nulo");
  await importar(idUsuario);
  return NextResponse.redirect(`${origin}/conta`);
}