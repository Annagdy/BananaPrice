import { supabase, chamarSupabase } from "../lib/supabase.ts/index.ts";
import { slugify, buscarInfoJogo } from "../lib/itad.ts/index.ts";
import { BUSCAR_GENERO } from "../lib/config.ts/index.ts";
import type { JogoApi } from "../types/jogo";

/**
 * Palavras no título/slug que indicam conteúdo adulto. O ITAD não marca todos os jogos adultos como `mature`,
 * então esta heurística complementa a classificação deles. Ajuste a lista conforme os falsos positivos que aparecerem.
 */
const PADRAO_TITULO_ADULTO =
    /\b(sex|sexy|sexual|hentai|porn|nsfw|erotic|nude|nudes|uncensored|lewd|milf|xxx)\b/i;

/** Tags de gênero (vindas do ITAD) que indicam conteúdo adulto. */
const PADRAO_TAGS_ADULTAS = /(hentai|nudity|sexual content|nsfw|erotic)/i;

/**
 * Heurística de conteúdo adulto por título, slug e tags de gênero.
 *
 * @param titulo Título do jogo.
 * @param slug Slug do jogo (os hífens são tratados como espaços).
 * @param genero Tags de gênero separadas por vírgula.
 * @returns Verdadeiro se algum dos sinais indicar conteúdo adulto.
 */
export function pareceConteudoAdulto(
    titulo: string | null | undefined,
    slug: string | null | undefined,
    genero: string | null | undefined
): boolean {
    const texto = `${titulo ?? ""} ${(slug ?? "").replace(/-/g, " ")}`;
    return PADRAO_TITULO_ADULTO.test(texto) || PADRAO_TAGS_ADULTAS.test(genero ?? "");
}

/**
 * Grava um lote de jogos na tabela `jogo` (upsert em massa, chave de conflito `itad_id`).
 *
 * Preenche `itad_id`, `titulo`, `slug` (com fallback via `slugify` quando a API não manda), `genero` e `adulto`.
 * Gênero e classificação adulta vêm da mesma chamada (`buscarInfoJogo`), feita só para jogos que ainda não têm
 * gênero salvo OU cuja classificação adulta ainda não foi verificada (`adulto` nulo), para não gastar requisições
 * à toa em reimportações.
 *
 * `adulto` nulo significa "ainda não verificado". O valor que já existe no banco nunca é sobrescrito por nulo.
 *
 * Além do campo `mature` do ITAD, aplica `pareceConteudoAdulto` (título, slug e tags) a TODOS os jogos do lote,
 * inclusive os já salvos, para reclassificar jogos adultos que o ITAD não marcou. A heurística só promove para
 * `true`; ela nunca remove uma marcação adulta que já existe.
 *
 * @param jogos Jogos crus vindos de `buscarPaginaJogos` (cada um com `id`, `title` e, às vezes, `slug`).
 * @returns Um mapa de `itad_id` -> `id_jogo` (o id gerado pelo Supabase), usado depois em `salvarPrecos` para resolver a
 * chave estrangeira de `preco_jogo`/`preco_historico`.
 */
export async function salvarJogos(
    jogos: JogoApi[]
): Promise<Map<string, number>> {

    const idsDoLote = jogos.map(jogo => jogo.id);

    // O .in() vai na URL da requisição. Com lotes grandes a URL fica enorme e o fetch falha, então a consulta é feita em pedaços de 100 ids.

    const generoExistente = new Map<string, string | null>();
    const adultoExistente = new Map<string, boolean | null>();

    const tamanhoConsulta = 100;

    for (let i = 0; i < idsDoLote.length; i += tamanhoConsulta) {

        const pedaco = idsDoLote.slice(i, i + tamanhoConsulta);

        const existentes = await chamarSupabase(
            "consultar gêneros e classificação já salvos",
            () => supabase
                .from("jogo")
                .select("itad_id, genero, adulto")
                .in("itad_id", pedaco)
        );

        for (const linha of existentes ?? []) {
            generoExistente.set(linha.itad_id, linha.genero);
            adultoExistente.set(linha.itad_id, linha.adulto);
        }
    }

    // Monta as linhas

    const linhas: Record<string, unknown>[] = [];

    for (const jogo of jogos) {

        const slug = jogo.slug ?? slugify(jogo.title ?? "");

        let genero = generoExistente.get(jogo.id) ?? null;
        let adulto = adultoExistente.get(jogo.id) ?? null;

        // Busca na API se falta o gênero ou se a classificação adulta ainda não foi verificada
        if (BUSCAR_GENERO && (!genero || adulto === null)) {

            const info = await buscarInfoJogo(jogo.id);

            genero = genero ?? info.genero;
            adulto = info.adulto ?? adulto;
        }

        // Complementa o `mature` do ITAD: título, slug e tags adultas promovem o jogo para adulto.
        // Só promove para true; nunca rebaixa um jogo que já está marcado como adulto.
        if (adulto !== true && pareceConteudoAdulto(jogo.title, slug, genero)) {
            adulto = true;
        }

        // `adulto` entra em TODAS as linhas: o supabase-js preenche com null as colunas que faltam em
        // algumas linhas do lote, o que apagaria o valor já gravado.
        linhas.push({
            itad_id: jogo.id,
            titulo: jogo.title,
            slug,
            genero,
            adulto
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