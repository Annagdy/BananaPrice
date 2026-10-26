import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Nav from '../../../components/Nav'
import Footer from '../../../components/Footer'
import { capaExemplo } from '../../../components/assets'
import { tema } from '../../../mocks/tema'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

type Oferta = {
  idLoja: number
  loja: string | null
  preco: number
  precoOriginal: number
  desconto: number
  url: string | null
}

type JogoResposta = {
  jogo: { id: number; titulo: string; genero: string | null }
  melhorOferta: Oferta | null
  ofertas: Oferta[]
  menorPrecoHistorico: { valor: number; data: string } | null
}

/* Busca o jogo na API. Devolve null se o id não existir ou for inválido. */
async function buscarJogo(id: string): Promise<JogoResposta | null> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const res = await fetch(`${site}/api/v1/games/${encodeURIComponent(id)}`, { cache: 'no-store' })
  if (res.status === 404 || res.status === 400) return null
  if (!res.ok) throw new Error('Falha ao carregar o jogo.')
  return res.json()
}

/* Atributos comuns dos links que saem do site (loja externa). */
const LINK_EXTERNO = {
  target: '_blank',
  rel: 'noopener noreferrer sponsored',
} as const

export default async function JogoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dados = await buscarJogo(id)
  if (!dados) notFound()

  const { jogo, melhorOferta, ofertas, menorPrecoHistorico } = dados

  return (
    <div className="flex min-h-screen flex-col bg-bp-bg">
      <Nav logado />
      <div className="h-[5px]" style={{ background: tema.divisor }} />

      <main className="flex flex-1 flex-col items-center gap-6 px-5 py-10">
        <section
          className="grid w-full max-w-[1100px] grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 rounded-3xl p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,.25)] max-[900px]:grid-cols-1"
          style={{ background: tema.painel }}
        >
          <div className="relative aspect-[486/273] w-full overflow-hidden rounded-[13px] bg-white">
            <Image
              src={capaExemplo}
              alt={jogo.titulo}
              fill
              sizes="(max-width: 900px) 100vw, 540px"
              className="object-cover"
            />
          </div>

          <div className="flex flex-col justify-center gap-4">
            <h1 className="font-head text-4xl font-extrabold text-bp-primary max-[640px]:text-2xl">
              {jogo.titulo}
            </h1>
            {jogo.genero && <p className="text-base text-bp-muted">{jogo.genero}</p>}

            {melhorOferta ? (
              <>
                <p className="flex items-center gap-3 text-base text-bp-muted">
                  <span className="h-[18px] w-[27px] rounded-full bg-bp-primary" />
                  Melhor oferta: {melhorOferta.loja ?? 'Loja'}
                </p>
                <div className="flex flex-col gap-1">
                  {melhorOferta.desconto > 0 && (
                    <span className="text-sm text-bp-muted/60 line-through">
                      {brl(melhorOferta.precoOriginal)}
                    </span>
                  )}
                  <span className="font-head text-3xl font-extrabold text-bp-primary">
                    {brl(melhorOferta.preco)}
                  </span>
                  {melhorOferta.desconto > 0 && (
                    <span className="text-sm text-bp-muted">{melhorOferta.desconto}% de desconto</span>
                  )}
                </div>
              </>
            ) : (
              <p className="text-bp-muted">Sem ofertas no momento.</p>
            )}

            {menorPrecoHistorico && (
              <p className="text-sm text-bp-muted">
                Menor preço já registrado: {brl(menorPrecoHistorico.valor)} em{' '}
                {menorPrecoHistorico.data.split('-').reverse().join('/')}
              </p>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              {melhorOferta?.url && (
                <a
                  href={melhorOferta.url}
                  {...LINK_EXTERNO}
                  className="rounded-[9px] bg-bp-primary px-6 py-2.5 text-[15px] text-bp-neutral transition hover:brightness-110"
                >
                  Ir para {melhorOferta.loja ?? 'a loja'}
                </a>
              )}
              <Link
                href={`/turbo/${jogo.id}`}
                className="rounded-[9px] bg-bp-muted px-6 py-2.5 text-[15px] text-bp-neutral transition hover:brightness-110"
              >
                Dar um turbo
              </Link>
              <Link
                href="/jogos"
                className="rounded-[9px] border border-bp-muted px-6 py-2.5 text-[15px] text-bp-muted transition hover:brightness-125"
              >
                Voltar às ofertas
              </Link>
            </div>
          </div>
        </section>

        {/* Todas as lojas: aparece sempre que houver pelo menos uma oferta */}
        {ofertas.length > 0 && (
          <section
            aria-label="Onde comprar"
            className="w-full max-w-[1100px] rounded-3xl p-6"
            style={{ background: tema.painel }}
          >
            <h2 className="pb-4 font-head text-2xl font-extrabold text-bp-primary">
              Onde comprar
            </h2>

            <ul className="flex list-none flex-col gap-2">
              {ofertas.map((o, i) => {
                const conteudo = (
                  <>
                    <span className="flex items-center gap-3">
                      <span className="font-body text-lg">{o.loja ?? `Loja ${o.idLoja}`}</span>
                      {i === 0 && (
                        <span className="rounded-full bg-bp-primary px-2.5 py-0.5 text-xs text-bp-neutral">
                          Melhor preço
                        </span>
                      )}
                    </span>

                    <span className="flex items-center gap-4">
                      {o.desconto > 0 && (
                        <span className="flex items-center gap-2 text-sm">
                          <span className="text-bp-muted/60 line-through">{brl(o.precoOriginal)}</span>
                          <span>-{o.desconto}%</span>
                        </span>
                      )}
                      <strong className="font-head text-xl text-bp-primary">{brl(o.preco)}</strong>
                      <span className="min-w-[88px] text-right text-sm">
                        {o.url ? 'Ir à loja →' : 'Sem link'}
                      </span>
                    </span>
                  </>
                )

                const base =
                  'flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[13px] bg-bp-neutral px-4 py-3 text-bp-muted'

                return (
                  <li key={o.idLoja}>
                    {o.url ? (
                      <a
                        href={o.url}
                        {...LINK_EXTERNO}
                        className={`${base} transition hover:brightness-125`}
                      >
                        {conteudo}
                      </a>
                    ) : (
                      <div className={`${base} opacity-70`}>{conteudo}</div>
                    )}
                  </li>
                )
              })}
            </ul>

            <p className="pt-4 text-xs text-bp-muted/70">
              Os preços podem mudar. Confira o valor final na loja antes de comprar.
            </p>
          </section>
        )}
      </main>

      <div className="h-[5px]" style={{ background: tema.divisor }} />
      <Footer />
    </div>
  )
}