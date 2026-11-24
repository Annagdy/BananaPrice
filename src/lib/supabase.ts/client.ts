import { createBrowserClient } from "@supabase/ssr";

/**
 * Cria o cliente Supabase para componentes "use client" (navegador).
 * | Creates the Supabase client for "use client" components (browser).
 *
 * Utiliza a chave pública anônima (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) e armazena a sessão nos cookies do navegador.
 * | Uses the public anonymous key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) and stores the session in the browser cookies.
 *
 * @returns Cliente Supabase configurado para execução no client-side. | Supabase client configured to run on the client side.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}