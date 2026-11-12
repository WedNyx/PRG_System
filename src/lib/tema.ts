/**
 * Temas visuais (escolhidos em Central → Temas; valem para este aparelho). 'sonhos' (Estrelinhas sonhadoras) é o padrão.
 * Cada tema tem uma imagem para tela deitada (computador) e outra para tela em pé (celular),
 * aplicadas por CSS em globals.css ([data-tema] no <html>).
 */
export type Tema = 'sonhos' | 'classico' | 'algodao' | 'lua' | 'carmesim' | 'celestial' | 'prisma' | 'floresta' | 'mar' | 'taverna' | 'sombrio'
export const TEMA_PADRAO: Tema = 'sonhos'
/** matiz/intensidade: as cores da plataforma neste tema (iguais a --giro/--sat em globals.css; 300 = roxo original). */
export const TEMAS: { id: Tema; nome: string; descricao: string; mini: string; matiz: number; intensidade: number }[] = [
  { id: 'sonhos', nome: 'Estrelinhas sonhadoras', descricao: 'O tema da plataforma: estrelas sorridentes e lua dourada em nuvens roxas.', mini: 'url(/temas/sonhos-mini.webp) center / cover', matiz: 300, intensidade: 1 },
  { id: 'algodao', nome: 'Nuvens de algodão', descricao: 'Pôr do sol cor-de-rosa com lua crescente.', mini: 'url(/temas/algodao-mini.webp) center / cover', matiz: 338, intensidade: 1.1 },
  { id: 'lua', nome: 'Lua cheia', descricao: 'Noite azul, lua brilhante e nuvens escuras.', mini: 'url(/temas/lua-mini.webp) center / cover', matiz: 252, intensidade: 1.05 },
  { id: 'carmesim', nome: 'Céu carmesim', descricao: 'Via Láctea sobre um campo e um horizonte vermelho.', mini: 'url(/temas/carmesim-mini.webp) center / cover', matiz: 2, intensidade: 1.15 },
  { id: 'celestial', nome: 'Grimório celestial', descricao: 'Anil profundo com constelações douradas.', mini: 'url(/temas/celestial.svg) center / 200px auto, linear-gradient(160deg, #1b1446, #2a1650)', matiz: 278, intensidade: 1.1 },
  { id: 'prisma', nome: 'Prisma', descricao: 'Um feixe de luz atravessa o dado de cristal e vira um arco-íris de dados.', mini: 'url(/temas/prisma-mini.webp) center / cover', matiz: 300, intensidade: 0.55 },
  { id: 'floresta', nome: 'Floresta encantada', descricao: 'Árvores antigas, riacho, cogumelos que brilham e um arco de pedra com runas. Tudo em verde.', mini: 'url(/temas/floresta-mini.webp) center / cover', matiz: 155, intensidade: 1 },
  { id: 'mar', nome: 'Fundo do mar', descricao: 'Ruínas submersas, navio naufragado, águas-vivas e corais que brilham. Tudo em turquesa.', mini: 'url(/temas/mar-mini.webp) center / cover', matiz: 200, intensidade: 1.05 },
  { id: 'taverna', nome: 'Taverna', descricao: 'Lareira acesa, velas, lanternas e um mapa na mesa. Tudo em âmbar, como uma noite de jogo.', mini: 'url(/temas/taverna-mini.webp) center / cover', matiz: 60, intensidade: 1 },
  { id: 'sombrio', nome: 'Sombrio', descricao: 'Castelo gótico sob a lua vermelha, ruínas, corvos e chamas roxas. Roxo escuro com destaques em vermelho.', mini: 'url(/temas/sombrio-mini.webp) center / cover', matiz: 0, intensidade: 1.1 },
  { id: 'classico', nome: 'Noite clássica', descricao: 'Escuro e liso, sem imagem (mais leve).', mini: 'radial-gradient(ellipse at 85% 0%, #322044 0%, transparent 60%), #100d1c', matiz: 300, intensidade: 1 },
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
