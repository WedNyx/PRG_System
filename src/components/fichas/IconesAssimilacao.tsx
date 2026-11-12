/**
 * Ícones próprios da plataforma para os dados de Assimilação (v0.33.3). Arte original — não usa os desenhos do jogo.
 * d6 = Instinto (pegada, âmbar) · d10 = Conhecimento/Prática (broto, verde-água) · d12 = Assimilado (esporo, magenta).
 * Símbolos: Sucesso (brilho), Adaptação (folhas em giro) e Pressão (raio).
 */
import type { LadoAssim } from '@/lib/sistemas/assimilacao'

export const COR_DADO: Record<LadoAssim, { de: string; ate: string; borda: string; nome: string }> = {
  6: { de: '#f7b955', ate: '#a3561b', borda: '#ffd894', nome: 'Instinto' },
  10: { de: '#4fd1b5', ate: '#1d6b74', borda: '#a6f2e0', nome: 'Conhecimento ou Prática' },
  12: { de: '#e263c9', ate: '#6a2178', borda: '#f8b5ec', nome: 'Assimilado' },
}

/** Contorno de cada dado (viewBox 0 0 100 100). */
const FORMA: Record<LadoAssim, string> = {
  6: 'M22 10 H78 Q90 10 90 22 V78 Q90 90 78 90 H22 Q10 90 10 78 V22 Q10 10 22 10 Z',
  10: 'M50 4 L92 44 Q95 48 92 52 L50 96 L8 52 Q5 48 8 44 Z',
  12: 'M50 5 L93 36 L77 89 H23 L7 36 Z',
}

/** Emblemas (desenhados no centro, viewBox 0 0 100 100). */
function Emblema({ lados }: { lados: LadoAssim }) {
  if (lados === 6) return <g fill="#fff">{/* pegada */}
    <ellipse cx="50" cy="60" rx="15" ry="12.5" />
    <ellipse cx="31" cy="44" rx="6" ry="7.5" transform="rotate(-20 31 44)" />
    <ellipse cx="43" cy="34" rx="6" ry="8" transform="rotate(-6 43 34)" />
    <ellipse cx="57" cy="34" rx="6" ry="8" transform="rotate(6 57 34)" />
    <ellipse cx="69" cy="44" rx="6" ry="7.5" transform="rotate(20 69 44)" />
  </g>
  if (lados === 10) return <g fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">{/* broto */}
    <path d="M50 76 V46" />
    <path d="M50 52 C36 52 28 42 28 30 C41 30 50 38 50 52 Z" fill="#fff" />
    <path d="M50 46 C62 46 72 38 72 26 C59 26 50 33 50 46 Z" fill="#fff" />
    <path d="M38 76 H62" />
  </g>
  return <g fill="#fff">{/* esporo que se espalha */}
    <circle cx="50" cy="54" r="11" />
    {[0, 60, 120, 180, 240, 300].map(a => { const r = (a * Math.PI) / 180; return <circle key={a} cx={50 + Math.cos(r) * 22} cy={54 + Math.sin(r) * 22} r={a % 120 ? 4 : 5.5} /> })}
    <circle cx="50" cy="54" r="4.5" fill="#6a2178" />
  </g>
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

/** Símbolo de resultado: Sucesso (brilho), Adaptação (folhas em giro) e Pressão (raio). */
export function Simbolo({ tipo, tamanho = 16 }: { tipo: TipoSimbolo; tamanho?: number }) {
  return <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} role="img" aria-label={NOME_SIMBOLO[tipo]} className="shrink-0">
    <title>{NOME_SIMBOLO[tipo]}</title>
    {tipo === 'a' && <path d="M12 1.5 C13 8 16 11 22.5 12 C16 13 13 16 12 22.5 C11 16 8 13 1.5 12 C8 11 11 8 12 1.5 Z" fill="#6ee7b7" stroke="#064e3b" strokeWidth=".8" />}
    {tipo === 'b' && <g fill="#7dd3fc" stroke="#0c4a6e" strokeWidth=".8">
      <path d="M12 12 C12 6 16 3 21 3 C21 8 18 12 12 12 Z" />
      <path d="M12 12 C12 18 8 21 3 21 C3 16 6 12 12 12 Z" />
      <path d="M12 12 C6 12 3 8 3 3 C8 3 12 6 12 12 Z" opacity=".55" />
      <path d="M12 12 C18 12 21 16 21 21 C16 21 12 18 12 12 Z" opacity=".55" />
    </g>}
    {tipo === 'c' && <path d="M14 1.5 L5 13.5 H11 L9 22.5 L19.5 9.5 H13.5 Z" fill="#fb7185" stroke="#4c0519" strokeWidth=".8" strokeLinejoin="round" />}
  </svg>
}
