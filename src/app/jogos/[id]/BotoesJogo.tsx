'use client'

import { useEffect, useRef, useState } from 'react'
import type { SVGProps } from 'react'
import Link from 'next/link'

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const SetaEsquerda = (p: SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" {...base} {...p}>
    <path d="M19 12H5M11 5l-7 7 7 7" />
  </svg>
)

const Coracao = ({ cheio, ...p }: SVGProps<SVGSVGElement> & { cheio: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" {...base} {...p} fill={cheio ? 'currentColor' : 'none'}>
    <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 000-7.8z" />
  </svg>
)

const Raio = (p: SVGProps<SVGSVGElement>) => (
  <svg width="22" height="26" viewBox="0 0 24 32" fill="currentColor" {...p}>
    <path d="M14 0L1 18h9l-3 14L23 12h-9z" />
  </svg>
)

const Pacote = (p: SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" {...base} {...p}>
    <path d="M21 8l-9-5-9 5 9 5 9-5z" />
    <path d="M3 8v8l9 5 9-5V8M12 13v8" />
  </svg>
)

const Fechar = (p: SVGProps<SVGSVGElement>) => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...base} {...p}>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

const classeBotao =
  'flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-bp-primary bg-bp-neutral text-bp-primary shadow-[0_6px_14px_rgba(0,0,0,.35)] transition hover:scale-105 hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bp-primary disabled:cursor-not-allowed disabled:opacity-60'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/* DLC do jogo, como vem da API (GET /api/v1/games/[id], campo "dlcs"). */
export type DlcJogo = {
  id: number
  titulo: string
  preco: number | null
  desconto: number
}

/* Botões de ação da página do jogo: voltar ao catálogo, lista de desejos, turbo e DLCs (só aparece se o jogo tem DLCs).
Em telas grandes ficam em coluna na lateral esquerda do painel; nas menores, em linha acima dele.

Lista de desejos (sem Steam):
- Ao abrir, consulta GET /api/v1/wishlist/[id] para saber se o jogo já está na lista (coração cheio ou vazio).
- O coração adiciona (POST /api/v1/wishlist) ou remove (DELETE /api/v1/wishlist/[id]) e avisa o resultado.
- Sem login (401), leva ao /login e volta para esta página já adicionando o jogo (?adicionar=1).

DLCs: o botão do pacote abre um pop-up (janela modal) com a lista de DLCs, com preço e desconto. Fecha com o X,
com Esc ou clicando fora. Com mais de 8 DLCs aparece um campo de busca. */
export default function BotoesJogo({ idJogo, dlcs = [] }: { idJogo: number; dlcs?: DlcJogo[] }) {
  const [naLista, setNaLista] = useState(false)
  const [pronto, setPronto] = useState(false) // já sabemos se o jogo está na lista?
  const [salvando, setSalvando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)

  // pop-up de DLCs
  const dialogo = useRef<HTMLDialogElement>(null)
  const [dlcsAbertas, setDlcsAbertas] = useState(false)
  const [filtro, setFiltro] = useState('')

  const temDlcs = dlcs.length > 0
  const dlcsFiltradas = filtro.trim()
    ? dlcs.filter((d) => d.titulo.toLowerCase().includes(filtro.trim().toLowerCase()))
    : dlcs

  const abrirDlcs = () => {
    setFiltro('')
    setDlcsAbertas(true)
    dialogo.current?.showModal()
  }

  const fecharDlcs = () => dialogo.current?.close()

  /* Trava a rolagem da página enquanto o pop-up está aberto. */
  useEffect(() => {
    document.body.style.overflow = dlcsAbertas ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [dlcsAbertas])

  /* Mostra uma mensagem curta por 3 segundos. */
  const avisar = (texto: string) => {
    setAviso(texto)
    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => setAviso(null), 3000)
  }

  useEffect(() => () => {
    if (temporizador.current) clearTimeout(temporizador.current)
  }, [])

  /* Descobre se o jogo já está na lista. Se a pessoa acabou de voltar do login pelo coração, adiciona. */
  useEffect(() => {
    let ativo = true
    const querAdicionar = new URLSearchParams(window.location.search).get('adicionar') === '1'

    async function iniciar() {
      try {
        const res = await fetch(`/api/v1/wishlist/${idJogo}`, { cache: 'no-store' })

        // sem sessão (401) o coração fica vazio; qualquer outra falha também
        if (res.ok) {
          const json = await res.json().catch(() => null)
          let estaNaLista = json?.naLista === true

          if (!estaNaLista && querAdicionar) {
            const add = await fetch('/api/v1/wishlist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idJogo }),
            })
            if (add.ok) {
              estaNaLista = true
              if (ativo) avisar('Jogo adicionado à lista de desejos.')
            }
          }

          if (ativo) setNaLista(estaNaLista)
        }
      } catch {
        // sem conexão: mantém o coração vazio
      } finally {
        if (ativo) setPronto(true)
        // limpa o ?adicionar=1 da barra de endereço para não repetir ao recarregar
        if (querAdicionar) window.history.replaceState(null, '', window.location.pathname)
      }
    }

    iniciar()
    return () => {
      ativo = false
    }
  }, [idJogo])

  const alternarLista = async () => {
    if (salvando || !pronto) return
    setSalvando(true)

    try {
      const res = naLista
        ? await fetch(`/api/v1/wishlist/${idJogo}`, { method: 'DELETE' })
        : await fetch('/api/v1/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idJogo }),
          })

      // sem login: vai entrar e volta para esta página já adicionando o jogo
      if (res.status === 401) {
        const volta = encodeURIComponent(`/jogos/${idJogo}?adicionar=1`)
        window.location.href = `/login?next=${volta}`
        return
      }

      if (!res.ok) {
        const json = await res.json().catch(() => null)
        avisar(json?.error ?? 'Não foi possível atualizar a lista de desejos.')
        return
      }

      setNaLista(!naLista)
      avisar(naLista ? 'Jogo removido da lista de desejos.' : 'Jogo adicionado à lista de desejos.')
    } catch {
      avisar('Falha de conexão. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  const rotuloLista = naLista ? 'Remover da lista de desejos' : 'Adicionar à lista de desejos'
  const rotuloDlcs = `Ver DLCs (${dlcs.length})`

  return (
    <>
      <nav
        aria-label="Ações do jogo"
        className="flex w-full max-w-[1200px] flex-row gap-3 2xl:absolute 2xl:right-full 2xl:top-0 2xl:mr-4 2xl:w-auto 2xl:flex-col"
      >
        <Link href="/jogos" title="Voltar ao catálogo" aria-label="Voltar ao catálogo" className={classeBotao}>
          <SetaEsquerda />
        </Link>

        <button
          type="button"
          onClick={alternarLista}
          disabled={salvando || !pronto}
          title={rotuloLista}
          aria-label={rotuloLista}
          aria-pressed={naLista}
          className={classeBotao}
        >
          <Coracao cheio={naLista} />
        </button>

        <Link href={`/turbo/${idJogo}`} title="Dar um turbo" aria-label="Dar um turbo" className={classeBotao}>
          <Raio />
        </Link>

        {temDlcs && (
          <button
            type="button"
            onClick={abrirDlcs}
            title={rotuloDlcs}
            aria-label={rotuloDlcs}
            aria-haspopup="dialog"
            className={`${classeBotao} relative`}
          >
            <Pacote />
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-bp-primary px-1 text-[11px] font-bold leading-none text-bp-neutral">
              {dlcs.length > 99 ? '99+' : dlcs.length}
            </span>
          </button>
        )}
      </nav>

      {/* Pop-up de DLCs (janela modal nativa: Esc fecha e o foco fica preso dentro dela) */}
      {temDlcs && (
        <dialog
          ref={dialogo}
          aria-labelledby="titulo-dlcs"
          onClose={() => setDlcsAbertas(false)}
          onClick={(e) => {
            // clique no fundo escuro (fora da janela) fecha
            if (e.target === e.currentTarget) fecharDlcs()
          }}
          className="fixed inset-0 m-auto h-fit max-h-[85vh] w-[min(92vw,560px)] overflow-hidden rounded-3xl border-2 border-[#3d322e] bg-bp-nav p-0 text-bp-muted shadow-[0_25px_50px_-12px_rgba(0,0,0,.6)] backdrop:bg-black/70"
        >
          <div className="flex max-h-[85vh] flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-bp-muted/20 px-5 py-4">
              <h2 id="titulo-dlcs" className="font-head text-2xl font-extrabold text-bp-primary">
                DLCs <span className="text-base text-bp-muted/70">({dlcs.length})</span>
              </h2>
              <button
                type="button"
                onClick={fecharDlcs}
                aria-label="Fechar"
                title="Fechar"
                className="grid size-9 cursor-pointer place-items-center rounded-full text-bp-muted transition hover:bg-bp-muted/10 hover:text-bp-primary"
              >
                <Fechar />
              </button>
            </div>

            {dlcs.length > 8 && (
              <div className="px-5 pt-4">
                <input
                  type="search"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Buscar DLC..."
                  aria-label="Buscar DLC"
                  className="h-10 w-full rounded-[10px] border border-[#3d322e] bg-bp-neutral px-4 text-sm text-white outline-none transition focus:border-bp-primary"
                />
              </div>
            )}

            <ul className="flex list-none flex-col gap-2.5 overflow-y-auto px-5 py-4">
              {dlcsFiltradas.length === 0 ? (
                <li className="py-6 text-center text-sm text-bp-muted/70">Nenhuma DLC encontrada.</li>
              ) : (
                dlcsFiltradas.map((dlc) => (
                  <li key={dlc.id}>
                    <Link
                      href={`/jogos/${dlc.id}`}
                      onClick={fecharDlcs}
                      className="flex items-center justify-between gap-3 rounded-[12px] border border-bp-muted/20 bg-bp-neutral px-3 py-2.5 transition hover:brightness-125"
                    >
                      <span className="min-w-0 truncate text-sm">{dlc.titulo}</span>
                      <span className="flex shrink-0 items-center gap-3 text-sm">
                        {dlc.desconto > 0 && <span>-{dlc.desconto}%</span>}
                        <strong className="font-head text-bp-primary">
                          {dlc.preco !== null ? brl(dlc.preco) : 'Sem preço'}
                        </strong>
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </dialog>
      )}

      {/* Mensagem de resultado (lida por leitores de tela) */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[9px] bg-bp-nav px-5 py-3 text-sm text-bp-muted shadow-[0_10px_25px_rgba(0,0,0,.4)] transition ${
          aviso ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        {aviso}
      </div>
    </>
  )
}