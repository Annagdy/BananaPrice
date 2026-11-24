/**
 * Entidade de loja de jogos cadastrada na tabela `loja` (ex: Steam, Epic Games, GOG).
 * | Game store entity registered in the `loja` table (e.g. Steam, Epic Games, GOG).
 */
export interface Loja {
    id_loja: number;
    nome: string;
}
