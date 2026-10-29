'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Nav from '../../components/Nav'
import Footer from '../../components/Footer'
import { BellIcon } from '../../components/Icons'
import { capaExemplo, macacotudo, macacoFeliz } from '../../components/assets'
import { createClient } from '@/lib/supabase.ts/client.ts'

type Notificacao = {
  id: number
  idJogo: number
  titulo: string
  descricao: string
  capa: string | null
  preco: number | null
  desconto: number | null
  loja: string | null
  lida: boolean
  criadoEm: string
  url: string
}

function formatarTempoRelativo(dataIso: string): string {
  try {
    const agora = Date.now()
    const passado = new Date(dataIso).getTime()
    const diffSegundos = Math.max(0, Math.floor((agora - passado) / 1000))

    if (diffSegundos < 60) return 'agora mesmo'
    const diffMinutos = Math.floor(diffSegundos / 60)
    if (diffMinutos < 60) return `há ${diffMinutos} min`
    const diffHoras = Math.floor(diffMinutos / 60)
    if (diffHoras < 24) return `há ${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'}`
    const diffDias = Math.floor(diffHoras / 24)
    if (diffDias === 1) return 'ontem'
    if (diffDias < 7) return `há ${diffDias} dias`

    return new Date(dataIso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export default function NotificacoesPage() {
  const [itens, setItens] = useState<Notificacao[]>([])
  const [carregando, setCarregando] = useState<boolean>(true)
  const [erro, setErro] = useState<string | null>(null)
  const [aba, setAba] = useState<'todas' | 'naoLidas'>('todas')

  const notificarNav = () => {
    window.dispatchEvent(new Event('notificacoes-atualizadas'))
  }

  const carregarNotificacoes = useCallback((mostrarCarregando = false) => {
    if (mostrarCarregando) setCarregando(true)
    fetch('/api/v1/notifications', { cache: 'no-store' })
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = '/login?next=/notificacoes'
          return
        }
        const json = await res.json().catch(() => null)
        if (!res.ok) throw new Error(json?.error ?? 'Erro ao carregar notificações.')
        setItens(json.notificacoes ?? [])
        setErro(null)
      })
      .catch((e: Error) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [])

  useEffect(() => {
    carregarNotificacoes(true)

    // Escuta alterações em tempo real no Supabase
    try {
      const supabase = createClient()
      const canal = supabase
        .channel('realtime-notificacoes-page')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notificacao' },
          () => {
            carregarNotificacoes(false)
            notificarNav()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(canal)
      }
    } catch {
      // caso o realtime falhe
    }
  }, [carregarNotificacoes])

  const marcarComoLida = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()

    setItens((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)))
    notificarNav()

    await fetch('/api/v1/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idNotificacao: id }),
    }).catch(() => {})
  }

  const marcarTodasComoLidas = async () => {
    setItens((prev) => prev.map((n) => ({ ...n, lida: true })))
    notificarNav()

    await fetch('/api/v1/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ todas: true }),
    }).catch(() => {})
  }

  const excluirNotificacao = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()

    setItens((prev) => prev.filter((n) => n.id !== id))
    notificarNav()

    await fetch(`/api/v1/notifications?id=${id}`, {
      method: 'DELETE',
    }).catch(() => {})
  }

  const limparTodas = async () => {
    if (!confirm('Deseja realmente limpar todas as notificações?')) return

    setItens([])
    notificarNav()

    await fetch('/api/v1/notifications?todas=true', {
      method: 'DELETE',
    }).catch(() => {})
  }

  const naoLidasCount = itens.filter((n) => !n.lida).length
  const listaVisivel = aba === 'naoLidas' ? itens.filter((n) => !n.lida) : itens

  return (
    <div className="flex min-h-screen flex-col bg-bp-bg">
      <Nav logado />

      <main className="relative flex-1 overflow-hidden pb-16">
        {/* Cabeçalho */}
        <section className="flex flex-wrap items-center justify-between gap-4 px-[45px] pt-4 max-[640px]:px-4">
          <h1 className="flex items-center gap-[9px] font-head text-[32px] font-extrabold text-bp-primary max-[640px]:text-2xl">
            <BellIcon width={48} height={48} strokeWidth={1.6} />
            Notificações
          </h1>

          {/* Ações em lote e atualizar */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => carregarNotificacoes(true)}
              className="cursor-pointer rounded-lg bg-bp-nav px-3 py-1.5 text-xs text-bp-muted transition hover:text-bp-primary hover:bg-[#4d4039]"
              title="Atualizar lista"
            >
              🔄 Atualizar
            </button>
            {itens.length > 0 && (
              <>
                {naoLidasCount > 0 && (
                  <button
                    type="button"
                    onClick={marcarTodasComoLidas}
                    className="cursor-pointer rounded-lg bg-bp-nav px-3 py-1.5 text-xs font-semibold text-bp-primary transition hover:bg-[#4d4039]"
                  >
                    Marcar todas como lidas
                  </button>
                )}
                <button
                  type="button"
                  onClick={limparTodas}
                  className="cursor-pointer rounded-lg bg-bp-nav px-3 py-1.5 text-xs text-bp-muted transition hover:text-red-400"
                >
                  Limpar todas
                </button>
              </>
            )}
          </div>
        </section>

        <div className="mx-2.5 my-3 h-[5px] rounded-[2px] bg-[#3d3b2e]" />

        {/* Abas de filtro */}
        <div className="flex items-center gap-4 px-[55px] pt-2 max-[640px]:px-4">
          <button
            type="button"
            onClick={() => setAba('todas')}
            className={`cursor-pointer pb-2 text-sm font-bold transition border-b-2 ${
              aba === 'todas'
                ? 'border-bp-primary text-bp-primary'
                : 'border-transparent text-bp-muted hover:text-bp-text'
            }`}
          >
            Todas ({itens.length})
          </button>
          <button
            type="button"
            onClick={() => setAba('naoLidas')}
            className={`cursor-pointer pb-2 text-sm font-bold transition border-b-2 ${
              aba === 'naoLidas'
                ? 'border-bp-primary text-bp-primary'
                : 'border-transparent text-bp-muted hover:text-bp-text'
            }`}
          >
            Não lidas ({naoLidasCount})
          </button>
        </div>

        {/* Conteúdo principal */}
        <div className="relative z-[1] max-w-[898px] px-[55px] pt-6 max-[640px]:px-4">
          {carregando ? (
            <div className="flex flex-col gap-4 py-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 w-full animate-pulse rounded-3xl bg-[#3d322e]/60"
                />
              ))}
            </div>
          ) : erro ? (
            <div role="alert" className="rounded-xl bg-bp-nav p-4 text-red-400">
              {erro}
            </div>
          ) : listaVisivel.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-bp-nav/50 p-12 text-center">
              <Image
                src={macacoFeliz}
                alt=""
                width={120}
                height={120}
                className="opacity-80"
              />
              <h2 className="font-head text-2xl font-bold text-bp-primary">
                {aba === 'naoLidas'
                  ? 'Você já leu todas as notificações!'
                  : 'Nenhuma notificação por enquanto.'}
              </h2>
              <p className="max-w-md text-sm text-bp-muted">
                Adicione jogos à sua{' '}
                <Link href="/lista-de-desejos" className="text-bp-primary underline">
                  Lista de Desejos
                </Link>{' '}
                para ser avisado sempre que o preço baixar ou surgirem novas promoções!
              </p>
              <Link
                href="/jogos"
                className="mt-2 inline-flex items-center rounded-xl bg-bp-primary px-5 py-2.5 text-sm font-bold text-bp-neutral transition hover:brightness-110"
              >
                Explorar Catálogo
              </Link>
            </div>
          ) : (
            <ul className="flex list-none flex-col gap-5">
              {listaVisivel.map((n) => (
                <li
                  key={n.id}
                  onClick={() => !n.lida && marcarComoLida(n.id)}
                  className={`group relative flex items-center justify-between gap-4 rounded-3xl bg-[#3d322e] p-3 shadow-[0_25px_50px_-12px_rgba(0,0,0,.25)] transition hover:bg-[#463a35] ${
                    !n.lida ? 'border-l-4 border-bp-primary' : 'opacity-90'
                  }`}
                >
                  <Link
                    href={n.url}
                    className="flex flex-1 items-center gap-4 overflow-hidden"
                  >
                    <Image
                      src={n.capa ?? capaExemplo}
                      alt=""
                      width={79}
                      height={79}
                      className="size-[79px] shrink-0 rounded-[13px] object-cover"
                    />
                    <div className="flex flex-col gap-1 overflow-hidden pr-2">
                      <div className="flex items-center gap-2">
                        <h2 className="font-head text-xl font-extrabold text-bp-primary truncate max-[640px]:text-base">
                          {n.titulo}
                        </h2>
                        {!n.lida && (
                          <span className="shrink-0 rounded-full bg-bp-primary px-2 py-0.5 text-[10px] font-extrabold text-bp-neutral">
                            NOVA
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-bp-text leading-snug line-clamp-2 max-[640px]:text-xs">
                        {n.descricao}
                      </p>
                      <span className="text-[11px] text-bp-muted/80">
                        {formatarTempoRelativo(n.criadoEm)}
                      </span>
                    </div>
                  </Link>

                  {/* Botões de ação rápida */}
                  <div className="flex shrink-0 items-center gap-2 pr-2">
                    {!n.lida && (
                      <button
                        type="button"
                        onClick={(e) => marcarComoLida(n.id, e)}
                        title="Marcar como lida"
                        className="cursor-pointer rounded-lg p-2 text-bp-muted hover:bg-bp-nav hover:text-bp-primary"
                        aria-label="Marcar como lida"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => excluirNotificacao(n.id, e)}
                      title="Excluir notificação"
                      className="cursor-pointer rounded-lg p-2 text-bp-muted hover:bg-bp-nav hover:text-red-400"
                      aria-label="Excluir notificação"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Mascote no rodapé lateral */}
        <Image
          src={macacotudo}
          alt=""
          width={574}
          height={383}
          className="pointer-events-none absolute bottom-0 right-0 h-auto w-[574px] max-w-[40vw] opacity-70 max-[1100px]:hidden"
        />
      </main>

      <div className="h-[5px] bg-[#3d322e]" />
      <Footer />
    </div>
  )
}
