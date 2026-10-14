export type Notificacao = {
  id: number
  titulo: string
  descricao: string
  imagem: string | null
}

// Dados fake só para montar a tela.
export const notificacoes: Notificacao[] = Array.from({ length: 4 }, (_, i) => ({
  id: i + 1,
  titulo: 'Notificação',
  descricao: 'Descricação da notificação',
  imagem: null,
}))
