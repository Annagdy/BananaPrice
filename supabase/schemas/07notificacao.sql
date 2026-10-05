-- Notificacao (gerada por uma lista, referente a um jogo)

create table if not exists notificacao (
    id_notificacao bigint generated always as identity primary key,
    id_lista       bigint not null references lista_desejo(id_lista) on delete cascade,
    id_jogo        bigint not null references jogo(id_jogo) on delete cascade,
    criado_em      timestamptz not null default now()
);

comment on table notificacao is 'Notificação gerada para um usuário (via lista_desejo) sobre um jogo específico.';
comment on column notificacao.id_lista is 'Chave estrangeira para lista_desejo, a lista que gerou a notificação e de quem é.';
comment on column notificacao.id_jogo is 'Chave estrangeira para jogo, o jogo ao qual a notificação se refere.';
comment on column notificacao.criado_em is 'Data/hora em que a notificação foi gerada. Default "agora".';