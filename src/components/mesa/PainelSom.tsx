'use client'

import { useState } from 'react'
import { Search, Trash2, Volume2, VolumeX } from 'lucide-react'
import { mudarPreferencias, usePreferencias } from '@/lib/preferencias'
import { AMBIENTES, CATEGORIAS, CENAS_PRONTAS, EFEITOS, type CategoriaSom } from '@/lib/mesa/somMesa'
import type { MesaDeSom } from './useMesaDeSom'

type Aba = 'efeitos' | 'ambiente' | 'cenas'
const pct = (n: number) => Math.round(n * 100) + '%'

/** Ajustes que valem só para quem está olhando (todos veem). */
function SoParaVoce({ som }: { som: MesaDeSom }) {
  const pref = usePreferencias()
  return <section aria-label="Sons só para você" className="prg-cartao space-y-2.5 p-3 text-sm">
    <p className="text-xs font-semibold uppercase tracking-wider text-(--a-c4b6d4)">Só para você</p>
    <label className="flex items-center gap-2"><input type="checkbox" checked={pref.sonsMesa} onChange={e => mudarPreferencias({ sonsMesa: e.target.checked })} className="size-4 accent-(--a-8b68c4)" /> Ouvir os sons da mesa</label>
    <label className="flex items-center gap-2 text-xs text-(--a-cfc0df)">{pref.volumeSons > 0 ? <Volume2 size={15} /> : <VolumeX size={15} />}
      <span className="w-14 shrink-0">Volume</span>
      <input type="range" min={0} max={1} step={0.05} value={pref.volumeSons} onChange={e => mudarPreferencias({ volumeSons: Number(e.target.value) })} aria-label="Volume dos sons da mesa" className="min-w-0 flex-1 accent-(--a-8b68c4)" />
      <span className="w-9 text-right tabular-nums">{pct(pref.volumeSons)}</span></label>
    <label className="flex items-start gap-2"><input type="checkbox" checked={pref.sonsRepentinos} onChange={e => mudarPreferencias({ sonsRepentinos: e.target.checked })} className="mt-0.5 size-4 accent-(--a-8b68c4)" />
      <span>Sons de susto <span className="block text-[11px] text-(--a-a99bbb)">Grito, explosão e rugido. Desligue se preferir não levar sustos.</span></span></label>
    <button type="button" onClick={som.testar} className="prg-botao prg-botao-secundario w-full">🔔 Testar o som</button>
  </section>
}

/**
 * Mesa de Som (v0.36.5). Mestre: efeitos na hora, camadas de ambiente e cenas prontas.
 * Jogadores: veem o que está tocando e ajustam o próprio volume.
 */
export default function PainelSom({ som, admin }: { som: MesaDeSom; admin: boolean }) {
  const [aba, setAba] = useState<Aba>('efeitos')
  const [categoria, setCategoria] = useState<CategoriaSom | 'todas'>('todas')
  const [busca, setBusca] = useState('')
  const [nomeCena, setNomeCena] = useState('')
  const ativos = Object.entries(som.camadas)
  const todasCenas = [...CENAS_PRONTAS, ...som.cenasSalvas]
  const cenaAtual = todasCenas.find(c => c.id === som.cena)

  const tocandoAgora = <p className="rounded-xl border border-(--a-3d3152) bg-(--s-171325)/90 px-3 py-2 text-xs text-(--a-cfc0df)" aria-live="polite">
    {ativos.length ? <>🎧 Tocando agora{cenaAtual ? <> · <strong className="text-white">{cenaAtual.icone} {cenaAtual.nome}</strong></> : ''}: {ativos.map(([id, n]) => { const a = AMBIENTES.find(x => x.id === id); return a ? `${a.icone} ${a.nome} ${pct(n)}` : '' }).join(' · ')}</> : '🔈 Nenhum ambiente tocando.'}
  </p>

  if (!admin) return <div className="space-y-3">
    {tocandoAgora}
    <p className="text-xs text-(--a-a99bbb)">O mestre toca efeitos e ambientes; o som é criado no seu aparelho, no volume que você escolher.</p>
    <SoParaVoce som={som} />
  </div>

  const termo = busca.trim().toLowerCase()
  const efeitos = EFEITOS.filter(e => (categoria === 'todas' || e.categoria === categoria) && (!termo || e.nome.toLowerCase().includes(termo)))

  return <div className="space-y-3">
    <div className="flex items-center gap-2">
      <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-(--a-cfc0df)"><span className="shrink-0">Intensidade</span>
        <input type="range" min={0.1} max={1} step={0.05} value={som.intensidade} onChange={e => som.setIntensidade(Number(e.target.value))} aria-label="Intensidade dos efeitos para todos" className="min-w-0 flex-1 accent-(--a-8b68c4)" />
        <span className="w-9 text-right tabular-nums">{pct(som.intensidade)}</span></label>
      <button type="button" onClick={som.silenciarTudo} disabled={!ativos.length} className="prg-botao prg-botao-secundario shrink-0 !min-h-9 !px-2.5 !text-xs"><VolumeX size={14} /> Silenciar</button>
    </div>
    {tocandoAgora}
    <div role="tablist" aria-label="Mesa de som" className="flex gap-1.5">
      {([['efeitos', '⚡ Efeitos'], ['ambiente', '🌧️ Ambiente'], ['cenas', '🎬 Cenas']] as const).map(([id, nome]) =>
        <button key={id} type="button" role="tab" aria-selected={aba === id} onClick={() => setAba(id)} className="prg-chip flex-1 justify-center">{nome}</button>)}
    </div>

    {aba === 'efeitos' && <div className="space-y-2.5">
      <label className="flex items-center gap-2 rounded-xl border border-(--a-55456e) bg-(--s-171325) px-3"><Search size={15} className="text-(--a-a99bbb)" />
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Procurar efeito…" aria-label="Procurar efeito" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" /></label>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button type="button" aria-pressed={categoria === 'todas'} onClick={() => setCategoria('todas')} className="prg-chip shrink-0">Todos</button>
        {CATEGORIAS.map(c => <button key={c.id} type="button" aria-pressed={categoria === c.id} onClick={() => setCategoria(c.id)} className="prg-chip shrink-0">{c.icone} {c.nome}</button>)}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {efeitos.map(e => <button key={e.id} type="button" onClick={() => som.tocar(e.id)} aria-label={'Tocar ' + e.nome} title={e.repentino ? 'Som de susto: quem desligou não ouve' : undefined}
          className="relative flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-xl border border-(--a-55456e) bg-(--s-201a32) p-2 text-center text-[11px] leading-tight transition hover:border-(--a-b99bff) hover:bg-(--s-2b2143) active:scale-95">
          <span className="text-2xl" aria-hidden="true">{e.icone}</span>{e.nome}
          {e.repentino && <span aria-hidden="true" className="absolute right-1 top-1 text-[10px]">⚡</span>}
        </button>)}
        {!efeitos.length && <p className="col-span-3 py-4 text-center text-xs text-(--a-a99bbb)">Nenhum efeito com esse nome.</p>}
      </div>
      <p className="text-[11px] text-(--a-a99bbb)">⚡ = som de susto (quem desligou “Sons de susto” não ouve).</p>
    </div>}

    {aba === 'ambiente' && <ul className="space-y-1.5">
      {AMBIENTES.map(a => { const nivel = som.camadas[a.id] ?? 0, ligado = nivel > 0
        return <li key={a.id} className={'flex items-center gap-2 rounded-xl border px-2.5 py-2 ' + (ligado ? 'border-(--a-b99bff) bg-(--s-2b2143)' : 'border-(--a-3d3152) bg-(--s-171325)')}>
          <button type="button" aria-pressed={ligado} aria-label={(ligado ? 'Desligar ' : 'Ligar ') + a.nome} onClick={() => { const c = { ...som.camadas }; if (ligado) delete c[a.id]; else c[a.id] = 0.6; som.definirAmbiente(c, null) }}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"><span className="text-xl" aria-hidden="true">{a.icone}</span>
            <span className="min-w-0"><span className="block text-sm font-medium">{a.nome}</span><span className="block truncate text-[11px] text-(--a-a99bbb)">{a.descricao}</span></span></button>
          <input type="range" min={0.05} max={1} step={0.05} value={ligado ? nivel : 0.6} disabled={!ligado} aria-label={'Volume de ' + a.nome}
            onChange={e => som.definirAmbiente({ ...som.camadas, [a.id]: Number(e.target.value) }, som.cena)} className="w-24 shrink-0 accent-(--a-8b68c4) disabled:opacity-40" />
        </li> })}
    </ul>}

    {aba === 'cenas' && <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        {todasCenas.map(c => { const ativa = som.cena === c.id
          return <div key={c.id} className="relative">
            <button type="button" aria-pressed={ativa} onClick={() => ativa ? som.silenciarTudo() : som.aplicarCena(c)}
              className={'flex h-full w-full flex-col items-start gap-0.5 rounded-xl border p-2.5 text-left transition ' + (ativa ? 'border-(--a-e4d3ff) bg-(--s-3a2c58) shadow-[inset_0_-2px_0_var(--ouro)]' : 'border-(--a-55456e) bg-(--s-201a32) hover:border-(--a-b99bff)')}>
              <span className="text-xl" aria-hidden="true">{c.icone}</span><span className="text-sm font-semibold">{c.nome}</span>
              <span className="text-[11px] leading-snug text-(--a-a99bbb)">{ativa ? '▶ Tocando — toque para parar' : c.descricao}</span>
            </button>
            {c.id.startsWith('minha-') && <button type="button" onClick={() => som.apagarCena(c.id)} aria-label={'Apagar a cena ' + c.nome} className="absolute right-1 top-1 rounded-lg p-1 text-(--a-a99bbb) hover:bg-(--s-34294f) hover:text-white"><Trash2 size={13} /></button>}
          </div> })}
      </div>
      <form onSubmit={ev => { ev.preventDefault(); if (!ativos.length) return; som.salvarCena(nomeCena); setNomeCena('') }} className="prg-cartao space-y-2 p-3">
        <p className="text-xs text-(--a-cfc0df)">Monte o ambiente na aba 🌧️ Ambiente e salve aqui para usar de novo nesta campanha.</p>
        <div className="flex gap-2"><input value={nomeCena} onChange={e => setNomeCena(e.target.value)} maxLength={40} placeholder="Nome da cena" aria-label="Nome da cena" className="min-w-0 flex-1 rounded-lg border border-(--a-55456e) bg-(--s-171325) px-3 py-2 text-sm" />
          <button type="submit" disabled={!ativos.length} className="prg-botao prg-botao-primario shrink-0">Salvar cena</button></div>
      </form>
      <p className="text-[11px] text-(--a-a99bbb)">Algumas cenas tocam sons de vez em quando sozinhas (trovões na tempestade, risadas na taverna).</p>
    </div>}

    <SoParaVoce som={som} />
  </div>
}
