'use client'

import { Plus, Trash2 } from 'lucide-react'

export type OpcaoDef = { nome: string; descricao?: string; bonus?: { alvo: string; valor: number }[]; progressao?: string }
const input = 'w-full rounded-lg border border-[#5e4b78] bg-[#151123] p-2 text-sm text-white'
const botao = 'inline-flex items-center gap-1 rounded-lg border border-[#5e4b78] px-2.5 py-1.5 text-xs hover:bg-[#34294f] disabled:opacity-40'

/** Opções de um campo “escolha” (ex.: Classe → Guerreiro, Mago…), cada uma com descrição e bônus automáticos. */
export default function EditorOpcoes({ opcoes, mudar, alvos, tabelas = [] }: { opcoes: OpcaoDef[]; mudar: (o: OpcaoDef[]) => void; alvos: { id: string; nome: string }[]; tabelas?: { id: string; nome: string }[] }) {
  const set = (i: number, o: Partial<OpcaoDef>) => mudar(opcoes.map((x, k) => k === i ? { ...x, ...o } : x))
  return <div className="space-y-2 rounded-lg border border-[#3d3152] p-2">
    <p className="text-[11px] text-[#a998bd]">O jogador escolhe uma destas opções na ficha. Os bônus entram sozinhos (como um item equipado).</p>
    {opcoes.map((o, i) => <div key={i} className="space-y-1.5 rounded-lg bg-[#1e1a30] p-2">
      <div className="flex gap-2">
        <input aria-label={`Nome da opção ${i + 1}`} value={o.nome} maxLength={60} onChange={e => set(i, { nome: e.target.value })} className={input} placeholder="Ex.: Guerreiro" />
        <button type="button" aria-label={`Remover opção ${o.nome || i + 1}`} onClick={() => mudar(opcoes.filter((_, k) => k !== i))} className="rounded-lg px-2 text-[#f2a9c3] hover:bg-[#2b2140]"><Trash2 size={14} /></button>
      </div>
      <textarea aria-label={`Descrição da opção ${i + 1}`} rows={2} value={o.descricao ?? ''} maxLength={400} onChange={e => set(i, { descricao: e.target.value })} className={input} placeholder="O que essa opção significa (aparece na ficha)" />
      {tabelas.length > 0 && <label className="flex items-center gap-2 text-xs">📈 Tabela de níveis
        <select aria-label={`Tabela de níveis da opção ${o.nome || i + 1}`} value={o.progressao ?? ''} onChange={e => set(i, { progressao: e.target.value || undefined })} className={input + ' !w-auto'}>
          <option value="">Nenhuma</option>{tabelas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></label>}
      {(o.bonus ?? []).map((b, j) => <div key={j} className="flex items-center gap-2 text-xs">
        <input type="number" aria-label="Valor do bônus" value={b.valor} onChange={e => set(i, { bonus: o.bonus!.map((x, k) => k === j ? { ...x, valor: Number(e.target.value) || 0 } : x) })} className={input + ' !w-16'} />
        <span>em</span>
        <select aria-label="Onde o bônus entra" value={b.alvo} onChange={e => set(i, { bonus: o.bonus!.map((x, k) => k === j ? { ...x, alvo: e.target.value } : x) })} className={input}>
          {!alvos.some(a => a.id === b.alvo) && <option value={b.alvo}>(escolha)</option>}
          {alvos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
        <button type="button" aria-label="Remover bônus" onClick={() => set(i, { bonus: o.bonus!.filter((_, k) => k !== j) })} className="rounded-lg px-1.5 text-[#f2a9c3] hover:bg-[#2b2140]"><Trash2 size={13} /></button>
      </div>)}
      {(o.bonus?.length ?? 0) < 6 && alvos.length > 0 && <button type="button" className={botao} onClick={() => set(i, { bonus: [...(o.bonus ?? []), { alvo: alvos[0].id, valor: 1 }] })}><Plus size={12} /> Bônus</button>}
    </div>)}
    {opcoes.length < 30 && <button type="button" className={botao} onClick={() => mudar([...opcoes, { nome: '' }])}><Plus size={12} /> Opção</button>}
  </div>
}
