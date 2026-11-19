import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { esperar } from "../util.ts/index.ts";

/*
process.cwd() é a pasta de onde o comando é rodado, tanto rodando 'npx tsx scripts/atualizarBD.ts' quanto dentro do Next.js.

Dentro do Next, o .env e o .env.local já são carregados sozinhos e o dotenv não sobrescreve variáveis que já existem.
Em scripts (tsx), o Next não está rodando, então carregamos os dois aqui. O .env.local vem primeiro porque, no dotenv,
a primeira definição de uma variável é a que vale.
*/
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

/*
Aceita SUPABASE_URL (scripts) ou NEXT_PUBLIC_SUPABASE_URL (Next), para não precisar duplicar a variável no .env.
*/
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const chaveServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !chaveServiceRole) {
    throw new Error(
        "SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) ou SUPABASE_SERVICE_ROLE_KEY não foram encontradas. " +
        "Confira se o .env ou o .env.local está na raiz do projeto (" + process.cwd() + ") e se essas variáveis estão definidas nele."
    );
}

/**
 * Cliente Supabase com privilégios administrativos (chave `service_role`).
 * Utilizado exclusivamente em scripts e route handlers no servidor para operações que ignoram RLS.
 */
export const supabase = createClient(supabaseUrl, chaveServiceRole, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

/**
 * Executa uma chamada ao Supabase com até 5 tentativas e backoff exponencial em caso de falha transitória de rede.
 *
 * @param descricao Texto curto usado nos logs para identificar a chamada.
 * @param chamar Função que dispara a chamada e devolve `{ data, error }`.
 * @returns O resultado `data` quando bem-sucedido.
 * @throws O erro original caso as tentativas se esgotem ou ocorra falha no banco.
 */
export async function chamarSupabase<T>(
    descricao: string,
    chamar: () => PromiseLike<{ data: T; error: any }>
): Promise<T> {

    const tentativasMax = 5;

    for (let tentativa = 1; tentativa <= tentativasMax; tentativa++) {

        try {

            const { data, error } = await chamar();

            if (!error) {
                return data;
            }

            throw error;

        } catch (erro: any) {

            // Erros do banco trazem um "code" e não se resolvem tentando de novo. Só falhas de rede (sem code, ex: "fetch failed") valem retentativa.
            const erroDoBanco = Boolean(erro?.code);

            if (erroDoBanco || tentativa === tentativasMax) {
                throw erro;
            }

            const tempoEspera = Math.min(30000, 2000 * tentativa);

            console.log(
                `Erro em "${descricao}" (tentativa ${tentativa}/${tentativasMax}): ${erro?.message ?? JSON.stringify(erro)}`
            );

            console.log(
                `Tentando de novo em ${tempoEspera / 1000}s...`
            );

            await esperar(tempoEspera);
        }
    }

    // Inalcançável -- só pra satisfazer o TypeScript
    throw new Error("Falha inesperada em chamarSupabase");
}