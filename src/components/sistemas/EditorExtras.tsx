'use client'

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import type { CapituloRegra, SecaoFicha, TabelaDef } from '@/lib/sistemas/tipos'

/**
 * Partes do construtor que deixam o autor escrever o sistema do jeito dele (v0.35.6):
 * regras em capítulos, tabelas para rolar e os nomes das partes da ficha.
 */
const input = 'w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-sm text-white'
const pequeno = 'rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-sm text-white'
const botao = 'inline-flex items-center gap-1 rounded-lg border border-(--a-5e4b78) px-2.5 py-1.5 text-xs hover:bg-(--s-34294f) disabled:opacity-40'
const icone = 'rounded-lg p-1.5 hover:bg-(--s-34294f) disabled:opacity-30'

export const NOMES_SECOES: [SecaoFicha, string][] = [['principal', 'Principal'], ['atributos', 'Atributos e perícias'], ['habilidades', 'Poderes e habilidades'], ['equipamentos', 'Inventário'], ['anotacoes', 'Anotações e regras'], ['marcas', 'Marcas'], ['formas', 'Transformações'], ['invocacoes', 'Invocações'], ['efeitos', 'Efeitos']]

const mover = <T,>(l: T[], i: number, d: -1 | 1) => { const j = i + d; if (j < 0 || j >= l.length) return l; const n = [...l]; [n[i], n[j]] = [n[j], n[i]]; return n }

export function EditorRegras({ regras, mudar }: { regras: CapituloRegra[]; mudar: (r: CapituloRegra[]) => void }) {
  const set = (i: number, v: Partial<CapituloRegra>) => mudar(regras.map((r, k) => k === i ? { ...r, ...v } : r))
  return <div className="space-y-2">
    <p className="text-xs text-(--a-c4b6d4)">Cada capítulo abre e fecha na ficha. Deixe uma linha em branco para separar parágrafos.</p>
    {regras.map((r, i) => <div key={i} className="space-y-1 rounded-xl bg-(--s-171325) p-2">
      <div className="flex gap-1">
        <input aria-label="Título do capítulo" value={r.titulo} maxLength={80} onChange={e => set(i, { titulo: e.target.value })} className={input} placeholder="Ex.: Combate" />
        <button type="button" aria-label="Subir capítulo" disabled={i === 0} onClick={() => mudar(mover(regras, i, -1))} className={icone}><ArrowUp size={15} /></button>
        <button type="button" aria-label="Descer capítulo" disabled={i === regras.length - 1} onClick={() => mudar(mover(regras, i, 1))} className={icone}><ArrowDown size={15} /></button>
        <button type="button" aria-label="Tirar capítulo" onClick={() => { if (!r.texto.trim() || confirm('Tirar o capítulo “' + (r.titulo || 'sem título') + '”?')) mudar(regras.filter((_, k) => k !== i)) }} className={icone + ' text-red-200'}><Trash2 size={15} /></button>
      </div>
      <textarea aria-label={'Texto de ' + (r.titulo || 'capítulo')} rows={5} value={r.texto} maxLength={6000} onChange={e => set(i, { texto: e.target.value })} className={input} placeholder="Escreva a regra como no seu livro." />
      <p className="text-right text-[10px] text-(--a-a998bd)">{r.texto.length}/6000</p>
    </div>)}
    {regras.length < 30 && <button type="button" className={botao} onClick={() => mudar([...regras, { titulo: '', texto: '' }])}><Plus size={14} /> Capítulo</button>}
  </div>
}

export function EditorTabelas({ tabelas, campos, mudar }: { tabelas: TabelaDef[]; campos: { id: string; nome: string }[]; mudar: (t: TabelaDef[]) => void }) {
  const set = (i: number, v: Partial<TabelaDef>) => mudar(tabelas.map((t, k) => k === i ? { ...t, ...v } : t))
  const lados = (dado: string) => { const m = /^(\d+)d(\d+)$/i.exec(dado.trim()); return m ? Number(m[1]) * Number(m[2]) : 0 }
  return <div className="space-y-3">
    <p className="text-xs text-(--a-c4b6d4)">Na ficha (Anotações e regras), a pessoa toca em “Rolar” e vê a linha. Se escolher um campo, dá para guardar o resultado nele.</p>
    {tabelas.map((t, i) => <div key={i} className="space-y-2 rounded-xl bg-(--s-171325) p-2">
      <div className="flex flex-wrap gap-2">
        <input aria-label="Nome da tabela" value={t.nome} maxLength={60} onChange={e => set(i, { nome: e.target.value })} className={input + ' min-w-0 flex-1'} placeholder="Ex.: Traumas" />
        <input aria-label="Dado da tabela" value={t.dado} maxLength={8} onChange={e => set(i, { dado: e.target.value.replace(/[^0-9d]/gi, '').toLowerCase() })} className={pequeno + ' w-20 font-mono'} placeholder="1d10" />
        <button type="button" aria-label="Tirar tabela" onClick={() => { if (confirm('Tirar a tabela “' + (t.nome || 'sem nome') + '”?')) mudar(tabelas.filter((_, k) => k !== i)) }} className={icone + ' text-red-200'}><Trash2 size={15} /></button>
      </div>
      <label className="flex flex-wrap items-center gap-2 text-xs">Guardar o resultado em
        <select value={t.campo ?? ''} onChange={e => set(i, { campo: e.target.value || undefined })} className={pequeno}><option value="">Nenhum campo</option>{campos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
      {t.linhas.map((l, k) => <div key={k} className="flex gap-1">
        <input aria-label="De" type="number" value={l.de} onChange={e => set(i, { linhas: t.linhas.map((x, j) => j === k ? { ...x, de: Number(e.target.value) || 0 } : x) })} className={pequeno + ' w-14 text-center'} />
        <input aria-label="Até" type="number" value={l.ate} onChange={e => set(i, { linhas: t.linhas.map((x, j) => j === k ? { ...x, ate: Number(e.target.value) || 0 } : x) })} className={pequeno + ' w-14 text-center'} />
        <input aria-label={'Resultado ' + l.de} value={l.texto} maxLength={400} onChange={e => set(i, { linhas: t.linhas.map((x, j) => j === k ? { ...x, texto: e.target.value } : x) })} className={input + ' min-w-0 flex-1'} placeholder="O que acontece" />
        <button type="button" aria-label="Tirar linha" onClick={() => set(i, { linhas: t.linhas.filter((_, j) => j !== k) })} className={icone}><Trash2 size={14} /></button>
      </div>)}
      <div className="flex flex-wrap gap-2">
        {t.linhas.length < 100 && <button type="button" className={botao} onClick={() => { const u = t.linhas.at(-1)?.ate ?? 0; set(i, { linhas: [...t.linhas, { de: u + 1, ate: u + 1, texto: '' }] }) }}><Plus size={14} /> Linha</button>}
        {!t.linhas.length && lados(t.dado) > 0 && lados(t.dado) <= 100 && <button type="button" className={botao} onClick={() => set(i, { linhas: Array.from({ length: lados(t.dado) }, (_, k) => ({ de: k + 1, ate: k + 1, texto: '' })) })}>Uma linha para cada número (1 a {lados(t.dado)})</button>}
      </div>
      <p className="text-[11px] text-(--a-a998bd)">Linhas sem texto não são salvas.</p>
    </div>)}
    {tabelas.length < 10 && <button type="button" className={botao} onClick={() => mudar([...tabelas, { id: '', nome: '', dado: '1d6', linhas: [] }])}><Plus size={14} /> Tabela</button>}
  </div>
}
