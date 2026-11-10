'use client'

import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, Loader2, RefreshCw, Swords, Target, X } from 'lucide-react'
import { api } from '@/lib/nuvem/cliente'
import { distancia, type OpcaoAtaque, type ResumoCombate } from '@/lib/sistemas/combate'
import { btn, input, msg } from './estilos'
import { toast } from 'sonner'

export type FichaMesa = { id: string; nome: string; sistema: string; dono_id: string; dono: string | null; npc: boolean; oculta: boolean; retrato: string | null; combate: ResumoCombate | null }
export type DadosAtaque = {
  atacante: { id: string; nome: string }; alvo: { id: string; nome: string }; arma: string; defesa: number; comparar: string; acerto: boolean
  dano: { expressao: string; resultados: number[]; total: number } | null; status: 'errou' | 'pendente' | 'aplicado' | 'ignorado'; aplicado: number
  vida: { depois: number | null; max: number | null } | null; distancia: number
}
type TokenBase = { id: string; nome: string; x: number; y: number; ficha_id: string | null; dono_id: string | null }
type Acao = (b: Record<string, unknown>) => Promise<Record<string, unknown>>

/** Fichas da campanha para a mesa (mestre: todas; jogador: as dele), com vida, defesa e ataques. */
export function useFichasMesa(campanhaId: string, versao: unknown) {
  const [fichas, setFichas] = useState<FichaMesa[] | null>(null)
  const carregar = useCallback(async () => {
    try { setFichas((await api<{ fichas: FichaMesa[] }>(`mesa/${campanhaId}?fichas=1`)).fichas) } catch { setFichas(f => f ?? []) }
  }, [campanhaId])
  useEffect(() => { const t = setTimeout(() => void carregar(), 0); return () => clearTimeout(t) }, [carregar, versao])
  return { fichas, carregar }
}

const barra = (atual: number, max: number | null) => max ? Math.max(0, Math.min(100, atual / max * 100)) : 100
const corVida = (p: number) => p > 50 ? '#10b981' : p > 25 ? '#f59e0b' : '#ef4444'

/** Aba “Fichas” da mesa: todas as fichas (jogadores e NPCs) para o mestre; as suas para o jogador. */
export function PainelFichas({ fichas, carregar, tokens, admin, cenaId, acao, atacarCom }: {
  fichas: FichaMesa[] | null; carregar: () => void; tokens: TokenBase[]; admin: boolean; cenaId: string | null; acao: Acao; atacarCom: (tokenId: string) => void
}) {
  const [aberta, setAberta] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'todas' | 'jogadores' | 'npcs'>('todas')
  if (!fichas) return <p className="flex items-center gap-2 text-sm text-[#b4aeca]"><Loader2 className="animate-spin" size={16} /> Carregando fichas…</p>
  const lista = fichas.filter(f => filtro === 'todas' || (filtro === 'npcs' ? f.npc : !f.npc))
  return <div className="space-y-3 text-sm">
    <div className="flex flex-wrap items-center gap-2">
      <p className="flex-1 text-xs text-[#b4aeca]">{admin ? 'Todas as fichas da campanha. Coloque na mesa para jogar com elas: as armas e poderes viram ataques.' : 'Seus personagens nesta campanha.'}</p>
      <button type="button" onClick={carregar} aria-label="Atualizar fichas" className="rounded-lg p-1.5 hover:bg-[#34294f]"><RefreshCw size={14} /></button>
    </div>
    {admin && <div className="flex gap-1">{(['todas', 'jogadores', 'npcs'] as const).map(f => <button key={f} type="button" onClick={() => setFiltro(f)}
      className={'rounded-full px-3 py-1 text-xs ' + (filtro === f ? 'bg-[#5b4380] text-white' : 'bg-[#1e1a30] text-[#c4b6d4]')}>{f === 'todas' ? 'Todas' : f === 'jogadores' ? '🛡️ Jogadores' : '👹 NPCs'}</button>)}</div>}
    {lista.length === 0 && <p className="rounded-lg border border-dashed border-[#4a3d63] p-4 text-center text-[#b4aeca]">{admin ? 'Nenhuma ficha aprovada ainda. Crie NPCs no Diário ou aprove as fichas dos jogadores.' : 'Você ainda não tem ficha aprovada nesta campanha.'}</p>}
    <ul className="space-y-2">{lista.map(f => {
      const c = f.combate, naMesa = tokens.find(t => t.ficha_id === f.id), p = c?.vida ? barra(c.vida.atual, c.vida.max) : null
      return <li key={f.id} className="overflow-hidden rounded-xl border border-[#3d3152] bg-[#1e1a30]">
        <button type="button" onClick={() => setAberta(a => a === f.id ? null : f.id)} className="flex w-full items-center gap-3 p-2 text-left hover:bg-[#241e38]" aria-expanded={aberta === f.id}>
          <span aria-hidden className="flex h-12 w-10 shrink-0 items-center justify-center rounded-lg border border-[#62527e] bg-gradient-to-br from-[#3b2470] to-[#1b1530] bg-cover bg-center font-bold text-[#c3a4f5]"
            style={f.retrato ? { backgroundImage: `url("${f.retrato}")` } : undefined}>{f.retrato ? '' : (f.nome.trim()[0] ?? '?').toUpperCase()}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{f.nome || 'Sem nome'} {f.npc ? <span className="text-[11px] text-[#f2a9c3]">👹 NPC{f.oculta ? ' · oculto' : ''}</span> : <span className="text-[11px] text-sky-300">🛡️ {f.dono}</span>}</span>
            {c?.vida && <span className="mt-1 flex items-center gap-2"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/60"><span className="block h-full rounded-full" style={{ width: p + '%', background: corVida(p!) }} /></span>
              <span className="text-[11px] tabular-nums text-[#d6c8e8]">❤️ {c.vida.atual}{c.vida.max !== null ? '/' + c.vida.max : ''}</span></span>}
            <span className="block text-[11px] text-[#a99bbb]">{c?.defesa ? `🛡️ ${c.defesa.nome} ${c.defesa.valor} · ` : ''}{c ? `${c.ataques.length} ataque(s)` : 'Ficha sem dados de combate'}{naMesa ? ' · 📍 na mesa' : ''}</span>
          </span>
        </button>
        {aberta === f.id && <div className="space-y-2 border-t border-[#3d3152] p-3">
          {c && c.recursos.length > 0 && <p className="text-xs text-[#d6c8e8]">{c.recursos.map(r => `${r.nome}: ${r.atual}${r.max !== null ? '/' + r.max : ''}`).join(' · ')}</p>}
          {c && c.ataques.length > 0 && <ul className="space-y-1">{c.ataques.map(a => <li key={a.tipo + a.id} className="rounded-lg bg-[#151123] px-2 py-1 text-xs">
            {a.tipo === 'item' ? '⚔️' : '✨'} <strong>{a.nome}</strong> · {a.dano} · {a.alcance} m{a.recurso ? ` · ${a.custo} ${c.recursos.find(r => r.id === a.recurso)?.nome ?? a.recurso}` : ''}</li>)}</ul>}
          <div className="flex flex-wrap gap-2">
            <a href={'/ficha?nuvem=' + f.id} target="_blank" rel="noopener" className={btn}><ExternalLink size={14} /> Abrir ficha</a>
            {!naMesa && cenaId && <button type="button" className={btn} onClick={() => void acao({ acao: 'token_criar', cenaId, fichaId: f.id }).then(() => toast.success(`${f.nome || 'Personagem'} entrou na mesa.`)).catch(() => {})}>📍 Colocar na mesa</button>}
            {naMesa && <button type="button" className={btn} onClick={() => atacarCom(naMesa.id)}><Swords size={14} /> Atacar com {f.nome.split(' ')[0] || 'ele'}</button>}
          </div>
        </div>}
      </li>
    })}</ul>
  </div>
}

export type EstadoAtaque = { atacante: string; fonte: string; teste: string; dano: string; bonus: string; defesa: string; alvo: string | null; mirando: boolean }
export const chaveFonte = (a: OpcaoAtaque) => a.tipo + ':' + a.id

/** Janela do ataque: escolher arma/poder e teste, mirar no mapa, conferir distância e atacar. */
export function JanelaAtaque({ estado, mudar, tokens, ficha, admin, acao, fechar, aoAtacar }: {
  estado: EstadoAtaque; mudar: (e: EstadoAtaque) => void; tokens: TokenBase[]; ficha: FichaMesa | null; admin: boolean; acao: Acao; fechar: () => void
  aoAtacar: (evento: Record<string, unknown>) => void
}) {
  const [enviando, setEnviando] = useState(false)
  const at = tokens.find(t => t.id === estado.atacante), al = tokens.find(t => t.id === estado.alvo)
  const c = ficha?.combate ?? null
  const opcao = c?.ataques.find(a => chaveFonte(a) === estado.fonte)
  const alcance = opcao?.alcance ?? null
  const dist = at && al ? distancia(at, al) : null
  const fora = dist !== null && alcance !== null && dist > alcance
  if (!at) return null
  if (estado.mirando) return <div className="pointer-events-auto absolute inset-x-2 top-2 z-40 mx-auto flex max-w-md items-center gap-2 rounded-xl border border-amber-400/60 bg-[#2b2310]/95 p-2 text-sm text-amber-100 shadow-xl">
    <Target size={18} className="shrink-0" /><span className="flex-1">Toque no alvo de <strong>{at.nome}</strong>{alcance ? ` · alcance ${alcance} m` : ''}</span>
    <button type="button" onClick={() => mudar({ ...estado, mirando: false })} className="rounded-lg border border-amber-300/60 px-2 py-1 text-xs">Voltar</button>
  </div>

  async function atacar() {
    if (!al) return
    setEnviando(true)
    try {
      const corpo: Record<string, unknown> = { acao: 'ataque', atacante: estado.atacante, alvo: al.id }
      if (opcao) corpo.fonte = { tipo: opcao.tipo, id: opcao.id }
      else corpo.dano = estado.dano
      if (c) corpo.teste = estado.teste; else corpo.bonus = Number(estado.bonus) || 0
      if (admin && estado.defesa) corpo.defesa = Number(estado.defesa) || 0
      const r = await acao(corpo)
      if (r.evento) aoAtacar(r.evento as Record<string, unknown>)
      fechar()
    } catch { /* o aviso já aparece */ } finally { setEnviando(false) }
  }
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label="Atacar" onClick={fechar}>
    <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-[#62527e] bg-[#19172c] p-4 text-sm" onClick={x => x.stopPropagation()}>
      <div className="flex items-center gap-2"><Swords size={18} className="text-[#f2a9c3]" /><h2 className="flex-1 font-bold">{at.nome} vai atacar</h2>
        <button type="button" onClick={fechar} aria-label="Fechar" className="rounded p-1 hover:bg-[#34294f]"><X size={18} /></button></div>
      <p className="mt-3 font-semibold">Com o quê?</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {c?.ataques.map(a => <button key={chaveFonte(a)} type="button" onClick={() => mudar({ ...estado, fonte: chaveFonte(a) })}
          className={'rounded-lg border px-2.5 py-1.5 text-left text-xs ' + (estado.fonte === chaveFonte(a) ? 'border-[#b99bff] bg-[#3b2b57]' : 'border-[#4a3d63]')}>
          <span className="block font-semibold">{a.tipo === 'item' ? '⚔️' : '✨'} {a.nome}</span><span className="text-[#c4b6d4]">{a.dano} · {a.alcance} m{a.recurso ? ` · ${a.custo} ${c.recursos.find(r => r.id === a.recurso)?.nome ?? ''}` : ''}</span></button>)}
        <button type="button" onClick={() => mudar({ ...estado, fonte: 'livre' })} className={'rounded-lg border px-2.5 py-1.5 text-xs ' + (estado.fonte === 'livre' ? 'border-[#b99bff] bg-[#3b2b57]' : 'border-[#4a3d63]')}>✍️ Ataque livre</button>
      </div>
      {!c && <p className="mt-2 text-xs text-[#a99bbb]">Este token não tem ficha ligada: informe o bônus e o dano.</p>}
      {estado.fonte === 'livre' && <label className="mt-2 block">Dano<input value={estado.dano} onChange={x => mudar({ ...estado, dano: x.target.value })} maxLength={40} className={input + ' mt-1 font-mono'} placeholder="Ex.: 1d8+3" /></label>}
      {c && c.testes.length > 0 ? <label className="mt-2 block">Teste de ataque<select value={estado.teste} onChange={x => mudar({ ...estado, teste: x.target.value })} className={input + ' mt-1'}>
        {c.testes.map(t => <option key={t.id} value={t.id}>{t.nome} ({t.valor >= 0 ? '+' : ''}{t.valor})</option>)}</select></label>
        : <label className="mt-2 block">Bônus de ataque<input value={estado.bonus} onChange={x => mudar({ ...estado, bonus: x.target.value })} inputMode="numeric" className={input + ' mt-1'} placeholder="0" /></label>}
      <div className="mt-3 rounded-xl border border-[#3d3152] bg-[#151123] p-3">
        {al ? <p>🎯 Alvo: <strong>{al.nome}</strong> · {dist} m{alcance !== null && <> de {alcance} m</>}</p> : <p className="text-[#c4b6d4]">Nenhum alvo escolhido.</p>}
        {fora && <p className="mt-1 text-xs text-amber-200">⚠️ Fora de alcance.{admin ? ' Como mestre, você pode atacar mesmo assim.' : ' Chegue mais perto ou escolha outro ataque.'}</p>}
        <button type="button" onClick={() => mudar({ ...estado, mirando: true })} className={btn + ' mt-2'}><Target size={14} /> {al ? 'Trocar alvo' : 'Escolher o alvo no mapa'}</button>
      </div>
      {admin && <label className="mt-2 block text-xs text-[#c4b6d4]">Defesa do alvo (se a ficha dele não tiver)<input value={estado.defesa} onChange={x => mudar({ ...estado, defesa: x.target.value })} inputMode="numeric" className={input + ' mt-1'} placeholder="10" /></label>}
      <button type="button" disabled={!al || enviando || (fora && !admin) || (estado.fonte === 'livre' && !estado.dano.trim()) || (!opcao && estado.fonte !== 'livre')} onClick={() => void atacar()}
        className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#b91c1c] to-[#7c3aed] p-3 text-base font-bold shadow-[0_0_18px_#b91c1c55] disabled:opacity-40 disabled:shadow-none">
        {enviando ? 'Rolando…' : '⚔️ Atacar!'}</button>
    </div>
  </div>
}

/** Ataque no chat: resultado, dano e (para o mestre) os botões para aplicar quando ele confirma. */
export function CartaoAtaque({ d, eventoId, admin, acao }: { d: DadosAtaque; eventoId: number; admin: boolean; acao: Acao }) {
  const [ocupado, setOcupado] = useState(false)
  const decidir = async (fator: number) => { setOcupado(true); try { await acao({ acao: 'ataque_decidir', eventoId, fator }) } catch (e) { toast.error(msg(e)) } finally { setOcupado(false) } }
  const selo = d.status === 'aplicado' ? <span className="rounded-full bg-[#4b253a] px-2 py-0.5 text-[11px] text-red-100">💥 {d.aplicado} de dano{d.vida?.depois !== null && d.vida?.depois !== undefined ? ` · ❤️ ${d.vida.depois}${d.vida.max ? '/' + d.vida.max : ''}` : ''}</span>
    : d.status === 'pendente' ? <span className="rounded-full bg-amber-900/70 px-2 py-0.5 text-[11px] text-amber-100">⏳ Aguardando o mestre</span>
    : d.status === 'ignorado' ? <span className="rounded-full bg-[#2b2140] px-2 py-0.5 text-[11px]">🛡️ Dano anulado</span>
    : <span className="rounded-full bg-[#2b2140] px-2 py-0.5 text-[11px]">💨 Errou</span>
  return <div className="mt-1 rounded-lg border border-[#5e3a52] bg-[#2a1726] p-2">
    <p><strong>⚔️ {d.atacante.nome}</strong> → <strong>{d.alvo.nome}</strong> <span className="text-xs text-[#d6c8e8]">com {d.arma} · {d.distancia} m</span></p>
    <p className="mt-1 text-xs text-[#e4d3ff]">{d.acerto ? '✅ Acertou' : '❌ Errou'}{d.comparar === 'maior_igual' ? ` (Defesa ${d.defesa})` : ''}
      {d.dano && <> · dano <span className="font-mono">{d.dano.expressao}</span> [{d.dano.resultados.join(', ')}] = <strong className="text-base text-[#ed9cd8]">{d.dano.total}</strong></>}</p>
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">{selo}
      {admin && d.status === 'pendente' && d.dano && <>
        <button type="button" disabled={ocupado} onClick={() => void decidir(1)} className="rounded-md bg-[#b91c1c] px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50">Aplicar {d.dano.total}</button>
        <button type="button" disabled={ocupado} onClick={() => void decidir(0.5)} className="rounded-md bg-[#7c2d12] px-2 py-1 text-[11px] text-white disabled:opacity-50">Metade ({Math.floor(d.dano.total / 2)})</button>
        <button type="button" disabled={ocupado} onClick={() => void decidir(0)} className="rounded-md border border-[#62527e] px-2 py-1 text-[11px] disabled:opacity-50">Anular</button></>}
    </div>
  </div>
}

/** Regras de combate da campanha (no painel do mestre). */
export function ConfigCombate({ acerto, acao }: { acerto: 'automatico' | 'mestre'; acao: Acao }) {
  return <section className="rounded-xl border border-[#5e3a52] bg-[#1e1a30] p-3">
    <h3 className="font-semibold">⚔️ Regras de combate</h3>
    <p className="mt-1 text-xs text-[#b4aeca]">Quando um ataque acerta, o dano…</p>
    <div className="mt-2 grid gap-2">
      {([['mestre', '🎩 Espera o mestre confirmar', 'Você vê o dano no chat e escolhe: aplicar, metade ou anular (bom para resistências e regras especiais).'],
        ['automatico', '⚡ Sai automaticamente', 'O dano já sai da vida do alvo na hora. Mais rápido para combates grandes.']] as const).map(([id, nome, txt]) =>
        <label key={id} className={'flex cursor-pointer gap-2 rounded-lg border p-2 text-sm ' + (acerto === id ? 'border-[#b99bff] bg-[#2b2140]' : 'border-[#3d3152]')}>
          <input type="radio" name="acerto" checked={acerto === id} onChange={() => void acao({ acao: 'combate_config', acerto: id }).catch(() => {})} className="mt-1 accent-[#b99bff]" />
          <span><strong>{nome}</strong><span className="block text-xs text-[#c4b6d4]">{txt}</span></span></label>)}
    </div>
  </section>
}
