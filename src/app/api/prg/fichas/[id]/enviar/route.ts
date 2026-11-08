import { ator, buscarFicha, lerJson, ok, papelNaCampanha, q, registrar, rest, rota, ErroApi } from '@/lib/nuvem/servidor'
import { isUuid } from '@/lib/nuvem/validacao'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }

/** Envia uma CÓPIA da ficha independente ao mestre. A original continua intacta. */
export const POST = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  const eu = await ator(req)
  const body = await lerJson(req) as { campanhaId?: unknown; mensagem?: unknown }
  const f = isUuid(id) ? await buscarFicha(id) : null
  if (!f || f.dono_id !== eu) throw new ErroApi(404, 'Ficha não encontrada.')
  if (f.campanha_id) throw new ErroApi(400, 'Envie uma ficha independente (esta já pertence a uma campanha).')
  if (!isUuid(body.campanhaId)) throw new ErroApi(400, 'Escolha a campanha.')
  if (!(await papelNaCampanha(body.campanhaId, eu))) throw new ErroApi(403, 'Você não participa desta campanha.')
  const [c] = await rest<{ estado: string }[]>(`prg_campanhas?select=estado&id=eq.${q(body.campanhaId)}`)
  if (c?.estado === 'encerrada') throw new ErroApi(409, 'Esta campanha foi encerrada.')
  const mensagem = typeof body.mensagem === 'string' ? body.mensagem.trim().slice(0, 300) : ''
  try {
    const [copia] = await rest<{ id: string }[]>('prg_fichas', {
      method: 'POST', prefer: 'return=representation',
      body: JSON.stringify({ dono_id: eu, campanha_id: body.campanhaId, origem_id: f.id, sistema: f.sistema, nome: f.nome, dados: f.dados, status: 'pendente' }),
    })
    await registrar([{ ficha_id: copia.id, campanha_id: body.campanhaId, autor_id: eu, tipo: 'envio', descricao: `Ficha "${f.nome || 'sem nome'}" enviada para avaliação${mensagem ? ': ' + mensagem : ''}` }])
    return ok({ ficha: copia }, 201)
  } catch (e) {
    if (e instanceof ErroApi && e.status === 409) throw new ErroApi(409, 'Esta ficha já está aguardando o mestre nesta campanha.')
    throw e
  }
})
