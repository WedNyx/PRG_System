/**
 * Estúdio da ficha (v0.36.6): o autor de um sistema monta a ficha do jeito dele — ordem, ícone e visibilidade das abas;
 * ordem, largura, nome e visibilidade de cada parte; cores, letras, imagens e formatos.
 * Tudo vira CSS a partir de valores conferidos (listas fechadas, cores #rrggbb, números com limite e imagens do próprio
 * armazenamento da plataforma), então o autor não consegue injetar código na ficha de ninguém.
 */
import { imagemDaPlataforma } from '../imagens'
import type { LarguraBloco, MontagemFicha, VisualAutor } from './tipos'

/** Abas que o autor pode reordenar, renomear, trocar o ícone e esconder (a Principal nunca some). */
export const ABAS_FICHA: { id: string; nome: string; icone: string }[] = [
  { id: 'principal', nome: 'Principal', icone: '❤️' }, { id: 'atributos', nome: 'Atributos e perícias', icone: '✨' },
  { id: 'marcas', nome: 'Marcas', icone: '🐾' }, { id: 'formas', nome: 'Transformações', icone: '🐺' }, { id: 'invocacoes', nome: 'Invocações', icone: '🐻' },
  { id: 'efeitos', nome: 'Efeitos', icone: '⏳' }, { id: 'habilidades', nome: 'Poderes e habilidades', icone: '🌌' }, { id: 'arvore', nome: 'Árvore de habilidades', icone: '🌠' },
  { id: 'equipamentos', nome: 'Inventário', icone: '🎒' }, { id: 'anotacoes', nome: 'Anotações e regras', icone: '📜' },
]

/** Partes de cada aba que o autor pode mexer. `titulo` = dá para trocar o nome que aparece na ficha. */
export const BLOCOS_FICHA: Record<string, { id: string; nome: string; titulo?: string }[]> = {
  principal: [
    { id: 'faixa', nome: 'Faixa do sistema' }, { id: 'extras', nome: 'Resumo das partes extras' }, { id: 'identidade', nome: 'Identidade e retrato' },
    { id: 'paineis', nome: 'Painel especial (se houver)' }, { id: 'recursos', nome: 'Valores e recursos', titulo: 'Valores e recursos' }, { id: 'acoes', nome: 'Ações rápidas' },
  ],
  atributos: [
    { id: 'atributos', nome: 'Atributos' }, { id: 'teste', nome: 'Teste de atributo', titulo: 'Teste de atributo' },
    { id: 'resistencia', nome: 'Resistência (parada de dados)', titulo: 'Resistência' }, { id: 'pericias', nome: 'Perícias' },
  ],
  habilidades: [{ id: 'poderes', nome: 'Poderes e habilidades' }, { id: 'notas', nome: 'Anotações complementares' }],
  equipamentos: [{ id: 'inventario', nome: 'Inventário' }, { id: 'notas', nome: 'Anotações complementares' }],
  anotacoes: [
    { id: 'textos', nome: 'Espaços de texto' }, { id: 'tabelas', nome: 'Tabelas para rolar' }, { id: 'regras', nome: 'Regras do sistema' },
    { id: 'autor', nome: 'Sobre o autor' }, { id: 'creditos', nome: 'Observações e créditos' },
  ],
}
export const LARGURAS: { valor: LarguraBloco; nome: string }[] = [{ valor: 12, nome: 'Inteira' }, { valor: 8, nome: '⅔' }, { valor: 6, nome: '½' }, { valor: 4, nome: '⅓' }]

const ICONE = /^[^<>{}()"'`\\;]{1,8}$/u
const texto = (v: unknown, max: number) => typeof v === 'string' && v.trim() && !/[<>{}]/.test(v) ? v.trim().slice(0, max) : undefined

/** Limpa a montagem vinda do construtor: só abas e partes conhecidas, números com limite. */
export function lerMontagem(v: unknown): MontagemFicha | undefined {
  const o = v && typeof v === 'object' ? v as Record<string, unknown> : {}
  const out: MontagemFicha = {}
  if (Array.isArray(o.secoes)) {
    const vistas = new Set<string>()
    const secoes = o.secoes.flatMap(x => {
      const s = x && typeof x === 'object' ? x as Record<string, unknown> : {}
      const id = typeof s.id === 'string' && ABAS_FICHA.some(a => a.id === s.id) && !vistas.has(s.id) ? s.id : null
      if (!id) return []
      vistas.add(id)
      const icone = typeof s.icone === 'string' && ICONE.test(s.icone.trim()) ? s.icone.trim() : undefined
      return [{ id, ...(s.oculta === true && id !== 'principal' ? { oculta: true } : {}), ...(icone ? { icone } : {}) }]
    })
    if (secoes.length) out.secoes = secoes
  }
  if (o.blocos && typeof o.blocos === 'object') {
    const blocos: NonNullable<MontagemFicha['blocos']> = {}
    for (const [chave, b] of Object.entries(o.blocos as Record<string, unknown>)) {
      const [sec, id] = chave.split('.')
      const def = BLOCOS_FICHA[sec]?.find(x => x.id === id)
      if (!def || !b || typeof b !== 'object') continue
      const x = b as Record<string, unknown>
      const ordem = typeof x.ordem === 'number' && Number.isInteger(x.ordem) && x.ordem >= 1 && x.ordem <= 50 ? x.ordem : undefined
      const largura = LARGURAS.some(l => l.valor === x.largura) ? x.largura as LarguraBloco : undefined
      const titulo = def.titulo ? texto(x.titulo, 40) : undefined
      const item = { ...(ordem ? { ordem } : {}), ...(largura && largura !== 12 ? { largura } : {}), ...(x.oculto === true ? { oculto: true } : {}), ...(titulo ? { titulo } : {}) }
      if (Object.keys(item).length) blocos[chave] = item
    }
    if (Object.keys(blocos).length) out.blocos = blocos
  }
  return Object.keys(out).length ? out : undefined
}

/** Abas na ordem do autor, com o ícone dele e sem as escondidas. A Principal sempre fica. */
export function ordenarAbas<T extends { id: string; icone: string }>(abas: readonly T[], m?: MontagemFicha): T[] {
  if (!m?.secoes?.length) return [...abas]
  const pos = (id: string) => { const i = m.secoes!.findIndex(x => x.id === id); return i < 0 ? 999 + abas.findIndex(a => a.id === id) : i }
  return abas.filter(a => a.id === 'principal' || !m.secoes!.find(x => x.id === a.id)?.oculta)
    .map(a => { const ic = m.secoes!.find(x => x.id === a.id)?.icone; return ic ? { ...a, icone: ic } : a })
    .sort((a, b) => pos(a.id) - pos(b.id))
}
/** Partes de uma aba na ordem do autor. */
export function blocosEmOrdem(secao: string, m?: MontagemFicha) {
  const lista = BLOCOS_FICHA[secao] ?? []
  const ordem = (id: string, i: number) => m?.blocos?.[secao + '.' + id]?.ordem ?? i + 1
  return lista.map((b, i) => ({ ...b, ordem: ordem(b.id, i), cfg: m?.blocos?.[secao + '.' + b.id] ?? {} })).sort((a, b) => a.ordem - b.ordem || (b.cfg.ordem ? 1 : 0) - (a.cfg.ordem ? 1 : 0))
}
/** Nome que o autor deu a uma parte (ou o padrão). */
export const tituloDoBloco = (m: MontagemFicha | undefined, chave: string, padrao: string) => m?.blocos?.[chave]?.titulo || padrao

// ---------------------------------------------------------------- CSS

const COR = /^#[0-9a-f]{6}$/i
export const FONTES_AUTOR: Record<string, string> = {
  serifada: 'var(--font-cormorant), Georgia, serif', classica: 'var(--font-cinzel), Georgia, serif',
  moderna: 'var(--font-inter), system-ui, sans-serif', mono: 'var(--font-geist-mono), ui-monospace, monospace',
}
/** Cor escura? (para clarear os campos quando o texto escolhido é escuro). */
export function corEscura(hex: string) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.45
}
const FORMAS: Record<string, string> = {
  hexagono: 'polygon(25% 2%,75% 2%,100% 50%,75% 98%,25% 98%,0 50%)',
  escudo: 'polygon(0 0,100% 0,100% 62%,50% 100%,0 62%)',
  losango: 'polygon(50% 0,100% 50%,50% 100%,0 50%)',
}

/** CSS da aparência do autor, preso à ficha dele ([data-ficha-autor]). Só usa valores já conferidos por lerVisualAutor. */
export function cssDoVisual(v: VisualAutor | undefined): string {
  if (!v) return ''
  const R = '[data-ficha-autor]', P = `${R} .ficha-painel`, r: string[] = []
  const cor = (x?: string) => x && COR.test(x) ? x : undefined
  const img = (x?: string) => x && imagemDaPlataforma(x) ? x : undefined
  // Fundo da página da ficha
  const fundo = cor(v.fundo), fi = img(v.fundoImagem), esc = Math.max(0, Math.min(90, Math.round(v.fundoEscuro ?? 45))) / 100
  if (fundo || fi) r.push(`${R} .ficha-fundo{background:${fi ? `linear-gradient(rgba(0,0,0,${esc}),rgba(0,0,0,${esc})),url("${fi}") center/cover no-repeat,` : ''}${fundo ?? '#0d0b14'};}`)
  // Letras
  if (v.fonteCorpo && FONTES_AUTOR[v.fonteCorpo]) r.push(`${R}{font-family:${FONTES_AUTOR[v.fonteCorpo]};}`)
  const tx = cor(v.texto)
  if (tx) {
    r.push(`${P},${P} :is(label,p,span,li,summary,strong,h3,dt,dd,input,textarea,select){color:${tx};}`)
    if (corEscura(tx)) r.push(`${P} :is(input,textarea,select){background:#ffffffb3;border-color:${tx}55;}`)
  }
  // Cartões
  if (v.cartaoEstilo === 'vidro') r.push(`${P}{background:color-mix(in oklab,var(--ficha-cartao) 62%,transparent);backdrop-filter:blur(12px);}`)
  if (v.cartaoEstilo === 'contorno') r.push(`${P}{background:transparent;border-width:2px;}`)
  if (v.cartaoEstilo === 'pergaminho') r.push(`${P}{background:radial-gradient(ellipse at 50% 0%,#ffffff14,transparent 60%),linear-gradient(180deg,color-mix(in oklab,var(--ficha-cartao) 90%,#c9a46a),var(--ficha-cartao));box-shadow:inset 0 0 40px #0007;}`)
  const raio = typeof v.raio === 'number' ? Math.max(0, Math.min(32, Math.round(v.raio))) : null
  if (raio !== null) r.push(`${P},${R} :is(.ficha-recurso,.ficha-valor,.ficha-atributo-percentual,.ficha-pericia,.ficha-recurso-trilho){border-radius:${raio}px;}`)
  const sombras: string[] = []
  if (v.moldura === 'dupla') r.push(`${P}{border-style:double;border-width:5px;}`)
  if (v.moldura === 'ornamento') sombras.push('inset 0 0 0 4px var(--ficha-cartao)', 'inset 0 0 0 5px var(--ficha-acento)')
  if (v.moldura === 'pergaminho') { r.push(`${P}{border:2px solid #8a6a3a;}`); sombras.push('inset 0 0 0 1px #c9a46a66', 'inset 0 0 28px #0008') }
  if (v.moldura === 'neon') { r.push(`${P}{border-color:var(--ficha-acento);}`); sombras.push('0 0 14px color-mix(in oklab,var(--ficha-acento) 70%,transparent)', 'inset 0 0 10px color-mix(in oklab,var(--ficha-acento) 40%,transparent)') }
  const mi = img(v.molduraImagem)
  if (v.moldura === 'imagem' && mi) r.push(`${P}{border-style:solid;border-width:14px;border-image:url("${mi}") 30 round;}`)
  if (v.brilho) sombras.push(`0 0 ${v.brilho === 'forte' ? 34 : 18}px color-mix(in oklab,var(--ficha-acento) ${v.brilho === 'forte' ? 45 : 25}%,transparent)`)
  if (sombras.length) r.push(`${P}{box-shadow:${sombras.join(',')};}`)
  // Atributos
  const forma = v.atributosEstilo
  if (forma === 'circulo') r.push(`${R} .ficha-atributo-percentual{border-radius:9999px;aspect-ratio:1;display:flex;flex-direction:column;justify-content:center;}`)
  else if (forma && FORMAS[forma]) r.push(`${R} .ficha-atributo-percentual{clip-path:${FORMAS[forma]};aspect-ratio:1;display:flex;flex-direction:column;justify-content:center;padding-inline:18%;border:0;background:linear-gradient(160deg,color-mix(in oklab,var(--ficha-acento) 30%,var(--ficha-cartao)),var(--ficha-cartao));}`)
  // Barras
  const T = `${R} .ficha-recurso-trilho`
  if (v.barrasEstilo === 'fina') r.push(`${T}{height:1.5rem;}`)
  if (v.barrasEstilo === 'grossa') r.push(`${T}{height:3.25rem;}`)
  if (v.barrasEstilo === 'brilho') r.push(`${T}{box-shadow:0 0 14px color-mix(in oklab,var(--ficha-acento) 55%,transparent);border-color:var(--ficha-acento);}`)
  if (v.barrasEstilo === 'segmentada') r.push(`${T}::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(90deg,transparent 0 calc(10% - 2px),#000a calc(10% - 2px) 10%);}`)
  r.push(cssDaMontagem(v.montagem))
  return r.filter(Boolean).join('\n')
}

/** Ordem, largura e visibilidade das partes. Larguras só valem quando a coluna da ficha é larga (container query). */
export function cssDaMontagem(m?: MontagemFicha): string {
  if (!m?.blocos) return ''
  const R = '[data-ficha-autor][data-modo]', secoes = new Set(Object.keys(m.blocos).map(k => k.split('.')[0]))
  const r: string[] = [], largas: string[] = []
  for (const sec of secoes) {
    const G = `${R} .ficha-blocos[data-secao="${sec}"]`
    r.push(`${G}{display:grid;grid-template-columns:minmax(0,1fr);gap:1rem;}`, `${G}>*{margin:0!important;min-width:0;grid-column:1/-1;}`)
    largas.push(`${G}{grid-template-columns:repeat(12,minmax(0,1fr));align-items:start;}`)
    for (const [i, b] of blocosEmOrdem(sec, m).entries()) {
      const S = `${G}>[data-bloco="${b.id}"]`
      r.push(`${S}{order:${i + 1};}`)
      if (b.cfg.oculto) r.push(`${S}{display:none!important;}`)
      if (b.cfg.largura && b.cfg.largura !== 12) { r.push(`${S}{container:bloco / inline-size;}`); largas.push(`${S}{grid-column:span ${b.cfg.largura};}`) }
    }
  }
  return r.join('\n') + (largas.length ? `\n@container ficha (min-width: 560px){${largas.join('')}}` : '')
}
