import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  // Portal, Central do Aventureiro e Ficha V8 local não dependem de autenticação legada.
  // Campanhas e dados privados continuam protegidos pela autenticação anterior.
  // API da nuvem (perfis/campanhas/fichas) faz suas próprias verificações no servidor.
  if (pathname === '/api/aventureiros' || pathname.startsWith('/api/prg/') || pathname.startsWith('/convite/') || pathname === '/ficha') {
    return NextResponse.next({ request })
  }
  if (pathname === '/' || pathname === '/portal' ||
      pathname === '/login' || pathname === '/register' || pathname === '/central' || pathname === '/ficha-v8' || pathname === '/ficha-v8.html') {
    if (pathname === '/' || pathname === '/login' || pathname === '/register') {
      return NextResponse.redirect(new URL('/portal', request.url))
    }
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/portal', request.url))
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|wasm|json)$).*)'],
}
