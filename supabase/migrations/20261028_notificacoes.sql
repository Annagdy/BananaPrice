-- Migration: Atualização da tabela notificacao e configurações de usuário

-- Adiciona novas colunas à tabela notificacao para suportar notificações detalhadas
alter table if exists notificacao add column if not exists titulo text;
alter table if exists notificacao add column if not exists mensagem text;
alter table if exists notificacao add column if not exists preco numeric(10, 2);
alter table if exists notificacao add column if not exists desconto numeric(5, 2);
alter table if exists notificacao add column if not exists loja text;
alter table if exists notificacao add column if not exists lida boolean not null default false;

-- Adiciona preferência de e-mail na tabela usuario (caso ainda não exista)
alter table if exists usuario add column if not exists notificar_email boolean not null default true;

-- Habilita RLS se ainda não estiver habilitado
alter table if exists notificacao enable row level security;

-- Políticas RLS adicionais para permitir atualização e exclusão pelo próprio dono da lista
drop policy if exists "Usuario atualiza suas proprias notificacoes" on notificacao;
create policy "Usuario atualiza suas proprias notificacoes"
    on notificacao for update
    using (
        exists (
            select 1 from lista_desejo
            where lista_desejo.id_lista = notificacao.id_lista
            and auth.uid()::text = lista_desejo.id_usuario::text
        )
    );

drop policy if exists "Usuario apaga suas proprias notificacoes" on notificacao;
create policy "Usuario apaga suas proprias notificacoes"
    on notificacao for delete
    using (
        exists (
            select 1 from lista_desejo
            where lista_desejo.id_lista = notificacao.id_lista
            and auth.uid()::text = lista_desejo.id_usuario::text
        )
    );

