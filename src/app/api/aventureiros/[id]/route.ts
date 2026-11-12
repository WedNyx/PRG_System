import { ator, lerJson, ok, q, rest, rota, ErroApi } from '@/lib/nuvem/servidor'
import { exigirAdmin } from '@/lib/nuvem/admin'
import { isUuid } from '@/lib/nuvem/validacao'
import { validarApelidoAventureiro } from '@/lib/auth/aventureiro'
import { ehGrupo } from '@/lib/grupos'
import { limparVisual } from '@/lib/visual'
import { apagarCookie } from '@/lib/nuvem/senha'

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

/**
 * Remove um perfil. Dois caminhos:
 * - administrador: { senha } (senha de administrador) remove qualquer perfil;
 * - o próprio perfil (v0.33.2): { confirmar: apelido, manterPersonagens? } — apaga o perfil e tudo dele.
 *   Personagens que estão em campanhas podem ficar com o mestre, como NPC.
 */
export const DELETE = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  if (!isUuid(id)) throw new ErroApi(404, 'Aventureiro não encontrado.')
  const b = await lerJson(req, 1000) as { senha?: unknown; confirmar?: unknown; manterPersonagens?: unknown; apagarCampanhas?: unknown }
  const proprio = b.senha === undefined
  if (proprio) {
    if (req.headers.get('x-prg-aventureiro') !== id) throw new ErroApi(403, 'Você só pode apagar o seu próprio perfil.')
    await ator(req) // perfil com senha: precisa estar conectado neste aparelho
    const [eu] = await rest<{ apelido: string }[]>(`prg_public_adventurers?select=apelido&id=eq.${q(id)}&limit=1`)
    if (!eu) throw new ErroApi(404, 'Aventureiro não encontrado.')
    if (typeof b.confirmar !== 'string' || b.confirmar.trim().toLowerCase() !== eu.apelido.trim().toLowerCase())
      throw new ErroApi(400, 'Para confirmar, escreva o nome do seu perfil exatamente como ele é.')
  } else await exigirAdmin(req, b.senha)

  const mestre = await rest<{ id: string; nome: string }[]>(`prg_campanhas?select=id,nome&mestre_id=eq.${q(id)}&limit=50`)
  // O próprio perfil pode levar as campanhas junto, se marcar (a tela lista quais são).
  const levarCampanhas = proprio && b.apagarCampanhas === true
  if (mestre.length && !levarCampanhas) throw new ErroApi(409, `${proprio ? 'Você é' : 'Esse perfil é'} mestre de ${mestre.slice(0, 5).map(c => '“' + c.nome + '”').join(', ')}. ${proprio ? 'Marque “Apagar também as minhas campanhas” ou exclua' : 'Exclua'} ${mestre.length > 1 ? 'essas campanhas' : 'essa campanha'} antes.`)
  // Sistemas autorais usados por fichas de outras pessoas não podem sumir junto.
  const meus = await rest<{ id: string; nome: string }[]>(`prg_sistemas_autorais?select=id,nome&dono_id=eq.${q(id)}&limit=50`)
  for (const s of meus) {
    const usado = await rest<unknown[]>(`prg_fichas?select=id&sistema=eq.${q('autoral-' + s.id.replace(/-/g, ''))}&dono_id=neq.${q(id)}&limit=1`)
    if (usado.length) throw new ErroApi(409, `O sistema “${s.nome}” ${proprio ? 'que você criou ' : ''}é usado por fichas de outras pessoas. Peça ao administrador antes de apagar ${proprio ? 'o seu perfil' : 'este perfil'}.`)
  }
  // Personagens de campanha ficam com o mestre, como NPC (se pedido). O resto vai junto com o perfil.
  let mantidos = 0
  if (proprio && b.manterPersonagens === true) {
    const deCampanha = await rest<{ id: string; campanha: { mestre_id: string } | null }[]>(`prg_fichas?select=id,campanha:prg_campanhas(mestre_id)&dono_id=eq.${q(id)}&campanha_id=not.is.null&limit=200`)
    for (const f of deCampanha) if (f.campanha?.mestre_id) {
      await rest(`prg_fichas?id=eq.${q(f.id)}`, { method: 'PATCH', body: JSON.stringify({ dono_id: f.campanha.mestre_id, npc: true }) }); mantidos++
    }
  }
  if (levarCampanhas) for (const c of mestre) await rest(`prg_campanhas?id=eq.${q(c.id)}`, { method: 'DELETE' })
  let r: { id: string }[]
  try { r = await rest(`prg_public_adventurers?id=eq.${q(id)}&select=id`, { method: 'DELETE', prefer: 'return=representation' }) }
  catch (e) { if (e instanceof ErroApi && e.status === 409) throw new ErroApi(409, 'Esse perfil ainda está ligado a dados antigos que impedem a exclusão.'); throw e }
  if (!r.length) throw new ErroApi(404, 'Aventureiro não encontrado.')
  const res = ok({ ok: true, mantidos })
  if (proprio) apagarCookie(res, req, id)
  return res
})
