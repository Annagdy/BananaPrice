'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { logo } from './assets'
import { SearchIcon, UserPlusIcon, HeartIcon, UserIcon, BellIcon } from './Icons'
import { createClient } from '@/lib/supabase.ts/client.ts'

type NavProps = {
  onSearch?: (value: string) => void
  /** true = mostra Lista de Desejos e Conta em vez de Login / Cadastrar */
  logado?: boolean
}

export default function Nav({ onSearch, logado = false }: NavProps) {
  const [estaLogado, setEstaLogado] = useState<boolean>(logado)
  const [naoLidas, setNaoLidas] = useState<number>(0)

  useEffect(() => {
    setEstaLogado(logado)
  }, [logado])

  // Se não foi explicitamente passado como logado, verifica sessão no navegador
  useEffect(() => {
    if (!logado) {
      try {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) setEstaLogado(true)
        })
      } catch {
        // silencioso
      }
    }
  }, [logado])

  // Carrega e sincroniza o número de notificações não lidas
  useEffect(() => {
    if (!estaLogado) return

    const carregarNaoLidas = () => {
      fetch('/api/v1/notifications', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && typeof data.naoLidas === 'number') {
            setNaoLidas(data.naoLidas)
          }
        })
        .catch(() => {})
    }

    carregarNaoLidas()

    // Atualiza via evento local do navegador
    window.addEventListener('notificacoes-atualizadas', carregarNaoLidas)

    // Atualiza em tempo real via Supabase Realtime
    try {
      const supabase = createClient()
      const canal = supabase
        .channel('nav-realtime-notificacoes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notificacao' },
          () => {
            carregarNaoLidas()
          }
        )
        .subscribe()

      return () => {
        window.removeEventListener('notificacoes-atualizadas', carregarNaoLidas)
        supabase.removeChannel(canal)
      }
    } catch {
      return () => {
        window.removeEventListener('notificacoes-atualizadas', carregarNaoLidas)
      }
    }
  }, [estaLogado])

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

      <div className="relative max-w-[517px] flex-1 max-[640px]:order-3 max-[640px]:max-w-none max-[640px]:basis-full">
        <input
          type="search"
          placeholder="Search"
          aria-label="Buscar jogos"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSearch?.(e.currentTarget.value)
            }
          }}
          className="h-[46px] w-full rounded-[13px] border border-bp-muted/30 bg-bp-nav pl-[18px] pr-[52px] text-xs text-bp-text outline-none placeholder:text-bp-muted/45 focus:border-bp-primary"
        />
        <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-[#817667]/90" />
      </div>

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
