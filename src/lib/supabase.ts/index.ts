import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { esperar } from "../util.ts";

/*
process.cwd() é a pasta de onde o comando é rodado, tanto rodando 'npx tsx scrips/atualizarBD.ts' quanto dentro do Next.js.
*/
dotenv.config({
    path: path.resolve(process.cwd(), ".env")
});

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
        "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não foram encontradas. " +
        "Confira se o .env está na raiz do projeto (" + process.cwd() +") e se essas duas variáveis estão definidas nele."
    );
}

/* Cliente Supabase autenticado com a service_role key.

Só para uso em scripts e códigos de servidor, ela ignora RLS.

*/
export const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/*Executa uma chamada ao Supabase com até 5 tentantivas, em vez de derrubar a importação inetira na primeira falha.

Erros de rede passageiros são tentados de novo com espera crescente. Erros vindos do próprio banco não se resolvem
tentando de novo, então são lançados na hora.

@param descricao Texto curto usado só nos logs, para identificar qual chamada falhou.
@param chamar Função que dispara a chamada ao Supabase e devolve o '{ data, erro }' padrão do supabase-js.
@returns O 'data' da chamada, quando bem-sucedida.
@throws O erro original, depois de esgotar as tentivas, ou na hora, se for erro do banco.

*/
export async function chamarSupabase<T>(
    descricao: string,
    chamar: () => Promise<{ data: T; error: any }>
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
                `Erro em "${descricao}" (tentativa ${tentativa}/` + `${tentativasMax}): ${erro.message ?? JSON.stringify(erro)}`
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