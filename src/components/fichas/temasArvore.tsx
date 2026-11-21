/**
 * O jeito de cada árvore (v0.36.2): a mesma árvore de marcos, com a cara de cada sistema.
 * D&D tem a Yggdrasil própria (ArvoreDndOficial). Só visual: nada aqui muda regra.
 */
import type { CSSProperties, ReactNode } from 'react'

export type Lado = 'center' | 'left' | 'right'
type Ligacao = 'raiz' | 'reta' | 'curva' | 'raio' | 'fio' | 'serrilha' | 'pegadas' | 'trilha'
export type TemaArvore = {
  /** Nome do jeito de ver (botão ao lado de “Lista”). */
  nome: string
  fundo: string
  /** Desenho de fundo (círculo ritual, lua, nuvens…). */
  decoracao?: ReactNode
  ligacao: Ligacao; cor: string; espessura: number
  /** Classes do marco e as cores dos textos. */
  no: string; noAtivo: string; titulo: string; sub: string; selo: string
  /** Forma do marco (clip-path) e se ele “pende” um pouco (bilhetes, placas). */
  forma?: string; torto?: boolean
  rodape?: ReactNode
}
const X: Record<Lado, number> = { center: 150, left: 75, right: 225 }

/** Liga o centro deste marco ao do próximo (o SVG passa da caixa do item). */
export function caminhoLigacao(t: TemaArvore, de: Lado, para: Lado): ReactNode {
  const x1 = X[de], y1 = 48, x2 = X[para], y2 = 208, mx = (x1 + x2) / 2, my = (y1 + y2) / 2
  const traco = { fill: 'none', stroke: t.cor, strokeWidth: t.espessura, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (t.ligacao) {
    case 'reta': return <><path d={`M${x1} ${y1} L${x2} ${y2}`} {...traco} strokeOpacity={.35} strokeWidth={t.espessura * 4} /><path d={`M${x1} ${y1} L${x2} ${y2}`} {...traco} /></>
    case 'curva': return <path d={`M${x1} ${y1} C${x1} ${y1 + 70} ${x2} ${y2 - 70} ${x2} ${y2}`} {...traco} />
    case 'raio': { const p = [0, .22, .4, .62, .8, 1].map((k, i) => `${x1 + (x2 - x1) * k + (i % 2 ? 22 : i && i < 5 ? -22 : 0)} ${y1 + (y2 - y1) * k}`)
      return <><path d={'M' + p.join(' L')} {...traco} strokeOpacity={.3} strokeWidth={t.espessura * 4} /><path d={'M' + p.join(' L')} {...traco} /></> }
    case 'serrilha': { const p = Array.from({ length: 9 }, (_, i) => `${x1 + (x2 - x1) * i / 8 + (i % 2 ? 9 : -9) * (i && i < 8 ? 1 : 0)} ${y1 + (y2 - y1) * i / 8}`); return <path d={'M' + p.join(' L')} {...traco} /> }
    case 'fio': return <path d={`M${x1} ${y1} Q${mx + (x1 === x2 ? 34 : 0)} ${my + 34} ${x2} ${y2}`} {...traco} />
    case 'pegadas': return <path d={`M${x1} ${y1} C${x1} ${y1 + 70} ${x2} ${y2 - 70} ${x2} ${y2}`} {...traco} strokeDasharray="0.1 16" strokeWidth={t.espessura * 2.4} />
    case 'trilha': return <path d={`M${x1} ${y1} C${x1 + 40} ${y1 + 60} ${x2 - 40} ${y2 - 60} ${x2} ${y2}`} {...traco} strokeDasharray="10 9" />
    default: return null
  }
}

const estrelas: CSSProperties = { backgroundImage: 'radial-gradient(#fff 1px, transparent 1.4px), radial-gradient(#ddc58d 1px, transparent 1.5px)', backgroundSize: '53px 61px, 97px 89px', backgroundPosition: '0 0, 31px 17px', opacity: .35 }

export const TEMAS_ARVORE: Record<string, TemaArvore> = {
  /* Ordem Paranormal: círculo ritual, sangue e selos. */
  'ordem-paranormal': {
    nome: '🕯️ Círculo ritual', fundo: 'bg-[radial-gradient(ellipse_at_50%_35%,#3a0b14_0%,#16070b_60%,#050304_100%)] border-red-500/30',
    decoracao: <svg aria-hidden className="pointer-events-none absolute left-1/2 top-6 h-[22rem] w-[22rem] -translate-x-1/2 opacity-[.18]" viewBox="0 0 200 200" fill="none" stroke="#ff3b4e" strokeWidth=".8">
      <circle cx="100" cy="100" r="96" /><circle cx="100" cy="100" r="84" strokeDasharray="2 3" /><circle cx="100" cy="100" r="50" />
      <path d="M100 16 L180 128 L20 128 Z M100 184 L20 72 L180 72 Z" />{Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return <text key={i} x={100 + 90 * Math.sin(a)} y={103 - 90 * Math.cos(a)} fontSize="7" fill="#ff3b4e" stroke="none" textAnchor="middle">{'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃ'[i]}</text> })}
    </svg>,
    ligacao: 'reta', cor: '#d1203a', espessura: 2,
    no: 'border-red-500/70 bg-[#1a080c] hover:bg-[#2a0c13] shadow-[0_0_24px_#c0263a55]', noAtivo: 'bg-[#3a0c16] ring-2 ring-red-400/60',
    titulo: 'text-red-50', sub: 'text-red-200/80', selo: 'border-red-500/80 bg-[#0d0406] text-red-300', forma: 'polygon(10% 0,90% 0,100% 50%,90% 100%,10% 100%,0 50%)',
  },
  /* Opositores: constelações sob a lua. */
  opositores: {
    nome: '✨ Constelação', fundo: 'bg-[radial-gradient(ellipse_at_70%_10%,#2d2552_0%,#120f2a_55%,#07061a_100%)] border-[#ddc58d]/30',
    decoracao: <><div aria-hidden className="pointer-events-none absolute inset-0" style={estrelas} />
      <svg aria-hidden className="pointer-events-none absolute right-4 top-4 h-16 w-16" viewBox="0 0 40 40"><path d="M26 4a16 16 0 1 0 10 28A13 13 0 1 1 26 4Z" fill="#ddc58d" opacity=".85" /></svg></>,
    ligacao: 'reta', cor: '#ddc58d', espessura: 1,
    no: 'rounded-3xl border-transparent bg-transparent shadow-none hover:bg-[#ddc58d]/10', noAtivo: 'rounded-3xl border-[#ddc58d]/50 bg-[#1c1840]/80 shadow-none',
    titulo: 'text-[#f6ecd0]', sub: 'text-[#ddc58d]/80', selo: 'h-11! w-11! border-[#ffe9a8] bg-[radial-gradient(circle,#fff6d8,#ddc58d_45%,#3a2f12_75%)] text-[#3a2f12] shadow-[0_0_22px_#ffe9a8,0_0_6px_#fff]',
  },
  /* Pathfinder 2e: estandartes de um caminho de aventureiro. */
  pf2e: {
    nome: '🛡️ Estandartes', fundo: 'bg-[linear-gradient(180deg,#14213a,#0d1424_70%,#0a0f1b)] border-[#e8b84a]/30',
    ligacao: 'curva', cor: '#e8b84a', espessura: 3,
    no: 'border-[#e8b84a]/70 bg-[#1b2a48] hover:bg-[#233660]', noAtivo: 'bg-[#2c3f6b] ring-2 ring-[#e8b84a]/60',
    titulo: 'text-white', sub: 'text-[#9ecaff]', selo: 'border-[#e8b84a] bg-[#0f182b] text-[#e8b84a]', forma: 'polygon(0 0,100% 0,100% 82%,50% 100%,0 82%)',
  },
  /* Tormenta20: a tempestade rubra. */
  tormenta20: {
    nome: '⚡ Tormenta', fundo: 'bg-[radial-gradient(ellipse_at_50%_0%,#5a1020_0%,#1d1426_55%,#0c0b16_100%)] border-red-400/30',
    decoracao: <svg aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-20 w-full opacity-40" viewBox="0 0 300 60" preserveAspectRatio="none"><path d="M0 30 Q30 5 60 25 T120 20 T180 28 T240 18 T300 26 V0 H0Z" fill="#7a1426" /><path d="M0 44 Q40 22 80 40 T160 36 T240 42 T300 34 V0 H0Z" fill="#4a0e1c" /></svg>,
    ligacao: 'raio', cor: '#ff5468', espessura: 2.5,
    no: 'border-[#a9d1ff]/60 bg-[#1b2637] hover:bg-[#25344c]', noAtivo: 'bg-[#2c3e5a] ring-2 ring-red-400/60',
    titulo: 'text-white', sub: 'text-[#a9d1ff]', selo: 'border-red-400 bg-[#120d18] text-red-300', forma: 'polygon(50% 0,100% 18%,94% 72%,50% 100%,6% 72%,0 18%)',
  },
  /* Faroeste: placas de madeira numa trilha. */
  'faroeste-arcano': {
    nome: '🌵 Trilha do Oeste', fundo: 'bg-[linear-gradient(180deg,#4a2f18,#2b1a0e_60%,#1a0f08)] border-[#f1c184]/30',
    decoracao: <svg aria-hidden className="pointer-events-none absolute bottom-0 left-0 h-24 w-full opacity-40" viewBox="0 0 300 80" preserveAspectRatio="none"><path d="M0 60 L40 38 L70 52 L110 24 L150 50 L200 30 L240 48 L300 28 V80 H0Z" fill="#6b3f1f" /><path d="M30 80 V52 M26 60 H34 M260 80 V46 M256 56 H264" stroke="#3d5a2a" strokeWidth="3" /></svg>,
    ligacao: 'trilha', cor: '#c89a63', espessura: 3,
    no: 'rounded-sm border-[#2e1a0c] bg-[linear-gradient(180deg,#8a5f37,#6b4628)] hover:brightness-110 shadow-[0_6px_0_#2e1a0c]', noAtivo: 'ring-2 ring-[#f1c184]',
    titulo: 'text-[#fff3dc] [font-family:var(--font-cormorant),Georgia,serif] text-sm', sub: 'text-[#f6d9ae]', selo: 'border-[#2e1a0c] bg-[#3a2414] text-[#f1c184]', torto: true,
  },
  /* Fate: a escada de adjetivos. */
  'fate-core': {
    nome: '✦ Escada', fundo: 'bg-[linear-gradient(180deg,#14203a,#141026_60%,#1d0f2f)] border-[#6cc4ff]/30',
    ligacao: 'curva', cor: '#6cc4ff', espessura: 2,
    no: 'border-[#6cc4ff]/60 bg-[#1b1838] hover:bg-[#262252]', noAtivo: 'bg-[#2b2760] ring-2 ring-[#6cc4ff]/60',
    titulo: 'text-white', sub: 'text-[#c5b0ff]', selo: 'border-[#6cc4ff] bg-[#0e0c20] text-[#6cc4ff]',
  },
  /* Blades: becos à luz de lampiões. */
  blades: {
    nome: '🏮 Becos', fundo: 'bg-[linear-gradient(180deg,#0f1817,#0b0d10_60%,#0a0a0c)] border-[#9fdccb]/25',
    decoracao: <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,#f0b45a22,transparent_18%),radial-gradient(circle_at_85%_55%,#f0b45a1a,transparent_16%)]" />,
    ligacao: 'trilha', cor: '#5d7f78', espessura: 2,
    no: 'border-[#9fdccb]/50 bg-[#141c1c] hover:bg-[#1c2828]', noAtivo: 'bg-[#1f302d] ring-2 ring-[#9fdccb]/50',
    titulo: 'text-[#e6efe9] [font-family:var(--font-cormorant),Georgia,serif] text-sm', sub: 'text-[#9fdccb]', selo: 'border-[#f0b45a] bg-[#0c0f0f] text-[#f0b45a]',
  },
  /* Call of Cthulhu e BRP: quadro de pistas com fio vermelho. */
  'call-of-cthulhu': {
    nome: '🧵 Quadro de pistas', fundo: 'bg-[#6b4a2c] border-[#3a2616] [background-image:radial-gradient(#5a3c22_1.2px,transparent_1.6px),radial-gradient(#7c5836_1px,transparent_1.4px)] [background-size:9px_11px,13px_7px]',
    ligacao: 'fio', cor: '#c3151f', espessura: 1.6,
    no: 'rounded-sm border-[#d8ccb0] bg-[#efe6cf] hover:bg-[#f7f0de] shadow-[2px_4px_10px_#0007]', noAtivo: 'ring-2 ring-[#c3151f]',
    titulo: 'text-[#2a2117] [font-family:var(--font-cormorant),Georgia,serif] text-sm', sub: 'text-[#6b5a44]', selo: 'border-[#c3151f] bg-[#c3151f] text-white', torto: true,
  },
  /* Mörk Borg: preto, amarelo e torto. */
  'mork-borg': {
    nome: '💀 Ruína', fundo: 'bg-black border-[#ffe600]',
    ligacao: 'serrilha', cor: '#ffe600', espessura: 2.5,
    no: 'rounded-none border-2 border-[#ffe600] bg-black hover:bg-[#1a1a00] -skew-x-3', noAtivo: 'bg-[#2a2600]',
    titulo: 'text-[#ffe600] uppercase tracking-tight', sub: 'text-[#ffe600]/70', selo: 'border-[#ffe600] bg-[#ffe600] text-black',
  },
  /* Marcas: o rastro da fera. */
  marcas: {
    nome: '🐾 Rastro', fundo: 'bg-[radial-gradient(ellipse_at_50%_30%,#16294a_0%,#0f1528_60%,#090b16_100%)] border-[#7fc8f0]/30',
    ligacao: 'pegadas', cor: '#7fc8f0', espessura: 3,
    no: 'border-[#7fc8f0]/60 bg-[#142038] hover:bg-[#1b2c4d] shadow-[0_0_20px_#7fc8f033]', noAtivo: 'bg-[#1f3560] ring-2 ring-[#7fc8f0]/60',
    titulo: 'text-white', sub: 'text-[#9fe0ff]', selo: 'border-[#7fc8f0] bg-[#0a1222] text-[#9fe0ff]',
  },
  /* Qualquer outro: as raízes de sempre. */
  padrao: {
    nome: '🌳 Raízes', fundo: 'bg-[radial-gradient(ellipse_at_50%_65%,#30251f_0%,#181321_70%,#0c0a13_100%)] border-amber-300/25',
    ligacao: 'raiz', cor: '#a7835c', espessura: 5,
    no: 'border-amber-300/55 bg-[#29201f] hover:bg-[#41302a]', noAtivo: 'bg-[#57402d] ring-2 ring-amber-200/40',
    titulo: 'text-white', sub: 'text-amber-100/80', selo: 'border-amber-300/60 bg-[#17121a] text-amber-100',
  },
}
TEMAS_ARVORE.brp = { ...TEMAS_ARVORE['call-of-cthulhu'] }
export const temaArvore = (identidade: string) => TEMAS_ARVORE[identidade] ?? TEMAS_ARVORE.padrao
