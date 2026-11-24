'use client'

import Image from 'next/image'
import Link from 'next/link'
import Nav from '../../components/Nav'
import Footer from '../../components/Footer'
import { contatoEApiImg } from '../../components/assets'
import { useIdioma } from '@/components/contexts/IdiomaContext'

export default function ContatoApiPage() {
  const { t } = useIdioma()
  const tp = t.transparencia

  return (
    <div className="flex min-h-screen flex-col bg-bp-bg">
      <header className="sticky top-0 z-50 w-full shrink-0">
        <Nav logado />
      </header>

      <main className="flex-1 px-4 py-8 sm:px-8 sm:py-12 lg:px-16 max-w-4xl mx-auto w-full">
        <div className="rounded-3xl border-2 border-[#3d322e] bg-bp-surface p-6 sm:p-10 shadow-xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#3d322e] pb-4">
            <div>
              <h1 className="font-head text-3xl sm:text-4xl font-extrabold text-bp-primary">
                {tp.contatoTitulo}
              </h1>
              <p className="mt-1 text-xs text-bp-muted/60">
                {tp.contatoSubtitulo}
              </p>
            </div>
            <div className="relative size-24 sm:size-28 shrink-0 self-center sm:self-auto">
              <Image
                src={contatoEApiImg}
                alt={tp.contatoTitulo}
                width={120}
                height={120}
                className="size-full object-contain drop-shadow-md"
              />
            </div>
          </div>

          {/* Seção sobre a API Pública / IsThereAnyDeal */}
          <section className="space-y-4 rounded-2xl border border-bp-primary/30 bg-bp-nav/60 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-bp-primary text-bp-neutral font-head font-black text-xs tracking-tight select-none shadow-sm">
                ITAD
              </span>
              <h2 className="font-head text-xl sm:text-2xl font-bold text-bp-primary">
                {tp.apiSecTitulo}
              </h2>
            </div>

            <p className="text-sm sm:text-base leading-relaxed text-bp-muted">
              {tp.apiSecTexto}{' '}
              <a
                href="https://isthereanydeal.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-bp-primary underline hover:text-white transition"
              >
                IsThereAnyDeal (ITAD)
              </a>
              .
            </p>

            <div className="rounded-xl bg-bp-neutral p-4 text-xs sm:text-sm text-bp-muted/90 space-y-2">
              <p>
                <strong>{tp.apiCreditosTitulo}</strong> {tp.apiCreditosTexto}
              </p>
              <p>
                {tp.apiDocTexto}{' '}
                <a
                  href="https://isthereanydeal.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bp-primary underline hover:text-white transition"
                >
                  https://isthereanydeal.com
                </a>
                .
              </p>
            </div>
          </section>

          {/* Seção de Contato e Suporte */}
          <section className="space-y-4">
            <h2 className="font-head text-xl sm:text-2xl font-bold text-bp-text">
              {tp.equipeTitulo}
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-bp-muted">
              {tp.equipeTexto}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="rounded-2xl border border-[#3d322e] bg-bp-neutral p-4">
                <span className="block text-xs uppercase font-bold text-bp-primary tracking-wider mb-1">
                  {tp.emailOficial}
                </span>
                <a
                  href="mailto:bananaprice.not@gmail.com"
                  className="font-head text-base sm:text-lg font-bold text-bp-text hover:text-bp-primary transition break-all"
                >
                  bananaprice.not@gmail.com
                </a>
                <p className="mt-1 text-xs text-bp-muted/70">
                  {tp.emailDesc}
                </p>
              </div>

              <div className="rounded-2xl border border-[#3d322e] bg-bp-neutral p-4">
                <span className="block text-xs uppercase font-bold text-bp-primary tracking-wider mb-1">
                  {tp.comunidadeTitulo}
                </span>
                <a
                  href="https://github.com/Annagdy/BananaPrice"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-head text-base sm:text-lg font-bold text-bp-text hover:text-bp-primary transition"
                >
                  GitHub / BananaPrice
                </a>
                <p className="mt-1 text-xs text-bp-muted/70">
                  {tp.comunidadeDesc}
                </p>
              </div>

              <div className="rounded-2xl border border-[#3d322e] bg-bp-neutral p-4 sm:col-span-2">
                <span className="block text-xs uppercase font-bold text-bp-primary tracking-wider mb-1">
                  {tp.feedbackTitulo}
                </span>
                <a
                  href="https://forms.gle/qQhhwYT7QhDh4u6CA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-head text-base sm:text-lg font-bold text-bp-text hover:text-bp-primary transition"
                >
                  {tp.feedbackLink}
                </a>
                <p className="mt-1 text-xs text-bp-muted/70">
                  {tp.feedbackDesc}
                </p>
              </div>
            </div>
          </section>

          <div className="pt-4 border-t border-[#3d322e] flex justify-between items-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-bp-primary px-4 py-2 font-head text-xs font-bold text-bp-neutral transition hover:brightness-110 active:scale-95"
            >
              {tp.voltarInicio}
            </Link>
            <Link
              href="/termos-de-uso"
              className="text-xs text-bp-muted hover:text-bp-primary transition underline"
            >
              {tp.verTermos}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}