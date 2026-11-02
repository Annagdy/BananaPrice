import { supabase, chamarSupabase } from "../lib/supabase.ts/index.ts";
import { buscarItadIdsPorSteamAppIds } from "../lib/itad.ts/index.ts";
import { buscarDlcsSteam } from "../lib/steam.ts/index.ts";

/* Cache em memória: itad_id dos DLCs de cada jogo da Steam (a parte que depende de rede).
O banco é consultado a cada visita, para refletir jogos recém-importados e o filtro de conteúdo adulto. */
const cacheDlcs = new Map<number, { expira: number; itadIds: string[] }>();
const TTL_DLCS_MS = 24 * 60 * 60 * 1000;

/* Quantos DLCs no máximo voltam na resposta. */
const MAX_DLCS = 100;

export type DlcJogo = {
    id: number;
    titulo: string;
    preco: number | null;
    desconto: number;
};

/* Lista os DLCs de um jogo que existem no nosso catálogo.

Caminho: appid do jogo na Steam -> appids dos DLCs (loja da Steam) -> itad_id (lookup do ITAD) -> tabela `jogo`.
Só aparecem DLCs que já estão em `jogo`; os demais são ignorados, porque não teriam página para abrir.
Roda dentro da requisição do usuário: nunca lança erro, e qualquer falha de rede devolve lista vazia.

@param appid Código do jogo na Steam (vem do ITAD). Nulo se o jogo não está na Steam.
@param permitirAdulto Se false, DLCs marcados como adultos ficam de fora.
@returns DLCs com o melhor preço atual de cada um, em ordem alfabética.
*/
export async function buscarDlcsDoJogo(appid: number | null, permitirAdulto: boolean): Promise<DlcJogo[]> {

    if (!appid) {
        return [];
    }

    try {

        let itadIds = cacheDlcs.get(appid);

        if (!itadIds || itadIds.expira <= Date.now()) {

            const appidsDlc = await buscarDlcsSteam(appid);

            const ids = appidsDlc.length > 0
                ? await buscarItadIdsPorSteamAppIds(appidsDlc)
                : [];

            itadIds = { expira: Date.now() + TTL_DLCS_MS, itadIds: ids };

            cacheDlcs.set(appid, itadIds);
        }

        if (itadIds.itadIds.length === 0) {
            return [];
        }

        const resultado: DlcJogo[] = [];
        const tamanhoConsulta = 100; // o .in() vai na URL: lotes grandes quebram a requisição

        for (let i = 0; i < itadIds.itadIds.length; i += tamanhoConsulta) {

            const lote = itadIds.itadIds.slice(i, i + tamanhoConsulta);

            let consulta = supabase
                .from("jogo")
                .select("id_jogo, titulo, adulto, preco_jogo ( valor_atual, percentual_desconto )")
                .in("itad_id", lote);

            if (!permitirAdulto) {
                consulta = consulta.or("adulto.is.null,adulto.eq.false");
            }

            const linhas = await chamarSupabase("buscar DLCs no catálogo", () => consulta);

            for (const linha of (linhas ?? []) as any[]) {

                const ofertas = (linha.preco_jogo ?? [])
                    .filter((p: any) => p.valor_atual != null)
                    .sort((a: any, b: any) => a.valor_atual - b.valor_atual);

                const melhor = ofertas[0];

                resultado.push({
                    id: linha.id_jogo,
                    titulo: linha.titulo,
                    preco: melhor ? Number(melhor.valor_atual) : null,
                    desconto: Number(melhor?.percentual_desconto ?? 0)
                });
            }
        }

        return resultado
            .sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"))
            .slice(0, MAX_DLCS);

    } catch (erro: any) {

        console.error(`[buscarDlcsDoJogo] appid ${appid}:`, erro?.message ?? erro);

        return [];
    }
}