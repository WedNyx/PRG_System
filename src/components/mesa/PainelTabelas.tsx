'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Dices, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/nuvem/cliente'
import { ICONES_TABELA, idDeTabela, LIM_TABELAS, type Tabela } from '@/lib/tabelas'
import { btn, input, msg } from './estilos'

type Acao = (b: Record<string, unknown>) => Promise<Record<string, unknown>>
type Resultado = { id: number; icone: string; nome: string; texto: string; secreto: boolean }
type Rascunho = { id: string | null; nome: string; icone: string; texto: string }

/** Aba “Tabelas” do mestre: geradores prontos + tabelas próprias da campanha, rolados no servidor. */
export default function PainelTabelas({ campanhaId, acao }: { campanhaId: string; acao: Acao }) {
  const [prontas, setProntas] = useState<Tabela[]>([])
  const [minhas, setMinhas] = useState<Tabela[] | null>(null)
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [rascunho, setRascunho] = useState<Rascunho | null>(null)
  const [busca, setBusca] = useState('')
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    let vivo = true
    api<{ prontas: Tabela[]; tabelas: Tabela[] }>(`mesa/${campanhaId}?tabelas=1`)
      .then(r => { if (vivo) { setProntas(r.prontas); setMinhas(r.tabelas) } })
      .catch(e => { if (vivo) { toast.error(msg(e)); setMinhas([]) } })
    return () => { vivo = false }
  }, [campanhaId])

  async function rolar(t: Tabela, secreto: boolean) {
    try {
      const r = await acao({ acao: 'tabela_rolar', id: t.id, visibilidade: secreto ? 'mestre' : 'publica' })
      setResultados(l => [{ id: Date.now(), icone: t.icone, nome: t.nome, texto: String(r.resultado ?? ''), secreto }, ...l].slice(0, 8))
    } catch (e) { toast.error(msg(e)) }
  }

  async function salvar(lista: Tabela[]) {
    setOcupado(true)
    try {
      const r = await acao({ acao: 'tabelas_salvar', tabelas: lista.map(t => ({ id: t.id, nome: t.nome, icone: t.icone, linhas: t.linhas })) })
      setMinhas((r.tabelas as Tabela[]) ?? lista)
      return true
    } catch (e) { toast.error(msg(e)); return false } finally { setOcupado(false) }
  }

  async function salvarRascunho() {
    if (!rascunho || !minhas) return
    const nome = rascunho.nome.trim()
    const linhas = rascunho.texto.split('\n').map(l => l.trim()).filter(Boolean)
    if (!nome) return toast.error('Dê um nome para a tabela.')
    if (!linhas.length) return toast.error('Escreva pelo menos um resultado (um por linha).')
    let id = rascunho.id
    if (!id) {
      const usados = new Set([...prontas, ...minhas].map(t => t.id))
      const base = idDeTabela(nome); id = base
      for (let n = 2; usados.has(id); n++) id = `${base}-${n}`
    }
    const nova: Tabela = { id, nome, icone: rascunho.icone, linhas }
    const lista = rascunho.id ? minhas.map(t => t.id === rascunho.id ? nova : t) : [...minhas, nova]
    if (await salvar(lista)) { setRascunho(null); toast.success('Tabela salva.') }
  }

  async function apagar(t: Tabela) {
    if (!minhas || !confirm(`Apagar a tabela “${t.nome}”?`)) return
    await salvar(minhas.filter(x => x.id !== t.id))
  }

  const filtro = (t: Tabela) => !busca.trim() || t.nome.toLowerCase().includes(busca.trim().toLowerCase())
  const linha = (t: Tabela, propria: boolean) => (
    <li key={t.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-(--a-3b3054) bg-(--s-171428)/80 px-2 py-1.5">
      <span className="text-lg" aria-hidden>{t.icone}</span>
      <span className="min-w-[9rem] flex-1 truncate text-sm" title={t.linhas.length + ' resultados'}>{t.nome}{propria && <span className="block truncate text-[10px] text-(--a-8f88a8)">código: {t.id}</span>}</span>
      <button type="button" className={btn} onClick={() => void rolar(t, false)} aria-label={`Rolar ${t.nome} para todos`}><Dices size={14} /> Rolar</button>
      <button type="button" className={btn} onClick={() => void rolar(t, true)} aria-label={`Rolar ${t.nome} só para mim`} title="Só o mestre vê"><EyeOff size={14} /> Só eu</button>
      {propria && <>
        <button type="button" className={btn} onClick={() => setRascunho({ id: t.id, nome: t.nome, icone: t.icone, texto: t.linhas.join('\n') })} aria-label={`Editar ${t.nome}`}><Pencil size={14} /></button>
        <button type="button" className={btn} onClick={() => void apagar(t)} aria-label={`Apagar ${t.nome}`}><Trash2 size={14} /></button>
      </>}
    </li>
  )

  return <section className="space-y-3" aria-label="Tabelas do mestre">
    <p className="text-xs text-(--a-b4aeca)">Role na hora um nome, um encontro ou um tesouro. <b>Rolar</b> mostra no chat para todos; <b>Só eu</b> fica visível só para o mestre.</p>

    {resultados.length > 0 && <ul className="space-y-1.5" aria-live="polite" aria-label="Últimos resultados">
      {resultados.map((r, i) => <li key={r.id} className={'rounded-lg border px-3 py-2 text-sm ' + (i === 0 ? 'border-(--a-b99bff) bg-(--s-2a2142)' : 'border-(--a-3b3054) bg-(--s-171428)/70 text-(--a-cfc8e6)')}>
        <span className="text-xs text-(--a-b4aeca)">{r.icone} {r.nome}{r.secreto ? ' · 🔒 só você' : ''}</span><br />{r.texto}
      </li>)}
    </ul>}

    <input className={input} placeholder="Procurar tabela…" value={busca} onChange={ev => setBusca(ev.target.value)} aria-label="Procurar tabela" />

    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Da campanha</h3>
        {!rascunho && <button type="button" className={btn} onClick={() => setRascunho({ id: null, nome: '', icone: '🎲', texto: '' })} disabled={!minhas || minhas.length >= LIM_TABELAS.tabelas}><Plus size={14} /> Nova tabela</button>}
      </div>
      {rascunho && <div className="mb-2 space-y-2 rounded-xl border border-(--a-5e4b78) bg-(--s-1d1830) p-3">
        <input className={input} placeholder="Nome (ex.: Nomes de anões)" maxLength={LIM_TABELAS.nome} value={rascunho.nome} onChange={ev => setRascunho({ ...rascunho, nome: ev.target.value })} aria-label="Nome da tabela" />
        <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Ícone">
          {ICONES_TABELA.map(i => <button key={i} type="button" role="radio" aria-checked={rascunho.icone === i} onClick={() => setRascunho({ ...rascunho, icone: i })}
            className={'rounded-md px-1.5 py-0.5 text-lg ' + (rascunho.icone === i ? 'bg-(--s-4a3a6e) ring-1 ring-(--a-b99bff)' : 'hover:bg-(--s-2a2142)')}>{i}</button>)}
        </div>
        <textarea className={input + ' min-h-32 font-mono text-xs'} placeholder={'Um resultado por linha\nEx.: {2d6} moedas de ouro\nEx.: [[nomes]], o ferreiro'} value={rascunho.texto} onChange={ev => setRascunho({ ...rascunho, texto: ev.target.value })} aria-label="Resultados, um por linha" />
        <p className="text-[11px] text-(--a-b4aeca)">Dica: <code>{'{1d6}'}</code> vira um número rolado; <code>{'[[nomes]]'}</code> puxa um resultado de outra tabela (use o código dela: {[...prontas.slice(0, 3), ...(minhas ?? []).slice(0, 2)].map(t => t.id).join(', ')}…).</p>
        <div className="flex gap-2">
          <button type="button" className={btn + ' border-(--a-b99bff)'} disabled={ocupado} onClick={() => void salvarRascunho()}>Salvar</button>
          <button type="button" className={btn} onClick={() => setRascunho(null)}>Cancelar</button>
        </div>
      </div>}
      {minhas === null ? <p className="text-xs text-(--a-b4aeca)">Carregando…</p>
        : minhas.length === 0 && !rascunho ? <p className="text-xs text-(--a-b4aeca)">Nenhuma ainda. Crie listas suas: nomes do seu mundo, encontros da região, tesouros da masmorra.</p>
        : <ul className="space-y-1.5">{minhas.filter(filtro).map(t => linha(t, true))}</ul>}
    </div>

    <div>
      <h3 className="mb-1.5 text-sm font-semibold">Prontas</h3>
      <ul className="space-y-1.5">{prontas.filter(filtro).map(t => linha(t, false))}</ul>
    </div>
  </section>
}
