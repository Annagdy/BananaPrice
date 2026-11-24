'use client'

import Loading from '@/components/loading'
import { useIdioma } from '@/components/contexts/IdiomaContext'

export default function LoadingJogo() {
  const { idioma } = useIdioma()
  const mensagem = idioma === 'en-US' ? 'Loading game details...' : 'Carregando detalhes do jogo...'

  return (
    <div className="flex min-h-[75vh] w-full items-center justify-center bg-bp-bg">
      <Loading mensagem={mensagem} tamanho={200} />
    </div>
  )
}