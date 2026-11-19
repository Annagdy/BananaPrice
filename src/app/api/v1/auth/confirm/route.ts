import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase.ts/server";

/**
 * Endpoint de confirmação de e-mail (GET /api/v1/auth/confirm).
 *
 * Recebe o código temporário enviado pelo Supabase Auth e o troca pela sessão ativa do usuário.
 *
 * @param request Requisição HTTP contendo o query parameter `code`.
 * @returns Redirecionamento para a página de perfil com o status da validação.
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