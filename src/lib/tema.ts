/** Tema visual (só deste aparelho). 'ceu' é o padrão. */
export type Tema = 'ceu' | 'classico'
export const TEMAS: { id: Tema; nome: string }[] = [{ id: 'ceu', nome: 'Céu estrelado' }, { id: 'classico', nome: 'Noite clássica' }]
export function temaAtual(): Tema {
  try { return localStorage.getItem('prg-tema') === 'classico' ? 'classico' : 'ceu' } catch { return 'ceu' }
}
export function aplicarTema(t: Tema) {
  try { localStorage.setItem('prg-tema', t) } catch {}
  if (t === 'classico') document.documentElement.dataset.tema = 'classico'
  else delete document.documentElement.dataset.tema
}
