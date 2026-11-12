/**
 * Visão de progressão D&D 2024 independente da árvore de compra por pontos.
 * Não adiciona regras oficiais sem verificação: os marcos vêm de um catálogo revisado.
 */
export type MarcoDnd = {
  id: string
  nome: string
  nivel: number
  origem: 'classe' | 'subclasse' | 'especie' | 'antecedente'
  origemId: string
  modo: 'automatico' | 'escolha'
  descricao?: string
  opcoes?: { id: string; nome: string }[]
  fonte: string
}
export type EstadoMarco = 'adquirido' | 'escolher' | 'futuro' | 'pendente'
export type ProgressoDnd = {
  nivelPorClasse: Record<string, number>
  especieId?: string
  antecedenteId?: string
  escolhas: Record<string, string>
}
export type MarcoVisivel = MarcoDnd & { estado: EstadoMarco; escolha?: string }

/** Cada classe usa seu próprio nível; espécie e antecedente usam o nível total. */
export function nivelTotal(niveis: Record<string, number>): number {
  return Object.values(niveis).reduce((total, nivel) =>
    total + (Number.isInteger(nivel) && nivel > 0 ? nivel : 0), 0)
}
export function progressaoVisivel(marcos: MarcoDnd[], ficha: ProgressoDnd): MarcoVisivel[] {
  const total = nivelTotal(ficha.nivelPorClasse)
  return marcos.filter(m => {
    if (m.origem === 'classe' || m.origem === 'subclasse') return m.origemId in ficha.nivelPorClasse
    if (m.origem === 'especie') return m.origemId === ficha.especieId
    return m.origemId === ficha.antecedenteId
  }).map(m => {
    const atual = m.origem === 'classe' || m.origem === 'subclasse'
      ? ficha.nivelPorClasse[m.origemId] ?? 0 : total
    const escolha = ficha.escolhas[m.id]
    const escolhaValida = !!escolha && !!m.opcoes?.some(o => o.id === escolha)
    const estado: EstadoMarco = atual < m.nivel ? 'futuro'
      : m.modo === 'automatico' ? 'adquirido'
      : escolhaValida ? 'adquirido'
      : escolha ? 'pendente' : 'escolher'
    return { ...m, estado, ...(escolha ? { escolha } : {}) }
  }).sort((a, b) => a.nivel - b.nivel || a.nome.localeCompare(b.nome))
}
export function validarMarcos(marcos: MarcoDnd[]): string[] {
  const erros: string[] = []
  const ids = new Set<string>()
  for (const m of marcos) {
    if (!m.id || ids.has(m.id)) erros.push('ID ausente ou duplicado: ' + m.id)
    ids.add(m.id)
    if (!Number.isInteger(m.nivel) || m.nivel < 1 || m.nivel > 20) erros.push('Nível inválido: ' + m.id)
    if (!m.fonte.trim()) erros.push('Fonte obrigatória: ' + m.id)
    if (m.modo === 'escolha' && !m.opcoes?.length) erros.push('Escolha sem opções: ' + m.id)
  }
  return erros
}
