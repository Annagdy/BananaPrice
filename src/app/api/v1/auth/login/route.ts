import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase.ts/server";
import { supabase as supabaseAdmin } from "@/lib/supabase.ts";

const ERRO_CREDENCIAIS = { error: "E-mail/usuário ou senha inválidos." };

/*
POST /api/v1/auth/login (RF03): login por e-mail OU nome de usuário.

Se "login" não tem "@", busca o e-mail do usuário na tabela "usuario". Grava os cookies de sessão.
Usa mensagem genérica para erro de credenciais, sem revelar se o usuário existe.

@body { login, senha }
@returns 200 { user }; 400 campos vazios; 401 credenciais inválidas.
*/
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const login = String(body?.login ?? "").trim().toLowerCase();
  const senha = String(body?.senha ?? "");

  if (!login || !senha) {
    return NextResponse.json({ error: "Informe e-mail (ou usuário) e senha." }, { status: 400 });
  }

  let email = login;

  if (!login.includes("@")) {
    const { data: usuario } = await supabaseAdmin
      .from("usuario")
      .select("email")
      .eq("nome_usuario", login)
      .maybeSingle();

    if (!usuario?.email) {
      return NextResponse.json(ERRO_CREDENCIAIS, { status: 401 });
    }
    email = usuario.email;
  }

  const supabase = await createClient(); // client com cookies
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    return NextResponse.json(ERRO_CREDENCIAIS, { status: 401 });
  }

  return NextResponse.json({ user: { id: data.user.id, email: data.user.email } });
}