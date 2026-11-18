# BananaPrice: Responsividade Mobile Completa e Páginas de Transparência Institucional

Nesta etapa, foi realizada a adaptação completa da experiência do **BananaPrice para dispositivos móveis (smartphones)**, além da criação e vinculação das páginas institucionais de **Transparência (Termos de Uso, Política de Privacidade e Contato & API Pública)**.

---

## 📱 Responsividade para Celulares (Mobile First)

* **Navegação Superior Compacta (`Nav.tsx`)**:
  * **Logo proporcional**: Redução do tamanho da logo no cabeçalho em telas menores (`48px` de altura e `140px` de largura), impedindo que o topo ocupe espaço desnecessário.
  * **Menu Hambúrguer (3 Linhas)**: Em celulares, os botões longos de texto da navbar são substituídos por um botão com ícone de menu de 3 linhas, que expande um menu suspenso elegante contendo:
    * 🔔 **Notificações** (com badge dinâmico de novos alertas);
    * ❤️ **Lista de Desejos**;
    * 👤 **Minha Conta** / **Login**.
  * **Barra de Pesquisa acionada por Lupa**: Em telas pequenas, a barra fica oculta para liberar espaço na tela inicial. Ao tocar no botão de Lupa, ela desliza suavemente exibindo o campo de texto, o alternador de modo (**Nativa / IA**) e o histórico de buscas recentes.
* **Cards de Jogos Compactos (`GameCard.tsx`)**:
  * Ajuste de tipografia, paddings internos, badges de desconto e de status para celulares.
  * Grid responsivo estruturado em 2 colunas no celular, mantendo a proporção correta das capas de jogos sem estourar a tela.
* **Filtros da Página de Jogos (`/jogos`)**:
  * Adicionado botão sanfonado mobile **"Filtrar Ofertas e Categorias"**: os filtros agora iniciam recolhidos no celular, permitindo que o usuário veja a vitrine de jogos de imediato sem precisar rolar uma coluna inteira de opções.
* **Lista de Desejos Mobile (`/lista-de-desejos`)**:
  * Cards horizontais compactos com capa de `88px`, evitando que a imagem do jogo ocupe a tela vertical inteira.
  * **Paginação Inteligente**: Correção da paginação que antes vazava da tela quando havia muitas páginas; agora conta com janela deslizante e reticências (`...`), mantendo os botões contidos e alinhados.

---

## 📄 Páginas Institucionais & Transparência

As páginas de rodapé foram implementadas com layout nativo do BananaPrice e conectadas diretamente no `Footer.tsx`:

* **Termos de Uso (`/termos-de-uso`)**:
  * Esclarece o propósito do BananaPrice como ferramenta agregadora e comparadora independente de preços (não processamos pagamentos de chaves de jogos de terceiros).
* **Política de Privacidade (`/politica-de-privacidade`)**:
  * Detalha a coleta mínima de dados (cadastro, vínculo com Steam ID público sem senhas, histórico de buscas em `localStorage`) e conformidade com a LGPD.
* **Contato & API Pública (`/contato-api`)**:
  * **Origem dos Dados & IsThereAnyDeal**: Seção com badge ITAD explicando como as ofertas, histórico de preços e catálogo são alimentados pela API pública da [IsThereAnyDeal.com](https://isthereanydeal.com).
  * **E-mail Oficial**: `bananaprice.not@gmail.com`.
  * **Repositório Oficial**: Link direto para a comunidade e issues no GitHub ([https://github.com/Annagdy/BananaPrice](https://github.com/Annagdy/BananaPrice)).

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

1. **Responsividade no Celular**:
   * Abra as ferramentas do desenvolvedor no navegador (`F12`) e ative o modo responsivo/mobile (ex: iPhone, Pixel, Samsung Galaxy).
   * Verifique a **logo compacta**, a **lupa de busca** (clique para expandir com opções Nativa/IA) e o **menu de 3 linhas** (clique para abrir Notificações, Lista de Desejos e Conta).
   * Verifique a grade de jogos na home e catálogo: os cards agora renderizam em 2 colunas organizadas e com proporção adequada.
2. **Filtros em `/jogos`**:
   * No modo mobile, clique em **"Filtrar Ofertas e Categorias"** para abrir e recolher o painel de filtros.
3. **Lista de Desejos em `/lista-de-desejos`**:
   * Verifique se as imagens dos cards desejados estão em tamanho compacto (`88px`) e se a barra de paginação não vaza para fora da tela.
4. **Páginas Institucionais**:
   * No rodapé, clique nos links **Termos de Uso**, **Política de Privacidade** e **Contato & API Pública** para validar a navegação e o conteúdo sobre a API da IsThereAnyDeal.
