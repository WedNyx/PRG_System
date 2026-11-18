'use client'

import type { AtributoDef } from '@/lib/sistemas/tipos'
import { limiteSomaAtributosOrdem, somaAtributosOrdem } from '@/lib/sistemas/ordemCriacao'

const POSICOES: Record<string, [number, number]> = { AGI: [50, 21], FOR: [24, 40], INT: [76, 40], PRE: [31, 73], VIG: [69, 73] }

/**
 * Cinco hexágonos em uma disposição circular, exclusiva de Ordem Paranormal.
 * Inputs reais e rotulados: navegação por teclado, leitor de tela e edição móvel.
 */
export default function AtributosOrdem({ atributos, valores, nex, somenteLeitura, onChange, semLimite = false }: {
  /** Ficha manual: sem a conta de pontos por NEX. */
  semLimite?: boolean
  atributos: AtributoDef[]
  valores: Record<string, number>
  nex: number
  somenteLeitura: boolean
  onChange: (id: string, valor: number) => void
}) {
  const soma = somaAtributosOrdem(valores)
  const limite = limiteSomaAtributosOrdem(nex)

  return <div className="space-y-3">
    <div role="group" aria-label="Cinco atributos de Ordem Paranormal" className="hexatombe-atributos">
      <svg viewBox="0 0 500 460" className="hexatombe-sigilo" aria-hidden="true">
        <g fill="#f20b30" stroke="#f20b30" strokeLinejoin="round">
          <circle cx="250" cy="220" r="111" fill="none" strokeWidth="13"/>
          <circle cx="250" cy="220" r="94" fill="none" strokeWidth="8"/>
          <path d="M250 52L354 336L85 166L415 166L146 336Z" fill="none" strokeWidth="12"/>
          {Object.values(POSICOES).map(([x,y],i) => <g key={i} transform={`translate(${x*5} ${y*4.6})`}>
            <path d="M-45 -42 Q-82 -67 -53 -100 Q-62 -65 -27 -61 L-9 -77 Q-3 -58 10 -72 Q18 -55 28 -67 Q35 -47 43 -64 Q70 -78 57 -103 Q86 -69 47 -39Z" stroke="none"/>
            <path d="M0 -58L60 -29V29L0 58L-60 29V-29Z" fill="#080708" strokeWidth="12"/>
          </g>)}
          <path d="M250 289 L250 433 L238 309Z M180 243L42 294L164 262Z M320 243L458 294L336 262Z M183 166L115 55L204 154Z M317 166L385 55L296 154Z" stroke="none"/>
          <circle cx="250" cy="220" r="66" stroke="none"/>
        </g>
        <text x="250" y="225" textAnchor="middle" fill="#080708" fontSize="25" fontWeight="900" fontFamily="Georgia, serif" textLength="121" lengthAdjust="spacingAndGlyphs">ATRIBUTOS</text>
        <text x="250" y="245" textAnchor="middle" fill="#080708" fontSize="11" fontWeight="bold">NEX {nex}%</text>
      </svg>
      {atributos.map((a, i) => {
        const [x,y] = POSICOES[a.id] ?? Object.values(POSICOES)[i % 5]
        return <div key={a.id} className="hexatombe-no" style={{ left: x+'%', top: y+'%' }}>
          <input id={`ordem-atributo-${a.id}`} type="number" inputMode="numeric"
            aria-label={`${a.nome} (${a.id})`} min={a.min} max={a.max} step={1}
            value={valores[a.id] ?? a.padrao} disabled={somenteLeitura}
            onChange={e => onChange(a.id, Math.max(a.min, Math.min(a.max, Math.trunc(Number(e.target.value) || 0))))}
          />
          <span className="hexatombe-nome">{a.nome}</span>
          <label htmlFor={`ordem-atributo-${a.id}`}>{a.id}</label>
        </div>
      })}
    </div>
    {!semLimite && <p role="status" aria-live="polite" className={`text-center text-xs ${soma > limite ? 'text-amber-300' : 'text-violet-200'}`}>
      Total de atributos: <strong>{soma}</strong> / {limite} (limite básico para este NEX).
      {soma > limite ? ' Revise a distribuição.' : ''}
    </p>}
    {!semLimite && <p className="text-center text-xs text-(--a-a998bd)">
      Os botões de rolagem e as perícias permanecem abaixo; alterar um hexágono atualiza a ficha normalmente.
    </p>}
  </div>
}
