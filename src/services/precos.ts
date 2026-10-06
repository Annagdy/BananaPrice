import { supabase, chamarSupabase } from "../lib/supabase.ts";
import type { ResultadoPrecoApi } from "../types/preco";

/* Grava os preços de um lote de resultados de `buscarPrecosLote` nas tabelas `preco_jogo` e `preco_historico`.

Primeiro garante que todas as lojas envolvidas existem em `loja` (criando as que faltarem) para resolver os ids. Depois grava:
- `preco_jogo`: preço atual por jogo+loja (upsert, sempre substitui o valor anterior). Linhas duplicadas de jogo+loja
    dentro do mesmo lote são deduplicadas antes do upsert, porque o Postgres não permite atualizar a mesma linha duas vezes numa só
    operação de ON CONFLICT.
- `preco_historico`: uma linha nova por jogo+loja+dia (insert puro, sem upsert), formando a série histórica.

@param resultados Resposta crua de `buscarPrecosLote`.
@param mapaItadParaIdJogo Mapa `itad_id` -> `id_jogo`, vindo de `salvarJogos`, usado para resolver a chave estrangeira
    de cada preço. Jogos ausentes do mapa são pulados (com aviso no log).

*/
export async function salvarPrecos(
    resultados: ResultadoPrecoApi[],
    mapaItadParaIdJogo: Map<string, number>
) {

    // Descobre todas as lojas envolvidas neste lote

    const nomesLojas = new Set<string>();

    for (const dados of resultados) {

        if (!dados || !dados.deals) {
            continue;
        }

        for (const oferta of dados.deals) {
            nomesLojas.add(oferta.shop.name);
        }
    }

    if (nomesLojas.size === 0) {
        return;
    }

    // Garante que as lojas existem e pega o Id de cada

    const lojasSalvas = await chamarSupabase(
        "salvar lojas",
        () => supabase
            .from("loja")
            .upsert(
                Array.from(nomesLojas).map(nome => ({ nome })),
                { onConflict: "nome" }
            )
            .select("id_loja, nome")
    );

    const mapaNomeParaIdLoja = new Map<string, number>(
        (lojasSalvas ?? []).map(
            (linha: any) => [linha.nome, linha.id_loja]
        )
    );

    // Monta as linhas de preco_jogo e preco_historico

    // Chave id_jogo+id_loja -> linha. Usar um Map em vez de um array garante que, se o mesmo jogo+loja aparecer duas vezes no mesmo
    // lote (acontece na API), só a última ocorrência sobra, senão o upsert tenta atualizar a mesma linha duas vezes e o Postgres
    // rejeita com "ON CONFLICT DO UPDATE command cannot affect row second time".
    
    const linhasAtuaisPorChave = new Map<string, any>();
    const linhasHistorico: any[] = [];

    for (const dados of resultados) {

        if (!dados || !dados.deals) {
            continue;
        }

        const idJogo = mapaItadParaIdJogo.get(dados.id);

        if (!idJogo) {
            console.log(
                `Aviso: jogo ${dados.id} não encontrado na tabela ` +
                `jogo, pulando preços.`
            );
            continue;
        }

        for (const oferta of dados.deals) {

            const idLoja = mapaNomeParaIdLoja.get(oferta.shop.name);

            if (!idLoja) {
                continue;
            }

            console.log("Jogo:", dados.id);
            console.log("Loja:", oferta.shop.name);

            console.log(
                "Preço:",
                oferta.price.amount.toLocaleString(
                    "pt-BR",
                    { style: "currency", currency: "BRL" }
                )
            );

            console.log(
                "Preço normal:",
                oferta.regular.amount.toLocaleString(
                    "pt-BR",
                    { style: "currency", currency: "BRL" }
                )
            );

            console.log("Desconto:", oferta.cut + "%");

            linhasAtuaisPorChave.set(`${idJogo}_${idLoja}`, {
                id_jogo: idJogo,
                id_loja: idLoja,
                valor_atual: oferta.price.amount ?? null,
                percentual_desconto: oferta.cut ?? null,
                atualizado_em: new Date().toISOString()
            });

            linhasHistorico.push({
                id_jogo: idJogo,
                id_loja: idLoja,
                data: new Date().toISOString().slice(0, 10),
                valor: oferta.price.amount ?? null
            });
        }
    }

    const linhasAtuais = Array.from(linhasAtuaisPorChave.values());

    if (linhasAtuais.length > 0) {

        await chamarSupabase(
            "salvar preços atuais",
            () => supabase
                .from("preco_jogo")
                .upsert(linhasAtuais, { onConflict: "id_jogo,id_loja" })
        );
    }

    if (linhasHistorico.length > 0) {

        await chamarSupabase(
            "salvar histórico de preços",
            () => supabase
                .from("preco_historico")
                .insert(linhasHistorico)
        );
    }
}
