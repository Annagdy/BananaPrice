-- Usuario

create table if not exists usuario (
  id_usuario bigint generated always as identity primary key,
  nome_usuario text not null,
  email text not null unique,
  senha text not null, 
  tipo_usuario text not null default 'comum'
);

comment on table usuario is 'Conta de um usuário da aplicação. Cada usuário tem no máximo uma conta_steam e extamente uma lista_desejo.';
comment on column usuario.id_usuario is 'Chave primária, gerada automaticamente.';
comment on column usuario.email is 'Único, usado para o login.';
comment on column usuario.senha is 'Guarda um HASH, nunca a senha em texto puro.';
comment on column usuario.tipo_usuario is 'Papel do usuário na aplicação. Default "comum".';