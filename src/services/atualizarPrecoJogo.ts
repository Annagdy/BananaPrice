import { supabase, chamarSupabase } from "../lib/supabase.ts/index.ts";

/* Jogos que estão sendo atualizados agora, para duas visitas ao mesmo tempo não gravarem em duplicidade. */
const emAtualizacao = new Set<number>();

/* Data de hoje no formato YYYY-MM-DD, no fuso de Brasília (a coluna preco_historico.data é do tipo date). */
function hojeBrasil(): string {
    return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

/* Atualiza no banco os preços de UM jogo, a partir das ofertas que o ITAD acabou de devolver.

Usado quando o usuário abre o jogo (não há cron rodando o tempo todo). Faz três coisas:
1. Garante que cada loja exista em `loja` (a chave é o nome).
2. Grava o preço atual em `preco_jogo` (upsert por jogo + loja) e remove lojas que deixaram de ter oferta.
3. Registra o preço de hoje em `preco_historico`, no máximo uma linha por jogo, loja e dia.

Nunca lança erro: se algo falhar, registra no console e devolve false, e a página segue com o que já está no banco.

@param idJogo jogo.id_jogo
@param deals Ofertas cruas do ITAD ('/games/prices/v3', campo 'deals'). Campos lidos: shop.name, price.amount, cut.
@returns true se gravou, false se não havia o que gravar, já estava em atualização ou deu erro.
*/
export async function atualizarPrecosDoJogo(idJogo: number, deals: any[]): Promise<boolean> {

    if (emAtualizacao.has(idJogo)) {
        return false;
    }

    emAtualizacao.add(idJogo);

    try {

        // menor preço por loja (a mesma loja pode aparecer mais de uma vez)
        const porLoja = new Map<string, { valor: number; corte: number }>();

        for (const deal of deals) {

            const loja = String(deal?.shop?.name ?? "").trim();
            const valor = Number(deal?.price?.amount);
            const corte = Number(deal?.cut ?? 0);

            if (!loja || !Number.isFinite(valor)) {
                continue;
            }

            const atual = porLoja.get(loja);

            if (!atual || valor < atual.valor) {
                porLoja.set(loja, { valor, corte: Number.isFinite(corte) ? corte : 0 });
            }
        }

        if (porLoja.size === 0) {
            return false;
        }

        // 1) lojas
        const lojas = await chamarSupabase(
            "garantir lojas",
            () => supabase
                .from("loja")
                .upsert(Array.from(porLoja.keys()).map((nome) => ({ nome })), { onConflict: "nome" })
                .select("id_loja, nome")
        );

        const idPorNome = new Map<string, number>();

        for (const loja of lojas ?? []) {
            idPorNome.set(loja.nome, loja.id_loja);
        }

        const agora = new Date().toISOString();
        const linhasPreco: Record<string, unknown>[] = [];
        const linhasHistorico: { id_jogo: number; id_loja: number; data: string; valor: number }[] = [];
        const hoje = hojeBrasil();

        for (const [nome, oferta] of porLoja) {

            const idLoja = idPorNome.get(nome);

            if (idLoja === undefined) {
                continue;
            }

            linhasPreco.push({
                id_jogo: idJogo,
                id_loja: idLoja,
                valor_atual: oferta.valor,
                percentual_desconto: oferta.corte,
                atualizado_em: agora
            });

            linhasHistorico.push({ id_jogo: idJogo, id_loja: idLoja, data: hoje, valor: oferta.valor });
        }

        if (linhasPreco.length === 0) {
            return false;
        }

        // 2) preço atual
        await chamarSupabase(
            "gravar preco_jogo",
            () => supabase.from("preco_jogo").upsert(linhasPreco, { onConflict: "id_jogo,id_loja" })
        );

        // lojas que deixaram de ter oferta saem da lista (senão ficariam com preço velho)
        const idsAtuais = linhasPreco.map((l) => l.id_loja as number);

        await chamarSupabase(
            "remover ofertas antigas",
            () => supabase
                .from("preco_jogo")
                .delete()
                .eq("id_jogo", idJogo)
                .not("id_loja", "in", `(${idsAtuais.join(",")})`)
        );

        // 3) histórico: uma linha por loja por dia
        const jaRegistrados = await chamarSupabase(
            "consultar histórico de hoje",
            () => supabase
                .from("preco_historico")
                .select("id_loja")
                .eq("id_jogo", idJogo)
                .eq("data", hoje)
        );

        const lojasComHistorico = new Set((jaRegistrados ?? []).map((l: any) => l.id_loja));
        const novas = linhasHistorico.filter((l) => !lojasComHistorico.has(l.id_loja));

        if (novas.length > 0) {
            await chamarSupabase(
                "gravar preco_historico",
                () => supabase.from("preco_historico").insert(novas)
            );
        }

        return true;

    } catch (erro: any) {

        console.error(`[atualizarPrecosDoJogo] jogo ${idJogo}:`, erro?.message ?? erro);

        return false;

    } finally {

        emAtualizacao.delete(idJogo);
    }
}