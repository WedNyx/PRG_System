'use client'
import { useMemo } from 'react'
import type { DadosFicha } from '@/lib/sistemas/tipos'

type Efeito = { id: string; nome: string; origem: string; duracao: number | null; restantes: number | null; descricao: string; alvo: string }
const estilo = 'w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-sm text-white'
function ler(v: string | undefined): Efeito[] { try { const x: unknown = JSON.parse(v || '[]'); return Array.isArray(x) ? x.filter((e): e is Efeito => e !== null && typeof e === 'object' && typeof e.id === 'string' && typeof e.nome === 'string') : [] } catch { return [] } }
export default function EfeitosMarcas({ d, onChange, somenteLeitura }: { d: DadosFicha; onChange: (d: DadosFicha) => void; somenteLeitura: boolean }) {
  const efeitos = useMemo(() => ler(d.listas.marcas_efeitos_json), [d.listas.marcas_efeitos_json])
  const salvar = (lista: Efeito[]) => onChange({ ...d, listas: { ...d.listas, marcas_efeitos_json: JSON.stringify(lista) } })
  const editar = (id: string, patch: Partial<Efeito>) => salvar(efeitos.map(e => e.id === id ? { ...e, ...patch } : e))
  const novo = () => salvar([...efeitos, { id: crypto.randomUUID(), nome: 'Novo efeito', origem: '', duracao: null, restantes: null, descricao: '', alvo: '' }])
  const passarTurno = () => salvar(efeitos.map(e => e.restantes === null ? e : { ...e, restantes: Math.max(0, e.restantes - 1) }))
  return <section className="space-y-3 rounded-2xl border border-(--ficha-borda) bg-(--ficha-cartao) p-4" aria-label="Efeitos temporários de Marcas">
    <h2 className="text-lg font-bold">⏳ Condições e efeitos temporários</h2>
    <p className="text-xs text-(--a-a998bd)">Acompanhe efeitos manualmente. Passar turno reduz contadores definidos, mas não aplica dano, cura, resistência ou penalidades automaticamente. Duração vazia significa desconhecida.</p>
    {efeitos.map(e => <div key={e.id} className="space-y-2 rounded-xl border border-(--a-5e4b78) p-3">
      <label className="block text-xs">Efeito<input className={estilo} value={e.nome} disabled={somenteLeitura} onChange={v => editar(e.id, { nome: v.target.value })}/></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs">Origem<input className={estilo} value={e.origem ?? ''} disabled={somenteLeitura} onChange={v => editar(e.id, { origem: v.target.value })}/></label>
        <label className="text-xs">Alvo<input className={estilo} value={e.alvo ?? ''} disabled={somenteLeitura} onChange={v => editar(e.id, { alvo: v.target.value })}/></label>
        <label className="text-xs">Duração inicial (turnos)<input type="number" min={0} className={estilo} value={e.duracao ?? ''} disabled={somenteLeitura} onChange={v => { const n = v.target.value === '' ? null : Math.max(0, Number(v.target.value) || 0); editar(e.id, { duracao: n, restantes: n }) }}/></label>
        <label className="text-xs">Turnos restantes<input type="number" min={0} className={estilo} value={e.restantes ?? ''} disabled={somenteLeitura} onChange={v => editar(e.id, { restantes: v.target.value === '' ? null : Math.max(0, Number(v.target.value) || 0) })}/></label>
      </div>
      <label className="block text-xs">Efeito mecânico e observações<textarea className={estilo} rows={2} value={e.descricao ?? ''} disabled={somenteLeitura} onChange={v => editar(e.id, { descricao: v.target.value })}/></label>
      <div className="flex flex-wrap items-center gap-2 text-xs"><strong>{e.restantes === null ? 'Duração indefinida' : e.restantes === 0 ? 'Expirado' : e.restantes + ' turno(s) restante(s)'}</strong>{!somenteLeitura && <button type="button" className="text-red-300" onClick={() => salvar(efeitos.filter(x => x.id !== e.id))}>Remover efeito</button>}</div>
    </div>)}
    {!somenteLeitura && <div className="flex flex-wrap gap-2"><button type="button" className={estilo + ' !w-auto'} onClick={novo}>+ Adicionar efeito</button><button type="button" className={estilo + ' !w-auto'} disabled={!efeitos.some(e => e.restantes !== null && e.restantes > 0)} onClick={passarTurno}>Avançar 1 turno</button><button type="button" className={estilo + ' !w-auto'} disabled={!efeitos.some(e => e.restantes === 0)} onClick={() => salvar(efeitos.filter(e => e.restantes !== 0))}>Limpar expirados</button></div>}
  </section>
}
