import Image from 'next/image'
import Nav from '../../components/Nav'
import Footer from '../../components/Footer'
import { BellIcon } from '../../components/Icons'
import { capaExemplo, palmeira } from '../../components/assets'
import { notificacoes } from '../../mocks/notificacoes'

export default function NotificacoesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bp-bg">
      <Nav logado />

      <main className="relative flex-1 overflow-hidden">
        <section className="px-[45px] pt-2.5 max-[640px]:px-4">
          <h1 className="flex items-center gap-[9px] p-5 font-head text-[32px] font-extrabold text-bp-primary max-[640px]:text-2xl">
            <BellIcon width={48} height={48} strokeWidth={1.6} />
            Notificações
          </h1>
        </section>

        <div className="mx-2.5 h-[5px] rounded-[2px] bg-[#3d3b2e]" />

        <ul className="relative z-[1] flex max-w-[898px] list-none flex-col gap-[29px] px-[55px] pb-16 pt-10 max-[640px]:px-4">
          {notificacoes.map((n) => (
            <li
              key={n.id}
              className="flex items-center gap-2.5 rounded-3xl bg-[#3d322e] p-2.5 shadow-[0_25px_50px_-12px_rgba(0,0,0,.25)]"
            >
              <Image
                src={n.imagem ?? capaExemplo}
                alt=""
                width={79}
                height={79}
                className="size-[79px] shrink-0 rounded-[13px] object-cover"
              />
              <div className="flex flex-col gap-2.5 p-2.5">
                <h2 className="font-head text-4xl font-extrabold text-bp-primary max-[640px]:text-2xl">
                  {n.titulo}
                </h2>
                <p className="text-2xl text-bp-muted max-[640px]:text-base">{n.descricao}</p>
              </div>
            </li>
          ))}
        </ul>

        <Image
          src={palmeira}
          alt=""
          width={574}
          height={383}
          className="pointer-events-none absolute bottom-0 right-0 h-auto w-[574px] max-w-[45vw] max-[1100px]:hidden"
        />
      </main>

      <div className="h-[5px] bg-[#3d322e]" />
      <Footer />
    </div>
  )
}
