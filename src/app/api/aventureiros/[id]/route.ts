import { ator, lerJson, ok, q, rest, rota, ErroApi } from '@/lib/nuvem/servidor'
import { exigirAdmin } from '@/lib/nuvem/admin'
import { isUuid } from '@/lib/nuvem/validacao'
import { validarApelidoAventureiro } from '@/lib/auth/aventureiro'
import { ehGrupo } from '@/lib/grupos'
import { limparVisual } from '@/lib/visual'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }
const AVATAR = /^data:image\/jpeg;base64,[a-zA-Z0-9+/=]+$/

/** O próprio aventureiro muda o nome, a foto, o grupo e/ou a aparência. */
export const PATCH = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  if (!isUuid(id)) throw new ErroApi(404, 'Aventureiro não encontrado.')
  if (req.headers.get('x-prg-aventureiro') !== id) throw new ErroApi(403, 'Você só pode editar o seu próprio perfil.')
  await ator(req)
  const b = await lerJson(req, 160_000) as Record<string, unknown>
  const mud: Record<string, unknown> = {}
  if (b.apelido !== undefined) {
    const v = validarApelidoAventureiro(b.apelido)
    if (!v.ok) throw new ErroApi(400, v.erro)
    mud.apelido = v.apelido
  }
  if (b.avatar !== undefined) {
    if (b.avatar !== null && (typeof b.avatar !== 'string' || b.avatar.length > 120_000 || !AVATAR.test(b.avatar))) throw new ErroApi(400, 'Foto inválida ou muito grande.')
    mud.avatar = b.avatar
  }
  if (b.grupo !== undefined) {
    if (!ehGrupo(b.grupo)) throw new ErroApi(400, 'Escolha um grupo: Lunethernnyis ou De Fora.')
    mud.grupo = b.grupo
  }
  if (b.visual !== undefined) {
    // Aparência do perfil: só campos conhecidos; foto de fundo só do armazenamento da plataforma.
    const v = b.visual === null ? null : limparVisual(b.visual)
    if (v && JSON.stringify(v).length > 2000) throw new ErroApi(400, 'Aparência inválida.')
    mud.visual = v && Object.keys(v).length ? v : null
  }
  if (!Object.keys(mud).length) throw new ErroApi(400, 'Nada para alterar.')
  let r: { id: string; apelido: string; avatar: string | null; grupo?: string; visual?: unknown }[]
  try { r = await rest(`prg_public_adventurers?id=eq.${q(id)}&select=id,apelido,avatar${mud.grupo ? ',grupo' : ''}${'visual' in mud ? ',visual' : ''}`, { method: 'PATCH', prefer: 'return=representation', body: JSON.stringify(mud) }) }
  catch (e) { if (e instanceof ErroApi && e.status === 409) throw new ErroApi(409, 'Esse apelido já está em uso.'); throw e }
  if (!r.length) throw new ErroApi(404, 'Aventureiro não encontrado.')
  return ok({ perfil: r[0] })
})

/** Administrador (com a senha) remove qualquer perfil. */
export const DELETE = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  if (!isUuid(id)) throw new ErroApi(404, 'Aventureiro não encontrado.')
  const b = await lerJson(req, 1000) as { senha?: unknown }
  await exigirAdmin(req, b.senha)
  const mestre = await rest<{ nome: string }[]>(`prg_campanhas?select=nome&mestre_id=eq.${q(id)}&limit=5`)
  if (mestre.length) throw new ErroApi(409, `Esse perfil é mestre de ${mestre.map(c => '“' + c.nome + '”').join(', ')}. Exclua essas campanhas antes.`)
  let r: { id: string }[]
  try { r = await rest(`prg_public_adventurers?id=eq.${q(id)}&select=id`, { method: 'DELETE', prefer: 'return=representation' }) }
  catch (e) { if (e instanceof ErroApi && e.status === 409) throw new ErroApi(409, 'Esse perfil ainda está ligado a dados antigos que impedem a exclusão.'); throw e }
  if (!r.length) throw new ErroApi(404, 'Aventureiro não encontrado.')
  return ok({ ok: true })
})
