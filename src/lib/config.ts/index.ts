/**
 * Liga/desliga a busca de gênero durante a importação de jogos.
 *
 * A API ITAD só fornece as tags de gênero no endpoint `/games/info/v2`, que responde apenas um jogo por vez,
 * consumindo uma requisição extra por jogo novo.
 */
export const BUSCAR_GENERO = true;

/**
 * Limite de quantos jogos importar numa execução do script de catálogo.
 * Defina como `null` para não impor limite e importar o catálogo completo.
 */
export const LIMITE_JOGOS: number | null = 500000;