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

/*
Cliente Supabase autenticado com a service_role key.

Só para uso em scripts e códigos de servidor (route handlers, cron, services). Ela ignora RLS.
NUNCA importe este arquivo em componente "use client" nem no middleware.ts.

Não guarda nem renova sessão: é um cliente de "sistema", sem usuário logado. Isso também evita que o
supabase.auth.admin.* acumule estado entre requisições no servidor.
*/
export const supabase = createClient(supabaseUrl, chaveServiceRole, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

/*
Executa uma chamada ao Supabase com até 5 tentativas, em vez de derrubar a importação inteira na primeira falha.

Erros de rede passageiros são tentados de novo com espera crescente. Erros vindos do próprio banco não se resolvem
tentando de novo, então são lançados na hora.

@param descricao Texto curto usado só nos logs, para identificar qual chamada falhou.
@param chamar Função que dispara a chamada ao Supabase e devolve o '{ data, error }' padrão do supabase-js.
              Pode devolver direto o query builder (ex: () => supabase.from("games").select("id")).
@returns O 'data' da chamada, quando bem-sucedida.
@throws O erro original, depois de esgotar as tentativas, ou na hora, se for erro do banco.
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