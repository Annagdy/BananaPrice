import { supabase as supabaseAdmin } from '@/lib/supabase.ts'
import { urlCapaItad } from '@/lib/itad.ts'
import { enviarEmailAlertaPreco } from '@/lib/email'

export type NotificacaoFormatada = {
  id: number
  idJogo: number
  titulo: string
  descricao: string
  capa: string | null
  preco: number | null
  desconto: number | null
  loja: string | null
  lida: boolean
  criadoEm: string
  url: string
}

const brl = (valor: number): string =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/* Busca ou cria o id_lista pertencente ao usuário. */
export async function obterOuCriarListaUsuario(idUsuario: number): Promise<number | null> {
  const { data: existente } = await supabaseAdmin
    .from('lista_desejo')
    .select('id_lista')
    .eq('id_usuario', idUsuario)
    .maybeSingle()

  if (existente?.id_lista) {
    return Number(existente.id_lista)
  }

  // Cria a lista automaticamente se ainda não existir
  const { data: nova, error } = await supabaseAdmin
    .from('lista_desejo')
    .insert({ id_usuario: idUsuario })
    .select('id_lista')
    .maybeSingle()

  if (error || !nova) {
    console.error('[notificacoes] Não foi possível encontrar ou criar lista_desejo:', error)
    return null
  }

  return Number(nova.id_lista)
}

/* Busca as notificações do usuário logado, incluindo contagem de não lidas.
Totalmente tolerante a variações no schema (com ou sem colunas extras). */
export async function buscarNotificacoesUsuario(idUsuario: number): Promise<{
  notificacoes: NotificacaoFormatada[]
  naoLidas: number
}> {
  const idLista = await obterOuCriarListaUsuario(idUsuario)
  
  // Lista de possíveis IDs: id_lista real e também id_usuario (caso tenha sido inserido manualmente pensando ser id_usuario)
  const idsFiltro = Array.from(new Set([idLista, idUsuario].filter(Boolean))) as number[]

  if (idsFiltro.length === 0) {
    return { notificacoes: [], naoLidas: 0 }
  }

  let rawData: any[] = []

  // 1ª tentativa: buscar com todas as colunas
  const buscaCompleta = await supabaseAdmin
    .from('notificacao')
    .select(
      `
      id_notificacao,
      id_jogo,
      titulo,
      mensagem,
      preco,
      desconto,
      loja,
      lida,
      criado_em,
      jogo ( id_jogo, itad_id, titulo, slug )
    `
    )
    .in('id_lista', idsFiltro)
    .order('criado_em', { ascending: false })
    .limit(50)

  if (!buscaCompleta.error && buscaCompleta.data) {
    rawData = buscaCompleta.data
  } else {
    // 2ª tentativa: colunas titulo, mensagem, lida (caso preco/desconto/loja não existam)
    const buscaComTitulo = await supabaseAdmin
      .from('notificacao')
      .select(
        `
        id_notificacao,
        id_jogo,
        titulo,
        mensagem,
        lida,
        criado_em,
        jogo ( id_jogo, itad_id, titulo, slug )
      `
      )
      .in('id_lista', idsFiltro)
      .order('criado_em', { ascending: false })
      .limit(50)

    if (!buscaComTitulo.error && buscaComTitulo.data) {
      rawData = buscaComTitulo.data
    } else {
      // 3ª tentativa: busca básica com colunas essenciais originais
      const buscaBasica = await supabaseAdmin
        .from('notificacao')
        .select(
          `
          id_notificacao,
          id_jogo,
          criado_em,
          jogo ( id_jogo, itad_id, titulo, slug )
        `
        )
        .in('id_lista', idsFiltro)
        .order('criado_em', { ascending: false })
        .limit(50)

      if (!buscaBasica.error && buscaBasica.data) {
        rawData = buscaBasica.data
      } else {
        // 4ª tentativa: select simples sem join caso a foreign key 'jogo' não esteja no cache do PostgREST
        const buscaSimples = await supabaseAdmin
          .from('notificacao')
          .select('*')
          .in('id_lista', idsFiltro)
          .order('criado_em', { ascending: false })
          .limit(50)

        if (buscaSimples.error) {
          console.error('[notificacoes] Erro crítico ao consultar notificacao:', buscaSimples.error)
          throw new Error('Falha ao carregar notificações do banco de dados.')
        }

        rawData = buscaSimples.data ?? []

        // Carrega os jogos correspondentes separadamente se necessário
        const idsJogos = Array.from(new Set(rawData.map((r: any) => r.id_jogo).filter(Boolean)))
        if (idsJogos.length > 0) {
          const { data: jogos } = await supabaseAdmin
            .from('jogo')
            .select('id_jogo, itad_id, titulo, slug')
            .in('id_jogo', idsJogos)

          const mapaJogos = new Map((jogos ?? []).map((j: any) => [j.id_jogo, j]))
          rawData = rawData.map((r: any) => ({
            ...r,
            jogo: mapaJogos.get(r.id_jogo) ?? null,
          }))
        }
      }
    }
  }

  const lista = rawData.map((n: any) => {
    const j = Array.isArray(n.jogo) ? n.jogo[0] : n.jogo
    const tituloJogo = j?.titulo ?? `Jogo #${n.id_jogo}`
    const precoNum = n.preco != null ? Number(n.preco) : null
    const descontoNum = n.desconto != null ? Number(n.desconto) : null

    // Monta título e descrição padrão caso colunas sejam nulas ou ainda não existam no schema
    const tituloFinal =
      n.titulo ||
      (descontoNum && descontoNum > 0
        ? `🔥 ${tituloJogo} está com ${descontoNum}% de desconto!`
        : `⚡ Novo preço ou oferta em ${tituloJogo}`)

    const descricaoFinal =
      n.mensagem ||
      (precoNum != null
        ? `Disponível por ${brl(precoNum)}${n.loja ? ` na loja ${n.loja}` : ''}.`
        : `O jogo ${tituloJogo} da sua Lista de Desejos recebeu novidades!`)

    return {
      id: Number(n.id_notificacao),
      idJogo: Number(n.id_jogo),
      titulo: tituloFinal,
      descricao: descricaoFinal,
      capa: j?.itad_id ? urlCapaItad(j.itad_id) : null,
      preco: precoNum,
      desconto: descontoNum,
      loja: n.loja ?? null,
      lida: Boolean(n.lida),
      criadoEm: n.criado_em || new Date().toISOString(),
      url: `/jogos/${n.id_jogo}`,
    }
  })

  const naoLidas = lista.filter((n) => !n.lida).length

  return { notificacoes: lista, naoLidas }
}

/* Marca notificação(ões) como lida(s). */
export async function marcarNotificacoesLidas(
  idUsuario: number,
  params: { idNotificacao?: number; todas?: boolean }
): Promise<boolean> {
  const idLista = await obterOuCriarListaUsuario(idUsuario)
  const idsFiltro = Array.from(new Set([idLista, idUsuario].filter(Boolean))) as number[]
  if (idsFiltro.length === 0) return false

  try {
    let query = supabaseAdmin
      .from('notificacao')
      .update({ lida: true })
      .in('id_lista', idsFiltro)

    if (!params.todas && params.idNotificacao) {
      query = query.eq('id_notificacao', params.idNotificacao)
    }

    const { error } = await query
    if (error) {
      console.warn('[notificacoes] Erro ao marcar como lida (coluna lida pode não existir):', error.message)
      return false
    }
    return true
  } catch {
    return false
  }
}

/* Exclui notificação(ões) do usuário. */
export async function excluirNotificacoes(
  idUsuario: number,
  params: { idNotificacao?: number; todas?: boolean }
): Promise<boolean> {
  const idLista = await obterOuCriarListaUsuario(idUsuario)
  const idsFiltro = Array.from(new Set([idLista, idUsuario].filter(Boolean))) as number[]
  if (idsFiltro.length === 0) return false

  try {
    let query = supabaseAdmin.from('notificacao').delete().in('id_lista', idsFiltro)

    if (!params.todas && params.idNotificacao) {
      query = query.eq('id_notificacao', params.idNotificacao)
    }

    const { error } = await query
    if (error) {
      console.error('[notificacoes] Erro ao excluir notificações:', error)
      return false
    }
    return true
  } catch {
    return false
  }
}

export type DispararAlertaParams = {
  idJogo: number
  novoPreco: number
  desconto: number
  loja: string
  precoAnterior?: number | null
}

/* Dispara notificações para todos os usuários que têm o jogo na Wishlist quando há queda de preço/oferta. */
export async function notificarQuedaDePreco({
  idJogo,
  novoPreco,
  desconto,
  loja,
  precoAnterior,
}: DispararAlertaParams): Promise<number> {
  try {
    const { data: jogo } = await supabaseAdmin
      .from('jogo')
      .select('id_jogo, titulo, itad_id')
      .eq('id_jogo', idJogo)
      .maybeSingle()

    if (!jogo) return 0

    const { data: listasComJogo } = await supabaseAdmin
      .from('lista_jogo')
      .select('id_lista')
      .eq('id_jogo', idJogo)

    if (!listasComJogo || listasComJogo.length === 0) return 0

    const idsListas = listasComJogo.map((l: any) => l.id_lista)

    const { data: listasUsuarios } = await supabaseAdmin
      .from('lista_desejo')
      .select('id_lista, usuario ( id_usuario, email, nome_usuario, notificar_email )')
      .in('id_lista', idsListas)

    if (!listasUsuarios || listasUsuarios.length === 0) return 0

    // Deduplicação: verifica se já existe notificação recente (últimas 24h)
    const umDiaAtras = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: notificacoesRecentes } = await supabaseAdmin
      .from('notificacao')
      .select('id_lista, preco')
      .eq('id_jogo', idJogo)
      .gte('criado_em', umDiaAtras)

    const jaNotificados = new Set<number>()
    for (const nr of notificacoesRecentes ?? []) {
      if (nr.preco != null && Number(nr.preco) <= novoPreco) {
        jaNotificados.add(Number(nr.id_lista))
      }
    }

    const tituloNotificacao =
      desconto > 0
        ? `🔥 ${jogo.titulo} está com ${desconto}% de desconto!`
        : `⚡ O preço de ${jogo.titulo} caiu!`

    const msgPrecoAntigo =
      precoAnterior != null && precoAnterior > novoPreco
        ? `De ${brl(precoAnterior)} por `
        : 'Por apenas '

    const mensagemNotificacao = `${msgPrecoAntigo}${brl(novoPreco)} na loja ${loja}.${desconto > 0 ? ` (${desconto}% OFF)` : ''}`

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const urlJogo = `${siteUrl}/jogos/${idJogo}`

    let totalCriadas = 0

    for (const item of listasUsuarios) {
      const idLista = Number(item.id_lista)
      if (jaNotificados.has(idLista)) {
        continue
      }

      // Tenta 1: colunas completas
      const insertCompleto = await supabaseAdmin.from('notificacao').insert({
        id_lista: idLista,
        id_jogo: idJogo,
        titulo: tituloNotificacao,
        mensagem: mensagemNotificacao,
        preco: novoPreco,
        desconto: desconto,
        loja: loja,
        lida: false,
      })

      if (!insertCompleto.error) {
        totalCriadas++
      } else {
        // Tenta 2: apenas titulo, mensagem, lida
        const insertParcial = await supabaseAdmin.from('notificacao').insert({
          id_lista: idLista,
          id_jogo: idJogo,
          titulo: tituloNotificacao,
          mensagem: mensagemNotificacao,
          lida: false,
        })

        if (!insertParcial.error) {
          totalCriadas++
        } else {
          // Tenta 3: schema base
          const insertBasico = await supabaseAdmin.from('notificacao').insert({
            id_lista: idLista,
            id_jogo: idJogo,
          })
          if (!insertBasico.error) {
            totalCriadas++
          }
        }
      }

      // Envia e-mail se o usuário desejar
      const usuarioRel: any = Array.isArray(item.usuario) ? item.usuario[0] : item.usuario
      if (usuarioRel && usuarioRel.notificar_email !== false && usuarioRel.email) {
        enviarEmailAlertaPreco({
          para: usuarioRel.email,
          nomeUsuario: usuarioRel.nome_usuario || 'Gamer',
          tituloJogo: jogo.titulo,
          preco: novoPreco,
          desconto,
          loja,
          urlJogo,
        }).catch((err) => console.error('[notificacoes] Falha no disparo de e-mail:', err))
      }
    }

    return totalCriadas
  } catch (err: any) {
    console.error('[notificacoes] Erro em notificarQuedaDePreco:', err?.message ?? err)
    return 0
  }
}

/* Cria uma notificação direta (usado para testes ou eventos especiais).
Valida o jogo e garante compatibilidade com o banco de dados. */
export async function criarNotificacaoManual(params: {
  idUsuario: number
  idJogo?: number
  titulo: string
  mensagem: string
  preco?: number
  desconto?: number
  loja?: string
  enviarEmail?: boolean
}): Promise<{ ok: boolean; erro?: string; emailEnviado: boolean; erroEmail?: string; destinoEmail?: string }> {
  const idLista = await obterOuCriarListaUsuario(params.idUsuario)
  if (!idLista) {
    return {
      ok: false,
      erro: 'Não foi possível encontrar ou criar a lista de desejos para seu usuário no banco.',
      emailEnviado: false,
    }
  }

  // Valida ou descobre um jogo válido no banco
  let idJogoFinal = params.idJogo ? Number(params.idJogo) : undefined

  if (idJogoFinal) {
    const { data: jogo } = await supabaseAdmin
      .from('jogo')
      .select('id_jogo, titulo')
      .eq('id_jogo', idJogoFinal)
      .maybeSingle()

    if (!jogo) {
      // Busca se existe algum jogo no banco para usar de fallback automático
      const { data: qualquerJogo } = await supabaseAdmin
        .from('jogo')
        .select('id_jogo, titulo')
        .limit(1)
        .maybeSingle()

      if (qualquerJogo) {
        console.warn(
          `[criarNotificacaoManual] Jogo com id ${idJogoFinal} não existe. Usando jogo existente id ${qualquerJogo.id_jogo} (${qualquerJogo.titulo}).`
        )
        idJogoFinal = qualquerJogo.id_jogo
      } else {
        return {
          ok: false,
          erro: 'A tabela "jogo" está vazia no banco. Cadastre ao menos um jogo antes de criar notificações.',
          emailEnviado: false,
        }
      }
    }
  } else {
    const { data: qualquerJogo } = await supabaseAdmin
      .from('jogo')
      .select('id_jogo')
      .limit(1)
      .maybeSingle()

    if (!qualquerJogo) {
      return {
        ok: false,
        erro: 'Nenhum jogo encontrado na tabela "jogo".',
        emailEnviado: false,
      }
    }
    idJogoFinal = qualquerJogo.id_jogo
  }

  let ok = false
  let ultimoErroBanco: string | undefined

  // 1. Tenta inserir com todas as colunas
  const tentativaCompleta = await supabaseAdmin.from('notificacao').insert({
    id_lista: idLista,
    id_jogo: idJogoFinal,
    titulo: params.titulo,
    mensagem: params.mensagem,
    preco: params.preco ?? null,
    desconto: params.desconto ?? null,
    loja: params.loja ?? null,
    lida: false,
  })

  if (!tentativaCompleta.error) {
    ok = true
  } else {
    ultimoErroBanco = tentativaCompleta.error.message

    // 2. Tenta inserir com id_lista, id_jogo, titulo, mensagem, lida (caso preco/desconto/loja não existam)
    const tentativaComColunasVisiveis = await supabaseAdmin.from('notificacao').insert({
      id_lista: idLista,
      id_jogo: idJogoFinal,
      titulo: params.titulo,
      mensagem: params.mensagem,
      lida: false,
    })

    if (!tentativaComColunasVisiveis.error) {
      ok = true
    } else {
      ultimoErroBanco = tentativaComColunasVisiveis.error.message

      // 3. Fallback caso a tabela só tenha as colunas originais (id_lista, id_jogo)
      const tentativaBasica = await supabaseAdmin.from('notificacao').insert({
        id_lista: idLista,
        id_jogo: idJogoFinal,
      })

      if (!tentativaBasica.error) {
        ok = true
      } else {
        console.error('[criarNotificacaoManual] Todos os inserts falharam:', tentativaBasica.error)
        ultimoErroBanco = tentativaBasica.error.message
      }
    }
  }

  if (!ok) {
    return {
      ok: false,
      erro: ultimoErroBanco || 'Falha ao inserir notificação na tabela do banco.',
      emailEnviado: false,
    }
  }

  let emailEnviado = false
  let erroEmail: string | undefined
  let destinoEmail: string | undefined

  // Dispara envio de e-mail se solicitado
  if (ok && params.enviarEmail !== false) {
    const { data: usuario } = await supabaseAdmin
      .from('usuario')
      .select('email, nome_usuario, notificar_email')
      .eq('id_usuario', params.idUsuario)
      .maybeSingle()

    if (usuario && usuario.email && usuario.notificar_email !== false) {
      destinoEmail = usuario.email
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const envio = await enviarEmailAlertaPreco({
        para: usuario.email,
        nomeUsuario: usuario.nome_usuario || 'Gamer',
        tituloJogo: params.titulo,
        preco: params.preco ?? 0,
        desconto: params.desconto ?? 0,
        loja: params.loja ?? 'BananaPrice',
        urlJogo: `${siteUrl}/jogos/${idJogoFinal}`,
      })
      emailEnviado = envio.sucesso
      erroEmail = envio.erro
    }
  }

  return { ok: true, emailEnviado, erroEmail, destinoEmail }
}
