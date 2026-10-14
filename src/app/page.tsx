'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Nav from '../components/Nav'
import Hero from '../components/Hero'
import GameCard from '../components/GameCard'
import Footer from '../components/Footer'
import { BoltIcon, TagIcon } from '../components/Icons'
import { games } from '../mocks/games'

const Divider = () => <div className="m-2.5 h-[2px] rounded-[2px] bg-bp-muted/35" />

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [start, setStart] = useState(0)

  const filtered = useMemo(
    () => games.filter((g) => g.name.toLowerCase().includes(query.toLowerCase())),
    [query],
  )
  const featured = games.slice(0, 6)
  const visible = [0, 1].map((o) => featured[(start + o) % featured.length])
  const move = (d: number) => setStart((s) => (s + d + featured.length) % featured.length)

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
        <div className="grid grid-cols-[repeat(4,minmax(0,283px))] justify-center gap-3 p-2.5 max-[1100px]:grid-cols-[repeat(2,minmax(0,283px))] max-[640px]:grid-cols-[minmax(0,283px)]">
          {filtered.slice(0, 8).map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
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
