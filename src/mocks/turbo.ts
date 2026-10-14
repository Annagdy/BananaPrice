// Dados de exemplo da tela /turbo/[gameId]. Trocar pelas APIs:
//   jogo  -> /api/v1/games/[id]
//   pix   -> /api/v1/payment/pix
export type JogoTurbo = {
  nome: string
  loja: string
  precoOriginal: number
  precoComDesconto: number
  desconto: number // em %
  capa: string | null // null = usa a capa de exemplo (components/assets)
}

export const JOGO_EXEMPLO: JogoTurbo = {
  nome: 'Game Name',
  loja: 'Store',
  precoOriginal: 100,
  precoComDesconto: 60,
  desconto: 40,
  capa: null,
}

export const PIX_COPIA_E_COLA = 'ASLKDJ0192838100S2000000000000000000000000000000000000000000'
export const PIX_QR_CODE: string | null = null // data URL ou URL da imagem do QR Code
export const VALOR_TURBO = 4
export const TEMPO_TOTAL = 10 * 60 // segundos
