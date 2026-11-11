/**
 * Representação bruta do jogo retornado pela API externa do ITAD.
 */
export interface JogoApi {
    id: string;
    title?: string;
    slug?: string;
}

/**
 * Entidade de jogo persistida na tabela `jogo` do banco de dados relacional.
 */
export interface Jogo {
    id_jogo: number;
    itad_id: string | null;
    titulo: string;
    slug: string | null;
    genero: string | null;
}
