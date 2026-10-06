/* Pausa a execução do tempo informado.

Usado para esperar entre tentativas, tanto em limites de requisição quanto em falhas de rede.

@param ms Tempo de espera, em milissegundos.

*/
export function esperar(ms: number): Promise<void> {

    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );
}