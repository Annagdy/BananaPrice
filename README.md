# BananaPrice: Suporte Internacional (Português pt-BR & Inglês en-US), Responsividade Mobile e Transparência

Nesta etapa, foi implementado o **suporte completo a internacionalização (i18n)** com seleção de idiomas entre **Português do Brasil (`pt-BR`) como padrão** e **Inglês Americano (`en-US`)**, além da consolidação da experiência mobile responsiva e páginas de transparência institucional.

---

## 🌐 Internacionalização & Suporte Multilíngue (`pt-BR` & `en-US`)

* **Contexto Central de Idiomas (`IdiomaContext.tsx`)**:
  * **Português do Brasil (`pt-BR`)** definido e mantido como o idioma padrão da plataforma.
  * Suporte nativo a **Inglês dos EUA (`en-US`)**.
  * **Persistência de Preferência**: Salvo automaticamente em `localStorage` (`bp_idioma_preferido`) e atualização em tempo real da tag `<html lang="...">`.
  * **Formatação Monetária Inteligente (`formatarMoeda`)**: Converte valores para Real brasileiro (`R$ 0,00`) quando em `pt-BR` e formato americano (`$0.00`) quando em `en-US`.

* **Seletor de Idiomas no Cabeçalho (`Nav.tsx`) e Autenticação (`AuthShell.tsx`)**:
  * **Desktop**: Botões em pílula estilizados (`🇧🇷 PT` / `🇺🇸 EN`) ao lado das ações do usuário.
  * **Mobile**: Botão alternador direto na barra de navegação responsiva.
  * **Telas de Login & Cadastro**: Seletor flutuante com efeito *glassmorphism* no canto superior direito para alternar o idioma antes ou durante o cadastro/login.

* **Telas e Componentes Traduzidos Dinamicamente**:
  * **Navegação & Rodapé**: Placeholders de busca, modais, histórico de buscas recentes, manifestos, créditos da API ITAD e direitos autorais.
  * **Home & Vitrines**: Cabeçalhos de seção (*Vitrine Turbo / Turbo Showcase*, *Ofertas do Momento / Current Deals*), badges de jogos (*GRÁTIS / FREE*, *Indisponível / Unavailable*).
  * **Catálogo & Filtros (`/jogos`)**: Todos os acordeões de filtro (*Estado*, *Preços*, *Descontos*, *Lojas*, *Conteúdo Adulto*, *Consoles & Gift Cards*), avisos de busca por IA e paginação.
  * **Página do Jogo (`/jogos/[id]`)**: Onde comprar, especificações do jogo, resumo, histórico de preços, modal de DLCs com busca e tooltips de lista de desejos.
  * **Cards e Página de Notificações (`/notificacoes`)**:
    * Tradução dinâmica de notificações salvas no banco (tanto alertas com porcentagem de desconto quanto títulos e mensagens descritivas).
    * Badges (*NOVA / NEW*), ações de marcar como lida/excluir e tempos relativos (*agora mesmo / just now*, *há X min / Xm ago*, *ontem / yesterday*, etc.).
  * **Minha Conta (`/conta`)**: Dados da conta, sincronização com a Steam, preferências de notificação por e-mail e encerramento de sessão.
  * **Lista de Desejos (`/lista-de-desejos`)**: Cabeçalho, avisos laterais do mascote, cards desejados e botões de remoção/ofertas.
  * **Checkout e Sucesso do Turbo (`/turbo/[gameId]` e `/turbo/sucesso`)**: Títulos de boost, instruções de Copia e Cola, avisos de conferência de valor e tela de comemoração.
  * **Páginas Institucionais de Transparência**:
    * Termos de Uso (`/termos-de-uso`)
    * Política de Privacidade (`/politica-de-privacidade`)
    * Contato & API Pública (`/contato-api`) com esclarecimentos sobre a IsThereAnyDeal (ITAD).
  * **Telas de Carregamento (*Loadings*)**: Componente global e telas individuais exibem mensagens no idioma selecionado (*Carregando...* / *Loading...*).

---

## 📱 Responsividade para Celulares (Mobile First)

* **Navegação Superior Compacta (`Nav.tsx`)**:
  * Logo proporcional para telas menores (`48px` de altura).
  * Menu Hambúrguer expansível contendo Notificações, Lista de Desejos e Minha Conta/Login.
  * Barra de busca acionada via botão de Lupa, expandindo os modos **Nativa / IA** e histórico recente.
* **Cards de Jogos Compactos (`GameCard.tsx`)**:
  * Grid responsivo em 2 colunas no celular com proporção equilibrada para as capas.
* **Filtros da Página de Jogos (`/jogos`)**:
  * Painel sanfonado mobile recolhido por padrão para acesso imediato às ofertas.
* **Lista de Desejos Mobile (`/lista-de-desejos`)**:
  * Cards horizontais compactos com capa de `88px` e paginação com reticências (`...`) para não vazar a tela.

---

## 🚀 Como Rodar o Projeto

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure o arquivo `.env.local` na raiz:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   NEXT_PUBLIC_SITE_URL=http://localhost:3000

   STEAM_API_KEY=
   ITAD_API_KEY=
   CRON_SECRET=
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

Acesse em [http://localhost:3000](http://localhost:3000).

---

## 🧪 Como Testar as Mudanças

1. **Seleção de Idioma (`🇧🇷 PT` / `🇺🇸 EN`)**:
   * No topo da página (desktop ou mobile), clique nos botões de alternância `🇧🇷 PT` e `🇺🇸 EN`.
   * Observe a tradução imediata dos textos, títulos, filtros, loadings e a conversão de preços (`R$` para `$`).
   * Atualize a página e confira se sua escolha de idioma permaneceu salva (`localStorage`).
2. **Páginas de Login & Cadastro**:
   * Acesse `/login` ou `/cadastro` e utilize o seletor de idioma no canto superior direito para alternar entre inglês e português.
3. **Página de Notificações**:
   * Acesse `/notificacoes` e confira a tradução dos cards e tempos relativos em ambos os idiomas.
4. **Páginas de Transparência e Turbo**:
   * Acesse `/termos-de-uso`, `/politica-de-privacidade`, `/contato-api` e `/turbo/[gameId]`, alternando o idioma para validar o conteúdo adaptado.
