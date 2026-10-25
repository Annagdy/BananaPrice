'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Nav from '../components/Nav'
import Hero from '../components/Hero'
import GameCard from '../components/GameCard'
import Footer from '../components/Footer'
import { BoltIcon, TagIcon } from '../components/Icons'
import { games } from '../mocks/games'
import type { Game } from '../mocks/games'

const Divider = () => <div className="m-2.5 h-[2px] rounded-[2px] bg-bp-muted/35" />

/* Quantas ofertas aparecem na home. */
const OFERTAS_NA_HOME = 8

/* Formato de cada jogo devolvido por GET /api/v1/games (catálogo, RF06). */
type JogoApi = {
  id: number
  titulo: string
  melhorPreco: number | null
  precoOriginal: number | null
  desconto: number
  loja: string | null
}

/* Converte o jogo da API no formato que o GameCard espera.
O schema não guarda capa, então "cover" vai nulo. Se o tipo Game não aceitar null,
use o mesmo valor que o mock usa quando não há capa. */
const paraCard = (j: JogoApi): Game => ({
  id: j.id,
  name: j.titulo,
  store: j.loja ?? '',
  discount: j.desconto,
  originalPrice: j.precoOriginal ?? 0,
  price: j.melhorPreco ?? 0,
  cover: null,
})

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [start, setStart] = useState(0)

  // ofertas vindas da API
  const [ofertas, setOfertas] = useState<JogoApi[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Vitrine Turbo: continua com dados de exemplo.
  // TODO: vir de GET /api/v1/highlights/active quando existir (RF12, jogos que pagaram destaque).
  const featured = useMemo(() => games.slice(0, 6), [])
  const visible = [0, 1].map((o) => featured[(start + o) % featured.length])
  const move = (d: number) => setStart((s) => (s + d + featured.length) % featured.length)

  // Ofertas do Momento: GET /api/v1/games (só jogos com desconto), com busca por título.
  // O "search" espera 300 ms depois da última tecla para não chamar a API a cada letra.
  useEffect(() => {
    const controller = new AbortController()

    const timer = setTimeout(() => {
      const params = new URLSearchParams({
        limit: String(OFERTAS_NA_HOME),
        discount: '1',
      })
      if (query.trim()) params.set('search', query.trim())

      setCarregando(true)
      setErro(null)

      fetch(`/api/v1/games?${params}`, { signal: controller.signal })
        .then(async (res) => {
          const json = await res.json().catch(() => null)
          if (!res.ok) throw new Error(json?.error ?? 'Erro ao carregar as ofertas.')
          setOfertas(json.jogos ?? [])
        })
        .catch((e: Error) => {
          if (e.name !== 'AbortError') setErro(e.message)
        })
        .finally(() => {
          if (!controller.signal.aborted) setCarregando(false)
        })
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  return (
    <>
      <Nav onSearch={setQuery} />
      <Hero />
      <Divider />

      <section className="px-5 py-2.5">
        <div className="flex items-center justify-between p-2.5">
          <h2 className="flex items-center gap-3 font-head text-[32px] font-extrabold text-bp-primary max-[640px]:text-2xl">
            <BoltIcon /> Vitrine Turbo
          </h2>
          <Link
            href="/jogos"
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-[9px] bg-bp-primary px-4 py-[9px] text-xs text-bp-neutral transition hover:brightness-110"
          >
            <BoltIcon width={12} height={16} /> Dar um turbo
          </Link>
        </div>

        <div className="flex items-center justify-center gap-[29px] p-2.5">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Anterior"
            className="h-[85px] w-[52px] shrink-0 cursor-pointer bg-bp-primary transition hover:brightness-110 [clip-path:polygon(100%_0,100%_100%,0_50%)]"
          />
          <div className="flex max-w-[1240px] flex-1 justify-center gap-5 max-[1100px]:flex-col max-[1100px]:items-center">
            {visible.map((g) => (
              <GameCard key={g.id} game={g} variant="wide" />
            ))}
          </div>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Próximo"
            className="h-[85px] w-[52px] shrink-0 cursor-pointer bg-bp-primary transition hover:brightness-110 [clip-path:polygon(0_0,100%_50%,0_100%)]"
          />
        </div>
      </section>
      <Divider />

      <section className="px-5 py-2.5">
        <div className="flex items-center justify-between p-2.5">
          <h2 className="flex items-center gap-3 font-head text-[32px] font-extrabold text-bp-primary max-[640px]:text-2xl">
            <TagIcon /> Ofertas do Momento
          </h2>
        </div>

        {carregando ? (
          <p className="py-10 text-center text-bp-muted">Carregando...</p>
        ) : erro ? (
          <p role="alert" className="py-10 text-center text-red-400">
            {erro}
          </p>
        ) : ofertas.length === 0 ? (
          <p className="py-10 text-center text-bp-muted">
            {query.trim() ? 'Nenhuma oferta encontrada para essa busca.' : 'Nenhuma oferta no momento.'}
          </p>
        ) : (
          <div className="grid auto-rows-fr grid-cols-[repeat(4,minmax(0,283px))] justify-center gap-3 p-2.5 max-[1100px]:grid-cols-[repeat(2,minmax(0,283px))] max-[640px]:grid-cols-[minmax(0,283px)]">
          {ofertas.map((j) => (
            <Link
              key={j.id}
              href={`/jogos/${j.id}`}
              className="block h-full transition hover:brightness-110 [&>*]:h-full [&_h2]:line-clamp-2 [&_h2]:min-h-[2lh] [&_h3]:line-clamp-2 [&_h3]:min-h-[2lh]"
            >
              <GameCard game={paraCard(j)} />
            </Link>
          ))}
        </div>
        )}

        <div className="flex justify-end p-2.5">
          <Link
            href="/jogos"
            className="rounded-[9px] bg-bp-primary px-3 py-[5px] text-base text-bp-neutral"
          >
            Ver Mais
          </Link>
        </div>
      </section>

      <Footer />
    </>
  )
}