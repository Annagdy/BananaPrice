import Image from 'next/image'
import { logo } from './assets'

export default function Footer() {
  return (
    <footer className="mt-5 bg-bp-nav pt-2.5">
      <div className="flex justify-between gap-10 px-[23px] pb-5 pt-2.5 max-[1100px]:flex-col">
        <div className="flex w-[400px] max-w-full flex-col gap-[11px]">
          <div className="relative h-[63px] w-48 overflow-hidden">
            <Image
              src={logo}
              alt="BananaPrice"
              width={242}
              height={81}
              className="absolute -left-4 -top-1.5 h-[81px] w-[242px] max-w-none object-cover"
            />
          </div>
          <p className="text-xs leading-[19.5px] text-bp-muted">
            BananaPrice é uma ferramenta independente feita por e para gamers brasileiros. Monitoramos lojas oficiais, atualizando a cada 24 horas para garantir que você compre seus títulos favoritos pelo menor preço real.
          </p>
        </div>

        <div className="flex w-[384px] max-w-full flex-col gap-2">
          <h5 className="font-head text-xs font-bold uppercase tracking-[.6px] text-bp-primary">
            Transparência
          </h5>
          <ul className="flex list-none flex-col gap-1.5 text-xs text-[#8d7b74]">
            <li><a href="#" className="hover:text-bp-muted">Termos de Uso</a></li>
            <li><a href="#" className="hover:text-bp-muted">Política de Privacidade</a></li>
            <li><a href="#" className="hover:text-bp-muted">Contato &amp; API Pública</a></li>
          </ul>
        </div>

        <p className="w-[384px] max-w-full text-xs leading-[19.5px] text-[#8d7b74]">
          Informações e dados de preços coletados através da IsThereAnyDeal API. Para mais informações, acesse{' '}
          <a
            href="https://isthereanydeal.com"
            target="_blank"
            rel="noreferrer"
            className="text-[#d1c7bd] underline"
          >
            IsThereAnyDeal.com
          </a>
          .
        </p>
      </div>

      <div className="border-t-2 border-bp-muted/35 px-[23px] pb-3.5 pt-2.5 text-sm text-bp-muted/70">
        © 2026 BananaPrice. Todos os direitos reservados. Marcas e imagens são propriedade de suas respectivas desenvolvedoras e editoras.
      </div>
    </footer>
  )
}
