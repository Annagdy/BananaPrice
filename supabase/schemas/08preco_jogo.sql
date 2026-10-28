-- Preco_jogo (preço atual por loja - join: jogo <-> loja)

create table if not exists preco_jogo (
    id_jogo               bigint not null references jogo(id_jogo) on delete cascade,
    id_loja               bigint not null references loja(id_loja) on delete cascade,
    valor_atual           numeric(10, 2),
    percentual_desconto   numeric(5, 2),
    atualizado_em         timestamptz not null default now(),
    primary key (id_jogo, id_loja)
);

comment on table preco_jogo is 'Preço ATUAL de cada jogo em cada loja (uma linha por par jogo+loja, upsert a cada import, sempre substitui o valor anterior). Para a série histórica, ver preco_historico.';
comment on column preco_jogo.valor_atual is 'Preço com desconto aplicado.';
comment on column preco_jogo.percentual_desconto is 'Percentual de desconto em relação ao preço original (0 a 100).';
comment on column preco_jogo.atualizado_em is 'Data/hora da última atualização deste preço.';