import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cria o cliente Supabase para Server Components, Route Handlers e Server Actions.
 *
 * Utiliza a chave anônima e sincroniza a sessão via cookies da requisição HTTP (respeitando as regras RLS).
 *
 * @returns Instância assíncrona do cliente Supabase para ambiente Server.
 */
export async function createClient() {
  const cookieStore = await cookies(); // Next 15+. No Next 14, remova o await

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // chamado de Server Component: pode ignorar
          }
        },
      },
    }
  );
}