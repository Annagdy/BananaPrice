'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Nav from '../components/Nav'
import Hero from '../components/Hero'
import GameCard from '../components/GameCard'
import Footer from '../components/Footer'
import { BoltIcon, TagIcon } from '../components/Icons'
import type { Game } from '../mocks/games'

const Divider = () => (
  <div className="m-2.5 h-[2px] rounded-[2px] bg-bp-muted/35" />
)

const OFERTAS_NA_HOME = 8

type JogoApi = {
  id: number
  titulo: string
  melhorPreco: number | null
  precoOriginal: number | null
  desconto: number
  loja: string | null
  capa: string | null
}

const paraCard = (j: JogoApi): Game => ({
  id: j.id,
  name: j.titulo,
  store: j.melhorPreco !== null ? (j.loja ?? 'Oferta ativa') : 'Indisponível',
  discount: j.melhorPreco !== null ? j.desconto : 0,
  originalPrice: j.precoOriginal ?? 0,
  price: j.melhorPreco,
  cover: j.capa,
})

export default function HomePage() {
  const [start, setStart] = useState(0)
  const [ofertas, setOfertas] = useState<JogoApi[]>([])
  const [jogosTurbo, setJogosTurbo] = useState<JogoApi[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Vitrine Turbo: exibe estritamente os jogos com pagamento aprovado trazidos da API
  const featured: Game[] = useMemo(() => {
    return jogosTurbo.map(paraCard)
  }, [jogosTurbo])

  const visible = useMemo(() => {
    if (featured.length === 0) return []
    if (featured.length === 1) return [featured[0]]
    return [0, 1].map((o) => featured[(start + o) % featured.length])
  }, [featured, start])

  const move = (d: number) => {
    if (featured.length === 0) return
    setStart((s) => (s + d + featured.length) % featured.length)
  }

  useEffect(() => {
    const controller = new AbortController()

    const timer = setTimeout(() => {
      setCarregando(true)
      setErro(null)

      // Busca as ofertas gerais (Todos os jogos)
      const fetchOfertas = fetch(
        `/api/v1/games?${new URLSearchParams({
          limit: String(OFERTAS_NA_HOME),
          discount: '1',
        })}`,
        {
          signal: controller.signal,
          cache: 'no-store',
        }
      ).then((res) => res.json())

      // Busca apenas os jogos que tiveram Turbo APROVADO no banco
      const fetchTurbo = fetch(`/api/v1/games?turbo=1&limit=6`, {
        signal: controller.signal,
        cache: 'no-store',
      })
        .then((res) => (res.ok ? res.json() : { jogos: [] }))
        .catch(() => ({ jogos: [] }))

      Promise.all([fetchOfertas, fetchTurbo])
        .then(([dataOfertas, dataTurbo]) => {
          if (dataOfertas.error) {
            throw new Error(dataOfertas.error)
          }
          setOfertas(dataOfertas.jogos ?? [])
          setJogosTurbo(Array.isArray(dataTurbo.jogos) ? dataTurbo.jogos : [])
        })
        .catch((e: Error) => {
          if (e.name !== 'AbortError') {
            setErro(e.message ?? 'Erro ao carregar os dados.')
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setCarregando(false)
          }
        })
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [])

  return (
    <>
      <Nav logado />

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

        {featured.length === 0 ? (
          <p className="py-10 text-center text-bp-muted">
            Nenhum jogo na Vitrine Turbo no momento. Seja o primeiro a impulsionar um jogo!
          </p>
        ) : (
          <div className="flex items-center justify-center gap-[29px] p-2.5">
            {featured.length > 2 && (
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="Anterior"
                className="h-[85px] w-[52px] shrink-0 cursor-pointer bg-bp-primary transition hover:brightness-110 [clip-path:polygon(100%_0,100%_100%,0_50%)]"
              />
            )}

            <div className="flex max-w-[1240px] flex-1 justify-center gap-5 max-[1100px]:flex-col max-[1100px]:items-center">
              {visible.map((g, idx) => (
                <GameCard key={`${g.id}-${idx}`} game={g} variant="wide" />
              ))}
            </div>

            {featured.length > 2 && (
              <button
                type="button"
                onClick={() => move(1)}
                aria-label="Próximo"
                className="h-[85px] w-[52px] shrink-0 cursor-pointer bg-bp-primary transition hover:brightness-110 [clip-path:polygon(0_0,100%_50%,0_100%)]"
              />
            )}
          </div>
        )}
      </section>

      <Divider />

      <section className="px-5 py-2.5">
        <div className="flex items-center justify-between p-2.5">
          <h2 className="flex items-center gap-3 font-head text-[32px] font-extrabold text-bp-primary max-[640px]:text-2xl">
            <TagIcon /> Ofertas do Momento
          </h2>
        </div>

        {carregando ? (
          <p className="py-10 text-center text-bp-muted">
            Carregando...
          </p>
        ) : erro ? (
          <p role="alert" className="py-10 text-center text-red-400">
            {erro}
          </p>
        ) : ofertas.length === 0 ? (
          <p className="py-10 text-center text-bp-muted">
            Nenhuma oferta no momento.
          </p>
        ) : (
          <div className="grid auto-rows-fr grid-cols-[repeat(4,minmax(0,283px))] justify-center gap-3 p-2.5 max-[1100px]:grid-cols-[repeat(2,minmax(0,283px))] max-[640px]:grid-cols-[minmax(0,283px)]">
            {ofertas.map((j) => (
              <Link
                key={j.id}
                href={`/jogos/${j.id}`}
                className="block h-full transition hover:brightness-110"
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