import { ator, checarOrigem, exigirParticipante, lerJson, ok, papelNaCampanha, q, rest, rota, ErroApi } from '@/lib/nuvem/servidor'
import { isUuid, podeAdministrar } from '@/lib/nuvem/validacao'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }
const VIS = ['privada', 'mestre', 'campanha', 'jogador'] as const
type Vis = typeof VIS[number]

/**
 * Anotações. privada: só o autor · mestre: autor + mestres · campanha: todos · jogador: autor + um participante.
 */
export const GET = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  const eu = await ator(req)
  const papel = await papelNaCampanha(id, eu)
  if (!papel) throw new ErroApi(404, 'Campanha não encontrada.')
  const filtros = [`autor_id.eq.${eu}`, 'visibilidade.eq.campanha', `destinatario_id.eq.${eu}`]
  if (podeAdministrar(papel)) filtros.push('visibilidade.eq.mestre')
  const notas = await rest(`prg_notas?select=id,titulo,texto,visibilidade,destinatario_id,fixada,autor_id,atualizada_em,autor:prg_public_adventurers!prg_notas_autor_id_fkey(apelido)&campanha_id=eq.${q(id)}&or=(${filtros.join(',')})&order=fixada.desc,atualizada_em.desc&limit=200`)
  return ok({ notas })
})

export const POST = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  const eu = await ator(req)
  await exigirParticipante(id, eu)
  const b = await lerJson(req, 60_000) as Record<string, unknown>
  const titulo = typeof b.titulo === 'string' ? b.titulo.trim().slice(0, 120) : ''
  if (!titulo) throw new ErroApi(400, 'Dê um título à anotação.')
  const visibilidade: Vis = VIS.includes(b.visibilidade as Vis) ? b.visibilidade as Vis : 'privada'
  let destinatario: string | null = null
  if (visibilidade === 'jogador') {
    if (!isUuid(b.destinatarioId) || !(await papelNaCampanha(id, b.destinatarioId))) throw new ErroApi(400, 'Escolha com quem compartilhar.')
    destinatario = b.destinatarioId
  }
  const linha = { titulo, texto: typeof b.texto === 'string' ? b.texto.slice(0, 20000) : '', visibilidade, destinatario_id: destinatario, fixada: b.fixada === true, atualizada_em: new Date().toISOString() }
  if (isUuid(b.id)) {
    const r = await rest<unknown[]>(`prg_notas?id=eq.${q(b.id)}&campanha_id=eq.${q(id)}&autor_id=eq.${q(eu)}`, { method: 'PATCH', prefer: 'return=representation', body: JSON.stringify(linha) })
    if (!r.length) throw new ErroApi(403, 'Só quem escreveu pode editar esta anotação.')
    return ok({ nota: r[0] })
  }
  const [n] = await rest<unknown[]>('prg_notas', { method: 'POST', prefer: 'return=representation', body: JSON.stringify({ ...linha, campanha_id: id, autor_id: eu }) })
  return ok({ nota: n }, 201)
})

export const DELETE = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  checarOrigem(req)
  const eu = await ator(req)
  const nid = req.nextUrl.searchParams.get('nota')
  if (!isUuid(nid)) throw new ErroApi(400, 'Anotação inválida.')
  const r = await rest<unknown[]>(`prg_notas?id=eq.${q(nid)}&campanha_id=eq.${q(id)}&autor_id=eq.${q(eu)}`, { method: 'DELETE', prefer: 'return=representation' })
  if (!r.length) throw new ErroApi(403, 'Só quem escreveu pode excluir esta anotação.')
  return ok({ ok: true })
})
