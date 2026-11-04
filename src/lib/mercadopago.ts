import { MercadoPagoConfig, Payment } from 'mercadopago'

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

if (!accessToken) {
  throw new Error(
    'MERCADO_PAGO_ACCESS_TOKEN não definida no .env.local. ' +
    'Acesse https://www.mercadopago.com.br/developers para obter suas credenciais.'
  )
}

const config = new MercadoPagoConfig({ accessToken })

export const paymentClient = new Payment(config)

export { config as mpConfig }

