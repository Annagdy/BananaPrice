# Guia de Execução de Testes Automatizados - BananaPrice

Este documento descreve como rodar as suítes de testes do projeto baseadas nas ferramentas definidas nas Anotações de QA: Vitest, Playwright e pgTAP.

## Pré-requisitos
Certifique-se de que todas as dependências estão instaladas:
```bash
npm install
```

## 1. Testes Unitários e de Integração (Vitest + Testing Library)
Utilizados para testar componentes isolados, regras de negócio front-end (como localStorage) e hooks.

Para executar os testes unitários uma vez:
```bash
npm run test
# ou diretamente via npx:
npx vitest run
```

Para rodar os testes em modo "watch" (observação contínua durante o desenvolvimento):
```bash
npx vitest
```

## 2. Testes Ponta a Ponta - E2E (Playwright)
Utilizados para testar fluxos completos de navegação, busca de jogos, aplicação de filtros e responsividade.

Primeiro, instale os navegadores necessários para o Playwright (se for a primeira vez):
```bash
npx playwright install --with-deps
```

Para executar os testes E2E sem interface gráfica (modo headless, padrão em CI/CD):
```bash
npx playwright test
```

Para rodar os testes com a interface gráfica visível e depurador (excelente para visualizar o que está quebrando):
```bash
npx playwright test --ui
```