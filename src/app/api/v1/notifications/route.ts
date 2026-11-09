import { supabase as supabaseAdmin } from '@/lib/supabase.ts'
import { enviarEmailAlertaPreco } from '@/lib/email'

export type CriarNotificacaoParams = {
  idUsuario: number
  idJogo?: number
  idLista?: number
  titulo: string
  mensagem: string
  preco?: number
  desconto?: number
  loja?: string
  enviarEmail?: boolean
}

export async function criarNotificacaoManual({
  idUsuario,
  idJogo,
  idLista,
  titulo,
  mensagem,
  preco = 0,
  desconto = 0,
  loja = 'Loja parceira',
  enviarEmail = true,
}: CriarNotificacaoParams) {
  // 1. Sempre cria a notificação in-app (Tabela `notificacao`)
  const { data: notificacao, error: errNotif } = await supabaseAdmin
    .from('notificacao')
    .insert({
      id_lista: idLista ?? null,
      id_jogo: idJogo ?? null,
      titulo,
      mensagem,
      preco,
      lida: false,
    })
    .select()
    .single()

  if (errNotif) {
    console.error('[services/notificacoes] Erro ao salvar notificação no BD:', errNotif)
    return { ok: false, erro: errNotif.message }
  }

  // 2. Busca o usuário no Supabase para verificar a preferência `notificar_email`
  const { data: usuario, error: errUser } = await supabaseAdmin
    .from('usuario')
    .select('email, nome_usuario, notificar_email')
    .eq('id_usuario', idUsuario)
    .single()

  if (errUser || !usuario) {
    console.warn(`[services/notificacoes] Usuário ${idUsuario} não encontrado para envio de e-mail.`)
    return { ok: true, emailEnviado: false, erroEmail: 'Usuário não encontrado' }
  }

  // 3. VALIDAÇÃO DE PREFERÊNCIA: Se notificar_email for FALSE, cancela o envio do e-mail
  if (!enviarEmail || !usuario.notificar_email) {
    console.log(
      `[services/notificacoes] E-mail BLOQUEADO para ${usuario.email}. Razão: notificar_email = ${usuario.notificar_email}`
    )
    return {
      ok: true,
      emailEnviado: false,
      erroEmail: 'Notificações por e-mail desativadas pelo usuário.',
      destinoEmail: usuario.email,
    }
  }

  // 4. Se notificar_email for TRUE, chama a função de e-mail já existente
  const urlApp = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const urlJogo = idJogo ? `${urlApp}/jogos/${idJogo}` : `${urlApp}/jogos`

  const resEmail = await enviarEmailAlertaPreco({
    para: usuario.email,
    nomeUsuario: usuario.nome_usuario || 'Gamer',
    tituloJogo: titulo,
    preco,
    desconto,
    loja,
    urlJogo,
  })

  return {
    ok: true,
    emailEnviado: resEmail.sucesso,
    erroEmail: resEmail.erro,
    destinoEmail: usuario.email,
  }
}