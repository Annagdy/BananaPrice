'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthShell from '../../components/AuthShell'
import AuthField from '../../components/AuthField'
import { AtIcon, LockIcon, EyeIcon, EyeOffIcon, ArrowRight, VisitorIcon, SteamIcon } from '../../components/Icons'

/* Só aceita caminhos internos (evita open redirect) */
function destinoSeguro(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/conta'
}

export default function LoginPage() {
  const router = useRouter()
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [ver, setVer] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  const entrar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErro(null)
    setCarregando(true)
    // router.push('/notificacoes')

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, senha }),
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        setErro(json?.error ?? 'Não foi possível entrar. Tente novamente.')
        return
      }

      // lê o ?next= direto da URL, assim não precisa de useSearchParams/Suspense
      const next = new URLSearchParams(window.location.search).get('next')
      router.push(destinoSeguro(next))
      router.refresh() // atualiza Server Components com a nova sessão
    } catch {
      setErro('Falha de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <AuthShell>
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-head text-2xl font-bold leading-8 tracking-[-.6px] text-bp-text">Bem-vindo</h1>
        <p className="text-sm leading-5 text-bp-muted">Acesse seus alertas de preços e wishlist</p>
      </div>

      <a
        href="/api/v1/auth/steam"
        className="flex items-center justify-center gap-2 rounded-full bg-bp-steam px-4 py-2 text-sm tracking-[.28px] text-bp-text hover:brightness-110"
      >
        <SteamIcon /> Continuar com Steam
      </a>

      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[.55px] text-bp-muted/70 before:h-px before:flex-1 before:bg-bp-nav before:content-[''] after:h-px after:flex-1 after:bg-bp-nav after:content-['']">
        ou com e-mail
      </div>

      <form className="flex flex-col gap-4" onSubmit={entrar}>
        <AuthField
          id="login"
          label="E-mail ou usuário"
          icon={<AtIcon />}
          type="text"
          placeholder="banana@gamer.com"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          autoComplete="username"
          required
        />

        <AuthField
          id="senha"
          label="Senha"
          labelRight={
            <a href="#" className="text-[11px] tracking-[.44px] text-bp-primary">
              Esqueceu a senha?
            </a>
          }
          icon={<LockIcon />}
          type={ver ? 'text' : 'password'}
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password"
          required
          inputRight={
            <button
              type="button"
              onClick={() => setVer(!ver)}
              aria-label="Alternar visibilidade da senha"
              className="absolute right-4 top-1/2 grid -translate-y-1/2 cursor-pointer text-bp-muted/60"
            >
              {ver ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          }
        />

        <button
          type="submit"
          disabled={carregando}
          className="mt-1 flex w-full cursor-pointer items-center justify-center gap-1 rounded-full bg-bp-primary px-4 py-2 font-head text-base leading-6 text-bp-on-primary shadow-md hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {carregando ? 'Entrando...' : <>Entrar na Conta <ArrowRight /></>}
        </button>
        <Link
          href="/"
          className="flex items-center justify-center gap-1 px-4 py-2 text-xs tracking-[.36px] text-bp-muted"
        >
          <VisitorIcon /> Continuar como visitante
        </Link>
      </form>

      <p className="pt-1 text-center text-sm text-bp-muted">
        Não tem uma conta?
        <Link href="/cadastro" className="ml-1 text-xs tracking-[.36px] text-bp-text hover:underline">
          Cadastre-se gratuitamente
        </Link>
      </p>
    </AuthShell>
  )
}
