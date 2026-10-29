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
  <div style="font-family: Arial, sans-serif; background-color: #1a1614; color: #f5eedb; padding: 32px 24px; border-radius: 16px; max-width: 600px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
    
    <div style="text-align: center; padding-bottom: 16px; border-bottom: 1px solid #3d322e;">
      <h1 style="color: #f7b731; margin: 0; font-size: 28px; font-weight: 800;">🍌 BananaPrice</h1>
    </div>

    <div style="padding: 24px 0;">
      <h2 style="color: #ffffff; font-size: 22px; margin-top: 0;">🔥 O preço caiu!</h2>
      <p style="font-size: 15px; color: #d0c7b7; line-height: 1.6;">
        Olá, <strong>${nomeUsuario}</strong>!
      </p>
      <p style="font-size: 15px; color: #d0c7b7; line-height: 1.6;">
        O jogo <strong>${tituloJogo}</strong>, que está na sua Lista de Desejos, acabou de receber uma nova oferta especial:
      </p>

      <div style="background-color: #2b221e; border: 1px solid #3d322e; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #a89f8d;">
          Loja: <strong style="color: #ffffff;">${loja}</strong>
        </p>
        <p style="margin: 12px 0 0 0; font-size: 28px; font-weight: bold; color: #f7b731; display: flex; align-items: center;">
          ${precoFormatado}
          ${
            desconto > 0 
              ? `<span style="font-size: 14px; background-color: #f7b731; color: #1a1614; padding: 3px 8px; border-radius: 6px; margin-left: 10px; font-weight: bold;">-${desconto}% OFF</span>` 
              : ''
          }
        </p>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${urlJogo}" style="display: inline-block; background-color: #f7b731; color: #1a1614; text-decoration: none; font-weight: bold; font-size: 16px; padding: 14px 32px; border-radius: 10px; transition: background-color 0.2s;">
          Ver Oferta no BananaPrice
        </a>
      </div>
    </div>

    <div style="border-top: 1px solid #3d322e; padding-top: 16px; text-align: center;">
      <p style="font-size: 12px; color: #887d6d; margin: 0; line-height: 1.5;">
        Você está recebendo este e-mail porque cadastrou <strong>${tituloJogo}</strong> na sua lista de desejos.<br>
        Para gerenciar seus alertas, acesse sua conta no BananaPrice.
      </p>
    </div>

  </div>
`;

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
