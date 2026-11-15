/**
 * Limites do jogador em árvores personalizadas de campanha D&D.
 * A definição e os pontos são do mestre; o jogador só muda desbloqueios
 * válidos conforme pré-requisitos, nível e orçamento de pontos.
 */
import { devolverNo, lerArvore, liberarNo, type Arvore } from './arvore'
import type { DadosFicha } from './tipos'

const mesmosIds = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every(x => b.includes(x))

export function alterouDefinicaoArvore(antes: unknown, depois: unknown): boolean {
  const a = lerArvore(antes), b = lerArvore(depois)
  return a.pontos !== b.pontos
    || JSON.stringify(a.nos) !== JSON.stringify(b.nos)
    || !mesmosIds(a.concedidos ?? [], b.concedidos ?? [])
}

/**
 * Retorna a razão da rejeição, sem alterar o armazenamento.
 * Valida também vários desbloqueios feitos durante o debounce do autosave.
 */
export function validarDesbloqueiosArvore(
  antes: unknown,
  depois: unknown,
  dados: Pick<DadosFicha, 'campos' | 'dndEscolhas' | 'dndMulticlasse'>,
  extra = 0,
): string | null {
  if (alterouDefinicaoArvore(antes, depois))
    return 'Somente o mestre pode criar, editar ou excluir habilidades, conceder pontos e mudar concessões.'

  const original = lerArvore(antes), pedido = lerArvore(depois)
  if (mesmosIds(original.liberados, pedido.liberados)) return null
  let atual: Arvore = original
  const nivel = Math.max(1, Math.floor(Number(dados.campos?.nivel) || 1))

  // Primeiro devolve os nós removidos (mais profundos primeiro).
  const remover = [...original.liberados].reverse().filter(id => !pedido.liberados.includes(id))
  for (const id of remover) {
    const resultado = devolverNo(atual, id)
    if (!resultado.arvore) return resultado.erro || 'Não foi possível devolver os pontos deste nó.'
    atual = resultado.arvore
  }

  // Depois desbloqueia, seguindo a ordem em que o jogador fez suas escolhas.
  for (const id of pedido.liberados.filter(id => !original.liberados.includes(id))) {
    const resultado = liberarNo(atual, id, extra, nivel, dados)
    if (!resultado.arvore) return resultado.erro || 'Este nó não pode ser desbloqueado.'
    atual = resultado.arvore
  }

  return mesmosIds(atual.liberados, pedido.liberados) ? null : 'A sequência de desbloqueios é inválida.'
}
