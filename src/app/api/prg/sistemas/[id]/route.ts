import { ator, ok, rota, ErroApi } from '@/lib/nuvem/servidor'
import { linhaAutoral } from '@/lib/nuvem/sistemasServidor'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }

/** Definição completa de um sistema autoral (para abrir fichas e para o editor). */
export const GET = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  const eu = await ator(req)
  const l = await linhaAutoral(id)
  if (!l) throw new ErroApi(404, 'Sistema não encontrado.')
  return ok({ sistema: { ...l.definicao, id, autor: l.dono?.apelido ?? 'Alguém' }, uuid: l.id, publicado: l.publicado, meu: l.dono_id === eu })
})
