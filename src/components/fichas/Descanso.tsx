'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Moon, Sunrise, X } from 'lucide-react'
import { aplicarDescanso, recursoDeVida, type TipoDescanso } from '@/lib/sistemas/descanso'
import { lerPoderes } from '@/lib/sistemas/inventario'
import type { DadosFicha, Sistema } from '@/lib/sistemas/tipos'

/** Janela “Descansar”: escolhe curto ou longo; no curto dá para curar um pouco (número ou dados). */
export default function JanelaDescanso({ s, d, onChange, rolarTotal, fechar }: {
  s: Sistema; d: DadosFicha; onChange: (d: DadosFicha) => void
  /** Rola e devolve o total (na campanha, rola no servidor e vai para o chat). */
  rolarTotal: (expressao: string, rotulo: string) => Promise<number | null>
  fechar: () => void
}) {
  const [cura, setCura] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const vida = recursoDeVida(s)
  const curtos = lerPoderes(d.poderes).filter(p => p.usosMax && p.recarga === 'curto').length

  async function descansar(tipo: TipoDescanso) {
    setOcupado(true)
    try {
      let valor = 0
      const t = cura.trim()
      if (tipo === 'curto' && t) {
        if (/^\d+$/.test(t)) valor = Number(t)
        else { const r = await rolarTotal(t, `Cura no descanso curto (${t})`); if (r === null) return; valor = r }
      }
      const r = aplicarDescanso(s, d, tipo, { cura: valor })
      onChange(r.d)
      toast.success(tipo === 'longo' ? '🌙 Descanso longo' : '☕ Descanso curto', { description: r.mudancas.length ? r.mudancas.join(' · ') : 'Nada para recuperar: já estava tudo cheio.' })
      fechar()
    } finally { setOcupado(false) }
  }

  return <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-3 sm:items-center" onMouseDown={e => { if (e.target === e.currentTarget) fechar() }}>
    <div role="dialog" aria-modal="true" aria-labelledby="descanso-titulo" onKeyDown={e => { if (e.key === 'Escape') fechar() }}
      className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#8b6cba] bg-[#19152a] p-5 text-[#f2ebff] shadow-2xl">
      <div className="flex items-center gap-2">
        <h2 id="descanso-titulo" className="flex flex-1 items-center gap-2 text-lg font-bold"><Moon size={20} className="text-amber-200" /> Descansar</h2>
        <button type="button" onClick={fechar} aria-label="Fechar" className="rounded-lg p-1 text-[#b4aeca] hover:bg-white/10"><X size={18} /></button>
      </div>

      <section className="mt-4 rounded-2xl border border-[#55456e] bg-[#201a32] p-4">
        <h3 className="flex items-center gap-2 font-semibold">☕ Descanso curto</h3>
        <p className="mt-1 text-xs text-[#cfc0df]">Uma pausa rápida. Voltam os usos dos poderes marcados “descanso curto”{curtos ? ` (${curtos})` : ''}.{vida ? ` Se o sistema deixa curar, escreva quanto de ${vida.nome}.` : ''}</p>
        {vida && <label className="mt-3 block text-sm">Cura de {vida.nome} (opcional)
          <input value={cura} onChange={e => setCura(e.target.value)} maxLength={40} placeholder="Ex.: 5 ou 1d8+2" className="mt-1 w-full rounded-lg border border-[#5e4b78] bg-[#151123] p-2 text-white" /></label>}
        <button type="button" disabled={ocupado} onClick={() => void descansar('curto')} className="mt-3 w-full rounded-xl border border-[#b99bff] bg-[#34294f] p-2.5 font-semibold hover:bg-[#45366a] disabled:opacity-50">Fazer descanso curto</button>
      </section>

      <section className="mt-3 rounded-2xl border border-[#d4a23a]/70 bg-gradient-to-br from-[#2b2045] to-[#1d1730] p-4">
        <h3 className="flex items-center gap-2 font-semibold"><Sunrise size={18} className="text-amber-200" /> Descanso longo</h3>
        <p className="mt-1 text-xs text-[#cfc0df]">Uma noite de sono: {s.recursos.filter(r => !/temp/i.test(r.id)).map(r => r.nome).slice(0, 4).join(', ') || 'os recursos'} voltam ao máximo, valores temporários zeram e todos os usos de poderes voltam.</p>
        <button type="button" disabled={ocupado} onClick={() => void descansar('longo')} className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#7652ac] to-[#b45309] p-2.5 font-semibold disabled:opacity-50">Fazer descanso longo</button>
      </section>
      <p className="mt-3 text-[11px] text-[#8f88a8]">Em campanha, o mestre também pode dar o descanso para o grupo todo (aba Mestre na mesa).</p>
    </div>
  </div>
}
