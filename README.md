# BananaPrice: Integração ITAD e Melhorias de UI

As atualizações mais recentes realizadas no projeto BananaPrice, focando na integração com a API IsThereAnyDeal (ITAD), renderização de imagens e tratamentos de links.

## Rotas implementadas

As seguintes rotas receberam atualizações significativas no seu funcionamento e consumo de dados:

- Página Inicial: Agora consome ativamente a API do ITAD para preencher a listagem de jogos. Também foi implementada a exibição das imagens nos cards dos jogos.

- Página do Jogo: Implementado o tratamento de links de redirecionamento para as lojas parceiras (relativo à issue #24), garantindo que o usuário seja levado corretamente à oferta.

## Comportamento da Integração ITAD e Imagens

- Consumo da API: O frontend agora bate na API do ITAD e repassa os dados para popular a página inicial de forma dinâmica.

- Cards de Jogos: Foi adicionada uma lógica para buscar e exibir as capas/imagens oficiais dos jogos diretamente nos cards.

- Filtro NSFW: Adicionado um tratamento de filtro para a listagem de jogos NSFW.

- Links de Lojas: Ao clicar em uma loja na página de detalhes do jogo, o link agora é tratado corretamente para evitar URLs quebradas ou redirecionamentos falhos.

## Sistema de Notificações

- Notificações via Site: Notificações do cliente para jogos na wishlist via Site.

## Ainda não implementado

- Sistema de login de usuários para salvar jogos favoritos (Wishlist), por fora da Steam.

- Alerta por e-mail ou push notification para o Sistema de Notificações.

## Como rodar

Para rodar estas atualizações localmente, siga os passos abaixo:

1. Clone o repositório ou puxe as alterações mais recentes (git pull).

2. Certifique-se de ter o Node.js instalado.

3. Instale as dependências do projeto:
´´´bash
npm install
´´´

4. Configure suas variáveis de ambiente no arquivo .env.local:
´´´bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000

STEAM_API_KEY= 

ITAD_API_KEY=

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
SMTP_FROM=""
´´´

5. Inicie o servidor de desenvolvimento:
´´´bash
npm run dev
´´´
