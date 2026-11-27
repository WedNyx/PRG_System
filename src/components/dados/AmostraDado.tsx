import { imagemTextura, type EstiloDado } from '@/lib/estilosDados'

/** Um d20 desenhado com as cores do estilo (vitrine de escolha). Brilho diferente para vidro, metal e madeira. */
export default function AmostraDado({ e, tamanho = 56, numero = 20 }: { e: EstiloDado; tamanho?: number; numero?: number }) {
  const brilho = e.material === 'metal' ? 0.55 : e.material === 'glass' ? 0.4 : e.material === 'wood' ? 0.12 : 0.25
  const id = 'amostra-' + e.id
  return <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" aria-hidden>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity={brilho} /><stop offset=".5" stopColor="#fff" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.3} /></linearGradient>
    </defs>
    <clipPath id={id + '-c'}><polygon points="50,4 91,27 91,73 50,96 9,73 9,27" /></clipPath>
    <polygon points="50,4 91,27 91,73 50,96 9,73 9,27" fill={e.fundo} />
    {e.textura && <image href={imagemTextura(e.textura)} x={0} y={0} width={100} height={100} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}-c)`} style={{ mixBlendMode: 'multiply' }} />}
    <polygon points="50,4 91,27 91,73 50,96 9,73 9,27" fill="none" stroke={e.contorno} strokeWidth={3} strokeLinejoin="round" />
    {e.material === 'wood' && !e.textura && <g stroke={e.contorno} strokeOpacity={0.35} strokeWidth={1.4} fill="none"><path d="M14 40 Q50 30 86 44" /><path d="M14 58 Q50 50 86 62" /><path d="M20 76 Q50 70 80 80" /></g>}
    <polygon points="50,22 76,66 24,66" fill="none" stroke={e.contorno} strokeWidth={2} strokeOpacity={0.7} />
    <path d="M50 4 L50 22 M91 27 L76 66 M9 27 L24 66 M91 73 L76 66 M9 73 L24 66 M50 96 L50 66" stroke={e.contorno} strokeWidth={1.6} strokeOpacity={0.55} />
    <polygon points="50,4 91,27 91,73 50,96 9,73 9,27" fill={`url(#${id})`} />
    <text x="50" y="56" textAnchor="middle" dominantBaseline="middle" fontSize="22" fontWeight="800" fill={e.numero} fontFamily="system-ui, sans-serif" style={{ paintOrder: 'stroke' }} stroke={e.fundo} strokeWidth={5} strokeLinejoin="round" strokeOpacity={0.85}>{numero}</text>
  </svg>
}
