'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Moon, Sunrise, X } from 'lucide-react'
import { aplicarDescanso, recursoDeVida, type TipoDescanso } from '@/lib/sistemas/descanso'
import { lerPoderes } from '@/lib/sistemas/inventario'
import { altoElfoSelecionado, CHAVE_TRUQUE_ALTO_ELFO, TRUQUES_MAGO_ALTO_ELFO, truqueAltoElfo } from '@/lib/sistemas/dnd2024TracosEspecie'
import { lerLivrosDnd } from '@/lib/sistemas/dndLivros'
import type { DadosFicha, Sistema } from '@/lib/sistemas/tipos'
import NaTela from '@/components/NaTela'

/** Janela “Descansar”: escolhe curto ou longo; no curto dá para curar um pouco (número ou dados). */
export default function JanelaDescanso({ s, d, onChange, rolarTotal, fechar }: {
  s: Sistema; d: DadosFicha; onChange: (d: DadosFicha) => void
  /** Rola e devolve o total (na campanha, rola no servidor e vai para o chat). */
  rolarTotal: (expressao: string, rotulo: string) => Promise<number | null>
  fechar: () => void
}) {
  const [cura, setCura] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [truqueEscolhido, setTruqueEscolhido] = useState(() => truqueAltoElfo(d))
  const legado2014 = s.id === 'dnd5e-srd' && (s.regraLivroDnd ?? lerLivrosDnd(d.dndLivros).base) === 'phb2014'
  const altoElfo = !legado2014 && s.id === 'dnd5e-srd' && altoElfoSelecionado(d)
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
      // A troca é uma escolha do personagem, somente após um descanso longo.
      const novaFicha = tipo === 'longo' && altoElfo && TRUQUES_MAGO_ALTO_ELFO.some(x => x.id === truqueEscolhido)
        ? { ...r.d, listas: { ...r.d.listas, [CHAVE_TRUQUE_ALTO_ELFO]: truqueEscolhido } } : r.d
      if (tipo === 'longo' && altoElfo && truqueEscolhido !== truqueAltoElfo(d))
        r.mudancas.push('Alto Elfo: truque da linhagem alterado')
      onChange(novaFicha)
      toast.success(tipo === 'longo' ? '🌙 Descanso longo' : '☕ Descanso curto', { description: r.mudancas.length ? r.mudancas.join(' · ') : 'Nada para recuperar: já estava tudo cheio.' })
      fechar()
    } finally { setOcupado(false) }
  }

  return <NaTela><div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-3 sm:p-4" onMouseDown={e => { if (e.target === e.currentTarget) fechar() }}>
    <div role="dialog" aria-modal="true" aria-labelledby="descanso-titulo" onKeyDown={e => { if (e.key === 'Escape') fechar() }}
      className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl border border-(--a-8b6cba) bg-(--s-19152a) p-5 text-(--a-f2ebff) shadow-2xl">
      <div className="flex items-center gap-2">
        <h2 id="descanso-titulo" className="flex flex-1 items-center gap-2 text-lg font-bold"><Moon size={20} className="text-amber-200" /> Descansar</h2>
        <button type="button" onClick={fechar} aria-label="Fechar" className="rounded-lg p-1 text-(--a-b4aeca) hover:bg-white/10"><X size={18} /></button>
      </div>

      <section className="mt-4 rounded-2xl border border-(--a-55456e) bg-(--s-201a32) p-4">
        <h3 className="flex items-center gap-2 font-semibold">☕ Descanso curto</h3>
        <p className="mt-1 text-xs text-(--a-cfc0df)">{legado2014
          ? 'D&D 2014: recarrega Surto de Ação, Retomar o Fôlego, Ki, Magia de Pacto e outros recursos elegíveis. A Inspiração de Bardo volta no curto a partir do nível 5. Para recuperar PV, gaste Dados de Vida conforme o livro; informe o total curado abaixo.'
          : `Uma pausa rápida. Voltam os usos dos poderes marcados “descanso curto”${curtos ? ` (${curtos})` : ''}.${vida ? ` Se o sistema deixa curar, escreva quanto de ${vida.nome}.` : ''}`}</p>
        {vida && <label className="mt-3 block text-sm">Cura de {vida.nome} (opcional)
          <input value={cura} onChange={e => setCura(e.target.value)} maxLength={40} placeholder="Ex.: 5 ou 1d8+2" className="mt-1 w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-white" /></label>}
        <button type="button" disabled={ocupado} onClick={() => void descansar('curto')} className="mt-3 w-full rounded-xl border border-(--a-b99bff) bg-(--s-34294f) p-2.5 font-semibold hover:bg-(--s-45366a) disabled:opacity-50">Fazer descanso curto</button>
      </section>

      <section className="mt-3 rounded-2xl border border-[#d4a23a]/70 bg-gradient-to-br from-(--s-2b2045) to-(--s-1d1730) p-4">
        <h3 className="flex items-center gap-2 font-semibold"><Sunrise size={18} className="text-amber-200" /> Descanso longo</h3>
        <p className="mt-1 text-xs text-(--a-cfc0df)">{legado2014
          ? 'D&D 2014: PV e espaços de magia voltam ao máximo, exceto Dados de Vida gastos: recupera até metade do total (mínimo 1). Exaustão não é reduzida automaticamente; confirme as condições com o mestre.'
          : `Uma noite de sono: ${s.recursos.filter(r => !/temp/i.test(r.id)).map(r => r.nome).slice(0, 4).join(', ') || 'os recursos'} voltam ao máximo, valores temporários zeram e todos os usos de poderes voltam.`}</p>
        {altoElfo && <label className="mt-3 block text-sm text-(--a-d6c8e8)">✨ Alto Elfo · truque da linhagem após descansar
          <select value={truqueEscolhido} disabled={ocupado} onChange={e => setTruqueEscolhido(e.target.value)}
            className="mt-1 w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-sm text-white">
            {TRUQUES_MAGO_ALTO_ELFO.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
          <span className="mt-1 block text-xs text-(--a-c4b6d4)">Pode manter o truque atual ou trocar por outro truque de Mago do SRD. A troca só é aplicada quando o descanso longo for concluído.</span>
        </label>}
        <button type="button" disabled={ocupado} onClick={() => void descansar('longo')} className="mt-3 w-full rounded-xl bg-gradient-to-r from-(--a-7652ac) to-[#b45309] p-2.5 font-semibold disabled:opacity-50">Fazer descanso longo</button>
      </section>
      <p className="mt-3 text-[11px] text-(--a-8f88a8)">Em campanha, o mestre também pode dar o descanso para o grupo todo (Mestre → Controles, na mesa).</p>
    </div>
  </div></NaTela>
}
