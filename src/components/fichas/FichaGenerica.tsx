'use client'

import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Dice5, Info } from 'lucide-react'
import { calcular } from '@/lib/sistemas/calculo'
import type { DadosFicha, Sistema } from '@/lib/sistemas/tipos'
import { montarRolagem, rolarExpressao } from '@/lib/dice'
import { enviarImagemNuvem, NUVEM_ATIVA } from '@/lib/nuvem/cliente'
import GuiaSistema from '@/components/sistemas/GuiaSistema'
import RolagemCentral, { type RolagemCentralHandle } from '@/components/dados/RolagemCentral'
import { InventarioFicha, PoderesFicha } from './Inventario'
import ArvoreHabilidades from './Arvore'
import { GUIAS } from '@/lib/sistemas/guias'

const card = 'rounded-2xl border border-[#55456e] bg-[#201a32] p-4 sm:p-5'
const input = 'w-full rounded-lg border border-[#5e4b78] bg-[#151123] p-2 text-white disabled:opacity-70'
const sinal = (n: number | null | undefined) => n === null || n === undefined ? '—' : n >= 0 ? '+' + n : String(n)

/** Ficha que se monta sozinha a partir do modelo do sistema. */
export default function FichaGenerica({ sistema: s, dados: d, onChange, somenteLeitura = false, rolarNaCampanha }: {
  sistema: Sistema; dados: DadosFicha; onChange: (d: DadosFicha) => void; somenteLeitura?: boolean
  /** Se a ficha é de campanha: rola no servidor e publica no chat da mesa. */
  rolarNaCampanha?: (expressao: string, rotulo: string) => Promise<{ resultados: number[]; total: number } | null>
}) {
  const c = useMemo(() => calcular(s, d), [s, d])
  const central = useRef<RolagemCentralHandle>(null)
  const naMesa = rolarNaCampanha ? 'Também foi para o chat da mesa' : null
  const regra = s.rolagem === 'personalizada' ? s.regraRolagem : undefined
  const d20 = !regra && (s.rolagem ? s.rolagem === 'd20' : s.dados.startsWith('d20'))
  const d100 = s.id === 'brp' || s.rolagem === 'd100'
  const set = <K extends keyof DadosFicha>(k: K, v: DadosFicha[K]) => onChange({ ...d, [k]: v })

  async function rolar(nome: string, bonus: number | null) {
    const b = bonus ?? 0
    if (regra) {
      // Regra do sistema autoral: VALOR vira o número em que a pessoa tocou.
      const expr = montarRolagem(regra.formula, b)
      const r = rolarNaCampanha ? await rolarNaCampanha(expr, `${nome} (${regra.nome})`) : rolarExpressao(expr)
      if (!r) { if (!rolarNaCampanha) toast.error('Rolagem inválida: ' + expr); return }
      central.current?.mostrar({ rotulo: `${nome} · ${regra.nome}`, expressao: expr, resultados: r.resultados, total: r.total, nota: /s\d/.test(expr) ? `${r.total} sucesso${r.total === 1 ? '' : 's'}` : naMesa })
      return
    }
    if (d100) {
      const alvo = bonus ?? 0
      const r = rolarNaCampanha ? await rolarNaCampanha('1d100', nome + ' (' + alvo + '%)') : rolarExpressao('1d100')
      if (!r) return
      central.current?.mostrar({ rotulo: `${nome} (${alvo}%)`, expressao: '1d100', resultados: r.resultados, total: r.total, nota: r.total <= Math.floor(alvo / 5) ? '🌟 Sucesso especial!' : r.total <= alvo ? '✅ Sucesso' : '❌ Falha' })
      return
    }
    const expr = '1d20' + (b >= 0 ? '+' + b : String(b))
    const r = rolarNaCampanha ? await rolarNaCampanha(expr, nome) : rolarExpressao(expr)
    if (!r) return
    central.current?.mostrar({ rotulo: `${nome} (d20 ${sinal(b)})`, expressao: expr, resultados: r.resultados, total: r.total, nota: naMesa })
  }
  const podeRolar = d20 || d100 || !!regra
  /** Rolagem livre (dano, poder, item). Em campanha, vai para o chat da mesa. */
  async function rolarExpr(expressao: string, rotulo: string) {
    const r = rolarNaCampanha ? await rolarNaCampanha(expressao, rotulo) : rolarExpressao(expressao)
    if (!r) { if (!rolarNaCampanha) toast.error('Rolagem inválida: ' + expressao); return }
    central.current?.mostrar({ rotulo, expressao, resultados: r.resultados, total: r.total, nota: naMesa })
  }
  const propsInv = { s, d, c, onChange, somenteLeitura, rolar: rolarExpr }

  const grupos = new Map<string, NonNullable<Sistema['pericias']>['lista']>()
  for (const p of s.pericias?.lista ?? []) grupos.set(p.grupo ?? '', [...(grupos.get(p.grupo ?? '') ?? []), p])

  const secaoDeLista = (id: string) => /inventario|equipamento|armas|protecao|ataques|dinheiro/.test(id) ? 'equipamentos'
    : /habilidade|tecnica|talento|magia|poder|facanha|transforma|rituais|tracos/.test(id) ? 'habilidades' : 'anotacoes'
  const listasDe = (sec: string) => s.listas.filter(l => secaoDeLista(l.id) === sec)
  const SECOES = ([
    { id: 'principal', icone: '❤️', nome: 'Principal', sub: 'Identidade e recursos', ok: true },
    { id: 'atributos', icone: '✨', nome: s.pericias ? (s.atributos.length ? 'Atributos e perícias' : s.pericias.titulo ?? 'Perícias') : 'Atributos', sub: 'Testes e rolagens', ok: s.atributos.length > 0 || !!s.pericias },
    { id: 'habilidades', icone: '🌌', nome: 'Poderes e habilidades', sub: 'Magias, técnicas, usos e custos', ok: true },
    { id: 'arvore', icone: '🌠', nome: 'Árvore de habilidades', sub: 'Hexágonos, pontos e caminhos', ok: true },
    { id: 'equipamentos', icone: '🎒', nome: 'Inventário', sub: 'Itens, carga e moedas', ok: true },
    { id: 'anotacoes', icone: '📜', nome: 'Anotações e regras', sub: 'História, lembretes, créditos', ok: true },
    { id: 'guia', icone: '📖', nome: 'Guia de criação', sub: 'Passo a passo deste sistema', ok: !!GUIAS[s.id] },
  ] as const).filter(x => x.ok)
  const [secao, setSecao] = useState<string>('principal')
  const ir = (id: string) => { setSecao(id); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  // PV primeiro (mesmo com máximo digitado); senão, o primeiro recurso com máximo.
  const recursoPrincipal = s.recursos.find(r => /^(pv|vida)$/.test(r.id)) ?? s.recursos.find(r => c.recursosMax[r.id])
  const defesa = s.derivados.find(x => /^(defesa|ca)$/.test(x.id))

  return <div>
    <RolagemCentral ref={central} />
    <div className="sticky top-[57px] z-10 -mx-3 mb-4 flex items-center gap-3 overflow-x-auto border-b border-[#373251] bg-[#100d1c]/95 px-3 py-2 backdrop-blur sm:-mx-6 sm:px-6">
      <span className="shrink-0 truncate font-semibold text-[#e4d3ff]">{d.nome || 'Personagem'}</span>
      {recursoPrincipal && (() => { const max = c.recursosMax[recursoPrincipal.id] ?? d.recursos[recursoPrincipal.id]?.max ?? (s.id === 'dnd5e-srd' ? c.derivados.pv_sugerido : null) ?? 0, at = d.recursos[recursoPrincipal.id]?.atual ?? 0
        return <span className="shrink-0 rounded-lg border border-[#62527e] bg-[#201a32] px-3 py-1 text-sm">❤️ {/^pv/.test(recursoPrincipal.id) ? 'PV' : recursoPrincipal.nome.split(' ')[0]} <strong>{at} / {max}</strong></span> })()}
      {defesa && <span className="shrink-0 rounded-lg border border-[#62527e] bg-[#201a32] px-3 py-1 text-sm">🛡️ {defesa.nome.split(' (')[0]} <strong>{c.derivados[defesa.id] ?? '—'}</strong></span>}
    </div>
    <div className="lg:flex lg:gap-6">
      <nav aria-label="Seções da ficha" className="mb-4 lg:mb-0 lg:w-60 lg:shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-[120px] lg:flex-col lg:overflow-visible lg:rounded-2xl lg:border lg:border-[#55456e] lg:bg-[#201a32] lg:p-3">
          <p className="hidden px-2 pb-1 text-xs font-bold uppercase tracking-widest text-[#ed9cd8] lg:block">🌙 Menu da ficha</p>
          {SECOES.map(x => <button key={x.id} type="button" onClick={() => ir(x.id)} aria-current={secao === x.id ? 'page' : undefined}
            className={'shrink-0 rounded-xl px-3 py-2 text-left text-sm transition lg:w-full ' + (secao === x.id ? 'bg-[#5b4380] text-white' : 'bg-[#201a32] text-[#d6c8e8] hover:bg-[#2b2140] lg:bg-transparent')}>
            <span className="whitespace-nowrap">{x.icone} {x.nome}</span>
            <span className="hidden text-xs text-[#c4b6d4] lg:block">{x.sub}</span>
          </button>)}
        </div>
      </nav>
      <div className="min-w-0 flex-1 space-y-4">
        {secao === 'principal' && <>
    <section className={card}>
      <div className="flex items-start gap-4">
        <Retrato url={d.retrato} nome={d.nome} somenteLeitura={somenteLeitura} onChange={u => onChange({ ...d, retrato: u ?? undefined })} />
        <label className="block min-w-0 flex-1 text-sm font-semibold">Nome do personagem
          <input value={d.nome} maxLength={90} disabled={somenteLeitura} onChange={e => set('nome', e.target.value)} className={input + ' mt-1 text-lg font-bold'} placeholder="Ex.: Lyra Nyx" /></label>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {s.campos.map(f => <label key={f.id} className={'block text-sm ' + (f.tipo === 'area' ? 'sm:col-span-2 lg:col-span-3' : '')}>{f.nome}
          {f.tipo === 'area'
            ? <textarea rows={3} value={String(d.campos[f.id] ?? '')} disabled={somenteLeitura} onChange={e => set('campos', { ...d.campos, [f.id]: e.target.value.slice(0, 4000) })} className={input + ' mt-1'} />
            : <input type={f.tipo === 'numero' ? 'number' : 'text'} value={d.campos[f.id] ?? ''} disabled={somenteLeitura} maxLength={120}
              onChange={e => set('campos', { ...d.campos, [f.id]: f.tipo === 'numero' ? Number(e.target.value) : e.target.value })} className={input + ' mt-1'} />}
        </label>)}
      </div>
    </section>
    {c.limites.some(l => l.excedido) && <section role="alert" className="rounded-2xl border border-[#c98b3a] bg-[#3a2a14] p-4 text-sm text-[#f6dca8]">
      <p className="flex items-center gap-2 font-semibold"><AlertTriangle size={18} /> Acima do limite das regras</p>
      <ul className="mt-2 list-disc pl-5">{c.limites.filter(l => l.excedido).map(l => <li key={l.nome}>{l.nome}: {l.uso} de {l.max}</li>)}</ul>
    </section>}
    {(s.derivados.length > 0 || s.recursos.length > 0) && <section className={card}>
      <h2 className="mb-3 font-bold text-[#ed9cd8]">Valores e recursos</h2>
      {s.derivados.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {s.derivados.map(x => <div key={x.id} className="rounded-xl bg-[#171325] p-3" title={x.dica}>
          <p className="text-xs text-[#c4b6d4]">{x.nome}</p><p className="text-2xl font-black">{c.derivados[x.id] ?? '—'}</p>
          {x.dica && <p className="text-[10px] text-[#a998bd]">{x.dica}</p>}</div>)}
      </div>}
      {s.recursos.length > 0 && <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {s.recursos.map(r => {
          const max = c.recursosMax[r.id], atual = d.recursos[r.id]?.atual ?? 0
          const calc = !!r.formula || r.maxFixo !== undefined
          const pct = max ? Math.max(0, Math.min(100, (atual / max) * 100)) : 0
          return <div key={r.id} className="rounded-xl bg-[#171325] p-3">
            <p className="text-sm font-semibold">{r.nome}</p>
            <div className="mt-2 flex items-center gap-2">
              <input type="number" aria-label={r.nome + ' atual'} value={atual} disabled={somenteLeitura} onChange={e => set('recursos', { ...d.recursos, [r.id]: { ...d.recursos[r.id], atual: Number(e.target.value) || 0 } })} className={input + ' w-20 text-center'} />
              <span>/</span>
              {calc ? <span className="text-lg font-bold">{max ?? '—'}</span>
                : <input type="number" aria-label={r.nome + ' máximo'} value={d.recursos[r.id]?.max ?? ''} disabled={somenteLeitura} onChange={e => set('recursos', { ...d.recursos, [r.id]: { ...d.recursos[r.id], atual, max: Number(e.target.value) || 0 } })} className={input + ' w-20 text-center'} />}
            </div>
            {max ? <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#2b2140]"><div className="h-full bg-[#b06ad8] transition-all" style={{ width: pct + '%' }} /></div> : null}
          </div>
        })}
      </div>}
    </section>}
        </>}
        {secao === 'atributos' && <>
    {c.limites.some(l => l.excedido) && <section role="alert" className="rounded-2xl border border-[#c98b3a] bg-[#3a2a14] p-4 text-sm text-[#f6dca8]">
      <p className="flex items-center gap-2 font-semibold"><AlertTriangle size={18} /> Acima do limite das regras</p>
      <ul className="mt-2 list-disc pl-5">{c.limites.filter(l => l.excedido).map(l => <li key={l.nome}>{l.nome}: {l.uso} de {l.max}</li>)}</ul>
    </section>}
    {s.atributos.length > 0 && <section className={card}>
      <h2 className="mb-3 font-bold text-[#ed9cd8]">Atributos</h2>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-8">
        {s.atributos.map(a => <div key={a.id} className="rounded-xl border border-[#5e4b78] bg-[#171325] p-2 text-center sm:p-3">
          <p className="text-xs uppercase tracking-wider text-[#c4b6d4]" title={a.nome}>{a.id}</p>
          <input type="number" aria-label={a.nome} min={a.min} max={a.max} value={d.atributos[a.id] ?? a.padrao} disabled={somenteLeitura}
            onChange={e => set('atributos', { ...d.atributos, [a.id]: Math.max(a.min, Math.min(a.max, Number(e.target.value) || 0)) })}
            className="mt-1 w-full bg-transparent text-center text-2xl font-black text-white outline-none" />
          {s.formulaModificador && <p className="text-sm text-[#d4baff]">{sinal(c.mods[a.id])}</p>}
          <p className="mt-1 truncate text-[10px] text-[#a998bd]">{a.nome}</p>
        </div>)}
      </div>
    </section>}
    {d20 && s.atributos.length > 0 && <section className={card}>
      <h2 className="mb-2 flex items-center gap-2 font-bold text-[#ed9cd8]"><Dice5 size={18} /> Teste de atributo</h2>
      <div className="flex flex-wrap gap-2">{s.atributos.map(a => <button key={a.id} type="button" onClick={() => rolar(a.nome, s.formulaModificador ? c.mods[a.id] : c.vars[a.id])}
        className="rounded-lg border border-[#5e4b78] px-3 py-2 text-sm hover:bg-[#34294f]">{a.id} {sinal(s.formulaModificador ? c.mods[a.id] : c.vars[a.id])}</button>)}</div>
    </section>}
    {s.pericias && <section className={card}>
      <h2 className="mb-1 font-bold text-[#ed9cd8]">{s.pericias.titulo ?? 'Perícias'}</h2>
      {podeRolar && <p className="mb-3 text-xs text-[#a998bd]">Toque no valor para rolar.{regra && <> Regra: <strong className="text-[#e4d3ff]">{regra.nome}</strong> (<span className="font-mono">{regra.formula}</span>, VALOR = o número tocado).</>}</p>}
      {[...grupos].map(([g, lista]) => <div key={g} className="mb-4">
        {g && <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#d3adf0]">{g}</h3>}
        <div className="grid gap-2 sm:grid-cols-2">
          {lista.map(p => <div key={p.id} className="flex items-center gap-2 rounded-lg bg-[#171325] px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-sm">{p.nome}{p.atributo && <span className="ml-1 text-[10px] text-[#a998bd]">({p.atributo})</span>}</span>
            {s.pericias!.modo === 'valor'
              ? <input type="number" aria-label={p.nome} min={0} max={200} value={d.pericias[p.id] ?? 0} disabled={somenteLeitura} onChange={e => set('pericias', { ...d.pericias, [p.id]: Number(e.target.value) || 0 })} className={input + ' w-16 text-center'} />
              : <select aria-label={'Treino em ' + p.nome} value={String(d.pericias[p.id] ?? '')} disabled={somenteLeitura} onChange={e => set('pericias', { ...d.pericias, [p.id]: e.target.value })} className="max-w-[9.5rem] rounded-lg border border-[#5e4b78] bg-[#151123] p-1 text-xs text-white">
                {s.pericias!.treinos!.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}</select>}
            <button type="button" disabled={!podeRolar} onClick={() => rolar(p.nome, c.pericias[p.id])} aria-label={'Rolar ' + p.nome}
              className="w-14 shrink-0 rounded-lg bg-[#34294f] py-1 text-center font-bold tabular-nums hover:bg-[#4b3a6e] disabled:cursor-default disabled:hover:bg-[#34294f]">
              {s.pericias!.modo === 'valor' ? (c.pericias[p.id] ?? 0) + '%' : sinal(c.pericias[p.id])}</button>
          </div>)}
        </div>
      </div>)}
    </section>}
        </>}
        {secao === 'arvore' && <ArvoreHabilidades s={s} d={d} onChange={onChange} somenteLeitura={somenteLeitura} rolar={(x, r) => void rolarExpr(x, r)} />}
        {secao === 'habilidades' && <>
    <PoderesFicha {...propsInv} />
    {listasDe('habilidades').length > 0 && <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-[#d3adf0]">Anotações livres</h3>}
    <section className="grid gap-4">
      {listasDe('habilidades').map(l => <label key={l.id} className={card + ' block'}>
        <span className="font-bold text-[#ed9cd8]">{l.nome}</span>
        <textarea rows={6} value={d.listas[l.id] ?? ''} disabled={somenteLeitura} maxLength={20000} onChange={e => set('listas', { ...d.listas, [l.id]: e.target.value })} className={input + ' mt-2'} />
      </label>)}
    </section>
        </>}
        {secao === 'equipamentos' && <>
    <InventarioFicha {...propsInv} />
    {listasDe('equipamentos').length > 0 && <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-[#d3adf0]">Anotações livres</h3>}
    <section className="grid gap-4">
      {listasDe('equipamentos').map(l => <label key={l.id} className={card + ' block'}>
        <span className="font-bold text-[#ed9cd8]">{l.nome}</span>
        <textarea rows={6} value={d.listas[l.id] ?? ''} disabled={somenteLeitura} maxLength={20000} onChange={e => set('listas', { ...d.listas, [l.id]: e.target.value })} className={input + ' mt-2'} />
      </label>)}
    </section>
        </>}
        {secao === 'anotacoes' && <>
    <section className="grid gap-4">
      {listasDe('anotacoes').map(l => <label key={l.id} className={card + ' block'}>
        <span className="font-bold text-[#ed9cd8]">{l.nome}</span>
        <textarea rows={6} value={d.listas[l.id] ?? ''} disabled={somenteLeitura} maxLength={20000} onChange={e => set('listas', { ...d.listas, [l.id]: e.target.value })} className={input + ' mt-2'} />
      </label>)}
    </section>
    {s.autor && <section className={card + ' text-sm'}><p>✍️ <strong className="text-[#ed9cd8]">{s.nome}</strong> é um sistema autoral criado por <strong className="text-[#e4d3ff]">{s.autor}</strong>.</p></section>}
    {(s.observacoes?.length || s.creditos) && <section className={card + ' text-xs text-[#bfb2cf]'}>
      {s.observacoes?.map(o => <p key={o} className="mb-2 flex gap-2"><Info size={14} className="mt-0.5 shrink-0" /> {o}</p>)}
      {s.creditos && <p className="mt-2 border-t border-[#3d3152] pt-2 text-[11px] leading-relaxed text-[#9d8db0]">{s.creditos}</p>}
    </section>}
        </>}
        {secao === 'guia' && <GuiaSistema sistemaId={s.id} />}
      </div>
    </div>
  </div>
}

/** Imagem do personagem: aparece aqui e no cartão da ficha. */
function Retrato({ url, nome, somenteLeitura, onChange }: { url?: string; nome: string; somenteLeitura: boolean; onChange: (u: string | null) => void }) {
  const [enviando, setEnviando] = useState(false)
  const podeEnviar = !somenteLeitura && NUVEM_ATIVA
  async function escolher(f: File) {
    setEnviando(true)
    try { onChange(await enviarImagemNuvem('imagens', f, 900)) } catch (e) { toast.error(e instanceof Error ? e.message : 'Falha ao enviar a imagem.') } finally { setEnviando(false) }
  }
  return <div className="w-24 shrink-0 text-center sm:w-28">
    <label className={'group relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border-2 border-[#62527e] bg-gradient-to-br from-[#3b2470] to-[#1b1530] text-4xl font-black text-[#b99bff] ' + (podeEnviar ? 'cursor-pointer hover:border-[#b99bff]' : '')}>
      {url ? <span className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${url}")` }} aria-hidden /> : (nome.trim()[0] ?? '?').toUpperCase()}
      {podeEnviar && <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-[11px] font-semibold text-white opacity-90 group-hover:opacity-100">{enviando ? 'Enviando…' : url ? '🖼️ Trocar' : '🖼️ Imagem'}</span>}
      {podeEnviar && <input type="file" accept="image/png,image/jpeg,image/webp" disabled={enviando} className="sr-only" aria-label="Imagem do personagem" onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void escolher(f) }} />}
    </label>
    {url && podeEnviar && <button type="button" onClick={() => onChange(null)} className="mt-1 text-[11px] text-[#c4b6d4] hover:underline">Remover</button>}
  </div>
}
