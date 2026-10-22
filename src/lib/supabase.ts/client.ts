/*
Cria o cliente Supabase para componentes "use client" (navegador).

Usa a anon key e guarda a sessão nos cookies do navegador. Nunca importe aqui o cliente com service_role.

@returns Cliente Supabase para uso no navegador.
*/
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}