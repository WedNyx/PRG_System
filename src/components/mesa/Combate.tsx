'use client'

import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, Loader2, RefreshCw, Swords, Target, X } from 'lucide-react'
import { api } from '@/lib/nuvem/cliente'
import { distancia, type OpcaoAtaque, type ResumoCombate } from '@/lib/sistemas/combate'
import { btn, input, msg } from './estilos'
import { toast } from 'sonner'
import ArteItem from '@/components/fichas/ArteItem'
import { lerRaridade } from '@/lib/itensArte'
import RolagemAssim from '@/components/dados/RolagemAssim'
import NaTela from '@/components/NaTela'

export type FichaMesa = { id: string; nome: string; sistema: string; dono_id: string; dono: string | null; npc: boolean; oculta: boolean; retrato: string | null; combate: ResumoCombate | null }
export type DadosAtaque = {
  atacante: { id: string; nome: string }; alvo: { id: string; nome: string }; arma: string; defesa: number; comparar: string; acerto: boolean
  dano: { expressao: string; resultados: number[]; total: number } | null; status: 'errou' | 'pendente' | 'aplicado' | 'ignorado' | 'resolvendo'; aplicado: number
  vida: { depois: number | null; max: number | null } | null; distancia: number
  /** Assimilação: ataque com dados de símbolos (o chat mostra cada dado). */
  assimilacao?: { manter: number }
}
type TokenBase = { id: string; nome: string; x: number; y: number; ficha_id: string | null; ficha_modelo?: string | null; dono_id: string | null }
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
export function PainelFichas({ fichas, carregar, tokens, admin, cenaId, acao, atacarCom, abrirFicha }: {
  fichas: FichaMesa[] | null; carregar: () => void; tokens: TokenBase[]; admin: boolean; cenaId: string | null; acao: Acao; atacarCom: (tokenId: string) => void
  /** Abre a ficha inteira dentro da mesa (v0.33.8). */
  abrirFicha?: (fichaId: string) => void
}) {
  const [copias, setCopias] = useState<Record<string, number>>({})
  async function colocarCopias(f: FichaMesa) {
    const n = Math.max(1, Math.min(10, copias[f.id] ?? 1))
    for (let i = 0; i < n; i++) await acao({ acao: 'token_criar', cenaId, fichaId: f.id, copia: true }).catch(() => {})
    toast.success(n === 1 ? `Uma cópia de ${f.nome} entrou na mesa (vida própria).` : `${n} cópias de ${f.nome} entraram na mesa (cada uma com a própria vida).`)
  }
  const [aberta, setAberta] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'todas' | 'jogadores' | 'npcs'>('todas')
  if (!fichas) return <p className="flex items-center gap-2 text-sm text-(--a-b4aeca)"><Loader2 className="animate-spin" size={16} /> Carregando fichas…</p>
  const lista = fichas.filter(f => filtro === 'todas' || (filtro === 'npcs' ? f.npc : !f.npc))
  return <div className="space-y-3 text-sm">
    <div className="flex flex-wrap items-center gap-2">
      <p className="flex-1 text-xs text-(--a-b4aeca)">{admin ? 'Todas as fichas da campanha.' : 'Seus personagens nesta campanha.'}</p>
      <button type="button" onClick={carregar} aria-label="Atualizar fichas" className="rounded-lg p-1.5 hover:bg-(--s-34294f)"><RefreshCw size={14} /></button>
    </div>
    {admin && <div className="flex gap-1">{(['todas', 'jogadores', 'npcs'] as const).map(f => <button key={f} type="button" onClick={() => setFiltro(f)}
      className={'rounded-full px-3 py-1 text-xs ' + (filtro === f ? 'bg-(--a-5b4380) text-white' : 'bg-(--s-1e1a30) text-(--a-c4b6d4)')}>{f === 'todas' ? 'Todas' : f === 'jogadores' ? '🛡️ Jogadores' : '👹 NPCs'}</button>)}</div>}
    {lista.length === 0 && <p className="rounded-lg border border-dashed border-(--a-4a3d63) p-4 text-center text-(--a-b4aeca)">{admin ? 'Nenhuma ficha aprovada ainda. Crie NPCs no Diário ou aprove as fichas dos jogadores.' : 'Você ainda não tem ficha aprovada nesta campanha.'}</p>}
    <ul className="space-y-2">{lista.map(f => {
      const c = f.combate, naMesa = tokens.find(t => t.ficha_id === f.id), nCopias = tokens.filter(t => t.ficha_modelo === f.id).length, p = c?.vida ? barra(c.vida.atual, c.vida.max) : null
      return <li key={f.id} className="overflow-hidden rounded-xl border border-(--a-3d3152) bg-(--s-1e1a30)">
        <button type="button" onClick={() => setAberta(a => a === f.id ? null : f.id)} className="flex w-full items-center gap-3 p-2 text-left hover:bg-(--s-241e38)" aria-expanded={aberta === f.id}>
          <span aria-hidden className="flex h-12 w-10 shrink-0 items-center justify-center rounded-lg border border-(--a-62527e) bg-gradient-to-br from-(--s-3b2470) to-(--s-1b1530) bg-cover bg-center font-bold text-(--a-c3a4f5)"
            style={f.retrato ? { backgroundImage: `url("${f.retrato}")` } : undefined}>{f.retrato ? '' : (f.nome.trim()[0] ?? '?').toUpperCase()}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{f.nome || 'Sem nome'} {f.npc ? <span className="text-[11px] text-[#f2a9c3]">👹 NPC{f.oculta ? ' · oculto' : ''}</span> : <span className="text-[11px] text-sky-300">🛡️ {f.dono}</span>}</span>
            {c?.vida && <span className="mt-1 flex items-center gap-2"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/60"><span className="block h-full rounded-full" style={{ width: p + '%', background: corVida(p!) }} /></span>
              <span className="text-[11px] tabular-nums text-(--a-d6c8e8)">❤️ {c.vida.atual}{c.vida.max !== null ? '/' + c.vida.max : ''}</span></span>}
            <span className="block text-[11px] text-(--a-a99bbb)">{c?.defesa ? `🛡️ ${c.defesa.nome} ${c.defesa.valor} · ` : ''}{c ? `${c.ataques.length} ataque(s)` : 'Ficha sem dados de combate'}{naMesa ? ' · 📍 na mesa' : ''}{nCopias ? ` · 👥 ${nCopias} cópia(s)` : ''}</span>
          </span>
        </button>
        {aberta === f.id && <div className="space-y-2 border-t border-(--a-3d3152) p-3">
          {c && c.recursos.length > 0 && <p className="text-xs text-(--a-d6c8e8)">{c.recursos.map(r => `${r.nome}: ${r.atual}${r.max !== null ? '/' + r.max : ''}`).join(' · ')}</p>}
          {c && c.ataques.length > 0 && <ul className="space-y-1">{c.ataques.map(a => <li key={a.tipo + a.id} className="rounded-lg bg-(--s-151123) px-2 py-1 text-xs">
            {a.tipo === 'item' ? <ArteItem item={{ nome: a.nome, categoria: a.categoria ?? 'arma', arte: a.arte, raridade: lerRaridade(a.raridade), imagem: a.imagem, magico: a.magico }} tamanho={22} className="mr-1 !rounded-md !border align-middle" /> : '✨'} <strong>{a.nome}</strong> · {a.dano} · {a.alcance} m{a.recurso ? ` · ${a.custo} ${c.recursos.find(r => r.id === a.recurso)?.nome ?? a.recurso}` : ''}</li>)}</ul>}
          <div className="flex flex-wrap gap-2">
            {abrirFicha ? <button type="button" className={btn} onClick={() => abrirFicha(f.id)}>📜 Abrir ficha</button>
              : <a href={'/ficha?nuvem=' + f.id} target="_blank" rel="noopener" className={btn}><ExternalLink size={14} /> Abrir ficha</a>}
            {!naMesa && cenaId && <button type="button" className={btn} onClick={() => void acao({ acao: 'token_criar', cenaId, fichaId: f.id }).then(() => toast.success(`${f.nome || 'Personagem'} entrou na mesa.`)).catch(() => {})}>📍 Colocar na mesa</button>}
            {naMesa && <button type="button" className={btn} onClick={() => atacarCom(naMesa.id)}><Swords size={14} /> Atacar com {f.nome.split(' ')[0] || 'ele'}</button>}
          </div>
          {admin && f.npc && cenaId && <div className="flex flex-wrap items-center gap-2 rounded-lg bg-(--s-151123) p-2 text-xs">
            <span className="flex-1 text-(--a-c4b6d4)">👥 Cópias com vida própria (vários do mesmo NPC): mesma imagem, ataques e testes da ficha.</span>
            <select aria-label="Quantas cópias" value={copias[f.id] ?? 1} onChange={x => setCopias(m => ({ ...m, [f.id]: Number(x.target.value) }))} className={input + ' !w-auto !py-1'}>{[1, 2, 3, 4, 5, 6, 8, 10].map(n => <option key={n} value={n}>{n}</option>)}</select>
            <button type="button" className={btn} onClick={() => void colocarCopias(f)}>➕ Colocar</button>
          </div>}
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
  if (estado.mirando) return <div className="pointer-events-none absolute inset-x-2 top-2 z-40 mx-auto flex max-w-md items-center gap-2 rounded-xl border border-amber-400/60 bg-[#2b2310]/85 p-2 text-sm text-amber-100 shadow-xl">
    <Target size={18} className="shrink-0" /><span className="flex-1">Toque no alvo de <strong>{at.nome}</strong>{alcance ? ` · alcance ${alcance} m` : ''}</span>
    <button type="button" onClick={() => mudar({ ...estado, mirando: false })} className="pointer-events-auto rounded-lg border border-amber-300/60 px-2 py-1 text-xs">Voltar</button>
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
  return <NaTela><div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4" role="dialog" aria-modal="true" aria-label="Atacar" onClick={fechar}>
    <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-(--a-62527e) bg-(--s-19172c) p-4 text-sm" onClick={x => x.stopPropagation()}>
      <div className="flex items-center gap-2"><Swords size={18} className="text-[#f2a9c3]" /><h2 className="flex-1 font-bold">{at.nome} vai atacar</h2>
        <button type="button" onClick={fechar} aria-label="Fechar" className="rounded p-1 hover:bg-(--s-34294f)"><X size={18} /></button></div>
      <p className="mt-3 font-semibold">Com o quê?</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {c?.ataques.map(a => <button key={chaveFonte(a)} type="button" onClick={() => mudar({ ...estado, fonte: chaveFonte(a) })}
          className={'rounded-lg border px-2.5 py-1.5 text-left text-xs ' + (estado.fonte === chaveFonte(a) ? 'border-(--a-b99bff) bg-(--s-3b2b57)' : 'border-(--a-4a3d63)')}>
          <span className="flex items-center gap-1.5 font-semibold">{a.tipo === 'item' ? <ArteItem item={{ nome: a.nome, categoria: a.categoria ?? 'arma', arte: a.arte, raridade: lerRaridade(a.raridade), imagem: a.imagem, magico: a.magico }} tamanho={24} className="!rounded-md !border" /> : '✨'} {a.nome}</span><span className="text-(--a-c4b6d4)">{a.dano} · {a.alcance} m{a.recurso ? ` · ${a.custo} ${c.recursos.find(r => r.id === a.recurso)?.nome ?? ''}` : ''}</span></button>)}
        <button type="button" onClick={() => mudar({ ...estado, fonte: 'livre' })} className={'rounded-lg border px-2.5 py-1.5 text-xs ' + (estado.fonte === 'livre' ? 'border-(--a-b99bff) bg-(--s-3b2b57)' : 'border-(--a-4a3d63)')}>✍️ Ataque livre</button>
      </div>
      {!c && <p className="mt-2 text-xs text-(--a-a99bbb)">Este token não tem ficha ligada: informe o bônus e o dano.</p>}
      {estado.fonte === 'livre' && <label className="mt-2 block">Dano<input value={estado.dano} onChange={x => mudar({ ...estado, dano: x.target.value })} maxLength={40} className={input + ' mt-1 font-mono'} placeholder="Ex.: 1d8+3" /></label>}
      {c && c.testes.length > 0 ? <label className="mt-2 block">Teste de ataque<select value={estado.teste} onChange={x => mudar({ ...estado, teste: x.target.value })} className={input + ' mt-1'}>
        {c.testes.map(t => <option key={t.id} value={t.id}>{t.nome} ({t.assim ? [t.assim.d6 ? t.assim.d6 + 'd6' : '', t.assim.d10 ? t.assim.d10 + 'd10' : ''].filter(Boolean).join(' + ') : (t.valor >= 0 ? '+' : '') + t.valor})</option>)}</select></label>
        : <label className="mt-2 block">Bônus de ataque<input value={estado.bonus} onChange={x => mudar({ ...estado, bonus: x.target.value })} inputMode="numeric" className={input + ' mt-1'} placeholder="0" /></label>}
      <div className="mt-3 rounded-xl border border-(--a-3d3152) bg-(--s-151123) p-3">
        {al ? <p>🎯 Alvo: <strong>{al.nome}</strong> · {dist} m{alcance !== null && <> de {alcance} m</>}</p> : <p className="text-(--a-c4b6d4)">Nenhum alvo escolhido.</p>}
        {fora && <p className="mt-1 text-xs text-amber-200">⚠️ Fora de alcance.{admin ? ' Como mestre, você pode atacar mesmo assim.' : ' Chegue mais perto ou escolha outro ataque.'}</p>}
        <button type="button" onClick={() => mudar({ ...estado, mirando: true })} className={btn + ' mt-2'}><Target size={14} /> {al ? 'Trocar alvo' : 'Escolher o alvo no mapa'}</button>
      </div>
      {admin && <label className="mt-2 block text-xs text-(--a-c4b6d4)">Defesa do alvo (se a ficha dele não tiver)<input value={estado.defesa} onChange={x => mudar({ ...estado, defesa: x.target.value })} inputMode="numeric" className={input + ' mt-1'} placeholder="10" /></label>}
      <button type="button" disabled={!al || enviando || (fora && !admin) || (estado.fonte === 'livre' && !estado.dano.trim()) || (!opcao && estado.fonte !== 'livre')} onClick={() => void atacar()}
        className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#b91c1c] to-(--a-7c3aed) p-3 text-base font-bold shadow-[0_0_18px_#b91c1c55] disabled:opacity-40 disabled:shadow-none">
        {enviando ? 'Rolando…' : '⚔️ Atacar!'}</button>
    </div>
  </div></NaTela>
}

/** Ataque no chat: resultado, dano e (para o mestre) os botões para aplicar quando ele confirma. */
export function CartaoAtaque({ d, eventoId, admin, acao, rolagem }: { d: DadosAtaque; eventoId: number; admin: boolean; acao: Acao; rolagem?: { expressao: string; resultados: number[] } }) {
  const [ocupado, setOcupado] = useState(false)
  const decidir = async (fator: number) => { setOcupado(true); try { await acao({ acao: 'ataque_decidir', eventoId, fator }) } catch (e) { toast.error(msg(e)) } finally { setOcupado(false) } }
  const selo = d.status === 'aplicado' ? <span className="rounded-full bg-[#4b253a] px-2 py-0.5 text-[11px] text-red-100">💥 {d.aplicado} de dano{d.vida?.depois !== null && d.vida?.depois !== undefined ? ` · ❤️ ${d.vida.depois}${d.vida.max ? '/' + d.vida.max : ''}` : ''}</span>
    : d.status === 'pendente' ? <span className="rounded-full bg-amber-900/70 px-2 py-0.5 text-[11px] text-amber-100">⏳ Aguardando o mestre</span>
    : d.status === 'ignorado' ? <span className="rounded-full bg-(--s-2b2140) px-2 py-0.5 text-[11px]">🛡️ Dano anulado</span>
    : d.status === 'resolvendo' ? <span className="rounded-full bg-amber-900/70 px-2 py-0.5 text-[11px] text-amber-100">⏳ Aplicando…</span>
    : <span className="rounded-full bg-(--s-2b2140) px-2 py-0.5 text-[11px]">💨 Errou</span>
  return <div className="mt-1 rounded-lg border border-[#5e3a52] bg-(--s-2a1726) p-2">
    <p><strong>⚔️ {d.atacante.nome}</strong> → <strong>{d.alvo.nome}</strong> <span className="text-xs text-(--a-d6c8e8)">com {d.arma} · {d.distancia} m</span></p>
    {d.assimilacao && rolagem && <RolagemAssim expressao={rolagem.expressao} resultados={rolagem.resultados} manter={d.assimilacao.manter} compacto />}
    <p className="mt-1 text-xs text-(--a-e4d3ff)">{d.acerto ? '✅ Acertou' : '❌ Errou'}{d.comparar === 'maior_igual' ? ` (Defesa ${d.defesa})` : ''}
      {d.dano && <> · dano <span className="font-mono">{d.dano.expressao}</span>{!d.assimilacao && <> [{d.dano.resultados.join(', ')}]</>} = <strong className="text-base text-(--a-ed9cd8)">{d.dano.total}</strong>{d.assimilacao && <span className="text-(--a-c4b6d4)"> (1 por símbolo)</span>}</>}</p>
    {d.assimilacao && d.dano && /d(6|10|12)\b/.test(d.dano.expressao) && <RolagemAssim expressao={d.dano.expressao} resultados={d.dano.resultados} todos compacto />}
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">{selo}
      {admin && d.status === 'pendente' && d.dano && <>
        <button type="button" disabled={ocupado} onClick={() => void decidir(1)} className="rounded-md bg-[#b91c1c] px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50">Aplicar {d.dano.total}</button>
        <button type="button" disabled={ocupado} onClick={() => void decidir(0.5)} className="rounded-md bg-[#7c2d12] px-2 py-1 text-[11px] text-white disabled:opacity-50">Metade ({Math.floor(d.dano.total / 2)})</button>
        <button type="button" disabled={ocupado} onClick={() => void decidir(0)} className="rounded-md border border-(--a-62527e) px-2 py-1 text-[11px] disabled:opacity-50">Anular</button></>}
    </div>
  </div>
}

/** Regras de combate da campanha (no painel do mestre). */
export function ConfigCombate({ acerto, morte = 'testes', acao }: { acerto: 'automatico' | 'mestre'; morte?: 'desligado' | 'testes' | 'desesperadas'; acao: Acao }) {
  return <section className="rounded-xl border border-[#5e3a52] bg-(--s-1e1a30) p-3">
    <h3 className="font-semibold">⚔️ Regras de combate</h3>
    <p className="mt-1 text-xs text-(--a-b4aeca)">Quando um ataque acerta, o dano…</p>
    <div className="mt-2 grid gap-2">
      {([['mestre', '🎩 Espera o mestre confirmar', 'Você vê o dano no chat e escolhe: aplicar, metade ou anular (bom para resistências e regras especiais).'],
        ['automatico', '⚡ Sai automaticamente', 'O dano já sai da vida do alvo na hora. Mais rápido para combates grandes.']] as const).map(([id, nome, txt]) =>
        <label key={id} className={'flex cursor-pointer gap-2 rounded-lg border p-2 text-sm ' + (acerto === id ? 'border-(--a-b99bff) bg-(--s-2b2140)' : 'border-(--a-3d3152)')}>
          <input type="radio" name="acerto" checked={acerto === id} onChange={() => void acao({ acao: 'combate_config', acerto: id }).catch(() => {})} className="mt-1 accent-(--a-b99bff)" />
          <span><strong>{nome}</strong><span className="block text-xs text-(--a-c4b6d4)">{txt}</span></span></label>)}
    </div>
    <p className="mt-3 text-xs text-(--a-b4aeca)">Quando a vida chega a 0…</p>
    <div className="mt-2 grid gap-2">
      {([['testes', '💀 Testes contra a morte', 'Cai e rola um d20 no começo de cada turno: 10+ sucesso, 9− falha, 1 = duas falhas, 20 = levanta. 3 sucessos estabiliza; 3 falhas, morre. Dano caído = falha.'],
        ['desesperadas', '⚠️ Testes + Medidas desesperadas', 'Igual, e o jogador pode aceitar falhas futuras para agir além do normal (1 falha: fugir, correr ou +5 num d20; 3 falhas: ataque extra ou recuperar uma magia). As falhas entram quando ele cair.'],
        ['desligado', '🚫 Desligado', 'Vida 0 não faz nada sozinho: o mestre decide.']] as const).map(([id, nome, txt]) =>
        <label key={id} className={'flex cursor-pointer gap-2 rounded-lg border p-2 text-sm ' + (morte === id ? 'border-(--a-b99bff) bg-(--s-2b2140)' : 'border-(--a-3d3152)')}>
          <input type="radio" name="morte" checked={morte === id} onChange={() => void acao({ acao: 'combate_config', morte: id }).catch(() => {})} className="mt-1 accent-(--a-b99bff)" />
          <span><strong>{nome}</strong><span className="block text-xs text-(--a-c4b6d4)">{txt}</span></span></label>)}
    </div>
  </section>
}

/** Mestre: descanso curto ou longo para o grupo todo (fichas aprovadas; NPCs se marcar). */
export function DescansoGrupo({ acao, carregar }: { acao: Acao; carregar?: () => void }) {
  const [npcs, setNpcs] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  async function dar(tipo: 'curto' | 'longo') {
    if (!confirm(tipo === 'longo' ? 'Dar um descanso longo para o grupo? Vida e recursos voltam ao máximo e os usos de poderes voltam.' : 'Dar um descanso curto para o grupo? Voltam os usos dos poderes de descanso curto.')) return
    setOcupado(true)
    try { const r = await acao({ acao: 'descanso', tipo, npcs }); toast.success(tipo === 'longo' ? '🌙 Descanso longo dado' : '☕ Descanso curto dado', { description: `${r.recuperaram ?? 0} de ${r.fichas ?? 0} personagens recuperaram algo. O chat mostra os detalhes.` }); carregar?.() }
    catch { /* o erro já aparece pela acao */ } finally { setOcupado(false) }
  }
  return <section className="rounded-xl border border-[#d4a23a]/50 bg-(--s-1e1a30) p-3">
    <h3 className="font-semibold">🌙 Descanso do grupo</h3>
    <p className="mt-1 text-xs text-(--a-b4aeca)">Recupera as fichas de todos de uma vez. No curto, cada jogador pode curar a vida pela própria ficha (🌙 Descansar).</p>
    <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={npcs} onChange={e => setNpcs(e.target.checked)} className="accent-(--a-b99bff)" /> Incluir os NPCs</label>
    <div className="mt-2 grid grid-cols-2 gap-2">
      <button type="button" disabled={ocupado} onClick={() => void dar('curto')} className={btn + ' justify-center py-2 text-sm'}>☕ Curto</button>
      <button type="button" disabled={ocupado} onClick={() => void dar('longo')} className="rounded-lg bg-gradient-to-r from-(--a-7652ac) to-[#b45309] py-2 text-sm font-semibold disabled:opacity-50">🌙 Longo</button>
    </div>
  </section>
}

type TokenPrep = TokenBase & { imagem_url: string | null; cor: string; npc: boolean; visivel: boolean; hp_atual: number | null; hp_max: number | null }
/** Preparar combate: escolher quem luta, conferir o bônus de iniciativa e rolar para todos de uma vez. */
export function PrepararCombate({ tokens, fichas, acao, fechar }: { tokens: TokenPrep[]; fichas: FichaMesa[] | null; acao: Acao; fechar: () => void }) {
  const [sel, setSel] = useState<Record<string, boolean>>(() => Object.fromEntries(tokens.map(t => [t.id, t.visivel])))
  const [bonus, setBonus] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  const iniDaFicha = (t: TokenPrep) => { const fid = t.ficha_id ?? t.ficha_modelo; return fid ? fichas?.find(f => f.id === fid)?.combate?.iniciativa ?? null : null }
  const marcar = (fn: (t: TokenPrep) => boolean) => setSel(Object.fromEntries(tokens.map(t => [t.id, fn(t)])))
  const escolhidos = tokens.filter(t => sel[t.id])
  async function comecar() {
    setEnviando(true)
    try {
      const r = await acao({ acao: 'combate_preparar', tokens: escolhidos.map(t => ({ tokenId: t.id, ...(bonus[t.id]?.trim() ? { bonus: Number(bonus[t.id]) || 0 } : {}) })) })
      const ordem = (r.rolagens as { nome: string; valor: number }[] | undefined) ?? []
      toast.success('⚔️ Combate começou!', { description: ordem.map((o, i) => `${i + 1}. ${o.nome} (${o.valor})`).join(' · ') })
      fechar()
    } catch { /* aviso já aparece */ } finally { setEnviando(false) }
  }
  return <NaTela><div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4" role="dialog" aria-modal="true" aria-label="Preparar combate" onClick={fechar}>
    <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl border border-(--a-62527e) bg-(--s-19172c) p-4 text-sm text-(--a-f4f0ff)" onClick={x => x.stopPropagation()}>
      <div className="flex items-center gap-2"><Swords size={18} className="text-[#f2a9c3]" /><h2 className="flex-1 font-bold">Preparar combate</h2>
        <button type="button" onClick={fechar} aria-label="Fechar" className="rounded p-1 hover:bg-(--s-34294f)"><X size={18} /></button></div>
      <p className="mt-1 text-xs text-(--a-b4aeca)">Marque quem entra na luta. A iniciativa é rolada para todos de uma vez, com o bônus da ficha (ou o que você escrever).</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {([['Todos', () => true], ['Jogadores', (t: TokenPrep) => !t.npc && !!t.dono_id], ['NPCs', (t: TokenPrep) => t.npc || !t.dono_id], ['Ninguém', () => false]] as [string, (t: TokenPrep) => boolean][]).map(([n, fn]) =>
          <button key={n} type="button" onClick={() => marcar(fn)} className="rounded-full bg-(--s-1e1a30) px-3 py-1 text-xs text-(--a-c4b6d4) hover:bg-(--s-2b2140)">{n}</button>)}
      </div>
      <ul className="mt-3 min-h-0 flex-1 space-y-1.5 overflow-y-auto">{tokens.map(t => {
        const ini = iniDaFicha(t)
        return <li key={t.id} className={'flex items-center gap-2 rounded-xl border p-2 ' + (sel[t.id] ? 'border-(--a-8b6cba) bg-(--s-241c38)' : 'border-(--a-3d3152) bg-(--s-151123) opacity-70')}>
          <input type="checkbox" checked={!!sel[t.id]} onChange={x => setSel(s => ({ ...s, [t.id]: x.target.checked }))} aria-label={'Incluir ' + t.nome} className="h-4 w-4 accent-(--a-b99bff)" />
          <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/40 bg-cover bg-center text-xs font-bold text-(--a-0b0a14)"
            style={{ backgroundColor: t.cor, backgroundImage: t.imagem_url ? `url("${t.imagem_url}")` : undefined }}>{t.imagem_url ? '' : t.nome[0]?.toUpperCase()}</span>
          <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{t.nome}</span>
            <span className="text-[11px] text-(--a-a99bbb)">{t.npc || !t.dono_id ? '👹 NPC' : '🛡️ Jogador'}{t.hp_max ? ` · ❤️ ${t.hp_atual ?? 0}/${t.hp_max}` : ''}{!t.visivel ? ' · 🙈 escondido' : ''}</span></span>
          <label className="text-[11px] text-(--a-c4b6d4)">Bônus<input value={bonus[t.id] ?? ''} onChange={x => setBonus(b => ({ ...b, [t.id]: x.target.value }))} inputMode="numeric"
            placeholder={ini !== null ? (ini >= 0 ? '+' + ini : String(ini)) : '+0'} aria-label={'Bônus de iniciativa de ' + t.nome} className={input + ' mt-0.5 !w-16 !p-1.5 text-center'} /></label>
        </li>
      })}</ul>
      {tokens.length === 0 && <p className="mt-3 text-center text-(--a-b4aeca)">Não há tokens nesta cena. Coloque as fichas na mesa pela aba “Jogo → Fichas”.</p>}
      <button type="button" disabled={!escolhidos.length || enviando} onClick={() => void comecar()}
        className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#b91c1c] to-(--a-7c3aed) p-3 font-bold shadow-[0_0_18px_#b91c1c55] disabled:opacity-40 disabled:shadow-none">
        {enviando ? 'Rolando…' : `🎲 Rolar iniciativa e começar (${escolhidos.length})`}</button>
    </div>
  </div></NaTela>
}

export type Morte = { estado?: 'caido' | 'estavel' | 'morto'; sucessos?: number; falhas?: number; futuras?: number }
/** Bolinhas de sucesso/falha (3 + 3). */
export function Bolinhas({ m, pequeno = false }: { m: Morte; pequeno?: boolean }) {
  const t = pequeno ? 'h-1.5 w-1.5' : 'h-5 w-5'
  return <span className={'inline-flex items-center ' + (pequeno ? 'gap-px' : 'gap-1.5')}>
    {[0, 1, 2].map(i => <span key={'s' + i} className={t + ' rounded-full border ' + (i < (m.sucessos ?? 0) ? 'border-emerald-200 bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'border-(--a-4a3d63) bg-black/60')} />)}
    <span className={pequeno ? 'w-0.5' : 'w-2'} />
    {[0, 1, 2].map(i => <span key={'f' + i} className={t + ' rounded-full border ' + (i < (m.falhas ?? 0) ? 'border-red-200 bg-red-600 shadow-[0_0_6px_#dc2626]' : 'border-(--a-4a3d63) bg-black/60')} />)}
  </span>
}

/** “À beira da morte” na janela do token. */
export function PainelMorte({ nome, m, regra, admin, pode, vida, acao, tokenId }: { nome: string; m: Morte; regra: 'desligado' | 'testes' | 'desesperadas'; admin: boolean; pode: boolean; vida: number | null; acao: Acao; tokenId: string }) {
  if (regra === 'desligado') return null
  const op = (o: Record<string, unknown>) => void acao({ acao: 'morte', tokenId, ...o }).catch(e => toast.error(msg(e)))
  const btn = 'rounded-lg border border-(--a-62527e) px-2 py-1 text-xs hover:bg-(--s-34294f)'
  if (m.estado) return <div className={'mt-3 rounded-xl border p-3 ' + (m.estado === 'morto' ? 'border-zinc-500 bg-zinc-900/80' : m.estado === 'estavel' ? 'border-emerald-700 bg-emerald-950/40' : 'border-red-800 bg-red-950/40')}>
    <p className="text-sm font-bold">{m.estado === 'morto' ? `⚰️ ${nome} morreu` : m.estado === 'estavel' ? `🩹 ${nome} está estável` : `💀 ${nome} está à beira da morte`}</p>
    <div className="mt-2 flex items-center gap-3 text-xs"><span>✅ Sucessos · ❌ Falhas</span><Bolinhas m={m} /></div>
    {m.estado === 'caido' && <p className="mt-1 text-[11px] text-(--a-d6c8e8)">Rola sozinho no começo do turno. 10+ sucesso · 1 = duas falhas · 20 = levanta com 1 de vida. Dano agora conta falha.</p>}
    {m.estado === 'estavel' && <p className="mt-1 text-[11px] text-(--a-d6c8e8)">Inconsciente, mas fora de perigo. Qualquer cura levanta; dano volta a cair.</p>}
    <div className="mt-2 flex flex-wrap gap-1.5">
      {m.estado === 'caido' && pode && <button type="button" className={btn + ' border-red-400/60 bg-red-900/40 font-semibold'} onClick={() => op({ op: 'rolar' })}>🎲 Rolar teste agora</button>}
      {admin && <><button type="button" className={btn} onClick={() => op({ op: 'sucesso' })}>+ ✅</button><button type="button" className={btn} onClick={() => op({ op: 'falha' })}>+ ❌</button>
        {m.estado !== 'estavel' && m.estado !== 'morto' && <button type="button" className={btn} onClick={() => op({ op: 'estabilizar' })}>🩹 Estabilizar</button>}
        <button type="button" className={btn} onClick={() => op({ op: 'zerar' })}>Zerar</button></>}
    </div>
  </div>
  return <div className="mt-3 rounded-xl border border-(--a-3d3152) bg-(--s-1e1a30) p-3 text-xs">
    <p className="font-semibold">💀 À beira da morte</p>
    <p className="mt-1 text-(--a-c4b6d4)">Se a vida chegar a 0, {nome} cai e faz testes contra a morte.{admin && vida !== null && vida > 0 ? '' : ''}</p>
    {regra === 'desesperadas' && <>
      <p className="mt-2 font-semibold text-amber-200">⚠️ Medidas desesperadas{m.futuras ? ` · ${m.futuras}/3 falhas guardadas` : ''}</p>
      {pode ? <div className="mt-1 grid gap-1.5">
        <button type="button" disabled={(m.futuras ?? 0) + 1 > 3} onClick={() => { if (confirm('Aceitar 1 falha futura?')) op({ op: 'medida', n: 1 }) }} className={btn + ' text-left disabled:opacity-40'}>1 falha futura: fugir sem provocar ataques, correr o dobro ou +5 num d20</button>
        <button type="button" disabled={(m.futuras ?? 0) + 3 > 3} onClick={() => { if (confirm('Aceitar 3 falhas futuras? Se cair, morre na hora.')) op({ op: 'medida', n: 3 }) }} className={btn + ' text-left disabled:opacity-40'}>3 falhas futuras: ataque extra ou recuperar uma magia/poder</button>
      </div> : <p className="mt-1 text-(--a-a998bd)">Só o dono do token escolhe.</p>}
      <p className="mt-1 text-[11px] text-(--a-a998bd)">As falhas aceitas entram na conta assim que ele cair. 3 guardadas = morre ao cair.</p>
    </>}
    {admin && <button type="button" className={btn + ' mt-2'} onClick={() => op({ op: 'cair' })}>Marcar como caído</button>}
  </div>
}
