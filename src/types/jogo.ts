/**
 * Representação bruta do jogo retornado pela API externa do ITAD. | Raw representation of the game returned by the external ITAD API.
 */
export interface JogoApi {
    id: string;
    title?: string;
    slug?: string;
}

/**
 * Entidade de jogo persistida na tabela `jogo` do banco de dados relacional.
 * | Game entity persisted in the `jogo` table of the relational database.
 */
export interface Jogo {
    id_jogo: number;
    itad_id: string | null;
    titulo: string;
    slug: string | null;
    genero: string | null;
}
