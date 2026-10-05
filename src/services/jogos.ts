import { supabase, chamarSupabase } from "../lib/supabase.ts/index.ts";
import { slugify, buscarGenero } from "../lib/itad.ts/index.ts";
import { BUSCAR_GENERO } from "../lib/config.ts/index.ts";
import type { JogoApi } from "../types/jogo";

/* Grava um lote de jogos na tabela `jogo` (upsert em massa, chave de conflito `itad_id`).
 
Preenche `itad_id`, `titulo`, `slug` (com fallback via `slugify` quando a API não manda) e `genero` (buscado via `buscarGenero` só
para jogos que ainda não têm gênero salvo, para não gastar requisições à toa em reimportações).

@param jogos Jogos crus vindos de `buscarPaginaJogos` (cada um com `id`, `title` e, às vezes, `slug`).
@returns Um mapa de `itad_id` -> `id_jogo` (o id gerado pelo Supabase), usado depois em `salvarPrecos` para resolver a
chave estrangeira de `preco_jogo`/`preco_historico`.

*/
export async function salvarJogos(
    jogos: JogoApi[]
): Promise<Map<string, number>> {

    const idsDoLote = jogos.map(jogo => jogo.id);

    // O .in() vai na URL da requisição. Com lotes grandes a URL fica enorme e o fetch falha, então a consulta é feita em pedaços de 100 ids.
    
    const generoExistente = new Map<string, string | null>();

    const tamanhoConsulta = 100;

    for (let i = 0; i < idsDoLote.length; i += tamanhoConsulta) {

        const pedaco = idsDoLote.slice(i, i + tamanhoConsulta);

        const existentes = await chamarSupabase(
            "consultar gêneros já salvos",
            () => supabase
                .from("jogo")
                .select("itad_id, genero")
                .in("itad_id", pedaco)
        );

        for (const linha of existentes ?? []) {
            generoExistente.set(linha.itad_id, linha.genero);
        }
    }

    // Monta as linhas

    const linhas = [];

    for (const jogo of jogos) {

        const slug = jogo.slug ?? slugify(jogo.title ?? "");

        let genero = generoExistente.get(jogo.id) ?? null;

        if (!genero && BUSCAR_GENERO) {
            genero = await buscarGenero(jogo.id);
        }

        linhas.push({
            itad_id: jogo.id,
            titulo: jogo.title,
            slug,
            genero
        });
    }

    // upsert troca o "INSERT ... ON DUPLICATE KEY UPDATE" do MySQL onConflict usa itad_id (não id_jogo, que é gerado pelo Supabase) .select() devolve as linhas gravadas, com o id_jogo já preenchido
    const data = await chamarSupabase(
        "salvar jogos",
        () => supabase
            .from("jogo")
            .upsert(linhas, { onConflict: "itad_id" })
            .select("id_jogo, itad_id")
    );

    const mapa = new Map<string, number>();

    for (const linha of data ?? []) {
        mapa.set(linha.itad_id, linha.id_jogo);
    }

    return mapa;
}
