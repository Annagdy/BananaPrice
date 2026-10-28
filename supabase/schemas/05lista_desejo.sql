-- Lista_desejo (1 usuario -> 1 lista_desejo)

create table if not exists lista_desejo (
    id_lista   bigint generated always as identity primary key,
    id_usuario bigint not null unique references usuario(id_usuario) on delete cascade
);

comment on table lista_desejo is 'Lista de desejos de um usuário. Relação 1:1 com usuario, cada usuário mantém exatamente uma lista.';
comment on column lista_desejo.id_usuario is 'Chave estrangeira para usuario.id_usuario. Único para cada usuário. Apaga em cascata se o usuário for removido.';