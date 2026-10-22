import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/*
Cria o cliente Supabase para Server Components, Route Handlers e Server Actions.

Usa a anon key e lê/grava a sessão do usuário nos cookies da requisição. É ele que identifica
QUEM está logado. Não ignora RLS (diferente do cliente com service_role de lib/supabase).

@returns Cliente Supabase vinculado aos cookies da requisição atual.
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