import axios from "axios";
import { esperar } from "../util.ts/index.ts";

const URL_API_ITAD = "https://api.isthereanydeal.com";
const ID_LOJA_STEAM_ITAD = 61;

function obterChaveItad(): string {
    const chave = process.env.ITAD_API_KEY;
    if (!chave) {
        throw new Error("ITAD_API_KEY não foi encontrada. Defina no .env da raiz do projeto.");
    }
    return chave;
}

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

/**
 * Gera um slug amigável para URLs a partir do título do jogo.
 * @param texto Título original do jogo.
 * @returns Slug formatado em minúsculas separado por hífens.
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

/**
 * Busca uma página do catálogo de jogos na API ITAD com suporte a paginação contínua via cursor.
 * @param ultimoId Cursor do último jogo retornado da página anterior.
 * @returns Dados brutos retornados pela API ITAD.
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

export async function buscarGenero(itadId: string): Promise<string | null> {
    while (true) {
        try {
            const response = await axios.get(
                `${URL_API_ITAD}/games/info/v2`,
                { params: { id: itadId, key: obterChaveItad() } }
            );
            const tags: string[] = response.data?.tags ?? [];
            return tags.length > 0 ? tags.join(", ") : null;
        } catch (erro: any) {
            if (erro.response?.status === 429) {
                const tempoEspera = calcularEspera429(erro);
                await esperar(tempoEspera);
                continue;
            }
            return null;
        }
    }
}

/**
 * Consulta informações detalhadas do jogo no ITAD para extrair gêneros e classificação etária adulta.
 * Trata limite de requisições HTTP 429 com repetição exponencial.
 *
 * @param itadId Identificador do jogo no ITAD.
 * @returns Objeto contendo os gêneros separados por vírgula e se é classificado para adultos.
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
                await esperar(tempoEspera);
                continue;
            }
            return { genero: null, adulto: null };
        }
    }
}

/**
 * Busca os preços atuais de um lote de jogos no ITAD para a região do Brasil.
 *
 * @param ids Lista de IDs do ITAD a serem consultados.
 * @param inicio Índice de início para controle de loteamento.
 * @param fim Índice de fim para controle de loteamento.
 * @returns Resposta da API com as promoções vigentes.
 */
export async function buscarPrecosLote(ids: string[], inicio: number, fim: number) {
    while (true) {
        try {
            const response = await axios.post(
                `${URL_API_ITAD}/games/prices/v3`,
                ids,
                { params: { key: obterChaveItad(), country: "BR" } }
            );
            return response.data;
        } catch (erro: any) {
            if (erro.response?.status === 429) {
                const tempoEspera = calcularEspera429(erro);
                await esperar(tempoEspera);
                continue;
            }
            throw erro;
        }
    }
}

/**
 * Converte uma lista de Steam App IDs para seus respectivos IDs no catálogo ITAD.
 *
 * @param appIds Array com os App IDs numéricos da Steam.
 * @returns Lista de IDs ITAD correspondentes.
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
                if (itadId) resultado.push(itadId);
            }
        } catch (erro: any) {
            if (erro.response?.status === 429) break;
        }
    }
    return resultado;
}

/* Cache em memória das ofertas por jogo */
const cacheOfertas = new Map<string, { expira: number; deals: any[] }>();
const TTL_OFERTAS_MS = 10 * 60 * 1000;

/**
 * Consulta as ofertas vigentes de um jogo diretamente na API pública da Steam Store.
 * Trata tanto jogos gratuitos quanto preços em Reais (BRL).
 *
 * @param appid Código numérico do jogo na Steam.
 * @returns Array com oferta normalizada no formato padrão do sistema.
 */
export async function buscarOfertasSteam(appid: number): Promise<any[]> {
    try {
        console.log(`[STEAM API] Consultando ofertas para appid ${appid}...`);
        const response = await axios.get(
            `https://store.steampowered.com/api/appdetails`,
            {
                params: { appids: appid, cc: "br", l: "portuguese" },
                timeout: 5000
            }
        );

        const dadosApp = response.data?.[appid];
        if (!dadosApp?.success || !dadosApp?.data) return [];

        const data = dadosApp.data;
        const urlJogo = `https://store.steampowered.com/app/${appid}`;

        if (data.is_free) {
            return [{
                shop: { name: "Steam" },
                price: { amount: 0 },
                regular: { amount: 0 },
                cut: 0,
                url: urlJogo
            }];
        }

        const priceOverview = data.price_overview;
        if (!priceOverview) return [];

        const valorAtual = priceOverview.final / 100;
        const valorOriginal = priceOverview.initial / 100;
        const desconto = priceOverview.discount_percent ?? 0;

        return [{
            shop: { name: "Steam" },
            price: { amount: valorAtual },
            regular: { amount: valorOriginal },
            cut: desconto,
            url: urlJogo
        }];
    } catch (erro: any) {
        console.log(`[STEAM API ERRO] Appid ${appid}:`, erro?.message ?? erro);
        return [];
    }
}

/**
 * Busca as melhores ofertas de um jogo no ITAD com fallback automático para a Steam Store
 * caso nenhuma oferta seja encontrada na base do ITAD.
 *
 * Utiliza cache em memória de 10 minutos para proteger contra requisições excessivas.
 *
 * @param itadId Identificador do jogo no ITAD.
 * @param appid Código Steam App ID opcional para busca de fallback rápida.
 * @returns Lista de ofertas encontradas com loja, preço e link.
 */
export async function buscarOfertasJogo(itadId: string, appid?: number | null): Promise<any[]> {
    const emCache = cacheOfertas.get(itadId);
    if (emCache && emCache.expira > Date.now()) {
        return emCache.deals;
    }

    let deals: any[] = [];

    try {
        const response = await axios.post(
            `${URL_API_ITAD}/games/prices/v3`,
            [itadId],
            {
                params: { key: obterChaveItad(), country: "BR" },
                timeout: 5000
            }
        );
        deals = response.data?.[0]?.deals ?? [];
        console.log(`[ITAD API] ${itadId} retornou ${deals.length} ofertas.`);
    } catch (erro: any) {
        console.log(`[ITAD API ERRO] ${itadId}:`, erro.response?.data ?? erro.message);
    }

    // Fallback na Steam caso ITAD retorne 0 ofertas
    if (deals.length === 0) {
        let steamAppId = appid;
        if (!steamAppId) {
            const info = await buscarInfoBasica(itadId);
            steamAppId = info.appid;
        }

        if (steamAppId) {
            console.log(`[FALLBACK] 0 ofertas no ITAD. Consultando Steam para appid: ${steamAppId}`);
            deals = await buscarOfertasSteam(steamAppId);
        }
    }

    if (deals.length > 0) {
        cacheOfertas.set(itadId, { expira: Date.now() + TTL_OFERTAS_MS, deals });
    }

    return deals;
}

/**
 * Mapeia os links oficiais de compra para cada loja a partir da lista de promoções.
 * @param deals Lista de ofertas retornada pelo ITAD ou Steam.
 * @returns Dicionário indexado pelo nome da loja em minúsculas contendo a URL de destino.
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

/**
 * Atalho que busca ofertas e devolve diretamente o mapa de links por loja.
 * @param itadId ID do jogo no ITAD.
 * @returns Objeto com as URLs das lojas.
 */
export async function buscarLinksOfertas(itadId: string): Promise<Record<string, string>> {
    return linksDasOfertas(await buscarOfertasJogo(itadId));
}

const cacheCapas = new Map<string, { expira: number; capa: string | null }>();
const TTL_CAPAS_MS = 24 * 60 * 60 * 1000;

export async function buscarCapa(itadId: string): Promise<string | null> {
    const emCache = cacheCapas.get(itadId);
    if (emCache && emCache.expira > Date.now()) return emCache.capa;

    try {
        const response = await axios.get(
            `${URL_API_ITAD}/games/info/v2`,
            { params: { id: itadId, key: obterChaveItad() }, timeout: 5000 }
        );
        const assets = response.data?.assets ?? {};
        const url = assets.banner600 ?? assets.banner400 ?? assets.banner300 ?? assets.boxart ?? null;
        const capa = typeof url === "string" && url.startsWith("https://") ? url : null;
        cacheCapas.set(itadId, { expira: Date.now() + TTL_CAPAS_MS, capa });
        return capa;
    } catch {
        return null;
    }
}

const cacheInfoBasica = new Map<string, { expira: number; info: { capa: string | null; appid: number | null } }>();
const TTL_INFO_MS = 24 * 60 * 60 * 1000;

export async function buscarInfoBasica(itadId: string): Promise<{ capa: string | null; appid: number | null }> {
    const emCache = cacheInfoBasica.get(itadId);
    if (emCache && emCache.expira > Date.now()) return emCache.info;

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
    } catch {
        return { capa: null, appid: null };
    }
}

/**
 * Constrói a URL direta de banner ou imagem de capa nos servidores de assets do ITAD.
 *
 * @param itadId ID do jogo no ITAD.
 * @param tamanho Dimensão da imagem ('banner300', 'banner600', 'boxart', etc.). Padrão é 'banner300'.
 * @returns URL completa do arquivo de imagem.
 */
export function urlCapaItad(
    itadId: string,
    tamanho: "banner145" | "banner300" | "banner400" | "banner600" | "boxart" = "banner300"
): string {
    return `https://assets.isthereanydeal.com/${itadId}/${tamanho}.jpg`;
}