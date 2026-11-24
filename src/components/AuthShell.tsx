'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { logo, palmeira, bananas } from './assets'
import { useIdioma } from './contexts/IdiomaContext'

/**
 * Envelope visual (Shell) com cenários temáticos (palmeiras, bananas e logo) para as telas de login e cadastro.
 *
 * @param props Contém os elementos filhos `children` exibidos no interior do card.
 * @returns Elemento JSX com a moldura de autenticação.
 */
export default function AuthShell({ children }: { children: ReactNode }) {
  const { idioma, mudarIdioma } = useIdioma()

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bp-bg px-4 py-10">
      {/* Seletor de Idioma no Canto Superior */}
      <aside aria-label="Seleção de idioma" className="absolute top-4 right-4 z-20 flex items-center gap-1 rounded-full border border-bp-nav/80 bg-bp-surface/90 p-1 shadow-md backdrop-blur-sm">
        <button
          type="button"
          onClick={() => mudarIdioma('pt-BR')}
          title="Português (Brasil)"
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition ${
            idioma === 'pt-BR'
              ? 'bg-bp-primary text-bp-neutral shadow-sm'
              : 'text-bp-muted hover:text-white'
          }`}
        >
          <span>🇧🇷</span>
          <span>PT</span>
        </button>
        <button
          type="button"
          onClick={() => mudarIdioma('en-US')}
          title="English (US)"
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition ${
            idioma === 'en-US'
              ? 'bg-bp-primary text-bp-neutral shadow-sm'
              : 'text-bp-muted hover:text-white'
          }`}
        >
          <span>🇺🇸</span>
          <span>EN</span>
        </button>
      </aside>

      <Image
        src={palmeira}
        alt=""
        width={750}
        height={625}
        priority
        className="pointer-events-none absolute -bottom-[4%] right-[7%] h-auto w-[min(750px,52vw)] max-[700px]:hidden"
      />
      <Image
        src={bananas}
        alt=""
        width={230}
        height={192}
        className="pointer-events-none absolute bottom-[4%] left-[22%] h-auto w-[230px] [transform:rotate(-165deg)_scaleY(-1)] max-[700px]:hidden"
      />
      <div className="pointer-events-none absolute h-[677px] w-[703px] rounded-full bg-bp-primary/5 blur-[32px]" />

      <div className="relative z-[1] w-full max-w-[448px]">
        <Link href="/">
          <Image
            src={logo}
            alt="BananaPrice"
            width={780}
            height={250}
            className="pointer-events-none relative left-1/2 z-[2] mx-auto -mb-[80px] block h-auto w-[780px] max-w-[150%] -translate-x-1/2"
          />
        </Link>
        <section className="flex flex-col gap-6 rounded-[32px] bg-bp-surface px-10 pb-10 pt-14 shadow-xl max-[700px]:px-6 max-[700px]:pb-7">
          {children}
        </section>
      </div>
    </main>
  )
}
