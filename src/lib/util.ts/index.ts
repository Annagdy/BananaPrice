/**
 * Pausa a execução pelo tempo informado.
 *
 * Usado para esperar entre tentativas, tanto em limites de requisição (rate limits) quanto em falhas transitórias de rede.
 *
 * @param ms Tempo de espera, em milissegundos.
 * @returns Promessa resolvida após o intervalo estipulado.
 */
export function esperar(ms: number): Promise<void> {

    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );
}