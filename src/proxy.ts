import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/*
Roda antes de cada requisição: renova a sessão do Supabase e protege as rotas.

- Sem login, páginas protegidas (/conta, /lista-de-desejos, /notificacoes) redirecionam para
  /login?next=<rota>.
- Com login, /login e /cadastro redirecionam para /conta.

Usa getUser() (valida o token no servidor) em vez de getSession().

@param request Requisição recebida pelo Next.
@returns A resposta com os cookies de sessão atualizados, ou um redirecionamento.
*/
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    await supabase.auth.getUser()
  } catch {
    // Token stale/inválido — ignora, o usuário vai se logar de novo
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}   