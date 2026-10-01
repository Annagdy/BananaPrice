/* Uma oferta de preço, como vem dentro de `deals` na API de preços. */
export interface OfertaApi {
    shop: { name: string };
    price: { amount: number };
    regular: { amount: number };
    cut: number;
}

/* Resposta crua da API de preços para um jogo. */
export interface ResultadoPrecoApi {
    id: string;
    historyLow?: unknown;
    deals?: OfertaApi[];
}

/* Linha da tabela `preco_jogo` (preço atual por jogo+loja). */
export interface PrecoJogo {
    id_jogo: number;
    id_loja: number;
    valor_atual: number | null;
    percentual_desconto: number | null;
    atualizado_em: string;
}

/* Linha da tabela `preco_historico` (uma por jogo+loja+dia). */
export interface PrecoHistorico {
    id_jogo: number;
    id_loja: number;
    data: string;
    valor: number | null;
}
