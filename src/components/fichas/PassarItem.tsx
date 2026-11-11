'use client'

import { useEffect, useState } from 'react'
import { Gift, Minus, Plus, X } from 'lucide-react'
import ArteItem from './ArteItem'
import { api, ErroNuvem } from '@/lib/nuvem/cliente'
import type { Item } from '@/lib/sistemas/inventario'

type Destino = { id: string; nome: string; npc: boolean; jogador: string | null; meu: boolean }
export type ResultadoPassar = { item: string; qtd: number; para: string; de: { versao: number; dados: Record<string, unknown> } }

/** Janela “Passar item”: escolhe o personagem da mesma campanha e a quantidade. */
export default function PassarItem({ campanhaId, fichaId, item, tem, fechar, feito }: {
  campanhaId: string; fichaId: string; item: Item; tem: number; fechar: () => void; feito: (r: ResultadoPassar) => void
}) {
  const [destinos, setDestinos] = useState<Destino[] | null>(null)
  const [para, setPara] = useState('')
  const [qtd, setQtd] = useState(1)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  useEffect(() => {
    let vivo = true
    api<{ destinos: Destino[] }>(`campanhas/${campanhaId}/itens`)
      .then(r => { if (vivo) setDestinos(r.destinos.filter(x => x.id !== fichaId)) })
      .catch(e => { if (vivo) { setErro(e instanceof ErroNuvem ? e.message : 'Falha de conexão.'); setDestinos([]) } })
    return () => { vivo = false }
  }, [campanhaId, fichaId])

  async function passar() {
    const alvo = destinos?.find(x => x.id === para); if (!alvo) return
    setOcupado(true); setErro('')
    try {
      const r = await api<Omit<ResultadoPassar, 'para'>>(`campanhas/${campanhaId}/itens`, { method: 'POST', body: { de: fichaId, para, item: item.id, qtd } })
      feito({ ...r, para: alvo.nome })
    } catch (e) { setErro(e instanceof ErroNuvem ? e.message : 'Falha de conexão.') } finally { setOcupado(false) }
  }

  return <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-3 sm:items-center" onMouseDown={e => { if (e.target === e.currentTarget) fechar() }}>
    <div role="dialog" aria-modal="true" aria-labelledby="passar-titulo" onKeyDown={e => { if (e.key === 'Escape') fechar() }}
      className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-(--a-8b6cba) bg-(--s-19152a) p-5 text-(--a-f2ebff) shadow-2xl">
      <div className="flex items-center gap-3">
        <ArteItem item={item} tamanho={48} />
        <div className="min-w-0 flex-1"><h2 id="passar-titulo" className="flex items-center gap-1.5 text-lg font-bold"><Gift size={18} /> Passar item</h2>
          <p className="truncate text-sm text-(--a-c4b6d4)">{item.nome}{tem > 1 ? ` · você tem ${tem}` : ''}</p></div>
        <button type="button" onClick={fechar} aria-label="Fechar" className="rounded-lg p-1 text-(--a-b4aeca) hover:bg-white/10"><X size={18} /></button>
      </div>

      <p className="mt-4 text-sm font-semibold">Para quem?</p>
      {destinos === null ? <p className="mt-2 text-sm text-(--a-b4aeca)">Carregando…</p>
        : destinos.length === 0 ? <p className="mt-2 text-sm text-(--a-b4aeca)">Ainda não há outros personagens aprovados nesta campanha.</p>
        : <ul className="mt-2 grid gap-1.5" role="radiogroup" aria-label="Personagem que recebe">{destinos.map(x =>
          <li key={x.id}><button type="button" role="radio" aria-checked={para === x.id} onClick={() => setPara(x.id)}
            className={'flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm ' + (para === x.id ? 'border-(--a-b99bff) bg-(--s-3a2c58)' : 'border-(--a-3d3152) bg-(--s-201a32) hover:bg-(--s-2b2140)')}>
            <span aria-hidden>{x.npc ? '🎭' : '🧙'}</span>
            <span className="min-w-0 flex-1 truncate font-medium">{x.nome}</span>
            <span className="shrink-0 text-xs text-(--a-b4aeca)">{x.npc ? 'NPC' : x.meu ? 'seu' : x.jogador}</span>
          </button></li>)}</ul>}

      {tem > 1 && <div className="mt-4 flex items-center gap-3">
        <span className="flex-1 text-sm font-semibold">Quantidade</span>
        <button type="button" aria-label="Diminuir quantidade" disabled={qtd <= 1} onClick={() => setQtd(q => q - 1)} className="rounded-lg border border-(--a-5e4b78) p-1.5 disabled:opacity-30"><Minus size={14} /></button>
        <strong className="w-8 text-center text-lg tabular-nums" aria-live="polite">{qtd}</strong>
        <button type="button" aria-label="Aumentar quantidade" disabled={qtd >= tem} onClick={() => setQtd(q => q + 1)} className="rounded-lg border border-(--a-5e4b78) p-1.5 disabled:opacity-30"><Plus size={14} /></button>
        <button type="button" onClick={() => setQtd(tem)} className="rounded-lg border border-(--a-5e4b78) px-2 py-1 text-xs">Todos</button>
      </div>}

      {erro && <p role="alert" className="mt-3 text-sm text-red-200">{erro}</p>}
      <button type="button" disabled={!para || ocupado} onClick={() => void passar()}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-(--a-7652ac) to-[#b45309] p-2.5 font-semibold disabled:opacity-40">
        <Gift size={16} /> {ocupado ? 'Passando…' : para ? `Passar ${qtd > 1 ? qtd + '× ' : ''}para ${destinos?.find(x => x.id === para)?.nome}` : 'Escolha quem recebe'}</button>
      <p className="mt-2 text-center text-[11px] text-(--a-8f88a8)">O item sai da sua ficha e entra na outra na hora. O chat da mesa avisa.</p>
    </div>
  </div>
}
