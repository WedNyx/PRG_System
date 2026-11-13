import type { DadosFicha } from './tipos'
import { progressaoVisivel, type ProgressoDnd } from './dnd2024Progressao'
import { MARCOS_DND_2024 } from './dnd2024Marcos'
import { classesDaFicha, idDe } from './dnd2024Classes'
import { fontePermitida, nomeDaFonte } from './dnd2024Fontes'

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

export function progressoDaFichaDnd(d: Pick<DadosFicha, 'campos' | 'dndEscolhas' | 'dndMulticlasse'>): ProgressoDnd {
  const { lista, total } = classesDaFicha(d)
  const classeLivre = idDe(d.campos.classe)
  return {
    // Classe fora do catálogo (digitada à mão) continua contando o nível total, como antes.
    nivelPorClasse: lista.length ? Object.fromEntries(lista.map(c => [c.cls.id, c.nivel])) : classeLivre ? { [classeLivre]: total } : {},
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
  antes: Pick<DadosFicha, 'campos' | 'dndEscolhas' | 'dndMulticlasse'>,
  depois: Pick<DadosFicha, 'campos' | 'dndEscolhas' | 'dndMulticlasse'>,
  /** Fontes liberadas pelo mestre (null = ficha avulsa ou mestre: todas). */
  liberadas: Set<string> | null = null,
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
    if (marco.estado !== 'adquirido') { erros.push('Opção não reconhecida para a característica: ' + id); continue }
    const fonte = marco.opcoes?.find(o => o.id === opcao)?.fonte
    if (!fontePermitida(fonte, liberadas)) erros.push(`${marco.nome}: a fonte “${nomeDaFonte(fonte!)}” não foi liberada pelo mestre nesta campanha.`)
  }

  // A classe inicial não pode escolher a mesma perícia em dois espaços.
  // Validar somente se um desses espaços mudou; não bloquear correções de fichas legadas.
  const classeInicial = Object.keys(estado.nivelPorClasse)[0] ?? ''
  const idsClasse = Object.keys(novas).filter(id => id.startsWith(classeInicial + '-pericia-'))
  if (idsClasse.some(id => novas[id] !== anteriores[id])) {
    const vistos = new Set<string>()
    for (const id of idsClasse) {
      if (vistos.has(novas[id])) erros.push('Perícia escolhida mais de uma vez na classe inicial: ' + novas[id])
      vistos.add(novas[id])
    }
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
