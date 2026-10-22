'use client'

import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent, SVGProps } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Nav from '../../components/Nav'
import Footer from '../../components/Footer'
import { BellIcon, SteamIcon } from '../../components/Icons'
import { macacobanana } from '../../components/assets'
import { createClient } from '@/lib/supabase.ts/client.ts'


const Divider = () => <div className="my-2 h-[5px] rounded-[2px] bg-[#3d3b2e]" />

/* Página /conta: mostra os dados da sessão atual e permite alterá-los (PATCH /api/v1/conta).
Também conecta a conta à Steam (/api/v1/auth/steam), encerra a sessão e mostra avisos vindos
da URL (?erro=steam_em_uso, ?email=confirmado). */
export default function ContaPage() {
  const router = useRouter()
  const [salvo, setSalvo] = useState({ nome: '', email: '' })
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [aviso, setAviso] = useState<string | null>(null)
  const [notificarEmail, setNotificarEmail] = useState<boolean>(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/login')
        return
      }
      const dados = {
        // o trigger grava nome_usuario no user_metadata, então não precisa consultar a tabela (nem de RLS)
        nome: user.user_metadata?.nome_usuario ?? '',
        email: user.email ?? '',
      }
      setSalvo(dados)
      setNome(dados.nome)
      setEmail(dados.email)
      setCarregando(false)
    })

    // o callback da Steam redireciona para /conta?erro=steam_em_uso
    if (new URLSearchParams(window.location.search).get('erro') === 'steam_em_uso') {
      setAviso('Essa conta Steam já está vinculada a outro usuário.')
    }
  }, [router])

  {aviso && (
    <p role="alert" className="rounded-xl bg-bp-nav px-4 py-3 text-bp-muted">
      {aviso}
    </p>
  )}

  const confirmar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAviso(null)

    const res = await fetch('/api/v1/conta', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nomeUsuario: nome, email }),
    })
    const json = await res.json().catch(() => null)

    if (!res.ok) {
      setAviso(json?.error ?? 'Não foi possível salvar.')
      return
    }
    setSalvo({ nome, email })
    setAviso(json?.aviso ?? 'Dados salvos!')
  }
  // const confirmar = (e: FormEvent<HTMLFormElement>) => {
  //   e.preventDefault()
  //   // TODO: salvar na API (Supabase).
  //   setSalvo({ nome, email })
  // }
  
  const cancelar = () => {
    setNome(salvo.nome)
    setEmail(salvo.email)
  }

  // const cancelar = () => {
  //   setNome(salvo.nome)
  //   setEmail(salvo.email)
  // }

  const sair = async () => {
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // const sair = () => {
  //   // TODO: encerrar a sessão de verdade.
  //   router.push('/login')
  // }

  return (
    <div className="flex min-h-screen flex-col bg-bp-bg">
      <Nav logado />

      <main className="flex flex-1 flex-col gap-6 px-6 py-6 max-[640px]:px-4">
        {/* Boas-vindas */}
        <section className="relative flex min-h-[199px] items-center overflow-hidden rounded-3xl bg-[linear-gradient(90deg,rgba(50,40,36,.9)_0%,rgba(39,29,26,.7)_50%,rgba(35,25,22,.8)_100%)] px-[70px] py-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,.25)] max-[640px]:px-6">
          <div className="relative z-[1] flex max-w-[352px] flex-col gap-4">
            <h1 className="font-head text-4xl font-extrabold text-bp-primary max-[640px]:text-2xl">
              Olá, {salvo.nome}!
            </h1>
            <p className="text-2xl leading-7 text-bp-muted max-[640px]:text-base">
              Gerencie seu perfil, preferências e contas conectadas.
            </p>
          </div>
          <Image
            src={macacobanana}
            alt=""
            width={215}
            height={215}
            className="pointer-events-none absolute right-16 top-1/2 h-[215px] w-[215px] -translate-y-1/2 max-[900px]:hidden"
          />
        </section>

        <div className="grid grid-cols-2 items-start gap-6 max-[1000px]:grid-cols-1">
          {/* Dados da conta */}
          <form
            onSubmit={confirmar}
            className="flex flex-col gap-4 rounded-3xl border-2 border-[#3d322e] bg-bp-nav p-4"
          >
            <h2 className="flex items-center gap-2.5 p-2.5 font-head text-4xl font-extrabold text-bp-primary max-[640px]:text-2xl">
              <UserIcon className="h-12 w-[42px] shrink-0 max-[640px]:h-8 max-[640px]:w-7" />
              Dados da Conta
            </h2>

            <Divider />

            <div className="flex flex-col gap-4 p-2.5">
              <Campo
                id="nome"
                label="Nome de Usuário"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoComplete="username"
              />
              <Campo
                id="email"
                label="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <Divider />

            <div className="flex items-center gap-4 rounded-[13px] border border-[#3d322e] bg-bp-neutral p-2.5 max-[640px]:flex-wrap">
              <div className="grid shrink-0 place-items-center text-bp-primary [&>svg]:size-12">
                <SteamIcon />
              </div>
              <div className="flex flex-1 flex-col p-2.5">
                <span className="text-2xl font-bold leading-7 text-bp-muted max-[640px]:text-lg">Steam</span>
                <span className="text-2xl leading-7 text-bp-muted max-[640px]:text-base">
                  Sincronização de conta e lista de desejos
                </span>
              </div>
              <button
                type="button"
                onClick={() => { window.location.href = '/api/v1/auth/steam' }}
                className="..."
              >
                Conectar
              </button>
            </div>

            <div className="flex justify-end gap-2.5 px-2.5 pb-2.5">
              <button
                type="button"
                onClick={cancelar}
                className="cursor-pointer rounded-[9px] bg-bp-primary px-4 py-[5px] text-[15px] text-bp-neutral transition hover:brightness-110"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="cursor-pointer rounded-[9px] bg-[#4a682d] px-4 py-[5px] text-[15px] text-bp-muted transition hover:brightness-110"
              >
                Confirmar
              </button>
            </div>
          </form>

          {/* Notificações + sair */}
          <div className="flex flex-col gap-6">
            <section className="flex flex-col gap-2.5 rounded-3xl border-2 border-[#3d322e] bg-bp-nav p-3">
              <h2 className="flex items-center gap-2.5 p-2.5 font-head text-4xl font-extrabold text-bp-primary max-[640px]:text-2xl">
                <BellIcon width={58} height={58} strokeWidth={1.6} />
                Notificações
              </h2>

              <Divider />

              <label
                htmlFor="notificar-email"
                className="flex cursor-pointer items-center justify-between gap-6 rounded-[13px] border border-[#3d322e] bg-bp-neutral p-2.5"
              >
                <span className="p-2.5 text-2xl leading-7 text-bp-muted max-[640px]:text-base">
                  Notificar E-mail
                </span>
                <input
                  id="notificar-email"
                  type="checkbox"
                  checked={notificarEmail}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNotificarEmail(e.target.checked)}
                  className="peer sr-only"
                />
                <span className="mr-2.5 grid size-9 shrink-0 place-items-center rounded-[9px] border-2 border-bp-primary text-bp-neutral transition peer-checked:bg-bp-primary peer-focus-visible:ring-2 peer-focus-visible:ring-bp-text [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100">
                  <CheckIcon className="size-[26px]" />
                </span>
              </label>
            </section>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={sair}
                className="inline-flex cursor-pointer items-center gap-2 rounded-[9px] bg-bp-primary px-4 py-4 text-[15px] text-bp-neutral transition hover:brightness-110"
              >
                <LogoutIcon className="size-[29px]" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </main>

      <div className="h-[5px] bg-[#3d322e]" />
      <Footer />
    </div>
  )
}

type CampoProps = {
  id: string
  label: string
  type: 'text' | 'email'
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  autoComplete?: string
}

/* Campo de formulário com rótulo.

@param id Id e name do input.
@param label Texto do rótulo.
@param type "text" ou "email".
@param value Valor atual.
@param onChange Chamado a cada alteração.
@param autoComplete Dica de preenchimento automático (opcional). */
function Campo({ id, label, type, value, onChange, autoComplete }: CampoProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <label htmlFor={id} className="text-2xl font-bold leading-7 text-bp-muted max-[640px]:text-lg">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className="h-[47px] w-full rounded-[13px] border border-[#3d322e] bg-bp-neutral px-5 text-base text-white outline-none transition focus:border-bp-primary"
      />
    </div>
  )
}

/* Ícones locais desta tela (os demais vêm de components/Icons) */
type IconProps = SVGProps<SVGSVGElement>

function UserIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 42 48" fill="currentColor" className="text-bp-primary" aria-hidden="true" {...props}>
      <circle cx="21" cy="12" r="11" />
      <path d="M0 48v-5c0-9 9-14 21-14s21 5 21 14v5z" />
    </svg>
  )
}

function CheckIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  )
}

function LogoutIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" />
      <path d="M10 12h10" />
      <path d="M16 8l4 4-4 4" />
    </svg>
  )
}
