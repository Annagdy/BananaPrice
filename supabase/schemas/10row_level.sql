-- Row level security
-- jogo, loja, preco_jogo e preco_historico são dados "públicos" (catálogo).
-- usuario, conta_steam, lista_desejo, lista_jogo e notificacao são dados pessoais.

-- Nota: auth.uid() (Supabase Auth) corresponde a usuario.id_usuario.

alter table jogo enable row level security;
alter table loja enable row level security;
alter table preco_jogo enable row level security;
alter table preco_historico enable row level security;

create policy "Leitura pública de jogo" on jogo for select using (true);
create policy "Leitura pública de loja" on loja for select using (true);
create policy "Leitura pública de preco_jogo" on preco_jogo for select using (true);
create policy "Leitura pública de preco_historico" on preco_historico for select using (true);

alter table usuario enable row level security;
alter table conta_steam enable row level security;
alter table lista_desejo enable row level security;
alter table lista_jogo enable row level security;
alter table notificacao enable row level security;

create policy "Usuario ve seus proprios dados"
    on usuario for select
    using (auth.uid()::text = id_usuario::text);

create policy "Usuario ve sua propria conta steam"
    on conta_steam for select
    using (auth.uid()::text = id_usuario::text);

create policy "Usuario ve sua propria lista"
    on lista_desejo for select
    using (auth.uid()::text = id_usuario::text);

create policy "Usuario ve os jogos da propria lista"
    on lista_jogo for select
    using (
        exists (
            select 1 from lista_desejo
            where lista_desejo.id_lista = lista_jogo.id_lista
            and auth.uid()::text = lista_desejo.id_usuario::text
        )
    );

create policy "Usuario ve suas proprias notificacoes"
    on notificacao for select
    using (
        exists (
            select 1 from lista_desejo
            where lista_desejo.id_lista = notificacao.id_lista
            and auth.uid()::text = lista_desejo.id_usuario::text
        )
    );