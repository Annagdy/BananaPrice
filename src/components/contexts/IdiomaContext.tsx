'use client'

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export type Idioma = 'pt-BR' | 'en-US'

export type Dicionario = {
  nav: {
    placeholderNativa: string
    placeholderIa: string
    ariaBuscar: string
    nativa: string
    ia: string
    buscasRecentes: string
    limparTudo: string
    removerDoHistorico: string
    notificacoes: string
    listaDeDesejos: string
    conta: string
    loginCadastrar: string
    novas: string
    idioma: string
  }
  hero: {
    titulo: string
    subtitulo: string
  }
  home: {
    vitrineTurbo: string
    darUmTurbo: string
    ofertasDoMomento: string
    carregandoDestaques: string
    nenhumTurbo: string
    carregandoOfertas: string
    nenhumaOferta: string
    verMais: string
  }
  card: {
    gratis: string
    indisponivel: string
    semOferta: string
    lojaParceira: string
    resgatarGratis: string
    ofertaAtiva: string
  }
  jogos: {
    titulo: string
    filtrarOfertas: string
    ocultarFiltros: string
    estado: string
    todos: string
    gratis: string
    indisponivel: string
    precos: string
    descontos: string
    lojas: string
    conteudo: string
    adulto: string
    outros: string
    consolesGiftCards: string
    carregandoIa: string
    carregandoCatalogo: string
    nenhumRelacionado: string
    nenhumFiltro: string
    nenhumaOfertaFiltro: string
    paginaDe: (atual: number, total: number) => string
    paginaAnterior: string
    proximaPagina: string
  }
  jogoDetalhe: {
    ondeComprar: string
    melhorPreco: string
    irParaLoja: (loja: string) => string
    voltarOfertas: string
    semLink: string
    naoEncontramosOfertas: string
    listaDoJogo: string
    categoria: string
    naoInformada: string
    lojaAtual: string
    historicoMinimo: string
    semRegistro: string
    resumo: string
    melhorOferta: string
    loja: string
    semOfertasMomento: string
    historicoPrecos: string
    data: string
    preco: string
    adicionarDesejos: string
    removerDesejos: string
    verDlcs: (qtd: number) => string
    dlcsTitulo: string
    buscarDlc: string
    fechar: string
    nenhumaDlc: string
  }
  wishlist: {
    titulo: string
    carregando: string
    vazia: string
    remover: string
    verOfertas: string
    semPreco: string
    naLoja: (loja: string) => string
    avisoTitulo: string
    avisoDescricao: string
  }
  conta: {
    titulo: string
    ola: (nome: string) => string
    subtitulo: string
    dadosConta: string
    nomeUsuario: string
    email: string
    steam: string
    steamDesc: string
    conectado: string
    conectar: string
    cancelar: string
    confirmar: string
    notificacoes: string
    notificarEmail: string
    salvoSucesso: string
    sairConta: string
    sair: string
  }
  auth: {
    loginTitulo: string
    entrar: string
    criarConta: string
    naoTemConta: string
    jaTemConta: string
    ouEntreCom: string
    emailOuUsuario: string
    senha: string
    confirmarSenha: string
    forcaSenha: (forca: string) => string
    termosUso: string
    politicaPrivacidade: string
    concordoCom: string
    alertasOfertas: string
    esqueceuSenha: string
    bemVindo: string
    acesseAlertas: string
    continuarComSteam: string
    ouComEmail: string
    entrarNaConta: string
    entrando: string
    continuarComoVisitante: string
    cadastreGratis: string
    fazerLogin: string
    monitorePromocoes: string
    cadastrarComSteam: string
    ouCadastreEmail: string
    nomeCompletoOuNick: string
    emailParaAlertas: string
    senhaSegura: string
    minimo8Char: string
    repitaSenha: string
    criando: string
    forcaRotulos: string[]
  }
  footer: {
    descricao: string
    transparencia: string
    termosDeUso: string
    politicaDePrivacidade: string
    contatoApi: string
    itadDesc: string
    direitos: string
  }
  notificacoesPagina: {
    titulo: string
    atualizar: string
    marcarTodasLidas: string
    limparTodas: string
    confirmarLimpar: string
    todas: (qtd: number) => string
    naoLidas: (qtd: number) => string
    carregando: string
    todasLidas: string
    nenhuma: string
    vaziaDescricao: string
    explorarCatalogo: string
    nova: string
    marcarLida: string
    excluir: string
    tempoAgora: string
    tempoMin: (m: number) => string
    tempoHoras: (h: number) => string
    tempoOntem: string
    tempoDias: (d: number) => string
    cardDesconto: (desconto: number) => string
    cardDisponivelPor: (preco: string, loja?: string | null) => string
    cardNovoPreco: (titulo: string) => string
    cardJogoNovidades: (titulo: string) => string
  }
  transparencia: {
    termosTitulo: string
    politicaTitulo: string
    contatoTitulo: string
    voltarInicio: string
    verTermos: string
    verPolitica: string
    ultimaAtualizacao: string
    // Termos
    termosSec1Titulo: string
    termosSec1Texto: string
    termosSec2Titulo: string
    termosSec2P1: string
    termosSec2P2: string
    termosSec3Titulo: string
    termosSec3Texto: string
    termosSec4Titulo: string
    termosSec4Texto: string
    termosSec5Titulo: string
    termosSec5Texto: string
    // Política
    politicaSubtitulo: string
    politicaSec1Titulo: string
    politicaSec1Texto: string
    politicaSec1Item1: string
    politicaSec1Item2: string
    politicaSec1Item3: string
    politicaSec2Titulo: string
    politicaSec2Texto: string
    politicaSec2Item1: string
    politicaSec2Item2: string
    politicaSec2Item3: string
    politicaSec2Item4: string
    politicaSec3Titulo: string
    politicaSec3P1: string
    politicaSec3P2: string
    politicaSec4Titulo: string
    politicaSec4Texto: string
    // Contato & API
    contatoSubtitulo: string
    apiSecTitulo: string
    apiSecTexto: string
    apiCreditosTitulo: string
    apiCreditosTexto: string
    apiDocTexto: string
    equipeTitulo: string
    equipeTexto: string
    emailOficial: string
    emailDesc: string
    comunidadeTitulo: string
    comunidadeDesc: string
    feedbackTitulo: string
    feedbackLink: string
    feedbackDesc: string
  }
  turbo: {
    titulo: string
    gerandoPix: string
    copiaCola: string
    copiado: string
    copiarAria: string
    expirado: string
    tempoRestanteAria: string
    avisoValor: string
    verifiquePreview: string
    voltarAoJogo: string
    erroCarregar: string
    jogoNaoEncontrado: string
    pagamentoCancelado: string
    sucessoTitulo: string
    sucessoMensagem: string
    sucessoBotao: string
  }
}

export const dicionarios: Record<Idioma, Dicionario> = {
  'pt-BR': {
    nav: {
      placeholderNativa: 'Busca rápida de jogos (ex: Resident Evil)...',
      placeholderIa: 'Busca profunda com IA...',
      ariaBuscar: 'Buscar jogos',
      nativa: 'Nativa',
      ia: 'IA',
      buscasRecentes: 'Buscas Recentes',
      limparTudo: 'Limpar tudo',
      removerDoHistorico: 'Remover do histórico',
      notificacoes: 'Notificações',
      listaDeDesejos: 'Lista de Desejos',
      conta: 'Conta',
      loginCadastrar: 'Login / Cadastrar',
      novas: 'novas',
      idioma: 'Idioma',
    },
    hero: {
      titulo: 'BananaPrice: O seu radar de games a preço de banana!',
      subtitulo: 'Acompanhe descontos reais e o menor preço histórico nas principais lojas.',
    },
    home: {
      vitrineTurbo: 'Vitrine Turbo',
      darUmTurbo: 'Dar um turbo',
      ofertasDoMomento: 'Ofertas do Momento',
      carregandoDestaques: 'Carregando destaques...',
      nenhumTurbo: 'Nenhum jogo na Vitrine Turbo no momento. Seja o primeiro a impulsionar um jogo!',
      carregandoOfertas: 'Carregando ofertas do momento...',
      nenhumaOferta: 'Nenhuma oferta no momento.',
      verMais: 'Ver Mais',
    },
    card: {
      gratis: 'GRÁTIS',
      indisponivel: 'Indisponível',
      semOferta: 'Sem oferta ativa',
      lojaParceira: 'Loja parceira',
      resgatarGratis: 'Resgatar Grátis',
      ofertaAtiva: 'Oferta ativa',
    },
    jogos: {
      titulo: 'Ofertas do Momento',
      filtrarOfertas: 'Filtrar Ofertas e Categorias',
      ocultarFiltros: 'Ocultar Filtros',
      estado: 'Estado',
      todos: 'Todos',
      gratis: 'Grátis',
      indisponivel: 'Indisponível',
      precos: 'Preços',
      descontos: 'Descontos',
      lojas: 'Lojas',
      conteudo: 'Conteúdo',
      adulto: '18+ Adulto',
      outros: 'Outros',
      consolesGiftCards: 'Consoles & Gift Cards',
      carregandoIa: 'Realizando busca profunda com IA...',
      carregandoCatalogo: 'Pesquisando jogos no catálogo...',
      nenhumRelacionado: 'Nenhum jogo relacionado foi encontrado.',
      nenhumFiltro: 'Nenhum jogo da busca corresponde aos filtros selecionados.',
      nenhumaOfertaFiltro: 'Nenhuma oferta encontrada com esses filtros.',
      paginaDe: (atual, total) => `Página ${atual} de ${total}`,
      paginaAnterior: 'Página anterior',
      proximaPagina: 'Próxima página',
    },
    jogoDetalhe: {
      ondeComprar: 'Onde comprar',
      melhorPreco: 'Melhor preço',
      irParaLoja: (loja) => `Ir para ${loja}`,
      voltarOfertas: 'Voltar às ofertas',
      semLink: 'Sem link',
      naoEncontramosOfertas: 'Não encontramos ofertas de compra para este jogo específico.',
      listaDoJogo: 'Lista do jogo',
      categoria: 'Categoria',
      naoInformada: 'Não informada',
      lojaAtual: 'Loja atual',
      historicoMinimo: 'Histórico mínimo',
      semRegistro: 'Sem registro',
      resumo: 'Resumo',
      melhorOferta: 'Melhor oferta',
      loja: 'Loja',
      semOfertasMomento: 'Sem ofertas no momento.',
      historicoPrecos: 'Histórico de preços',
      data: 'Data',
      preco: 'Preço',
      adicionarDesejos: 'Adicionar à lista de desejos',
      removerDesejos: 'Remover da lista de desejos',
      verDlcs: (qtd) => `Ver DLCs (${qtd})`,
      dlcsTitulo: 'Conteúdos adicionais e DLCs',
      buscarDlc: 'Buscar DLC pelo nome...',
      fechar: 'Fechar',
      nenhumaDlc: 'Nenhuma DLC encontrada.',
    },
    wishlist: {
      titulo: 'Lista de Desejos',
      carregando: 'Carregando sua lista de desejos...',
      vazia: 'Sua lista de desejos está vazia.',
      remover: 'Remover',
      verOfertas: 'Ver ofertas',
      semPreco: 'Sem preço',
      naLoja: (loja) => `na ${loja}`,
      avisoTitulo: 'O Bananinha fica atento nos seus jogos desejados',
      avisoDescricao: 'Fique atento à notificações tanto no seu e-mail quanto no site!',
    },
    conta: {
      titulo: 'Minha Conta',
      ola: (nome) => `Olá, ${nome}!`,
      subtitulo: 'Gerencie seu perfil, preferências e contas conectadas.',
      dadosConta: 'Dados da Conta',
      nomeUsuario: 'Nome de Usuário',
      email: 'E-mail',
      steam: 'Steam',
      steamDesc: 'Sincronização de conta e lista de desejos',
      conectado: 'Conectado',
      conectar: 'Conectar',
      cancelar: 'Cancelar',
      confirmar: 'Confirmar',
      notificacoes: 'Notificações',
      notificarEmail: 'Notificar E-mail',
      salvoSucesso: 'Dados atualizados com sucesso!',
      sairConta: 'Sair da Conta',
      sair: 'Sair',
    },
    auth: {
      loginTitulo: 'Entrar no BananaPrice',
      entrar: 'Entrar',
      criarConta: 'Criar Conta BananaPrice',
      naoTemConta: 'Não tem uma conta?',
      jaTemConta: 'Já tem uma conta?',
      ouEntreCom: 'ou entre com',
      emailOuUsuario: 'E-mail ou Usuário',
      senha: 'Senha',
      confirmarSenha: 'Confirmar senha',
      forcaSenha: (forca) => `Força da senha: ${forca}`,
      termosUso: 'Termos de Uso',
      politicaPrivacidade: 'Políticas de Privacidade',
      concordoCom: 'Li e concordo com os',
      alertasOfertas: 'Desejo receber alertas de ofertas e bugs de preço selecionados',
      esqueceuSenha: 'Esqueceu a senha?',
      bemVindo: 'Bem-vindo',
      acesseAlertas: 'Acesse seus alertas de preços e wishlist',
      continuarComSteam: 'Continuar com Steam',
      ouComEmail: 'ou com e-mail',
      entrarNaConta: 'Entrar na Conta',
      entrando: 'Entrando...',
      continuarComoVisitante: 'Continuar como visitante',
      cadastreGratis: 'Cadastre-se gratuitamente',
      fazerLogin: 'Fazer login',
      monitorePromocoes: 'Monitore promoções e nunca mais pague caro em games',
      cadastrarComSteam: 'Cadastrar com a Steam',
      ouCadastreEmail: 'ou cadastre com e-mail',
      nomeCompletoOuNick: 'Nome completo ou Nick gamer',
      emailParaAlertas: 'E-mail para alertas',
      senhaSegura: 'Senha segura',
      minimo8Char: 'Mínimo 8 caracteres',
      repitaSenha: 'Repita a senha',
      criando: 'Criando...',
      forcaRotulos: ['', 'Fraca', 'Média', 'Forte'],
    },
    footer: {
      descricao:
        'BananaPrice é uma ferramenta independente feita por e para gamers brasileiros. Monitoramos lojas oficiais, atualizando a cada 24 horas para garantir que você compre seus títulos favoritos pelo menor preço real.',
      transparencia: 'Transparência',
      termosDeUso: 'Termos de Uso',
      politicaDePrivacidade: 'Política de Privacidade',
      contatoApi: 'Contato & API Pública',
      itadDesc: 'Informações e dados de preços coletados através da IsThereAnyDeal API. Para mais informações, acesse IsThereAnyDeal.com.',
      direitos: '© 2026 BananaPrice. Todos os direitos reservados. Marcas e imagens são propriedade de suas respectivas desenvolvedoras e editoras.',
    },
    notificacoesPagina: {
      titulo: 'Notificações',
      atualizar: '🔄 Atualizar',
      marcarTodasLidas: 'Marcar todas como lidas',
      limparTodas: 'Limpar todas',
      confirmarLimpar: 'Deseja realmente limpar todas as notificações?',
      todas: (qtd) => `Todas (${qtd})`,
      naoLidas: (qtd) => `Não lidas (${qtd})`,
      carregando: 'Carregando notificações...',
      todasLidas: 'Você já leu todas as notificações!',
      nenhuma: 'Nenhuma notificação por enquanto.',
      vaziaDescricao: 'Adicione jogos à sua Lista de Desejos para ser avisado sempre que o preço baixar ou surgirem novas promoções!',
      explorarCatalogo: 'Explorar Catálogo',
      nova: 'NOVA',
      marcarLida: 'Marcar como lida',
      excluir: 'Excluir notificação',
      tempoAgora: 'agora mesmo',
      tempoMin: (m) => `há ${m} min`,
      tempoHoras: (h) => `há ${h} ${h === 1 ? 'hora' : 'horas'}`,
      tempoOntem: 'ontem',
      tempoDias: (d) => `há ${d} dias`,
      cardDesconto: (d) => `🔥 Está com ${d}% de desconto!`,
      cardDisponivelPor: (preco, loja) => `Disponível por ${preco}${loja ? ` na loja ${loja}` : ''}.`,
      cardNovoPreco: (titulo) => `⚡ Novo preço ou oferta em ${titulo}`,
      cardJogoNovidades: (titulo) => `O jogo ${titulo} da sua Lista de Desejos recebeu novidades!`,
    },
    transparencia: {
      termosTitulo: 'Termos de Uso',
      politicaTitulo: 'Política de Privacidade',
      contatoTitulo: 'Contato & API Pública',
      voltarInicio: '← Voltar para o Início',
      verTermos: 'Ver Termos de Uso',
      verPolitica: 'Ver Política de Privacidade',
      ultimaAtualizacao: 'Última atualização: Novembro de 2026',
      termosSec1Titulo: '1. Aceitação dos Termos',
      termosSec1Texto:
        'Ao acessar ou utilizar a plataforma BananaPrice, você concorda em cumprir e vincular-se a estes Termos de Uso. Caso não concorde com qualquer disposição aqui apresentada, recomendamos não utilizar os nossos serviços.',
      termosSec2Titulo: '2. Natureza Informativa e Comparador de Preços',
      termosSec2P1:
        'O BananaPrice é uma ferramenta agregadora e comparadora independente de preços de jogos eletrônicos. Não somos uma loja direta e não processamos compras de chaves ou licenças de jogos de terceiros.',
      termosSec2P2:
        'As transações financeiras, entregas de keys e suportes pós-venda são de exclusiva responsabilidade das lojas parceiras e oficiais indicadas (ex: Steam, Nuuvem, Epic Games, GOG, etc.).',
      termosSec3Titulo: '3. Precisão dos Dados e Promoções',
      termosSec3Texto:
        'Embora realizemos esforços contínuos e automações de sincronização para manter os preços, cupons e históricos sempre atualizados, divergências de valores podem ocorrer pontualmente devido a flutuações rápidas ou término imprevisto de estoques e promoções nas lojas. O valor oficial sempre será o exibido na página de checkout da loja de destino.',
      termosSec4Titulo: '4. Contas de Usuário e Segurança',
      termosSec4Texto:
        'Ao criar uma conta ou autenticar-se via Steam, o usuário é responsável por manter a confidencialidade de suas credenciais de acesso. O BananaPrice não solicita nem armazena senhas de plataformas de terceiros.',
      termosSec5Titulo: '5. Modificações dos Termos',
      termosSec5Texto:
        'Reservamo-nos o direito de alterar estes Termos a qualquer momento para adequação técnica ou legal. O uso contínuo da plataforma após alterações constitui aceitação dos novos termos.',
      politicaSubtitulo: 'Política de privacidade e proteção de dados da plataforma BananaPrice.',
      politicaSec1Titulo: '1. Coleta de Informações',
      politicaSec1Texto:
        'O BananaPrice preza pela sua privacidade e coleta apenas os dados essenciais para o funcionamento dos recursos da plataforma:',
      politicaSec1Item1:
        'Conta e Autenticação: Nome de usuário, e-mail e hash seguro da senha ao se cadastrar diretamente.',
      politicaSec1Item2:
        'Integração com a Steam: Identificador público Steam ID e itens públicos da wishlist para sincronização automática de ofertas (sem acesso a senhas ou dados de pagamento da Steam).',
      politicaSec1Item3:
        'Lista de Desejos e Notificações: Jogos salvos pelo usuário para fins de alerta de menor preço histórico.',
      politicaSec2Titulo: '2. Uso dos Dados',
      politicaSec2Texto: 'Os dados coletados são utilizados exclusivamente para:',
      politicaSec2Item1: 'Autenticar o acesso do usuário à sua conta;',
      politicaSec2Item2: 'Salvar jogos preferidos na Lista de Desejos;',
      politicaSec2Item3:
        'Disparar notificações no site e por e-mail quando jogos desejados atingirem novos descontos;',
      politicaSec2Item4:
        'Melhorar a experiência de navegação e histórico de buscas recentes (armazenado localmente no seu próprio navegador via localStorage).',
      politicaSec3Titulo: '3. Compartilhamento e Terceiros',
      politicaSec3P1:
        'Não vendemos, alugamos ou comercializamos dados pessoais de usuários com anunciantes ou terceiros.',
      politicaSec3P2:
        'Links que direcionam para lojas parceiras podem conter parâmetros de rastreamento de afiliados e identificadores seguros para viabilizar a manutenção e gratuidade da plataforma.',
      politicaSec4Titulo: '4. Seus Direitos (LGPD)',
      politicaSec4Texto:
        'Conforme a Lei Geral de Proteção de Dados (LGPD), você possui o direito de solicitar a qualquer momento a visualização, alteração ou exclusão definitiva da sua conta e de todos os dados associados através da página de Conta ou entrando em contato com a equipe.',
      contatoSubtitulo: 'Transparência sobre nossa origem de dados e canais de comunicação',
      apiSecTitulo: 'Sobre a API de Preços e Catálogo',
      apiSecTexto:
        'Todas as informações sobre ofertas, catálogo de jogos, promoções ativas, cortes de preço e histórico de menores valores registrados são coletados e alimentados através da plataforma e API pública da',
      apiCreditosTitulo: 'Créditos & Reconhecimento:',
      apiCreditosTexto:
        'A IsThereAnyDeal.com é a autoridade global líder em agregação de preços para computadores e consoles, monitorando lojas autorizadas e distribuidores oficiais.',
      apiDocTexto:
        'Para mais informações técnicas sobre a API oficial ou para registrar uma chave de desenvolvedor para seus próprios projetos, visite o portal oficial da documentação:',
      equipeTitulo: 'Fale com a Equipe BananaPrice',
      equipeTexto:
        'Tem alguma dúvida, encontrou um bug no catálogo ou gostaria de sugerir uma nova funcionalidade para a plataforma? Entre em contato conosco através dos seguintes canais:',
      emailOficial: 'E-mail Oficial',
      emailDesc: 'Para dúvidas gerais, feedback e relatos de erros.',
      comunidadeTitulo: 'Comunidade & Repositório',
      comunidadeDesc: 'Acompanhe issues, releases e novidades da ferramenta.',
      feedbackTitulo: 'Feedback',
      feedbackLink: 'Formulário de Feedback',
      feedbackDesc: 'Conte o que achou do site, sugira melhorias ou reporte algum erro. Leva menos de 5 minutos.',
    },
    turbo: {
      titulo: 'Dar um Turbo',
      gerandoPix: 'Gerando pagamento Pix...',
      copiaCola: 'Copia e Cola',
      copiado: 'Copiado!',
      copiarAria: 'Copiar código Pix',
      expirado: 'Expirado!',
      tempoRestanteAria: 'Tempo restante para pagar',
      avisoValor: 'Lembre de checar o código e valor antes de concluir o pagamento!',
      verifiquePreview: 'Verifique a preview para o jogo selecionado.',
      voltarAoJogo: 'Voltar ao jogo',
      erroCarregar: 'Erro ao carregar dados. Tente novamente.',
      jogoNaoEncontrado: 'Jogo não encontrado.',
      pagamentoCancelado: 'Pagamento foi rejeitado ou cancelado. Tente novamente.',
      sucessoTitulo: 'Turbo Ativado!',
      sucessoMensagem: 'Obrigado por apoiar a comunidade gamer!',
      sucessoBotao: 'Voltar ao início',
    },
  },
  'en-US': {
    nav: {
      placeholderNativa: 'Quick game search (e.g. Resident Evil)...',
      placeholderIa: 'Deep franchise search with AI...',
      ariaBuscar: 'Search games',
      nativa: 'Native',
      ia: 'AI',
      buscasRecentes: 'Recent Searches',
      limparTudo: 'Clear all',
      removerDoHistorico: 'Remove from history',
      notificacoes: 'Notifications',
      listaDeDesejos: 'Wishlist',
      conta: 'Account',
      loginCadastrar: 'Login / Register',
      novas: 'new',
      idioma: 'Language',
    },
    hero: {
      titulo: 'BananaPrice: Your top game radar at banana prices!',
      subtitulo: 'Track real discounts and historical all-time low prices across major official stores.',
    },
    home: {
      vitrineTurbo: 'Turbo Showcase',
      darUmTurbo: 'Boost with Turbo',
      ofertasDoMomento: 'Current Deals',
      carregandoDestaques: 'Loading highlights...',
      nenhumTurbo: 'No games in Turbo Showcase right now. Be the first to boost a game!',
      carregandoOfertas: 'Loading top deals...',
      nenhumaOferta: 'No deals found right now.',
      verMais: 'See More',
    },
    card: {
      gratis: 'FREE',
      indisponivel: 'Unavailable',
      semOferta: 'No active deal',
      lojaParceira: 'Partner store',
      resgatarGratis: 'Claim Free',
      ofertaAtiva: 'Active deal',
    },
    jogos: {
      titulo: 'Current Deals',
      filtrarOfertas: 'Filter Deals & Categories',
      ocultarFiltros: 'Hide Filters',
      estado: 'Status',
      todos: 'All',
      gratis: 'Free to Play',
      indisponivel: 'Unavailable',
      precos: 'Prices',
      descontos: 'Discounts',
      lojas: 'Stores',
      conteudo: 'Content',
      adulto: '18+ Mature',
      outros: 'Others',
      consolesGiftCards: 'Consoles & Gift Cards',
      carregandoIa: 'Running deep search with AI...',
      carregandoCatalogo: 'Searching games in catalog...',
      nenhumRelacionado: 'No related games were found.',
      nenhumFiltro: 'No games match your selected filters.',
      nenhumaOfertaFiltro: 'No deals found with these filters.',
      paginaDe: (atual, total) => `Page ${atual} of ${total}`,
      paginaAnterior: 'Previous page',
      proximaPagina: 'Next page',
    },
    jogoDetalhe: {
      ondeComprar: 'Where to buy',
      melhorPreco: 'Best price',
      irParaLoja: (loja) => `Go to ${loja}`,
      voltarOfertas: 'Back to deals',
      semLink: 'No link',
      naoEncontramosOfertas: 'We could not find active purchase deals for this specific game.',
      listaDoJogo: 'Game info',
      categoria: 'Genre',
      naoInformada: 'Not specified',
      lojaAtual: 'Current store',
      historicoMinimo: 'All-time low',
      semRegistro: 'No record',
      resumo: 'Overview',
      melhorOferta: 'Best deal',
      loja: 'Store',
      semOfertasMomento: 'No active deals right now.',
      historicoPrecos: 'Price history',
      data: 'Date',
      preco: 'Price',
      adicionarDesejos: 'Add to wishlist',
      removerDesejos: 'Remove from wishlist',
      verDlcs: (qtd) => `View DLCs (${qtd})`,
      dlcsTitulo: 'Add-ons & DLCs',
      buscarDlc: 'Search DLC by name...',
      fechar: 'Close',
      nenhumaDlc: 'No DLCs found.',
    },
    wishlist: {
      titulo: 'Wishlist',
      carregando: 'Loading your wishlist...',
      vazia: 'Your wishlist is empty.',
      remover: 'Remove',
      verOfertas: 'View deals',
      semPreco: 'No price',
      naLoja: (loja) => `on ${loja}`,
      avisoTitulo: 'Little Banana keeps an eye on your wishlist games',
      avisoDescricao: 'Stay tuned for notifications in both your email and on the website!',
    },
    conta: {
      titulo: 'My Account',
      ola: (nome) => `Hello, ${nome}!`,
      subtitulo: 'Manage your profile, preferences and connected accounts.',
      dadosConta: 'Account Information',
      nomeUsuario: 'Username',
      email: 'Email',
      steam: 'Steam',
      steamDesc: 'Sync account and public Steam wishlist',
      conectado: 'Connected',
      conectar: 'Connect',
      cancelar: 'Cancel',
      confirmar: 'Save Changes',
      notificacoes: 'Notifications',
      notificarEmail: 'Email Alerts',
      salvoSucesso: 'Profile updated successfully!',
      sairConta: 'Sign Out',
      sair: 'Sign Out',
    },
    auth: {
      loginTitulo: 'Sign in to BananaPrice',
      entrar: 'Sign in',
      criarConta: 'Create BananaPrice Account',
      naoTemConta: "Don't have an account?",
      jaTemConta: 'Already have an account?',
      ouEntreCom: 'or continue with',
      emailOuUsuario: 'Email or Username',
      senha: 'Password',
      confirmarSenha: 'Confirm password',
      forcaSenha: (forca) => `Password strength: ${forca}`,
      termosUso: 'Terms of Use',
      politicaPrivacidade: 'Privacy Policy',
      concordoCom: 'I agree to the',
      alertasOfertas: 'I wish to receive curated game deal alerts and price bugs',
      esqueceuSenha: 'Forgot password?',
      bemVindo: 'Welcome back',
      acesseAlertas: 'Access your price alerts and wishlist',
      continuarComSteam: 'Continue with Steam',
      ouComEmail: 'or with email',
      entrarNaConta: 'Sign in to Account',
      entrando: 'Signing in...',
      continuarComoVisitante: 'Continue as guest',
      cadastreGratis: 'Sign up for free',
      fazerLogin: 'Sign in',
      monitorePromocoes: 'Track deals and never overpay for games again',
      cadastrarComSteam: 'Sign up with Steam',
      ouCadastreEmail: 'or register with email',
      nomeCompletoOuNick: 'Full name or Gamer tag',
      emailParaAlertas: 'Email for deal alerts',
      senhaSegura: 'Secure password',
      minimo8Char: 'Minimum 8 characters',
      repitaSenha: 'Repeat password',
      criando: 'Creating...',
      forcaRotulos: ['', 'Weak', 'Medium', 'Strong'],
    },
    footer: {
      descricao:
        'BananaPrice is an independent price monitoring and comparison tool made by and for gamers. We monitor official stores, updating every 24 hours to ensure you get your favorite games at the real lowest price.',
      transparencia: 'Transparency',
      termosDeUso: 'Terms of Use',
      politicaDePrivacidade: 'Privacy Policy',
      contatoApi: 'Contact & Public API',
      itadDesc: 'Game prices and deal data collected via IsThereAnyDeal API. For more info, visit IsThereAnyDeal.com.',
      direitos: '© 2026 BananaPrice. All rights reserved. Game titles and trademarks belong to their respective developers and publishers.',
    },
    notificacoesPagina: {
      titulo: 'Notifications',
      atualizar: '🔄 Refresh',
      marcarTodasLidas: 'Mark all as read',
      limparTodas: 'Clear all',
      confirmarLimpar: 'Do you really want to clear all notifications?',
      todas: (qtd) => `All (${qtd})`,
      naoLidas: (qtd) => `Unread (${qtd})`,
      carregando: 'Loading notifications...',
      todasLidas: "You've read all your notifications!",
      nenhuma: 'No notifications yet.',
      vaziaDescricao: 'Add games to your Wishlist to be notified whenever prices drop or new promotions arrive!',
      explorarCatalogo: 'Explore Catalog',
      nova: 'NEW',
      marcarLida: 'Mark as read',
      excluir: 'Delete notification',
      tempoAgora: 'just now',
      tempoMin: (m) => `${m}m ago`,
      tempoHoras: (h) => `${h}h ago`,
      tempoOntem: 'yesterday',
      tempoDias: (d) => `${d}d ago`,
      cardDesconto: (d) => `🔥 It's ${d}% off!`,
      cardDisponivelPor: (preco, loja) => `Available for ${preco}${loja ? ` on ${loja}` : ''}.`,
      cardNovoPreco: (titulo) => `⚡ New price or deal on ${titulo}`,
      cardJogoNovidades: (titulo) => `Game ${titulo} from your Wishlist has updates!`,
    },
    transparencia: {
      termosTitulo: 'Terms of Use',
      politicaTitulo: 'Privacy Policy',
      contatoTitulo: 'Contact & Public API',
      voltarInicio: '← Back to Home',
      verTermos: 'View Terms of Use',
      verPolitica: 'View Privacy Policy',
      ultimaAtualizacao: 'Last updated: November 2026',
      termosSec1Titulo: '1. Acceptance of Terms',
      termosSec1Texto:
        'By accessing or using the BananaPrice platform, you agree to comply with and be bound by these Terms of Use. If you disagree with any terms, please refrain from using our services.',
      termosSec2Titulo: '2. Informational Nature & Price Comparison',
      termosSec2P1:
        'BananaPrice is an independent game price comparison and aggregation platform. We are not a direct digital storefront and do not process sales of third-party game keys or licenses.',
      termosSec2P2:
        'Financial transactions, game key fulfillment, and after-sales customer service are the sole responsibility of the officially listed authorized stores (e.g. Steam, Nuuvem, Epic Games, GOG, etc.).',
      termosSec3Titulo: '3. Data Accuracy & Promotions',
      termosSec3Texto:
        'While we continuously automate and update prices, coupons, and historical lowest values, occasional price differences may occur due to sudden fluctuations or out-of-stock situations on external stores. The final valid price is always the one shown at the store checkout page.',
      termosSec4Titulo: '4. User Accounts & Security',
      termosSec4Texto:
        'When creating an account or logging in via Steam, the user is responsible for preserving credentials confidentiality. BananaPrice never requests or stores passwords from third-party platforms.',
      termosSec5Titulo: '5. Modifications of Terms',
      termosSec5Texto:
        'We reserve the right to alter these Terms at any time for technical or legal compliance. Continued use of the platform constitutes acceptance of updated terms.',
      politicaSubtitulo: 'Privacy policy and data protection of the BananaPrice platform.',
      politicaSec1Titulo: '1. Information Collection',
      politicaSec1Texto:
        'BananaPrice values your privacy and only collects data strictly necessary for our platform features:',
      politicaSec1Item1:
        'Account & Auth: Username, email, and secure password hash when registering directly.',
      politicaSec1Item2:
        'Steam Integration: Public Steam ID and public wishlist games for automated deal sync (no access to passwords or payment data).',
      politicaSec1Item3:
        'Wishlist & Notifications: Games tracked by the user for historical all-time low price alerts.',
      politicaSec2Titulo: '2. Use of Data',
      politicaSec2Texto: 'Collected information is strictly used to:',
      politicaSec2Item1: 'Authenticate user access to their account;',
      politicaSec2Item2: 'Save tracked games in the Wishlist;',
      politicaSec2Item3:
        'Trigger on-site and email notifications when tracked games reach new discount milestones;',
      politicaSec2Item4:
        'Improve navigation and recent search history (stored locally on your own browser via localStorage).',
      politicaSec3Titulo: '3. Sharing and Third Parties',
      politicaSec3P1:
        'We never sell, rent, or trade personal user information to advertisers or third parties.',
      politicaSec3P2:
        'Outbound links directing to partner stores may contain affiliate tracking parameters to ensure platform maintenance and free access.',
      politicaSec4Titulo: '4. Your Rights',
      politicaSec4Texto:
        'Under applicable data protection laws (including LGPD and GDPR), you may request at any time to view, update, or permanently delete your account and associated data through the Account page or by contacting our team.',
      contatoSubtitulo: 'Transparency about our data sources and communication channels',
      apiSecTitulo: 'About the Price & Catalog API',
      apiSecTexto:
        'All deal information, game catalog, active discounts, price cuts, and historical lowest prices are collected and powered by the public API of',
      apiCreditosTitulo: 'Credits & Recognition:',
      apiCreditosTexto:
        'IsThereAnyDeal.com is the world-leading price aggregation authority for PC and console video games, tracking official authorized digital retailers.',
      apiDocTexto:
        'For technical documentation about the official API or to request a developer API key for your own projects, visit the official portal:',
      equipeTitulo: 'Contact the BananaPrice Team',
      equipeTexto:
        'Have a question, found a bug in our catalog, or want to suggest a new feature? Reach out to us through the following channels:',
      emailOficial: 'Official Email',
      emailDesc: 'For general questions, feedback, and bug reports.',
      comunidadeTitulo: 'Community & Repository',
      comunidadeDesc: 'Follow issues, releases, and platform updates.',
      feedbackTitulo: 'Feedback',
      feedbackLink: 'Feedback Form',
      feedbackDesc: 'Tell us what you think of the site, suggest improvements, or report a bug. It takes less than 5 minutes.',
    },
    turbo: {
      titulo: 'Boost with Turbo',
      gerandoPix: 'Generating Pix payment...',
      copiaCola: 'Copy & Paste',
      copiado: 'Copied!',
      copiarAria: 'Copy Pix code',
      expirado: 'Expired!',
      tempoRestanteAria: 'Time left to pay',
      avisoValor: 'Remember to verify code and amount before completing payment!',
      verifiquePreview: 'Check the preview for the selected game.',
      voltarAoJogo: 'Back to game',
      erroCarregar: 'Error loading payment data. Please try again.',
      jogoNaoEncontrado: 'Game not found.',
      pagamentoCancelado: 'Payment was rejected or canceled. Please try again.',
      sucessoTitulo: 'Turbo Activated!',
      sucessoMensagem: 'Thank you for boosting the gamer community!',
      sucessoBotao: 'Back to home',
    },
  },
}

type IdiomaContextType = {
  idioma: Idioma
  mudarIdioma: (novoIdioma: Idioma) => void
  t: Dicionario
  formatarMoeda: (valor: number | null | undefined) => string
}

const IdiomaContext = createContext<IdiomaContextType>({
  idioma: 'pt-BR',
  mudarIdioma: () => {},
  t: dicionarios['pt-BR'],
  formatarMoeda: (v) => (v != null ? `R$ ${v.toFixed(2)}` : ''),
})

const CHAVE_STORAGE_IDIOMA = 'bp_idioma_preferido'

export function IdiomaProvider({ children }: { children: React.ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>('pt-BR')
  const [carregado, setCarregado] = useState(false)

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_STORAGE_IDIOMA) as Idioma | null
      if (salvo === 'pt-BR' || salvo === 'en-US') {
        setIdioma(salvo)
        document.documentElement.lang = salvo
      } else {
        const navegador = navigator.language
        if (navegador.startsWith('en')) {
          setIdioma('en-US')
          document.documentElement.lang = 'en-US'
        }
      }
    } catch {}
    setCarregado(true)
  }, [])

  const mudarIdioma = (novoIdioma: Idioma) => {
    setIdioma(novoIdioma)
    try {
      localStorage.setItem(CHAVE_STORAGE_IDIOMA, novoIdioma)
      document.documentElement.lang = novoIdioma
    } catch {}
  }

  const formatarMoeda = (valor: number | null | undefined): string => {
    if (valor == null) return ''
    if (idioma === 'en-US') {
      // Exibe formato em dólares ou BRL adaptado
      return valor.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    }
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const valor = {
    idioma,
    mudarIdioma,
    t: dicionarios[idioma],
    formatarMoeda,
  }

  return (
    <IdiomaContext.Provider value={valor}>
      {children}
    </IdiomaContext.Provider>
  )
}

export function useIdioma() {
  return useContext(IdiomaContext)
}
