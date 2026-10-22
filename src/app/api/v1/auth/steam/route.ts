import { NextResponse } from "next/server";
import { montarUrlLoginSteam } from "@/lib/steam.ts";

/*
GET /api/v1/auth/steam (RF04): inicia o login com a Steam.

Redireciona o usuário para a página de login da Steam (OpenID 2.0), com return_to apontando
para /api/v1/auth/steam/callback.

@returns Redirecionamento 307 para a Steam.
*/
export async function GET(request: Request) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  return NextResponse.redirect(montarUrlLoginSteam(site));
}