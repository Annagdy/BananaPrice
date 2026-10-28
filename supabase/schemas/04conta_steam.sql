-- Conta_steam (1 usuario -> 0..1 conta_steam)

create table if not exists conta_steam (
    id_steam   bigint generated always as identity primary key,
    id_usuario bigint not null unique references usuario(id_usuario) on delete cascade
);

comment on table conta_steam is 'Vínculo opcional entre um usuário e sua conta Steam. Relação 1:0..1 com usuario (id_usuario).';
comment on column conta_steam.id_usuario is 'Chave estrangeira para usuario.id_usuario. Único para cada usuário. Apaga em cascata se o usuário for removido.';