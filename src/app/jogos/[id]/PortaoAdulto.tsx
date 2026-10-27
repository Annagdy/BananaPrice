'use client'

import Link from 'next/link'
import { definirAdultoNoNavegador } from '@/lib/adulto'

export default function PortaoAdulto() {
  const liberar = () => {
    if (window.confirm('Este jogo tem conteúdo adulto. Você tem 18 anos ou mais?')) {
      definirAdultoNoNavegador(true)
      window.location.reload()
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bp-bg px-5 text-center text-bp-muted">
      <h1 className="font-head text-3xl font-extrabold text-bp-primary">Conteúdo adulto</h1>
      <p>Este jogo é classificado como adulto e está oculto por padrão.</p>
      <div className="flex gap-3">
        <button onClick={liberar} className="cursor-pointer rounded-[9px] bg-bp-primary px-6 py-2.5 text-bp-neutral">
          Tenho 18 anos ou mais
        </button>
        <Link href="/jogos" className="rounded-[9px] border border-bp-muted px-6 py-2.5">Voltar</Link>
      </div>
    </main>
  )
}