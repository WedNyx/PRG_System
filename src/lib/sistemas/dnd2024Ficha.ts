import type { DadosFicha } from './tipos'
import { progressaoVisivel, type ProgressoDnd } from './dnd2024Progressao'
import { MARCOS_DND_2024 } from './dnd2024Marcos'

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

/**
 * Impede que uma nova escolha de subclasse seja gravada antes do nível
 * requerido, em classe diferente ou com opção ausente do catálogo.
 * Escolhas antigas desconhecidas são preservadas se NÃO foram modificadas,
 * para que corrigir PV ou inventário não destrua dados legados.
 */
export function validarAlteracoesEscolhasDnd(
  antes: Pick<DadosFicha, 'campos' | 'dndEscolhas'>,
  depois: Pick<DadosFicha, 'campos' | 'dndEscolhas'>,
): string[] {
  const anteriores = lerEscolhasDnd(antes.dndEscolhas)
  const novas = lerEscolhasDnd(depois.dndEscolhas)
  const estado = progressoDaFichaDnd(depois)
  const marcosVisiveis = progressaoVisivel(MARCOS_DND_2024, estado)
  const escolhasVisiveis = new Map(marcosVisiveis.filter(m => m.modo === 'escolha').map(m => [m.id, m]))
  const erros: string[] = []

  if (depois.dndEscolhas !== undefined && depois.dndEscolhas !== null &&
      (typeof depois.dndEscolhas !== 'object' || Array.isArray(depois.dndEscolhas))) {
    return ['Escolhas de D&D devem formar um objeto.']
  }

  for (const [id, opcao] of Object.entries(novas)) {
    if (anteriores[id] === opcao) continue
    const marco = escolhasVisiveis.get(id)
    if (!marco) { erros.push('Escolha sem característica permitida: ' + id); continue }
    if (marco.estado === 'futuro') { erros.push('Escolha indisponível antes do nível ' + marco.nivel + ': ' + id); continue }
    if (marco.estado !== 'adquirido') erros.push('Opção não reconhecida para a característica: ' + id)
  }

  if (depois.dndEscolhas && typeof depois.dndEscolhas === 'object' && !Array.isArray(depois.dndEscolhas)) {
    for (const id of Object.keys(depois.dndEscolhas)) {
      if (!Object.hasOwn(novas, id) && !Object.hasOwn(anteriores, id)) {
        erros.push('Valor de escolha inválido: ' + id)
      }
    }
  }
  return erros
}
