-- Preco_historico (série histórica de preços por jogo/loja)

create table if not exists preco_historico (
    id_historico bigint generated always as identity primary key,
    id_jogo      bigint not null references jogo(id_jogo) on delete cascade,
    id_loja      bigint not null references loja(id_loja) on delete cascade,
    data         date not null default current_date,
    valor        numeric(10, 2)
);

comment on table preco_historico is 'Série histórica de preços: uma linha nova por jogo+loja a cada importação (insert puro, sem upsert). Não tem chave única em (id_jogo, id_loja, data).';
comment on column preco_historico.data is 'Data de referência do preço registrado. Default "hoje".';
comment on column preco_historico.valor is 'Preço com desconto aplicado, registrado nesta data.';