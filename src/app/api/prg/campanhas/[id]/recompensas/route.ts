import { ator, buscarFicha, lerJson, ok, papelNaCampanha, q, registrar, rest, rota, ErroApi } from '@/lib/nuvem/servidor'
import { isUuid, podeAdministrar, validarFichaDados } from '@/lib/nuvem/validacao'
import { aplicarRecompensa, descreverRecompensa, entradaDaBiblioteca, validarRecompensa, type EntradaBiblioteca } from '@/lib/nuvem/recompensas'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }

/** Mestre distribui XP, itens/poderes (texto ou da biblioteca) e/ou moedas para fichas aprovadas da campanha. */
export const POST = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  const eu = await ator(req)
  if (!podeAdministrar(await papelNaCampanha(id, eu))) throw new ErroApi(403, 'Apenas o mestre distribui recompensas.')
  const b = await lerJson(req) as Record<string, unknown>
  const bibIds = (Array.isArray(b.bibliotecaIds) ? b.bibliotecaIds : []).filter(isUuid).slice(0, 20)
  let biblioteca: EntradaBiblioteca[] = []
  if (bibIds.length) {
    const linhas = await rest<{ id: string; tipo: string; nome: string; dados: unknown }[]>(`prg_biblioteca?select=id,tipo,nome,dados&campanha_id=eq.${q(id)}&id=in.(${bibIds.map(q).join(',')})`)
    // Mantém a ordem e as repetições escolhidas pelo mestre.
    biblioteca = bibIds.flatMap(x => { const l = linhas.find(y => y.id === x); const e = l && entradaDaBiblioteca(l); return e ? [e] : [] })
  }
  const r = validarRecompensa(b, biblioteca)
  if (!r) throw new ErroApi(400, 'Informe XP, um item, um poder ou moedas.')
  const ids = (Array.isArray(b.fichaIds) ? b.fichaIds : []).filter(isUuid).slice(0, 30)
  if (!ids.length) throw new ErroApi(400, 'Escolha quem recebe.')
  const nomes: string[] = []
  for (const fid of ids) {
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      const f = await buscarFicha(fid)
      if (!f || f.campanha_id !== id || f.status !== 'ativa') break
      const dados = aplicarRecompensa(f.sistema, f.dados ?? {}, r)
      const v = validarFichaDados(dados)
      const ok2 = await rest<unknown[]>(`prg_fichas?id=eq.${q(f.id)}&versao=eq.${f.versao}`, { method: 'PATCH', prefer: 'return=representation',
        body: JSON.stringify({ dados, nome: v.ok ? v.valor.nome : f.nome, versao: f.versao + 1, atualizada_em: new Date().toISOString() }) })
      if (ok2.length) {
        nomes.push(f.nome || 'Personagem')
        await registrar([{ ficha_id: f.id, campanha_id: id, autor_id: eu, tipo: 'recompensa', descricao: 'Recompensa: ' + descreverRecompensa(r) + (typeof b.motivo === 'string' && b.motivo.trim() ? ` — ${b.motivo.trim().slice(0, 200)}` : '') }])
        break
      }
    }
  }
  if (!nomes.length) throw new ErroApi(400, 'Nenhuma ficha aprovada encontrada.')
  if (b.anunciar !== false) {
    await rest('prg_mesa_eventos', { method: 'POST', body: JSON.stringify({ campanha_id: id, autor_id: eu, tipo: 'sistema', visibilidade: 'publica',
      texto: `🎁 Recompensa para ${nomes.join(', ')}: ${descreverRecompensa(r)}` }) }).catch(() => {})
  }
  return ok({ recompensados: nomes })
})
