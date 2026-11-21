/** Busca universal da Central (v0.36.5): filtro puro, sem tela. */
export type ItemBusca = { id: string; titulo: string; sub?: string; icone: string; grupo: string; href?: string; acao?: () => void; palavras?: string }

/** Tira acentos e deixa minúsculo: “mágica” encontra “magica”. */
export const normalizar = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/** Filtra e ordena: começa com o termo > tem o termo no título > tem nas palavras-chave. */
export function filtrarBusca(itens: ItemBusca[], termo: string, max = 30): ItemBusca[] {
  const q = normalizar(termo.trim())
  if (!q) return itens.slice(0, max)
  const partes = q.split(/\s+/)
  return itens.map(it => {
    const t = normalizar(it.titulo), extra = normalizar((it.sub ?? '') + ' ' + (it.palavras ?? '') + ' ' + it.grupo)
    if (!partes.every(p => t.includes(p) || extra.includes(p))) return null
    const pontos = t.startsWith(q) ? 0 : t.includes(q) ? 1 : partes.every(p => t.includes(p)) ? 2 : 3
    return { it, pontos }
  }).filter((x): x is { it: ItemBusca; pontos: number } => !!x).sort((a, b) => a.pontos - b.pontos).slice(0, max).map(x => x.it)
}
