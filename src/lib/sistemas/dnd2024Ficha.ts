import type { DadosFicha } from './tipos'
import type { ProgressoDnd } from './dnd2024Progressao'

/** Mantém a seleção compatível com o formato da ficha genérica já existente. */
const idDe = (valor: unknown): string => typeof valor === 'string'
  ? valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) : ''

export function lerEscolhasDnd(valor: unknown): Record<string, string> {
  const resultado: Record<string, string> = {}
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return resultado
  for (const [id, escolha] of Object.entries(valor).slice(0, 100)) {
    if (/^[a-z0-9_-]{1,80}$/.test(id) && typeof escolha === 'string' && /^[a-z0-9_-]{1,80}$/.test(escolha)) {
      resultado[id] = escolha
    }
  }
  return resultado
}

export function progressoDaFichaDnd(d: Pick<DadosFicha, 'campos' | 'dndEscolhas'>): ProgressoDnd {
  const classeId = idDe(d.campos.classe)
  const nivelLido = Number(d.campos.nivel)
  const nivel = Number.isInteger(nivelLido) ? Math.max(1, Math.min(20, nivelLido)) : 1
  return {
    nivelPorClasse: classeId ? { [classeId]: nivel } : {},
    especieId: idDe(d.campos.especie),
    antecedenteId: idDe(d.campos.antecedente),
    escolhas: lerEscolhasDnd(d.dndEscolhas),
  }
}
