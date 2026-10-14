import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { logo, palmeira, bananas } from './assets'

/** Fundo (palmeira, banana, brilho), logo e cartão das telas de login e cadastro */
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bp-bg px-4 py-10">
      <Image
        src={palmeira}
        alt=""
        width={750}
        height={625}
        priority
        className="pointer-events-none absolute -bottom-[4%] right-[7%] h-auto w-[min(750px,52vw)] max-[700px]:hidden"
      />
      <Image
        src={bananas}
        alt=""
        width={230}
        height={192}
        className="pointer-events-none absolute bottom-[4%] left-[22%] h-auto w-[230px] [transform:rotate(-165deg)_scaleY(-1)] max-[700px]:hidden"
      />
      <div className="pointer-events-none absolute h-[677px] w-[703px] rounded-full bg-bp-primary/5 blur-[32px]" />

      <div className="relative z-[1] w-full max-w-[448px]">
        <Link href="/">
          <Image
            src={logo}
            alt="BananaPrice"
            width={780}
            height={250}
            className="pointer-events-none relative left-1/2 z-[2] mx-auto -mb-[80px] block h-auto w-[780px] max-w-[150%] -translate-x-1/2"
          />
        </Link>
        <section className="flex flex-col gap-6 rounded-[32px] bg-bp-surface px-10 pb-10 pt-14 shadow-xl max-[700px]:px-6 max-[700px]:pb-7">
          {children}
        </section>
      </div>
    </main>
  )
}
