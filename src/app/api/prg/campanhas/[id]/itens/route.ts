import { apelidoDe, ator, buscarFicha, ErroApi, exigirParticipante, lerJson, linkCampanha, notificar, ok, q, registrar, rest, rota, rpc, type FichaRow } from '@/lib/nuvem/servidor'
import { isUuid, podeAdministrar } from '@/lib/nuvem/validacao'
import { transferirItem } from '@/lib/sistemas/inventario'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }
type Destino = { id: string; nome: string; npc: boolean; dono_id: string; dono: { apelido: string } | null }

/** Para quem dá para passar itens: personagens dos jogadores (e, para o mestre, também NPCs). */
export const GET = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  const eu = await ator(req)
  const papel = await exigirParticipante(id, eu)
  const admin = podeAdministrar(papel)
  const rows = await rest<Destino[]>(`prg_fichas?select=id,nome,npc,dono_id,dono:prg_public_adventurers(apelido)&campanha_id=eq.${q(id)}&status=eq.ativa${admin ? '' : '&npc=eq.false&oculta=eq.false'}&order=npc.asc,nome.asc&limit=200`)
  return ok({ destinos: rows.map(r => ({ id: r.id, nome: r.nome || 'Sem nome', npc: r.npc, jogador: r.npc ? null : r.dono?.apelido ?? null, meu: r.dono_id === eu && !r.npc })) })
})

async function salvar(f: FichaRow, dados: Record<string, unknown>): Promise<FichaRow | null> {
  const [s] = await rpc<FichaRow[]>('prg_salvar_ficha', { p_id: f.id, p_dono: f.dono_id, p_versao: f.versao, p_nome: f.nome, p_dados: dados })
  return s ?? null
}

/** Passa um item de uma ficha para outra da mesma campanha, na hora (decisão do Wed: sem aprovação). */
export const POST = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  const eu = await ator(req)
  const papel = await exigirParticipante(id, eu)
  const admin = podeAdministrar(papel)
  const b = await lerJson(req, 2000) as { de?: unknown; para?: unknown; item?: unknown; qtd?: unknown }
  if (!isUuid(b.de) || !isUuid(b.para) || typeof b.item !== 'string') throw new ErroApi(400, 'Dados inválidos.')
  if (b.de === b.para) throw new ErroApi(400, 'Escolha outro personagem.')
  const [de, para] = await Promise.all([buscarFicha(b.de), buscarFicha(b.para)])
  if (!de || de.campanha_id !== id || !para || para.campanha_id !== id) throw new ErroApi(404, 'Personagem não encontrado nesta campanha.')
  if (de.status !== 'ativa' || para.status !== 'ativa') throw new ErroApi(409, 'Só fichas aprovadas na campanha trocam itens.')
  if (!admin) {
    if (de.npc || de.dono_id !== eu) throw new ErroApi(403, 'Você só pode passar itens dos seus personagens.')
    if (para.npc || para.oculta) throw new ErroApi(403, 'Só o mestre passa itens para NPCs.')
    const travada = (f: FichaRow) => f.bloqueada || (f.areas_bloqueadas ?? []).includes('equipamentos')
    if (travada(de)) throw new ErroApi(423, 'O mestre travou o inventário desta ficha.')
    if (travada(para)) throw new ErroApi(423, `O mestre travou o inventário de ${para.nome || 'quem recebe'}.`)
  }
  const r = transferirItem(de.dados ?? {}, para.dados ?? {}, b.item, Number(b.qtd ?? 1))
  if (!r.ok) throw new ErroApi(400, r.erro)

  const salvaDe = await salvar(de, r.de)
  if (!salvaDe) throw new ErroApi(409, 'A ficha foi alterada agora mesmo. Tente de novo.')
  const salvaPara = await salvar(para, r.para)
  if (!salvaPara) {
    // Desfaz a saída do item (quem recebe mudou ao mesmo tempo).
    await salvar({ ...de, versao: salvaDe.versao }, de.dados ?? {})
    throw new ErroApi(409, 'A ficha de quem recebe foi alterada agora mesmo. Tente de novo.')
  }

  const qtdTxt = r.qtd > 1 ? `${r.qtd}× ` : ''
  const texto = `🎁 ${de.nome || 'Alguém'} passou ${qtdTxt}${r.item.nome} para ${para.nome || 'alguém'}.`
  await Promise.all([
    rest('prg_mesa_eventos', { method: 'POST', body: JSON.stringify({ campanha_id: id, autor_id: eu, tipo: 'sistema', visibilidade: de.npc || para.npc ? 'mestre' : 'publica', texto }) }).catch(() => {}),
    registrar([
      { ficha_id: de.id, campanha_id: id, autor_id: eu, tipo: 'edicao', categoria: 'equipamentos', descricao: `Passou ${qtdTxt}${r.item.nome} para ${para.nome || 'outro personagem'}` },
      { ficha_id: para.id, campanha_id: id, autor_id: eu, tipo: 'edicao', categoria: 'equipamentos', descricao: `Recebeu ${qtdTxt}${r.item.nome} de ${de.nome || 'outro personagem'}` },
    ]),
    para.npc ? Promise.resolve() : apelidoDe(eu).then(quem => notificar([{ destinatario_id: para.dono_id, campanha_id: id, tipo: 'item_recebido', titulo: `🎁 ${para.nome || 'Seu personagem'} recebeu ${qtdTxt}${r.item.nome}`, texto: `De ${de.nome || quem}.`, link: linkCampanha(id) }], eu)),
  ])
  return ok({ ok: true, item: r.item.nome, qtd: r.qtd, de: { versao: salvaDe.versao, dados: salvaDe.dados } })
})
