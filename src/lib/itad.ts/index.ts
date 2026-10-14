import axios from "axios";
import { esperar } from "../util.ts";

/* Gera um slug (formato "meu-jogo") a partir de um título.

Usado como fallback quando a API não manda/possui slog para tal jogo.

@param texto Texto de origem (normalmente o título do jogo).
@returns O texto em minúsculas, sem acentos, com espaços e pontuação trocados por hífens.

*/
export function slugify(texto: string){

    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/* Busca uma página de catálogo de jogos na API do ITAD ('/unstable/games/list/v1').

A API devolve no máximo 10.000 jogos por chamada. Para pegar a próxima página, é passado
o 'id' do último jogo recebido em 'ultimoId'.

@param ultimoId Id (itad_id) do último jogo da página anterior.
@returns Um array de jogos crus da API, cada um com pelo menos 'id' e 'title' (e 'slug', quando a API manda).

*/
export async function buscarPaginaJogos(ultimoId?: string){
    
    console.log("Buscando jogos...");

    const response = await axios.get(
        "https://api.isthereanydeal.com/unstable/games/list/v1",
        {
            params: {
                key: process.env.ITAD_API_KEY,
                ...(ultimoId && { last: ultimoId })
            }
        }
    );

    return response.data;
}

/* Busca o gênero de um jogo na API ('/games/info/v2'), que responde um jogo por vez.

Em caso de limite de requisições, espera e tenta de novo. Em qualquer outro erro, desiste só desse jogo e
devolve 'null', para um jogo problemático não travar o resto da importação.

@param itadId Id do jogo na API (itad_id).
@returns As tags/gêneros unidos por ", ", ou 'null' se a API não tiver tags para esse jogo ou a busca falhar.

*/
export async function buscarGenero(itadId: string): Promise<string | null> {

    while(true) {
        try {
            const response = await axios.get(
                "https://api.isthereanydeal.com/games/info/v2",
                {
                    params: {
                        id: itadId,
                        key: process.env.ITAD_API_KEY
                    }
                }
            );

            const tags: string[] = response.data?.tags ?? [];

            return tags.length > 0 ? tags.join(", ") : null;
        } catch (erro: any) {
            
            const status = erro.response?.status;

            if (status === 429) {

                const retryAfter = erro.response?.headers?.["retry-after"];
                let tempoEspera = 5 * 60 * 1000;

                if (retryAfter) {

                    const segundos = Number(retryAfter);

                    if (!isNaN(segundos)) {
                        tempoEspera = (segundos + 5) * 1000;
                    }
                }

                console.log(
                    'Limite atingido buscando gênero de ${itadId}, ' + 'aguardando ${Math.ceil(tempoEspera / 1000)}s...'
                );

                await esperar(tempoEspera);

                continue;
            }

            console.log(
                'Não foi possível buscar gênero de ${itadId}:', erro.response?.data ?? erro.message
            );

            return null;
        }
    }
}

/* Busca os preços atuais de um lote de jogos na API ('/games/prices/v3'), POST com até 200 ids por vez.

Em caso de limite de requisições, espera o tempo indicado pela API e tenta o mesmo lote de novo. QUalquer
outro erro é logado e relançado, encerrando a importação.

@param ids Ids (itad_id) dos jogos deste lote
@param inicio Posição do primeiro jogo do lote dentro da página.
@param fim Posição do último jogo do lote dentro da página.
@returns Um array com '{ id, historyLow, deals }' por jogo, onde 'deals é a lista de ofertas por loja.

*/
export async function buscarPrecosLote(
    ids: string[],
    inicio: number,
    fim: number
) {
    
    while (true) {

        try {
            console.log(
                'Consultando preços: jogos ${inicio} até ${fim}'
            );

            const response = await axios.post(
                "https://api.isthereanydeal.com/games/prices/v3",
                ids,
                {
                    params: {
                        key: process.env.ITAD_API_KEY,
                        country: "BR"
                    }
                }
            );

            return response.data;
        } catch (erro: any) {
            
            const status = erro.response?.status;

            // Limite de requisições

            if (status === 429) {

                const retryAfter = erro.response?.headers?.["retry-after"];
                let tempoEspera = 5 * 60 * 1000;
            
                if (retryAfter) {
                    
                    const segundos = Number(retryAfter);

                    if (!isNaN(segundos)) {
                        tempoEspera = (segundos + 5) * 1000;
                    }
                }

                console.log('Limite da API atingido');

                console.log(
                    'Aguardando ${Math.ceil(tempoEspera / 1000)} segundos...'
                );

                await esperar(tempoEspera);

                console.log(
                    'Tentando novamente o lote ${inicio}-${fim}...'
                );

                continue;
            }

            // Outro erro

            console.log('Erro na API de preços');

            console.log(
                erro.response?.data ?? erro.message
            );

            throw erro;
        }
    }
}