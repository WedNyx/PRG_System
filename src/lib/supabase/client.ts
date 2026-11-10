import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente do navegador usado só para o canal ao vivo da mesa (Realtime broadcast).
 * Nenhum dado é lido por aqui: as tabelas ficam fechadas e passam pelas rotas do servidor.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
