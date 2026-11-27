import type { ReactNode } from 'react'

/**
 * Molduras de perfil (v0.37.1): arte nossa em SVG, desenhada em volta da foto redonda.
 * A foto ocupa o círculo de raio 50 no centro (68,68) de uma caixa 136×136; a moldura vai do raio 50 ao 68.
 * Por isso o SVG fica 18% maior que a foto para cada lado (sem mudar o tamanho de nada na página).
 */
const C = 68
const pol = (r: number, graus: number) => { const a = (graus - 90) * Math.PI / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)] as const }
const volta = (n: number, ini = 0) => Array.from({ length: n }, (_, i) => ini + i * 360 / n)
const fmt = (n: number) => Math.round(n * 10) / 10
const estrela = (x: number, y: number, r: number) => {
  const p = Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4 - Math.PI / 2, k = i % 2 ? r * 0.38 : r; return `${fmt(x + k * Math.cos(a))},${fmt(y + k * Math.sin(a))}` })
  return <polygon points={p.join(' ')} />
}

function Arte({ id }: { id: string }) {
  switch (id) {
    case 'lua': return <g>
      <circle cx={C} cy={C} r={53} fill="none" stroke="#d9d4f2" strokeWidth={3} />
      <circle cx={C} cy={C} r={57} fill="none" stroke="#9b7bff" strokeWidth={1.2} strokeDasharray="2 4" />
      <path d="M100 8 a19 19 0 1 0 22 26 a15 15 0 1 1 -22 -26z" fill="#f3efff" stroke="#9b7bff" strokeWidth={1.5} />
      <g fill="#f3efff">{estrela(26, 22, 5)}{estrela(14, 70, 3.5)}{estrela(116, 102, 4)}</g>
    </g>
    case 'estrelas': {
      const ps = volta(9, 12).map((g, i) => pol(i % 2 ? 58 : 62, g))
      return <g>
        <polyline points={[...ps, ps[0]].map(p => p.map(fmt).join(',')).join(' ')} fill="none" stroke="#a5b4fc" strokeWidth={0.9} strokeOpacity={0.7} />
        <circle cx={C} cy={C} r={52} fill="none" stroke="#c7d2fe" strokeWidth={2} />
        <g fill="#eef2ff">{ps.map(([x, y], i) => <g key={i}>{estrela(x, y, i % 3 ? 3.5 : 5.5)}</g>)}</g>
      </g>
    }
    case 'chamas': return <g>
      <defs><linearGradient id="mold-fogo" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#b91c1c" /><stop offset=".55" stopColor="#f97316" /><stop offset="1" stopColor="#fde047" /></linearGradient></defs>
      {volta(16).map((g, i) => { const [x1, y1] = pol(51, g - 9), [x2, y2] = pol(51, g + 9), [tx, ty] = pol(i % 2 ? 62 : 67, g + 3)
        return <path key={g} d={`M${fmt(x1)} ${fmt(y1)} Q${fmt(pol(58, g - 6)[0])} ${fmt(pol(58, g - 6)[1])} ${fmt(tx)} ${fmt(ty)} Q${fmt(pol(56, g + 8)[0])} ${fmt(pol(56, g + 8)[1])} ${fmt(x2)} ${fmt(y2)}z`} fill="url(#mold-fogo)" /> })}
      <circle cx={C} cy={C} r={51.5} fill="none" stroke="#f97316" strokeWidth={3} />
    </g>
    case 'gelo': return <g>
      <circle cx={C} cy={C} r={52.5} fill="none" stroke="#bae6fd" strokeWidth={3} />
      {volta(12).map((g, i) => { const [x, y] = pol(51, g), [tx, ty] = pol(i % 2 ? 61 : 67, g), [ax, ay] = pol(55, g - 5), [bx, by] = pol(55, g + 5)
        return <path key={g} d={`M${fmt(ax)} ${fmt(ay)} L${fmt(tx)} ${fmt(ty)} L${fmt(bx)} ${fmt(by)} L${fmt(x)} ${fmt(y)}z`} fill="#e0f2fe" fillOpacity={0.9} stroke="#38bdf8" strokeWidth={0.8} /> })}
    </g>
    case 'folhas': return <g>
      <circle cx={C} cy={C} r={52.5} fill="none" stroke="#65a30d" strokeWidth={2.5} />
      {volta(14).map((g, i) => { const [x, y] = pol(57, g), rot = g + (i % 2 ? 40 : -40)
        return <ellipse key={g} cx={fmt(x)} cy={fmt(y)} rx={4} ry={9} transform={`rotate(${rot} ${fmt(x)} ${fmt(y)})`} fill={i % 3 ? '#4ade80' : '#16a34a'} stroke="#14532d" strokeWidth={0.8} /> })}
    </g>
    case 'pirata': return <g>
      <circle cx={C} cy={C} r={55} fill="none" stroke="#7c4a1e" strokeWidth={7} />
      <circle cx={C} cy={C} r={55} fill="none" stroke="#d6a86a" strokeWidth={5} strokeDasharray="4 3" />
      <g transform="translate(68 122)" stroke="#2b2118" strokeWidth={1.2} fill="#c9a227">
        <circle cx={0} cy={-10} r={3} fill="none" strokeWidth={2} stroke="#c9a227" />
        <rect x={-1.6} y={-7} width={3.2} height={14} />
        <rect x={-7} y={-4} width={14} height={2.6} />
        <path d="M-10 2 Q0 13 10 2 L7 2 Q0 9 -7 2z" />
      </g>
    </g>
    case 'neon': return <g>
      <circle cx={C} cy={C} r={54} fill="none" stroke="#22d3ee" strokeWidth={6} strokeOpacity={0.25} />
      <circle cx={C} cy={C} r={54} fill="none" stroke="#22d3ee" strokeWidth={2.5} strokeDasharray="22 6" />
      <circle cx={C} cy={C} r={60} fill="none" stroke="#ec4899" strokeWidth={1.8} strokeDasharray="6 10" />
      {volta(4, 45).map(g => { const [x, y] = pol(60, g); return <rect key={g} x={fmt(x) - 3} y={fmt(y) - 3} width={6} height={6} fill="#ec4899" transform={`rotate(45 ${fmt(x)} ${fmt(y)})`} /> })}
    </g>
    case 'runas': return <g>
      <circle cx={C} cy={C} r={52} fill="none" stroke="#450a0a" strokeWidth={4} />
      <circle cx={C} cy={C} r={62} fill="none" stroke="#7f1d1d" strokeWidth={1.5} />
      {volta(10).map((g, i) => { const [x1, y1] = pol(54.5, g), [x2, y2] = pol(60, g + (i % 2 ? 6 : -6)), [x3, y3] = pol(60, g)
        return <path key={g} d={`M${fmt(x1)} ${fmt(y1)} L${fmt(x3)} ${fmt(y3)} M${fmt(x3)} ${fmt(y3)} L${fmt(x2)} ${fmt(y2)}`} stroke="#dc2626" strokeWidth={1.6} strokeLinecap="round" fill="none" /> })}
      <circle cx={C} cy={C} r={52} fill="none" stroke="#dc2626" strokeWidth={1} strokeOpacity={0.8} />
    </g>
    case 'ouro': return <g>
      <circle cx={C} cy={C} r={52.5} fill="none" stroke="#fbbf24" strokeWidth={3} />
      <circle cx={C} cy={C} r={59} fill="none" stroke="#b45309" strokeWidth={1.5} />
      <circle cx={C} cy={C} r={61.5} fill="none" stroke="#fcd34d" strokeWidth={2} />
      {volta(4).map((g, i) => { const [x, y] = pol(57, g); return <circle key={g} cx={fmt(x)} cy={fmt(y)} r={5} fill={['#e11d48', '#2563eb', '#16a34a', '#9333ea'][i]} stroke="#fde68a" strokeWidth={1.6} /> })}
    </g>
    case 'mestre': return <g>
      <circle cx={C} cy={C} r={52.5} fill="none" stroke="#fbbf24" strokeWidth={3.5} />
      <circle cx={C} cy={C} r={58} fill="none" stroke="#fcd34d" strokeWidth={1} strokeDasharray="1 4" />
      <path d="M48 20 L52 3 L60 13 L68 0 L76 13 L84 3 L88 20 Z" fill="#fbbf24" stroke="#92400e" strokeWidth={1.4} strokeLinejoin="round" />
      <circle cx={68} cy={13} r={2.6} fill="#e11d48" /><circle cx={56} cy={15} r={1.8} fill="#2563eb" /><circle cx={80} cy={15} r={1.8} fill="#2563eb" />
    </g>
    case 'leste': return <g>
      {volta(18).map(g => { const [x, y] = pol(57, g); return <circle key={g} cx={fmt(x)} cy={fmt(y)} r={6.5} fill="#0f766e" stroke="#5eead4" strokeWidth={1.2} /> })}
      <circle cx={C} cy={C} r={52} fill="none" stroke="#14b8a6" strokeWidth={3} />
      <path d="M44 22 Q36 6 26 2 Q36 14 38 26z M92 22 Q100 6 110 2 Q100 14 98 26z" fill="#5eead4" stroke="#134e4a" strokeWidth={1.2} />
    </g>
    default: return null
  }
}

/** Envolve a foto redonda com a moldura escolhida. Sem moldura, devolve a foto como está. */
export default function Moldura({ id, children, className = '' }: { id?: string | null; children: ReactNode; className?: string }) {
  if (!id) return <>{children}</>
  return <span className={'relative inline-flex shrink-0 ' + className} data-moldura={id}>
    {children}
    <svg aria-hidden viewBox="0 0 136 136" className="pointer-events-none absolute -inset-[18%] h-[136%] w-[136%] overflow-visible drop-shadow-[0_1px_2px_rgba(0,0,0,.6)]"><Arte id={id} /></svg>
  </span>
}

/** Só a arte (para a vitrine de escolha). */
export function AmostraMoldura({ id, letra = '✦' }: { id: string; letra?: string }) {
  return <Moldura id={id}><span className="flex size-12 items-center justify-center rounded-full border border-(--a-62527e) bg-(--s-342749) text-lg font-bold text-(--a-d8c0ff)">{letra}</span></Moldura>
}
