-- Lista_jogo (join: lista_desejo <-> jogo)

create table if not exists lista_jogo (
    id_lista bigint not null references lista_desejo(id_lista) on delete cascade,
    id_jogo  bigint not null references jogo(id_jogo) on delete cascade,
    primary key (id_lista, id_jogo)
);

comment on table lista_jogo is 'Tabela de junção: quais jogos estão em qual lista de desejos (N:N entre lista_desejos e jogo). Chave primária composta (id_lista, id_jogo).';