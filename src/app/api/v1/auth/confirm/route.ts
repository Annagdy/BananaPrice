import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase.ts/server";

/*
GET /api/v1/auth/confirm: recebe o link de confirmação de e-mail enviado pelo Supabase.

Troca o "code" da URL por uma sessão.

@query code Código de confirmação.
@returns Redirecionamento para /conta?email=confirmado ou /conta?erro=confirmacao.
*/
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/conta?email=confirmado`);
  }
  return NextResponse.redirect(`${origin}/conta?erro=confirmacao`);
}