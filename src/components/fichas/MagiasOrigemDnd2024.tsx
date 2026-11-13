'use client'

/**
 * Magias de Iniciado em Magia concedidas pelo antecedente.
 * Não são copiadas para dndMagias: permanecem distintas das preparadas pela classe,
 * com atributo de conjuração próprio e um uso gratuito compartilhado por descanso longo.
 */
import { useState } from 'react'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import type { DadosFicha } from '@/lib/sistemas/tipos'
import type { Calculo } from '@/lib/sistemas/calculo'
import { magiasDeAntecedenteDnd } from '@/lib/sistemas/dnd2024Antecedentes'
import { magiasDoHumanoDnd } from '@/lib/sistemas/dnd2024MagiaHumano'
import { expressaoMagia, magiaPorId } from '@/lib/sistemas/dnd2024Conjuracao'

type Props = {
  d: DadosFicha; c: Calculo; onChange: (d: DadosFicha) => void
  somenteLeitura: boolean
  rolar: (expressao: string, rotulo: string) => void
  origemHumana?: boolean
}
const b = 'rounded-lg border border-(--a-5e4b78) px-3 py-1.5 text-xs hover:bg-(--s-34294f) disabled:opacity-40'
const sinal = (n: number) => (n >= 0 ? '+' : '') + n

export default function MagiasOrigemDnd2024({ d, c, onChange, somenteLeitura, rolar, origemHumana = false }: Props) {
  const origem = origemHumana ? magiasDoHumanoDnd(d) : magiasDeAntecedenteDnd(d)
  const recursoId = origemHumana ? 'magia_humano_gratis' : 'magia_origem_gratis'
  const [slot, setSlot] = useState('')
  if (!origem) return null

  const prof = Number(c.vars.dnd_prof) || Number(c.vars.prof) || 2
  const mod = Number(c.mods[origem.atributo]) || 0
  const atq = prof + mod
  const cd = 8 + atq
  const nivel = Number(d.campos.nivel) || 1
  const magias = origem.ids.map(id => magiaPorId(id)).filter(m => m !== undefined)
  const livreMax = Number(c.recursosMax[recursoId] ?? 0)
  const livre = Math.min(livreMax, Math.max(0, Number(d.recursos[recursoId]?.atual ?? 0)))
  const opcoes = Object.entries(c.recursosMax).flatMap(([id, max]) => {
    if (!(max && max > 0)) return []
    const circulo = /^espacos_([1-9])$/.exec(id)
    if (circulo) return [{ id, nivel: Number(circulo[1]), label: 'Espaço ' + circulo[1] + 'º' }]
    if (id === 'pacto') return [{ id, nivel: Number(c.vars.dnd_pacto_nivel) || 1, label: 'Espaço de Pacto' }]
    return []
  }).filter(o => o.nivel >= 1)
  const espaco = opcoes.find(o => o.id === slot) ?? opcoes[0]
  const gastar = (id: string, nome: string, tipo: 'livre' | 'espaco') => {
    const max = Number(c.recursosMax[id] ?? 0)
    const atual = Math.min(max, Math.max(0, Number(d.recursos[id]?.atual ?? 0)))
    if (atual < 1) { toast.error('Sem usos disponíveis. Confira os descansos e recursos.'); return false }
    onChange({ ...d, recursos: { ...d.recursos, [id]: { ...d.recursos[id], atual: atual - 1 } } })
    toast.success(tipo === 'livre'
      ? nome + ': conjuração gratuita utilizada (retorna no descanso longo).'
      : nome + ': gastou um espaço de magia.')
    return true
  }

  return <section aria-label={origemHumana ? 'Magias de Iniciado em Magia do Humano' : 'Magias de Iniciado em Magia do antecedente'} className="space-y-3 rounded-xl border border-emerald-500/35 bg-emerald-950/10 p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-100">
        <Sparkles size={16} aria-hidden /> Iniciado em Magia — {origem.antecedente}
      </h4>
      <span className="text-xs text-emerald-200">Magias de origem · não contam nos limites da classe</span>
    </div>
    <p className="text-xs text-(--a-cfc0df)">Lista de {origem.lista} · Atributo: {origem.atributo} · CD {cd} · Ataque {sinal(atq)} · Uso sem espaço: {livre}/{livreMax} por descanso longo.</p>
    {espaco && <label className="flex max-w-xs flex-wrap items-center gap-2 text-xs">Conjuração usando espaço
      <select className="rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-1.5" value={espaco.id}
        onChange={e => setSlot(e.target.value)} aria-label="Fonte do espaço usado pelo talento">
        {opcoes.map(o => <option key={o.id} value={o.id}>{o.label} ({o.nivel}º) · {Number(d.recursos[o.id]?.atual ?? 0)} restante(s)</option>)}
      </select>
    </label>}
    <div className="grid gap-2">
      {magias.map(m => {
        const expr = expressaoMagia(m, { espaco: m.nivel === 0 ? 0 : m.nivel, nivelPersonagem: nivel, mod })
        const rolarDano = (rotulo: string) => { if (expr) rolar(expr, m.nome + ': ' + rotulo) }
        return <article key={m.id} className="rounded-lg border border-(--a-3d3152) bg-(--s-171325)/60 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <strong className="text-sm">{m.nome}</strong>
              <p className="text-xs text-(--a-a998bd)">{m.nivel === 0 ? 'Truque de origem' : 'Magia preparada pelo talento · 1º nível'} · {m.execucao} · {m.alcance}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {m.ataque && <button type="button" disabled={somenteLeitura} className={b}
                onClick={() => rolar('1d20' + sinal(atq), m.nome + ': ataque de origem')}>Ataque {sinal(atq)}</button>}
              {m.resistencia && <span className="rounded border border-(--a-5e4b78) px-2 py-1.5 text-xs">Resistência {m.resistencia} · CD {cd}</span>}
              {expr && <button type="button" disabled={somenteLeitura} className={b}
                onClick={() => rolarDano(m.cura && !m.dano ? 'cura' : 'dano')}>{m.cura && !m.dano ? 'Cura' : 'Dano'} {expr}</button>}
              {m.nivel > 0 && <button type="button" disabled={somenteLeitura || livre < 1} className={b}
                onClick={() => { if (gastar(recursoId, m.nome, 'livre')) rolarDano('conjuração gratuita') }}>Usar sem espaço ({livre})</button>}
              {m.nivel > 0 && espaco && <button type="button" disabled={somenteLeitura || Number(d.recursos[espaco.id]?.atual ?? 0) < 1} className={b}
                onClick={() => { if (gastar(espaco.id, m.nome, 'espaco')) {
                  const x = expressaoMagia(m, { espaco: espaco.nivel, nivelPersonagem: nivel, mod })
                  if (x) rolar(x, m.nome + ': conjuração com espaço ' + espaco.nivel + 'º')
                } }}>Usar espaço ({espaco.nivel}º)</button>}
            </div>
          </div>
          <p className="mt-1 text-xs text-(--a-cfc0df)">{m.resumo}</p>
        </article>
      })}
    </div>
    <p className="text-[11px] text-(--a-a998bd)">As magias desta origem não substituem escolhas de classe. O uso gratuito só volta após descanso longo. Os textos completos estão no SRD 5.2.1.</p>
  </section>
}
