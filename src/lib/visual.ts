/**
 * Aparência personalizada de cada perfil (v0.32.9): tema, foto de fundo, cor principal, cartões, fonte e tamanho.
 * Fica salva no perfil (coluna prg_public_adventurers.visual) e numa cópia local para aplicar antes de desenhar a página.
 */
import { imagemDaPlataforma } from './imagens'
import { TEMAS, type Tema } from './tema'

export type Fonte = 'fantasia' | 'elegante' | 'simples'
export type Tamanho = 'p' | 'm' | 'g'
export type Visual = {
  tema?: Tema
  /** Foto de fundo enviada pela pessoa (URL do armazenamento da plataforma). */
  fundo?: string | null
  /** Quanto escurecer a foto (0–85 %). */
  fundoEscuro?: number
  /** Desfoque da foto (0–16 px). */
  fundoDesfoque?: number
  /** Matiz da cor principal (0–359) ou null = a do tema. */
  cor?: number | null
  /** Intensidade das cores (0,3–1,6). */
  intensidade?: number
  /** Matiz dos cartões (0–359) ou null = acompanha a cor principal. */
  cartaoCor?: number | null
  /** Cartões mais escuros (−) ou mais claros (+): −0,08 a 0,12. */
  cartaoLuz?: number
  /** Opacidade dos cartões: 0,45 (bem transparente) a 1 (sólido). */
  cartaoAlfa?: number
  fonte?: Fonte
  tamanho?: Tamanho
}

export const FONTES: { id: Fonte; nome: string; descricao: string }[] = [
  { id: 'fantasia', nome: 'Fantasia', descricao: 'Letras de pergaminho antigo' },
  { id: 'elegante', nome: 'Elegante', descricao: 'Serifada e delicada' },
  { id: 'simples', nome: 'Simples', descricao: 'Moderna e direta' },
]
export const TAMANHOS: { id: Tamanho; nome: string }[] = [{ id: 'p', nome: 'Menor' }, { id: 'm', nome: 'Normal' }, { id: 'g', nome: 'Maior' }]
/** Cores prontas para escolher com um toque (matiz). */
export const CORES_PRONTAS: { nome: string; matiz: number }[] = [
  { nome: 'Roxo', matiz: 300 }, { nome: 'Violeta', matiz: 285 }, { nome: 'Azul', matiz: 255 }, { nome: 'Ciano', matiz: 210 },
  { nome: 'Verde', matiz: 155 }, { nome: 'Dourado', matiz: 85 }, { nome: 'Laranja', matiz: 50 }, { nome: 'Vermelho', matiz: 25 },
  { nome: 'Rosa', matiz: 350 }, { nome: 'Magenta', matiz: 330 },
]
/** Matizes das cores originais da plataforma (para calcular o giro). */
export const MATIZ_DESTAQUE = 300
export const MATIZ_CARTAO = 293

const num = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : undefined
const matiz = (v: unknown) => v === null ? null : typeof v === 'number' && Number.isFinite(v) ? ((Math.round(v) % 360) + 360) % 360 : undefined

/** Confere e limpa o que veio do navegador (ou do banco). Campos inválidos são descartados. */
export function limparVisual(v: unknown): Visual {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
  const o = v as Record<string, unknown>, r: Visual = {}
  if (TEMAS.some(t => t.id === o.tema)) r.tema = o.tema as Tema
  if (o.fundo === null || imagemDaPlataforma(o.fundo)) r.fundo = o.fundo as string | null
  const e = num(o.fundoEscuro, 0, 85); if (e !== undefined) r.fundoEscuro = Math.round(e)
  const d = num(o.fundoDesfoque, 0, 16); if (d !== undefined) r.fundoDesfoque = Math.round(d)
  const c = matiz(o.cor); if (c !== undefined) r.cor = c
  const i = num(o.intensidade, 0.3, 1.6); if (i !== undefined) r.intensidade = Math.round(i * 100) / 100
  const cc = matiz(o.cartaoCor); if (cc !== undefined) r.cartaoCor = cc
  const l = num(o.cartaoLuz, -0.08, 0.12); if (l !== undefined) r.cartaoLuz = Math.round(l * 1000) / 1000
  const a = num(o.cartaoAlfa, 0.45, 1); if (a !== undefined) r.cartaoAlfa = Math.round(a * 100) / 100
  if (FONTES.some(f => f.id === o.fonte)) r.fonte = o.fonte as Fonte
  if (TAMANHOS.some(t => t.id === o.tamanho)) r.tamanho = o.tamanho as Tamanho
  return r
}

/** Variáveis CSS que a personalização define no <html> (vazio = tudo do tema). */
export function variaveisDoVisual(v: Visual): Record<string, string> {
  const r: Record<string, string> = {}
  if (typeof v.cor === 'number') r['--giro'] = String(v.cor - 300) // 300 = MATIZ_DESTAQUE (número direto: esta função também roda no SCRIPT_VISUAL)
  if (typeof v.intensidade === 'number') r['--sat'] = String(v.intensidade)
  if (typeof v.cartaoCor === 'number') r['--cartao-giro'] = String(v.cartaoCor - 293) // MATIZ_CARTAO
  if (typeof v.cartaoLuz === 'number' && v.cartaoLuz !== 0) r['--cartao-luz'] = String(v.cartaoLuz)
  if (typeof v.cartaoAlfa === 'number') { r['--cartao-alfa'] = String(v.cartaoAlfa); if (v.cartaoAlfa >= 1) r['--vidro'] = '0px' }
  if (v.fundo) {
    const url = `url("${v.fundo}")`, escuro = (v.fundoEscuro ?? 40) / 100
    Object.assign(r, { '--tema-pc': url, '--tema-cel': url, '--tema-tam': 'cover', '--tema-rep': 'no-repeat', '--tema-pos': 'center', '--tema-pos-cel': 'center', '--tema-cor': '#0d0b16',
      '--tema-veu': `linear-gradient(180deg, rgba(8, 6, 16, ${escuro}), rgba(8, 6, 16, ${Math.min(0.95, escuro + 0.15)}))` })
    if (v.fundoDesfoque) r['--fundo-desfoque'] = v.fundoDesfoque + 'px'
  }
  return r
}

/**
 * Aplica no <html>. Escrito sem dependências para também rodar no script que vem antes da página (SCRIPT_VISUAL).
 * `vars` já vem calculado por variaveisDoVisual.
 */
export function aplicarNoHtml(el: HTMLElement, vars: Record<string, string>, fonte?: string, tamanho?: string) {
  const velhas = (el.dataset.visualVars || '').split(',').filter(Boolean)
  for (const k of velhas) el.style.removeProperty(k)
  const novas = Object.keys(vars)
  for (const k of novas) el.style.setProperty(k, vars[k])
  el.dataset.visualVars = novas.join(',')
  if (fonte && fonte !== 'fantasia') el.dataset.fonte = fonte; else delete el.dataset.fonte
  if (tamanho && tamanho !== 'm') el.dataset.tamanho = tamanho; else delete el.dataset.tamanho
}

const CHAVE = 'prg-visual-'
/** Aplica o visual (e o tema dele, se houver) e guarda a cópia local deste perfil. */
export function aplicarVisual(perfilId: string | null, v: Visual, guardar = true) {
  if (typeof document === 'undefined') return
  const el = document.documentElement
  if (v.tema) { if (v.tema === 'sonhos') delete el.dataset.tema; else el.dataset.tema = v.tema; try { localStorage.setItem('prg-tema', v.tema) } catch {} }
  aplicarNoHtml(el, variaveisDoVisual(v), v.fonte, v.tamanho)
  if (guardar && perfilId) try { localStorage.setItem(CHAVE + perfilId, JSON.stringify(v)) } catch {}
}
export function visualGuardado(perfilId: string): Visual {
  try { return limparVisual(JSON.parse(localStorage.getItem(CHAVE + perfilId) || 'null')) } catch { return {} }
}

/** Roda antes de desenhar a página: aplica o visual guardado do perfil escolhido (evita piscar). */
export const SCRIPT_VISUAL = `try{(function(){var id=localStorage.getItem('prg-aventureiro-selecionado-v1');if(!id)return;var v=JSON.parse(localStorage.getItem('${CHAVE}'+id)||'null');if(!v)return;var vars=(${variaveisDoVisual.toString()})(v);(${aplicarNoHtml.toString()})(document.documentElement,vars,v.fonte,v.tamanho);if(v.tema){if(v.tema==='sonhos')delete document.documentElement.dataset.tema;else document.documentElement.dataset.tema=v.tema}})()}catch(e){}`
