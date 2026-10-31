'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Nav from '../../components/Nav'
import Footer from '../../components/Footer'
import GameCard from '../../components/GameCard'
import { StoreIcon, TagIcon } from '../../components/Icons'
import { palmeira } from '../../components/assets'
import { STORES, PRICE_FILTERS, CUT_FILTERS, PER_PAGE } from '../../mocks/promos'
import type { Game } from '../../mocks/games'
import { tema } from '../../mocks/tema'
import { adultoAtivoNoNavegador, definirAdultoNoNavegador } from '../../lib/adulto'

/* Mínimo de letras para pesquisar (a busca do servidor usa trigramas e precisa de 3). */
const MIN_BUSCA = 3

/* Formato de cada jogo devolvido por GET /api/v1/games (catálogo e pesquisa, RF06). */
type JogoApi = {
  id: number
  titulo: string
  melhorPreco: number | null
  precoOriginal: number | null
  desconto: number
  loja: string | null
  capa: string | null
}

/* Converte o jogo da API no formato que o GameCard espera. */
const paraCard = (j: JogoApi): Game => ({
  id: j.id,
  name: j.titulo,
  store: j.loja ?? 'Sem oferta',
  discount: j.desconto,
  originalPrice: j.precoOriginal ?? 0,
  price: j.melhorPreco ?? 0,
  cover: j.capa,
})

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

/* Página /jogos: catálogo com filtros e pesquisa por nome, tudo em GET /api/v1/games.
A pesquisa e os filtros valem juntos e usam a mesma lista de cards e a mesma paginação. */
export default function JogosPage() {
  // texto da pesquisa (vem da barra de busca do Nav)
  const [busca, setBusca] = useState('')

  // filtros do catálogo
  const [precoMax, setPrecoMax] = useState<number | null>(null)
  const [corteMin, setCorteMin] = useState<number | null>(null)
  const [lojas, setLojas] = useState<string[]>([])
  const [pagina, setPagina] = useState(1)

  // conteúdo adulto: oculto por padrão, a pessoa precisa ativar (fica salvo em cookie)
  const [adulto, setAdulto] = useState(false)

  // dados vindos da API
  const [jogos, setJogos] = useState<JogoApi[]>([])
  const [total, setTotal] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const termo = busca.trim()
  const buscaCurta = termo.length > 0 && termo.length < MIN_BUSCA

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

  // lê a preferência salva no cookie ao abrir a página
  useEffect(() => {
    setAdulto(adultoAtivoNoNavegador())
  }, [])

  // GET /api/v1/games?search=&price=&discount=&store=&page=&limit=
  // A pesquisa espera 300 ms depois da última tecla para não chamar a API a cada letra.
  useEffect(() => {
    // 1 ou 2 letras: ainda não pesquisa, só avisa
    if (buscaCurta) {
      setJogos([])
      setTotal(0)
      setErro(null)
      setCarregando(false)
      return undefined
    }

    const controller = new AbortController()

    const timer = setTimeout(() => {
      const params = new URLSearchParams({
        page: String(pagina),
        limit: String(PER_PAGE),
      })
      if (termo) params.set('search', termo)
      if (precoMax !== null) params.set('price', String(precoMax))
      if (corteMin !== null) params.set('discount', String(corteMin))
      if (lojas.length) params.set('store', lojas.join(','))

      setCarregando(true)
      setErro(null)

      fetch(`/api/v1/games?${params}`, { signal: controller.signal })
        .then(async (res) => {
          const json = await res.json().catch(() => null)
          if (!res.ok) {
            throw new Error(json?.error ?? 'Erro ao carregar as ofertas.')
          }
          setJogos(json.jogos ?? [])
          setTotal(json.total ?? 0)
        })
        .catch((e: Error) => {
          if (e.name !== 'AbortError') setErro(e.message)
        })
        .finally(() => {
          if (!controller.signal.aborted) setCarregando(false)
        })
    }, termo ? 300 : 0)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [termo, buscaCurta, precoMax, corteMin, lojas, pagina, adulto])

  return (
    <div className="flex min-h-screen flex-col bg-bp-bg">
      <Nav
        logado
        onSearch={(q) => {
          setBusca(q)
          setPagina(1)
        }}
      />

      <div className="h-[5px]" style={{ background: tema.divisor }} />

      <section className="px-[55px] pt-2.5 max-[640px]:px-4">
        <h1 className="flex items-center gap-3 p-5 font-head text-[32px] font-extrabold text-bp-primary max-[640px]:text-2xl">
          <TagIcon width={56} height={56} />
          {termo && !buscaCurta ? `Resultados para “${termo}”` : 'Ofertas do Momento'}
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

        <div className="relative z-[1] flex items-start gap-[67px] px-[75px] pb-10 pt-10 max-[1250px]:gap-8 max-[1250px]:px-6 max-[1100px]:flex-col max-[1100px]:items-center max-[640px]:px-4">
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
            {buscaCurta ? (
              <p className="py-16 text-center text-bp-muted">
                Digite pelo menos {MIN_BUSCA} letras para pesquisar.
              </p>
            ) : carregando ? (
              <p className="py-16 text-center text-bp-muted">
                {termo ? 'Pesquisando...' : 'Carregando...'}
              </p>
            ) : erro ? (
              <p role="alert" className="py-16 text-center text-red-400">
                {erro}
              </p>
            ) : jogos.length === 0 ? (
              <p className="py-16 text-center text-bp-muted">
                {termo
                  ? `Nenhum jogo encontrado para “${termo}”.`
                  : 'Nenhuma oferta encontrada com esses filtros.'}
              </p>
            ) : (
              <ul className="grid w-full list-none auto-rows-fr grid-cols-3 gap-[13px] max-[1250px]:grid-cols-2 max-[640px]:grid-cols-1">
                {jogos.map((j) => (
                  <li key={j.id} className="h-full">
                    <Link
                      href={`/jogos/${j.id}`}
                      className="block h-full transition hover:brightness-110"
                    >
                      <GameCard game={paraCard(j)} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {!buscaCurta && (
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