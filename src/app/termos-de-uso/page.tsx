'use client'

import Image from 'next/image'
import Link from 'next/link'
import Nav from '../../components/Nav'
import Footer from '../../components/Footer'
import { termosDeUsoImg } from '../../components/assets'
import { useIdioma } from '@/components/contexts/IdiomaContext'

export default function TermosDeUsoPage() {
  const { t } = useIdioma()
  const tp = t.transparencia

  return (
    <div className="flex min-h-screen flex-col bg-bp-bg">
      <header className="sticky top-0 z-50 w-full shrink-0">
        <Nav logado />
      </header>

      <main className="flex-1 px-4 py-8 sm:px-8 sm:py-12 lg:px-16 max-w-4xl mx-auto w-full">
        <div className="rounded-3xl border-2 border-[#3d322e] bg-bp-surface p-6 sm:p-10 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#3d322e] pb-4">
            <div>
              <h1 className="font-head text-3xl sm:text-4xl font-extrabold text-bp-primary">
                {tp.termosTitulo}
              </h1>
              <p className="mt-1 text-xs text-bp-muted/60">
                {tp.ultimaAtualizacao}
              </p>
            </div>
            <div className="relative size-24 sm:size-28 shrink-0 self-center sm:self-auto">
              <Image
                src={termosDeUsoImg}
                alt={tp.termosTitulo}
                width={120}
                height={120}
                className="size-full object-contain drop-shadow-md"
              />
            </div>
          </div>

          <section className="space-y-3 text-sm sm:text-base leading-relaxed text-bp-muted">
            <h2 className="font-head text-xl font-bold text-bp-text">
              {tp.termosSec1Titulo}
            </h2>
            <p>
              {tp.termosSec1Texto}
            </p>
          </section>

          <section className="space-y-3 text-sm sm:text-base leading-relaxed text-bp-muted">
            <h2 className="font-head text-xl font-bold text-bp-text">
              {tp.termosSec2Titulo}
            </h2>
            <p>
              {tp.termosSec2P1}
            </p>
            <p>
              {tp.termosSec2P2}
            </p>
          </section>

          <section className="space-y-3 text-sm sm:text-base leading-relaxed text-bp-muted">
            <h2 className="font-head text-xl font-bold text-bp-text">
              {tp.termosSec3Titulo}
            </h2>
            <p>
              {tp.termosSec3Texto}
            </p>
          </section>

          <section className="space-y-3 text-sm sm:text-base leading-relaxed text-bp-muted">
            <h2 className="font-head text-xl font-bold text-bp-text">
              {tp.termosSec4Titulo}
            </h2>
            <p>
              {tp.termosSec4Texto}
            </p>
          </section>

          <section className="space-y-3 text-sm sm:text-base leading-relaxed text-bp-muted">
            <h2 className="font-head text-xl font-bold text-bp-text">
              {tp.termosSec5Titulo}
            </h2>
            <p>
              {tp.termosSec5Texto}
            </p>
          </section>

          <div className="pt-4 border-t border-[#3d322e] flex justify-between items-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-bp-primary px-4 py-2 font-head text-xs font-bold text-bp-neutral transition hover:brightness-110 active:scale-95"
            >
              {tp.voltarInicio}
            </Link>
            <Link
              href="/politica-de-privacidade"
              className="text-xs text-bp-muted hover:text-bp-primary transition underline"
            >
              {tp.verPolitica}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
