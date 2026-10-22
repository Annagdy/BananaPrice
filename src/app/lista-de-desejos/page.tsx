'use client'

import { useEffect, useState } from 'react'
import type { SVGProps } from 'react'
import Image from 'next/image'
import Nav from '../../components/Nav'
import Footer from '../../components/Footer'
import { capaExemplo, macacoFeliz } from '../../components/assets'

type ItemDesejo = {
  id: number
  nome: string
  precoOriginal: number | null
  precoComDesconto: number | null
  desconto: number
  loja: string | null
  url: string
}

// // TODO: vir da API (/api/v1/wishlist). Por enquanto são dados de exemplo.
// const ITENS: ItemDesejo[] = Array.from({ length: 9 }, (_, i) => ({
//   id: i + 1,
//   nome: 'Game Name',
//   precoOriginal: 100,
//   precoComDesconto: 60,
//   desconto: 40,
//   url: '#',
// }))

const POR_PAGINA = 3

const brl = (valor: number): string =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function ListaDeDesejosPage() {
  const [itens, setItens] = useState<ItemDesejo[]>([])
  const [carregando, setCarregando] = useState<boolean>(true)
  const [erro, setErro] = useState<string | null>(null)
  const [pagina, setPagina] = useState<number>(1)

  useEffect(() => {
    fetch('/api/v1/wishlist')
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = '/login?next=/lista-de-desejos'
          return
        }
        const json = await res.json().catch(() => null)
        if (!res.ok) throw new Error(json?.error ?? 'Erro ao carregar a lista.')
        setItens(json.jogos ?? [])
      })
      .catch((e: Error) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [])

  const totalPaginas = Math.max(1, Math.ceil(itens.length / POR_PAGINA))
  const visiveis = itens.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
  const irPara = (p: number) => setPagina(Math.min(Math.max(p, 1), totalPaginas))

  const remover = async (id: number) => {
    const res = await fetch(`/api/v1/wishlist/${id}`, { method: 'DELETE' })
    if (!res.ok) return

    const novos = itens.filter((i) => i.id !== id)
    setItens(novos)
    // se a página atual ficou vazia, volta uma
    const total = Math.max(1, Math.ceil(novos.length / POR_PAGINA))
    setPagina((p) => Math.min(p, total))
  }

  return (
    <div className="flex min-h-screen flex-col bg-bp-bg">
      <Nav logado />

      <main className="flex flex-1 flex-col pb-10">
        <h1 className="flex items-center gap-3 px-[38px] py-5 font-head text-[32px] font-extrabold text-bp-primary max-[640px]:px-4 max-[640px]:text-2xl">
          <HeartIcon className="size-[57px] shrink-0 max-[640px]:size-10" />
          Lista de Desejos
        </h1>

        <div className="mx-2.5 h-[5px] rounded-[2px] bg-[#3d3b2e]" />

        <div className="grid grid-cols-[minmax(0,828px)_minmax(0,526px)] justify-center gap-[21px] px-[38px] pt-10 max-[1200px]:grid-cols-1 max-[640px]:px-4">
          <section aria-label="Jogos desejados" className="flex flex-col items-center gap-6">
            {carregando ? (
              <p className="text-bp-muted">Carregando...</p>
            ) : erro ? (
              <p role="alert" className="text-red-400">
                {erro}
              </p>
            ) : itens.length === 0 ? (
              <p className="text-bp-muted">Sua lista de desejos está vazia.</p>
            ) : (
              <ul className="flex w-full list-none flex-col gap-[33px]">
                {visiveis.map((item) => (
                  <CartaoDesejo key={item.id} item={item} onRemover={remover} />
                ))}
              </ul>
            )}

            {itens.length > POR_PAGINA && (
              <nav aria-label="Paginação" className="flex items-center gap-3 rounded-lg bg-bp-nav px-3 py-1">
                <button
                  type="button"
                  onClick={() => irPara(pagina - 1)}
                  disabled={pagina === 1}
                  aria-label="Página anterior"
                  className="h-5 w-2 cursor-pointer bg-bp-primary [clip-path:polygon(100%_0,100%_100%,0_50%)] disabled:cursor-default disabled:opacity-40"
                />
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => irPara(p)}
                    aria-label={`Página ${p}`}
                    aria-current={p === pagina ? 'page' : undefined}
                    className={`grid size-[21px] cursor-pointer place-items-center rounded-full font-head text-[15px] font-extrabold ${
                      p === pagina ? 'bg-[#ffecb9] text-bp-nav' : 'text-[#ffecb9]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
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
              O Bananinha fica atento nos seus jogos desejados
            </h2>
            <p className="max-w-[352px] p-2.5 text-center text-2xl leading-7 text-bp-muted max-[640px]:text-base">
              Fique atento à notificações tanto no seu e-mail quanto no site!
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

      <div className="h-[5px] bg-[#3d322e]" />
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
  const temDesconto = item.desconto > 0 && item.precoOriginal !== null

  return (
    <li className="relative flex min-h-[208px] items-center gap-2.5 overflow-hidden rounded-3xl bg-[#3d322e] p-2.5 shadow-[0_25px_50px_-12px_rgba(0,0,0,.25)] max-[640px]:flex-col max-[640px]:items-stretch">
      <Image
        src={capaExemplo}
        alt=""
        width={177}
        height={177}
        className="size-[177px] shrink-0 rounded-3xl object-cover max-[640px]:w-full"
      />

      <div className="flex flex-1 flex-col justify-between gap-6 self-stretch py-5 pr-2.5 max-[640px]:py-2">
        <h2 className="pr-28 font-head text-4xl font-extrabold text-bp-muted max-[640px]:text-2xl">{item.nome}</h2>

        <div className="flex items-end justify-between gap-4 max-[640px]:flex-wrap">
          <div className="flex flex-col gap-2.5">
            {temDesconto && (
              <span className="text-xl text-bp-muted/60 line-through max-[640px]:text-base">
                {brl(item.precoOriginal as number)}
              </span>
            )}
            <span className="font-head text-2xl font-extrabold text-bp-primary max-[640px]:text-xl">
              {item.precoComDesconto !== null ? brl(item.precoComDesconto) : 'Sem preço'}
            </span>
            {item.loja && <span className="text-sm text-bp-muted/70">na {item.loja}</span>}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onRemover(item.id)}
              className="cursor-pointer rounded-[9px] border border-bp-muted px-4 py-2 text-sm text-bp-muted transition hover:brightness-125"
            >
              Remover
            </button>
            <Link
              href={item.url}
              className="inline-flex items-center gap-2 rounded-[9px] bg-bp-muted px-4 py-2 text-sm text-bp-neutral transition hover:brightness-110"
            >
              <ExternalIcon className="size-[25px]" />
              Ver ofertas
            </Link>
          </div>
        </div>
      </div>

      {item.desconto > 0 && (
        <div className="absolute right-0 top-6 flex h-[56px] items-center bg-bp-primary pl-9 pr-1 [clip-path:polygon(22px_0,100%_0,100%_100%,22px_100%,0_50%)]">
          <span className="font-head text-[32px] font-extrabold leading-none text-bp-neutral">{item.desconto}%</span>
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