'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase.ts/client'

type AuthContextType = {
  logado: boolean
  idLista?: string
}

const AuthContext = createContext<AuthContextType>({ logado: false })

/**
 * Provedor de contexto de autenticação para gerenciar o estado do usuário logado na interface.
 *
 * @param props Contém os componentes filhos `children`.
 * @returns Elemento JSX Provider do AuthContext.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [logado, setLogado] = useState(false)
  const [idLista, setIdLista] = useState<string | undefined>(undefined)

  useEffect(() => {
    async function carregarSessao() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setLogado(true)
        // Substitua pelo nome correto da sua tabela que liga o utilizador à lista
        const { data: lista } = await supabase
          .from('sua_tabela_de_listas')
          .select('id_lista')
          .eq('user_id', user.id)
          .single()

        if (lista) setIdLista(lista.id_lista)
      }
    }
    carregarSessao()
  }, [])

  return (
    <AuthContext.Provider value={{ logado, idLista }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook customizado para acessar o contexto de autenticação global.
 * @returns Objeto contendo o estado `logado` e o `idLista`.
 */
export const useAuth = () => useContext(AuthContext)