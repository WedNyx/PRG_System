import { ator, ok, rota } from '@/lib/nuvem/servidor'
import { conquistasDe } from '@/lib/nuvem/conquistas'

export const dynamic = 'force-dynamic'

/** Molduras especiais (v0.37.2): o que o perfil já liberou (mestrou 15 min, criou um sistema) e quantos minutos tem. */
export const GET = rota(async req => ok(await conquistasDe(await ator(req))))
