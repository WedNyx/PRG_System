/**
 * Temas visuais (escolhidos em Central → Temas; valem para este aparelho). 'sonhos' (Estrelinhas sonhadoras) é o padrão.
 * Cada tema tem uma imagem para tela deitada (computador) e outra para tela em pé (celular),
 * aplicadas por CSS em globals.css ([data-tema] no <html>).
 */
export type Tema = 'sonhos' | 'classico' | 'algodao' | 'lua' | 'carmesim' | 'celestial' | 'prisma'
export const TEMA_PADRAO: Tema = 'sonhos'
export const TEMAS: { id: Tema; nome: string; descricao: string; mini: string }[] = [
  { id: 'sonhos', nome: 'Estrelinhas sonhadoras', descricao: 'O tema da plataforma: estrelas sorridentes e lua dourada em nuvens roxas.', mini: 'url(/temas/sonhos-mini.webp) center / cover' },
  { id: 'algodao', nome: 'Nuvens de algodão', descricao: 'Pôr do sol cor-de-rosa com lua crescente.', mini: 'url(/temas/algodao-mini.webp) center / cover' },
  { id: 'lua', nome: 'Lua cheia', descricao: 'Noite azul, lua brilhante e nuvens escuras.', mini: 'url(/temas/lua-mini.webp) center / cover' },
  { id: 'carmesim', nome: 'Céu carmesim', descricao: 'Via Láctea sobre um campo e um horizonte vermelho.', mini: 'url(/temas/carmesim-mini.webp) center / cover' },
  { id: 'celestial', nome: 'Grimório celestial', descricao: 'Anil profundo com constelações douradas.', mini: 'url(/temas/celestial.svg) center / 200px auto, linear-gradient(160deg, #1b1446, #2a1650)' },
  { id: 'prisma', nome: 'Prisma', descricao: 'Um feixe de luz atravessa o dado e vira arco-íris.', mini: 'url(/temas/prisma-pc.svg) center / cover' },
  { id: 'classico', nome: 'Noite clássica', descricao: 'Escuro e liso, sem imagem (mais leve).', mini: 'radial-gradient(ellipse at 85% 0%, #322044 0%, transparent 60%), #100d1c' },
]
const ehTema = (v: unknown): v is Tema => TEMAS.some(t => t.id === v)
export function temaAtual(): Tema {
  try { const t = localStorage.getItem('prg-tema'); return ehTema(t) ? t : TEMA_PADRAO } catch { return TEMA_PADRAO }
}
export function aplicarTema(t: Tema) {
  try { localStorage.setItem('prg-tema', t) } catch {}
  if (t === TEMA_PADRAO) delete document.documentElement.dataset.tema
  else document.documentElement.dataset.tema = t
}
/** Script que roda antes de desenhar a página (evita piscar o tema padrão). */
export const SCRIPT_TEMA = `try{var t=localStorage.getItem('prg-tema');if(${JSON.stringify(TEMAS.map(t => t.id).filter(t => t !== TEMA_PADRAO))}.indexOf(t)>=0)document.documentElement.dataset.tema=t}catch(e){}`
