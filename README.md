# BananaPrice: alterações desta branch

Conversão das telas do protótipo (Vite + JSX + CSS) para **Next.js (App Router) + TypeScript + Tailwind**, mais a configuração para rodar com **Docker**.
Escopo: apenas as telas (Home, Login, Cadastro e Notificações). Não há autenticação nem dados reais ainda, tudo usa dados fake.

---

## 1. Dependências e configuração

| Arquivo | Alteração |
|---|---|
| `package.json` | Adicionados `next`, `react`, `react-dom` e, em dev, `typescript`, `@types/*`, `tailwindcss` e `@tailwindcss/postcss`. Criados os scripts `dev`, `build` e `start`. As dependências antigas (supabase, axios, dotenv, tsx) foram mantidas. |
| `package-lock.json` | Atualizado pelo `npm install`. |
| `tsconfig.json` | **Novo.** Configuração TypeScript do Next (modo `strict`). |
| `next.config.mjs` | **Novo.** Configuração do Next, vazia por enquanto. |
| `postcss.config.mjs` | **Novo.** Ativa o plugin do Tailwind v4 (`@tailwindcss/postcss`). |
| `next-env.d.ts` | **Novo, gerado automaticamente** pelo Next na primeira execução. Não editar. |

> Os imports das telas são **relativos** (`../components/...`), então não dependem do alias `@/`.

---

## 2. Estilo global (`src/app`)

### `globals.css` (novo)
- `@import "tailwindcss"` e um bloco `@theme` com as cores e fontes do projeto.
- Cores com prefixo `bp-` para não colidir com as do Tailwind:

| Classe | Cor | Uso |
|---|---|---|
| `bp-primary` | `#facc15` | amarelo principal (botões, títulos, preços) |
| `bp-on-primary` | `#231b00` | texto sobre o amarelo |
| `bp-bg` | `#150c09` | fundo da página |
| `bp-surface` | `#231916` | cartão de login e cadastro |
| `bp-nav` | `#322824` | barra de navegação e rodapé |
| `bp-input` | `#271d1a` | campos de formulário |
| `bp-neutral` | `#2c221e` | cards de jogo |
| `bp-text` | `#f1dfd8` | texto claro |
| `bp-muted` | `#d1c6ab` | texto secundário |
| `bp-steam` | `#0088ff` | botão da Steam |

- Fontes: `font-head` (Rubik) e `font-body` (Nunito Sans).

### `layout.tsx` (novo)
- Layout raiz, em `pt-BR`, com título e descrição do site.
- Carrega Rubik e Nunito Sans via `next/font/google`.
- Aplica fundo `bp-bg` e a fonte do corpo em todas as páginas.

---

## 3. Telas (`src/app`)

### Home: `page.tsx` (modificado)
- Nav, Hero, **Vitrine Turbo** (carrossel com setas), **Ofertas do Momento** (grade de cards), botão "Ver Mais" e rodapé.
- A busca do Nav filtra os cards da grade.
- Dados vêm de `mocks/games.ts`.

### Login: `login/page.tsx` (modificado)
- Botão "Continuar com a Steam", e-mail ou usuário, senha com botão de mostrar e ocultar, "Esqueceu a senha?", "Continuar como visitante" e link para o cadastro.
- **Login de mentira:** o envio do formulário leva a `/notificacoes` com qualquer dado. Há um `TODO` no ponto de trocar pelo Supabase.
- Steam e "Esqueceu a senha?" ainda não fazem nada (`href="#"`).

### Cadastro: `cadastro/page.tsx` (modificado)
- Nome ou nick, e-mail, senha, confirmação de senha, termos de uso e opção de receber alertas.
- **Barra de força da senha** (fraca, média, forte).
- **Validação:** senha com no mínimo 8 caracteres, confirmação igual à senha e termos aceitos.
- Cadastro válido leva a `/notificacoes`. Também há `TODO` para o Supabase.

### Notificações: `notificacoes/page.tsx` (modificado)
- Nav na versão **logado**, título com sino, linha divisória e lista de cards de notificação.
- Imagem decorativa no canto, escondida em telas menores que 1100px, e rodapé.
- Dados vêm de `mocks/notificacoes.ts`. O layout deixou de usar posição absoluta e ficou flexível.
- O arquivo `index.module.css` do export do Figma não é mais necessário.

### Não alterado
`api/` continua como estava. Nenhuma rota foi criada, alterada ou removida.

### Telas adicionais
- `jogos/page.tsx`: lista de ofertas com painel de filtros (preço, corte e loja), grade de 3 colunas e paginação por setas (dados de `mocks/promos.ts`).
- `jogos/[id]/page.tsx`: detalhe do jogo, com dados de exemplo.
- `turbo/[gameId]/page.tsx`: passa a ler os dados de `mocks/turbo.ts`.
- `turbo/sucesso/page.tsx`: confirmação de pagamento (dados de `mocks/sucesso.ts`).
- `components/Carregando.tsx`: tela de carregamento reutilizável (dados de `mocks/carregando.ts`).
- `mocks/tema.ts`: cores usadas nessas telas que não estão no `globals.css`.

---

## 4. Componentes (`src/components`), todos novos

| Arquivo | Descrição |
|---|---|
| `Nav.tsx` | Barra superior com logo, busca e botões. Prop `logado`: `false` mostra "Login / Cadastrar", `true` mostra sino, Lista de Desejos e Conta. É componente de cliente (`'use client'`). |
| `Hero.tsx` | Banner da Home com título, subtítulo e mascote. |
| `GameCard.tsx` | Card de jogo (capa, desconto, loja, preço antigo e atual). Variante `wide` usada na Vitrine Turbo. |
| `Footer.tsx` | Rodapé com texto institucional, links de transparência e créditos da API. |
| `AuthShell.tsx` | Moldura do login e do cadastro: fundo com palmeira e banana, logo e cartão. |
| `AuthField.tsx` | Campo de formulário reutilizável (label, ícone, olho da senha e mensagem de erro). |
| `Icons.tsx` | Ícones SVG usados nas telas. |
| `assets.ts` | Caminhos das imagens em `public/assets`. |

---

## 5. Dados de exemplo (`src/mocks`), todos novos

- `games.ts`: tipo `Game` e lista de 12 jogos fake.
- `notificacoes.ts`: tipo `Notificacao` e 4 notificações fake.

Quando a API estiver pronta, basta trocar esses imports pelos dados reais.

---

## 6. Imagens (`public/assets`)

`logo.png`, `macaco.png`, `palmeira.png`, `bananas.png` e `capa-exemplo.png`, vindas do protótipo.
`capa-exemplo.png` e `palmeira.png` estão como **placeholders** em alguns lugares (capas dos jogos, avatares das notificações e imagem do canto).

---

## 7. Docker

| Arquivo | Descrição |
|---|---|
| `Dockerfile` | Imagem `node:22-slim`, instala as dependências e roda `npm run dev` na porta 3000. |
| `docker-compose.yml` | Sobe o serviço `web` em `localhost:3000`, com o código montado em volume (hot reload, `WATCHPACK_POLLING`) e `node_modules` e `.next` isolados no container. |
| `.dockerignore` | Ignora `node_modules`, `.next`, `.git` e `.github` no build. |

---

## 8. `middleware.ts` (modificado)

O Next exige que o arquivo exporte uma função `middleware` (ou `default`). Sem isso, toda requisição quebrava e a Home dava 404. A função passou a existir e só libera a requisição, sem regra de autenticação ainda. O Next 16 está renomeando middleware para `proxy`, mas o nome antigo continua funcionando.

---

## Como rodar

**Local**
```bash
npm install
npm run dev
```

**Docker**
```bash
docker compose up --build
```

Acesse `http://localhost:3000`, `/login`, `/cadastro` e `/notificacoes`.
Fluxo para ver as notificações: `/login` e clique em **Entrar na Conta**.

---

## Próximos passos

- Integrar login e cadastro com o Supabase, no lugar do `router.push`.
- Ligar o botão da Steam, o "Esqueceu a senha?" e a Lista de Desejos.
- Trocar os mocks pelos dados reais da API.
- Substituir as imagens placeholders pelas definitivas.
- Proteger `/notificacoes` e `/conta` no `middleware.ts` quando houver sessão.