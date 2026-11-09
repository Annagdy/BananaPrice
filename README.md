# BananaPrice: Ajustes de Front (Tags/Filtros), Visual Mais Suave e Pesquisa via Trie com Opção Selenium + IA

Foi realizado o ajuste do front-end, com melhorias nas **tags** e nos **filtros** e uma aparência mais suave em toda a interface. Além disso, foi adicionada a **pesquisa via Trie** e o usuário agora pode escolher entre dois modos de pesquisa: o **padrão/nativo (Trie)** ou a pesquisa **via Selenium com IA**.

---

### Comportamento de Pesquisa

* **Pesquisa padrão/nativa (Trie)**: Busca baseada em uma estrutura de árvore Trie, com resposta rápida por prefixo diretamente sobre os dados já disponíveis, sem depender de raspagem externa.
* **Pesquisa via Selenium com IA**: Raspagem de dados integrada com modelos GPT para parsing e extração inteligente de títulos, promoções e identificadores ITAD/Steam.
* **Escolha do usuário**: O usuário seleciona na interface qual modo prefere utilizar, Trie (padrão) ou Selenium com IA.

---

### Comportamento do Front

* **Tags e filtros**: Ajustados para ficarem mais consistentes e claros, refletindo corretamente o estado de seleção.
* **Aparência mais suave**: Refinamento visual da interface, com transições e estilos mais leves.

---

### Fluxo

1. **Escolha do modo**: O usuário define se a pesquisa será feita pelo modo padrão (Trie) ou via Selenium com IA.
2. **Pesquisa**: O termo digitado é processado pelo modo escolhido e os resultados são exibidos no catálogo.
3. **Refinamento**: O usuário pode refinar os resultados usando as tags e os filtros.

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
1. Testar a pesquisa padrão (Trie):
   - Selecione o modo padrão de pesquisa.
   - Digite o início do nome de um jogo e verifique se os resultados correspondentes aparecem.

2. Testar a pesquisa via Selenium com IA:
   - Alterne para o modo Selenium com IA.
   - Pesquise um jogo e verifique se os resultados são retornados com título, promoção e identificadores corretos.

3. Testar tags e filtros:
   - Selecione e desmarque tags e filtros na página de jogos.
   - Confirme que o estado de seleção é exibido corretamente e que os resultados são filtrados.

4. Testar a aparência:
   - Navegue pelas páginas e verifique a aparência mais suave dos elementos, como transições e estilos de tags e filtros.

## Pendências e Bugs Conhecidos
1. Cache HMR do Next.js: Em ambiente de desenvolvimento, alterações estruturais em componentes compartilhados podem exigir a limpeza manual do cache local. Se as alterações não renderizarem:
   - Interrompa o servidor (Ctrl + C).
   - Apague a pasta .next (rm -rf .next ou Remove-Item -Recurse -Force .next).
   - Execute npm run dev e aplique um Hard Refresh no navegador (Ctrl + Shift + R).