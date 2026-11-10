'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import ArteItem from './ArteItem'
import { arteDoItem, CORES_FORJA, corDaRaridade, FORMAS, nomeAleatorio, RARIDADES, type ArteItem as ArteItemT } from '@/lib/itensArte'
import { Backpack, Dice5, Minus, Moon, Pencil, Plus, Shield, Sparkles, Trash2, X } from 'lucide-react'
import type { Calculo } from '@/lib/sistemas/calculo'
import type { DadosFicha, Sistema } from '@/lib/sistemas/tipos'
import { alvosDeBonus, CATEGORIAS_ITEM, lerItens, lerPoderes, lerUso, normalizarItem, normalizarPoder, podeUsar, TIPOS_PODER, type Bonus, type Item, type Poder, type Uso } from '@/lib/sistemas/inventario'

const card = 'rounded-2xl border border-[#55456e] bg-[#201a32] p-4 sm:p-5'
const input = 'w-full rounded-lg border border-[#5e4b78] bg-[#151123] p-2 text-white disabled:opacity-70'
const botao = 'inline-flex items-center gap-1 rounded-lg border border-[#5e4b78] px-2.5 py-1.5 text-xs hover:bg-[#34294f] disabled:opacity-40'
const novoId = () => Math.random().toString(36).slice(2, 12)
export type Rolar = (expressao: string, rotulo: string) => Promise<void>

type Props = { s: Sistema; d: DadosFicha; c: Calculo; onChange: (d: DadosFicha) => void; somenteLeitura: boolean; rolar: Rolar }

/** Seção “Inventário”: itens com quantidade, peso, equipado, dano e bônus automáticos. */
export function InventarioFicha({ s, d, c, onChange, somenteLeitura, rolar }: Props) {
  const itens = lerItens(d.itens), uso = lerUso(d.uso)
  const [editando, setEditando] = useState<Item | null>(null)
  const salvarUso = (u: Uso) => onChange({ ...d, uso: u })
  const qtd = (it: Item) => uso.itens[it.id]?.qtd ?? 1
  const mudarQtd = (it: Item, delta: number) => salvarUso({ ...uso, itens: { ...uso.itens, [it.id]: { equipado: uso.itens[it.id]?.equipado ?? false, qtd: Math.max(0, qtd(it) + delta) } } })
  const equipar = (it: Item) => salvarUso({ ...uso, itens: { ...uso.itens, [it.id]: { qtd: qtd(it), equipado: !uso.itens[it.id]?.equipado } } })
  function salvarItem(it: Item) {
    const existe = itens.some(x => x.id === it.id)
    onChange({ ...d, itens: existe ? itens.map(x => x.id === it.id ? it : x) : [...itens, it], uso: existe ? uso : { ...uso, itens: { ...uso.itens, [it.id]: { qtd: 1, equipado: false } } } })
    setEditando(null)
  }
  function remover(it: Item) {
    if (!confirm(`Remover "${it.nome}" do inventário?`)) return
    const { [it.id]: _, ...resto } = uso.itens; void _
    onChange({ ...d, itens: itens.filter(x => x.id !== it.id), uso: { ...uso, itens: resto } })
  }
  async function usarConsumivel(it: Item) {
    if (qtd(it) <= 0) return
    mudarQtd(it, -1)
    if (it.dano) await rolar(it.dano, it.nome)
    else toast(`${it.nome} usado`, { description: `Restam ${qtd(it) - 1}` })
  }
  const nomeAlvo = Object.fromEntries(alvosDeBonus(s).map(a => [a.id, a.nome]))
  const pct = c.carga.max ? Math.min(100, (c.carga.total / c.carga.max) * 100) : 0

  return <section className={card}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 font-bold text-[#ed9cd8]"><Backpack size={18} /> Inventário</h2>
      {!somenteLeitura && <button type="button" className={botao} onClick={() => setEditando({ id: novoId(), nome: '', categoria: 'equipamento', peso: 0, bonus: [] })}><Plus size={14} /> Novo item</button>}
    </div>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl bg-[#171325] p-3 text-sm">
        <p className="text-xs text-[#c4b6d4]">Carga{s.carga?.dica ? ' · ' + s.carga.dica : ''}</p>
        <p className="text-lg font-bold">{c.carga.total} {c.carga.max !== null ? `/ ${c.carga.max}` : ''} <span className="text-xs font-normal text-[#c4b6d4]">{c.carga.unidade}</span></p>
        {c.carga.max ? <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#2b2140]"><div className={'h-full transition-all ' + (c.carga.total > c.carga.max ? 'bg-red-400' : 'bg-[#b06ad8]')} style={{ width: pct + '%' }} /></div> : null}
        {c.carga.max !== null && c.carga.total > c.carga.max && <p className="mt-1 text-xs text-red-200">Acima da capacidade!</p>}
      </div>
      <label className="rounded-xl bg-[#171325] p-3 text-xs text-[#c4b6d4]">💰 Carteira (moedas e valores)
        <input value={uso.carteira} disabled={somenteLeitura} maxLength={500} onChange={e => salvarUso({ ...uso, carteira: e.target.value })} placeholder="Ex.: 35 PO, 12 PP" className={input + ' mt-1 text-sm'} /></label>
    </div>
    {Object.keys(c.bonus).length > 0 && <p className="mt-3 rounded-lg bg-[#1f3a2c] p-2 text-xs text-[#a9f0c8]">Itens equipados somando: {Object.entries(c.bonus).map(([a, v]) => `${nomeAlvo[a] ?? a} ${v >= 0 ? '+' : ''}${v}`).join(' · ')}</p>}
    {!itens.length && <p className="mt-3 text-sm text-[#bfb2cf]">Nenhum item ainda.{!somenteLeitura && ' Toque em “Novo item”.'}</p>}
    {CATEGORIAS_ITEM.map(cat => {
      const lista = itens.filter(i => i.categoria === cat.id); if (!lista.length) return null
      return <div key={cat.id} className="mt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#d3adf0]">{cat.icone} {cat.nome}</h3>
        <ul className="space-y-2">{lista.map(it => {
          const eq = !!uso.itens[it.id]?.equipado, n = qtd(it)
          return <li key={it.id} className={'rounded-xl border p-3 ' + (eq ? 'border-[#8b6cba] bg-[#2b2143]' : 'border-transparent bg-[#171325]') + (n <= 0 ? ' opacity-60' : '')}>
            <div className="flex items-center gap-3">
              <ArteItem item={it} tamanho={46} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{it.nome}{eq && <span className="ml-2 rounded bg-[#5b4380] px-1.5 py-0.5 text-[10px]">equipado</span>}</span>
                <span className="block text-[11px]">{it.raridade && <strong style={{ color: corDaRaridade(it.raridade) }}>{RARIDADES.find(x => x.id === it.raridade)?.nome} · </strong>}<span className="text-[#c4b6d4]">{it.peso ? `${it.peso} ${c.carga.unidade} cada` : ''}</span></span>
              </span>
            </div>
            {(it.bonus.length > 0 || it.descricao) && <p className="mt-1 text-xs text-[#c9bcd9]">{it.bonus.map(b => `${nomeAlvo[b.alvo] ?? b.alvo} ${b.valor >= 0 ? '+' : ''}${b.valor}`).join(' · ')}{it.bonus.length && it.descricao ? ' — ' : ''}{it.descricao}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center rounded-lg border border-[#5e4b78]">
                <button type="button" disabled={somenteLeitura || n <= 0} onClick={() => mudarQtd(it, -1)} aria-label={'Menos ' + it.nome} className="px-2 py-1 disabled:opacity-40"><Minus size={13} /></button>
                <span className="min-w-8 text-center text-sm tabular-nums" aria-label="Quantidade">{n}</span>
                <button type="button" disabled={somenteLeitura} onClick={() => mudarQtd(it, 1)} aria-label={'Mais ' + it.nome} className="px-2 py-1 disabled:opacity-40"><Plus size={13} /></button>
              </span>
              {it.categoria !== 'consumivel' && it.categoria !== 'tesouro' && <button type="button" className={botao} disabled={somenteLeitura || n <= 0} onClick={() => equipar(it)}><Shield size={13} /> {eq ? 'Desequipar' : 'Equipar'}</button>}
              {it.categoria === 'consumivel' && <button type="button" className={botao} disabled={somenteLeitura || n <= 0} onClick={() => void usarConsumivel(it)}><Sparkles size={13} /> Usar</button>}
              {it.dano && it.categoria !== 'consumivel' && <button type="button" className={botao} onClick={() => void rolar(it.dano!, it.nome)}><Dice5 size={13} /> {it.dano}</button>}
              {!somenteLeitura && <><button type="button" className={botao} onClick={() => setEditando(it)} aria-label={'Editar ' + it.nome}><Pencil size={13} /></button>
                <button type="button" className={botao} onClick={() => remover(it)} aria-label={'Remover ' + it.nome}><Trash2 size={13} /></button></>}
            </div>
          </li>
        })}</ul>
      </div>
    })}
    {editando && <EditorItem s={s} inicial={editando} salvar={salvarItem} fechar={() => setEditando(null)} />}
  </section>
}

/** Seção “Poderes”: magias e habilidades com custo em recurso, usos por descanso e rolagem. */
export function PoderesFicha({ s, d, c, onChange, somenteLeitura, rolar }: Props) {
  const poderes = lerPoderes(d.poderes), uso = lerUso(d.uso)
  const [editando, setEditando] = useState<Poder | null>(null)
  const nomeRecurso = Object.fromEntries(s.recursos.map(r => [r.id, r.nome]))
  function salvarPoder(p: Poder) {
    onChange({ ...d, poderes: poderes.some(x => x.id === p.id) ? poderes.map(x => x.id === p.id ? p : x) : [...poderes, p] }); setEditando(null)
  }
  function remover(p: Poder) {
    if (!confirm(`Remover "${p.nome}"?`)) return
    const { [p.id]: _, ...resto } = uso.poderes; void _
    onChange({ ...d, poderes: poderes.filter(x => x.id !== p.id), uso: { ...uso, poderes: resto } })
  }
  async function usar(p: Poder) {
    const atual = p.recurso ? d.recursos[p.recurso]?.atual ?? 0 : undefined
    const v = podeUsar(p, uso, atual)
    if (!v.ok) { toast.error(v.motivo); return }
    const recursos = p.recurso && p.custo ? { ...d.recursos, [p.recurso]: { ...d.recursos[p.recurso], atual: (atual ?? 0) - p.custo } } : d.recursos
    onChange({ ...d, recursos, uso: { ...uso, poderes: { ...uso.poderes, [p.id]: (uso.poderes[p.id] ?? 0) + (p.usosMax ? 1 : 0) } } })
    if (p.expressao) await rolar(p.expressao, p.nome)
    else toast(`${p.nome} usado`, { description: p.recurso && p.custo ? `−${p.custo} ${nomeRecurso[p.recurso] ?? p.recurso}` : undefined })
  }
  const descansar = () => { onChange({ ...d, uso: { ...uso, poderes: {} } }); toast.success('Usos recuperados!') }
  const comUsos = poderes.some(p => p.usosMax && uso.poderes[p.id])

  return <section className={card}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 font-bold text-[#ed9cd8]"><Sparkles size={18} /> Poderes e magias</h2>
      <div className="flex gap-2">
        {comUsos && !somenteLeitura && <button type="button" className={botao} onClick={descansar} title="Zera os usos gastos"><Moon size={14} /> Descansar</button>}
        {!somenteLeitura && <button type="button" className={botao} onClick={() => setEditando({ id: novoId(), nome: '', tipo: 'habilidade' })}><Plus size={14} /> Novo poder</button>}
      </div>
    </div>
    {!poderes.length && <p className="mt-3 text-sm text-[#bfb2cf]">Nenhum poder ainda.{!somenteLeitura && ' Toque em “Novo poder”.'}</p>}
    <ul className="mt-3 space-y-2">{poderes.map(p => {
      const tipo = TIPOS_PODER.find(t => t.id === p.tipo)!, gastos = uso.poderes[p.id] ?? 0
      const atual = p.recurso ? d.recursos[p.recurso]?.atual ?? 0 : undefined
      const ok = podeUsar(p, uso, atual).ok
      return <li key={p.id} className="rounded-xl bg-[#171325] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 flex-1 font-semibold">{tipo.icone} {p.nome}</span>
          <span className="rounded bg-[#2b2140] px-1.5 py-0.5 text-[10px] text-[#d6c8e8]">{tipo.nome}</span>
          {p.id.startsWith('arv-') && <span className="rounded bg-[#3b2b57] px-1.5 py-0.5 text-[10px] text-amber-200" title="Vem de um hexágono liberado; muda na Árvore de habilidades">🌠 Árvore</span>}
        </div>
        <p className="mt-1 text-xs text-[#c9bcd9]">
          {[p.recurso && p.custo ? `Custo: ${p.custo} ${nomeRecurso[p.recurso] ?? p.recurso}` : '', p.usosMax ? `Usos: ${p.usosMax - gastos}/${p.usosMax}` : '', p.expressao ? `Rolagem: ${p.expressao}` : ''].filter(Boolean).join(' · ')}
          {p.descricao && <span className="mt-1 block whitespace-pre-wrap">{p.descricao}</span>}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button type="button" className={botao} disabled={somenteLeitura || !ok} onClick={() => void usar(p)}><Sparkles size={13} /> Usar</button>
          {p.expressao && <button type="button" className={botao} onClick={() => void rolar(p.expressao!, p.nome)}><Dice5 size={13} /> Só rolar</button>}
          {!somenteLeitura && !p.id.startsWith('arv-') && <><button type="button" className={botao} onClick={() => setEditando(p)} aria-label={'Editar ' + p.nome}><Pencil size={13} /></button>
            <button type="button" className={botao} onClick={() => remover(p)} aria-label={'Remover ' + p.nome}><Trash2 size={13} /></button></>}
        </div>
      </li>
    })}</ul>
    {c && editando && <EditorPoder s={s} inicial={editando} salvar={salvarPoder} fechar={() => setEditando(null)} />}
  </section>
}

function Janela({ titulo, fechar, children }: { titulo: string; fechar: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-3 sm:items-center" onMouseDown={e => { if (e.target === e.currentTarget) fechar() }}>
    <div role="dialog" aria-modal="true" aria-label={titulo} className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#6d5690] bg-[#1b1529] p-5 text-sm text-[#f2ebff]">
      <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">{titulo}</h2><button type="button" onClick={fechar} aria-label="Fechar" className="rounded-lg p-1.5 hover:bg-[#38294d]"><X size={18} /></button></div>
      {children}
    </div>
  </div>
}

/** Editor de item (usado na ficha e na biblioteca do mestre). `s` pode faltar (biblioteca sem sistema conhecido). */
export function EditorItem({ s, inicial, salvar, fechar }: { s?: Sistema; inicial: Item; salvar: (i: Item) => void; fechar: () => void }) {
  const [it, setIt] = useState<Item>(inicial)
  const alvos = s ? alvosDeBonus(s) : []
  const setB = (i: number, b: Partial<Bonus>) => setIt({ ...it, bonus: it.bonus.map((x, k) => k === i ? { ...x, ...b } : x) })
  return <Janela titulo={inicial.nome ? 'Editar item' : 'Novo item'} fechar={fechar}>
    <form className="space-y-3" onSubmit={e => { e.preventDefault(); const v = normalizarItem(it); if (!v) { toast.error('Dê um nome ao item.'); return } salvar({ ...v, id: inicial.id }) }}>
      <Forja it={it} setIt={setIt} />
      <label className="block">Nome<input required value={it.nome} maxLength={120} onChange={e => setIt({ ...it, nome: e.target.value })} className={input + ' mt-1'} placeholder="Ex.: Espada longa" /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">Tipo<select value={it.categoria} onChange={e => setIt({ ...it, categoria: e.target.value as Item['categoria'] })} className={input + ' mt-1'}>{CATEGORIAS_ITEM.map(c => <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>)}</select></label>
        <label className="block">Peso{s?.carga ? ` (${s.carga.unidade})` : ''}<input type="number" min={0} step="0.1" value={it.peso} onChange={e => setIt({ ...it, peso: Number(e.target.value) || 0 })} className={input + ' mt-1'} /></label>
      </div>
      <div className="grid grid-cols-[2fr_1fr] gap-2">
        <label className="block">{it.categoria === 'consumivel' ? 'Rolagem ao usar (ex.: cura 2d4+2)' : 'Dano ou rolagem (ex.: 1d8+3)'}
          <input value={it.dano ?? ''} maxLength={40} onChange={e => setIt({ ...it, dano: e.target.value })} className={input + ' mt-1'} placeholder="Opcional" /></label>
        <label className="block">Alcance (m)<input type="number" min={0} max={1000} step="1.5" value={it.alcance ?? ''} onChange={e => setIt({ ...it, alcance: Number(e.target.value) || undefined })} className={input + ' mt-1'} placeholder="1,5" /></label>
      </div>
      {alvos.length > 0 && <fieldset className="rounded-xl border border-[#55456e] p-3">
        <legend className="px-1 text-xs text-[#d3adf0]">Bônus quando equipado</legend>
        {it.bonus.map((b, i) => <div key={i} className="mb-2 flex gap-2">
          <select aria-label="Onde soma" value={b.alvo} onChange={e => setB(i, { alvo: e.target.value })} className={input + ' flex-1'}>{alvos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}</select>
          <input aria-label="Valor" type="number" value={b.valor} onChange={e => setB(i, { valor: Number(e.target.value) || 0 })} className={input + ' w-20'} />
          <button type="button" onClick={() => setIt({ ...it, bonus: it.bonus.filter((_, k) => k !== i) })} aria-label="Tirar bônus" className={botao}><Trash2 size={13} /></button>
        </div>)}
        {it.bonus.length < 8 && <button type="button" className={botao} onClick={() => setIt({ ...it, bonus: [...it.bonus, { alvo: alvos[0].id, valor: 1 }] })}><Plus size={13} /> Adicionar bônus</button>}
        <p className="mt-2 text-[11px] text-[#a998bd]">Ex.: escudo → Classe de Armadura +2; anel → uma resistência +1.</p>
      </fieldset>}
      <label className="block">Descrição<textarea rows={3} value={it.descricao ?? ''} maxLength={2000} onChange={e => setIt({ ...it, descricao: e.target.value })} className={input + ' mt-1'} /></label>
      <div className="flex gap-2"><button type="button" onClick={fechar} className="flex-1 rounded-lg border border-[#62527e] p-2.5">Cancelar</button>
        <button type="submit" className="flex-1 rounded-lg bg-[#7654bb] p-2.5 font-semibold">Salvar</button></div>
    </form>
  </Janela>
}

export function EditorPoder({ s, inicial, salvar, fechar }: { s?: Sistema; inicial: Poder; salvar: (p: Poder) => void; fechar: () => void }) {
  const [p, setP] = useState<Poder>(inicial)
  const recursos = s?.recursos ?? []
  return <Janela titulo={inicial.nome ? 'Editar poder' : 'Novo poder'} fechar={fechar}>
    <form className="space-y-3" onSubmit={e => { e.preventDefault(); const v = normalizarPoder(p); if (!v) { toast.error('Dê um nome ao poder.'); return } salvar({ ...v, id: inicial.id }) }}>
      <label className="block">Nome<input autoFocus required value={p.nome} maxLength={120} onChange={e => setP({ ...p, nome: e.target.value })} className={input + ' mt-1'} placeholder="Ex.: Bola de fogo" /></label>
      <label className="block">Tipo<select value={p.tipo} onChange={e => setP({ ...p, tipo: e.target.value as Poder['tipo'] })} className={input + ' mt-1'}>{TIPOS_PODER.map(t => <option key={t.id} value={t.id}>{t.icone} {t.nome}</option>)}</select></label>
      {recursos.length > 0 && <div className="grid grid-cols-2 gap-2">
        <label className="block">Gasta<select value={p.recurso ?? ''} onChange={e => setP({ ...p, recurso: e.target.value || undefined, custo: e.target.value ? p.custo ?? 1 : undefined })} className={input + ' mt-1'}>
          <option value="">Nada</option>{recursos.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}</select></label>
        <label className="block">Quanto<input type="number" min={0} disabled={!p.recurso} value={p.custo ?? ''} onChange={e => setP({ ...p, custo: Number(e.target.value) || 0 })} className={input + ' mt-1'} /></label>
      </div>}
      <div className="grid grid-cols-2 gap-2">
        <label className="block">Usos até descansar<input type="number" min={0} max={99} value={p.usosMax ?? ''} onChange={e => setP({ ...p, usosMax: Number(e.target.value) || undefined })} className={input + ' mt-1'} placeholder="Sem limite" /></label>
        <label className="block">Rolagem<input value={p.expressao ?? ''} maxLength={40} onChange={e => setP({ ...p, expressao: e.target.value })} className={input + ' mt-1'} placeholder="Ex.: 8d6" /></label>
      </div>
      <label className="block">Alcance na mesa (metros)<input type="number" min={0} max={1000} step="1.5" value={p.alcance ?? ''} onChange={e => setP({ ...p, alcance: Number(e.target.value) || undefined })} className={input + ' mt-1'} placeholder="Corpo a corpo (1,5 m)" /></label>
      <label className="block">Descrição<textarea rows={4} value={p.descricao ?? ''} maxLength={2000} onChange={e => setP({ ...p, descricao: e.target.value })} className={input + ' mt-1'} placeholder="Alcance, duração, efeito…" /></label>
      <div className="flex gap-2"><button type="button" onClick={fechar} className="flex-1 rounded-lg border border-[#62527e] p-2.5">Cancelar</button>
        <button type="submit" className="flex-1 rounded-lg bg-[#7654bb] p-2.5 font-semibold">Salvar</button></div>
    </form>
  </Janela>
}

/** Forja: escolher a forma, as cores e a raridade do item (com prévia grande e um “surpreenda-me”). */
function Forja({ it, setIt }: { it: Item; setIt: (i: Item) => void }) {
  const a = arteDoItem(it)
  const [aberta, setAberta] = useState(!it.nome)
  const mudar = (x: Partial<ArteItemT>) => setIt({ ...it, arte: { ...a, ...x } })
  const sortear = () => {
    const doTipo = FORMAS.filter(f => f.categoria === it.categoria || (it.categoria === 'outro'))
    const f = (doTipo.length ? doTipo : FORMAS)[Math.floor(Math.random() * (doTipo.length || FORMAS.length))]
    const c = () => CORES_FORJA[Math.floor(Math.random() * CORES_FORJA.length)]
    const rar = RARIDADES[Math.min(5, Math.floor(Math.random() ** 2 * 6))].id
    setIt({ ...it, arte: { forma: f.id, cor: c(), cor2: c() }, raridade: rar, nome: it.nome || nomeAleatorio(f.id) })
  }
  const cor = corDaRaridade(it.raridade)
  return <div className="overflow-hidden rounded-2xl border border-[#55456e] bg-[#151123]">
    <div className="flex items-center gap-3 p-3" style={{ background: `linear-gradient(90deg, ${cor}22, transparent)` }}>
      <ArteItem item={it} tamanho={aberta ? 96 : 56} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-widest text-[#ed9cd8]">⚒️ Forja</p>
        <p className="truncate font-semibold">{it.nome || 'Item sem nome'}</p>
        {it.raridade && <p className="text-xs font-bold" style={{ color: cor }}>{RARIDADES.find(r => r.id === it.raridade)?.nome}</p>}
      </div>
      <div className="flex flex-col gap-1">
        <button type="button" onClick={sortear} className={botao} title="Forma, cores e raridade aleatórias">🎲 Surpreenda-me</button>
        <button type="button" onClick={() => setAberta(v => !v)} className={botao}>{aberta ? 'Fechar forja' : '🎨 Personalizar'}</button>
      </div>
    </div>
    {aberta && <div className="space-y-3 border-t border-[#3d3152] p-3">
      <div><p className="mb-1 text-xs text-[#d3adf0]">Forma</p>
        <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-7">{FORMAS.map(f => <button key={f.id} type="button" title={f.nome} aria-label={'Forma ' + f.nome} aria-pressed={a.forma === f.id}
          onClick={() => mudar({ forma: f.id })} className={'rounded-lg border p-0.5 ' + (a.forma === f.id ? 'border-[#e4d3ff] bg-[#3b2a5a]' : 'border-[#3d3152] bg-[#1e1a30] hover:border-[#8b6cba]')}>
          <svg viewBox="0 0 100 100" className="h-9 w-full" aria-hidden dangerouslySetInnerHTML={{ __html: f.desenho(a.cor, a.cor2) }} /></button>)}</div></div>
      {([['cor', 'Cor principal'], ['cor2', 'Cor do detalhe']] as const).map(([k, rot]) => <div key={k}><p className="mb-1 text-xs text-[#d3adf0]">{rot}</p>
        <div className="flex flex-wrap items-center gap-1.5">{CORES_FORJA.map(c => <button key={c} type="button" aria-label={rot + ' ' + c} aria-pressed={a[k] === c} onClick={() => mudar({ [k]: c })}
          className={'h-7 w-7 rounded-full border-2 ' + (a[k] === c ? 'border-white' : 'border-black/40')} style={{ background: c }} />)}
          <input type="color" aria-label={rot + ' personalizada'} value={a[k]} onChange={e => mudar({ [k]: e.target.value })} className="h-7 w-9 cursor-pointer rounded border border-[#5e4b78] bg-transparent" /></div></div>)}
      <div><p className="mb-1 text-xs text-[#d3adf0]">Raridade</p>
        <div className="flex flex-wrap gap-1.5"><button type="button" onClick={() => setIt({ ...it, raridade: undefined })} className={botao + (!it.raridade ? ' border-white' : '')}>Nenhuma</button>
          {RARIDADES.map(r => <button key={r.id} type="button" onClick={() => setIt({ ...it, raridade: r.id })} className={botao + ' font-semibold'} style={{ color: r.cor, borderColor: it.raridade === r.id ? r.cor : undefined, background: it.raridade === r.id ? r.cor + '22' : undefined }}>{r.nome}</button>)}</div></div>
      <button type="button" className={botao} onClick={() => setIt({ ...it, nome: nomeAleatorio(a.forma) })}>✨ Sugerir um nome</button>
    </div>}
  </div>
}
