import { NextResponse, type NextRequest } from 'next/server'

/**
 * A plataforma não usa mais login por e-mail: o perfil escolhido no portal é a identidade,
 * e cada rota da API faz suas próprias verificações no servidor.
 * Aqui só mandamos endereços antigos (do login por e-mail) para o portal.
 */
const ANTIGOS = ['/', '/login', '/register', '/dashboard']

export function middleware(request: NextRequest) {
  const p = request.nextUrl.pathname
  if (ANTIGOS.includes(p) || p.startsWith('/campanha/') || p.startsWith('/mesa/')) {
    return NextResponse.redirect(new URL('/portal', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/login', '/register', '/dashboard', '/campanha/:path*', '/mesa/:path+'],
}
