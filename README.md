# BananaPrice - Rotas
Esta branch introduz a estrutura inicial do backend, organização de todas as rotas de API e de páginas previstas no projeto, com os arquivos criados como *stubs* (assinatura e local corretos, sem lógica implementada ainda). A implementação de cada rota será feita em PRs subsequentes, um por grupo de funcionalidade, referenciando *issues* correspondentes.

## Adições/Mudanças da Estrutura desta Branch
```text
src/app/
├── page.tsx                          # /
├── login/page.tsx
├── cadastro/page.tsx
├── jogos/
│   ├── page.tsx                      # /jogos (catálogo)
│   └── [id]/page.tsx                 # /jogos/[id] (detalhe)
├── conta/page.tsx
├── notificacoes/page.tsx
├── turbo/
│   ├── [gameId]/page.tsx             # checkout
│   └── sucesso/page.tsx
└── api/
    ├── v1/
    │   ├── auth/
    │   │   ├── register/route.ts
    │   │   ├── login/route.ts
    │   │   └── steam/
    │   │       ├── route.ts
    │   │       └── callback/route.ts
    │   ├── games/
    │   │   ├── route.ts
    │   │   └── [id]/
    │   │       ├── route.ts
    │   │       └── history/route.ts
    │   ├── wishlist/
    │   │   ├── route.ts
    │   │   └── [gameId]/route.ts
    │   ├── notifications/route.ts
    │   ├── highlights/
    │   │   ├── route.ts
    │   │   └── active/route.ts
    │   ├── payments/
    │   │   └── pix/route.ts
    │   └── webhooks/
    │       └── pix/route.ts
    └── cron/
        └── sync-prices/route.ts
```

## Explicação das rotas
### Rotas de API
| Método | Rota | Descrição | RF |
| -- | -- | -- | -- |
| POST | /api/v1/auth/register | Cadastro por e-mail | RF02 |
| POST | /api/v1/auth/login | Login por e-mail | RF03 |
| GET | /api/v1/auth/steam | Inicia OAuth com a Steam | RF04 |
| GET | /api/v1/auth/steam/callback | Callback do OAuth, importa wishlist | RF04, RF05 |
| GET | /api/v1/games | Busca/catálogo com filtros (?search=&price=&discount=&store=) | RF06 |
| GET | /api/v1/games/[id] | Detalhe do jogo + comparação de preços + melhor oferta | RF07, RF08 |
| GET | /api/v1/games/[id]/history | Histórico de preços (gráfico) | RF09 |
| GET | /api/v1/wishlist | Lista a wishlist do usuário logado | RF10 |
| POST | /api/v1/wishlist | Adiciona jogo à wishlist | RF10 |
| DELETE | /api/v1/wishlist/[gameId] | Remove jogo da wishlist | RF10 |
| GET | /api/v1/notifications | Lista notificações do usuário | RF11 |
| POST | /api/v1/highlights | Solicita destaque (gera registro pendente) | RF12 |
| GET | /api/v1/highlights/active | Jogos ativos no carrossel (home consome isso) | RF12 |
| POST | /api/v1/payments/pix | Gera cobrança Pix (QR Code + copia-e-cola) | RF13 |
| POST | /api/v1/webhooks/pix | Recebe confirmação do gateway | RF14 |
| GET/POST | /api/cron/sync-prices | Job agendado de ingestão (chamado por cron externo, não pelo usuário) | RNF01 |

### Rotas de páginas (telas do protótipo)
| Rota | Tela correspondente |
| -- | -- |
| / | Home (vitrine turbo, ofertas, grátis - visitante ou logado) |
| /login | Login (e-mail ou Steam) |
| /cadastro | Criar conta |
| /jogos | Catálogo com painel de filtros |
| /jogos/[id] | Detalhe do jogo + comparação + histórico |
| /conta | Gerenciamento de conta |
| /notificacoes | Central de notificações |
| /turbo/[gameId] | Checkout do impulsionamento (Pix) |
| /turbo/sucesso | Confirmação de pagamento |

## Próximos passos

- [ ] Implementar lógica das rotas de autenticação (#7)
- [ ] Implementar rotas de jogos/busca, dependendo do schema do Supabase (#6)
- [ ] Implementar wishlist e notificações
- [ ] Implementar fluxo de pagamento Pix + webhook
- [ ] Criar `middleware.ts` para proteger rotas que exigem login