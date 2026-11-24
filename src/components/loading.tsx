'use client'

import Image from 'next/image'
import { useIdioma } from './contexts/IdiomaContext'

type LoadingProps = {
  mensagem?: string
  tamanho?: number
}

export default function Loading({
  mensagem,
  tamanho = 200,
}: LoadingProps) {
  const { idioma } = useIdioma()
  const textoPadrao = idioma === 'en-US' ? 'Loading...' : 'Carregando...'
  const textoExibido = mensagem !== undefined ? mensagem : textoPadrao

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <Image
        src="/assets/loading.gif" // Caminho correto apontando para public/assets/
        alt={textoPadrao}
        width={tamanho}
        height={tamanho}
        unoptimized
        className="object-contain"
      />
      {textoExibido && (
        <p className="font-head text-sm font-semibold text-bp-muted animate-pulse">
          {textoExibido}
        </p>
      )}
    </div>
  )
}