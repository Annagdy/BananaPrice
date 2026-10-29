import { supabase, chamarSupabase } from "../lib/supabase.ts/index.ts";
import { notificarQuedaDePreco } from "./notificacoes";

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
3. Registra o preço de hoje em `preco_historico`, no máximo uma linha por jogo, loja e dia.
4. Se o menor preço do jogo caiu ou entrou um novo desconto substancial, notifica usuários da wishlist.

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

        // Consulta o menor preço anterior para verificar se houve redução
        let menorAnterior: number | null = null;
        let descontoAnterior = 0;
        try {
            const precosAnteriores = await chamarSupabase(
                "consultar menor preco anterior",
                () => supabase
                    .from("preco_jogo")
                    .select("valor_atual, percentual_desconto")
                    .eq("id_jogo", idJogo)
                    .not("valor_atual", "is", null)
                    .order("valor_atual", { ascending: true })
                    .limit(1)
            );
            if (precosAnteriores && precosAnteriores.length > 0) {
                menorAnterior = Number(precosAnteriores[0].valor_atual);
                descontoAnterior = Number(precosAnteriores[0].percentual_desconto ?? 0);
            }
        } catch {
            // falha na verificação de preço anterior não impede o upsert
        }

        // 2) preço atual
        await chamarSupabase(
            "gravar preco_jogo",
            () => supabase.from("preco_jogo").upsert(linhasPreco, { onConflict: "id_jogo,id_loja" })
        );

        // Dispara notificações se detectou menor preço ou desconto novo
        let menorNovoValor = Infinity;
        let maiorDesconto = 0;
        let melhorLoja = "";

        for (const [nome, oferta] of porLoja) {
            if (oferta.valor < menorNovoValor) {
                menorNovoValor = oferta.valor;
                maiorDesconto = oferta.corte;
                melhorLoja = nome;
            }
        }

        if (
            Number.isFinite(menorNovoValor) &&
            menorAnterior !== null &&
            (menorNovoValor < menorAnterior || (maiorDesconto > descontoAnterior && maiorDesconto >= 10))
        ) {
            notificarQuedaDePreco({
                idJogo,
                novoPreco: menorNovoValor,
                desconto: maiorDesconto,
                loja: melhorLoja,
                precoAnterior: menorAnterior,
            }).catch((err) =>
                console.error("[atualizarPrecosDoJogo] Erro ao disparar notificações:", err)
            );
        }

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
