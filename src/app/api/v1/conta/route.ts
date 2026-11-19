import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase.ts/server";
import { supabase as supabaseAdmin } from "@/lib/supabase.ts";

/**
 * Endpoint para obter os dados do perfil, preferências e vínculo Steam do usuário (GET /api/v1/conta).
 *
 * @returns JSON `{ id, nomeUsuario, email, notificarEmail, steamConectada, idSteam }` ou erro 401/404.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: atual } = await supabaseAdmin
    .from("usuario")
    .select("id_usuario, nome_usuario, email, notificar_email")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (!atual) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  // Consulta a tabela conta_steam usando o id_usuario encontrado (ex: 34)
  const { data: steamData } = await supabaseAdmin
    .from("conta_steam")
    .select("id_steam")
    .eq("id_usuario", atual.id_usuario)
    .maybeSingle();

  return NextResponse.json({
    id: atual.id_usuario,
    nomeUsuario: atual.nome_usuario,
    email: user.email ?? atual.email,
    notificarEmail: atual.notificar_email ?? true,
    steamConectada: !!steamData?.id_steam,
    idSteam: steamData?.id_steam ?? null,
  });
}

/**
 * Endpoint para atualizar dados e preferências da conta do usuário logado (PATCH /api/v1/conta).
 *
 * Suporta alteração de:
 * - `nomeUsuario`: Atualiza nome único e metadados.
 * - `email`: Dispara confirmação pelo Supabase Auth (rejeitando emails `@steam.local`).
 * - `senha`: Permite definir credenciais em contas criadas via Steam.
 * - `notificarEmail`: Liga ou desliga envio de alertas por e-mail.
 *
 * @param request Requisição HTTP com o payload parcial de atualização.
 * @returns Status 200 `{ ok, aviso }` ou erros de validação e conflito (400, 401, 404, 409).
 */
export async function PATCH(request: Request) {
  const { origin } = new URL(request.url);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? origin;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const nomeUsuario = String(body?.nomeUsuario ?? "").trim().toLowerCase();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const senha = String(body?.senha ?? "");
  const notificarEmail = typeof body?.notificarEmail === "boolean" ? body.notificarEmail : undefined;

  const { data: atual } = await supabaseAdmin
    .from("usuario")
    .select("id_usuario, nome_usuario")
    .eq("auth_id", user.id)
    .maybeSingle();
  if (!atual) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const avisos: string[] = [];

  // --- nome de usuário ---
  if (nomeUsuario && nomeUsuario !== atual.nome_usuario) {
    if (!/^[a-z0-9_.]{3,20}$/.test(nomeUsuario)) {
      return NextResponse.json(
        { error: "Usuário deve ter de 3 a 20 caracteres: letras, números, _ ou ." },
        { status: 400 }
      );
    }

    const { data: repetido } = await supabaseAdmin
      .from("usuario")
      .select("id_usuario")
      .eq("nome_usuario", nomeUsuario)
      .neq("id_usuario", atual.id_usuario)
      .maybeSingle();
    if (repetido) {
      return NextResponse.json({ error: "Esse nome de usuário já está em uso." }, { status: 409 });
    }

    const { error } = await supabaseAdmin
      .from("usuario")
      .update({ nome_usuario: nomeUsuario })
      .eq("id_usuario", atual.id_usuario);
    if (error) {
        console.error("[PATCH conta] updateUser:", error.code, error.message);
        return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    await supabase.auth.updateUser({ data: { nome_usuario: nomeUsuario } });
  }

  // --- e-mail (com confirmação no novo endereço) ---
  if (email && email !== user.email) {
    if (!/^\S+@\S+\.\S+$/.test(email) || email.endsWith("@steam.local")) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }

    const { error } = await supabase.auth.updateUser(
      { email },
      { emailRedirectTo: `${site}/api/v1/auth/confirm` }
    );
    if (error) {
        console.error("[PATCH conta] updateUser:", error.status, error.code, error.message);
        return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    avisos.push("Enviamos um link para confirmar o novo e-mail. Ele só vale depois do clique.");
  }

  // --- senha (opcional; necessária para entrar por e-mail sem usar a Steam) ---
  if (senha) {
    if (senha.length < 8) {
      return NextResponse.json({ error: "A senha precisa ter no mínimo 8 caracteres." }, { status: 400 });
    }
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    avisos.push("Senha definida.");
  }

  // --- preferência de e-mail de alerta ---
  if (notificarEmail !== undefined) {
    const { error } = await supabaseAdmin
      .from("usuario")
      .update({ notificar_email: notificarEmail })
      .eq("id_usuario", atual.id_usuario);
    if (error) {
      console.error("[PATCH conta] update notificar_email:", error);
    }
  }

  return NextResponse.json({ ok: true, aviso: avisos.join(" ") || "Dados salvos!" });
}