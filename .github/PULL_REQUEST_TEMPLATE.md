# Estruturação para Descrição de um Pull Request
Todo novo Pull Request criada deve seguir este padrão simples:

## Tipo de Alteração

Marque com um **X** a opção que melhor descreve suas alterações:

- [ ] `feat:` Nova funcionalidade
- [ ] `fix:` Correção de bug
- [ ] `docs:` Alteração na documentação

## Issue Relacionada

Relacionado à Issue #
*(Exemplo: Relacionado à Issue #6)*

## Descrição do Pull Request

Descreva de forma clara e sucinta o que foi feito nesta branch e o motivo dessa alteração.

### O que foi implementado/alterado:
- [ ] Item 1
- [ ] Item 2

## Como Testar

Passo a passo para que os outros membros da equipe validem as alterações localmente:

1. Atualize sua branch local e mude para esta: 
   ```bash
   git checkout feature/nome-da-branch
    ```
2. Inicie a instância local do banco (se houver migrações novas):
    ```bash
    npx supabase db reset
    ```
3. Execute o projeto localmente:
    ```bash
    npm run dev
    ```
4. Acesse a rota ou funcionalidade em http://localhost:3000/... e faça o teste.

## Evidências (Opcional)
Insira imagens, GIFs da interface ou prints das respostas de APIs/banco que ajudem a validar o funcionamento.