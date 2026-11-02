import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase.ts/server";
import { supabase as supabaseAdmin } from "@/lib/supabase.ts";

/*
GET /api/v1/conta: retorna os dados e preferências da conta logada.
@returns 200 { id, nomeUsuario, email, notificarEmail }; 401 não autenticado; 404 usuário não encontrado.
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

  return NextResponse.json({
    id: atual.id_usuario,
    nomeUsuario: atual.nome_usuario,
    email: user.email ?? atual.email,
    notificarEmail: atual.notificar_email ?? true,
  });
}

/*
PATCH /api/v1/conta: altera os dados da conta logada. Todos os campos são opcionais.

- nomeUsuario: valida formato e unicidade; atualiza "usuario" e o user_metadata.
- email: o Supabase envia um link de confirmação ao NOVO endereço; só vale depois do clique.
  Não aceita endereços @steam.local.
- senha: mínimo 8 caracteres. Permite entrar por e-mail em contas criadas pela Steam.
- notificarEmail: boolean com preferência de recebimento de e-mails de alerta.

@body { nomeUsuario?, email?, senha?, notificarEmail? }
@returns 200 { ok, aviso }; 400 dado inválido; 401 não autenticado; 404 usuário não encontrado;
         409 nome de usuário em uso.
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
