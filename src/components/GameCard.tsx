'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { capaExemplo } from './assets'
import type { Game } from '../mocks/games'
import { useIdioma } from './contexts/IdiomaContext'

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
  const { t, formatarMoeda } = useIdioma()
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
      className={`relative flex h-full flex-col rounded-[13px] bg-bp-neutral transition-transform duration-150 ${
        wide
          ? 'max-w-[586px] flex-1 px-3 pb-3.5 pt-2 sm:px-[17px] sm:pb-5 sm:pt-[11px]'
          : 'p-2.5 sm:px-4 sm:pb-4 sm:pt-[11px]'
      }`}
    >
      <div
        className={`relative shrink-0 overflow-hidden rounded-[8px] sm:rounded-[10px] bg-[#111] ${
          wide ? 'aspect-[554/201]' : 'aspect-[253/214]'
        }`}
      >
        <Image
          src={src}
          alt={game.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 283px"
          className="object-cover"
          unoptimized={capaRemota}
          onError={() => setFalhou(true)}
        />

        {/* Badge de Promoção 100% OFF (Giveaway) */}
        {isPromo100 ? (
          <span className="absolute bottom-0 right-0 bg-red-600 py-1 pl-4 pr-2 font-head text-sm font-extrabold text-white [clip-path:polygon(20%_0,100%_0,100%_100%,0_100%)] sm:py-2.5 sm:pl-7 sm:pr-3.5 sm:text-xl">
            -100%
          </span>
        ) : isGratis ? (
          /* Badge de Grátis Permanente (Free to Play) */
          <span className="absolute bottom-0 right-0 bg-green-500 py-1 pl-3.5 pr-2 font-head text-[10px] font-black text-black tracking-wider [clip-path:polygon(20%_0,100%_0,100%_100%,0_100%)] sm:py-2 sm:pl-6 sm:pr-3 sm:text-xs">
            {t.card.gratis}
          </span>
        ) : temDesconto ? (
          /* Badge de Desconto Padrão (para jogos pagos) */
          <span className="absolute bottom-0 right-0 bg-bp-primary py-1 pl-4 pr-2 font-head text-xs font-extrabold text-bp-neutral [clip-path:polygon(20%_0,100%_0,100%_100%,0_100%)] sm:py-2.5 sm:pl-7 sm:pr-3.5 sm:text-xl">
            -{game.discount}%
          </span>
        ) : null}
      </div>

      <h3 className="mt-2.5 sm:mt-[18px] line-clamp-2 min-h-8 sm:min-h-10 font-head text-xs sm:text-base font-extrabold leading-tight sm:leading-5 text-bp-muted">
        {game.name}
      </h3>

      <div className="mt-1.5 sm:mt-2.5 flex items-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm text-bp-muted">
        <i
          className={`size-2 sm:size-[11px] shrink-0 rounded-full ${
            isIndisponivel
              ? 'bg-gray-500'
              : isGratis
                ? 'bg-green-400'
                : 'bg-bp-primary'
          }`}
        />
        <span className="min-w-0 truncate text-[11px] sm:text-sm">
          {isIndisponivel ? t.card.semOferta : game.store || t.card.lojaParceira}
        </span>
      </div>

      {/* Renderização dos Valores e Preços */}
      <div className="mt-auto pt-2 sm:pt-3.5">
        {!isIndisponivel && game.price! > 0 ? (
          <>
            {game.originalPrice && game.originalPrice > game.price! && (
              <div className="text-[9px] sm:text-[10px] text-bp-muted/[.58] line-through">
                {formatarMoeda(game.originalPrice)}
              </div>
            )}
            <div className="mt-0.5 font-head text-xs sm:text-sm font-extrabold text-bp-primary">
              {formatarMoeda(game.price)}
            </div>
          </>
        ) : isGratis ? (
          <>
            {game.originalPrice && game.originalPrice > 0 && (
              <div className="text-[9px] sm:text-[10px] text-bp-muted/[.58] line-through">
                {formatarMoeda(game.originalPrice)}
              </div>
            )}
            <div className="mt-0.5 font-head text-xs sm:text-base font-extrabold text-green-400 tracking-wide">
              {t.card.gratis}
            </div>
          </>
        ) : (
          <div className="mt-0.5 font-head text-[10px] sm:text-xs font-semibold text-bp-muted/60 uppercase">
            {t.card.indisponivel}
          </div>
        )}
      </div>
    </article>
  )
}