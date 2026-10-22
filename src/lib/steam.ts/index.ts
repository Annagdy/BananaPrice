import dotenv from "dotenv";
import path from "path";
import { supabase, chamarSupabase } from "../supabase.ts/index.ts";
import { esperar } from "../util.ts/index.ts";
import { buscarItadIdsPorSteamAppIds } from "../itad.ts/index.ts";

dotenv.config({
    path: path.resolve(process.cwd(), ".env")
});

const URL_LOGIN_STEAM = "https://steamcommunity.com/openid/login";
const URL_API_STEAM = "https://api.steampowered.com";

export type PerfilSteam = {
    steamid: string;
    personaname: string;
    avatarfull: string;
    profileurl: string;
};

/*
Lê a STEAM_API_KEY na hora do uso, e não na importação. Assim o login via OpenID (que não precisa da chave)
e o build do Next continuam funcionando mesmo se ela não estiver definida.
*/
function obterChaveSteam(): string {

    const chave = process.env.STEAM_API_KEY;

    if (!chave) {
        throw new Error(
            "STEAM_API_KEY não foi encontrada. Gere uma em https://steamcommunity.com/dev/apikey " +
            "e defina no .env da raiz do projeto (" + process.cwd() + ")."
        );
    }

    return chave;
}

/*
Faz um fetch com até 3 tentativas. Falhas de rede, 429 (rate limit) e 5xx são tentados de novo com espera
crescente. Qualquer outra resposta (200, 400, 403...) é devolvida na hora para quem chamou decidir o que fazer.

@param descricao Texto curto usado só nos logs.
@param url Endereço a ser chamado.
@param init Opções do fetch (method, headers, body...).
@returns A Response da última tentativa.
@throws O erro de rede original, se todas as tentativas falharem.
*/
async function chamarSteam(descricao: string, url: string, init?: RequestInit): Promise<Response> {

    const tentativasMax = 3;

    for (let tentativa = 1; tentativa <= tentativasMax; tentativa++) {

        try {

            const resposta = await fetch(url, { ...init, cache: "no-store" });

            const vale_tentar_de_novo = resposta.status === 429 || resposta.status >= 500;

            if (!vale_tentar_de_novo || tentativa === tentativasMax) {
                return resposta;
            }

            console.log(`Steam respondeu ${resposta.status} em "${descricao}" (tentativa ${tentativa}/${tentativasMax}).`);

        } catch (erro: any) {

            if (tentativa === tentativasMax) {
                throw erro;
            }

            console.log(`Erro em "${descricao}" (tentativa ${tentativa}/${tentativasMax}): ${erro.message}`);
        }

        await esperar(1000 * tentativa);
    }

    // Inalcançável -- só pra satisfazer o TypeScript
    throw new Error("Falha inesperada em chamarSteam");
}

/*
Monta a URL para onde o usuário é redirecionado para entrar com a Steam (OpenID 2.0).

@param site URL base do site, ex: "http://localhost:3000".
@returns URL de login da Steam, já com o return_to apontando para o nosso callback.
*/
export function montarUrlLoginSteam(site: string): string {

    const params = new URLSearchParams({
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.mode": "checkid_setup",
        "openid.return_to": `${site}/api/v1/auth/steam/callback`,
        "openid.realm": site,
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select"
    });

    return `${URL_LOGIN_STEAM}?${params}`;
}

/*
Valida a resposta que a Steam devolveu no callback e extrai o SteamID64 do usuário.

Confere se o return_to é o nosso e pede para a própria Steam confirmar a assinatura (check_authentication).
Sem essa confirmação qualquer pessoa poderia forjar um callback com o SteamID de outra.

@param parametros Query string recebida no callback.
@param site URL base do site, a mesma usada em montarUrlLoginSteam.
@returns O SteamID64 (17 dígitos) se a resposta for válida, ou null se não for.
*/
export async function validarLoginSteam(parametros: URLSearchParams, site: string): Promise<string | null> {

    if (
        parametros.get("openid.mode") !== "id_res" ||
        parametros.get("openid.return_to") !== `${site}/api/v1/auth/steam/callback`
    ) {
        return null;
    }

    const verificacao = new URLSearchParams(parametros);
    verificacao.set("openid.mode", "check_authentication");

    const resposta = await chamarSteam("validar login Steam", URL_LOGIN_STEAM, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: verificacao
    });

    if (!(await resposta.text()).includes("is_valid:true")) {
        return null;
    }

    const reivindicado = parametros.get("openid.claimed_id") ?? "";

    const steamId = reivindicado.match(
        /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/
    )?.[1];

    return steamId ?? null;
}

/*
Busca nome, avatar e link do perfil de um usuário na Steam Web API.

@param steamId SteamID64 do usuário.
@returns O perfil, ou null se a Steam não devolveu nada (ID inexistente ou erro).
*/
export async function buscarPerfilSteam(steamId: string): Promise<PerfilSteam | null> {

    const resposta = await chamarSteam(
        "perfil Steam",
        `${URL_API_STEAM}/ISteamUser/GetPlayerSummaries/v2/?key=${obterChaveSteam()}&steamids=${steamId}`
    );

    if (!resposta.ok) {
        return null;
    }

    const json = await resposta.json();

    return json.response?.players?.[0] ?? null;
}

export async function buscarWishlistSteam(steamId: string): Promise<number[]> {

    const resposta = await chamarSteam(
        "wishlist Steam",
        `${URL_API_STEAM}/IWishlistService/GetWishlist/v1/?key=${obterChaveSteam()}&steamid=${steamId}`
    );

    if (!resposta.ok) {
        console.log("[wishlist] Steam respondeu", resposta.status);
        return [];
    }

    const json = await resposta.json();
    const itens: { appid: number }[] = json.response?.items ?? [];

    if (itens.length === 0) {
        console.log("[wishlist] Steam devolveu vazio (steamId:", steamId, ")");
    }

    return itens.map((item) => item.appid);
}

/*
RF05: importa a wishlist da Steam para a lista de desejos do usuário no nosso banco.

Fluxo: appids da Steam -> itad_id (ITAD) -> jogo.id_jogo (catálogo) -> lista_jogo.
Jogos que ainda não estão no catálogo (ainda não passaram pelo cron de preços) são ignorados.
Falhas aqui não devem derrubar o login, então quem chama deve usar try/catch.

@param idUsuario usuario.id_usuario do dono da lista.
@param steamId SteamID64 do usuário.
@returns Quantidade de jogos que entraram (ou já estavam) na lista.
*/
export async function importarWishlistSteam(idUsuario: number, steamId: string): Promise<number> {

    const appIds = await buscarWishlistSteam(steamId);

    if (appIds.length === 0) {
        return 0;
    }

    const itadIds = await buscarItadIdsPorSteamAppIds(appIds);

    if (itadIds.length === 0) {
        return 0;
    }

    const tamanhoLote = 200;
    const idsJogos: number[] = [];

    for (let i = 0; i < itadIds.length; i += tamanhoLote) {

        const lote = itadIds.slice(i, i + tamanhoLote);

        const jogos = await chamarSupabase("buscar jogos do catálogo", () =>
            supabase.from("jogo").select("id_jogo").in("itad_id", lote)
        );

        for (const jogo of jogos ?? []) {
            idsJogos.push(jogo.id_jogo);
        }
    }

    if (idsJogos.length === 0) {
        return 0;
    }

    // lista de desejos do usuário (cria se ainda não existir)
    let lista = await chamarSupabase("buscar lista de desejos", () =>
        supabase.from("lista_desejo").select("id_lista").eq("id_usuario", idUsuario).maybeSingle()
    );

    if (!lista) {
        lista = await chamarSupabase("criar lista de desejos", () =>
            supabase.from("lista_desejo").insert({ id_usuario: idUsuario }).select("id_lista").single()
        );
    }

    for (let i = 0; i < idsJogos.length; i += tamanhoLote) {

        const lote = idsJogos.slice(i, i + tamanhoLote);

        await chamarSupabase("gravar lista_jogo", () =>
            supabase.from("lista_jogo").upsert(
                lote.map((idJogo) => ({ id_lista: lista!.id_lista, id_jogo: idJogo })),
                { onConflict: "id_lista,id_jogo", ignoreDuplicates: true }
            )
        );
    }

    return idsJogos.length;
}