# BananaPrice - Supabase (Banco de Dados)
Esta branch introduz a estrutura inicial do banco de dados PostgreSQL no Supabase, integrações externas (ITAD), serviços para manipulação de jogos/preços e o script de sincronização de dados iniciais.

## Tecnologias Utilizadas
- **Frontend/Framework:** Next.js (TypeScript)
- **Banco de Dados:** Supabase (PostgreSQL)
- **APIs Externas:** IsThereAnyDeal (ITAD) API
- **Execução de Scripts:** tsx / Node.js

## Adições/Mudanças da Estrutura desta Branch
- `scripts/atualizarBD.ts`: Script de linha de comando para atualização e população da base.
- `src/lib/`: Módulos de conexão do Supabase (`supabase.ts`), configurações (`config.ts`), e integrações (`itad.ts`).
- `src/services/`: Serviços com regras de negócio para jogos (`jogos.ts`) e preços (`precos.ts`).
- `src/types/`: Interfaces TypeScript para tipagem (`jogo.ts`, `loja.ts`, `preco.ts`).
- `supabase/schemas/`: Schemas SQL para criação de tabelas e políticas de segurança.

## Como Configurar
### 1. Pré-requisitos
- Node.js instalado (v18 ou superior)
- O projeto ativo no Supabase (CLI para Docker)

### 2. Clonar a branch e instalar as dependências
```bash
git checkout feature/6-supabase-schemas-script
npm install
```

### 3. Configurar Variáveis de Ambiente
Crie o arquivo .env.local para o Next.js na raiz do projeto com base no arquivo de exemplo:
```bash
cp .env.local.example .env.local
```
Preencha o arquivo com as credenciais do seu projeto Supabase:
```bash
# Supabase
SUPABASE_URL="https://seu-projeto.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="sua_chave_service_role_aqui"

# APIs de Terceiros
ITAD_API_KEY="sua_chave_itad_aqui"
```

## Configuração do Banco de Dados (Supabase)
Antes de rodar a aplicação ou os scripts, execute as queries contidas na pasta supabase/schemas/ no SQL Editor do Supabase na seguinte sequência recomendada:
1. usuario.sql
2. conta_steam.sql
3. jogo.sql
4. loja.sql
5. preco_jogo.sql
6. preco_historico.sql
7. lista_desejo.sql
8. lista_jogo.sql
9. notificacao.sql
10. row_level.sql (Configuração das políticas de segurança RLS)   

## Como Rodar
### Rodar o Script de Atualização do Banco (Jogos/Preços)
Para executar o script de carga/sincronização de jogos no Supabase:
```bash
npx tsx scripts/atualizarBD.ts
```
Se estiver no Windows (PowerShell) e enfrentar erro de DNS/fetch no Node, rode:
```bash
$env:NODE_OPTIONS="--dns-result-order=ipv4first"; npx tsx scripts/atualizarBD.ts
```