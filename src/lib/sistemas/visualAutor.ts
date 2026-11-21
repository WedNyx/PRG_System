import { imagemDaPlataforma } from '../imagens'
import { lerMontagem } from './montagemFicha'
import type { Sistema, VisualAutor } from './tipos'

/** Desenhos de árvore que o autor pode escolher (os mesmos dos sistemas prontos). */
export const ARVORES_VISUAIS: { id: string; nome: string }[] = [
  { id: '', nome: 'O do visual do sistema' }, { id: 'padrao', nome: '🌳 Raízes' }, { id: 'nova', nome: '⬡ Rede de circuitos' },
  { id: 'ordem-paranormal', nome: '🕯️ Círculo ritual' }, { id: 'opositores', nome: '✨ Constelação' }, { id: 'tormenta20', nome: '⚡ Tempestade' },
  { id: 'pf2e', nome: '🛡️ Estandartes' }, { id: 'faroeste-arcano', nome: '🌵 Trilha' }, { id: 'call-of-cthulhu', nome: '🧵 Quadro de pistas' },
  { id: 'fate-core', nome: '✦ Escada' }, { id: 'blades', nome: '🏮 Becos' }, { id: 'mork-borg', nome: '💀 Ruína' }, { id: 'marcas', nome: '🐾 Rastro' },
]
const COR = /^#[0-9a-f]{6}$/i
const FONTES = ['serifada', 'classica', 'moderna', 'mono'] as const
const um = <T extends string>(v: unknown, lista: readonly T[]): T | undefined => lista.includes(v as T) ? v as T : undefined
/** Limpa a aparência vinda do construtor (cores, letras, imagens só da plataforma, formatos e montagem). */
export function lerVisualAutor(v: unknown): Sistema['visual'] | undefined {
  const o = v && typeof v === 'object' ? v as Record<string, unknown> : {}
  const out: VisualAutor = {}
  for (const k of ['acento', 'borda', 'cartao', 'texto', 'fundo'] as const) if (typeof o[k] === 'string' && COR.test(o[k] as string)) out[k] = (o[k] as string).toLowerCase()
  const fonte = um(o.fonte, FONTES), corpo = um(o.fonteCorpo, FONTES)
  if (fonte) out.fonte = fonte
  if (corpo) out.fonteCorpo = corpo
  if (typeof o.arvore === 'string' && ARVORES_VISUAIS.some(a => a.id && a.id === o.arvore)) out.arvore = o.arvore
  for (const k of ['fundoImagem', 'logo', 'molduraImagem'] as const) if (imagemDaPlataforma(o[k])) out[k] = o[k] as string
  if (out.fundoImagem && typeof o.fundoEscuro === 'number' && Number.isFinite(o.fundoEscuro)) out.fundoEscuro = Math.max(0, Math.min(90, Math.round(o.fundoEscuro)))
  const moldura = um(o.moldura, ['dupla', 'ornamento', 'pergaminho', 'neon', 'imagem'] as const)
  if (moldura && (moldura !== 'imagem' || out.molduraImagem)) out.moldura = moldura
  const cartao = um(o.cartaoEstilo, ['vidro', 'contorno', 'pergaminho'] as const); if (cartao) out.cartaoEstilo = cartao
  if (typeof o.raio === 'number' && Number.isFinite(o.raio)) out.raio = Math.max(0, Math.min(32, Math.round(o.raio)))
  const brilho = um(o.brilho, ['suave', 'forte'] as const); if (brilho) out.brilho = brilho
  const atr = um(o.atributosEstilo, ['circulo', 'hexagono', 'escudo', 'losango'] as const); if (atr) out.atributosEstilo = atr
  const barras = um(o.barrasEstilo, ['fina', 'grossa', 'brilho', 'segmentada'] as const); if (barras) out.barrasEstilo = barras
  const montagem = lerMontagem(o.montagem); if (montagem) out.montagem = montagem
  return Object.keys(out).length ? out : undefined
}
export { FONTES_AUTOR } from './montagemFicha'

/** Temas prontos do estúdio: um ponto de partida que o autor ajusta depois. */
export const TEMAS_ESTUDIO: { id: string; nome: string; visual: VisualAutor }[] = [
  { id: 'pergaminho', nome: '📜 Pergaminho', visual: { acento: '#7a3b12', borda: '#8a6a3a', cartao: '#e9dcc0', texto: '#2a1d10', fundo: '#3b2a18', fonte: 'serifada', fonteCorpo: 'serifada', cartaoEstilo: 'pergaminho', moldura: 'pergaminho', raio: 6, barrasEstilo: 'segmentada' } },
  { id: 'neon', nome: '🌆 Neon', visual: { acento: '#29f0ff', borda: '#2a6a8a', cartao: '#0b1020', texto: '#d8f6ff', fundo: '#05060f', fonte: 'moderna', fonteCorpo: 'moderna', cartaoEstilo: 'vidro', moldura: 'neon', raio: 14, brilho: 'suave', atributosEstilo: 'hexagono', barrasEstilo: 'brilho' } },
  { id: 'gotico', nome: '🦇 Gótico', visual: { acento: '#c4142c', borda: '#4a1a22', cartao: '#140b0e', texto: '#e8d6d9', fundo: '#070405', fonte: 'classica', cartaoEstilo: 'contorno', moldura: 'ornamento', raio: 2, atributosEstilo: 'escudo', barrasEstilo: 'fina' } },
  { id: 'floresta', nome: '🌿 Floresta', visual: { acento: '#8fd16a', borda: '#3d5a32', cartao: '#13201a', texto: '#e2f0da', fundo: '#0a130e', fonte: 'serifada', raio: 20, brilho: 'suave', atributosEstilo: 'circulo' } },
  { id: 'oceano', nome: '🌊 Oceano', visual: { acento: '#5cc8ff', borda: '#24557a', cartao: '#0d1c2c', texto: '#d9efff', fundo: '#061019', fonte: 'moderna', cartaoEstilo: 'vidro', raio: 18, barrasEstilo: 'grossa' } },
  { id: 'terminal', nome: '💾 Terminal', visual: { acento: '#39ff7a', borda: '#1d5a30', cartao: '#050a06', texto: '#b6ffcb', fundo: '#000000', fonte: 'mono', fonteCorpo: 'mono', cartaoEstilo: 'contorno', raio: 0, barrasEstilo: 'segmentada', atributosEstilo: 'losango' } },
]
