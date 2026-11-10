import { timingSafeEqual, createHash } from 'node:crypto'
import packageJson from '../../../../../package.json'
import { ErroApi, ok, rest, rota } from '@/lib/nuvem/servidor'
import { gerarCopia, guardarCopia, podarCopias, resumo } from '@/lib/nuvem/backup'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const h = (s: string) => createHash('sha256').update(s).digest()

/**
 * Cópia de segurança diária, chamada pelo agendador da Vercel (vercel.json → crons).
 * A Vercel manda `Authorization: Bearer <CRON_SECRET>`; sem essa variável a rota fica desligada.
 */
export const GET = rota(async req => {
  const segredo = process.env.CRON_SECRET
  if (!segredo) throw new ErroApi(503, 'CRON_SECRET não configurado na Vercel.')
  const veio = req.headers.get('authorization') ?? ''
  if (!timingSafeEqual(h(veio), h('Bearer ' + segredo))) throw new ErroApi(401, 'Não autorizado.')
  const copia = await gerarCopia(packageJson.version)
  const nome = await guardarCopia(copia)
  const apagadas = await podarCopias()
  // Faxina: erros com mais de 30 dias.
  const limite = new Date(Date.now() - 30 * 86_400_000).toISOString()
  await rest(`prg_erros?criado_em=lt.${encodeURIComponent(limite)}`, { method: 'DELETE' }).catch(() => {})
  return ok({ ok: true, nome, tabelas: resumo(copia), apagadas })
})
