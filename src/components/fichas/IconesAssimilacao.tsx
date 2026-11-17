/** Ícones de Assimilação: silhuetas vetoriais recriadas a partir da referência visual. */
import type { LadoAssim } from '@/lib/sistemas/assimilacao'

export const COR_DADO: Record<LadoAssim, { de: string; ate: string; borda: string; nome: string }> = {
  6: { de: '#235b91', ate: '#07182d', borda: '#102d48', nome: 'Instinto' },
  10: { de: '#235b91', ate: '#07182d', borda: '#102d48', nome: 'Conhecimento ou Prática' },
  12: { de: '#235b91', ate: '#07182d', borda: '#102d48', nome: 'Assimilado' },
}

/** Contorno de cada dado (viewBox 0 0 100 100). */
const FORMA: Record<LadoAssim, string> = {
  6: 'M22 10 H78 Q90 10 90 22 V78 Q90 90 78 90 H22 Q10 90 10 78 V22 Q10 10 22 10 Z',
  10: 'M50 4 L92 44 Q95 48 92 52 L50 96 L8 52 Q5 48 8 44 Z',
  12: 'M50 5 L93 36 L77 89 H23 L7 36 Z',
}

/** Emblemas (desenhados no centro, viewBox 0 0 100 100). */
function Emblema({ lados }: { lados: LadoAssim }) {
  return <g transform="scale(4.1666667)"><ArteSimbolo tipo={lados === 6 ? 'c' : lados === 10 ? 'b' : 'a'} /></g>
}

/** Ícone do tipo de dado (forma + emblema). */
export function IconeDado({ lados, tamanho = 28, emblema = true }: { lados: LadoAssim; tamanho?: number; emblema?: boolean }) {
  const c = COR_DADO[lados], id = 'g-assim-' + lados
  return <svg viewBox="0 0 100 100" width={tamanho} height={tamanho} aria-hidden className="shrink-0 drop-shadow">
    <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c.de} /><stop offset="1" stopColor={c.ate} /></linearGradient></defs>
    <path d={FORMA[lados]} fill={`url(#${id})`} stroke={c.borda} strokeWidth="3" strokeLinejoin="round" />
    {emblema && <g transform="translate(15 15) scale(0.7)" opacity=".95"><Emblema lados={lados} /></g>}
  </svg>
}

/** Fundo de um dado rolado (forma, sem emblema forte: os símbolos ficam por cima). */
export function FundoDado({ lados }: { lados: LadoAssim }) {
  const c = COR_DADO[lados], id = 'f-assim-' + lados
  return <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="none">
    <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c.de} stopOpacity=".55" /><stop offset="1" stopColor={c.ate} stopOpacity=".85" /></linearGradient></defs>
    <path d={FORMA[lados]} fill={`url(#${id})`} stroke={c.borda} strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    <g transform="translate(30 30) scale(0.4)" opacity=".18"><Emblema lados={lados} /></g>
  </svg>
}

export type TipoSimbolo = 'a' | 'b' | 'c'
export const NOME_SIMBOLO: Record<TipoSimbolo, string> = { a: 'Sucesso', b: 'Adaptação', c: 'Pressão' }

/** Silhuetas brancas, sem emoji; compartilhadas entre emblemas e resultados. */
function ArteSimbolo({ tipo }: { tipo: TipoSimbolo }) {
  if (tipo === 'c') return <path fill="#fff" fillRule="evenodd" d="M3 2 L8 6 Q12 4 16 6 L21 2 L20 10 L23 14 L20 15 L22 19 L17 18 L16 22 L12 19 L8 22 L7 18 L2 19 L4 15 L1 14 L4 10 Z M6 11 A2.4 2.4 0 1 0 10.8 11 A2.4 2.4 0 1 0 6 11 M13.2 11 A2.4 2.4 0 1 0 18 11 A2.4 2.4 0 1 0 13.2 11 M10 16 L14 16 L12 18 Z" />
  if (tipo === 'b') return <g fill="#fff"><path d="M8 9 L5 7 L7 13 L10 15 L11 22 H13 L14 15 L17 13 L19 7 L16 9 L14 11 H10 Z"/><path d="M9 11 L6 5 L2 2 M6 5 L1 6 M6 5 L7 1 M15 11 L18 5 L22 2 M18 5 L23 6 M18 5 L17 1" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></g>
  return <g fill="#fff" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"><path d="M5 8 L2 6 M4 12 H1 M5 16 L2 19 M19 8 L22 6 M20 12 H23 M19 16 L22 19 M9 5 L7 1 M15 5 L17 1" fill="none"/><ellipse cx="12" cy="13" rx="7.7" ry="9" stroke="none"/><circle cx="12" cy="5" r="3" stroke="none"/><path d="M12 7 V21" stroke="#102d48"/>{[[8.5,10],[15.5,10],[8,15],[16,15],[10,19],[14,19]].map(([x,y])=><circle key={x+':'+y} cx={x} cy={y} r="1.35" fill="#102d48" stroke="none"/>)}</g>
}

export function Simbolo({ tipo, tamanho = 16 }: { tipo: TipoSimbolo; tamanho?: number }) {
  return <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} role="img" aria-label={NOME_SIMBOLO[tipo]} className="shrink-0">
    <title>{NOME_SIMBOLO[tipo]}</title><ArteSimbolo tipo={tipo}/>
  </svg>
}
