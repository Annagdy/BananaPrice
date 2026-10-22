import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase.ts/server";
import { supabase as supabaseAdmin } from "@/lib/supabase.ts";

/*
POST /api/v1/auth/register (RF02): cadastro por e-mail.

O trigger do banco cria a linha em "usuario" a partir do user_metadata.

@body { nomeUsuario, email, senha } nomeUsuario: 3 a 20 caracteres [a-z0-9_.]; senha: mínimo 6.
@returns 201 { user, needsEmailConfirmation }; 400 dados inválidos; 409 nome de usuário em uso.
*/
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  // minúsculo para a unicidade e o login por usuário serem previsíveis
  const nomeUsuario = String(body?.nomeUsuario ?? "").trim().toLowerCase();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const senha = String(body?.senha ?? "");

  if (!/^[a-z0-9_.]{3,20}$/.test(nomeUsuario)) {
    return NextResponse.json(
      { error: "Usuário deve ter de 3 a 20 caracteres: letras, números, _ ou ." },
      { status: 400 }
    );
  }
  if (!/^\S+@\S+\.\S+$/.test(email) || senha.length < 6) {
    return NextResponse.json(
      { error: "Informe um e-mail válido e senha com no mínimo 6 caracteres." },
      { status: 400 }
    );
  }

  
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome_usuario: nomeUsuario },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin}/api/v1/auth/confirm`,
    },
  });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  const { data: existente } = await supabaseAdmin
    .from("usuario")
    .select("id_usuario")
    .eq("nome_usuario", nomeUsuario)
    .maybeSingle();

  if (existente) {
    return NextResponse.json({ error: "Esse nome de usuário já está em uso." }, { status: 409 });
  }
  
  return NextResponse.json(
    {
      user: { id: data.user?.id, email: data.user?.email, nomeUsuario },
      needsEmailConfirmation: !data.session,
    },
    { status: 201 }
  );
}