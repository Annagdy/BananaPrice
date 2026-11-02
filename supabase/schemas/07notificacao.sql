-- Notificacao (gerada por uma lista, referente a um jogo)

create table if not exists notificacao (
    id_notificacao bigint generated always as identity primary key,
    id_lista       bigint not null references lista_desejo(id_lista) on delete cascade,
    id_jogo        bigint not null references jogo(id_jogo) on delete cascade,
    titulo         text,
    mensagem       text,
    preco          numeric(10, 2),
    desconto       numeric(5, 2),
    loja           text,
    lida           boolean not null default false,
    criado_em      timestamptz not null default now()
);

comment on table notificacao is 'Notificação gerada para um usuário (via lista_desejo) sobre um jogo específico.';
comment on column notificacao.id_lista is 'Chave estrangeira para lista_desejo, a lista que gerou a notificação e de quem é.';
comment on column notificacao.id_jogo is 'Chave estrangeira para jogo, o jogo ao qual a notificação se refere.';
comment on column notificacao.titulo is 'Título amigável da notificação.';
comment on column notificacao.mensagem is 'Corpo ou detalhe da notificação (ex: preço, loja, corte).';
comment on column notificacao.preco is 'Preço registrado no momento da notificação.';
comment on column notificacao.desconto is 'Percentual de desconto registrado no momento da notificação.';
comment on column notificacao.loja is 'Nome da loja que ofertou o melhor preço.';
comment on column notificacao.lida is 'Indica se o usuário já visualizou/leu a notificação.';
comment on column notificacao.criado_em is 'Data/hora em que a notificação foi gerada. Default "agora".';
