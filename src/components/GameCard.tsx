'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { capaExemplo } from './assets'
import type { Game } from '../mocks/games'

const brl = (v: number | null | undefined) => {
  if (v === null || v === undefined) return ''
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Propriedades para renderização do card de jogo.
 */
export type GameCardProps = {
  game: Game
  variant?: 'default' | 'wide'
}

/**
 * Componente de Card de Jogo (GameCard) da vitrine do BananaPrice.
 *
 * Exibe a imagem de capa com fallback automático, percentual de desconto, loja da melhor oferta,
 * preços promocional e original, além do botão de redirecionamento ou ativação do Destaque Turbo.
 *
 * @param props Propriedades contendo o jogo e a variante de exibição ('default' ou 'wide').
 * @returns Elemento JSX renderizado.
 */
export default function GameCard({ game, variant = 'default' }: GameCardProps) {
  const wide = variant === 'wide'

  const [falhou, setFalhou] = useState(false)
  useEffect(() => setFalhou(false), [game.cover])

  const capaRemota = typeof game.cover === 'string' && game.cover !== '' && !falhou
  const src = capaRemota ? game.cover! : (!falhou && game.cover ? game.cover : capaExemplo)

  const isGratis = game.price === 0
  const isIndisponivel = game.price === null || game.price === undefined
  const isPromo100 = isGratis && game.discount === 100
  const temDesconto = typeof game.price === 'number' && game.price > 0 && game.discount > 0

  return (
    <article
      className={`relative flex h-full flex-col rounded-[13px] bg-bp-neutral ${
        wide ? 'max-w-[586px] flex-1 px-[17px] pb-5 pt-[11px]' : 'px-4 pb-4 pt-[11px]'
      }`}
    >
      <div
        className={`relative shrink-0 overflow-hidden rounded-[10px] bg-[#111] ${
          wide ? 'aspect-[554/201]' : 'aspect-[253/214]'
        }`}
      >
        <Image
          src={src}
          alt={game.name}
          fill
          sizes="(max-width: 1100px) 50vw, 283px"
          className="object-cover"
          unoptimized={capaRemota}
          onError={() => setFalhou(true)}
        />

        {/* Badge de Promoção 100% OFF (Giveaway) */}
        {isPromo100 ? (
          <span className="absolute bottom-0 right-0 bg-red-600 py-2.5 pl-7 pr-3.5 font-head text-xl font-extrabold text-white [clip-path:polygon(24%_0,100%_0,100%_100%,0_100%)]">
            -100%
          </span>
        ) : isGratis ? (
          /* Badge de Grátis Permanente (Free to Play) */
          <span className="absolute bottom-0 right-0 bg-green-500 py-2 pl-6 pr-3 font-head text-xs font-black text-black tracking-wider [clip-path:polygon(20%_0,100%_0,100%_100%,0_100%)]">
            GRÁTIS
          </span>
        ) : temDesconto ? (
          /* Badge de Desconto Padrão (para jogos pagos) */
          <span className="absolute bottom-0 right-0 bg-bp-primary py-2.5 pl-7 pr-3.5 font-head text-xl font-extrabold text-bp-neutral [clip-path:polygon(24%_0,100%_0,100%_100%,0_100%)]">
            -{game.discount}%
          </span>
        ) : null}
      </div>

      <h3 className="mt-[18px] line-clamp-2 min-h-10 font-head text-base font-extrabold leading-5 text-bp-muted">
        {game.name}
      </h3>

      <div className="mt-2.5 flex items-center gap-2.5 text-sm text-bp-muted">
        <i
          className={`size-[11px] shrink-0 rounded-full ${
            isIndisponivel
              ? 'bg-gray-500'
              : isGratis
                ? 'bg-green-400'
                : 'bg-bp-primary'
          }`}
        />
        <span className="min-w-0 truncate">
          {isIndisponivel ? 'Sem oferta ativa' : game.store || 'Loja parceira'}
        </span>
      </div>

      {/* Renderização dos Valores e Preços */}
      <div className="mt-auto pt-3.5">
        {!isIndisponivel && game.price! > 0 ? (
          <>
            {game.originalPrice && game.originalPrice > game.price! && (
              <div className="text-[10px] text-bp-muted/[.58] line-through">
                {brl(game.originalPrice)}
              </div>
            )}
            <div className="mt-0.5 font-head text-sm font-extrabold text-bp-primary">
              {brl(game.price)}
            </div>
          </>
        ) : isGratis ? (
          <>
            {game.originalPrice && game.originalPrice > 0 && (
              <div className="text-[10px] text-bp-muted/[.58] line-through">
                {brl(game.originalPrice)}
              </div>
            )}
            <div className="mt-0.5 font-head text-base font-extrabold text-green-400 tracking-wide">
              Grátis
            </div>
          </>
        ) : (
          <div className="mt-0.5 font-head text-xs font-semibold text-bp-muted/60 uppercase">
            Indisponível
          </div>
        )}
      </div>
    </article>
  )
}