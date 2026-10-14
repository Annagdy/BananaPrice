/* Jogo cru, como vem da API (listagem ou preços). */
export interface JogoApi {
    id: string;
    title?: string;
    slug?: string;
}

/* Linha da tabela `jogo` no Supabase. */
export interface Jogo {
    id_jogo: number;
    itad_id: string | null;
    titulo: string;
    slug: string | null;
    genero: string | null;
}
