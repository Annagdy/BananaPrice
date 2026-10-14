import Image from 'next/image'
import Nav from './Nav'
import Footer from './Footer'
import { carregando } from '../mocks/carregando'
import { tema } from '../mocks/tema'

// Tela de carregamento, com o mesmo layout para todas as transições.
export default function Carregando() {
  return (
    <div className="flex min-h-screen flex-col bg-bp-bg">
      <Nav logado />
      <div className="h-[5px]" style={{ background: tema.divisor }} />

      <main className="flex flex-1 items-center justify-center px-5 py-[100px]">
        <div
          role="status"
          aria-label={carregando.descricao}
          className="relative h-[272px] w-full max-w-[589px] overflow-hidden rounded-3xl"
          style={{ background: tema.caixaCarregando }}
        >
          {carregando.imagem && (
            <Image
              src={carregando.imagem}
              alt=""
              width={551}
              height={551}
              unoptimized
              priority
              className="absolute left-[19px] top-[-140px] max-w-none max-[640px]:left-1/2 max-[640px]:-translate-x-1/2"
            />
          )}
        </div>
      </main>

      <div className="h-[5px]" style={{ background: tema.divisor }} />
      <Footer />
    </div>
  )
}
