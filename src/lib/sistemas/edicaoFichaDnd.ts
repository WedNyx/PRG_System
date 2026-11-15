/**
 * Rótulo da edição mostrada pela ficha. O id do sistema permanece dnd5e-srd
 * para preservar armazenamento, mas o nome visual vem do livro-base efetivo.
 */
import type { DadosFicha, Sistema } from './tipos'
import { lerLivrosDnd, type LivroBaseDnd } from './dndLivros'

export function edicaoEfetivaDaFicha(
  sistema: Pick<Sistema,'id'> | null | undefined,
  dados: Pick<DadosFicha,'dndLivros'> | null | undefined,
  livroBaseCampanha?: LivroBaseDnd | null,
): LivroBaseDnd | null {
  if(sistema?.id!=='dnd5e-srd')return null
  return livroBaseCampanha??lerLivrosDnd(dados?.dndLivros).base
}
export function tituloSistemaNaFicha(
  sistema: Pick<Sistema,'id'|'nome'> | null | undefined,
  dados: Pick<DadosFicha,'dndLivros'> | null | undefined,
  livroBaseCampanha?: LivroBaseDnd | null,
): string {
  const edicao=edicaoEfetivaDaFicha(sistema,dados,livroBaseCampanha)
  if(edicao==='phb2014')return 'D&D 2014 (SRD 5.1 / Livro do Jogador)'
  if(edicao==='phb2024')return 'D&D 2024 (SRD 5.2.1 / Livro do Jogador)'
  return sistema?.nome??'…'
}
