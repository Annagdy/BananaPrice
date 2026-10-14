'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthShell from '../../components/AuthShell'
import AuthField from '../../components/AuthField'
import {
  AtIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowRight,
  GamepadIcon,
  RestoreIcon,
  UserPlusSmall,
  SteamIcon,
} from '../../components/Icons'

type Form = { nome: string; email: string; senha: string; confirma: string }
type Erros = Partial<Record<'senha' | 'confirma' | 'termos', string>>

function forca(s: string): number {
  let n = 0
  if (s.length >= 8) n++
  if (/[A-Z]/.test(s) && /[a-z]/.test(s)) n++
  if (/\d/.test(s) && /[^A-Za-z0-9]/.test(s)) n++
  return s ? Math.max(n, 1) : 0
}
const rotulos = ['', 'Fraca', 'Média', 'Forte']

const checkInput =
  'mt-[3px] size-[13px] shrink-0 cursor-pointer appearance-none rounded-[2.5px] border border-[#767676] bg-white checked:border-bp-primary checked:bg-bp-primary'

export default function CadastroPage() {
  const router = useRouter()
  const [f, setF] = useState<Form>({ nome: '', email: '', senha: '', confirma: '' })
  const [ver, setVer] = useState(false)
  const [termos, setTermos] = useState(false)
  const [alertas, setAlertas] = useState(true)
  const [erro, setErro] = useState<Erros>({})

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value })
  const nivel = forca(f.senha)

  const enviar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const er: Erros = {}
    if (f.senha.length < 8) er.senha = 'A senha precisa ter no mínimo 8 caracteres'
    if (f.confirma !== f.senha) er.confirma = 'As senhas não coincidem'
    if (!termos) er.termos = 'Aceite os Termos de Uso e a Política de Privacidade'
    setErro(er)
    if (Object.keys(er).length) return
    // TODO: integrar com o cadastro (Supabase).
    // Por enquanto é só para navegar: cadastro válido leva às notificações.
    router.push('/notificacoes')
  }

  return (
    <AuthShell>
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="mb-1 grid size-10 place-items-center rounded-full bg-bp-input text-bp-primary">
          <UserPlusSmall />
        </span>
        <h1 className="font-head text-2xl font-bold leading-8 tracking-[-.6px] text-bp-text">Criar sua conta</h1>
        <p className="text-sm leading-5 text-bp-muted">Monitore promoções e nunca mais pague caro em games</p>
      </div>

      <a
        href="#"
        className="flex items-center justify-center gap-2 rounded-full bg-bp-steam px-4 py-2 text-sm tracking-[.28px] text-bp-text hover:brightness-110"
      >
        <SteamIcon /> Cadastrar com a Steam
      </a>

      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[.55px] text-bp-muted/70 before:h-px before:flex-1 before:bg-bp-nav before:content-[''] after:h-px after:flex-1 after:bg-bp-nav after:content-['']">
        ou cadastre com e-mail
      </div>

      <form className="flex flex-col gap-4" onSubmit={enviar} noValidate>
        <AuthField
          id="nome"
          label="Nome completo ou Nick gamer"
          icon={<GamepadIcon />}
          placeholder="Ex: BananinhaGamer"
          value={f.nome}
          onChange={set('nome')}
          required
        />

        <AuthField
          id="email"
          label="E-mail para alertas"
          icon={<AtIcon />}
          type="email"
          placeholder="seuemail@exemplo.com"
          value={f.email}
          onChange={set('email')}
          required
        />

        <AuthField
          id="senha"
          label="Senha segura"
          icon={<LockIcon />}
          type={ver ? 'text' : 'password'}
          placeholder="Mínimo 8 caracteres"
          value={f.senha}
          onChange={set('senha')}
          error={erro.senha}
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
          below={
            <div className="flex items-center gap-1 px-2 pt-1">
              <div className="flex h-1 flex-1 gap-1 overflow-hidden rounded-full bg-bp-nav">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`flex-1 rounded-full ${i <= nivel ? 'bg-bp-primary' : 'bg-[#3d322e]'}`}
                  />
                ))}
              </div>
              <small className="min-w-9 text-right text-[11px] tracking-[.44px] text-bp-muted/70">
                {rotulos[nivel]}
              </small>
            </div>
          }
        />

        <AuthField
          id="confirma"
          label="Confirmar senha"
          icon={<RestoreIcon />}
          type={ver ? 'text' : 'password'}
          placeholder="Repita a senha"
          value={f.confirma}
          onChange={set('confirma')}
          error={erro.confirma}
        />

        <div className="flex flex-col gap-2 pt-1">
          <label className="flex cursor-pointer items-start gap-2 text-sm leading-[17.5px] text-bp-muted">
            <input
              type="checkbox"
              checked={termos}
              onChange={(e) => setTermos(e.target.checked)}
              className={checkInput}
            />
            <span>
              Li e concordo com os <a href="#" className="text-bp-text underline">Termos de Uso</a> e{' '}
              <a href="#" className="text-bp-text underline">Políticas de Privacidade</a>
            </span>
          </label>
          {erro.termos && <span className="pl-3 text-[11px] text-[#ff8a8e]">{erro.termos}</span>}
          <label className="flex cursor-pointer items-start gap-2 text-sm leading-[17.5px] text-bp-muted">
            <input
              type="checkbox"
              checked={alertas}
              onChange={(e) => setAlertas(e.target.checked)}
              className={checkInput}
            />
            <span>Desejo receber alertas de ofertas e bugs de preço selecionados</span>
          </label>
        </div>

        <button
          type="submit"
          className="mt-1 flex w-full cursor-pointer items-center justify-center gap-1 rounded-full bg-bp-primary px-4 py-2 font-head text-base leading-6 text-bp-on-primary shadow-md hover:brightness-105"
        >
          Criar Conta BananaPrice <ArrowRight />
        </button>
      </form>

      <p className="pt-1 text-center text-sm text-bp-muted">
        Já tem uma conta?
        <Link href="/login" className="ml-1 text-xs tracking-[.36px] text-bp-text hover:underline">
          Fazer login
        </Link>
      </p>
    </AuthShell>
  )
}
