import nodemailer from 'nodemailer'

/* Configura transporter SMTP caso as variáveis estejam definidas no ambiente (.env / .env.local). */
function criarTransporter() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  })
}

export type EmailNotificacaoParams = {
  para: string
  nomeUsuario: string
  tituloJogo: string
  preco: number
  desconto?: number
  loja?: string
  urlJogo: string
}

/* Envia e-mail de alerta de preço para o usuário.
Devolve status de sucesso e detalhes em caso de falha para facilitar diagnóstico. */
export async function enviarEmailAlertaPreco({
  para,
  nomeUsuario,
  tituloJogo,
  preco,
  desconto = 0,
  loja = 'Loja parceira',
  urlJogo,
}: EmailNotificacaoParams): Promise<{ sucesso: boolean; erro?: string; messageId?: string }> {
  const transporter = criarTransporter()

  if (!transporter) {
    const aviso = 'SMTP_HOST, SMTP_USER ou SMTP_PASS não configurados no .env.local'
    console.warn(`[lib/email] ${aviso}. E-mail para "${para}" não foi enviado.`)
    return { sucesso: false, erro: aviso }
  }

  const precoFormatado = preco.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  const assunto = `🍌 BananaPrice: ${tituloJogo} está por ${precoFormatado}!`
  const texto = `Olá, ${nomeUsuario}!\n\nO jogo "${tituloJogo}", que está na sua lista de desejos, teve uma redução de preço!\nPreço atual: ${precoFormatado}${desconto > 0 ? ` (${desconto}% OFF)` : ''} na ${loja}.\n\nAcesse: ${urlJogo}\n\nAtenciosamente,\nEquipe BananaPrice`

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #1a1614; color: #f5eedb; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #f7b731; margin-bottom: 8px;">🍌 BananaPrice</h1>
      <h2 style="color: #ffffff; font-size: 20px;">O preço caiu!</h2>
      <p style="font-size: 16px; color: #d0c7b7;">Olá, <strong>${nomeUsuario}</strong>,</p>
      <p style="font-size: 15px; color: #d0c7b7;">O jogo <strong>${tituloJogo}</strong> que está na sua Lista de Desejos recebeu uma nova oferta especial:</p>
      
      <div style="background-color: #2b221e; border: 1px solid #3d322e; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #a89f8d;">Loja: <strong style="color: #ffffff;">${loja}</strong></p>
        <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: bold; color: #f7b731;">
          ${precoFormatado}
          ${desconto > 0 ? `<span style="font-size: 14px; background-color: #f7b731; color: #1a1614; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">-${desconto}%</span>` : ''}
        </p>
      </div>

      <a href="${urlJogo}" style="display: inline-block; background-color: #f7b731; color: #1a1614; text-decoration: none; font-weight: bold; padding: 12px 24px; border-radius: 8px; margin-top: 10px;">
        Ver Oferta no BananaPrice
      </a>

      <p style="font-size: 12px; color: #887d6d; margin-top: 28px; border-top: 1px solid #3d322e; padding-top: 12px;">
        Você está recebendo este e-mail porque cadastrou ${tituloJogo} na sua lista de desejos e optou por receber alertas. Para alterar suas preferências, acesse sua conta no BananaPrice.
      </p>
    </div>
  `

  const remetente = process.env.SMTP_FROM || 'BananaPrice <onboarding@resend.dev>'

  try {
    console.log(`[lib/email] Disparando e-mail para ${para} via ${process.env.SMTP_HOST}...`)
    const info = await transporter.sendMail({
      from: remetente,
      to: para,
      subject: assunto,
      text: texto,
      html,
    })
    console.log(`[lib/email] E-mail de alerta enviado com sucesso para ${para}! MessageId:`, info.messageId)
    return { sucesso: true, messageId: info.messageId }
  } catch (error: any) {
    const detalheErro = error?.response || error?.message || 'Erro desconhecido ao enviar e-mail'
    console.error(`[lib/email] Erro detalhado ao enviar e-mail para ${para}:`, {
      mensagem: error?.message,
      codigo: error?.code,
      resposta: error?.response,
    })
    return { sucesso: false, erro: String(detalheErro) }
  }
}
