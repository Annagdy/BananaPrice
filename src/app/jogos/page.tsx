'use client'

import { useEffect, useState, Suspense } from 'react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Nav, { type ModoBusca } from '../../components/Nav'
import Footer from '../../components/Footer'
import Divisor from '../../components/Divisor'
import GameCard from '../../components/GameCard'
import Loading from '@/components/loading'
import { StoreIcon, TagIcon } from '../../components/Icons'
import { palmeira } from '../../components/assets'
import { STORES, PRICE_FILTERS, CUT_FILTERS, PER_PAGE } from '../../mocks/promos'
import type { Game } from '../../mocks/games'
import { adultoAtivoNoNavegador, definirAdultoNoNavegador } from '../../lib/adulto'
import { urlCapaItad } from '../../lib/itad.ts'

export const dynamic = 'force-dynamic'

type FiltroStatus = 'TODOS' | 'GRATIS' | 'INDISPONIVEL'

// Ícones dedicados para cada seção de filtro
function StatusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function PriceIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      {...props}
    >
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

function DiscountIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      {...props}
    >
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  )
}

function ContentIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

// Adaptador para converter dados da API no tipo esperado pelo GameCard
const paraCard = (j: any): Game => {
  const coverUrl = j.capa ?? (j.itad_id ? urlCapaItad(String(j.itad_id)) : null)

  if ('melhorPreco' in j || 'status' in j) {
    return {
      id: j.id ?? j.id_jogo ?? 0,
      name: j.titulo ?? j.name ?? 'Sem título',
      store: j.loja ?? (j.melhorPreco === null ? 'Sem oferta' : 'Loja parceira'),
      discount: j.desconto ?? 0,
      originalPrice: j.precoOriginal ?? 0,
      price: j.melhorPreco,
      cover: coverUrl,
    }
  }

  const promocoes = j.promocoes || []
  const ofertasValidas = promocoes.filter(
    (p: any) => p.valor_atual !== null && p.valor_atual !== undefined
  )

  if (ofertasValidas.length === 0) {
    return {
      id: j.id_jogo ?? j.id ?? 0,
      name: j.titulo ?? j.name ?? 'Sem título',
      store: 'Sem oferta',
      discount: 0,
      originalPrice: 0,
      price: null,
      cover: coverUrl,
    }
  }

  const melhorPromo = ofertasValidas.reduce((min: any, p: any) => {
    return p.valor_atual < min.valor_atual ? p : min
  }, ofertasValidas[0])

  const loja = melhorPromo?.loja
    ? Array.isArray(melhorPromo.loja)
      ? melhorPromo.loja[0]?.nome
      : melhorPromo.loja.nome
    : 'Loja parceira'

  const price = melhorPromo.valor_atual ?? null
  const discount = melhorPromo.percentual_desconto ?? 0
  const originalPrice =
    discount > 0 && price !== null ? +(price / (1 - discount / 100)).toFixed(2) : price

  return {
    id: j.id_jogo ?? j.id ?? 0,
    name: j.titulo ?? j.name ?? 'Sem título',
    store: loja ?? 'Loja parceira',
    discount,
    originalPrice,
    price,
    cover: coverUrl,
  }
}

// Botão em formato de Chip compacto
function Chip({
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
      className={`cursor-pointer rounded-full px-3.5 py-1.5 font-head text-xs font-bold transition-all active:scale-95 ${
        ativa
          ? 'bg-bp-primary text-bp-neutral shadow-sm'
          : 'border border-[#3d322e] bg-bp-neutral text-bp-muted hover:border-bp-primary/50 hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}

// Grupo de filtros sanfonado (Accordion)
function Grupo({
  titulo,
  icone,
  children,
  abertoPadrao = true,
}: {
  titulo: string
  icone: ReactNode
  children: ReactNode
  abertoPadrao?: boolean
}) {
  const [aberto, setAberto] = useState(abertoPadrao)

  return (
    <div className="flex flex-col border-b border-[#3d322e]/60 pb-3.5 last:border-none last:pb-0">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="flex w-full cursor-pointer items-center justify-between py-1.5 text-left font-head text-sm font-extrabold text-bp-primary transition hover:opacity-80"
      >
        <span className="flex items-center gap-2 [&>svg]:size-4">
          {icone}
          {titulo}
        </span>
        <span
          className={`text-[10px] text-bp-muted transition-transform duration-200 ${
            aberto ? 'rotate-180' : ''
          }`}
        >
          ▼
        </span>
      </button>

      {aberto && <div className="mt-2 flex flex-wrap gap-1.5">{children}</div>}
    </div>
  )
}

function ConteudoJogos() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const termoNaUrl = (searchParams.get('search') || searchParams.get('busca') || '').trim()
  const modoNaUrl = (searchParams.get('modo') as ModoBusca) || 'nativa'

  const [resultadoBusca, setResultadoBusca] = useState<any[]>([])
  const [carregandoBusca, setCarregandoBusca] = useState(false)
  const [erroBusca, setErroBusca] = useState<string | null>(null)

  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('TODOS')
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
    v: number
  ) => {
    definir(valorAtual === v ? null : v)
    setPagina(1)
  }

  const alternarLoja = (loja: string) => {
    setLojas((l) => (l.includes(loja) ? l.filter((x) => x !== loja) : [...l, loja]))
    setPagina(1)
  }

  const alternarAdulto = () => {
    if (
      !adulto &&
      !window.confirm(
        'Mostrar jogos com conteúdo adulto? Confirme que você tem 18 anos ou mais.'
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

  // Reseta o filtro para 'TODOS' ao pesquisar um novo termo
  useEffect(() => {
    if (!termoNaUrl) {
      setResultadoBusca([])
      setErroBusca(null)
      setCarregandoBusca(false)
      return
    }

    setFiltroStatus('TODOS')

    const controller = new AbortController()
    setCarregandoBusca(true)
    setErroBusca(null)

    const params = new URLSearchParams()
    params.set('busca', termoNaUrl)
    params.set('modo', modoNaUrl)

    fetch(`/api/v1/games?${params.toString()}`, {
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
  }, [termoNaUrl, modoNaUrl])

  // Busca do catálogo padrão paginado
  useEffect(() => {
    if (termoNaUrl) return

    const controller = new AbortController()
    const params = new URLSearchParams({
      page: String(pagina),
      limit: String(PER_PAGE),
    })
    if (filtroStatus !== 'TODOS') params.set('status', filtroStatus)
    if (precoMax !== null) params.set('price', String(precoMax))
    if (corteMin !== null) params.set('discount', String(corteMin))
    if (lojas.length) params.set('store', lojas.join(','))

    setCarregando(true)
    setErroCatalogo(null)

    fetch(`/api/v1/games?${params.toString()}`, { signal: controller.signal })
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
  }, [termoNaUrl, filtroStatus, precoMax, corteMin, lojas, pagina, adulto])

  const executarBusca = (novoTermo: string, novoModo: ModoBusca = modoNaUrl) => {
    const termo = novoTermo.trim()
    setFiltroStatus('TODOS')
    setPagina(1)

    if (termo) {
      router.push(`/jogos?search=${encodeURIComponent(termo)}&modo=${novoModo}`)
    } else {
      router.push(`/jogos?modo=${novoModo}`)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-bp-bg overflow-x-hidden">
      <header className="sticky top-0 z-50 w-full shrink-0">
        <Nav
          logado
          valorBusca={termoNaUrl}
          modoInicial={modoNaUrl}
          onSearch={executarBusca}
        />
      </header>

      <main className="relative flex flex-1 flex-col">
        {/* Título da Seção */}
        <section className="px-[55px] pt-2.5 max-[640px]:px-4">
          <h1 className="flex items-center gap-3 p-5 font-head text-[32px] font-extrabold text-bp-primary max-[640px]:text-2xl">
            <TagIcon width={56} height={56} /> Ofertas do Momento
          </h1>
        </section>

        {/* Divisor com a cor #3d322e */}
        <Divisor cor="#3d322e" className="mx-[55px] my-2" />

        <div className="relative z-[1] flex flex-1 items-start gap-8 px-[55px] pb-0 pt-6 max-[1100px]:flex-col max-[1100px]:items-center max-[640px]:px-4">
          {/* Coluna Esquerda: Filtros e Palmeira grande colada à beirada */}
          <div className="flex w-full max-w-[280px] shrink-0 flex-col justify-between self-stretch max-[1100px]:max-w-full">
            <aside
              aria-label="Filtros"
              className="flex w-full flex-col gap-4 rounded-3xl border-2 border-[#3d322e] bg-bp-nav p-5 shadow-lg"
            >
              <Grupo titulo="Estado" icone={<StatusIcon />} abertoPadrao={true}>
                <Chip
                  label="Todos"
                  ativa={filtroStatus === 'TODOS'}
                  onClick={() => {
                    setFiltroStatus('TODOS')
                    setPagina(1)
                  }}
                />
                <Chip
                  label="Grátis"
                  ativa={filtroStatus === 'GRATIS'}
                  onClick={() => {
                    setFiltroStatus(filtroStatus === 'GRATIS' ? 'TODOS' : 'GRATIS')
                    setPagina(1)
                  }}
                />
                <Chip
                  label="Indisponível"
                  ativa={filtroStatus === 'INDISPONIVEL'}
                  onClick={() => {
                    setFiltroStatus(filtroStatus === 'INDISPONIVEL' ? 'TODOS' : 'INDISPONIVEL')
                    setPagina(1)
                  }}
                />
              </Grupo>

              <Grupo titulo="Preços" icone={<PriceIcon />} abertoPadrao={true}>
                {PRICE_FILTERS.map((v) => (
                  <Chip
                    key={v}
                    label={`< R$ ${v}`}
                    ativa={precoMax === v}
                    onClick={() => escolher(setPrecoMax, precoMax, v)}
                  />
                ))}
              </Grupo>

              <Grupo titulo="Descontos" icone={<DiscountIcon />} abertoPadrao={false}>
                {CUT_FILTERS.map((v) => (
                  <Chip
                    key={v}
                    label={`-${v}% ou +`}
                    ativa={corteMin === v}
                    onClick={() => escolher(setCorteMin, corteMin, v)}
                  />
                ))}
              </Grupo>

              <Grupo titulo="Lojas" icone={<StoreIcon />} abertoPadrao={false}>
                {STORES.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    ativa={lojas.includes(s)}
                    onClick={() => alternarLoja(s)}
                  />
                ))}
              </Grupo>

              <Grupo titulo="Conteúdo" icone={<ContentIcon />} abertoPadrao={false}>
                <Chip
                  label="18+ Adulto"
                  ativa={adulto}
                  onClick={alternarAdulto}
                />
              </Grupo>
            </aside>

            {/* Palmeira Grande: alinhada exatamente à beirada esquerda e colada na linha do Footer */}
            <div className="mt-auto flex items-end justify-start pt-6 max-[1100px]:hidden">
              <Image
                src={palmeira}
                alt=""
                width={520}
                height={520}
                className="pointer-events-none -ml-[160px] -mb-1 w-[520px] max-w-none object-contain select-none"
              />
            </div>
          </div>

          {/* Grid de Jogos + Paginação */}
          <section
            aria-label="Ofertas"
            className="flex w-full flex-1 flex-col items-center gap-8 pb-10"
          >
            {termoNaUrl ? (
              carregandoBusca ? (
                <Loading
                  mensagem={
                    modoNaUrl === 'ia'
                      ? 'Realizando busca profunda com IA...'
                      : 'Pesquisando jogos no catálogo...'
                  }
                />
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
                        className="block h-full transition hover:brightness-110 active:scale-95"
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
                      className="block h-full transition hover:brightness-110 active:scale-95"
                    >
                      <GameCard game={paraCard(j)} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {!termoNaUrl && (
              <nav
                aria-label="Paginação"
                className="flex items-center gap-[73px] rounded-3xl bg-bp-nav p-2.5 max-[640px]:gap-10"
              >
                <button
                  type="button"
                  onClick={() => setPagina(atual - 1)}
                  disabled={atual === 1}
                  aria-label="Página anterior"
                  className="h-[49px] w-9 cursor-pointer bg-bp-primary transition hover:brightness-110 active:scale-95 disabled:cursor-default disabled:opacity-40 [clip-path:polygon(100%_0,100%_100%,0_50%)]"
                />

                <span className="sr-only" aria-live="polite">
                  Página {atual} de {totalPaginas}
                </span>

                <button
                  type="button"
                  onClick={() => setPagina(atual + 1)}
                  disabled={atual === totalPaginas}
                  aria-label="Próxima página"
                  className="h-[49px] w-9 cursor-pointer bg-bp-primary transition hover:brightness-110 active:scale-95 disabled:cursor-default disabled:opacity-40 [clip-path:polygon(0_0,100%_50%,0_100%)]"
                />
              </nav>
            )}
          </section>
        </div>
      </main>

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