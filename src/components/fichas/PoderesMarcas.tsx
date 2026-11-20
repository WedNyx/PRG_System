'use client'
import { useMemo } from 'react'
import type { DadosFicha } from '@/lib/sistemas/tipos'

type Poder = { id: string; nome: string; dano: string; custo: number | null; usosMax: number | null; descricao: string; tipo: string }
const cls = 'w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-sm text-white'
function parse<T>(v: string | undefined, fallback: T): T { try { const parsed: unknown = JSON.parse(v || ''); return Array.isArray(fallback) ? (Array.isArray(parsed) ? parsed : fallback) as T : parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as T : fallback } catch { return fallback } }
export default function PoderesMarcas({ d, onChange, somenteLeitura }: { d: DadosFicha; onChange: (d: DadosFicha) => void; somenteLeitura: boolean }) {
  const poderes = useMemo(() => parse<Poder[]>(d.listas.marcas_poderes_json, []), [d.listas.marcas_poderes_json])
  const usados = useMemo(() => parse<Record<string, number>>(d.listas.marcas_usos_json, {}), [d.listas.marcas_usos_json])
  const salvar = (lista: Poder[]) => onChange({ ...d, listas: { ...d.listas, marcas_poderes_json: JSON.stringify(lista) } })
  const marcar = (id: string, qtd: number) => onChange({ ...d, listas: { ...d.listas, marcas_usos_json: JSON.stringify({ ...usados, [id]: Math.max(0, qtd) }) } })
  const editar = (id: string, patch: Partial<Poder>) => salvar(poderes.map(p => p.id === id ? { ...p, ...patch } : p))
  const criar = () => salvar([...poderes, { id: crypto.randomUUID(), nome: 'Novo poder', dano: '', custo: null, usosMax: null, descricao: '', tipo: 'habilidade' }])
  return <section className="space-y-3 rounded-2xl border border-(--ficha-borda) bg-(--ficha-cartao) p-4" aria-label="Poderes estruturados de Marcas">
    <h2 className="text-lg font-bold">⚔️ Poderes e usos por combate</h2>
    <p className="text-xs text-(--a-a998bd)">Registre dados, custos e limites. O contador é manual: não desconta essência nem altera a ficha automaticamente. Um limite vazio significa uso não definido, não ilimitado.</p>
    {poderes.map(p => <div key={p.id} className="space-y-2 rounded-xl border border-(--a-5e4b78) p-3">
      <label className="block text-xs">Nome<input className={cls} value={p.nome} disabled={somenteLeitura} onChange={e => editar(p.id, { nome: e.target.value })}/></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs">Dado / expressão<input className={cls} placeholder="1d12" value={p.dano} disabled={somenteLeitura} onChange={e => editar(p.id, { dano: e.target.value })}/></label>
        <label className="text-xs">Tipo<input className={cls} value={p.tipo} disabled={somenteLeitura} onChange={e => editar(p.id, { tipo: e.target.value })}/></label>
        <label className="text-xs">Custo (vazio = indefinido)<input className={cls} type="number" min={0} value={p.custo ?? ''} disabled={somenteLeitura} onChange={e => editar(p.id, { custo: e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0) })}/></label>
        <label className="text-xs">Usos por combate<input className={cls} type="number" min={0} value={p.usosMax ?? ''} disabled={somenteLeitura} onChange={e => editar(p.id, { usosMax: e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0) })}/></label>
      </div>
      <label className="block text-xs">Efeito e condições<textarea className={cls} rows={2} value={p.descricao} disabled={somenteLeitura} onChange={e => editar(p.id, { descricao: e.target.value })}/></label>
      <div className="flex flex-wrap items-center gap-2 text-sm"><span>Usados: {usados[p.id] ?? 0}{p.usosMax !== null ? ' / ' + p.usosMax : ' (limite indefinido)'}</span>
        <button type="button" className={cls + ' !w-auto'} disabled={somenteLeitura || (p.usosMax !== null && (usados[p.id] ?? 0) >= p.usosMax)} onClick={() => marcar(p.id, (usados[p.id] ?? 0) + 1)}>Registrar uso</button>
        <button type="button" className={cls + ' !w-auto'} disabled={somenteLeitura || !(usados[p.id] > 0)} onClick={() => marcar(p.id, (usados[p.id] ?? 0) - 1)}>Desfazer</button>
        {!somenteLeitura && <button type="button" className="text-red-300" onClick={() => salvar(poderes.filter(x => x.id !== p.id))}>Excluir</button>}
      </div>
    </div>)}
    {!somenteLeitura && <div className="flex flex-wrap gap-2"><button type="button" className={cls + ' !w-auto'} onClick={criar}>+ Adicionar poder</button><button type="button" className={cls + ' !w-auto'} onClick={() => onChange({ ...d, listas: { ...d.listas, marcas_usos_json: '{}' } })}>Reiniciar usos do combate</button></div>}
  </section>
}
