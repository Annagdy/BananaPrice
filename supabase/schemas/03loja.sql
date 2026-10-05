-- Loja

create table if not exists loja (
    id_loja bigint generated always as identity primary key,
    nome    text not null unique
);

comment on table loja is 'Lojas onde os jogos são vendidos (Steam, GOG, Epic Games, etc). Criadas automaticamente pelo script conforme aparecem nos preços da API.';
comment on column loja.nome is 'Nome da loja como a API devolve (ex.: "Steam", "GOG"). Único, usado como chave de upsert.';