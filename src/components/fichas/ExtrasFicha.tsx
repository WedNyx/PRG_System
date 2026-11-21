'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Dice5, Lock, Pencil, Plus, RotateCcw, Trash2, Undo2 } from 'lucide-react'
import type { DadosFicha, Sistema } from '@/lib/sistemas/tipos'
import {
  chave, desfazerUso, dispensar, expressaoValida, fonteDoCusto, formaAtiva, invocacaoAtiva, invocar, novoCombate, novoId, passarTurno,
  restaurarForma, temExtra, transformar, turnosInvocacao, usarGolpe, usosGastos, vidaInvocacao, voltarAoNormal, comMarcas,
  type Efeito, type Forma, type Golpe, type HabilidadeMarca, type Invocacao, type MarcaPersonagem,
} from '@/lib/sistemas/extrasFicha'

/**
 * Partes extras da ficha (v0.36.0): Marcas com níveis, Transformações, Invocações e Efeitos.
 * O autor do sistema liga cada uma no construtor. Nada é calculado: o jogador escreve tudo, e “Usar”,
 * “Transformar” e “Invocar” só marcam o uso e tiram o custo que ele mesmo escreveu.
 */
export type PropsExtras = { s: Sistema; d: DadosFicha; onChange: (d: DadosFicha) => void; somenteLeitura: boolean; rolar: (expr: string, rotulo: string) => Promise<void> }
const card = 'ficha-painel rounded-2xl border border-(--ficha-borda) bg-(--ficha-cartao) p-4 sm:p-5'
const titulo = 'flex min-w-0 items-center gap-2 font-bold text-(--ficha-acento) [font-family:var(--ficha-fonte)]'
const dica = 'text-xs text-(--a-a998bd)'
const input = 'w-full min-w-0 rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-sm text-white disabled:opacity-70'
const botao = 'inline-flex items-center gap-1 rounded-lg border border-(--a-5e4b78) px-2.5 py-1.5 text-xs text-white hover:bg-(--s-34294f) disabled:opacity-40'
const forte = 'inline-flex items-center gap-1 rounded-lg bg-(--a-5b4380) px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-40'
const chip = 'rounded-full border border-(--a-5e4b78) px-2 py-0.5 text-[11px] text-(--a-cfc0df)'

const numOuVazio = (v: string) => v.trim() === '' ? undefined : Math.max(0, Math.round(Number(v)) || 0)
function aplicar(r: DadosFicha | string, onChange: (d: DadosFicha) => void) { if (typeof r === 'string') toast.error(r); else onChange(r) }

/** Barra pequena com − e + e o número editável. */
function Contador({ rotulo, atual, max, mudar, desabilitado, cor = 'var(--ficha-acento)' }: { rotulo: string; atual: number; max?: number; mudar: (n: number) => void; desabilitado?: boolean; cor?: string }) {
  const pct = max ? Math.max(0, Math.min(100, (atual / max) * 100)) : 0
  return <div className="min-w-0">
    <div className="flex items-center justify-between gap-2 text-xs"><span className="text-(--a-cfc0df)">{rotulo}</span>
      <span className="flex items-center gap-1">
        <button type="button" className={botao + ' !px-2 !py-0.5'} disabled={desabilitado} onClick={() => mudar(atual - 1)} aria-label={rotulo + ': menos 1'}>−</button>
        <input type="number" aria-label={rotulo} value={atual} disabled={desabilitado} onChange={e => mudar(Math.round(Number(e.target.value)) || 0)} className="w-14 rounded-md border border-(--a-5e4b78) bg-(--s-151123) px-1 py-0.5 text-center text-sm font-bold text-white" />
        {max !== undefined && <span className="text-(--a-a998bd)">/ {max}</span>}
        <button type="button" className={botao + ' !px-2 !py-0.5'} disabled={desabilitado} onClick={() => mudar(atual + 1)} aria-label={rotulo + ': mais 1'}>+</button>
      </span></div>
    {max ? <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-(--s-151123)"><div className="h-full rounded-full" style={{ width: pct + '%', background: cor }} /></div> : null}
  </div>
}

/** Golpe/habilidade pronto para jogar: dado, custo, usos e os botões. */
function LinhaGolpe({ g, p, bloqueado, nivel }: { g: Golpe; p: PropsExtras; bloqueado?: boolean; nivel?: number }) {
  const gastos = usosGastos(p.d, g), semUsos = !!g.usosMax && gastos >= g.usosMax
  const usavel = (g.custo ?? 0) > 0 || !!g.usosMax
  return <li className={'ficha-poder rounded-xl border border-(--a-3d3152) bg-(--s-171325) p-3 ' + (bloqueado ? 'opacity-45' : '')}>
    <div className="flex flex-wrap items-start gap-2">
      {nivel !== undefined && <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full border-2 border-(--ficha-acento) px-1 text-xs font-black text-(--ficha-acento)" title={'Nível ' + nivel}>{bloqueado ? <Lock size={12} /> : nivel}</span>}
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-white">{g.nome}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {g.expressao && <span className={chip}>🎲 {g.expressao}</span>}
          {(g.custo ?? 0) > 0 && <span className={chip}>💫 {g.custo} de essência</span>}
          {g.usosMax ? <span className={chip + (semUsos ? ' !border-red-400 !text-red-200' : '')}>{gastos}/{g.usosMax} usos no combate</span> : null}
        </div>
        {g.texto && <p className="mt-1 whitespace-pre-line text-xs text-(--a-cfc0df)">{g.texto}</p>}
      </div>
    </div>
    {!bloqueado && (g.expressao || usavel) && <div className="mt-2 flex flex-wrap gap-2">
      {g.expressao && <button type="button" className={botao} disabled={!expressaoValida(g.expressao)} title={expressaoValida(g.expressao) ? '' : 'Expressão de dados inválida'} onClick={() => void p.rolar(g.expressao!.replace(/\s+/g, ''), g.nome)}><Dice5 size={13} /> Rolar</button>}
      {usavel && !p.somenteLeitura && <button type="button" className={forte} disabled={semUsos} onClick={() => aplicar(usarGolpe(p.s, p.d, g), p.onChange)}>Usar{(g.custo ?? 0) > 0 ? ` (−${g.custo})` : ''}</button>}
      {usavel && !p.somenteLeitura && gastos > 0 && <button type="button" className={botao} onClick={() => p.onChange(desfazerUso(p.d, g))} title="Desfaz 1 uso (não devolve a essência)"><Undo2 size={13} /> Desfazer</button>}
    </div>}
  </li>
}

/** Editor de um golpe/habilidade. */
function EditarGolpe({ g, mudar, remover, comNivel }: { g: Golpe & { nivel?: number }; mudar: (g: Golpe & { nivel?: number }) => void; remover: () => void; comNivel?: boolean }) {
  return <li className="space-y-2 rounded-xl border border-dashed border-(--a-5e4b78) p-3">
    <div className="flex gap-2">
      {comNivel && <label className="w-20 shrink-0 text-xs">Nível<input type="number" min={0} className={input} value={g.nivel ?? 1} onChange={e => mudar({ ...g, nivel: Math.max(0, Math.round(Number(e.target.value)) || 0) })} /></label>}
      <label className="min-w-0 flex-1 text-xs">Nome<input className={input} value={g.nome} maxLength={80} onChange={e => mudar({ ...g, nome: e.target.value })} /></label>
      <button type="button" className="self-end p-2 text-red-300" aria-label={'Remover ' + g.nome} onClick={remover}><Trash2 size={15} /></button>
    </div>
    <div className="grid grid-cols-3 gap-2">
      <label className="text-xs">Dado<input className={input} placeholder="1d8+1d6" maxLength={40} value={g.expressao ?? ''} onChange={e => mudar({ ...g, expressao: e.target.value })} /></label>
      <label className="text-xs">Custo<input type="number" min={0} className={input} placeholder="—" value={g.custo ?? ''} onChange={e => mudar({ ...g, custo: numOuVazio(e.target.value) })} /></label>
      <label className="text-xs">Usos/combate<input type="number" min={0} className={input} placeholder="livre" value={g.usosMax ?? ''} onChange={e => mudar({ ...g, usosMax: numOuVazio(e.target.value) })} /></label>
    </div>
    <label className="block text-xs">O que faz<textarea rows={2} className={input} maxLength={1500} value={g.texto ?? ''} onChange={e => mudar({ ...g, texto: e.target.value })} /></label>
  </li>
}

function Cabecalho({ icone, nome, editando, alternar, somenteLeitura, children }: { icone: string; nome: string; editando?: boolean; alternar?: () => void; somenteLeitura: boolean; children?: React.ReactNode }) {
  return <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
    <h3 className={titulo + ' text-lg'}><span aria-hidden>{icone}</span><span className="truncate">{nome}</span></h3>
    <div className="flex flex-wrap items-center gap-2">{children}{alternar && !somenteLeitura && <button type="button" className={botao} onClick={alternar}>{editando ? 'Pronto' : <><Pencil size={13} /> Editar</>}</button>}</div>
  </div>
}

/** Essência de onde sai o custo agora (da ficha ou da forma ativa). */
function EssenciaAtual(p: PropsExtras) {
  const f = fonteDoCusto(p.s, p.d); if (!f) return null
  const nome = f.tipo === 'forma' ? 'Essência da forma' : p.s.recursos.find(r => r.id === f.id)?.nome ?? 'Essência'
  const mudar = (n: number) => p.onChange(f.tipo === 'forma' ? comMarcas(p.d, { [chave.peForma(f.id)]: Math.max(0, n) }) : { ...p.d, recursos: { ...p.d.recursos, [f.id]: { ...p.d.recursos[f.id], atual: Math.max(0, n) } } })
  return <div className={card + ' !p-3'}><Contador rotulo={'💫 ' + nome} atual={f.atual} max={f.max || undefined} mudar={mudar} desabilitado={p.somenteLeitura} cor="#8fd3ff" /></div>
}

/* ---------------- Marcas ---------------- */
export function SecaoMarcas(p: PropsExtras) {
  const marcas = p.d.marcasPoder ?? []
  const [editando, setEditando] = useState<string | null>(null)
  const salvar = (lista: MarcaPersonagem[]) => p.onChange({ ...p.d, marcasPoder: lista })
  const mudar = (id: string, m: Partial<MarcaPersonagem>) => salvar(marcas.map(x => x.id === id ? { ...x, ...m } : x))
  const nova = () => { const id = novoId(); salvar([...marcas, { id, nome: 'Nova marca', nivel: 1, habilidades: [] }]); setEditando(id) }
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2">
      <div className="min-w-0 flex-1"><EssenciaAtual {...p} /></div>
      {!p.somenteLeitura && <button type="button" className={botao} onClick={() => p.onChange(novoCombate(p.d))} title="Zera os usos por combate de tudo"><RotateCcw size={13} /> Novo combate</button>}
    </div>
    {marcas.length === 0 && <p className={dica}>Nenhuma marca ainda. Cada marca tem o próprio nível: as habilidades até esse nível ficam liberadas.</p>}
    {marcas.map(m => {
      const ed = editando === m.id
      const mudarHab = (i: number, h: HabilidadeMarca) => mudar(m.id, { habilidades: m.habilidades.map((x, k) => k === i ? h : x) })
      return <section key={m.id} className={card} aria-label={'Marca: ' + m.nome}>
        <Cabecalho icone="🐾" nome={m.nome} editando={ed} alternar={() => setEditando(ed ? null : m.id)} somenteLeitura={p.somenteLeitura}>
          <label className="flex items-center gap-1 text-xs text-(--a-cfc0df)">Nível
            <input type="number" min={0} aria-label={'Nível da ' + m.nome} disabled={p.somenteLeitura} value={m.nivel} onChange={e => mudar(m.id, { nivel: Math.max(0, Math.round(Number(e.target.value)) || 0) })}
              className="w-14 rounded-md border-2 border-(--ficha-acento) bg-(--s-151123) px-1 py-0.5 text-center text-base font-black text-(--ficha-acento)" /></label>
        </Cabecalho>
        {ed ? <div className="space-y-2">
          <label className="block text-xs">Nome da marca<input className={input} maxLength={80} value={m.nome} onChange={e => mudar(m.id, { nome: e.target.value })} /></label>
          <label className="block text-xs">Sobre a marca (opcional)<textarea rows={2} className={input} maxLength={1500} value={m.texto ?? ''} onChange={e => mudar(m.id, { texto: e.target.value })} /></label>
          <ul className="space-y-2">{m.habilidades.map((h, i) => <EditarGolpe key={h.id} comNivel g={h} mudar={g => mudarHab(i, { ...h, ...g, nivel: g.nivel ?? h.nivel })} remover={() => mudar(m.id, { habilidades: m.habilidades.filter((_, k) => k !== i) })} />)}</ul>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={botao} onClick={() => mudar(m.id, { habilidades: [...m.habilidades, { id: novoId(), nome: 'Nova habilidade', nivel: (m.habilidades.at(-1)?.nivel ?? 0) + 1 }] })}><Plus size={13} /> Habilidade</button>
            <button type="button" className={botao + ' !text-red-300'} onClick={() => { salvar(marcas.filter(x => x.id !== m.id)); setEditando(null) }}><Trash2 size={13} /> Remover marca</button>
          </div>
        </div> : <>
          {m.texto && <p className="mb-2 whitespace-pre-line text-xs text-(--a-cfc0df)">{m.texto}</p>}
          <ul className="ficha-lista-poderes space-y-2">{[...m.habilidades].sort((a, b) => a.nivel - b.nivel).map(h => <LinhaGolpe key={h.id} g={h} p={p} nivel={h.nivel} bloqueado={h.nivel > m.nivel} />)}</ul>
          {!m.habilidades.length && <p className={dica}>Sem habilidades. Toque em Editar para escrever o que cada nível libera.</p>}
        </>}
      </section>
    })}
    {!p.somenteLeitura && <button type="button" className={forte} onClick={nova}><Plus size={14} /> Nova marca</button>}
  </div>
}

/* ---------------- Transformações ---------------- */
export function SecaoFormas(p: PropsExtras) {
  const formas = p.d.formas ?? []
  const ativa = formaAtiva(p.d)
  const [editando, setEditando] = useState<string | null>(null)
  const salvar = (lista: Forma[]) => p.onChange({ ...p.d, formas: lista })
  const mudar = (id: string, f: Partial<Forma>) => salvar(formas.map(x => x.id === id ? { ...x, ...f } : x))
  const nova = () => { const id = novoId(); salvar([...formas, { id, nome: 'Nova forma', atributos: {}, golpes: [] }]); setEditando(id) }
  return <div className="space-y-4">
    <div className={card + ' !p-3'}>
      <p className="text-sm text-white">{ativa ? <>Agora em: <strong className="text-(--ficha-acento)">{ativa.nome}</strong></> : 'Forma normal'}</p>
      <p className={dica}>A ficha normal fica guardada. Transformar tira o custo da essência normal; a forma tem vida e essência próprias, se você escrever.</p>
      {ativa && !p.somenteLeitura && <button type="button" className={botao + ' mt-2'} onClick={() => p.onChange(voltarAoNormal(p.d))}>Voltar ao normal</button>}
    </div>
    {formas.map(f => {
      const ed = editando === f.id, on = ativa?.id === f.id
      const mudarGolpe = (i: number, g: Golpe) => mudar(f.id, { golpes: f.golpes.map((x, k) => k === i ? g : x) })
      return <section key={f.id} className={card + (on ? ' ring-2 ring-(--ficha-acento)' : '')} aria-label={'Transformação: ' + f.nome}>
        <Cabecalho icone="🐺" nome={f.nome} editando={ed} alternar={() => setEditando(ed ? null : f.id)} somenteLeitura={p.somenteLeitura}>
          {!p.somenteLeitura && !ed && (on ? <span className={chip + ' !border-(--ficha-acento) !text-(--ficha-acento)'}>Ativa</span>
            : <button type="button" className={forte} onClick={() => aplicar(transformar(p.s, p.d, f), p.onChange)}>Transformar{(f.custo ?? 0) > 0 ? ` (−${f.custo})` : ''}</button>)}
        </Cabecalho>
        {ed ? <div className="space-y-2">
          <label className="block text-xs">Nome<input className={input} maxLength={80} value={f.nome} onChange={e => mudar(f.id, { nome: e.target.value })} /></label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <label className="text-xs">Custo para transformar<input type="number" min={0} className={input} placeholder="—" value={f.custo ?? ''} onChange={e => mudar(f.id, { custo: numOuVazio(e.target.value) })} /></label>
            <label className="text-xs">Vida da forma<input type="number" min={0} className={input} placeholder="—" value={f.vidaMax ?? ''} onChange={e => mudar(f.id, { vidaMax: numOuVazio(e.target.value) })} /></label>
            <label className="text-xs">Essência da forma<input type="number" min={0} className={input} placeholder="a da ficha" value={f.essenciaMax ?? ''} onChange={e => mudar(f.id, { essenciaMax: numOuVazio(e.target.value) })} /></label>
            <label className="text-xs">Deslocamento<input className={input} maxLength={60} placeholder="14 m" value={f.deslocamento ?? ''} onChange={e => mudar(f.id, { deslocamento: e.target.value })} /></label>
          </div>
          <label className="block text-xs">Quando pode usar (opcional)<input className={input} maxLength={80} placeholder="Marca do Lobo nível 7" value={f.requisito ?? ''} onChange={e => mudar(f.id, { requisito: e.target.value })} /></label>
          {p.s.atributos.length > 0 && <fieldset className="rounded-xl border border-(--a-3d3152) p-2"><legend className="px-1 text-xs">Atributos na forma (vazio = igual ao normal)</legend>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{p.s.atributos.map(a => <label key={a.id} className="text-xs">{a.id}
              <input type="number" className={input} placeholder={String(p.d.atributos[a.id] ?? a.padrao)} value={f.atributos[a.id] ?? ''} onChange={e => { const at = { ...f.atributos }; if (e.target.value.trim() === '') delete at[a.id]; else at[a.id] = Math.round(Number(e.target.value)) || 0; mudar(f.id, { atributos: at }) }} /></label>)}</div></fieldset>}
          <label className="block text-xs">Perícias que a forma ganha<input className={input} maxLength={300} value={f.pericias ?? ''} onChange={e => mudar(f.id, { pericias: e.target.value })} /></label>
          <label className="block text-xs">Resistências, limites e observações<textarea rows={3} className={input} maxLength={1500} value={f.texto ?? ''} onChange={e => mudar(f.id, { texto: e.target.value })} /></label>
          <p className="pt-1 text-xs font-semibold text-white">Golpes e habilidades da forma</p>
          <ul className="space-y-2">{f.golpes.map((g, i) => <EditarGolpe key={g.id} g={g} mudar={x => mudarGolpe(i, { ...g, ...x })} remover={() => mudar(f.id, { golpes: f.golpes.filter((_, k) => k !== i) })} />)}</ul>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={botao} onClick={() => mudar(f.id, { golpes: [...f.golpes, { id: novoId(), nome: 'Novo golpe' }] })}><Plus size={13} /> Golpe</button>
            <button type="button" className={botao + ' !text-red-300'} onClick={() => { p.onChange({ ...comMarcas(p.d, on ? { [chave.formaAtiva]: null } : {}), formas: formas.filter(x => x.id !== f.id) }); setEditando(null) }}><Trash2 size={13} /> Remover forma</button>
          </div>
        </div> : <FormaResumo f={f} p={p} ativa={on} />}
      </section>
    })}
    {!p.somenteLeitura && <button type="button" className={forte} onClick={nova}><Plus size={14} /> Nova transformação</button>}
  </div>
}

function FormaResumo({ f, p, ativa }: { f: Forma; p: PropsExtras; ativa: boolean }) {
  const vida = Number(p.d.marcas?.[chave.vidaForma(f.id)] ?? f.vidaMax ?? 0), pe = Number(p.d.marcas?.[chave.peForma(f.id)] ?? f.essenciaMax ?? 0)
  const set = (k: string, n: number) => p.onChange(comMarcas(p.d, { [k]: Math.max(0, n) }))
  return <div className="space-y-3">
    <div className="flex flex-wrap gap-1">
      {(f.custo ?? 0) > 0 && <span className={chip}>💫 {f.custo} para transformar</span>}
      {f.requisito && <span className={chip}>🔓 {f.requisito}</span>}
      {f.deslocamento && <span className={chip}>🏃 {f.deslocamento}</span>}
      {f.pericias && <span className={chip}>🎯 {f.pericias}</span>}
    </div>
    {(f.vidaMax !== undefined || f.essenciaMax !== undefined) && <div className="grid gap-2 sm:grid-cols-2">
      {f.vidaMax !== undefined && <Contador rotulo="❤️ Vida da forma" atual={vida} max={f.vidaMax} mudar={n => set(chave.vidaForma(f.id), n)} desabilitado={p.somenteLeitura} cor="#f87171" />}
      {f.essenciaMax !== undefined && <Contador rotulo="💫 Essência da forma" atual={pe} max={f.essenciaMax} mudar={n => set(chave.peForma(f.id), n)} desabilitado={p.somenteLeitura} cor="#8fd3ff" />}
    </div>}
    {p.s.atributos.length > 0 && Object.keys(f.atributos).length > 0 && <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{p.s.atributos.map(a => {
      const base = Number(p.d.atributos[a.id] ?? a.padrao) || 0, v = f.atributos[a.id] ?? base, dif = v - base
      return <div key={a.id} className="rounded-xl border border-(--a-3d3152) bg-(--s-171325) p-2 text-center" title={a.nome}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-(--ficha-acento)">{a.id}</p>
        <p className="text-xl font-black text-white">{v}</p>
        {dif !== 0 && <p className={'text-[10px] ' + (dif > 0 ? 'text-emerald-300' : 'text-red-300')}>{dif > 0 ? '+' : ''}{dif} do normal</p>}
      </div>
    })}</div>}
    {f.texto && <p className="whitespace-pre-line text-xs text-(--a-cfc0df)">{f.texto}</p>}
    {f.golpes.length > 0 && <ul className="ficha-lista-poderes space-y-2">{f.golpes.map(g => <LinhaGolpe key={g.id} g={g} p={p} bloqueado={!ativa} />)}</ul>}
    {!ativa && f.golpes.length > 0 && <p className={dica}>Os golpes liberam quando o personagem está nesta forma.</p>}
    {ativa && !p.somenteLeitura && (f.vidaMax !== undefined || f.essenciaMax !== undefined) && <button type="button" className={botao} onClick={() => p.onChange(restaurarForma(p.d, f))}><RotateCcw size={13} /> Encher vida e essência da forma</button>}
  </div>
}

/* ---------------- Invocações ---------------- */
export function SecaoInvocacoes(p: PropsExtras) {
  const lista = p.d.invocacoes ?? []
  const [editando, setEditando] = useState<string | null>(null)
  const salvar = (l: Invocacao[]) => p.onChange({ ...p.d, invocacoes: l })
  const mudar = (id: string, i: Partial<Invocacao>) => salvar(lista.map(x => x.id === id ? { ...x, ...i } : x))
  const nova = () => { const id = novoId(); salvar([...lista, { id, nome: 'Nova invocação', golpes: [] }]); setEditando(id) }
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2"><div className="min-w-0 flex-1"><EssenciaAtual {...p} /></div>
      {!p.somenteLeitura && lista.some(i => invocacaoAtiva(p.d, i) && turnosInvocacao(p.d, i) !== undefined) && <button type="button" className={botao} onClick={() => p.onChange(passarTurno(p.d))}>⏭ Passar 1 turno</button>}</div>
    {lista.map(i => {
      const ed = editando === i.id, on = invocacaoAtiva(p.d, i), t = turnosInvocacao(p.d, i)
      const mudarGolpe = (k: number, g: Golpe) => mudar(i.id, { golpes: i.golpes.map((x, j) => j === k ? g : x) })
      return <section key={i.id} className={card + (on ? ' ring-2 ring-(--ficha-acento)' : '')} aria-label={'Invocação: ' + i.nome}>
        <Cabecalho icone="🐻" nome={i.nome} editando={ed} alternar={() => setEditando(ed ? null : i.id)} somenteLeitura={p.somenteLeitura}>
          {!p.somenteLeitura && !ed && (on ? <button type="button" className={botao} onClick={() => p.onChange(dispensar(p.d, i))}>Dispensar</button>
            : <button type="button" className={forte} onClick={() => aplicar(invocar(p.s, p.d, i), p.onChange)}>Invocar{(i.custo ?? 0) > 0 ? ` (−${i.custo})` : ''}</button>)}
        </Cabecalho>
        {ed ? <div className="space-y-2">
          <label className="block text-xs">Nome<input className={input} maxLength={80} value={i.nome} onChange={e => mudar(i.id, { nome: e.target.value })} /></label>
          <div className="grid grid-cols-3 gap-2">
            <label className="text-xs">Custo<input type="number" min={0} className={input} placeholder="—" value={i.custo ?? ''} onChange={e => mudar(i.id, { custo: numOuVazio(e.target.value) })} /></label>
            <label className="text-xs">Vida<input type="number" min={0} className={input} placeholder="—" value={i.vidaMax ?? ''} onChange={e => mudar(i.id, { vidaMax: numOuVazio(e.target.value) })} /></label>
            <label className="text-xs">Duração (turnos)<input type="number" min={0} className={input} placeholder="livre" value={i.duracao ?? ''} onChange={e => mudar(i.id, { duracao: numOuVazio(e.target.value) })} /></label>
          </div>
          <label className="block text-xs">Habilidades, defesa e evolução<textarea rows={3} className={input} maxLength={1500} value={i.texto ?? ''} onChange={e => mudar(i.id, { texto: e.target.value })} /></label>
          <ul className="space-y-2">{i.golpes.map((g, k) => <EditarGolpe key={g.id} g={g} mudar={x => mudarGolpe(k, { ...g, ...x })} remover={() => mudar(i.id, { golpes: i.golpes.filter((_, j) => j !== k) })} />)}</ul>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={botao} onClick={() => mudar(i.id, { golpes: [...i.golpes, { id: novoId(), nome: 'Novo ataque' }] })}><Plus size={13} /> Ataque</button>
            <button type="button" className={botao + ' !text-red-300'} onClick={() => { p.onChange({ ...dispensar(p.d, i), invocacoes: lista.filter(x => x.id !== i.id) }); setEditando(null) }}><Trash2 size={13} /> Remover invocação</button>
          </div>
        </div> : <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {(i.custo ?? 0) > 0 && <span className={chip}>💫 {i.custo} para invocar</span>}
            {i.duracao ? <span className={chip}>⏳ {on && t !== undefined ? `${t} de ${i.duracao} turnos` : `${i.duracao} turnos`}</span> : null}
            <span className={chip}>{on ? 'Em campo' : 'Fora de campo'}</span>
          </div>
          {i.vidaMax !== undefined && <Contador rotulo="❤️ Vida" atual={vidaInvocacao(p.d, i)} max={i.vidaMax} mudar={n => p.onChange(comMarcas(p.d, { [chave.vidaInv(i.id)]: Math.max(0, n) }))} desabilitado={p.somenteLeitura || !on} cor="#f87171" />}
          {i.texto && <p className="whitespace-pre-line text-xs text-(--a-cfc0df)">{i.texto}</p>}
          {i.golpes.length > 0 && <ul className="ficha-lista-poderes space-y-2">{i.golpes.map(g => <LinhaGolpe key={g.id} g={g} p={p} bloqueado={!on} />)}</ul>}
        </div>}
      </section>
    })}
    {!lista.length && <p className={dica}>Nenhuma invocação. Crie as criaturas que o personagem chama: vida, ataques e quanto tempo ficam.</p>}
    {!p.somenteLeitura && <button type="button" className={forte} onClick={nova}><Plus size={14} /> Nova invocação</button>}
  </div>
}

/* ---------------- Efeitos e condições ---------------- */
export function SecaoEfeitos(p: PropsExtras) {
  const lista = p.d.efeitos ?? []
  const salvar = (l: Efeito[]) => p.onChange({ ...p.d, efeitos: l })
  const mudar = (id: string, e: Partial<Efeito>) => salvar(lista.map(x => x.id === id ? { ...x, ...e } : x))
  return <section className={card} aria-label="Efeitos e condições">
    <Cabecalho icone="⏳" nome="Efeitos e condições" somenteLeitura={p.somenteLeitura}>
      {!p.somenteLeitura && lista.some(e => (e.turnos ?? 0) > 0) && <button type="button" className={botao} onClick={() => p.onChange(passarTurno(p.d))}>⏭ Passar 1 turno</button>}
    </Cabecalho>
    <p className={dica + ' mb-3'}>Congelado, sangrando, molhado, desorientado… Escreva quantos turnos faltam; vazio = até o mestre dizer. Passar turno também conta as invocações.</p>
    <ul className="space-y-2">{lista.map(e => {
      const fim = e.turnos === 0
      return <li key={e.id} className={'space-y-2 rounded-xl border p-3 ' + (fim ? 'border-red-400/60 opacity-70' : 'border-(--a-3d3152)')}>
        <div className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[2fr_1fr_auto]">
          <input aria-label="Efeito" className={input} maxLength={80} value={e.nome} disabled={p.somenteLeitura} onChange={v => mudar(e.id, { nome: v.target.value })} />
          <input aria-label="Turnos que faltam" type="number" min={0} className={input + ' w-20'} placeholder="∞" value={e.turnos ?? ''} disabled={p.somenteLeitura} onChange={v => mudar(e.id, { turnos: numOuVazio(v.target.value) })} />
          <input aria-label="Em quem" className={input + ' col-span-2 sm:col-span-1 sm:col-start-auto'} maxLength={60} placeholder="Em quem" value={e.alvo ?? ''} disabled={p.somenteLeitura} onChange={v => mudar(e.id, { alvo: v.target.value })} />
        </div>
        <div className="flex gap-2">
          <input aria-label="O que faz" className={input} maxLength={400} placeholder="1d4 por turno, −2 no acerto…" value={e.texto ?? ''} disabled={p.somenteLeitura} onChange={v => mudar(e.id, { texto: v.target.value })} />
          {!p.somenteLeitura && <button type="button" className="p-2 text-red-300" aria-label={'Tirar ' + e.nome} onClick={() => salvar(lista.filter(x => x.id !== e.id))}><Trash2 size={15} /></button>}
        </div>
        {fim && <p className="text-xs text-red-200">Acabou.</p>}
      </li>
    })}</ul>
    {!p.somenteLeitura && <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" className={forte} onClick={() => salvar([...lista, { id: novoId(), nome: '' }])}><Plus size={14} /> Efeito</button>
      {lista.some(e => e.turnos === 0) && <button type="button" className={botao} onClick={() => salvar(lista.filter(e => e.turnos !== 0))}>Tirar os que acabaram</button>}
    </div>}
  </section>
}

/** No Principal: forma ativa, invocações em campo e efeitos valendo, para não precisar trocar de aba no combate. */
export function ResumoExtras(p: PropsExtras & { ir: (secao: string) => void }) {
  const f = temExtra(p.s, 'formas') ? formaAtiva(p.d) : null
  const inv = temExtra(p.s, 'invocacoes') ? (p.d.invocacoes ?? []).filter(i => invocacaoAtiva(p.d, i)) : []
  const ef = temExtra(p.s, 'efeitos') ? (p.d.efeitos ?? []).filter(e => e.nome && e.turnos !== 0) : []
  if (!f && !inv.length && !ef.length) return null
  return <section className={card} aria-label="Em jogo agora">
    <h3 className={titulo + ' mb-3'}>⚡ Em jogo agora</h3>
    <div className="space-y-3">
      {f && <div className="rounded-xl border border-(--ficha-acento) p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-white">🐺 Transformado em <strong>{f.nome}</strong></p>
          <span className="flex gap-2"><button type="button" className={botao} onClick={() => p.ir('formas')}>Ver golpes</button>{!p.somenteLeitura && <button type="button" className={botao} onClick={() => p.onChange(voltarAoNormal(p.d))}>Voltar ao normal</button>}</span></div>
        <div className="grid gap-2 sm:grid-cols-2">
          {f.vidaMax !== undefined && <Contador rotulo="❤️ Vida da forma" atual={Number(p.d.marcas?.[chave.vidaForma(f.id)] ?? f.vidaMax)} max={f.vidaMax} mudar={n => p.onChange(comMarcas(p.d, { [chave.vidaForma(f.id)]: Math.max(0, n) }))} desabilitado={p.somenteLeitura} cor="#f87171" />}
          {f.essenciaMax !== undefined && <Contador rotulo="💫 Essência da forma" atual={Number(p.d.marcas?.[chave.peForma(f.id)] ?? f.essenciaMax)} max={f.essenciaMax} mudar={n => p.onChange(comMarcas(p.d, { [chave.peForma(f.id)]: Math.max(0, n) }))} desabilitado={p.somenteLeitura} cor="#8fd3ff" />}
        </div>
      </div>}
      {inv.map(i => <div key={i.id} className="rounded-xl border border-(--a-3d3152) p-3">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-white">🐻 {i.nome}{turnosInvocacao(p.d, i) !== undefined ? ` · ${turnosInvocacao(p.d, i)} turno(s)` : ''}</p>
          <button type="button" className={botao} onClick={() => p.ir('invocacoes')}>Ver ataques</button></div>
        {i.vidaMax !== undefined && <Contador rotulo="❤️ Vida" atual={vidaInvocacao(p.d, i)} max={i.vidaMax} mudar={n => p.onChange(comMarcas(p.d, { [chave.vidaInv(i.id)]: Math.max(0, n) }))} desabilitado={p.somenteLeitura} cor="#f87171" />}
      </div>)}
      {ef.length > 0 && <div className="flex flex-wrap gap-1">{ef.map(e => <button key={e.id} type="button" onClick={() => p.ir('efeitos')} className={chip + ' hover:bg-(--s-34294f)'}>⏳ {e.nome}{e.turnos !== undefined ? ` (${e.turnos})` : ''}{e.alvo ? ' · ' + e.alvo : ''}</button>)}</div>}
    </div>
  </section>
}
