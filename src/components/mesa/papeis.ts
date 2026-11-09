/** Cor e símbolo de cada papel no chat e nas listas da mesa. */
export const PAPEL_ESTILO: Record<string, { nome: string; icone: string; cor: string }> = {
  mestre: { nome: 'Mestre', icone: '👑', cor: 'text-amber-300' },
  comestre: { nome: 'Co-mestre', icone: '👑', cor: 'text-amber-200' },
  jogador: { nome: 'Jogador', icone: '⚔️', cor: 'text-sky-300' },
  espectador: { nome: 'Espectador', icone: '👁️', cor: 'text-emerald-300' },
}
export const estiloPapel = (papel?: string | null) => PAPEL_ESTILO[papel ?? ''] ?? PAPEL_ESTILO.jogador
