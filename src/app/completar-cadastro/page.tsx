'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase.ts/client'

export default function CompletarCadastroPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }

    setCarregando(true)
    const supabase = createClient()

    try {
      // 1. Atualiza e-mail, senha e marca cadastro_completo nos metadados do Auth
      const { data, error } = await supabase.auth.updateUser({
        email: email,
        password: senha,
        data: {
          cadastro_completo: true,
        },
      })

      if (error) throw error

      // 2. Atualiza apenas o e-mail na tabela pública (sem a coluna cadastro_completo)
      if (data?.user?.id) {
        await supabase
          .from('usuario')
          .update({ email: email })
          .eq('auth_id', data.user.id)
      }

      // 3. Exibe mensagem avisando sobre a confirmação de e-mail
      setSucesso(true)

    } catch (err: any) {
      setErro(err?.message || 'Ocorreu um erro ao atualizar os dados.')
    } finally {
      setCarregando(false)
    }
  }

  if (sucesso) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bp-bg p-4 text-bp-neutral">
        <div className="w-full max-w-md rounded-2xl bg-bp-neutral/80 p-6 shadow-xl border border-bp-muted/20 text-center">
          <h1 className="font-head text-2xl font-bold text-bp-primary">
            📧 Confirme seu e-mail!
          </h1>
          <p className="mt-4 text-sm text-bp-muted">
            Enviamos um link de confirmação para <strong>{email}</strong>.
          </p>
          <p className="mt-2 text-xs text-bp-muted/80">
            Acesse sua caixa de entrada e clique no link para concluir o vínculo e acessar sua conta.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bp-bg p-4 text-bp-neutral">
      <div className="w-full max-w-md rounded-2xl bg-bp-neutral/80 p-6 shadow-xl border border-bp-muted/20">
        <h1 className="font-head text-2xl font-bold text-bp-primary text-center">
          🍌 Bem-vindo ao BananaPrice!
        </h1>
        <p className="mt-2 text-center text-sm text-bp-muted">
          Cadastre um e-mail e uma senha para receber seus alertas de desconto.
        </p>

        {erro && (
          <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
            {erro}
          </div>
        )}

        <form onSubmit={handleSalvar} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-bp-muted mb-1">
              Seu E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              className="w-full rounded-lg border border-bp-muted/30 bg-bp-bg px-4 py-2.5 text-bp-primary focus:border-bp-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-bp-muted mb-1">
              Nova Senha
            </label>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-lg border border-bp-muted/30 bg-bp-bg px-4 py-2.5 text-bp-primary focus:border-bp-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-bp-muted mb-1">
              Confirmar Senha
            </label>
            <input
              type="password"
              required
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Repita a senha"
              className="w-full rounded-lg border border-bp-muted/30 bg-bp-bg px-4 py-2.5 text-bp-primary focus:border-bp-primary focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-lg bg-bp-primary py-3 text-base font-bold text-bp-neutral transition hover:brightness-110 disabled:opacity-50"
          >
            {carregando ? 'Salvando...' : 'Concluir Cadastro'}
          </button>
        </form>
      </div>
    </div>
  )
}