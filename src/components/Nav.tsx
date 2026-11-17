'use client'

import { useEffect, useState, useRef } from 'react'
import type { FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Bot, History, X } from 'lucide-react'
import { logo } from './assets'
import { SearchIcon, UserPlusIcon, HeartIcon, UserIcon, BellIcon } from './Icons'
import { createClient } from '@/lib/supabase.ts/client'
import { tema } from '../mocks/tema'

const CHAVE_HISTORICO_BUSCA = 'bp_historico_buscas'
const MAX_HISTORICO = 6

/**
 * Modos de busca disponíveis na barra de navegação:
 * - `nativa`: Busca por correspondência textual direta ou via árvore Trie.
 * - `ia`: Busca semântica e interpretativa por inteligência artificial.
 */
export type ModoBusca = 'nativa' | 'ia'

/**
 * Propriedades para customização e controle do componente de navegação global.
 */
export type NavProps = {
  onSearch?: (value: string, modo: ModoBusca) => void
  valorBusca?: string
  modoInicial?: ModoBusca
  logado?: boolean
}

/**
 * Barra de navegação global do BananaPrice (Nav).
 *
 * Fornece campo de pesquisa instantânea (com alternador de busca normal / IA),
 * contador de notificações não lidas e botões de atalho para perfil e lista de desejos.
 *
 * @param props Propriedades de controle e callbacks de busca.
 * @returns Cabeçalho global do site.
 */
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

  const [historico, setHistorico] = useState<string[]>([])
  const [menuAberto, setMenuAberto] = useState(false)
  const containerBuscaRef = useRef<HTMLDivElement>(null)

  // Carrega buscas recentes do localStorage
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_HISTORICO_BUSCA)
      if (salvo) {
        const parsed = JSON.parse(salvo)
        if (Array.isArray(parsed)) {
          setHistorico(parsed.filter((item) => typeof item === 'string' && item.trim().length > 0))
        }
      }
    } catch {
      // Ignora erro em ambientes restritos
    }
  }, [])

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    function cliqueFora(e: MouseEvent) {
      if (containerBuscaRef.current && !containerBuscaRef.current.contains(e.target as Node)) {
        setMenuAberto(false)
      }
    }
    document.addEventListener('mousedown', cliqueFora)
    return () => document.removeEventListener('mousedown', cliqueFora)
  }, [])

  const salvarNoHistorico = (termo: string) => {
    const t = termo.trim()
    if (!t) return
    setHistorico((antigo) => {
      const filtrado = antigo.filter((item) => item.toLowerCase() !== t.toLowerCase())
      const novo = [t, ...filtrado].slice(0, MAX_HISTORICO)
      try {
        localStorage.setItem(CHAVE_HISTORICO_BUSCA, JSON.stringify(novo))
      } catch {}
      return novo
    })
  }

  const removerDoHistorico = (e: React.MouseEvent, termoParaRemover: string) => {
    e.stopPropagation()
    setHistorico((antigo) => {
      const novo = antigo.filter((item) => item !== termoParaRemover)
      try {
        localStorage.setItem(CHAVE_HISTORICO_BUSCA, JSON.stringify(novo))
      } catch {}
      return novo
    })
  }

  const limparTodoHistorico = (e: React.MouseEvent) => {
    e.stopPropagation()
    setHistorico([])
    try {
      localStorage.removeItem(CHAVE_HISTORICO_BUSCA)
    } catch {}
  }

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
    salvarNoHistorico(termo)
    setMenuAberto(false)

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

  const selecionarDoHistorico = (item: string) => {
    setTexto(item)
    dispararBusca(item, modo)
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
          <div ref={containerBuscaRef} className="relative flex-1">
            <input
              type="search"
              name="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder={
                modo === 'nativa'
                  ? 'Busca rápida de jogos (ex: Resident Evil)...'
                  : 'Busca profunda por franquias com IA...'
              }
              aria-label="Buscar jogos"
              maxLength={100}
              value={texto}
              onFocus={() => {
                if (historico.length > 0) setMenuAberto(true)
              }}
              onChange={(e) => {
                setTexto(e.target.value)
                if (historico.length > 0 && !menuAberto) setMenuAberto(true)
              }}
              className="h-[46px] w-full rounded-[13px] border border-bp-muted/30 bg-bp-nav pl-[18px] pr-[52px] text-xs text-bp-text outline-none placeholder:text-bp-muted/45 focus:border-bp-primary transition-colors"
            />
            <button
              type="submit"
              aria-label="Pesquisar"
              title="Pesquisar"
              className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-[#817667]/90 transition-colors hover:text-bp-primary"
            >
              <SearchIcon />
            </button>

            {/* Menu Pop-over de Histórico Customizado */}
            {menuAberto && historico.length > 0 && (
              <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-[13px] border border-[#3d322e] bg-bp-surface shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-[#3d322e]/60 px-3.5 py-2 text-[11px] text-bp-muted/70">
                  <span className="flex items-center gap-1.5 font-head font-bold uppercase tracking-wider text-bp-primary/90">
                    <History className="size-3" /> Buscas Recentes
                  </span>
                  <button
                    type="button"
                    onClick={limparTodoHistorico}
                    className="cursor-pointer text-[10px] text-bp-muted/50 hover:text-bp-primary transition-colors"
                  >
                    Limpar tudo
                  </button>
                </div>

                <ul className="flex flex-col py-1">
                  {historico.map((item) => (
                    <li
                      key={item}
                      onClick={() => selecionarDoHistorico(item)}
                      className="group flex cursor-pointer items-center justify-between px-3.5 py-2 text-xs text-bp-text hover:bg-bp-nav/80 hover:text-bp-primary transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate pr-2">
                        <History className="size-3.5 shrink-0 text-bp-muted/40 group-hover:text-bp-primary" />
                        <span className="truncate">{item}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => removerDoHistorico(e, item)}
                        title="Remover do histórico"
                        className="opacity-40 hover:opacity-100 hover:text-rose-400 p-1 transition-opacity"
                      >
                        <X className="size-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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