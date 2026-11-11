import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase.ts/server";
import { supabase as supabaseAdmin } from "@/lib/supabase.ts";
import { validarLoginSteam, importarWishlistSteam } from "@/lib/steam.ts";

/**
 * Callback de autenticação OpenID da Steam (GET /api/v1/auth/steam/callback - RF04, RF05).
 *
 * Processa a validação criptográfica da Steam e atende aos 3 cenários de autenticação:
 * 1. Steam já cadastrada: autentica diretamente na conta associada.
 * 2. Usuário logado: vincula a Steam à conta atual na tabela `conta_steam`.
 * 3. Novo usuário: cria a conta correspondente e sincroniza a lista de desejos (Wishlist).
 *
 * @param request Requisição HTTP com os parâmetros OpenID enviados pela Steam.
 * @returns Redirecionamento para a página inicial, página de completar cadastro ou erro.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? origin;

  const falhou = (motivo: string, detalhe?: unknown) => {
    console.error("[steam callback] falhou em:", motivo, detalhe ?? "");
    return NextResponse.redirect(new URL("/login?erro=steam", origin));
  };

  // 1) Valida a resposta da Steam e extrai o SteamID64
  const steamId = await validarLoginSteam(searchParams, site);
  if (!steamId) return falhou("validação OpenID", { site });

  // Importa a wishlist sem derrubar o fluxo em caso de falha
  const importar = async (idUsuario: number) => {
    try {
      await importarWishlistSteam(idUsuario, steamId);
    } catch (e) {
      console.error("Falha ao importar wishlist da Steam:", e);
    }
  };

  const supabase = await createClient();
  const { data: { user: logado } } = await supabase.auth.getUser();

  const { data: conta, error: erroBuscaConta } = await supabaseAdmin
    .from("conta_steam")
    .select("id_usuario")
    .eq("id_steam", steamId)
    .maybeSingle();

  if (erroBuscaConta) return falhou("buscar conta_steam", erroBuscaConta);

  // CASO 2: Já está logado -> vincular a Steam a essa conta
  if (logado) {
    const { data: usuarioLogado } = await supabaseAdmin
      .from("usuario")
      .select("id_usuario")
      .eq("auth_id", logado.id)
      .maybeSingle();

    if (!usuarioLogado) return falhou("usuario do logado não encontrado");

    if (conta && conta.id_usuario !== usuarioLogado.id_usuario) {
      return NextResponse.redirect(new URL("/conta?erro=steam_em_uso", origin));
    }

    if (!conta) {
      const { error } = await supabaseAdmin
        .from("conta_steam")
        .insert({ id_steam: steamId, id_usuario: usuarioLogado.id_usuario });

      if (error) return falhou("insert conta_steam (logado)", error);
    }

    await importar(usuarioLogado.id_usuario);
    return NextResponse.redirect(new URL("/conta", origin));
  }

  // CASO 1 ou 3: Não está logado
  let idUsuario: number | null = conta?.id_usuario ?? null;

  if (!idUsuario) {
    // CASO 3: Steam nova -> criar usuário (o trigger cria a linha em "usuario")
    const { data: criado, error: erroCriar } = await supabaseAdmin.auth.admin.createUser({
      email: `${steamId}@steam.local`,
      email_confirm: true,
      user_metadata: { 
        provider: "steam", 
        nome_usuario: `steam_${steamId}`,
        cadastro_completo: false 
      },
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
      await supabaseAdmin.auth.admin.deleteUser(criado.user.id);
      return falhou("conta_steam/usuario", erroConta);
    }

    idUsuario = novo.id_usuario;
  }

  // Abre a sessão usando o e-mail da conta vinculada a essa Steam
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

  // -------------------------------------------------------------------------
  // REDIRECIONAMENTO LIMPO COM NEXTRESPONSE:
  // -------------------------------------------------------------------------
  const { data: { user: usuarioSessao } } = await supabase.auth.getUser();

  const ehEmailFakeSteam = usuarioSessao?.email?.endsWith("@steam.local");
  const cadastroIncompleto = usuarioSessao?.user_metadata?.cadastro_completo !== true;

  if (ehEmailFakeSteam || cadastroIncompleto) {
    return NextResponse.redirect(new URL("/completar-cadastro", origin));
  }

  return NextResponse.redirect(new URL("/conta", origin));
}