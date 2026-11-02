import axios from "axios";
import { esperar } from "../util.ts/index.ts";

const URL_API_ITAD = "https://api.isthereanydeal.com";

/* ID da loja Steam dentro do ITAD, usado no lookup de appid -> itad_id. */
const ID_LOJA_STEAM_ITAD = 61;

/*
Lê a ITAD_API_KEY na hora do uso, e não na importação, para o build do Next não quebrar se ela não estiver definida.
*/
function obterChaveItad(): string {

    const chave = process.env.ITAD_API_KEY;

    if (!chave) {
        throw new Error("ITAD_API_KEY não foi encontrada. Defina no .env da raiz do projeto.");
    }

    return chave;
}

/* Calcula quanto esperar depois de um erro 429 (limite de requisições).

Usa o header 'retry-after' quando a API manda; sem ele, espera 5 minutos.

@param erro Erro do axios.
@returns Tempo de espera em milissegundos.

*/
function calcularEspera429(erro: any): number {

    const retryAfter = erro.response?.headers?.["retry-after"];

    if (retryAfter) {

        const segundos = Number(retryAfter);

        if (!isNaN(segundos)) {
            return (segundos + 5) * 1000;
        }
    }

    return 5 * 60 * 1000;
}

/* Gera um slug (formato "meu-jogo") a partir de um título.

Usado como fallback quando a API não manda/possui slug para tal jogo.

@param texto Texto de origem (normalmente o título do jogo).
@returns O texto em minúsculas, sem acentos, com espaços e pontuação trocados por hífens.

*/
export function slugify(texto: string) {

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
export async function buscarPaginaJogos(ultimoId?: string) {

    console.log("Buscando jogos...");

    const response = await axios.get(
        `${URL_API_ITAD}/unstable/games/list/v1`,
        {
            params: {
                key: obterChaveItad(),
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

    while (true) {

        try {

            const response = await axios.get(
                `${URL_API_ITAD}/games/info/v2`,
                {
                    params: {
                        id: itadId,
                        key: obterChaveItad()
                    }
                }
            );

            const tags: string[] = response.data?.tags ?? [];

            return tags.length > 0 ? tags.join(", ") : null;

        } catch (erro: any) {

            if (erro.response?.status === 429) {

                const tempoEspera = calcularEspera429(erro);

                console.log(
                    `Limite atingido buscando gênero de ${itadId}, aguardando ${Math.ceil(tempoEspera / 1000)}s...`
                );

                await esperar(tempoEspera);

                continue;
            }

            console.log(
                `Não foi possível buscar gênero de ${itadId}:`, erro.response?.data ?? erro.message
            );

            return null;
        }
    }
}

/* Busca gênero e classificação adulta de um jogo na API ('/games/info/v2', campos 'tags' e 'mature').

Mesma lógica de retentativa de buscarGenero. Em erro que não seja 429, devolve nulos
(adulto nulo significa "não sei": o cron não deve sobrescrever o valor que já existe).

@param itadId Id do jogo no ITAD (jogo.itad_id).
@returns { genero, adulto }
*/
export async function buscarInfoJogo(itadId: string): Promise<{ genero: string | null; adulto: boolean | null }> {

    while (true) {

        try {

            const response = await axios.get(
                `${URL_API_ITAD}/games/info/v2`,
                { params: { id: itadId, key: obterChaveItad() } }
            );

            const tags: string[] = response.data?.tags ?? [];

            return {
                genero: tags.length > 0 ? tags.join(", ") : null,
                adulto: response.data?.mature === true
            };

        } catch (erro: any) {

            if (erro.response?.status === 429) {

                const tempoEspera = calcularEspera429(erro);

                console.log(`Limite atingido buscando info de ${itadId}, aguardando ${Math.ceil(tempoEspera / 1000)}s...`);

                await esperar(tempoEspera);

                continue;
            }

            console.log(`Não foi possível buscar info de ${itadId}:`, erro.response?.data ?? erro.message);

            return { genero: null, adulto: null };
        }
    }
}

/* Busca os preços atuais de um lote de jogos na API ('/games/prices/v3'), POST com até 200 ids por vez.

Em caso de limite de requisições, espera o tempo indicado pela API e tenta o mesmo lote de novo. Qualquer
outro erro é logado e relançado, encerrando a importação.

@param ids Ids (itad_id) dos jogos deste lote.
@param inicio Posição do primeiro jogo do lote dentro da página.
@param fim Posição do último jogo do lote dentro da página.
@returns Um array com '{ id, historyLow, deals }' por jogo, onde 'deals' é a lista de ofertas por loja.

*/
export async function buscarPrecosLote(
    ids: string[],
    inicio: number,
    fim: number
) {

    while (true) {

        try {

            console.log(`Consultando preços: jogos ${inicio} até ${fim}`);

            const response = await axios.post(
                `${URL_API_ITAD}/games/prices/v3`,
                ids,
                {
                    params: {
                        key: obterChaveItad(),
                        country: "BR"
                    }
                }
            );

            return response.data;

        } catch (erro: any) {

            // Limite de requisições
            if (erro.response?.status === 429) {

                const tempoEspera = calcularEspera429(erro);

                console.log("Limite da API atingido");
                console.log(`Aguardando ${Math.ceil(tempoEspera / 1000)} segundos...`);

                await esperar(tempoEspera);

                console.log(`Tentando novamente o lote ${inicio}-${fim}...`);

                continue;
            }

            // Outro erro
            console.log("Erro na API de preços");
            console.log(erro.response?.data ?? erro.message);

            throw erro;
        }
    }
}

/* Converte appids da Steam em ids do ITAD (jogo.itad_id), usado na importação da wishlist (RF05).

Usa o lookup por loja ('/lookup/id/shop/61/v1', POST com até 200 ids por vez). Cada appid é enviado
no formato "app/<appid>" e a API responde um objeto { "app/730": "<itad_id>" | null }.

Diferente das outras funções, aqui NÃO espera em caso de 429: esta função roda dentro do login do usuário, e
esperar minutos deixaria a requisição pendurada. Se o limite for atingido, devolve o que já conseguiu.

@param appIds Lista de appids da Steam.
@returns Lista de itad_id dos jogos que o ITAD reconheceu (appids desconhecidos são ignorados).

*/
export async function buscarItadIdsPorSteamAppIds(appIds: number[]): Promise<string[]> {

    const resultado: string[] = [];
    const tamanhoLote = 200;

    for (let i = 0; i < appIds.length; i += tamanhoLote) {

        const lote = appIds.slice(i, i + tamanhoLote).map((appId) => `app/${appId}`);

        try {

            const response = await axios.post(
                `${URL_API_ITAD}/lookup/id/shop/${ID_LOJA_STEAM_ITAD}/v1`,
                lote,
                { params: { key: obterChaveItad() } }
            );

            const mapa: Record<string, string | null> = response.data ?? {};

            for (const itadId of Object.values(mapa)) {

                if (itadId) {
                    resultado.push(itadId);
                }
            }

        } catch (erro: any) {

            console.log(
                "Não foi possível converter appids da Steam em itad_id:", erro.response?.data ?? erro.message
            );

            // 429: devolve o que já tem, em vez de travar o login
            if (erro.response?.status === 429) {
                break;
            }
        }
    }

    return resultado;
}

/* Cache em memória das ofertas por jogo, para não consultar o ITAD a cada visita. */
const cacheOfertas = new Map<string, { expira: number; deals: any[] }>();
const TTL_OFERTAS_MS = 10 * 60 * 1000;

/* Busca as ofertas atuais de um jogo no ITAD ('/games/prices/v3').

Roda dentro da requisição do usuário, então não espera em caso de 429: em qualquer falha devolve []
e a página segue com o que já está no banco.

@param itadId Id do jogo no ITAD (jogo.itad_id).
@returns A lista 'deals' crua (cada uma com shop, price, cut, url...).
*/
export async function buscarOfertasJogo(itadId: string): Promise<any[]> {

    const emCache = cacheOfertas.get(itadId);

    if (emCache && emCache.expira > Date.now()) {
        return emCache.deals;
    }

    try {

        const response = await axios.post(
            `${URL_API_ITAD}/games/prices/v3`,
            [itadId],
            {
                params: { key: obterChaveItad(), country: "BR" },
                timeout: 5000
            }
        );

        const deals: any[] = response.data?.[0]?.deals ?? [];

        cacheOfertas.set(itadId, { expira: Date.now() + TTL_OFERTAS_MS, deals });

        return deals;

    } catch (erro: any) {

        console.log("Não foi possível buscar as ofertas:", erro.response?.data ?? erro.message);

        return [];
    }
}

/* Extrai { "nome da loja em minúsculas": "https://link" } das ofertas. Só aceita links https,
para nunca expor outro tipo de link ao usuário.

@param deals Ofertas cruas devolvidas por buscarOfertasJogo.
@returns Objeto nome da loja -> link.
*/
export function linksDasOfertas(deals: any[]): Record<string, string> {

    const links: Record<string, string> = {};

    for (const deal of deals) {

        const loja = String(deal?.shop?.name ?? "").toLowerCase();
        const url = String(deal?.url ?? "");

        if (loja && url.startsWith("https://")) {
            links[loja] = url;
        }
    }

    return links;
}

/* Mantida por compatibilidade: links das lojas de um jogo.

@param itadId Id do jogo no ITAD (jogo.itad_id).
@returns Objeto nome da loja em minúsculas -> link.
*/
export async function buscarLinksOfertas(itadId: string): Promise<Record<string, string>> {

    return linksDasOfertas(await buscarOfertasJogo(itadId));
}

/* Cache em memória das capas, para não consultar o ITAD a cada visita. */
const cacheCapas = new Map<string, { expira: number; capa: string | null }>();
const TTL_CAPAS_MS = 24 * 60 * 60 * 1000;

/* Busca a URL da capa de um jogo no ITAD ('/games/info/v2', campo 'assets').

Roda dentro da requisição do usuário, então não espera em caso de 429: em qualquer falha devolve null
e a página usa a imagem de exemplo.

@param itadId Id do jogo no ITAD (jogo.itad_id).
@returns URL https da capa (banner600, com reserva nos menores e na boxart), ou null se não houver.
*/
export async function buscarCapa(itadId: string): Promise<string | null> {

    const emCache = cacheCapas.get(itadId);

    if (emCache && emCache.expira > Date.now()) {
        return emCache.capa;
    }

    try {

        const response = await axios.get(
            `${URL_API_ITAD}/games/info/v2`,
            {
                params: { id: itadId, key: obterChaveItad() },
                timeout: 5000
            }
        );

        const assets = response.data?.assets ?? {};
        const url = assets.banner600 ?? assets.banner400 ?? assets.banner300 ?? assets.boxart ?? null;

        const capa = typeof url === "string" && url.startsWith("https://") ? url : null;

        cacheCapas.set(itadId, { expira: Date.now() + TTL_CAPAS_MS, capa });

        return capa;

    } catch (erro: any) {

        console.log("Não foi possível buscar a capa:", erro.response?.data ?? erro.message);

        return null;
    }
}

/* Cache em memória das informações básicas (capa e appid da Steam). */
const cacheInfoBasica = new Map<string, { expira: number; info: { capa: string | null; appid: number | null } }>();
const TTL_INFO_MS = 24 * 60 * 60 * 1000;

/* Busca capa e appid da Steam de um jogo no ITAD ('/games/info/v2', campos 'assets' e 'appid').

Roda dentro da requisição do usuário, então não espera em caso de 429: em qualquer falha devolve
{ capa: null, appid: null }.

@param itadId Id do jogo no ITAD (jogo.itad_id).
@returns { capa, appid }: capa é a URL https (banner600, com reserva nos menores e na boxart) e appid é o
         código do jogo na Steam (nulo se não estiver na Steam).
*/
export async function buscarInfoBasica(itadId: string): Promise<{ capa: string | null; appid: number | null }> {

    const emCache = cacheInfoBasica.get(itadId);

    if (emCache && emCache.expira > Date.now()) {
        return emCache.info;
    }

    try {

        const response = await axios.get(
            `${URL_API_ITAD}/games/info/v2`,
            { params: { id: itadId, key: obterChaveItad() }, timeout: 5000 }
        );

        const assets = response.data?.assets ?? {};
        const url = assets.banner600 ?? assets.banner400 ?? assets.banner300 ?? assets.boxart ?? null;
        const appid = Number(response.data?.appid);

        const info = {
            capa: typeof url === "string" && url.startsWith("https://") ? url : null,
            appid: Number.isInteger(appid) && appid > 0 ? appid : null
        };

        cacheInfoBasica.set(itadId, { expira: Date.now() + TTL_INFO_MS, info });

        return info;

    } catch (erro: any) {

        console.log("Não foi possível buscar as informações do jogo:", erro.response?.data ?? erro.message);

        return { capa: null, appid: null };
    }
}

/* Monta a URL da capa de um jogo direto pelo itad_id, SEM chamar a API.

As imagens do ITAD seguem o padrão https://assets.isthereanydeal.com/<itad_id>/<tamanho>.jpg, então
dá para usar em listas (catálogo, home, wishlist) sem gastar requisições nem criar coluna no banco.

Nem todo jogo tem imagem publicada: se a URL não existir, o navegador recebe 404 e o card mostra
a capa de exemplo.

@param itadId Id do jogo no ITAD (jogo.itad_id).
@param tamanho "banner145", "banner300", "banner400", "banner600" ou "boxart". Padrão: "banner300".
@returns URL https da imagem.
*/
export function urlCapaItad(
    itadId: string,
    tamanho: "banner145" | "banner300" | "banner400" | "banner600" | "boxart" = "banner300"
): string {

    return `https://assets.isthereanydeal.com/${itadId}/${tamanho}.jpg`;
}