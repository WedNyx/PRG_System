import { ator, lerJson, ok, q, rest, rota, ErroApi } from '@/lib/nuvem/servidor'

export const dynamic = 'force-dynamic'
const DIAS = 60

/** Meus avisos (mais novos primeiro) e quantos ainda não li. */
export const GET = rota(async req => {
  const eu = await ator(req)
  const limite = Math.max(1, Math.min(100, Number(req.nextUrl.searchParams.get('limite')) || 40))
  // Limpeza automática: avisos com mais de 60 dias somem.
  const corte = new Date(Date.now() - DIAS * 86400_000).toISOString()
  void rest(`prg_notificacoes?destinatario_id=eq.${q(eu)}&criada_em=lt.${q(corte)}`, { method: 'DELETE' }).catch(() => {})
  const [itens, nao] = await Promise.all([
    rest(`prg_notificacoes?select=id,campanha_id,tipo,titulo,texto,link,lida,criada_em&destinatario_id=eq.${q(eu)}&order=id.desc&limit=${limite}`),
    rest<{ id: number }[]>(`prg_notificacoes?select=id&destinatario_id=eq.${q(eu)}&lida=eq.false&limit=100`),
  ])
  return ok({ itens, naoLidas: nao.length })
})

/** Marcar como lidas (algumas ou todas) ou apagar as já lidas. */
export const POST = rota(async req => {
  const eu = await ator(req)
  const b = await lerJson(req, 5_000) as { acao?: unknown; ids?: unknown }
  const meus = `prg_notificacoes?destinatario_id=eq.${q(eu)}`
  if (b.acao === 'ler') {
    const ids = Array.isArray(b.ids) ? b.ids.filter((x): x is number => Number.isInteger(x) && x > 0).slice(0, 100) : null
    const filtro = ids ? (ids.length ? `&id=in.(${ids.join(',')})` : null) : '&lida=eq.false'
    if (filtro !== null) await rest(meus + filtro, { method: 'PATCH', body: JSON.stringify({ lida: true }) })
    return ok({ ok: true })
  }
  if (b.acao === 'apagar_lidas') { await rest(meus + '&lida=eq.true', { method: 'DELETE' }); return ok({ ok: true }) }
  throw new ErroApi(400, 'Ação desconhecida.')
})
