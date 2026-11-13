'use client'

/** Grimório projetado a partir das escolhas de espécie (SRD 5.2.1). */
import { useState } from 'react'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import type { DadosFicha } from '@/lib/sistemas/tipos'
import type { Calculo } from '@/lib/sistemas/calculo'
import { expressaoMagia, magiaPorId } from '@/lib/sistemas/dnd2024Conjuracao'
import { magiasDaEspecieDnd } from '@/lib/sistemas/dnd2024MagiasEspecie'

type Props = {
  d: DadosFicha
  c: Calculo
  onChange: (d: DadosFicha) => void
  somenteLeitura: boolean
  rolar: (expressao: string, rotulo: string) => void
}
const botao = 'rounded-lg border border-(--a-5e4b78) px-3 py-1.5 text-xs hover:bg-(--s-34294f) disabled:opacity-40'
const sinal = (n: number) => (n >= 0 ? '+' : '') + n

export default function MagiasEspecieDnd2024({ d, c, onChange, somenteLeitura, rolar }: Props) {
  const [espacosEscolhidos, setEspacosEscolhidos] = useState<Record<string, string>>({})
  const origem = magiasDaEspecieDnd(d)
  if (!origem) return null

  const prof = Number(c.vars.dnd_prof) || Number(c.vars.prof) || 2
  const mod = Number(c.mods[origem.atributo]) || 0
  const ataque = prof + mod
  const cd = 8 + ataque
  const nivel = Number(d.campos.nivel) || 1
  const espacos = Object.entries(c.recursosMax).flatMap(([id, n]) => {
    if (!n || n < 1) return []
    const circulo = /^espacos_([1-9])$/.exec(id)
    if (circulo) return [{ id, nivel: Number(circulo[1]), nome: 'Espaço de ' + circulo[1] + 'º' }]
    if (id === 'pacto') return [{ id, nivel: Number(c.vars.dnd_pacto_nivel) || 1, nome: 'Espaço de Pacto' }]
    return []
  })

  const gastar = (recurso: string, nome: string): boolean => {
    const max = Number(c.recursosMax[recurso] ?? 0)
    const atual = Math.min(max, Math.max(0, Number(d.recursos[recurso]?.atual ?? 0)))
    if (atual < 1) { toast.error('Sem usos disponíveis. Use um espaço apropriado ou recupere no descanso longo.'); return false }
    onChange({ ...d, recursos: { ...d.recursos, [recurso]: { ...d.recursos[recurso], atual: atual - 1 } } })
    toast.success(nome + ': um uso consumido.')
    return true
  }
  const resolverMagia = (id: string, espaco: number) => {
    const m = magiaPorId(id)
    if (!m) return
    const expr = expressaoMagia(m, { espaco, nivelPersonagem: nivel, mod })
    if (expr) rolar(expr, m.nome + (m.cura && !m.dano ? ': cura' : ': dano'))
    else toast.info(m.nome + ': efeito sem rolagem automática. Resolva com o mestre.')
  }

  return <section className="space-y-3 rounded-xl border border-violet-400/40 bg-violet-950/10 p-3" aria-label="Magias da espécie e linhagem">
    <h4 className="flex items-center gap-2 text-sm font-bold text-violet-100"><Sparkles size={16} aria-hidden /> Magias da espécie — {origem.linhagem}</h4>
    <p className="text-xs text-(--a-cfc0df)">Atributo: {origem.atributo} · CD {cd} · Ataque {sinal(ataque)} · Não contam como magias preparadas pela classe.</p>
    <div className="grid gap-2">
      {origem.magias.map(item => {
        const m = magiaPorId(item.id)
        if (!m) return null
        const max = item.recurso ? Number(c.recursosMax[item.recurso] ?? 0) : 0
        const atual = item.recurso ? Math.min(max, Math.max(0, Number(d.recursos[item.recurso]?.atual ?? 0))) : 0
        const elegiveis = espacos.filter(e => e.nivel >= m.nivel && m.nivel > 0)
        const escolhido = elegiveis.find(e => e.id === espacosEscolhidos[item.id]) ?? elegiveis[0]
        const expr = expressaoMagia(m, { espaco: m.nivel, nivelPersonagem: nivel, mod })
        return <article key={item.id} className="rounded-lg border border-(--a-3d3152) bg-(--s-171325)/60 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><strong className="text-sm">{m.nome}</strong>
              <p className="text-xs text-(--a-a998bd)">{m.nivel === 0 ? 'Truque da espécie' : 'Magia da espécie · ' + m.nivel + 'º círculo'} · {m.execucao} · {m.alcance}</p>
            </div>
            {item.recurso && <span className="text-xs text-violet-200">Sem espaço: {atual}/{max}</span>}
          </div>
          <p className="mt-1 text-xs text-(--a-cfc0df)">{m.resumo || 'Consulte a descrição do catálogo SRD.'}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {m.ataque && <button type="button" className={botao} disabled={somenteLeitura} onClick={() => rolar('1d20' + sinal(ataque), m.nome + ': ataque da espécie')}>Ataque {sinal(ataque)}</button>}
            {m.resistencia && <span className="rounded border border-(--a-5e4b78) px-2 py-1.5 text-xs">Resistência {m.resistencia} · CD {cd}</span>}
            {m.nivel === 0 && <button type="button" className={botao} disabled={somenteLeitura} onClick={() => resolverMagia(m.id, 0)}>Conjurar {expr ? '(' + expr + ')' : ''}</button>}
            {item.recurso && <button type="button" className={botao} disabled={somenteLeitura || atual < 1}
              onClick={() => { if (gastar(item.recurso!, m.nome)) resolverMagia(m.id, m.nivel) }}>Usar sem espaço ({atual})</button>}
            {m.nivel > 0 && escolhido && <>
              <select className="rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-1.5 text-xs" aria-label={'Espaço para ' + m.nome}
                value={escolhido.id} onChange={e => setEspacosEscolhidos(a => ({ ...a, [item.id]: e.target.value }))}>
                {elegiveis.map(e => <option key={e.id} value={e.id}>{e.nome} · {Number(d.recursos[e.id]?.atual ?? 0)} restante(s)</option>)}
              </select>
              <button type="button" className={botao} disabled={somenteLeitura || Number(d.recursos[escolhido.id]?.atual ?? 0) < 1}
                onClick={() => { if (gastar(escolhido.id, m.nome)) resolverMagia(m.id, escolhido.nivel) }}>Usar espaço ({escolhido.nivel}º)</button>
            </>}
          </div>
        </article>
      })}
    </div>
    {origem.observacao && <p className="text-xs text-amber-200">{origem.observacao}</p>}
    <p className="text-[11px] text-(--a-a998bd)">Os usos gratuitos específicos voltam no descanso longo. Magias de nível superior só aparecem após alcançar o nível necessário de personagem; efeitos situacionais e condições são conferidos pelo mestre.</p>
  </section>
}
