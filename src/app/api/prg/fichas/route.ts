import { ator, lerJson, ok, q, rest, rota, ErroApi } from '@/lib/nuvem/servidor'
import { validarFichaDados } from '@/lib/nuvem/validacao'

export const dynamic = 'force-dynamic'
const MAX_FICHAS = 100

/** Lista as fichas do aventureiro (sem os dados completos, para ficar leve). */
export const GET = rota(async req => {
  const eu = await ator(req)
  const fichas = await rest(
    `prg_fichas?select=id,nome,sistema,status,versao,campanha_id,origem_id,atualizada_em,campanha:prg_campanhas(nome)&dono_id=eq.${q(eu)}&order=atualizada_em.desc&limit=${MAX_FICHAS}`)
  return ok({ fichas })
})

/** Cria uma ficha independente (vazia ou importada de um backup/armazenamento local). */
export const POST = rota(async req => {
  const eu = await ator(req)
  const body = await lerJson(req, 600_000) as { dados?: unknown }
  const v = validarFichaDados(body.dados ?? { version: 2, fields: {} })
  if (!v.ok) throw new ErroApi(400, v.erro)
  const atuais = await rest<unknown[]>(`prg_fichas?select=id&dono_id=eq.${q(eu)}&limit=${MAX_FICHAS}`)
  if (atuais.length >= MAX_FICHAS) throw new ErroApi(429, `Limite de ${MAX_FICHAS} fichas por aventureiro.`)
  const [ficha] = await rest<Record<string, unknown>[]>('prg_fichas', {
    method: 'POST', prefer: 'return=representation',
    body: JSON.stringify({ dono_id: eu, nome: v.valor.nome, dados: v.valor.dados }),
  })
  return ok({ ficha }, 201)
})
