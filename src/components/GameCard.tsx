import Image from 'next/image'
import { capaExemplo } from './assets'
import type { Game } from '../mocks/games'

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

type GameCardProps = {
  game: Game
  /** "wide" é a versão larga usada na Vitrine Turbo */
  variant?: 'default' | 'wide'
}

export default function GameCard({ game, variant = 'default' }: GameCardProps) {
  const wide = variant === 'wide'

  return (
    <article
      className={`relative flex flex-col rounded-[13px] bg-bp-neutral ${
        wide ? 'max-w-[586px] flex-1 px-[17px] pb-5 pt-[11px]' : 'px-4 pb-4 pt-[11px]'
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-[10px] bg-[#111] ${
          wide ? 'aspect-[554/201]' : 'aspect-[253/214]'
        }`}
      >
        <Image
          src={game.cover ?? capaExemplo}
          alt={game.name}
          fill
          sizes="(max-width: 1100px) 50vw, 283px"
          className="object-cover"
        />
        <span className="absolute bottom-0 right-0 bg-bp-primary py-2.5 pl-7 pr-3.5 font-head text-xl font-extrabold text-bp-neutral [clip-path:polygon(24%_0,100%_0,100%_100%,0_100%)]">
          {game.discount}%
        </span>
      </div>

      <h3 className="mt-[18px] font-head text-base font-extrabold text-bp-muted">{game.name}</h3>
      <div className="mt-2.5 flex items-center gap-2.5 text-sm text-bp-muted">
        <i className="size-[11px] rounded-full bg-bp-primary" />
        {game.store}
      </div>
      <div className="mt-3.5 text-[10px] text-bp-muted/[.58]">{brl(game.originalPrice)}</div>
      <div className="mt-0.5 font-head text-sm font-extrabold text-bp-primary">{brl(game.price)}</div>
    </article>
  )
}
