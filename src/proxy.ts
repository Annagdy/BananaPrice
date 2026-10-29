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
    // Token inválido/inexistente
  }

  const pathname = request.nextUrl.pathname

  // 1. Se NÃO está autenticado e tenta aceder a /completar-cadastro, manda para o login
  if (!user && pathname === '/completar-cadastro') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const loginViaSteam =
      user.app_metadata?.provider === 'steam' ||
      user.app_metadata?.providers?.includes('steam') ||
      user.email?.endsWith('@steam.local')

    const cadastroIncompleto =
      !user.email ||
      user.email.endsWith('@steam.local') ||
      (loginViaSteam && user.user_metadata?.cadastro_completo !== true)

    // 2. Se o cadastro está incompleto e NÃO está na página /completar-cadastro, redireciona
    if (cadastroIncompleto && pathname !== '/completar-cadastro') {
      return NextResponse.redirect(new URL('/completar-cadastro', request.url))
    }

    // 3. Se o cadastro já ESTÁ completo, impede de aceder a /completar-cadastro, /login e /cadastro
    if (!cadastroIncompleto && (pathname === '/login' || pathname === '/cadastro' || pathname === '/completar-cadastro')) {
      return NextResponse.redirect(new URL('/conta', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Ignora ficheiros estáticos, imagens e rotas de API/Auth para evitar loops
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}