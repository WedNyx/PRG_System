/**
 * Ordenação de visualização (não modifica a árvore nem libera poderes).
 * Um pré-requisito aparece antes de seus dependentes, e os níveis dão a ordem
 * de progressão dentro de cada faixa. Ignora referências ausentes e ciclos.
 */
export function ordenarNosVerticais<T extends { id: string; nivel?: number; requer?: readonly string[] }>(
  nos: readonly T[],
): T[] {
  const porId = new Map(nos.map(n => [n.id, n]))
  const indice = new Map(nos.map((n, i) => [n.id, i]))
  const cache = new Map<string, number>()
  const emCalculo = new Set<string>()

  const profundidade = (id: string): number => {
    const anterior = cache.get(id)
    if (anterior !== undefined) return anterior
    const no = porId.get(id)
    if (!no || emCalculo.has(id)) return 0
    emCalculo.add(id)
    const valor = Math.min(120, 1 + Math.max(-1, ...(no.requer ?? [])
      .filter(r => r !== id && porId.has(r))
      .map(r => profundidade(r))))
    emCalculo.delete(id)
    cache.set(id, valor)
    return valor
  }
  return [...nos].sort((a, b) =>
    profundidade(a.id) - profundidade(b.id) ||
    (a.nivel ?? 1) - (b.nivel ?? 1) ||
    (indice.get(a.id) ?? 0) - (indice.get(b.id) ?? 0))
}
