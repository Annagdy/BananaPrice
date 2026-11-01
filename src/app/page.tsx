
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Nav from '../components/Nav'
import Hero from '../components/Hero'
import GameCard from '../components/GameCard'
import Footer from '../components/Footer'
import { BoltIcon, TagIcon } from '../components/Icons'
import { games } from '../mocks/games'
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

type PromocaoBusca = {
  valor_atual: number | null
  percentual_desconto: number | null
  atualizado_em: string | null
  loja: { nome: string } | { nome: string }[] | null
}

type JogoEncontrado = {
  id_jogo: number
  titulo: string
  itad_id: string | number
  promocoes: PromocaoBusca[]
}

const paraCard = (j: JogoApi): Game => ({
  id: j.id,
  name: j.titulo,
  store: j.loja ?? 'Sem oferta',
  discount: j.desconto,
  originalPrice: j.precoOriginal ?? 0,
  price: j.melhorPreco ?? 0,
  cover: j.capa,
})

function formatarPreco(valor: number | null) {
  if (valor == null) return 'Não informado'

  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export default function HomePage() {
  const [resultadoBusca, setResultadoBusca] = useState<JogoEncontrado[]>([])
  const [buscaExecutada, setBuscaExecutada] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [erroBusca, setErroBusca] = useState<string | null>(null)

  // Impede uma segunda pesquisa enquanto a primeira não terminar.
  const requisicaoEmAndamento = useRef(false)

  const [start, setStart] = useState(0)

  const [ofertas, setOfertas] = useState<JogoApi[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const featured = useMemo(() => games.slice(0, 6), [])
  const visible = [0, 1].map(
    (o) => featured[(start + o) % featured.length]
  )

  const move = (d: number) =>
    setStart((s) => (s + d + featured.length) % featured.length)

  // Carrega as ofertas iniciais.
  useEffect(() => {
    const controller = new AbortController()

    const timer = setTimeout(() => {
      const params = new URLSearchParams({
        limit: String(OFERTAS_NA_HOME),
        discount: '1',
      })

      setCarregando(true)
      setErro(null)

      fetch(`/api/v1/games?${params}`, {
        signal: controller.signal,
      })
        .then(async (res) => {
          const json = await res.json().catch(() => null)

          if (!res.ok) {
            throw new Error(
              json?.error ?? 'Erro ao carregar as ofertas.'
            )
          }

          setOfertas(json.jogos ?? [])
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
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [])

  // Pesquisa executada somente quando o usuário pressiona Enter no Nav.
  async function pesquisarJogos(termo: string) {
    const busca = termo.trim()

    if (!busca || requisicaoEmAndamento.current) {
      return
    }

    requisicaoEmAndamento.current = true

    setBuscaExecutada(true)
    setBuscando(true)
    setErroBusca(null)
    setResultadoBusca([])

    try {
      const resposta = await fetch(
        `/api/v1/games?busca=${encodeURIComponent(busca)}`,
        {
          method: 'GET',
          cache: 'no-store',
        }
      )

      const dados = await resposta.json().catch(() => null)

      if (!resposta.ok) {
        throw new Error(
          dados?.detalhes ??
          dados?.erro ??
          dados?.error ??
          `Erro HTTP: ${resposta.status}`
        )
      }

      if (!Array.isArray(dados?.jogosEncontrados)) {
        throw new Error(
          dados?.mensagem ??
          'A API não retornou a lista de jogos esperada.'
        )
      }

      // A API já devolve os jogos encontrados no Supabase,
      // incluindo suas promoções.
      setResultadoBusca(dados.jogosEncontrados)

    } catch (erro) {
      setErroBusca(
        erro instanceof Error
          ? erro.message
          : 'Erro desconhecido na pesquisa.'
      )
    } finally {
      requisicaoEmAndamento.current = false
      setBuscando(false)
    }
  }

  return (
    <>
      <Nav onSearch={pesquisarJogos} />

      <Hero />

      {buscaExecutada && (
        <section
          className="mx-5 my-4 rounded-xl border border-bp-muted/30 bg-bp-nav/60 p-5"
          aria-live="polite"
        >
          <h2 className="mb-4 font-head text-2xl font-extrabold text-bp-primary">
            Resultado da busca
          </h2>

          {buscando ? (
            <div className="py-8 text-center text-bp-muted">
              <p>Pesquisando jogos e consultando promoções...</p>
              <p className="mt-2 text-sm">
                Aguarde a conclusão da pesquisa.
              </p>
            </div>
          ) : erroBusca ? (
            <p role="alert" className="py-8 text-center text-red-400">
              {erroBusca}
            </p>
          ) : resultadoBusca.length > 0 ? (
            <div className="flex flex-col gap-6">
              <p className="text-sm text-bp-muted">
                {resultadoBusca.length}{' '}
                {resultadoBusca.length === 1
                  ? 'jogo encontrado'
                  : 'jogos encontrados'}
                no banco de dados.
              </p>

              {resultadoBusca.map((jogo) => (
                <article
                  key={jogo.id_jogo}
                  className="w-full rounded-2xl border border-bp-muted/20 p-5 shadow-sm"
                >
                  <h3 className="mb-2 text-xl font-bold text-bp-primary">
                    {jogo.titulo}
                  </h3>

                  <p className="mb-4 text-sm text-bp-muted">
                    ID no banco: {jogo.id_jogo}
                    {jogo.itad_id
                      ? ` | ITAD: ${jogo.itad_id}`
                      : ''}
                  </p>

                  {jogo.promocoes.length === 0 ? (
                    <p className="text-sm text-bp-muted">
                      Nenhuma promoção cadastrada.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-bp-muted/20">
                            <th className="p-2">Loja</th>
                            <th className="p-2">Preço atual</th>
                            <th className="p-2">Desconto</th>
                            <th className="p-2">Atualizado em</th>
                          </tr>
                        </thead>

                        <tbody>
                          {jogo.promocoes.map((promocao, i) => {
                            const loja = Array.isArray(promocao.loja)
                              ? promocao.loja[0]?.nome
                              : promocao.loja?.nome

                            return (
                              <tr
                                key={`${jogo.id_jogo}-${i}`}
                                className="border-b border-bp-muted/10"
                              >
                                <td className="p-2">
                                  {loja ?? 'Loja não identificada'}
                                </td>

                                <td className="p-2 font-semibold">
                                  {formatarPreco(promocao.valor_atual)}
                                </td>

                                <td className="p-2">
                                  {promocao.percentual_desconto == null
                                    ? 'Não informado'
                                    : `${promocao.percentual_desconto}%`}
                                </td>

                                <td className="p-2">
                                  {promocao.atualizado_em
                                    ? new Date(
                                        promocao.atualizado_em
                                      ).toLocaleString('pt-BR')
                                    : 'Não informado'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-bp-muted">
              Nenhum jogo relacionado foi encontrado no banco de dados.
            </p>
          )}
        </section>
      )}

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
