import Image from 'next/image'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Nav from '../../../components/Nav'
import Footer from '../../../components/Footer'
import { capaExemplo } from '../../../components/assets'
import { tema } from '../../../mocks/tema'
import PortaoAdulto from './PortaoAdulto'
import HistoricoPrecos from '../../../components/HistoricoPrecos'

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
  capa: string | null
  melhorOferta: Oferta | null
  ofertas: Oferta[]
  menorPrecoHistorico: { valor: number; data: string } | null
}

/* Resultado da busca: o jogo, "bloqueado" (conteúdo adulto não liberado) ou null (não existe). */
type Busca = JogoResposta | { bloqueado: true } | null

/* Busca o jogo na API, repassando o cookie da pessoa (é ele que diz se o conteúdo adulto foi liberado). */
async function buscarJogo(id: string): Promise<Busca> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const cookie = (await cookies()).toString()

  const res = await fetch(`${site}/api/v1/games/${encodeURIComponent(id)}`, {
    cache: 'no-store',
    headers: { cookie },
  })

  if (res.status === 403) return { bloqueado: true }
  if (res.status === 404 || res.status === 400) return null
  if (!res.ok) throw new Error('Falha ao carregar o jogo.')
  return res.json()
}

/* Atributos comuns dos links que saem do site (loja externa). */
const LINK_EXTERNO = {
  target: '_blank',
  rel: 'noopener noreferrer sponsored',
} as const

async function buscarHistoricoJogo(id: string) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const cookie = (await cookies()).toString()

  const res = await fetch(`${site}/api/v1/games/${encodeURIComponent(id)}/history?dias=90`, {
    cache: 'no-store',
    headers: { cookie },
  })

  if (!res.ok) return { series: [] as Array<{ loja: string | null; pontos: Array<{ data: string; valor: number }> }> }
  return res.json()
}

export default async function JogoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dados = await buscarJogo(id)
  if (!dados) notFound()
  if ('bloqueado' in dados) return <PortaoAdulto />

  const { jogo, capa, melhorOferta, ofertas, menorPrecoHistorico } = dados
  const historico = await buscarHistoricoJogo(id)

  const listaDoJogo = [
    { label: 'Categoria', value: jogo.genero ?? 'Não informada' },
    { label: 'Melhor preço', value: melhorOferta ? brl(melhorOferta.preco) : 'Sem oferta' },
    {
      label: 'Loja atual',
      value: melhorOferta?.loja ?? 'Indisponível',
    },
    {
      label: 'Histórico mínimo',
      value: menorPrecoHistorico ? brl(menorPrecoHistorico.valor) : 'Sem registro',
    },
  ].filter((item) => item.value && item.value !== 'Sem oferta')

  const historicoPrecos = (historico?.series ?? [])
    .flatMap((serie: { loja: string | null; pontos: Array<{ data: string; valor: number }> }) =>
      serie.pontos.map((ponto) => ({
        loja: serie.loja ?? 'Loja',
        data: ponto.data,
        valor: ponto.valor,
      }))
    )
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

  return (
    <div className="flex min-h-screen flex-col bg-bp-bg">
      <Nav logado />
      <div className="h-[5px]" style={{ background: tema.divisor }} />

      <main className="flex flex-1 flex-col items-center gap-6 px-5 py-10">
        <section
          className="w-full max-w-[1200px] rounded-3xl p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,.25)]"
          style={{ background: tema.painel }}
        >
          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
            <div className="space-y-6">
              <div className="rounded-[20px] bg-bp-neutral/70 p-4">
                <div className="relative aspect-[486/273] w-full overflow-hidden rounded-[15px] bg-white">
                  <Image
                    src={capa ?? capaExemplo}
                    alt={jogo.titulo}
                    fill
                    sizes="(max-width: 900px) 100vw, 600px"
                    className="object-cover"
                    unoptimized={capa !== null}
                  />
                </div>

                <div className="mt-5 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h1 className="font-head text-3xl font-extrabold text-bp-primary max-[640px]:text-2xl">
                      {jogo.titulo}
                    </h1>
                    {jogo.genero && (
                      <span className="rounded-full border border-bp-muted/40 px-2.5 py-1 text-[11px] uppercase tracking-[.18em] text-bp-muted">
                        {jogo.genero}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {melhorOferta?.url && (
                      <a
                        href={melhorOferta.url}
                        {...LINK_EXTERNO}
                        className="rounded-[9px] bg-bp-primary px-5 py-2.5 text-[15px] text-bp-neutral transition hover:brightness-110"
                      >
                        Ir para {melhorOferta.loja ?? 'a loja'}
                      </a>
                    )}
                    <Link
                      href={`/turbo/${jogo.id}`}
                      className="rounded-[9px] bg-bp-muted px-5 py-2.5 text-[15px] text-bp-neutral transition hover:brightness-110"
                    >
                      Dar um turbo
                    </Link>
                    <Link
                      href="/jogos"
                      className="rounded-[9px] border border-bp-muted px-5 py-2.5 text-[15px] text-bp-muted transition hover:brightness-125"
                    >
                      Voltar às ofertas
                    </Link>
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] bg-bp-neutral/70 p-5">
                <h2 className="pb-4 font-head text-2xl font-extrabold text-bp-primary">Onde comprar</h2>

                {ofertas.length > 0 ? (
                  <ul className="flex list-none flex-col gap-2">
                    {ofertas.map((o, i) => {
                      const conteudo = (
                        <>
                          <span className="flex items-center gap-3">
                            <span className="font-body text-lg">{o.loja ?? `Loja ${o.idLoja}`}</span>
                            {i === 0 && (
                              <span className="rounded-full bg-bp-primary px-2.5 py-0.5 text-[10px] uppercase tracking-[.12em] text-bp-neutral">
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
                ) : (
                  <div className="rounded-[18px] border border-dashed border-bp-muted/30 bg-bp-bg/40 p-6 text-center">
                    <p className="text-sm text-bp-muted/80">
                      Não encontramos ofertas de compra para este jogo específico.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[20px] bg-bp-neutral/70 p-5">
                <h2 className="pb-4 font-head text-2xl font-extrabold text-bp-primary">Lista do jogo</h2>

                {listaDoJogo.length > 0 ? (
                  <ul className="space-y-3">
                    {listaDoJogo.map((item) => (
                      <li
                        key={item.label}
                        className="flex items-center justify-between gap-3 rounded-[12px] border border-bp-muted/20 bg-bp-bg/40 px-3 py-2.5"
                      >
                        <span className="text-sm text-bp-muted">{item.label}</span>
                        <strong className="font-head text-base text-bp-primary">{item.value}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed border-bp-muted/25 bg-bp-bg/30 p-6 text-center">
                    <Image src="/assets/macacao.png" alt="Macaco dormindo" width={180} height={180} className="object-contain" />
                    <p className="max-w-xs text-sm leading-6 text-bp-muted">
                      Não encontramos uma lista específica para esse jogo específico.
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-[20px] bg-bp-neutral/70 p-5">
                <h2 className="pb-4 font-head text-2xl font-extrabold text-bp-primary">Resumo</h2>

                {melhorOferta ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-bp-muted">Melhor oferta</span>
                      <span className="font-head text-xl text-bp-primary">{brl(melhorOferta.preco)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-bp-muted">Loja</span>
                      <span className="font-body text-sm text-bp-muted">{melhorOferta.loja ?? 'Loja'}</span>
                    </div>
                    {/* <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-bp-muted">Menor preço já registrado</span>
                      <span className="font-head text-sm text-bp-primary">
                        {menorPrecoHistorico ? brl(menorPrecoHistorico.valor) : 'Sem registro'}
                      </span>
                    </div> */}
                    <div className="w-full max-w-[1100px] rounded-3xl p-6" style={{ background: tema.painel }}>
                      <HistoricoPrecos idJogo={jogo.id} />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-bp-muted">Sem ofertas no momento.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[20px] bg-bp-neutral/70 p-5">
            <h2 className="pb-4 font-head text-2xl font-extrabold text-bp-primary">Histórico de preços</h2>

            {historicoPrecos.length > 0 ? (
              <div className="overflow-hidden rounded-[14px] border border-bp-muted/20">
                <div className="grid grid-cols-[1.2fr_1fr_0.8fr] gap-3 bg-bp-bg/50 px-4 py-3 text-xs uppercase tracking-[.12em] text-bp-muted">
                  <span>Data</span>
                  <span>Loja</span>
                  <span className="text-right">Preço</span>
                </div>
                <div className="divide-y divide-bp-muted/10">
                  {historicoPrecos.slice(-12).map((item, index) => (
                    <div key={`${item.data}-${item.loja}-${index}`} className="grid grid-cols-[1.2fr_1fr_0.8fr] gap-3 px-4 py-3 text-sm text-bp-muted">
                      <span>{item.data.split('-').reverse().join('/')}</span>
                      <span>{item.loja}</span>
                      <span className="text-right font-head text-base text-bp-primary">{brl(item.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed border-bp-muted/25 bg-bp-bg/30 p-6 text-center">
                <Image src="/assets/macacao.png" alt="Macaco dormindo" width={180} height={180} className="object-contain" />
                <p className="max-w-sm text-sm leading-6 text-bp-muted">
                  Não encontramos o histórico de preços desse jogo específico.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <div className="h-[5px]" style={{ background: tema.divisor }} />
      <Footer />
    </div>
  )
}