'use client'

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Bot } from 'lucide-react'
import { logo } from './assets'
import { SearchIcon, UserPlusIcon, HeartIcon, UserIcon, BellIcon } from './Icons'
import { createClient } from '@/lib/supabase.ts/client'
import { tema } from '../mocks/tema'

export type ModoBusca = 'nativa' | 'ia'

type NavProps = {
  onSearch?: (value: string, modo: ModoBusca) => void
  valorBusca?: string
  modoInicial?: ModoBusca
  logado?: boolean
}

export default function Nav({
  onSearch,
  valorBusca = '',
  modoInicial = 'nativa',
  logado = false,
}: NavProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [texto, setTexto] = useState(valorBusca)
  const [modo, setModo] = useState<ModoBusca>(modoInicial)
  const [estaLogado, setEstaLogado] = useState(logado)
  const [naoLidas, setNaoLidas] = useState(0)

  useEffect(() => {
    setTexto(valorBusca || searchParams.get('search') || searchParams.get('busca') || '')
  }, [valorBusca, searchParams])

  useEffect(() => {
    const modoUrl = searchParams.get('modo') as ModoBusca
    if (modoUrl === 'nativa' || modoUrl === 'ia') {
      setModo(modoUrl)
    }
  }, [searchParams])

  useEffect(() => {
    setEstaLogado(logado)
  }, [logado])

  useEffect(() => {
    if (!estaLogado) return

    const supabase = createClient()
    async function carregarNotificacoesNaoLidas() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { count } = await supabase
          .from('notificacoes')
          .select('*', { count: 'exact', head: true })
          .eq('usuario_id', user.id)
          .eq('lida', false)

        if (count !== null) setNaoLidas(count)
      } catch {
        // Ignora erro se tabela não existir
      }
    }

    carregarNotificacoesNaoLidas()
  }, [estaLogado])

  const dispararBusca = (termo: string, modoAtual: ModoBusca) => {
    if (onSearch) {
      onSearch(termo, modoAtual)
      return
    }

    if (!termo) return

    router.push(`/jogos?search=${encodeURIComponent(termo)}&modo=${modoAtual}`)
  }

  const pesquisar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    dispararBusca(texto.trim(), modo)
  }

  const alterarModo = (novoModo: ModoBusca) => {
    setModo(novoModo)
    const termo = texto.trim()
    if (termo) {
      dispararBusca(termo, novoModo)
    }
  }

  return (
    <header className="w-full shrink-0 bg-bp-nav">
      <nav className="flex h-20 items-center justify-between gap-6 pr-5 max-[640px]:h-auto max-[640px]:flex-wrap max-[640px]:px-3 max-[640px]:py-2">
        {/* Logo */}
        <Link
          href="/"
          aria-label="BananaPrice"
          className="relative h-[88px] w-[270px] shrink-0 overflow-hidden transition-transform duration-150 active:scale-95 max-[1100px]:w-[180px]"
        >
          <Image
            src={logo}
            alt="BananaPrice"
            width={303}
            height={101}
            className="absolute -left-4 -top-1.5 h-[101px] w-[303px] max-w-none object-cover"
          />
        </Link>

        {/* Formulário de Pesquisa */}
        <form
          role="search"
          onSubmit={pesquisar}
          className="relative flex max-w-[580px] flex-1 items-center gap-2 max-[640px]:order-3 max-[640px]:max-w-none max-[640px]:basis-full"
        >
          <div className="relative flex-1">
            <input
              type="search"
              name="search"
              placeholder={
                modo === 'nativa'
                  ? 'Busca rápida de jogos (ex: Resident Evil)...'
                  : 'Busca profunda por franquias com IA...'
              }
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
              className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-[#817667]/90 transition-colors hover:text-bp-primary"
            >
              <SearchIcon />
            </button>
          </div>

          {/* Seletor do Modo de Pesquisa */}
          <div className="flex h-[46px] shrink-0 items-center rounded-[13px] border border-bp-muted/30 bg-bp-nav/80 p-1">
            <button
              type="button"
              onClick={() => alterarModo('nativa')}
              title="Busca Rápida e Direta (estilo Steam)"
              className={`flex h-full items-center gap-1.5 rounded-[9px] px-2.5 font-head text-[11px] font-bold transition-all duration-150 active:scale-95 ${
                modo === 'nativa'
                  ? 'bg-bp-primary text-bp-neutral shadow-sm'
                  : 'text-bp-muted hover:text-bp-primary'
              }`}
            >
              <Search className="size-3.5" /> Nativa
            </button>
            <button
              type="button"
              onClick={() => alterarModo('ia')}
              title="Busca Avançada de Franquias e Sequências com IA"
              className={`flex h-full items-center gap-1.5 rounded-[9px] px-2.5 font-head text-[11px] font-bold transition-all duration-150 active:scale-95 ${
                modo === 'ia'
                  ? 'bg-bp-primary text-bp-neutral shadow-sm'
                  : 'text-bp-muted hover:text-bp-primary'
              }`}
            >
              <Bot className="size-3.5" /> IA
            </button>
          </div>
        </form>

        {/* Links do Usuário */}
        {estaLogado ? (
          <div className="flex shrink-0 items-center gap-[19px] pr-2.5 max-[640px]:gap-3">
            <Link
              href="/notificacoes"
              aria-label="Notificações"
              className="relative inline-flex size-[38px] items-center justify-center rounded-[9px] bg-bp-primary text-bp-neutral shadow-sm transition-all duration-150 hover:brightness-110 active:scale-95"
            >
              <BellIcon width={20} height={20} />
              {naoLidas > 0 && (
                <span
                  className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 font-head text-[10px] font-extrabold text-white ring-2 ring-bp-nav"
                  aria-label={`${naoLidas} notificações não lidas`}
                >
                  {naoLidas > 99 ? '99+' : naoLidas}
                </span>
              )}
            </Link>
            <Link
              href="/lista-de-desejos"
              className="inline-flex h-[38px] items-center gap-2 whitespace-nowrap rounded-[9px] bg-bp-primary px-3.5 font-head text-xs font-bold text-bp-neutral shadow-sm transition-all duration-150 hover:brightness-110 active:scale-95"
            >
              <HeartIcon /> Lista de Desejos
            </Link>
            <Link
              href="/conta"
              className="inline-flex h-[38px] items-center gap-2 whitespace-nowrap rounded-[9px] bg-bp-primary px-3.5 font-head text-xs font-bold text-bp-neutral shadow-sm transition-all duration-150 hover:brightness-110 active:scale-95"
            >
              <UserIcon /> Conta
            </Link>
          </div>
        ) : (
          <Link
            href="/login"
            className="inline-flex h-[38px] items-center gap-2 whitespace-nowrap rounded-[9px] bg-bp-primary px-4 font-head text-xs font-bold text-bp-neutral shadow-sm transition-all duration-150 hover:brightness-110 active:scale-95"
          >
            <UserPlusIcon />
            Login / Cadastrar
          </Link>
        )}
      </nav>

      {/* Linha Divisória Marrom integrada no Nav */}
      <div className="h-[5px] w-full" style={{ background: tema.divisor }} />
    </header>
  )
}