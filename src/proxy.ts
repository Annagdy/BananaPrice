import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
    // Token stale/inválido
  }

  const { pathname } = request.nextUrl

  if (user) {
    // Identifica se a autenticação foi feita via Steam
    const loginViaSteam =
      user.app_metadata?.provider === 'steam' ||
      user.app_metadata?.providers?.includes('steam')

    // Só exige completar cadastro se NÃO TIVER e-mail ou se for um login Steam com onboarding pendente
    const cadastroIncompleto =
      !user.email || (loginViaSteam && user.user_metadata?.cadastro_completo !== true)

    // Redireciona para /completar-cadastro apenas se o cadastro estiver realmente incompleto
    if (cadastroIncompleto && pathname !== '/completar-cadastro') {
      return NextResponse.redirect(new URL('/completar-cadastro', request.url))
    }

    // Se o cadastro estiver completo (e-mail/senha padrão ou Steam já concluído), impede de acessar as telas de auth
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
    // Rotas protegidas para visitantes não autenticados
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