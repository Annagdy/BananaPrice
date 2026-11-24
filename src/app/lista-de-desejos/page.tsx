'use client'

import { useEffect, useState } from 'react'
import type { SVGProps } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Divisor from '@/components/Divisor'
import Loading from '@/components/loading'
import { capaExemplo, macacoFeliz } from '@/components/assets'
import { useIdioma } from '@/components/contexts/IdiomaContext'

type ItemDesejo = {
  id: number
  nome: string
  capa: string | null
  precoOriginal: number | null
  precoComDesconto: number | null
  desconto: number
  loja: string | null
  url: string
}

const POR_PAGINA = 3

const brl = (valor: number): string =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function ListaDeDesejosPage() {
  const { t } = useIdioma()
  const [itens, setItens] = useState<ItemDesejo[]>([])
  const [carregando, setCarregando] = useState<boolean>(true)
  const [erro, setErro] = useState<string | null>(null)
  const [pagina, setPagina] = useState<number>(1)

  useEffect(() => {
    let ativo = true
    setCarregando(true)

    fetch('/api/v1/wishlist')
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = '/login?next=/lista-de-desejos'
          return
        }
        const json = await res.json().catch(() => null)
        if (!res.ok) throw new Error(json?.error ?? 'Erro ao carregar a lista.')
        
        if (ativo) {
          setItens(json?.jogos ?? [])
        }
      })
      .catch((e: Error) => {
        if (ativo) setErro(e.message)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  const totalPaginas = Math.max(1, Math.ceil(itens.length / POR_PAGINA))
  const visiveis = itens.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
  const irPara = (p: number) => setPagina(Math.min(Math.max(p, 1), totalPaginas))

  // Gera páginas para exibir de forma responsiva sem vazar números na tela
  const paginasExibidas = (() => {
    if (totalPaginas <= 7) return Array.from({ length: totalPaginas }, (_, i) => i + 1)
    const set = new Set<number>([1, totalPaginas, pagina, pagina - 1, pagina + 1])
    return Array.from(set).filter((p) => p >= 1 && p <= totalPaginas).sort((a, b) => a - b)
  })()

  const remover = async (id: number) => {
    const res = await fetch(`/api/v1/wishlist/${id}`, { method: 'DELETE' })
    if (!res.ok) return

    const novos = itens.filter((i) => i.id !== id)
    setItens(novos)
    const total = Math.max(1, Math.ceil(novos.length / POR_PAGINA))
    setPagina((p) => Math.min(p, total))
  }

  return (
    <div className="flex min-h-screen flex-col bg-bp-bg">
      {/* Topo Fixo com a linha marrom integrada no Nav */}
      <header className="sticky top-0 z-50 w-full shrink-0">
        <Nav logado />
      </header>

      {/* Conteúdo Principal mantendo exatamente os espaçamentos originais */}
      <main className="flex flex-1 flex-col pb-10">
        <h1 className="flex items-center gap-3 px-[38px] py-5 font-head text-[32px] font-extrabold text-bp-primary max-[640px]:px-4 max-[640px]:text-2xl">
          <HeartIcon className="size-[57px] shrink-0 max-[640px]:size-10" />
          {t.wishlist.titulo}
        </h1>

        {/* Divisor com a mesma cor `#3d322e` dos cards da conta */}
        <Divisor cor="#3d322e" className="my-0" />

        <div className="grid grid-cols-[minmax(0,828px)_minmax(0,526px)] justify-center gap-[21px] px-[38px] pt-10 max-[1200px]:grid-cols-1 max-[640px]:px-4">
          <section aria-label="Jogos desejados" className="flex w-full min-h-[350px] flex-col items-center justify-start gap-6">
            {carregando ? (
              <div className="flex w-full min-h-[300px] items-center justify-center py-12">
                <Loading mensagem={t.wishlist.carregando} tamanho={160} />
              </div>
            ) : erro ? (
              <p role="alert" className="py-10 text-center text-red-400">
                {erro}
              </p>
            ) : itens.length === 0 ? (
              <p className="py-10 text-center text-bp-muted">{t.wishlist.vazia}</p>
            ) : (
              <ul className="flex w-full list-none flex-col gap-[33px]">
                {visiveis.map((item) => (
                  <CartaoDesejo key={item.id} item={item} onRemover={remover} />
                ))}
              </ul>
            )}

            {!carregando && itens.length > POR_PAGINA && (
              <nav aria-label="Paginação" className="flex max-w-full flex-wrap items-center justify-center gap-2 rounded-xl bg-bp-nav px-3 py-1.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => irPara(pagina - 1)}
                  disabled={pagina === 1}
                  aria-label="Página anterior"
                  className="h-5 w-2 cursor-pointer bg-bp-primary [clip-path:polygon(100%_0,100%_100%,0_50%)] disabled:cursor-default disabled:opacity-40"
                />
                {paginasExibidas.map((p, idx) => {
                  const anterior = paginasExibidas[idx - 1]
                  const temSalto = anterior !== undefined && p - anterior > 1
                  return (
                    <span key={p} className="flex items-center gap-2">
                      {temSalto && <span className="text-xs text-bp-muted/50">...</span>}
                      <button
                        type="button"
                        onClick={() => irPara(p)}
                        aria-label={`Página ${p}`}
                        aria-current={p === pagina ? 'page' : undefined}
                        className={`grid size-6 cursor-pointer place-items-center rounded-full font-head text-xs font-extrabold ${
                          p === pagina ? 'bg-bp-primary text-bp-neutral shadow' : 'text-bp-muted hover:text-bp-primary'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  )
                })}
                <button
                  type="button"
                  onClick={() => irPara(pagina + 1)}
                  disabled={pagina === totalPaginas}
                  aria-label="Próxima página"
                  className="h-5 w-2 cursor-pointer bg-bp-primary [clip-path:polygon(0_0,100%_50%,0_100%)] disabled:cursor-default disabled:opacity-40"
                />
              </nav>
            )}
          </section>

          <aside className="flex h-fit flex-col items-center gap-2.5 self-center rounded-3xl bg-[#3d322e] p-2.5 shadow-[0_25px_50px_-12px_rgba(0,0,0,.25)] max-[1200px]:order-first">
            <h2 className="p-2.5 text-center font-head text-4xl font-extrabold text-bp-muted max-[640px]:text-2xl">
              {t.wishlist.avisoTitulo}
            </h2>
            <p className="max-w-[352px] p-2.5 text-center text-2xl leading-7 text-bp-muted max-[640px]:text-base">
              {t.wishlist.avisoDescricao}
            </p>
            <Image
              src={macacoFeliz}
              alt=""
              width={287}
              height={287}
              className="size-[287px] max-[640px]:size-[200px]"
            />
          </aside>
        </div>
      </main>

      {/* Footer no final do scroll */}
      <Footer />
    </div>
  )
}

function CartaoDesejo({
  item,
  onRemover,
}: {
  item: ItemDesejo
  onRemover: (id: number) => void
}) {
  const { t, formatarMoeda } = useIdioma()
  const temDesconto = item.desconto > 0 && item.precoOriginal !== null

  const [falhou, setFalhou] = useState(false)
  useEffect(() => setFalhou(false), [item.capa])
  const capaRemota = !!item.capa && !falhou

  return (
    <li className="relative flex flex-row items-center gap-2.5 sm:gap-3 overflow-hidden rounded-2xl sm:rounded-3xl bg-[#3d322e] p-2.5 sm:p-3 shadow-[0_25px_50px_-12px_rgba(0,0,0,.25)]">
      {/* Capa Compacta no Mobile */}
      <div className="relative size-[88px] sm:size-[140px] md:size-[177px] shrink-0 overflow-hidden rounded-xl sm:rounded-2xl">
        <Image
          src={capaRemota ? (item.capa as string) : capaExemplo}
          alt={item.nome}
          fill
          sizes="(max-width: 640px) 88px, (max-width: 768px) 140px, 177px"
          unoptimized={capaRemota}
          onError={() => setFalhou(true)}
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between gap-1.5 sm:gap-4 self-stretch py-0.5 sm:py-2 pr-0 sm:pr-2.5 min-w-0">
        <h2 className="line-clamp-2 pr-12 sm:pr-20 font-head text-sm sm:text-2xl lg:text-3xl font-extrabold text-bp-muted leading-tight">
          {item.nome}
        </h2>

        <div className="flex flex-wrap items-end justify-between gap-2 sm:gap-4 mt-auto">
          <div className="flex flex-col gap-0.5 sm:gap-1.5">
            {temDesconto && (
              <span className="text-[10px] sm:text-sm lg:text-base text-bp-muted/60 line-through">
                {formatarMoeda(item.precoOriginal as number)}
              </span>
            )}
            <span className="font-head text-sm sm:text-xl lg:text-2xl font-extrabold text-bp-primary leading-tight">
              {item.precoComDesconto !== null ? formatarMoeda(item.precoComDesconto) : t.wishlist.semPreco}
            </span>
            {item.loja && <span className="text-[10px] sm:text-xs text-bp-muted/70">{t.wishlist.naLoja(item.loja)}</span>}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => onRemover(item.id)}
              className="cursor-pointer rounded-[7px] sm:rounded-[9px] border border-bp-muted px-2.5 py-1 sm:px-3.5 sm:py-1.5 text-[11px] sm:text-sm text-bp-muted transition hover:brightness-125 active:scale-95"
            >
              {t.wishlist.remover}
            </button>
            <Link
              href={item.url}
              className="inline-flex items-center gap-1 sm:gap-1.5 rounded-[7px] sm:rounded-[9px] bg-bp-muted px-2.5 py-1 sm:px-3.5 sm:py-1.5 text-[11px] sm:text-sm text-bp-neutral transition hover:brightness-110 active:scale-95"
            >
              <ExternalIcon className="size-3.5 sm:size-4" />
              {t.wishlist.verOfertas}
            </Link>
          </div>
        </div>
      </div>

      {item.desconto > 0 && (
        <div className="absolute right-0 top-2 sm:top-4 flex h-6 sm:h-9 items-center bg-bp-primary pl-3.5 sm:pl-7 pr-1 [clip-path:polygon(10px_0,100%_0,100%_100%,10px_100%,0_50%)] sm:[clip-path:polygon(16px_0,100%_0,100%_100%,16px_100%,0_50%)]">
          <span className="font-head text-xs sm:text-lg font-extrabold leading-none text-bp-neutral">-{item.desconto}%</span>
        </div>
      )}
    </li>
  )
}

type IconProps = SVGProps<SVGSVGElement>

function HeartIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="text-bp-primary" aria-hidden="true" {...props}>
      <path d="M12 21s-8.5-5.3-8.5-11.2A4.8 4.8 0 0 1 12 7a4.8 4.8 0 0 1 8.5 2.8C20.5 15.7 12 21 12 21z" />
    </svg>
  )
}

function ExternalIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h5" />
      <path d="M14 4h6v6" />
      <path d="M20 4l-9 9" />
    </svg>
  )
}