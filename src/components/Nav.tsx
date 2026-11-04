'use client'

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logo } from './assets'
import { SearchIcon, UserPlusIcon, HeartIcon, UserIcon, BellIcon } from './Icons'
import { createClient } from '@/lib/supabase.ts/client'

type NavProps = {
  /** Só a página do catálogo passa isto: a pesquisa é tratada ali mesmo. As demais páginas não passam,
   *  e a pesquisa leva para /jogos?search=... */
  onSearch?: (value: string) => void
  /** Texto que a barra mostra (a página do catálogo usa para refletir a pesquisa atual). */
  valorBusca?: string
  /** true = mostra Lista de Desejos e Conta em vez de Login / Cadastrar */
  logado?: boolean
}

export default function Nav({ onSearch, valorBusca = '', logado = false }: NavProps) {
  const router = useRouter()
  const [texto, setTexto] = useState(valorBusca)
  const [estaLogado, setEstaLogado] = useState(logado)
  const [naoLidas, setNaoLidas] = useState(0)

  // Acompanha a pesquisa atual quando definida externamente
  useEffect(() => {
    setTexto(valorBusca)
  }, [valorBusca])

  // Sincroniza o estado de login com a prop
  useEffect(() => {
    setEstaLogado(logado)
  }, [logado])

  // Busca notificações não lidas no Supabase se estiver logado
  useEffect(() => {
    if (!estaLogado) return

    const supabase = createClient()
    async function carregarNotificacoesNaoLidas() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { count } = await supabase
          .from('notificacoes')
          .select('*', { count: 'exact', head: true })
          .eq('usuario_id', user.id)
          .eq('lida', false)

        if (count !== null) {
          setNaoLidas(count)
        }
      } catch (err) {
        // Trata ou ignora se a tabela ainda não existir no banco
      }
    }

    carregarNotificacoesNaoLidas()
  }, [estaLogado])

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

      {estaLogado ? (
        <div className="flex shrink-0 items-center gap-[19px] pr-2.5 max-[640px]:gap-3">
          <Link
            href="/notificacoes"
            aria-label="Notificações"
            className="relative text-bp-muted/70 hover:text-bp-primary"
          >
            <BellIcon />
            {naoLidas > 0 && (
              <span
                className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-bp-primary px-1 text-[10px] font-extrabold text-bp-neutral ring-2 ring-bp-nav"
                aria-label={`${naoLidas} notificações não lidas`}
              >
                {naoLidas > 99 ? '99+' : naoLidas}
              </span>
            )}
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