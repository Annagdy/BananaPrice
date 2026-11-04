'use client'

import Image from 'next/image'

type LoadingProps = {
  mensagem?: string
  tamanho?: number
}

export default function Loading({
  mensagem = 'Carregando...',
  tamanho = 200,
}: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <Image
        src="/assets/loading.gif" // Caminho correto apontando para public/assets/
        alt="Carregando..."
        width={tamanho}
        height={tamanho}
        unoptimized
        className="object-contain"
      />
      {mensagem && (
        <p className="font-head text-sm font-semibold text-bp-muted animate-pulse">
          {mensagem}
        </p>
      )}
    </div>
  )
}