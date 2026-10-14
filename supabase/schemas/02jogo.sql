-- Jogo

create table if not exists jogo (
    id_jogo bigint generated always as identity primary key,
    itad_id text unique,
    titulo  text not null,
    slug text,
    genero  text
);

comment on table jogo is 'Catálogo de jogos, alimentado pela API IsThereAnyDeal (ITAD). Dado público, sem RLS restritiva.';
comment on column jogo.id_jogo is 'Chave primária interna, gerada automaticamente.';
comment on column jogo.itad_id is 'ID do jogo na API ITAD. Único, usado como chave de upsert ao reimportar.';
comment on column jogo.slug is 'Nome amigável para URLs (ex.: /jogos/meu-jogo). Quando a API não manda slug, o script gera um a partir do título do jogo.';
comment on column jogo.genero is 'Gêneros/tags do jogo, unidos por ", " (ex.: "Ação, RPG"). Só vem do endpoint /games/info/v2 da API, buscando um jogo por vez, ficando null até ser preenchido.';