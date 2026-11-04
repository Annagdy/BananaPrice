'use client'

import { useEffect, useState, Suspense } from 'react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Nav from '../../components/Nav'
import Footer from '../../components/Footer'
import GameCard from '../../components/GameCard'
import Loading from '@/components/loading'
import { StoreIcon, TagIcon } from '../../components/Icons'
import { palmeira } from '../../components/assets'
import { STORES, PRICE_FILTERS, CUT_FILTERS, PER_PAGE } from '../../mocks/promos'
import type { Game } from '../../mocks/games'
import { tema } from '../../mocks/tema'
import { adultoAtivoNoNavegador, definirAdultoNoNavegador } from '../../lib/adulto'
import { urlCapaItad } from '../../lib/itad.ts' 
import { useRouter, useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

const paraCard = (j: any): Game => {
  const coverUrl = j.capa ?? (j.itad_id ? urlCapaItad(j.itad_id) : null)

  if ('melhorPreco' in j || 'desconto' in j) {
    return {
      id: j.id ?? j.id_jogo ?? 0,
      name: j.titulo ?? 'Sem título',
      store: j.loja ?? 'Sem oferta',
      discount: j.desconto ?? 0,
      originalPrice: j.precoOriginal ?? 0,
      price: j.melhorPreco ?? 0,
      cover: coverUrl,
    }
  }

  const promocoes = j.promocoes || []
  const melhorPromo = promocoes.length > 0 
    ? promocoes.reduce((min: any, p: any) => {
        if (p.valor_atual == null) return min
        if (min.valor_atual == null) return p
        return p.valor_atual < min.valor_atual ? p : min
      }, promocoes[0])
    : null

  const loja = melhorPromo?.loja
    ? Array.isArray(melhorPromo.loja)
      ? melhorPromo.loja[0]?.nome
      : melhorPromo.loja.nome
    : 'Sem oferta'

  const price = melhorPromo?.valor_atual ?? 0
  const discount = melhorPromo?.percentual_desconto ?? 0
  const originalPrice = discount > 0 ? price / (1 - discount / 100) : price

  return {
    id: j.id_jogo ?? j.id ?? 0,
    name: j.titulo ?? 'Sem título',
    store: loja ?? 'Sem oferta',
    discount: discount,
    originalPrice: originalPrice,
    price: price,
    cover: coverUrl,
  }
}

function Opcao({
  label,
  ativa,
  onClick,
}: {
  label: string
  ativa: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativa}
      className={`w-[254px] cursor-pointer rounded-[20px] px-7 py-1.5 text-left font-body text-2xl transition max-[640px]:w-full max-[640px]:text-xl ${
        ativa
          ? 'bg-bp-primary/15 text-bp-primary'
          : 'text-bp-muted hover:bg-bp-muted/10'
      }`}
    >
      {label}
    </button>
  )
}

function Grupo({
  titulo,
  icone,
  children,
}: {
  titulo: string
  icone: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5 p-2.5">
      <h2 className="flex items-center gap-2.5 p-5 font-head text-2xl font-extrabold text-bp-primary">
        {icone}
        {titulo}
      </h2>
      {children}
    </div>
  )
}

function ConteudoJogos() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const termoNaUrl = (searchParams.get('search') || searchParams.get('busca') || '').trim()

  const [termoBusca, setTermoBusca] = useState(termoNaUrl)

  useEffect(() => {
    setTermoBusca(termoNaUrl)
  }, [termoNaUrl])

  const [resultadoBusca, setResultadoBusca] = useState<any[]>([])
  const [carregandoBusca, setCarregandoBusca] = useState(false)
  const [erroBusca, setErroBusca] = useState<string | null>(null)

  const [precoMax, setPrecoMax] = useState<number | null>(null)
  const [corteMin, setCorteMin] = useState<number | null>(null)
  const [lojas, setLojas] = useState<string[]>([])
  const [pagina, setPagina] = useState(1)

  const [adulto, setAdulto] = useState(false)

  const [jogos, setJogos] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [erroCatalogo, setErroCatalogo] = useState<string | null>(null)

  const totalPaginas = Math.max(1, Math.ceil(total / PER_PAGE))
  const atual = Math.min(pagina, totalPaginas)

  const escolher = (
    definir: (v: number | null) => void,
    valorAtual: number | null,
    v: number,
  ) => {
    definir(valorAtual === v ? null : v)
    setPagina(1)
  }

  const alternarLoja = (loja: string) => {
    setLojas((l) =>
      l.includes(loja) ? l.filter((x) => x !== loja) : [...l, loja],
    )
    setPagina(1)
  }

  const alternarAdulto = () => {
    if (
      !adulto &&
      !window.confirm(
        'Mostrar jogos com conteúdo adulto? Confirme que você tem 18 anos ou mais.',
      )
    ) {
      return
    }
    definirAdultoNoNavegador(!adulto)
    setAdulto(!adulto)
    setPagina(1)
  }

  useEffect(() => {
    setAdulto(adultoAtivoNoNavegador())
  }, [])

  useEffect(() => {
    const termo = termoBusca.trim()
    if (!termo) {
      setResultadoBusca([])
      setErroBusca(null)
      setCarregandoBusca(false)
      return
    }

    const controller = new AbortController()
    setCarregandoBusca(true)
    setErroBusca(null)

    fetch(`/api/v1/games?busca=${encodeURIComponent(termo)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        const dados = await res.json().catch(() => null)
        if (!res.ok) {
          throw new Error(
            dados?.detalhes || dados?.erro || dados?.error || `Erro HTTP: ${res.status}`
          )
        }
        if (!controller.signal.aborted) {
          const resultados = dados?.jogosEncontrados ?? dados?.jogos ?? []
          setResultadoBusca(Array.isArray(resultados) ? resultados : [])
        }
      })
      .catch((erro) => {
        if (!controller.signal.aborted && erro.name !== 'AbortError') {
          setErroBusca(
            erro instanceof Error ? erro.message : 'Erro ao pesquisar o jogo.'
          )
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setCarregandoBusca(false)
        }
      })

    return () => controller.abort()
  }, [termoBusca])

  useEffect(() => {
    if (termoBusca.trim()) return

    const controller = new AbortController()
    const params = new URLSearchParams({
      page: String(pagina),
      limit: String(PER_PAGE),
    })
    if (precoMax !== null) params.set('price', String(precoMax))
    if (corteMin !== null) params.set('discount', String(corteMin))
    if (lojas.length) params.set('store', lojas.join(','))

    setCarregando(true)
    setErroCatalogo(null)

    fetch(`/api/v1/games?${params}`, { signal: controller.signal })
      .then(async (res) => {
        const json = await res.json().catch(() => null)
        if (!res.ok) {
          throw new Error(json?.error ?? 'Erro ao carregar as ofertas.')
        }
        if (!controller.signal.aborted) {
          setJogos(json.jogos ?? [])
          setTotal(json.total ?? 0)
        }
      })
      .catch((e: Error) => {
        if (!controller.signal.aborted && e.name !== 'AbortError') {
          setErroCatalogo(e.message)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setCarregando(false)
        }
      })

    return () => controller.abort()
  }, [termoBusca, precoMax, corteMin, lojas, pagina, adulto])

  const executarBusca = (novoTermo: string) => {
    const termo = novoTermo.trim()
    setTermoBusca(termo)
    if (termo) {
      router.push(`/jogos?search=${encodeURIComponent(termo)}`)
    } else {
      router.push('/jogos')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-bp-bg">
      <Nav
        logado
        valorBusca={termoBusca}
        onSearch={executarBusca}
      />

      <div className="h-[5px]" style={{ background: tema.divisor }} />

      <section className="px-[55px] pt-2.5 max-[640px]:px-4">
        <h1 className="flex items-center gap-3 p-5 font-head text-[32px] font-extrabold text-bp-primary max-[640px]:text-2xl">
          <TagIcon width={56} height={56} /> Ofertas do Momento
        </h1>
      </section>

      <div
        className="mx-2.5 h-[5px] rounded-[2px]"
        style={{ background: tema.divisorForte }}
      />

      <main className="relative flex-1 overflow-hidden">
        <Image
          src={palmeira}
          alt=""
          width={759}
          height={632}
          className="pointer-events-none absolute bottom-0 left-[-305px] h-auto w-[759px] max-[1100px]:hidden"
        />

        <div className="relative z-[1] flex items-start gap-[67px] px-[75px] pb-10 pt-10 max-[1250px]:gap-8 max-[1100px]:flex-col max-[1100px]:items-center max-[640px]:px-4">
          <aside
            aria-label="Filtros"
            className="flex shrink-0 flex-col gap-[100px] rounded-3xl px-7 py-[22px] shadow-[0_25px_50px_-12px_rgba(0,0,0,.25)] max-[1100px]:gap-6 max-[640px]:w-full"
            style={{ background: tema.painel }}
          >
            <Grupo titulo="Preços" icone={<TagIcon />}>
              {PRICE_FILTERS.map((v) => (
                <Opcao
                  key={v}
                  label={`Abaixo de R$ ${v}`}
                  ativa={precoMax === v}
                  onClick={() => escolher(setPrecoMax, precoMax, v)}
                />
              ))}
            </Grupo>

            <Grupo titulo="Cortes" icone={<TagIcon />}>
              {CUT_FILTERS.map((v) => (
                <Opcao
                  key={v}
                  label={`Pelo menos ${v}%`}
                  ativa={corteMin === v}
                  onClick={() => escolher(setCorteMin, corteMin, v)}
                />
              ))}
            </Grupo>

            <Grupo titulo="Lojas" icone={<StoreIcon />}>
              {STORES.map((s) => (
                <Opcao
                  key={s}
                  label={s}
                  ativa={lojas.includes(s)}
                  onClick={() => alternarLoja(s)}
                />
              ))}
            </Grupo>

            <Grupo titulo="Conteúdo" icone={<TagIcon />}>
              <Opcao
                label="Mostrar conteúdo adulto (18+)"
                ativa={adulto}
                onClick={alternarAdulto}
              />
            </Grupo>
          </aside>

          <section
            aria-label="Ofertas"
            className="flex w-full max-w-[877px] flex-1 flex-col items-center gap-8"
          >
            {termoBusca.trim() ? (
              carregandoBusca ? (
                <Loading mensagem="Pesquisando jogos e consultando ofertas..." />
              ) : erroBusca ? (
                <p role="alert" className="py-16 text-center text-red-400">
                  {erroBusca}
                </p>
              ) : resultadoBusca.length === 0 ? (
                <p className="py-16 text-center text-bp-muted">
                  Nenhum jogo relacionado foi encontrado.
                </p>
              ) : (
                <ul className="grid w-full list-none auto-rows-fr grid-cols-3 gap-[13px] max-[1250px]:grid-cols-2 max-[640px]:grid-cols-1">
                  {resultadoBusca.map((jogo, index) => (
                    <li key={`${jogo.id_jogo ?? jogo.id ?? 'busca'}-${index}`} className="h-full">
                      <Link
                        href={`/jogos/${jogo.id_jogo ?? jogo.id}`}
                        className="block h-full transition hover:brightness-110"
                      >
                        <GameCard game={paraCard(jogo)} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )
            ) : carregando ? (
              <Loading mensagem="Carregando ofertas..." />
            ) : erroCatalogo ? (
              <p role="alert" className="py-16 text-center text-red-400">
                {erroCatalogo}
              </p>
            ) : jogos.length === 0 ? (
              <p className="py-16 text-center text-bp-muted">
                Nenhuma oferta encontrada com esses filtros.
              </p>
            ) : (
              <ul className="grid w-full list-none auto-rows-fr grid-cols-3 gap-[13px] max-[1250px]:grid-cols-2 max-[640px]:grid-cols-1">
                {jogos.map((j, index) => (
                  <li key={`${j.id ?? j.id_jogo ?? 'catalogo'}-${index}`} className="h-full">
                    <Link
                      href={`/jogos/${j.id ?? j.id_jogo}`}
                      className="block h-full transition hover:brightness-110"
                    >
                      <GameCard game={paraCard(j)} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {!termoBusca.trim() && (
              <nav
                aria-label="Paginação"
                className="flex items-center gap-[73px] rounded-3xl bg-bp-nav p-2.5 max-[640px]:gap-10"
              >
                <button
                  type="button"
                  onClick={() => setPagina(atual - 1)}
                  disabled={atual === 1}
                  aria-label="Página anterior"
                  className="h-[49px] w-9 cursor-pointer bg-bp-primary transition hover:brightness-110 disabled:cursor-default disabled:opacity-40 [clip-path:polygon(100%_0,100%_100%,0_50%)]"
                />

                <span className="sr-only" aria-live="polite">
                  Página {atual} de {totalPaginas}
                </span>

                <button
                  type="button"
                  onClick={() => setPagina(atual + 1)}
                  disabled={atual === totalPaginas}
                  aria-label="Próxima página"
                  className="h-[49px] w-9 cursor-pointer bg-bp-primary transition hover:brightness-110 disabled:cursor-default disabled:opacity-40 [clip-path:polygon(0_0,100%_50%,0_100%)]"
                />
              </nav>
            )}
          </section>
        </div>
      </main>

      <div className="h-[5px]" style={{ background: tema.divisor }} />
      <Footer />
    </div>
  )
}

export default function JogosPage() {
  return (
    <Suspense fallback={<Loading mensagem="Carregando página..." />}>
      <ConteudoJogos />
    </Suspense>
  )
}