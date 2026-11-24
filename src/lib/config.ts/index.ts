/**
 * Liga/desliga a busca de gênero durante a importação de jogos. | Turns genre fetching on/off during game import.
 *
 * A API ITAD só fornece as tags de gênero no endpoint `/games/info/v2`, que responde apenas um jogo por vez,
 * consumindo uma requisição extra por jogo novo.
 * | The ITAD API only provides genre tags on the `/games/info/v2` endpoint, which answers one game at a time, consuming one extra
 *   request per new game.
 */
export const BUSCAR_GENERO = true;

/**
 * Limite de quantos jogos importar numa execução do script de catálogo.
 * Defina como `null` para não impor limite e importar o catálogo completo.
 * | Limit on how many games to import in one run of the catalog script. Set to `null` to impose no limit and import the full catalog.
 */
export const LIMITE_JOGOS: number | null = 500000;