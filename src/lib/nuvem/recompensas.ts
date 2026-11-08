/** Aplica XP, item e moedas a uma ficha (V8 ou genérica). Função pura, testada. */
import { sistemaPorId } from '../sistemas/catalogo'

type Dados = Record<string, unknown>
const obj = (v: unknown): Dados => (v && typeof v === 'object' && !Array.isArray(v) ? { ...(v as Dados) } : {})
const anexar = (atual: unknown, linha: string) => (typeof atual === 'string' && atual.trim() ? atual.replace(/\s+$/, '') + '\n' : '') + linha

export type Recompensa = { xp: number; item: string; moedas: string }

export function validarRecompensa(b: Record<string, unknown>): Recompensa | null {
  const xp = Math.round(Number(b.xp) || 0)
  const item = typeof b.item === 'string' ? b.item.trim().slice(0, 200) : ''
  const moedas = typeof b.moedas === 'string' ? b.moedas.trim().slice(0, 60) : ''
  if (xp < -100000 || xp > 100000) return null
  if (!xp && !item && !moedas) return null
  return { xp, item, moedas }
}

export function aplicarRecompensa(sistema: string, dados: Dados, r: Recompensa): Dados {
  if (sistema === 'lunethernnyis-v8') {
    const f = obj(dados.fields)
    if (r.xp) f.xp = String(Math.max(0, (Number(f.xp) || 0) + r.xp))
    if (r.item) f.inventory = anexar(f.inventory, '• ' + r.item)
    if (r.moedas) f.inventory = anexar(f.inventory, '💰 ' + r.moedas)
    return { ...dados, fields: f }
  }
  const s = sistemaPorId(sistema)
  const campos = obj(dados.campos), listas = obj(dados.listas)
  const temXp = !!s?.campos.some(c => c.id === 'xp')
  const listaItens = s?.listas.find(l => /inventario|equipamento/.test(l.id))?.id ?? s?.listas.find(l => /anotacoes/.test(l.id))?.id ?? 'anotacoes'
  if (r.xp && temXp) campos.xp = Math.max(0, (Number(campos.xp) || 0) + r.xp)
  else if (r.xp) listas[listaItens] = anexar(listas[listaItens], `⭐ ${r.xp > 0 ? '+' : ''}${r.xp} XP`)
  if (r.item) listas[listaItens] = anexar(listas[listaItens], '• ' + r.item)
  if (r.moedas) listas[listaItens] = anexar(listas[listaItens], '💰 ' + r.moedas)
  return { ...dados, campos, listas }
}

export function descreverRecompensa(r: Recompensa) {
  return [r.xp ? `${r.xp > 0 ? '+' : ''}${r.xp} XP` : '', r.item ? `“${r.item}”` : '', r.moedas ? r.moedas : ''].filter(Boolean).join(', ')
}
