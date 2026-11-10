import { ator, lerJson, ok, papelNaCampanha, q, registrar, rest, rota, ErroApi } from '@/lib/nuvem/servidor'
import { isUuid, podeAdministrar } from '@/lib/nuvem/validacao'
import { SISTEMA_V8 } from '@/lib/sistemas/catalogo'
import { carregarSistema, sistemaPermitido } from '@/lib/nuvem/sistemasServidor'
import { fichaVazia } from '@/lib/sistemas/calculo'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }
const CAMPOS = 'id,nome,sistema,status,npc,oculta,bloqueada,areas_bloqueadas,observacao_mestre,dono_id,origem_id,versao,atualizada_em,dono:prg_public_adventurers(apelido,avatar)'

/** Mestre: todas as fichas e NPCs. Jogador: as próprias fichas desta campanha. */
export const GET = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  const eu = await ator(req)
  const papel = await papelNaCampanha(id, eu)
  if (!papel) throw new ErroApi(404, 'Campanha não encontrada.')
  const filtro = podeAdministrar(papel) ? '' : `&dono_id=eq.${q(eu)}&npc=eq.false`
  const fichas = await rest(`prg_fichas?select=${CAMPOS}&campanha_id=eq.${q(id)}${filtro}&order=npc.asc,atualizada_em.desc&limit=300`)
  return ok({ fichas })
})

/** Mestre cria NPC ou cria a ficha de um jogador junto com ele. */
export const POST = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  const eu = await ator(req)
  if (!podeAdministrar(await papelNaCampanha(id, eu))) throw new ErroApi(403, 'Apenas o mestre cria fichas na campanha.')
  const b = await lerJson(req) as { tipo?: unknown; jogadorId?: unknown; sistema?: unknown; nome?: unknown }
  const sistema = b.sistema ?? SISTEMA_V8
  if (!(await sistemaPermitido(sistema, eu))) throw new ErroApi(400, 'Sistema de RPG desconhecido.')
  const nome = typeof b.nome === 'string' ? b.nome.trim().slice(0, 90) : ''
  let dono = eu, npc = true
  if (b.tipo === 'jogador') {
    const papelAlvo = isUuid(b.jogadorId) ? await papelNaCampanha(id, b.jogadorId) : null
    if (!papelAlvo) throw new ErroApi(400, 'Escolha um participante da campanha.')
    if (papelAlvo === 'espectador') throw new ErroApi(400, 'Espectadores não têm ficha na campanha.')
    dono = b.jogadorId as string; npc = false
  }
  const s = await carregarSistema(sistema as string)
  const dados = s ? { ...fichaVazia(s), nome } : { version: 2, fields: { name: nome } }
  const [f] = await rest<{ id: string }[]>('prg_fichas', {
    method: 'POST', prefer: 'return=representation',
    body: JSON.stringify({ dono_id: dono, campanha_id: id, sistema, nome, dados, npc, status: 'ativa', oculta: npc }),
  })
  await registrar([{ ficha_id: f.id, campanha_id: id, autor_id: eu, tipo: npc ? 'npc' : 'aprovacao', descricao: npc ? `NPC criado: ${nome || 'sem nome'}` : `Ficha criada pelo mestre para um jogador: ${nome || 'sem nome'}` }])
  return ok({ ficha: f }, 201)
})
