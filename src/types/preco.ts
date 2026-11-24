/**
 * Uma oferta individual de preço, como vem no array `deals` da API do ITAD.
 * | A single price offer, as it comes in the `deals` array of the ITAD API.
 */
export interface OfertaApi {
    shop: { name: string };
    price: { amount: number };
    regular: { amount: number };
    cut: number;
}

/**
 * Resposta de cotação de preços da API externa para um jogo específico.
 * | Price quote response from the external API for a specific game.
 */
export interface ResultadoPrecoApi {
    id: string;
    historyLow?: unknown;
    deals?: OfertaApi[];
}

/**
 * Entidade da tabela `preco_jogo` representando o menor valor corrente por loja.
 * | `preco_jogo` table entity representing the lowest current price per store.
 */
export interface PrecoJogo {
    id_jogo: number;
    id_loja: number;
    valor_atual: number | null;
    percentual_desconto: number | null;
    atualizado_em: string;
}

/**
 * Entidade de série histórica da tabela `preco_historico` com o registro diário de preços.
 * | Price history series entity from the `preco_historico` table with the daily price record.
 */
export interface PrecoHistorico {
    id_jogo: number;
    id_loja: number;
    data: string;
    valor: number | null;
}
