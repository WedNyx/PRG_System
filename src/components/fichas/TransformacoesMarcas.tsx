'use client'
import { useMemo, useState } from 'react'
import type { DadosFicha } from '@/lib/sistemas/tipos'

type Forma = { id: string; nome: string; custo: number; hpBonus: number; atributos: Record<string, number>; habilidades: string; observacoes: string; pvForma?: number; deslocamento?: number; imagem?: string; nivel?: number }
const campo = 'w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-sm text-white'
const exemplo: Forma[] = [
  { id: 'uivante', nome: 'Lobisomem Uivante', custo: 7, hpBonus: 20, atributos: { forca: 2, velocidade: 1, vigor: 2 }, habilidades: 'Garras 1d12; mordida 1d6 + sangramento 1d4 por 3 turnos; bote furtivo +1 dado; uivo 3d6; chute da matilha 1d20 (4 PE).', observacoes: 'Hawkins: +5 m de deslocamento; salto 7 m; visão no escuro; olfato; resistência a perfurante e necrótico. Confirmar como se aplica a vida atual.' },
  { id: 'primordial', nome: 'Lobo Primordial', custo: 0, hpBonus: 0, atributos: {}, habilidades: 'Uivo do lobo ascendente: 1d20+1d12 (3 usos por combate); garras ou mordida: 1d12; investida: 1d20+1d8.', nivel: 10, pvForma: 150, observacoes: 'Transformação nível 10 de Hawkins. Forma de lobo completo, não distingue aliados de inimigos. Referência da ficha separada: 150 PV, Força 3, Velocidade 3, Vigor 3, Carisma 0, Inteligência 0. NÃO substituir PV e atributos automaticamente antes de confirmar se são valores absolutos.' }
]
export default function TransformacoesMarcas({ d, onChange, somenteLeitura }: { d: DadosFicha; onChange: (d: DadosFicha) => void; somenteLeitura: boolean }) {
  const formas = useMemo(() => { try { const v: unknown = JSON.parse(d.listas.marcas_transformacoes || '[]'); return Array.isArray(v) ? v.filter((f): f is Forma => !!f && typeof f === 'object' && typeof f.id === 'string' && typeof f.nome === 'string') : [] } catch { return [] } }, [d.listas.marcas_transformacoes])
  const ativa = typeof d.marcas?.marcas_forma_ativa === 'string' ? d.marcas.marcas_forma_ativa : ''
  const [selecionada, setSelecionada] = useState('')
  const forma = formas.find(f => f.id === (selecionada || ativa))
  const salvar = (novas: Forma[]) => onChange({ ...d, listas: { ...d.listas, marcas_transformacoes: JSON.stringify(novas) } })
  const mudar = (id: string) => { setSelecionada(id); onChange({ ...d, marcas: { ...d.marcas, marcas_forma_ativa: id } }) }
  const adicionar = () => salvar([...formas, { id: crypto.randomUUID(), nome: 'Nova transformação', custo: 0, hpBonus: 0, atributos: {}, habilidades: '', observacoes: '' }])
  const editar = (patch: Partial<Forma>) => { if (forma) salvar(formas.map(f => f.id === forma.id ? { ...f, ...patch } : f)) }
  const atr = (id: string) => Number(d.atributos[id] ?? 0) + Number(forma?.atributos?.[id] ?? 0)
  return <section className="space-y-4 rounded-2xl border border-(--ficha-borda) bg-(--ficha-cartao) p-4" aria-label="Transformações de Marcas">
    <h2 className="text-lg font-bold">🐺 Transformações</h2>
    {ativa && <p className="rounded-lg border border-(--a-5e4b78) p-2 text-sm" role="status">Forma ativa: {formas.find(f => f.id === ativa)?.nome ?? 'Forma não encontrada'}. Os valores da ficha base continuam preservados.</p>}
    <p className="text-xs text-(--a-a998bd)">Formas independentes da ficha base. Selecionar uma forma registra a escolha, sem gastar essência ou alterar a vida automaticamente enquanto as regras do JOJO não forem confirmadas.</p>
    <div className="flex flex-wrap gap-2">
      <button type="button" className={campo} aria-pressed={!ativa} onClick={() => mudar('')} disabled={somenteLeitura}>Forma original</button>
      {formas.map(f => <button key={f.id} type="button" className={campo} aria-pressed={ativa === f.id} onClick={() => mudar(f.id)} disabled={somenteLeitura}>{f.nome}{ativa === f.id ? ' ✓' : ''}</button>)}
    </div>
    {!somenteLeitura && <button type="button" onClick={adicionar} className="rounded-lg bg-(--a-5b4380) px-3 py-2 text-sm">+ Criar transformação</button>}
    {forma && <div className="space-y-3 rounded-xl border border-(--a-5e4b78) p-3">
      <label className="block text-sm">Nome<input className={campo} value={forma.nome} disabled={somenteLeitura} onChange={e => editar({ nome: e.target.value })} /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">Custo de essência<input type="number" min={0} className={campo} value={forma.custo ?? 0} disabled={somenteLeitura} onChange={e => editar({ custo: Math.max(0, Number(e.target.value) || 0) })}/></label>
        <label className="text-sm">Bônus de PV<input type="number" className={campo} value={forma.hpBonus ?? 0} disabled={somenteLeitura} onChange={e => editar({ hpBonus: Number(e.target.value) || 0 })}/></label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">PV próprios da forma (opcional)<input type="number" min={0} className={campo} value={forma.pvForma ?? ''} disabled={somenteLeitura} onChange={e => editar({ pvForma: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value) || 0) })}/></label>
        <label className="text-sm">Nível necessário (opcional)<input type="number" min={0} className={campo} value={forma.nivel ?? ''} disabled={somenteLeitura} onChange={e => editar({ nivel: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value) || 0) })}/></label>
      </div>
      <label className="block text-sm">Imagem da forma (URL)<input type="url" className={campo} value={forma.imagem ?? ''} disabled={somenteLeitura} onChange={e => editar({ imagem: e.target.value })}/></label>
      {forma.imagem && /^https:\/\//i.test(forma.imagem) && <img src={forma.imagem} alt={'Aparência de ' + forma.nome} className="max-h-52 rounded-lg object-contain" loading="lazy" />}
      <h3 className="font-semibold">Atributos na forma (base + modificador)</h3>
      <div className="grid grid-cols-2 gap-2">{Object.keys(d.atributos).map(id => <label key={id} className="text-xs">{id}: {atr(id)} <input type="number" className={campo} value={forma.atributos?.[id] ?? 0} disabled={somenteLeitura} aria-label={'Modificador de ' + id} onChange={e => editar({ atributos: { ...forma.atributos, [id]: Number(e.target.value) || 0 } })}/></label>)}</div>
      <label className="block text-sm">Habilidades e rolagens<textarea className={campo} rows={4} value={forma.habilidades ?? ''} disabled={somenteLeitura} onChange={e => editar({ habilidades: e.target.value })}/></label>
      <label className="block text-sm">Condições e observações<textarea className={campo} rows={3} value={forma.observacoes ?? ''} disabled={somenteLeitura} onChange={e => editar({ observacoes: e.target.value })}/></label>
      {!somenteLeitura && <button type="button" className="text-sm text-red-300" onClick={() => { salvar(formas.filter(f => f.id !== forma.id)); if (ativa === forma.id) mudar(''); else setSelecionada('') }}>Excluir transformação</button>}
    </div>}
    {formas.length === 0 && <p className="text-sm text-(--a-a998bd)">Nenhuma transformação cadastrada. Hawkins pode usar o modelo Uivante; Lobo Primordial é uma transformação de Hawkins; a ficha da criatura permanece como referência.</p>}
    {!somenteLeitura && formas.length === 0 && <button type="button" className={campo} onClick={() => salvar(exemplo)}>Adicionar transformações de Hawkins (Uivante e Primordial)</button>}
  </section>
}
