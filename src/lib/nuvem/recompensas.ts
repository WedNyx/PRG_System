/** Aplica XP, itens, poderes e moedas a uma ficha (V8 ou genérica). Funções puras, testadas. */
import { sistemaPorId } from '../sistemas/catalogo'
import { lerItens, lerPoderes, lerUso, normalizarItem, normalizarPoder, type Item, type Poder } from '../sistemas/inventario'
import { lerArvore } from '../sistemas/arvore'

type Dados = Record<string, unknown>
const obj = (v: unknown): Dados => (v && typeof v === 'object' && !Array.isArray(v) ? { ...(v as Dados) } : {})
const anexar = (atual: unknown, linha: string) => (typeof atual === 'string' && atual.trim() ? atual.replace(/\s+$/, '') + '\n' : '') + linha

/** Uma entrada da biblioteca do mestre (já validada no servidor). */
export type EntradaBiblioteca = { tipo: 'item'; item: Item } | { tipo: 'poder'; poder: Poder }
export type Recompensa = { xp: number; item: string; moedas: string; biblioteca?: EntradaBiblioteca[]; pontos?: number }

export function validarRecompensa(b: Record<string, unknown>, biblioteca: EntradaBiblioteca[] = []): Recompensa | null {
  const xp = Math.round(Number(b.xp) || 0)
  const item = typeof b.item === 'string' ? b.item.trim().slice(0, 200) : ''
  const moedas = typeof b.moedas === 'string' ? b.moedas.trim().slice(0, 60) : ''
  const pontos = Math.round(Number(b.pontos) || 0)
  if (xp < -100000 || xp > 100000 || pontos < -99 || pontos > 99) return null
  if (!xp && !item && !moedas && !biblioteca.length && !pontos) return null
  return { xp, item, moedas, ...(biblioteca.length ? { biblioteca } : {}), ...(pontos ? { pontos } : {}) }
}

/** Converte uma linha da tabela prg_biblioteca numa entrada válida. */
export function entradaDaBiblioteca(linha: { id: string; tipo: string; nome: string; dados: unknown }): EntradaBiblioteca | null {
  const base = { ...obj(linha.dados), nome: linha.nome, id: 'b' + linha.id.replace(/-/g, '').slice(0, 12) }
  if (linha.tipo === 'item') { const item = normalizarItem(base); return item ? { tipo: 'item', item } : null }
  if (linha.tipo === 'poder') { const poder = normalizarPoder(base); return poder ? { tipo: 'poder', poder } : null }
  return null
}

const novoId = (base: string, usados: Set<string>) => { let i = 1, id = base; while (usados.has(id)) id = base + '_' + ++i; usados.add(id); return id }

export function aplicarRecompensa(sistema: string, dados: Dados, r: Recompensa): Dados {
  const nomesBib = (r.biblioteca ?? []).map(e => e.tipo === 'item' ? e.item.nome : '✨ ' + e.poder.nome)
  if (sistema === 'lunethernnyis-v8') {
    const f = obj(dados.fields)
    if (r.xp) f.xp = String(Math.max(0, (Number(f.xp) || 0) + r.xp))
    for (const n of [...(r.item ? [r.item] : []), ...nomesBib]) f.inventory = anexar(f.inventory, '• ' + n)
    if (r.moedas) f.inventory = anexar(f.inventory, '💰 ' + r.moedas)
    return { ...dados, fields: f }
  }
  const s = sistemaPorId(sistema)
  const campos = obj(dados.campos), listas = obj(dados.listas)
  const itens = lerItens(dados.itens), poderes = lerPoderes(dados.poderes), uso = lerUso(dados.uso)
  const usados = new Set([...itens.map(i => i.id), ...poderes.map(p => p.id)])
  const temXp = !!s?.campos.some(c => c.id === 'xp')
  const notas = s?.listas.find(l => /anotacoes/.test(l.id))?.id ?? 'anotacoes'
  if (r.xp && temXp) campos.xp = Math.max(0, (Number(campos.xp) || 0) + r.xp)
  else if (r.xp) listas[notas] = anexar(listas[notas], `⭐ ${r.xp > 0 ? '+' : ''}${r.xp} XP`)
  const darItem = (it: Item) => {
    // Mesmo item da biblioteca de novo: só aumenta a quantidade.
    const igual = itens.find(x => x.id === it.id)
    if (igual) { const u = uso.itens[igual.id] ?? { qtd: 1, equipado: false }; uso.itens[igual.id] = { ...u, qtd: u.qtd + 1 }; return }
    const id = novoId(it.id, usados); itens.push({ ...it, id }); uso.itens[id] = { qtd: 1, equipado: false }
  }
  if (r.item) darItem({ id: 'i' + Math.random().toString(36).slice(2, 10), nome: r.item, categoria: 'outro', peso: 0, bonus: [] })
  for (const e of r.biblioteca ?? []) {
    if (e.tipo === 'item') darItem(e.item)
    else if (!poderes.some(p => p.id === e.poder.id)) poderes.push({ ...e.poder, id: novoId(e.poder.id, usados) })
  }
  if (r.moedas) uso.carteira = (uso.carteira.trim() ? uso.carteira.trim() + ' · ' : '') + '+' + r.moedas
  // Pontos de habilidade: vão para a árvore da ficha (mesmo que ela ainda esteja vazia).
  const arvore = r.pontos ? (a => ({ ...a, pontos: Math.max(0, Math.min(9999, a.pontos + (r.pontos ?? 0))) }))(lerArvore(dados.arvore)) : undefined
  return { ...dados, campos, listas, itens, poderes, uso, ...(arvore ? { arvore } : {}) }
}

export function descreverRecompensa(r: Recompensa) {
  return [r.xp ? `${r.xp > 0 ? '+' : ''}${r.xp} XP` : '', r.pontos ? `${r.pontos > 0 ? '+' : ''}${r.pontos} ponto(s) de habilidade` : '', r.item ? `“${r.item}”` : '',
    ...(r.biblioteca ?? []).map(e => `“${e.tipo === 'item' ? e.item.nome : e.poder.nome}”`), r.moedas ? r.moedas : ''].filter(Boolean).join(', ')
}
