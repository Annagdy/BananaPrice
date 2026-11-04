'use client'

import { use, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Nav from '../../../components/Nav'
import Footer from '../../../components/Footer'
import Loading from '@/components/loading'
import { TagIcon, StoreIcon } from '../../../components/Icons'
import { tema } from '../../../mocks/tema'

type Oferta = {
  idLoja: number
  loja: string | null
  preco: number
  precoOriginal: number
  desconto: number
  url: string | null
}

type DetalhesJogoResponse = {
  jogo: {
    id: number
    itadId: string | number | null
    titulo: string
    slug: string | null
    genero: string | null
  }
  capa: string | null
  melhorOferta: Oferta | null
  ofertas: Oferta[]
  menorPrecoHistorico: {
    valor: number
    data: string
    idLoja: number
  } | null
  dlcs?: any[]
  error?: string
}

export default function JogoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  const [dados, setDados] = useState<DetalhesJogoResponse | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setCarregando(true)
    setErro(null)

    fetch(`/api/v1/games/${id}`, { signal: controller.signal })
      .then(async (res) => {
        const json = await res.json().catch(() => null)
        if (!res.ok) {
          throw new Error(json?.error ?? 'Não foi possível carregar os detalhes do jogo.')
        }
        setDados(json)
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') {
          setErro(e.message)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setCarregando(false)
        }
      })

    return () => controller.abort()
  }, [id])

  return (
    <div className="flex min-h-screen flex-col bg-bp-bg text-bp-neutral">
      <Nav logado />
      <div className="h-[5px]" style={{ background: tema.divisor }} />

      <main className="flex-1 px-5 py-10 max-w-[1240px] mx-auto w-full">
        {carregando ? (
          <div className="py-20 flex justify-center items-center">
            <Loading mensagem="Carregando detalhes do jogo..." />
          </div>
        ) : erro ? (
          <div className="py-20 text-center">
            <p role="alert" className="text-xl text-red-400 font-head mb-4">
              {erro}
            </p>
            <Link
              href="/jogos"
              className="inline-block rounded-xl bg-bp-primary px-5 py-2.5 text-sm font-bold text-bp-neutral hover:brightness-110 transition"
            >
              Voltar ao catálogo
            </Link>
          </div>
        ) : !dados ? null : (
          <div className="flex flex-col gap-10">
            {/* Topo: Capa e Infos Principais */}
            <div className="flex gap-8 max-[900px]:flex-col items-start">
              <div className="relative w-[300px] h-[400px] shrink-0 rounded-2xl overflow-hidden bg-bp-card shadow-lg max-[900px]:w-full max-[900px]:h-[350px]">
                {dados.capa ? (
                  <Image
                    src={dados.capa}
                    alt={dados.jogo.titulo}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-bp-muted/20 text-bp-muted font-head">
                    Sem Capa
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-4">
                <h1 className="font-head text-4xl font-extrabold text-bp-primary max-[640px]:text-3xl">
                  {dados.jogo.titulo}
                </h1>

                {dados.jogo.genero && (
                  <span className="w-fit rounded-lg bg-bp-primary/10 px-3 py-1 font-body text-sm font-semibold text-bp-primary">
                    {dados.jogo.genero}
                  </span>
                )}

                {/* Preço de Destaque */}
                <div className="mt-4 rounded-2xl p-6 shadow-md" style={{ background: tema.painel }}>
                  <p className="text-sm font-head font-semibold text-bp-muted mb-2">
                    Melhor Preço Atual:
                  </p>
                  {dados.melhorOferta ? (
                    <div className="flex items-baseline gap-4">
                      <span className="font-head text-4xl font-extrabold text-green-400">
                        {dados.melhorOferta.preco === 0
                          ? 'Grátis'
                          : `R$ ${dados.melhorOferta.preco.toFixed(2).replace('.', ',')}`}
                      </span>

                      {dados.melhorOferta.desconto > 0 && (
                        <span className="rounded-md bg-green-500/20 px-2 py-0.5 text-sm font-bold text-green-400">
                          -{dados.melhorOferta.desconto}%
                        </span>
                      )}

                      {dados.melhorOferta.precoOriginal > dados.melhorOferta.preco && (
                        <span className="text-lg line-through text-bp-muted">
                          R$ {dados.melhorOferta.precoOriginal.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="font-head text-xl font-bold text-yellow-400">
                      Indisponível no momento
                    </p>
                  )}
                </div>

                {/* Menor Preço Histórico */}
                {dados.menorPrecoHistorico && (
                  <p className="text-sm text-bp-muted font-body">
                    Menor valor histórico: <strong className="text-bp-primary">R$ {dados.menorPrecoHistorico.valor.toFixed(2).replace('.', ',')}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Lista de Lojas / Ofertas */}
            <section className="flex flex-col gap-4">
              <h2 className="flex items-center gap-2.5 font-head text-2xl font-bold text-bp-primary">
                <StoreIcon /> Onde Comprar
              </h2>

              {dados.ofertas.length === 0 ? (
                <p className="text-bp-muted">Nenhuma oferta ativa encontrada no momento.</p>
              ) : (
                <div className="grid gap-3">
                  {dados.ofertas.map((of, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-xl p-4 transition hover:brightness-110"
                      style={{ background: tema.painel }}
                    >
                      <span className="font-head text-lg font-bold text-bp-neutral">
                        {of.loja ?? 'Loja Oficial'}
                      </span>

                      <div className="flex items-center gap-4">
                        <span className="font-head text-xl font-extrabold text-green-400">
                          {of.preco === 0 ? 'Grátis' : `R$ ${of.preco.toFixed(2).replace('.', ',')}`}
                        </span>

                        {of.url ? (
                          <a
                            href={of.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-bp-primary px-4 py-2 font-head text-xs font-bold text-bp-neutral transition hover:brightness-110"
                          >
                            Ir para a loja
                          </a>
                        ) : (
                          <span className="text-xs text-bp-muted">Link indisponível</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <div className="h-[5px]" style={{ background: tema.divisor }} />
      <Footer />
    </div>
  )
}