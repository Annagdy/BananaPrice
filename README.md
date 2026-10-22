# BananaPrice: Autenticação, Conta e Lista de Desejos

Registro das rotas e mudanças já implementadas. Tudo o que não aparece aqui ainda não foi feito.

## Rotas implementadas

| Método | Rota | O que faz | RF |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Cadastro por e-mail com nome de usuário único | RF02 |
| POST | `/api/v1/auth/login` | Login por e-mail **ou** nome de usuário | RF03 |
| GET | `/api/v1/auth/steam` | Inicia o login com a Steam (OpenID 2.0) | RF04 |
| GET | `/api/v1/auth/steam/callback` | Valida a Steam, cria/vincula a conta, abre a sessão e importa a wishlist | RF04, RF05 |
| GET | `/api/v1/auth/confirm` | Recebe o link de confirmação de e-mail | - |
| PATCH | `/api/v1/conta` | Altera nome de usuário, e-mail (com confirmação) e senha da conta logada | - |
| GET | `/api/v1/wishlist` | Lista a wishlist do usuário logado com melhor preço atual | RF10 |
| POST | `/api/v1/wishlist` | Adiciona um jogo à wishlist (`{ "idJogo": 1 }`) | RF10 |
| DELETE | `/api/v1/wishlist/[gameId]` | Remove um jogo da wishlist | RF10 |

### Comportamento do login com a Steam

O callback cobre três casos:

1. **Steam já vinculada:** entra na conta dona dela.
2. **Usuário já logado:** vincula a Steam à conta atual.
3. **Steam nova e ninguém logado:** cria usuário, vínculo em `conta_steam` e sessão.

Quem entra pela Steam recebe um e-mail provisório (`<steamid>@steam.local`). Em `/conta` ele pode trocar por um e-mail real e continua vinculado à mesma Steam, podendo entrar pelos dois meios.

### Ainda não implementado

`games`, `games/[id]`, `games/[id]/history`, `notifications`, `highlights`, `payments/pix`, `webhooks/pix` e a rota de logout (hoje o botão **Sair** usa o `signOut()` do navegador).

## Mudanças no banco

- `usuario` passou a se ligar ao Supabase Auth pela coluna `auth_id`. A coluna `senha` foi removida (a senha fica só no Auth).
- `usuario.id_usuario` virou identity (autoincremento).
- `conta_steam.id_steam` virou `text` e deixou de ser identity (o SteamID64 passa de 2^53).
- E-mail e nome de usuário únicos em `usuario`; uma `lista_desejo` por usuário.
- Triggers em `auth.users`:
  - cria a linha em `usuario` quando nasce um usuário;
  - mantém `usuario.email` sincronizado quando o e-mail muda.

## Como rodar

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure o `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   STEAM_API_KEY=
   ITAD_API_KEY=
   ```
   `NEXT_PUBLIC_SITE_URL` deve ser idêntica à URL aberta no navegador (host e porta), senão a validação da Steam falha.
3. Aplique as mudanças do banco (migration em `supabase/migrations` ou pelo SQL Editor do Supabase).
4. Inicie:
   ```bash
   npm run dev
   ```

## Como testar

- **Cadastro e login:** crie uma conta em `/cadastro` e entre em `/login` (por e-mail e por usuário).
- **Steam:** clique em **Continuar com Steam**. Deve cair em `/conta` e criar linhas em `usuario` e `conta_steam`. Entrar de novo deve levar à mesma conta.
- **Vincular e-mail:** em `/conta`, troque o e-mail provisório por um real e confirme pelo link recebido.
- **Wishlist:** a importação só grava jogos que **já existem** na tabela `jogo`, então o catálogo precisa estar populado (`atualizarBD`) e a wishlist da Steam precisa estar **pública**. Entre pela Steam de novo depois de popular o catálogo para reimportar. Para testar só a página, insira linhas em `lista_jogo` manualmente.

## Pendências conhecidas

- A importação da wishlist depende do endpoint `IWishlistService/GetWishlist` da Steam e do lookup de IDs do ITAD (`/lookup/id/shop/61/v1`). Ambos precisam ser conferidos na prática.
- O envio de e-mails do Supabase tem limites no plano padrão. Para uso real, configure um SMTP próprio.
- Capa dos jogos e link externo da loja não existem no schema atual; a lista usa imagem de exemplo e leva à página interna `/jogos/<id>`.
- Ativar RLS nas tabelas antes de qualquer acesso direto pelo navegador (as rotas atuais usam a service role no servidor).