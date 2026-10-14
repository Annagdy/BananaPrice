import Image from 'next/image'
import { macaco } from './assets'

export default function Hero() {
  return (
    <section className="relative m-2.5 flex min-h-[241px] items-center justify-between overflow-hidden rounded-3xl bg-[linear-gradient(90deg,rgba(50,40,36,.8),rgba(39,29,26,.62)_49%,rgba(35,25,22,.71))] px-[60px] py-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,.25)] max-[1100px]:flex-col max-[1100px]:gap-4 max-[1100px]:p-6 max-[1100px]:text-center">
      <div className="mx-auto max-w-[620px] flex-1 text-center">
        <h1 className="font-head text-[36px] font-extrabold leading-[1.2] text-bp-muted max-[640px]:text-[26px]">
          BananaPrice: O seu radar de games a preço de banana!
        </h1>
        <p className="mx-auto mt-4 max-w-[380px] text-2xl leading-7 text-bp-muted max-[640px]:text-lg">
          Acompanhe descontos reais e o menor preço histórico nas principais lojas.
        </p>
      </div>

      <div className="relative size-[239px] shrink-0">
        <div className="absolute -inset-5 rounded-full bg-bp-primary/[.12] blur-[30px]" />
        <Image
          src={macaco}
          alt="Mascote macaco gamer"
          width={239}
          height={239}
          className="relative size-full -scale-x-100 rounded-full object-cover"
        />
      </div>
    </section>
  )
}
