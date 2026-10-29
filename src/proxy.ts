import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/*
Roda antes de cada requisição: renova a sessão do Supabase, protege as rotas
e obriga usuários com login incompleto (ex: Steam) a cadastrar e-mail e senha.

- Sem login: páginas protegidas redirecionam para /login?next=<rota>.
- Com login incompleto: qualquer rota (exceto /completar-cadastro e APIs) redireciona para /completar-cadastro.
- Com login completo: /login, /cadastro e /completar-cadastro redirecionam para /conta (ou /jogos).

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

  let user = null

  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Token stale/inválido — ignora, o usuário vai se logar de novo
  }

  const { pathname } = request.nextUrl

  // Se o usuário está logado
  if (user) {
    // Verifica se o e-mail não existe ou se a flag cadastro_completo não está true nos metadados
    const cadastroIncompleto =
      !user.email || user.user_metadata?.cadastro_completo !== true

    // 1. Usuário logado via Steam que AINDA NÃO completou o cadastro:
    // Força o redirecionamento para /completar-cadastro
    if (cadastroIncompleto && pathname !== '/completar-cadastro') {
      return NextResponse.redirect(new URL('/completar-cadastro', request.url))
    }

    // 2. Usuário que JÁ completou o cadastro e tenta acessar telas de Onboarding/Auth:
    // Redireciona para /conta ou /jogos
    if (!cadastroIncompleto) {
      if (
        pathname === '/login' ||
        pathname === '/cadastro' ||
        pathname === '/completar-cadastro'
      ) {
        return NextResponse.redirect(new URL('/conta', request.url))
      }
    }
  } else {
    // Rotas que exigem autenticação obrigatória
    const rotasProtegidas = ['/conta', '/lista-de-desejos', '/notificacoes']

    if (rotasProtegidas.some((rota) => pathname.startsWith(rota))) {
      const urlLogin = new URL('/login', request.url)
      urlLogin.searchParams.set('next', pathname)
      return NextResponse.redirect(urlLogin)
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}