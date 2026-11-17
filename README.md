# BananaPrice

Plataforma de monitoramento e comparação de preços de jogos em tempo real (Steam, Nuuvem, Epic Games, GOG e outras lojas via IsThereAnyDeal), com busca instantânea via Trie, integração opcional com IA/Selenium, histórico de preços e alertas de wishlist.

---

## 🔍 Funcionalidades de Pesquisa & Filtros

* **Pesquisa Nativa (Trie)**:
  * Busca instantânea por prefixo em memória via árvore Trie (`src/lib/trieSearch.tsx`), operando diretamente no catálogo sem latência de raspagem externa.
  * **Histórico de Buscas Recentes**: Salva termos pesquisados no `localStorage` e exibe um menu dropdown moderno com opção de busca rápida ou remoção de itens.
  * **Autocomplete nativo desativado**: Previne que o histórico feio do próprio navegador cubra a interface.
* **Pesquisa com IA / Selenium**:
  * Modo alternativo com raspagem inteligente e modelos de linguagem para descoberta dinâmica de títulos e ofertas.
* **Filtros e Exclusões Inteligentes**:
  * **Consoles e Gift Cards**: Por padrão, itens de hardware, acessórios e cartões presente (ex.: *PlayStation Gift Card, Xbox Series X, DualSense, Steam Deck*) são ocultados dos resultados para priorizar jogos.
  * **Filtro "Consoles & Gift Cards"**: Disponível na barra lateral de filtros (seção "Outros") para os usuários que desejam visualizar esses itens especificamente.
  * **Filtro +18 (Adulto)**: Controle para jogos com conteúdo adulto / NSFW.

---

## 📚 Documentação do Código (TSDoc & Gerador de Docs)

Todo o ecossistema de funções, tipos e componentes do projeto possui documentação estruturada no padrão TSDoc (`/** ... */`).

Para gerar a documentação interativa em HTML com o tema do BananaPrice:

```bash
# Opção 1: Via script npm
npm run docs

# Opção 2: Diretamente via tsx
npx tsx scripts/gerarDocs.ts
```

O script varre `src/services/`, `src/lib/`, `src/components/`, `src/types/` e `src/app/api/`, gerando:
* `docs/index.html`: Portal estático de documentação com busca instantânea por funções, rotas, tipos e filtros por módulo.
* `docs/docs.json`: Estrutura de dados com todas as assinaturas, parâmetros, retornos e docstrings compiladas.

Para visualizar no navegador:
* Dê duplo clique no arquivo `docs/index.html` ou abra pelo navegador (`file:///c:/.../BananaPrice/docs/index.html`).
* Ou execute um servidor local de arquivos: `npx serve docs`.

---

## ⏱️ Sincronização Automática de Preços (Cron Jobs)

O projeto possui rotas e scripts dedicados para manter o histórico de preços atualizado automaticamente:

* **Endpoint Cron**: `src/app/api/cron/sync-prices/route.ts` (`GET /api/cron/sync-prices`).
  * Atualiza os preços dos jogos monitorados e envia e-mails de alerta para os usuários caso o jogo tenha atingido o menor preço histórico ou o valor desejado na wishlist.
  * **Autenticação**: Requer o header `Authorization: Bearer <CRON_SECRET>` para evitar chamadas indevidas.
* **Script de Execução Manual/Independente**:
  * `scripts/syncPrecosWishlist.ts`: Pode ser executado em linha de comando ou via cron nativo do Linux (crontab).

---

## 🌐 Guia de Deploy na VPS Contabo (Ubuntu / Debian)

A VPS de entrada da Contabo (~€4 a €5/mês) oferece excelente custo-benefício (geralmente 4 vCPUs e 6 a 8 GB de RAM). A seguir está o passo a passo completo para colocar o BananaPrice no ar com **Node.js, PM2, Nginx, SSL grátis (Certbot)** e **atualização de preços via crontab**.

### 1. Acesso e Preparação do Servidor
Acesse a VPS via SSH pelo seu terminal:
```bash
ssh root@SEU_IP_CONTABO
```

Atualize os pacotes do sistema:
```bash
apt update && apt upgrade -y
apt install -y git curl nginx ufw
```

### 2. Configurar o Firewall (UFW)
```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

### 3. Instalar Node.js (v20 LTS ou v22 LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2
```

### 4. Clonar o Repositório e Configurar Variáveis
Navegue para a pasta `/var/www` e clone o projeto:
```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/SEU_USUARIO/BananaPrice.git bananaprice
cd bananaprice
```

Crie o arquivo de variáveis de produção:
```bash
nano .env.local
```
Cole suas chaves de produção:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=https://seudominio.com

STEAM_API_KEY=sua_chave_steam
ITAD_API_KEY=sua_chave_itad

# Segredo de proteção do cron
CRON_SECRET=um_token_longo_e_seguro_aqui

# SMTP para envio de alertas por e-mail
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=
# SMTP_FROM="BananaPrice <alertas@seudominio.com>"
```
Pressione `Ctrl + O`, `Enter` para salvar e `Ctrl + X` para sair.

### 5. Instalar Dependências e Fazer o Build
```bash
npm install
npm run build
```

### 6. Executar o Projeto com PM2
Inicie a aplicação Next.js gerenciada pelo PM2 para que ela reinicie automaticamente em caso de falhas ou reinício da VPS:
```bash
pm2 start npm --name "bananaprice" -- start
pm2 save
pm2 startup
```
*(Execute o comando que o `pm2 startup` exibir no terminal para fixar na inicialização do sistema).*

### 7. Configurar o Nginx (Proxy Reverso)
Crie a configuração do site no Nginx:
```bash
nano /etc/nginx/sites-available/bananaprice
```

Insira o conteúdo abaixo (substitua `seudominio.com` pelo seu domínio ou pelo IP da VPS):
```nginx
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ative o site e reinicie o Nginx:
```bash
ln -s /etc/nginx/sites-available/bananaprice /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

### 8. Configurar SSL Grátis (HTTPS) com Certbot (Opcional, com Domínio)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d seudominio.com -d www.seudominio.com
```

### 9. Configurar o Cron na Contabo para Atualização Automática de Preços
Na VPS, o agendamento de sincronização roda nativamente pelo `cron` do Linux.

Abra a tabela de agendamentos:
```bash
crontab -e
```

Adicione uma das opções no final do arquivo:

**Opção A (Recomendada - chama o endpoint HTTP com o secret):**
Executa a cada 4 horas:
```cron
0 */4 * * * curl -X GET -H "Authorization: Bearer um_token_longo_e_seguro_aqui" http://localhost:3000/api/cron/sync-prices >> /var/log/bananaprice-cron.log 2>&1
```

**Opção B (Executa o script TypeScript diretamente via tsx):**
```cron
0 */4 * * * cd /var/www/bananaprice && /usr/bin/npx tsx scripts/syncPrecosWishlist.ts >> /var/log/bananaprice-cron.log 2>&1
```

Para verificar se o log está rodando:
```bash
cat /var/log/bananaprice-cron.log
```

---

## 🚀 Como Rodar Localmente (Desenvolvimento)

### 1. Instalar as dependências:
```bash
npm install
```

### 2. Configurar o `.env.local`:
Preencha as variáveis de ambiente descritas acima.

### 3. Banco de Dados:
Aplique as migrações localizadas em `supabase/migrations` através do painel do Supabase ou CLI.

### 4. Iniciar o servidor de desenvolvimento:
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000).

---

## 🧪 Como Testar

1. **Pesquisa Padrão (Trie) & Buscas Recentes**:
   * Digite o nome de um jogo na barra superior.
   * Pressione Enter para realizar a busca.
   * Clique novamente no campo de busca para verificar o popover estilizado com o histórico de buscas recentes.
2. **Filtro de Consoles e Hardware**:
   * Pesquise termos como `gift card`, `ps5` ou `steam deck`. Observe que jogos são priorizados e itens de hardware ficam ocultos por padrão.
   * Vá em `/jogos`, expanda a seção **Outros** nos filtros laterais e marque **Consoles & Gift Cards** para ver os itens listados.
3. **Gerador de Documentação**:
   * Execute `npm run docs` e abra `docs/index.html` para consultar as funções e módulos documentados.

---

## 💡 Dicas e Soluções de Problemas
* **Cache do Next.js / Turbopack**: Se alterações em componentes globais não refletirem imediatamente em desenvolvimento:
  1. Pare o servidor (`Ctrl + C`).
  2. Remova a pasta `.next` (`rm -rf .next` ou no PowerShell `Remove-Item -Recurse -Force .next`).
  3. Reinicie com `npm run dev` e use `Ctrl + F5` no navegador.
