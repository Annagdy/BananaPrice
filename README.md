# BananaPrice: Sistema de Notificações e Alertas por E-mail

Sistema responsável por monitorar flutuações nos preços de jogos, registrar históricos e notificar os usuários via e-mail (SMTP/Google) e interface sempre que uma oferta relevante é detectada na wishlist.

## Rotas implementadas

| Método | Rota | O que faz | RF |
|---|---|---|---|
| `GET` | `/api/v1/games/[id]` | Consulta o jogo, aciona a atualização de preços assíncrona e retorna ofertas atuais. | RF01 |
| `GET` | `/api/v1/games/[id]/history` | Retorna o histórico de preços agrupado por loja em séries temporais para o gráfico. | RF09 |
| `GET/POST` | `/api/v1/wishlist` | Gerencia a lista de desejos do usuário autenticado. | RF05 |
| `GET` | `/api/v1/notifications` | Lista as notificações de queda de preço pendentes e lidas do usuário. | RF06 |

### Comportamento de Notificações

- **Critério de Disparo:** A notificação é gerada se o novo valor for menor que o preço anterior guardado (`menorNovoValor < menorAnterior`) OU se houver um aumento de desconto substancial (`maiorDesconto >= 10%`).
- **Antispam / Rate Limiting:** Atualizações com variações irrelevantes (menos de 10% de desconto adicional ou preços sem redução) não geram disparos de e-mail.
- **Assincronismo:** O envio de e-mails é executado em segundo plano (`.catch()`), garantindo que falhas no provedor SMTP não afetem o tempo de resposta das requisições para o usuário.

### Fluxo

1. **Gatilho de Acesso:** O usuário abre a página do jogo `/jogo/[id]`.
2. **Atualização ITAD:** A função `atualizarPrecosDoJogo` faz o fetch das ofertas via API do IsThereAnyDeal.
3. **Comparação de Histórico:** O sistema busca o menor preço anterior registrado em `preco_jogo` e persiste o novo valor no histórico.
4. **Disparo de Alerta:** Caso seja identificada uma queda de preço válida:
   - A função `notificarQuedaDePreco` identifica todos os usuários com o jogo na wishlist.
   - O serviço `enviarEmailAlertaPreco` monta o HTML e realiza o disparo transacional via SMTP do Gmail.
   - Uma notificação in-app é gravada no Supabase para visualização na central de notificações.
5. **Onboarding / Fluxo Steam:** Caso um usuário faça login via Steam (que não retorna e-mail por padrão), o middleware/proxy o redireciona para `/completar-cadastro` para vincular e-mail e senha antes de receber alertas.

- Cards de Jogos: Foi adicionada uma lógica para buscar e exibir as capas/imagens oficiais dos jogos diretamente nos cards.

- Disparo automático via Cron Job agendado (atualmente a atualização depende da navegação do usuário).
- Fila de mensageria (ex: Redis/BullMQ) para processamento em lotes (*bulk mail*) de grandes bases de usuários.

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

   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=seuemail@gmail.com
   SMTP_PASS=sua_senha_de_aplicativo
   SMTP_FROM=BananaPrice <seuemail@gmail.com>
   ```
3. Aplique as mudanças do banco (migration em supabase/migrations ou pelo SQL Editor do Supabase).
4. Rode:
   ```bash
   npm run dev
   ```

## Como Testar
- Teste Unitário de E-mail: Crie uma rota temporária app/api/teste-email/route.ts chamando enviarEmailAlertaPreco para validar o recebimento da mensagem formatada na caixa de entrada.

- Teste do Fluxo de Queda de Preço:

1. Adicione um jogo à wishlist da sua conta de teste.

2. No painel do Supabase, altere manualmente o valor na tabela preco_jogo desse jogo para um valor alto (ex: R$ 200,00).

3. Crie um mock do ITAD com preço menor (ex: R$ 99,90) e execute a função atualizarPrecosDoJogo.

4. Verifique no console do servidor o log de sucesso e confirme o recebimento do e-mail.

- Teste de Login Steam sem E-mail: Faça login com uma conta Steam nova e certifique-se de que o middleware redireciona obrigatoriamente para a rota /completar-cadastro.

## Pendências Conhecidas
- Limite da Conta Gmail: O uso do SMTP gratuito do Google restringe o volume a ~500 e-mails por dia.

- Single Point History: Jogos sem alteração de preço nos últimos 90 dias exigem duplicação visual do primeiro ponto no histórico para permitir a renderização da linha reta nos gráficos.
