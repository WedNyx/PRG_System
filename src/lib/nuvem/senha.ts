// Somente servidor. Senha opcional do perfil (sem e-mail): hash scrypt + aparelhos lembrados por cookie HttpOnly.
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import type { NextRequest, NextResponse } from 'next/server'

const scrypt = promisify(scryptCb) as (s: string, sal: Buffer, n: number, o: { N: number; r: number; p: number; maxmem: number }) => Promise<Buffer>
const N = 16384, R = 8, P = 1, TAM = 32
/** Quanto tempo o aparelho fica lembrado depois de digitar a senha. */
export const DIAS_LEMBRADO = 30
export const SENHA_MIN = 6, SENHA_MAX = 72
/** Erros seguidos antes de travar e por quanto tempo. */
export const MAX_FALHAS = 5, TRAVA_MIN = 10

/** Senha nova: 6 a 72 caracteres, sem ser só espaços. */
export function validarSenhaNova(v: unknown): { ok: true; senha: string } | { ok: false; erro: string } {
  if (typeof v !== 'string' || !v.trim()) return { ok: false, erro: 'Digite uma senha.' }
  if ([...v].length < SENHA_MIN) return { ok: false, erro: `A senha precisa de pelo menos ${SENHA_MIN} caracteres.` }
  if ([...v].length > SENHA_MAX) return { ok: false, erro: `A senha pode ter no máximo ${SENHA_MAX} caracteres.` }
  return { ok: true, senha: v }
}

/** Letras e números sem os que se confundem (0/O, 1/I/L). */
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
/** Código de recuperação: 16 caracteres em 4 grupos (ex.: K7QM-2XPB-9RTD-W4HN), ~78 bits. Mostrado uma vez só. */
export function novoCodigoRecuperacao(): string {
  const b = randomBytes(16)
  return [...b].map(x => ALFABETO[x % ALFABETO.length]).join('').match(/.{4}/g)!.join('-')
}
/** Aceita o código com ou sem traços, minúsculas ou espaços. */
export const normalizarCodigo = (v: unknown) => typeof v === 'string' ? v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32) : ''

/** Guarda como `scrypt$N$r$p$sal$hash` (base64url). */
export async function gerarHash(senha: string): Promise<string> {
  const sal = randomBytes(16)
  const h = await scrypt(senha.normalize('NFC'), sal, TAM, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 })
  return ['scrypt', N, R, P, sal.toString('base64url'), h.toString('base64url')].join('$')
}

/** Confere em tempo constante. Hash estranho ou senha absurda = falso. */
export async function conferirHash(senha: unknown, guardado: string | null | undefined): Promise<boolean> {
  if (typeof senha !== 'string' || !senha || senha.length > 400 || !guardado) return false
  const [alg, n, r, p, sal, h] = guardado.split('$')
  if (alg !== 'scrypt' || !sal || !h) return false
  const esperado = Buffer.from(h, 'base64url')
  try {
    const calc = await scrypt(senha.normalize('NFC'), Buffer.from(sal, 'base64url'), esperado.length, { N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024 })
    return calc.length === esperado.length && timingSafeEqual(calc, esperado)
  } catch { return false }
}

export const hashToken = (t: string) => createHash('sha256').update(t, 'utf8').digest('base64url')
export const novoToken = () => randomBytes(32).toString('base64url')
/** Um cookie por perfil: dá para ter vários perfis lembrados no mesmo aparelho. */
export const nomeCookie = (id: string) => 'prg_s_' + id

export function lerToken(req: NextRequest, id: string): string | null {
  const v = req.cookies.get(nomeCookie(id))?.value
  return v && /^[A-Za-z0-9_-]{20,100}$/.test(v) ? v : null
}

export function gravarCookie(res: NextResponse, req: NextRequest, id: string, token: string) {
  res.cookies.set(nomeCookie(id), token, {
    httpOnly: true, sameSite: 'lax', path: '/', secure: req.nextUrl.protocol === 'https:', maxAge: DIAS_LEMBRADO * 86400,
  })
}
export function apagarCookie(res: NextResponse, req: NextRequest, id: string) {
  res.cookies.set(nomeCookie(id), '', { httpOnly: true, sameSite: 'lax', path: '/', secure: req.nextUrl.protocol === 'https:', maxAge: 0 })
}

/** Nome curto do aparelho para a lista (“Celular Android”, “Computador Windows”…). Nada de IP. */
export function nomeAparelho(ua: string | null): string {
  const u = ua ?? ''
  const so = /iPhone|iPad/.test(u) ? 'iPhone/iPad' : /Android/.test(u) ? 'Android' : /Windows/.test(u) ? 'Windows' : /Mac OS X/.test(u) ? 'Mac' : /Linux/.test(u) ? 'Linux' : ''
  const tipo = /Mobi|iPhone|Android/.test(u) ? 'Celular' : 'Computador'
  return so ? `${tipo} ${so}` : 'Aparelho'
}
