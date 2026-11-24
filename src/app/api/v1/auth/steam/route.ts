import { NextResponse } from "next/server";
import { montarUrlLoginSteam } from "@/lib/steam.ts";

/**
 * Endpoint de início de autenticação via Steam OpenID 2.0 (GET /api/v1/auth/steam - RF04).
 * | Steam OpenID 2.0 authentication start endpoint (GET /api/v1/auth/steam - RF04).
 *
 * Constrói a URL do provedor oficial da Steam com o parâmetro `return_to` apontando para o callback da aplicação.
 * | Builds the official Steam provider URL with the `return_to` parameter pointing to the application callback.
 *
 * @param request Requisição HTTP original para resolução da URL base. | Original HTTP request used to resolve the base URL.
 * @returns Redirecionamento HTTP 307 para a tela de autenticação da Steam Community.
 *   | HTTP 307 redirect to the Steam Community authentication screen.
 */
export async function GET(request: Request) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  return NextResponse.redirect(montarUrlLoginSteam(site));
}