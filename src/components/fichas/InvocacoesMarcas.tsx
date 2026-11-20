'use client'
import { useMemo } from 'react'
import type { DadosFicha } from '@/lib/sistemas/tipos'

type Invocacao = { id: string; nome: string; pvAtual: number; pvMax: number; custo: number | null; duracao: number | null; turnos: number | null; ataques: string; habilidades: string; observacoes: string; ativa: boolean }
const campo = 'w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-sm text-white'
function ler(v: string | undefined): Invocacao[] { try { const x: unknown = JSON.parse(v || '[]'); return Array.isArray(x) ? x.filter((e): e is Invocacao => e !== null && typeof e === 'object' && typeof e.id === 'string' && typeof e.nome === 'string') : [] } catch { return [] } }
export default function InvocacoesMarcas({ d, onChange, somenteLeitura, rolar }: { d: DadosFicha; onChange: (d: DadosFicha) => void; somenteLeitura: boolean; rolar: (expr: string, nome: string) => Promise<void> }) {
  const invocacoes = useMemo(() => ler(d.listas.marcas_invocacoes_json), [d.listas.marcas_invocacoes_json])
  const salvar = (lista: Invocacao[], recursos = d.recursos) => onChange({ ...d, recursos, listas: { ...d.listas, marcas_invocacoes_json: JSON.stringify(lista) } })
  const editar = (id: string, patch: Partial<Invocacao>) => salvar(invocacoes.map(e => e.id === id ? { ...e, ...patch } : e))
  const criar = () => salvar([...invocacoes, { id: crypto.randomUUID(), nome: 'Nova invocação', pvAtual: 0, pvMax: 0, custo: null, duracao: null, turnos: null, ataques: '', habilidades: '', observacoes: '', ativa: false }])
  const ativar = (e: Invocacao) => {
    if (e.ativa) { editar(e.id, { ativa: false }); return }
    const custo = e.custo
    const recurso = d.recursos.essencia
    if (custo !== null && custo > 0 && (!recurso || recurso.atual < custo)) return
    salvar(invocacoes.map(x => x.id === e.id ? { ...x, ativa: true, turnos: x.duracao } : x), custo !== null && custo > 0 && recurso ? { ...d.recursos, essencia: { ...recurso, atual: recurso.atual - custo } } : d.recursos)
  }
  const turno = () => salvar(invocacoes.map(e => !e.ativa || e.turnos === null ? e : e.turnos <= 1 ? { ...e, turnos: 0, ativa: false } : { ...e, turnos: e.turnos - 1 }))
  const expressaoValida = (v: string) => /^(?:\\d{1,3}d\\d{1,4}|\\d{1,6})(?:\\s*[+-]\\s*(?:\\d{1,3}d\\d{1,4}|\\d{1,6}))*$/i.test(v.trim())
  return <section className="space-y-3 rounded-2xl border border-(--ficha-borda) bg-(--ficha-cartao) p-4" aria-label="Invocações de Marcas">
    <h2 className="text-lg font-bold">🐻 Invocações e criaturas</h2>
    <p className="text-xs text-(--a-a998bd)">Cada invocação tem PV, ataques e duração independentes. Ativar desconta essência somente se o custo for conhecido. Não cria token na mesa automaticamente.</p>
    {invocacoes.map(e => <div key={e.id} className="space-y-2 rounded-xl border border-(--a-5e4b78) p-3">
      <label className="block text-xs">Nome<input className={campo} value={e.nome} disabled={somenteLeitura} onChange={v => editar(e.id, { nome: v.target.value })}/></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs">PV atuais<input className={campo} type="number" min={0} value={e.pvAtual ?? 0} disabled={somenteLeitura} onChange={v => editar(e.id, { pvAtual: Math.min(e.pvMax, Math.max(0, Number(v.target.value) || 0)) })}/></label>
        <label className="text-xs">PV máximos<input className={campo} type="number" min={0} value={e.pvMax ?? 0} disabled={somenteLeitura} onChange={v => { const max = Math.max(0, Number(v.target.value) || 0); editar(e.id, { pvMax: max, pvAtual: Math.min(e.pvAtual, max) }) }}/></label>
        <label className="text-xs">Custo de essência<input className={campo} type="number" min={0} placeholder="Indefinido" value={e.custo ?? ''} disabled={somenteLeitura} onChange={v => editar(e.id, { custo: v.target.value === '' ? null : Math.max(0, Number(v.target.value) || 0) })}/></label>
        <label className="text-xs">Duração em turnos<input className={campo} type="number" min={0} placeholder="Indefinida" value={e.duracao ?? ''} disabled={somenteLeitura} onChange={v => editar(e.id, { duracao: v.target.value === '' ? null : Math.max(0, Number(v.target.value) || 0) })}/></label>
      </div>
      <label className="block text-xs">Ataque (expressão de dados)<input className={campo} placeholder="1d6" value={e.ataques ?? ''} disabled={somenteLeitura} onChange={v => editar(e.id, { ataques: v.target.value })}/></label>
      <label className="block text-xs">Habilidades<textarea className={campo} rows={2} value={e.habilidades ?? ''} disabled={somenteLeitura} onChange={v => editar(e.id, { habilidades: v.target.value })}/></label>
      <label className="block text-xs">Observações<textarea className={campo} rows={2} value={e.observacoes ?? ''} disabled={somenteLeitura} onChange={v => editar(e.id, { observacoes: v.target.value })}/></label>
      <div className="flex flex-wrap gap-2 items-center text-sm">
        <strong>{e.ativa ? 'Ativa' : 'Inativa'} · {e.pvAtual}/{e.pvMax} PV{e.ativa && e.turnos !== null ? ' · ' + e.turnos + ' turnos' : ''}</strong>
        <button type="button" className={campo + ' !w-auto'} disabled={somenteLeitura || (!e.ativa && e.custo !== null && e.custo > 0 && (!d.recursos.essencia || d.recursos.essencia.atual < e.custo))} onClick={() => ativar(e)}>{e.ativa ? 'Encerrar' : 'Invocar'}</button>
        <button type="button" className={campo + ' !w-auto'} disabled={!expressaoValida(e.ataques)} onClick={() => void rolar(e.ataques, e.nome + ' · Ataque')}>🎲 Rolar ataque</button>
        {!somenteLeitura && <button type="button" className="text-red-300" onClick={() => salvar(invocacoes.filter(x => x.id !== e.id))}>Excluir</button>}
      </div>
    </div>)}
    {!somenteLeitura && <div className="flex flex-wrap gap-2"><button type="button" className={campo + ' !w-auto'} onClick={criar}>+ Criar invocação</button><button type="button" className={campo + ' !w-auto'} disabled={!invocacoes.some(e => e.ativa && e.turnos !== null)} onClick={turno}>Avançar 1 turno das invocações</button></div>}
  </section>
}
