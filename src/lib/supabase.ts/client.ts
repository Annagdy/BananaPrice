import { createBrowserClient } from "@supabase/ssr";

/**
 * Cria o cliente Supabase para componentes "use client" (navegador).
 *
 * Utiliza a chave pública anônima (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) e armazena a sessão nos cookies do navegador.
 *
 * @returns Cliente Supabase configurado para execução no client-side.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}