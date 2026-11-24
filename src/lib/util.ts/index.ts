/**
 * Pausa a execução pelo tempo informado. | Pauses execution for the given amount of time.
 *
 * Usado para esperar entre tentativas, tanto em limites de requisição (rate limits) quanto em falhas transitórias de rede.
 * | Used to wait between attempts, both for rate limits and for transient network failures.
 *
 * @param ms Tempo de espera, em milissegundos. | Wait time, in milliseconds.
 * @returns Promessa resolvida após o intervalo estipulado. | Promise resolved after the stipulated interval.
 */
export function esperar(ms: number): Promise<void> {

    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );
}