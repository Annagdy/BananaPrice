'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Nav from '../../../components/Nav'
import Footer from '../../../components/Footer'
import { BoltIcon } from '../../../components/Icons'
import { capaExemplo } from '../../../components/assets'
import { JOGO_EXEMPLO, PIX_COPIA_E_COLA, PIX_QR_CODE, VALOR_TURBO, TEMPO_TOTAL } from '../../../mocks/turbo'
import { tema } from '../../../mocks/tema'

const brl = (valor: number): string =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatarTempo = (segundos: number): string => {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function TurboPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const jogo = JOGO_EXEMPLO // TODO: buscar o jogo pelo gameId
  const [restante, setRestante] = useState<number>(TEMPO_TOTAL)
  const [copiado, setCopiado] = useState<boolean>(false)

  useEffect(() => {
    const id = setInterval(() => setRestante((r) => (r > 0 ? r - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [])

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(PIX_COPIA_E_COLA)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-bp-bg" data-game-id={gameId}>
      <Nav logado />
      <div className="h-[5px]" style={{ background: tema.divisor }} />

      <main className="flex flex-1 flex-col pb-10">
        <h1 className="flex items-center gap-3 px-[38px] py-5 font-head text-[32px] font-extrabold text-bp-primary max-[640px]:px-4 max-[640px]:text-2xl">
          <BoltIcon /> Dar um Turbo
        </h1>

        <div className="mx-2.5 h-[5px] rounded-[2px]" style={{ background: tema.divisorForte }} />

        <div className="grid grid-cols-[minmax(0,793px)_minmax(0,580px)] justify-center gap-5 px-6 pt-10 max-[1250px]:grid-cols-1 max-[640px]:px-4">
          {/* Pagamento */}
          <section className="flex flex-col gap-6 rounded-3xl p-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,.25)]" style={{ background: tema.painel }}>
            <div className="flex items-center gap-10 p-2.5 max-[900px]:flex-col max-[900px]:items-stretch max-[900px]:gap-6">
              <div className="grid size-[261px] shrink-0 place-items-center self-start rounded-3xl bg-white p-2.5 outline outline-[6px] -outline-offset-[6px] outline-bp-primary max-[900px]:self-center">
                {PIX_QR_CODE ? (
                  <Image src={PIX_QR_CODE} alt="QR Code do Pix" width={237} height={237} unoptimized />
                ) : (
                  <span className="text-center text-sm text-bp-nav">QR Code</span>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-baseline gap-3">
                  <h2 className="font-head text-4xl font-extrabold text-bp-primary max-[640px]:text-2xl">Copia e Cola</h2>
                  <span role="status" className="text-sm text-bp-muted">
                    {copiado ? 'Copiado!' : ''}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={copiar}
                  title={PIX_COPIA_E_COLA}
                  aria-label="Copiar código Pix"
                  className="cursor-pointer truncate rounded-3xl border bg-bp-neutral p-2.5 text-left text-4xl text-white transition hover:brightness-125 max-[640px]:text-lg"
                  style={{ borderColor: tema.painel }}
                >
                  {PIX_COPIA_E_COLA}
                </button>

                <p className="p-2.5 pb-0 font-head text-4xl font-extrabold text-bp-primary max-[640px]:text-2xl">
                  {formatarTempo(restante)}
                </p>
                <div
                  role="progressbar"
                  aria-label="Tempo restante para pagar"
                  aria-valuemin={0}
                  aria-valuemax={TEMPO_TOTAL}
                  aria-valuenow={restante}
                  className="mx-2.5 h-9 overflow-hidden rounded-3xl bg-bp-neutral max-[640px]:h-6"
                >
                  <div
                    className="h-full rounded-3xl transition-[width] duration-1000 ease-linear"
                    style={{ width: `${(restante / TEMPO_TOTAL) * 100}%`, background: tema.progresso }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-6 rounded-3xl border bg-bp-neutral p-8 max-[800px]:flex-col max-[800px]:text-center" style={{ borderColor: tema.painel }}>
              <p className="max-w-[308px] text-center text-4xl text-bp-muted max-[640px]:text-xl">
                Lembre de checar o código e valor antes de concluir o pagamento!
              </p>
              <p className="flex-1 text-center text-5xl font-bold text-bp-primary max-[640px]:text-3xl">
                {brl(VALOR_TURBO)}
              </p>
            </div>
          </section>

          {/* Preview do jogo */}
          <section className="flex flex-col gap-6 rounded-3xl p-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,.25)]" style={{ background: tema.painel }}>
            <div className="m-2.5 overflow-hidden rounded-[13px] bg-bp-neutral">
              <div className="relative">
                <Image
                  src={jogo.capa ?? capaExemplo}
                  alt=""
                  width={486}
                  height={273}
                  className="aspect-[486/273] w-full object-cover"
                  unoptimized={jogo.capa !== null}
                />
                <div className="absolute bottom-0 right-0 flex h-9 items-center bg-bp-primary pl-6 pr-1 [clip-path:polygon(14px_0,100%_0,100%_100%,14px_100%,0_50%)]">
                  <span className="font-head text-xl font-extrabold leading-none text-bp-neutral">{jogo.desconto}%</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 p-4">
                <h3 className="font-head text-base font-extrabold text-bp-muted">{jogo.nome}</h3>
                <p className="flex items-center gap-2 text-sm text-bp-muted">
                  <span className="size-2.5 rounded-full bg-bp-primary" />
                  {jogo.loja}
                </p>
                <div className="flex flex-col">
                  <span className="text-[10px] text-bp-muted/60">{brl(jogo.precoOriginal)}</span>
                  <span className="font-head text-sm font-extrabold text-bp-primary">{brl(jogo.precoComDesconto)}</span>
                </div>
              </div>
            </div>

            <Link
              href={`/jogos/${gameId}`}
              className="mx-2.5 rounded-3xl bg-bp-neutral p-4 text-center text-4xl text-bp-muted transition hover:brightness-125 max-[640px]:text-xl"
            >
              Verifique a preview para o jogo selecionado.
            </Link>
          </section>
        </div>
      </main>

      <div className="h-[5px]" style={{ background: tema.divisor }} />
      <Footer />
    </div>
  )
}
