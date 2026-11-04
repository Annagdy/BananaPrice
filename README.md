# BananaPrice: Pagamento PIX via Mercado Pago, Tratamento de Front para Loading e Botões responsivos, Pesquisa Selenium Modificada para GPT

Foi centralizado o feedback visual de carregamento utilizando o componente `<Loading/>` com GIF local (`/assets/loading.gif`), garantindo uniformidade em páginas como **Home**, **Catálogo**, **Lista de Desejos**, **Notificações** e na página de detalhes do jogo (`/jogos/[id]`). Todos os botões interativos e links de navegação receberam tratamento de feedback tátil de clique (`active:scale-95`, `transition-all duration-150`) e iluminação (`hover:brightness-110`). Além disso, o botão de notificações da barra de navegação (`Nav`) foi alinhado ao padrão de container quadrado amarelo primário (`bg-bp-primary`).

No backend e na lógica de dados, foram corrigidos erros de objeto `store` indefinidos, implementada filtragem rigorosa para ofertas inválidas ou sem preço real, e centralizada a geração de capas via utilitário `urlCapaItad` com fallback automático.

---

## Rotas implementadas

| Método | Rota | O que faz | RF |
|---|---|---|---|
| `POST` | `/api/v1/payments/pix` | Gera cobrança com QRCode e chave copia e cola via API Mercado Pago | RF09 |
| `POST` | `/api/v1/webhooks/mercadopago` | Recebe notificações de status de pagamento PIX e atualiza a base Supabase | RF10 |

---

### Comportamento de Pagamentos

* **Integração PIX (Mercado Pago)**: Geração dinâmica de payload PIX para aquisição/desbloqueio de funcionalidades da conta ou ofertas.
* **Confirmação Assíncrona**: O endpoint de Webhook valida o status da transação em tempo real e atualiza as permissões do usuário via Supabase Client/Service Role.

---

### Comportamento de Pesquisa

* **Pesquisa via Selenium & GPT**: Raspagem de dados integrada com modelos GPT para parsing e extração inteligente de títulos, promoções e identificadores ITAD/Steam.
* **Sanitização de Catálogo**: Jogos sem loja válida associada ou com valor `0` (quando não são promoções gratuitas legítimas) são desconsiderados do catálogo de buscas.
* **Tratamento de Imagens**: Resolução centralizada através da função `urlCapaItad(itadId)`, garantindo exibição da capa correta ou carregamento da imagem de fallback (`capaExemplo`).

---

### Fluxo

1. **Navegação & Resposta Tátil**: O usuário interage com elementos da interface e recebe resposta visual imediata via efeito de clique (`active:scale-95`).
2. **Carregamento Unificado**: Requisições de dados em componentes Client (`useState`/`useEffect`) ou em rotas com renderização no Server Component (`<Suspense>`) exibem o componente `<Loading/>`.

---

## Como rodar

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure o .env.local:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   NEXT_PUBLIC_SITE_URL=http://localhost:3000

   STEAM_API_KEY=

   ITAD_API_KEY=

   MERCADOPAGO_ACCESS_TOKEN=

   # SMTP_HOST=
   # SMTP_PORT=587
   # SMTP_USER=
   # SMTP_PASS=
   # SMTP_FROM=
   ```

3. Aplique as mudanças do banco (migration em supabase/migrations ou pelo SQL Editor do Supabase).

4. Rode:
```bash
npm run dev
```

## Como Testar
1. Testar Feedback Visual de Loading:
   - Navegue pelas páginas /notificacoes, /lista-de-desejos e /jogos/[id].
   - Verifique a exibição do GIF de carregamento com a mensagem personalizada correspondente.

2. Testar Sensação de Clique e Estilização de Botões:
   - Passe o cursor e clique nos botões da barra superior (Nav), abas de filtro em Notificações e botões de ação nos cards de jogos.
   - Observe a redução suave de escala (active:scale-95) e a adequação do BellIcon dentro do quadrado primário (bg-bp-primary).

3. Testar Transição na Página do Jogo (/jogos/[id]):
   - Acesse uma URL de jogo válida.
   - Confirme o carregamento com a estrutura do Server Component através do elemento <Suspense>.

4. Testar Pagamento e Jogo Sendo Acionado como Turbo:
   - Escolha um jogo.
   - Clique no botão de turbo (raio) no lado esquerdo.
   - Pague o pix gerado.
   - Acessa a página inicial e verifique se o jogo foi inserido em Turbo.

## Pendências e Bugs Conhecidos
1. Cache HMR do Next.js: Em ambiente de desenvolvimento, alterações estruturais em componentes compartilhados podem exigir a limpeza manual do cache local. Se as alterações não renderizarem:
   - Interrompa o servidor (Ctrl + C).
   - Apague a pasta .next (rm -rf .next ou Remove-Item -Recurse -Force .next).
   - Execute npm run dev e aplique um Hard Refresh no navegador (Ctrl + Shift + R).