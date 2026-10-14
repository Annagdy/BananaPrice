/* Liga/desliga a busca de gênero durante a importação de jogos.

A API ITAD só dá o gênero (tags) no endpoint '/games/info/v2', que responde apenas um jogo por vez, 
ou seja 1 requisição extra por jogo novo (jogos que já têm gênero salvo não são buscados de novo).
Com o limite de 1000 requisições/5min da API, preencher o catálogo inteiro pela primeira vez pode demorar muito.

'true': busca gênero de todo jogo novo.
'false': pula a busca de gênero, deixando a coluna 'null'.

*/
export const BUSCAR_GENERO = true;

/* Limite de quantos jogos importar numa execução do script.

A API tem por volta de 500.000 jogos no catálogo. Para testar sem rodar tudo de uma vez, é definido um número aqui,
o script para assim que atingir esse total, mesmo no meio de uma página.

'null': para não ter limite e importar o catálogo inteiro.

*/
export const LIMITE_JOGOS: number | null = 500;