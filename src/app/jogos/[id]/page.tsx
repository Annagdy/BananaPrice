import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Nav from '../../../components/Nav'
import Footer from '../../../components/Footer'
import { capaExemplo } from '../../../components/assets'
import { promos } from '../../../mocks/promos'
import { tema } from '../../../mocks/tema'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// TODO: buscar o jogo pelo id (/api/v1/games/[id]). Por enquanto usa os dados de exemplo.
export default async function JogoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const jogo = promos.find((p) => String(p.id) === id)
  if (!jogo) notFound()

  return (
    <div className="flex min-h-screen flex-col bg-bp-bg">
      <Nav logado />
      <div className="h-[5px]" style={{ background: tema.divisor }} />

      <main className="flex flex-1 flex-col items-center px-5 py-10">
        <section
          className="grid w-full max-w-[1100px] grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 rounded-3xl p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,.25)] max-[900px]:grid-cols-1"
          style={{ background: tema.painel }}
        >
          <div className="relative aspect-[486/273] w-full overflow-hidden rounded-[13px] bg-white">
            <Image
              src={jogo.capa ?? capaExemplo}
              alt={jogo.name}
              fill
              sizes="(max-width: 900px) 100vw, 540px"
              className="object-cover"
              unoptimized={jogo.capa !== null}
            />
          </div>

          <div className="flex flex-col justify-center gap-4">
            <h1 className="font-head text-4xl font-extrabold text-bp-primary max-[640px]:text-2xl">{jogo.name}</h1>
            <p className="flex items-center gap-3 text-base text-bp-muted">
              <span className="h-[18px] w-[27px] rounded-full bg-bp-primary" />
              {jogo.store}
            </p>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-bp-muted/60 line-through">{brl(jogo.original)}</span>
              <span className="font-head text-3xl font-extrabold text-bp-primary">{brl(jogo.price)}</span>
              <span className="text-sm text-bp-muted">{jogo.discount}% de desconto</span>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={`/turbo/${jogo.id}`}
                className="rounded-[9px] bg-bp-primary px-6 py-2.5 text-[15px] text-bp-neutral transition hover:brightness-110"
              >
                Dar um turbo
              </Link>
              <Link
                href="/jogos"
                className="rounded-[9px] bg-bp-muted px-6 py-2.5 text-[15px] text-bp-neutral transition hover:brightness-110"
              >
                Voltar às ofertas
              </Link>
            </div>
          </div>
        </section>
      </main>

      <div className="h-[5px]" style={{ background: tema.divisor }} />
      <Footer />
    </div>
  )
}
