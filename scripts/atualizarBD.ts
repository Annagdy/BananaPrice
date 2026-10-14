import { buscarPaginaJogos, buscarPrecosLote } from "../src/lib/itad.ts";
import { salvarJogos } from "../src/services/jogos";
import { salvarPrecos } from "../src/services/precos";
import { LIMITE_JOGOS } from "../src/lib/config";

// Importar "../src/lib/supabase" (via services/jogos e services/precos) já carrega o .env e valida as variáveis de ambiente antes de qualquer chamada à API ser feita.

/*Função principal: percorre o catálogo inteiro da API em páginas de até 10.000 jogos, salvando cada página no Supabase (jogos e depois
preços) antes de buscar a próxima.

Para de buscar novas páginas quando:
- a API devolve uma página vazia;
- 'LIMITE_JOGOS' é atingido;
- a página recebida tem menos de 10.000 jogos.

Execução única, termina sozinho ao final. Para de manter os preços atualizados ao longo do tempo

*/
async function buscarJogos() {

    console.log("Conectado ao Supabase!");

    try {

        let ultimoId: string | undefined = undefined;

        let totalJogos = 0;

        while (true) {

            let jogos = await buscarPaginaJogos(ultimoId);

            console.log(
                `Recebidos nesta página: ${jogos.length}`
            );

            if (jogos.length === 0) {
                break;
            }

            // Respeita limite, corta página se precisar

            if (
                LIMITE_JOGOS !== null &&
                totalJogos + jogos.length > LIMITE_JOGOS
            ) {

                jogos = jogos.slice(0, LIMITE_JOGOS - totalJogos);

                console.log(
                    `Cortando página para respeitar o limite de ` +
                    `${LIMITE_JOGOS} jogos (pegando ${jogos.length} ` +
                    `desta página).`
                );
            }

            totalJogos += jogos.length;

            console.log(
                `Total processado até agora: ${totalJogos}`
            );

            // Salva jogos no Supabase (lote de 500 em 500)

            console.log('Salvando jogos no banco...');

            const tamanhoLoteJogos = 500;

            const mapaJogosDaPagina = new Map<string, number>();

            for (let i = 0; i < jogos.length; i += tamanhoLoteJogos) {

                const lote = jogos.slice(i, i + tamanhoLoteJogos);

                const mapaLote = await salvarJogos(lote);

                for (const [itadId, idJogo] of mapaLote) {
                    mapaJogosDaPagina.set(itadId, idJogo);
                }

                console.log(
                    `Jogos salvos: ${Math.min(
                        i + lote.length,
                        jogos.length
                    )}/${jogos.length}`
                );
            }

            console.log('Jogos desta página salvos');

           // Consulta preços em lotes de 200

            const tamanhoLote = 200;

            for (let inicio = 0; inicio < jogos.length; inicio += tamanhoLote) {

                const lote = jogos.slice(inicio, inicio + tamanhoLote);
                const fim = inicio + lote.length;

                console.log(`Lote de preços: ${inicio + 1} até ${fim}`);

                const ids = lote.map((jogo: any) => jogo.id);

                // Se der 429, buscarPrecosLote espera e repete o MESMO lote.
                const resultados = await buscarPrecosLote(
                    ids,
                    inicio + 1,
                    fim
                );

                await salvarPrecos(resultados, mapaJogosDaPagina);

                console.log(
                    `Lote concluído: ${fim}/${jogos.length}`
                );
            }

           // Controle de paginação

            ultimoId = jogos[jogos.length - 1].id;

            console.log("");
            console.log(`Último ID processado: ${ultimoId}`);

            if (LIMITE_JOGOS !== null && totalJogos >= LIMITE_JOGOS) {
                console.log("");
                console.log(`Limite de ${LIMITE_JOGOS} jogos atingido.`);
                break;
            }

            if (jogos.length < 10000) {
                console.log("");
                console.log("Última página encontrada.");
                break;
            }

            console.log("");
            console.log("Página concluída. Buscando próxima...");
        }

        console.log('Importação concluída');
        console.log(`Total de jogos processados: ${totalJogos}`);

    } catch (erro: any) {

        console.log('Erro geral');
        console.log(erro.response?.data ?? erro.message ?? erro);
    }
}

buscarJogos();
