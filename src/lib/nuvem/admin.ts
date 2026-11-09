// Somente servidor. Senha de administrador do portal (variável PRG_ADMIN_SENHA na Vercel).
import { createHash, timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { ErroApi } from './servidor'

const tentativas = new Map<string, { n: number; ate: number }>()
const JANELA = 15 * 60_000, MAX_ERROS = 8

const hash = (s: string) => createHash('sha256').update(s, 'utf8').digest()
/** Compara em tempo constante (não vaza o tamanho nem o conteúdo da senha). */
export function senhaConfere(digitada: unknown, correta: string | undefined): boolean {
  if (!correta || typeof digitada !== 'string' || !digitada || digitada.length > 200) return false
  return timingSafeEqual(hash(digitada), hash(correta))
}

/** Exige a senha de administrador; limita tentativas erradas por IP (melhor esforço). */
export async function exigirAdmin(req: NextRequest, digitada: unknown) {
  const correta = process.env.PRG_ADMIN_SENHA
  if (!correta) throw new ErroApi(503, 'A senha de administrador ainda não foi configurada na Vercel (PRG_ADMIN_SENHA).')
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'local'
  const agora = Date.now(), t = tentativas.get(ip)
  if (t && t.ate > agora && t.n >= MAX_ERROS) throw new ErroApi(429, 'Muitas tentativas erradas. Espere 15 minutos.')
  if (!senhaConfere(digitada, correta)) {
    const novo = t && t.ate > agora ? { n: t.n + 1, ate: t.ate } : { n: 1, ate: agora + JANELA }
    tentativas.set(ip, novo)
    await new Promise(r => setTimeout(r, 700))
    throw new ErroApi(401, 'Senha incorreta.')
  }
  tentativas.delete(ip)
}
