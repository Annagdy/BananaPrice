'use client'

import { useEffect, useState } from 'react'
import type { SVGProps } from 'react'
import Link from 'next/link'

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const SetaEsquerda = (p: SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" {...base} {...p}>
    <path d="M19 12H5M11 5l-7 7 7 7" />
  </svg>
)

const Coracao = ({ cheio, ...p }: SVGProps<SVGSVGElement> & { cheio: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" {...base} {...p} fill={cheio ? 'currentColor' : 'none'}>
    <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 000-7.8z" />
  </svg>
)

const Raio = (p: SVGProps<SVGSVGElement>) => (
  <svg width="22" height="26" viewBox="0 0 24 32" fill="currentColor" {...p}>
    <path d="M14 0L1 18h9l-3 14L23 12h-9z" />
  </svg>
)

const Pacote = (p: SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" {...base} {...p}>
    <path d="M21 8l-9-5-9 5 9 5 9-5z" />
    <path d="M3 8v8l9 5 9-5V8M12 13v8" />
  </svg>
)

const classeBotao =
  'flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-bp-primary bg-bp-neutral text-bp-primary shadow-[0_6px_14px_rgba(0,0,0,.35)] transition hover:scale-105 hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bp-primary disabled:opacity-60'

/* Botões de ação da página do jogo: voltar ao catálogo, lista de desejos, turbo e DLCs (só aparece se o jogo tem DLCs).
Em telas grandes ficam em coluna na lateral esquerda do painel; nas menores, em linha acima dele. */
export default function BotoesJogo({ idJogo, temDlcs }: { idJogo: number; temDlcs: boolean }) {
  const [naLista, setNaLista] = useState(false)
  const [salvando, setSalvando] = useState(false)

  /* Descobre se o jogo já está na lista (sem sessão, 401, o coração fica vazio). */
  useEffect(() => {
    let ativo = true
    fetch('/api/v1/wishlist')
      .then(async (res) => {
        if (!res.ok) return
        const json = await res.json().catch(() => null)
        if (ativo && json?.jogos?.some((j: { id: number }) => j.id === idJogo)) setNaLista(true)
      })
      .catch(() => {})
    return () => {
      ativo = false
    }
  }, [idJogo])

  const alternarLista = async () => {
    if (salvando) return
    setSalvando(true)
    try {
      const res = naLista
        ? await fetch(`/api/v1/wishlist/${idJogo}`, { method: 'DELETE' })
        : await fetch('/api/v1/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idJogo }),
          })

      if (res.status === 401) {
        window.location.href = `/login?next=/jogos/${idJogo}`
        return
      }
      if (res.ok) setNaLista(!naLista)
    } finally {
      setSalvando(false)
    }
  }

  const rotuloLista = naLista ? 'Remover da lista de desejos' : 'Adicionar à lista de desejos'

  return (
    <nav
      aria-label="Ações do jogo"
      className="flex w-full max-w-[1200px] flex-row gap-3 2xl:absolute 2xl:right-full 2xl:top-0 2xl:mr-4 2xl:w-auto 2xl:flex-col"
    >
      <Link href="/jogos" title="Voltar ao catálogo" aria-label="Voltar ao catálogo" className={classeBotao}>
        <SetaEsquerda />
      </Link>

      <button
        type="button"
        onClick={alternarLista}
        disabled={salvando}
        title={rotuloLista}
        aria-label={rotuloLista}
        aria-pressed={naLista}
        className={classeBotao}
      >
        <Coracao cheio={naLista} />
      </button>

      <Link href={`/turbo/${idJogo}`} title="Dar um turbo" aria-label="Dar um turbo" className={classeBotao}>
        <Raio />
      </Link>

      {temDlcs && (
        <a href="#dlcs" title="Ver DLCs" aria-label="Ver DLCs" className={classeBotao}>
          <Pacote />
        </a>
      )}
    </nav>
  )
}
