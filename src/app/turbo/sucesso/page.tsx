import Image from 'next/image'
import Link from 'next/link'
import Nav from '../../../components/Nav'
import Footer from '../../../components/Footer'
import { sucesso } from '../../../mocks/sucesso'
import { tema } from '../../../mocks/tema'

export default function TurboSucessoPage() {
  const { titulo, mensagem, botao, botaoHref, imagens } = sucesso

  return (
    <div className="flex min-h-screen flex-col bg-bp-bg">
      <Nav logado />
      <div className="h-[5px]" style={{ background: tema.divisor }} />

      <main className="flex flex-1 flex-col items-center gap-8 px-5 py-[100px] max-[640px]:py-10">
        <section
          className="relative flex w-full max-w-[746px] flex-col items-center justify-center gap-2.5 rounded-3xl px-[201px] py-11 shadow-[0_25px_50px_-12px_rgba(0,0,0,.25)] max-[900px]:px-8"
          style={{ background: tema.painel }}
        >
          <h1 className="p-2.5 text-center font-head text-[64px] font-extrabold leading-[72px] text-bp-primary max-[900px]:text-4xl max-[900px]:leading-tight">
            {titulo}
          </h1>

          {imagens.check && <Image src={imagens.check} alt="" width={134} height={134} unoptimized />}

          <p className="w-[385px] max-w-full p-2.5 text-center font-body text-[40px] font-bold leading-[48px] text-bp-muted max-[900px]:text-2xl max-[900px]:leading-snug">
            {mensagem}
          </p>

          {imagens.mascote && (
            <Image
              src={imagens.mascote}
              alt=""
              width={294}
              height={242}
              unoptimized
              className="pointer-events-none absolute -bottom-[38px] -right-[107px] max-[1200px]:-right-4 max-[900px]:hidden"
            />
          )}
        </section>

        <Link
          href={botaoHref}
          className="rounded-[9px] bg-bp-muted px-6 py-2.5 font-body text-[15px] text-bp-neutral transition hover:brightness-110"
        >
          {botao}
        </Link>
      </main>

      <div className="h-[5px]" style={{ background: tema.divisor }} />
      <Footer />
    </div>
  )
}
