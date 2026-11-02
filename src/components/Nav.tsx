'use client'

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logo } from './assets'
import { SearchIcon, UserPlusIcon, HeartIcon, UserIcon, BellIcon } from './Icons'

type NavProps = {
  /** Só a página do catálogo passa isto: a pesquisa é tratada ali mesmo. As demais páginas não passam,
   *  e a pesquisa leva para /jogos?search=... */
  onSearch?: (value: string) => void
  /** Texto que a barra mostra (a página do catálogo usa para refletir a pesquisa atual). */
  valorBusca?: string
  /** true = mostra Lista de Desejos e Conta em vez de Login / Cadastrar */
  logado?: boolean
}

/* Cabeçalho do site com a barra de pesquisa.

Ao pesquisar (Enter ou clique na lupa):
- Em qualquer página: vai para o catálogo, em /jogos?search=<texto>.
- Na própria página do catálogo (que passa onSearch): só atualiza a pesquisa, sem recarregar a página. */
export default function Nav({ onSearch, valorBusca = '', logado = false }: NavProps) {
  const router = useRouter()
  const [texto, setTexto] = useState(valorBusca)

  // acompanha a pesquisa atual quando a página do catálogo a define (por exemplo, vinda do endereço)
  useEffect(() => {
    setTexto(valorBusca)
  }, [valorBusca])

  const pesquisar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const termo = texto.trim()

    if (onSearch) {
      onSearch(termo)
      return
    }

    if (!termo) return

    router.push(`/jogos?search=${encodeURIComponent(termo)}`)
  }

  return (
    <header className="flex h-20 items-center justify-between gap-6 bg-bp-nav pr-5 max-[640px]:h-auto max-[640px]:flex-wrap max-[640px]:px-3 max-[640px]:py-2">
      <Link
        href="/"
        aria-label="BananaPrice"
        className="relative h-[88px] w-[270px] shrink-0 overflow-hidden max-[1100px]:w-[180px]"
      >
        <Image
          src={logo}
          alt="BananaPrice"
          width={303}
          height={101}
          className="absolute -left-4 -top-1.5 h-[101px] w-[303px] max-w-none object-cover"
        />
      </Link>

      <form
        role="search"
        onSubmit={pesquisar}
        className="relative max-w-[517px] flex-1 max-[640px]:order-3 max-[640px]:max-w-none max-[640px]:basis-full"
      >
        <input
          type="search"
          name="search"
          placeholder="Search"
          aria-label="Buscar jogos"
          maxLength={100}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="h-[46px] w-full rounded-[13px] border border-bp-muted/30 bg-bp-nav pl-[18px] pr-[52px] text-xs text-bp-text outline-none placeholder:text-bp-muted/45 focus:border-bp-primary"
        />
        <button
          type="submit"
          aria-label="Pesquisar"
          title="Pesquisar"
          className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-[#817667]/90 transition hover:text-bp-primary"
        >
          <SearchIcon />
        </button>
      </form>

      {logado ? (
        <div className="flex shrink-0 items-center gap-[19px] pr-2.5 max-[640px]:gap-3">
          <Link href="/notificacoes" aria-label="Notificações" className="text-bp-muted/70 hover:text-bp-primary">
            <BellIcon />
          </Link>
          <Link
            href="/lista-de-desejos"
            className="inline-flex h-[38px] items-center gap-2 whitespace-nowrap rounded-[9px] bg-bp-primary px-3 text-xs text-bp-neutral"
          >
            <HeartIcon /> Lista de Desejos
          </Link>
          <Link
            href="/conta"
            className="inline-flex h-[38px] items-center gap-2 whitespace-nowrap rounded-[9px] bg-bp-primary px-3 text-xs text-bp-neutral"
          >
            <UserIcon /> Conta
          </Link>
        </div>
      ) : (
        <Link
          href="/login"
          className="inline-flex h-[38px] items-center gap-2 whitespace-nowrap rounded-[9px] bg-bp-primary px-4 text-xs text-bp-neutral"
        >
          <UserPlusIcon />
          Login / Cadastrar
        </Link>
      )}
    </header>
  )
}