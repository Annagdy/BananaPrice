/**
 * Uma oferta individual de preço, como vem no array `deals` da API do ITAD.
 */
export interface OfertaApi {
    shop: { name: string };
    price: { amount: number };
    regular: { amount: number };
    cut: number;
}

/**
 * Resposta de cotação de preços da API externa para um jogo específico.
 */
export interface ResultadoPrecoApi {
    id: string;
    historyLow?: unknown;
    deals?: OfertaApi[];
}

/**
 * Entidade da tabela `preco_jogo` representando o menor valor corrente por loja.
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
 */
export interface PrecoHistorico {
    id_jogo: number;
    id_loja: number;
    data: string;
    valor: number | null;
}
