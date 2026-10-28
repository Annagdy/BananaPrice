import { supabase, chamarSupabase } from "../lib/supabase.ts/index.ts";

/* Jogos que estão sendo atualizados agora, para duas visitas ao mesmo tempo não gravarem em duplicidade. */
const emAtualizacao = new Set<number>();

/* Data de hoje no formato YYYY-MM-DD, no fuso de Brasília (a coluna preco_historico.data é do tipo date). */
function hojeBrasil(): string {
    return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

/* Atualiza no banco os preços de UM jogo, a partir das ofertas que o ITAD acabou de devolver.

Usado quando o usuário abre o jogo (não há cron rodando o tempo todo). Faz quatro coisas:
1. Garante que cada loja exista em `loja` (a chave é o nome).
2. Grava o preço atual em `preco_jogo` (upsert por jogo + loja) e remove lojas que deixaram de ter oferta.
3. Registra em `preco_historico` um valor novo sempre que o preço da loja muda (os anteriores são mantidos).
4. Se o menor preço caiu pelo menos 5%, cria notificações para quem tem o jogo na lista de desejos.

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

        // menor preço que estava guardado ANTES desta atualização (base da comparação para notificar)
        const anteriores = await chamarSupabase(
            "consultar preço anterior",
            () => supabase.from("preco_jogo").select("valor_atual").eq("id_jogo", idJogo)
        );

        const valoresAnteriores = (anteriores ?? [])
            .map((p: any) => Number(p.valor_atual))
            .filter((v: number) => Number.isFinite(v));

        const menorAnterior = valoresAnteriores.length > 0 ? Math.min(...valoresAnteriores) : null;

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

        // 3) histórico: grava um registro SEMPRE que o valor muda em relação ao último registro da loja.
        // Nada é sobrescrito: os valores passados ficam como estão, e preços repetidos não geram linhas novas.
        const novas: typeof linhasHistorico = [];

        for (const linha of linhasHistorico) {

            const ultimo = await chamarSupabase(
                "consultar último histórico da loja",
                () => supabase
                    .from("preco_historico")
                    .select("valor")
                    .eq("id_jogo", idJogo)
                    .eq("id_loja", linha.id_loja)
                    .order("id_historico", { ascending: false })
                    .limit(1)
                    .maybeSingle()
            );

            if (!ultimo || Number(ultimo.valor) !== linha.valor) {
                novas.push(linha);
            }
        }

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