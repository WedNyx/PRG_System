'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { History } from 'lucide-react'
import { api, ErroNuvem } from '@/lib/nuvem/cliente'
import { CAMPOS } from '@/lib/campanhas/permissoes'

type Item = { id: number; tipo: string; categoria: string | null; descricao: string; criado_em: string; autor: { apelido: string } | null
  antes: { campo: string; valor: string }[] | null; depois: { campo: string; valor: string }[] | null }
const AREA: Record<string, string> = Object.fromEntries(CAMPOS.map(c => [c.id, c.titulo]))
const TIPO: Record<string, string> = { edicao: '✏️ Edição', pedido: '📨 Pedido', decisao: '⚖️ Decisão', envio: '📤 Envio', aprovacao: '✅ Avaliação', bloqueio: '🔒 Trava', npc: '🎭 NPC', administracao: '🛠️ Administração', recompensa: '🎁 Recompensa' }

function Conteudo() {
  const id = useSearchParams().get('ficha') ?? ''
  const [dados, setDados] = useState<{ ficha: { nome: string }; historico: Item[] } | null>(null)
  const [erro, setErro] = useState('')
  useEffect(() => { api<{ ficha: { nome: string }; historico: Item[] }>(`fichas/${encodeURIComponent(id)}/historico`).then(setDados).catch(e => setErro(e instanceof ErroNuvem ? e.message : 'Falha de conexão.')) }, [id])
  return <main className="min-h-screen fundo-tema px-4 py-6 text-(--a-f2ebff)">
    <div className="mx-auto max-w-3xl">
      <Link href="/central" className="text-sm text-(--a-b99bff) hover:underline">← Início</Link>
      <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold"><History /> Histórico{dados ? ' — ' + (dados.ficha.nome || 'sem nome') : ''}</h1>
      {erro && <p role="alert" className="mt-4 text-red-200">{erro}</p>}
      {!dados && !erro && <p className="mt-4 text-(--a-b4aeca)">Carregando...</p>}
      <ol className="mt-5 space-y-3">{dados?.historico.map(h => <li key={h.id} className="rounded-xl border border-(--a-55456e) bg-(--s-201a32) p-4 text-sm">
        <p className="text-xs text-(--a-b5a5c8)">{new Date(h.criado_em).toLocaleString('pt-BR')} · {h.autor?.apelido ?? '—'} · {TIPO[h.tipo] ?? h.tipo}{h.categoria ? ' · ' + (AREA[h.categoria] ?? h.categoria) : ''}</p>
        {h.descricao && <p className="mt-1">{h.descricao}</p>}
        {h.depois && <ul className="mt-2 space-y-1 text-xs">{h.depois.map((d, i) => <li key={d.campo + i} className="break-words"><span className="text-(--a-b5a5c8)">{d.campo}:</span> <span className="line-through opacity-70">{h.antes?.[i]?.valor ?? '—'}</span> → <strong>{d.valor}</strong></li>)}</ul>}
      </li>)}</ol>
      {dados?.historico.length === 0 && <p className="mt-4 text-(--a-c4b6d4)">Nada registrado ainda. O histórico registra fichas de campanha.</p>}
    </div>
  </main>
}
export default function HistoricoPage() { return <Suspense fallback={null}><Conteudo /></Suspense> }
