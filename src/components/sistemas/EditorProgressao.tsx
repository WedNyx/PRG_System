'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { slug } from '@/lib/sistemas/autoral'

export type ClasseProg = { id: string; nome: string; campoNivel: string; tabela: Record<string, number[]> }
export type DefProgressao = { classes: ClasseProg[]; colunas: Record<string, string> }

const input = 'w-full rounded-lg border border-[#5e4b78] bg-[#151123] p-2 text-sm text-white'
const botao = 'inline-flex items-center gap-1 rounded-lg border border-[#5e4b78] px-2.5 py-1.5 text-xs hover:bg-[#34294f] disabled:opacity-40'
const NIVEIS = 20

/** Colunas que a plataforma já sabe usar (as outras viram só variáveis prog_<id>). */
export const COLUNAS_PRONTAS: { id: string; nome: string; dica: string; ganho: (n: number) => number }[] = [
  { id: 'arvore', nome: '🌠 Pontos da árvore', dica: 'Somam sozinhos na árvore de habilidades da ficha.', ganho: () => 1 },
  { id: 'vida', nome: '❤️ Vida', dica: 'Use prog_vida na fórmula da vida máxima (ex.: 10 + prog_vida).', ganho: n => (n === 1 ? 0 : 5) },
  { id: 'atributos', nome: '💪 Pontos de atributo', dica: 'Use prog_atributos num limite (ex.: soma_atributos até 10 + prog_atributos).', ganho: n => ([4, 8, 12, 16, 19].includes(n) ? 1 : 0) },
]

/** Ganho em cada nível ⇄ total acumulado (a ficha usa o total). */
const paraGanhos = (totais: number[]) => totais.map((t, i) => Math.round((t - (i > 0 ? totais[i - 1] : 0)) * 100) / 100)
const paraTotais = (ganhos: number[]) => { let s = 0; return ganhos.map(g => (s = Math.round((s + (Number(g) || 0)) * 100) / 100)) }

export function progressaoNova(campoNivel: string): DefProgressao {
  const tabela = Object.fromEntries(COLUNAS_PRONTAS.map(c => [c.id, paraTotais(Array.from({ length: NIVEIS }, (_, i) => c.ganho(i + 1)))]))
  return { classes: [{ id: 'nivel', nome: 'Nível', campoNivel, tabela }], colunas: Object.fromEntries(COLUNAS_PRONTAS.map(c => [c.id, c.nome])) }
}

/** Editor da progressão por nível: uma tabela (ou várias, uma por classe) com o que se ganha em cada nível. */
export default function EditorProgressao({ valor, mudar, camposNumero, criarCampoNivel, listas = [], ligadas = {}, ligar }: {
  valor: DefProgressao | null; mudar: (v: DefProgressao | null) => void; camposNumero: { id: string; nome: string }[]; criarCampoNivel: () => string
  /** Campos “Lista de opções” (Classe…) e quem escolhe cada tabela. */
  listas?: { id: string; nome: string }[]; ligadas?: Record<string, string[]>; ligar?: (campoId: string) => void
}) {
  const [aba, setAba] = useState(0)
  const [lista, setLista] = useState('')
  const [ate, setAte] = useState(10)
  const [novaCol, setNovaCol] = useState('')
  if (!valor) return <div className="space-y-2 rounded-xl border border-dashed border-[#6d5690] p-3">
    <p className="text-[#d6c8e8]">Diga o que o personagem ganha a cada nível: pontos da árvore, vida, pontos de atributo… A ficha soma sozinha quando o jogador sobe de nível.</p>
    <button type="button" className="rounded-lg bg-[#7652ac] px-3 py-2 text-sm font-semibold" onClick={() => mudar(progressaoNova(camposNumero.find(c => /nivel/i.test(c.id))?.id ?? criarCampoNivel()))}>📈 Ativar progressão por nível</button>
  </div>
  const cl = valor.classes[Math.min(aba, valor.classes.length - 1)]
  const cols = Object.keys(cl.tabela)
  const setClasse = (fn: (c: ClasseProg) => ClasseProg) => mudar({ ...valor, classes: valor.classes.map(c => c.id === cl.id ? fn(c) : c) })
  const setGanho = (col: string, nivel: number, g: number) => setClasse(c => { const ganhos = paraGanhos(c.tabela[col]); ganhos[nivel] = g; return { ...c, tabela: { ...c.tabela, [col]: paraTotais(ganhos) } } })
  const nomeCol = (col: string) => valor.colunas[col] ?? col
  function addColuna(id: string, nome: string) {
    if (!id || cols.includes(id) || cols.length >= 12) return
    mudar({ classes: valor!.classes.map(c => ({ ...c, tabela: { ...c.tabela, [id]: Array(NIVEIS).fill(0) } })), colunas: { ...valor!.colunas, [id]: nome } })
  }
  function addClasse() {
    if (valor!.classes.length >= 6) return
    const ids = new Set(valor!.classes.map(c => c.id)); let id = 'classe', i = 1; while (ids.has(id)) id = 'classe' + ++i
    mudar({ ...valor!, classes: [...valor!.classes, { id, nome: 'Classe ' + (valor!.classes.length + 1), campoNivel: cl.campoNivel, tabela: Object.fromEntries(cols.map(c => [c, Array(NIVEIS).fill(0)])) }] })
    setAba(valor!.classes.length)
  }
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-1.5">
      {valor.classes.map((c, i) => <button key={c.id} type="button" onClick={() => setAba(i)} className={'rounded-full px-3 py-1 text-xs ' + (c.id === cl.id ? 'bg-[#5b4380] text-white' : 'bg-[#1e1a30] text-[#c4b6d4]')}>{c.nome}</button>)}
      <button type="button" className={botao} onClick={addClasse} disabled={valor.classes.length >= 6} title="Para multiclasse: cada classe tem o seu nível e a sua tabela; a ficha soma tudo."><Plus size={12} /> Classe</button>
      <button type="button" className={botao + ' ml-auto text-red-200'} onClick={() => { if (confirm('Desligar a progressão por nível?')) mudar(null) }}><Trash2 size={12} /> Desligar</button>
    </div>
    {listas.length > 0 && ligar && <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-[#6d5690] p-2 text-xs">
      <span>🔗 Uma tabela para cada opção de</span>
      <select aria-label="Lista que escolhe a tabela" value={lista || listas[0].id} onChange={e => setLista(e.target.value)} className={input + ' !w-auto'}>
        {listas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}</select>
      <button type="button" className={botao} onClick={() => { ligar(lista || listas[0].id); setAba(0) }}>Criar e ligar</button>
      <span className="w-full text-[#a998bd]">Cada opção (ex.: Guerreiro, Mago) ganha a sua tabela, começando igual a esta. Na ficha, só vale a tabela da opção escolhida. Até 6 tabelas.</span>
    </div>}
    <p className="text-xs text-[#c9f5d8]">{ligadas[cl.id]?.length ? 'Vale para quem escolher: ' + ligadas[cl.id].join(', ') : 'Vale para todos os personagens.'}</p>
    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
      <label className="block text-xs">Nome<input value={cl.nome} maxLength={40} onChange={e => setClasse(c => ({ ...c, nome: e.target.value }))} className={input + ' mt-1'} placeholder="Ex.: Nível, Guerreiro" /></label>
      <label className="block text-xs">Campo que guarda o nível<select value={cl.campoNivel} onChange={e => setClasse(c => ({ ...c, campoNivel: e.target.value }))} className={input + ' mt-1'}>
        {camposNumero.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}{!camposNumero.some(c => c.id === cl.campoNivel) && <option value={cl.campoNivel}>(escolha)</option>}</select></label>
      {valor.classes.length > 1 && <button type="button" className={botao + ' self-end text-red-200'} onClick={() => { mudar({ ...valor, classes: valor.classes.filter(c => c.id !== cl.id) }); setAba(0) }}><Trash2 size={12} /> Tirar classe</button>}
    </div>
    <div className="overflow-x-auto rounded-xl border border-[#3d3152]">
      <table className="w-full min-w-[420px] text-xs">
        <thead className="bg-[#1e1a30] text-[#d6c8e8]"><tr><th className="p-2 text-left">Nível</th>
          {cols.map(col => <th key={col} className="p-2 text-left font-semibold"><span className="flex items-center gap-1">{nomeCol(col)}
            <button type="button" aria-label={'Tirar coluna ' + nomeCol(col)} onClick={() => mudar({ classes: valor.classes.map(c => { const t = { ...c.tabela }; delete t[col]; return { ...c, tabela: t } }), colunas: valor.colunas })} className="rounded p-0.5 text-[#f2a9c3] hover:bg-[#2b2140]"><Trash2 size={11} /></button></span>
            <span className="block font-mono text-[10px] font-normal text-[#a998bd]">prog_{col}</span></th>)}</tr></thead>
        <tbody>{Array.from({ length: ate }, (_, n) => <tr key={n} className="border-t border-[#2b2140]">
          <td className="p-2 font-semibold">{n + 1}</td>
          {cols.map(col => { const ganhos = paraGanhos(cl.tabela[col])
            return <td key={col} className="p-1"><div className="flex items-center gap-1"><span className="text-[#a998bd]">+</span>
              <input type="number" aria-label={`${nomeCol(col)} ganho no nível ${n + 1}`} value={ganhos[n] ?? 0} onChange={e => setGanho(col, n, Number(e.target.value) || 0)} className="w-14 rounded border border-[#4a3d63] bg-[#151123] p-1 text-white" />
              <span className="text-[10px] text-[#a998bd]" title="Total neste nível">= {cl.tabela[col][n]}</span></div></td> })}
        </tr>)}</tbody>
      </table>
    </div>
    <button type="button" className={botao} onClick={() => setAte(a => a === 10 ? 20 : 10)}>{ate === 10 ? 'Mostrar até o nível 20' : 'Mostrar só até o 10'}</button>
    <div className="flex flex-wrap items-center gap-1.5">
      {COLUNAS_PRONTAS.filter(c => !cols.includes(c.id)).map(c => <button key={c.id} type="button" className={botao} title={c.dica} onClick={() => addColuna(c.id, c.nome)}><Plus size={12} /> {c.nome}</button>)}
      <input value={novaCol} onChange={e => setNovaCol(e.target.value)} maxLength={40} placeholder="Outra coluna (ex.: Mana)" className={input + ' !w-44'} />
      <button type="button" className={botao} disabled={!slug(novaCol)} onClick={() => { addColuna(slug(novaCol), novaCol.trim()); setNovaCol('') }}><Plus size={12} /> Coluna</button>
    </div>
    <ul className="space-y-1 text-[11px] text-[#a998bd]">
      <li>Cada número é quanto o personagem <strong>ganha</strong> naquele nível; a ficha soma até o nível atual (o “=” mostra o total).</li>
      {COLUNAS_PRONTAS.filter(c => cols.includes(c.id)).map(c => <li key={c.id}>{c.nome}: {c.dica}</li>)}
      <li>Outras colunas viram a variável <span className="font-mono">prog_nome</span> para usar nas fórmulas.</li>
    </ul>
  </div>
}
