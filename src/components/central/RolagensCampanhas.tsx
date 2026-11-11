'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { api } from '@/lib/nuvem/cliente'

/** Central → Histórico: as campanhas da pessoa, cada uma com o histórico de rolagens. */
export default function RolagensCampanhas() {
  const [lista, setLista] = useState<{ id: string; nome: string; meuPapel: string; estado: string }[] | null>(null)
  useEffect(() => {
    let vivo = true
    api<{ campanhas: { id: string; nome: string; meuPapel: string; estado: string }[] }>('campanhas').then(r => { if (vivo) setLista(r.campanhas) }).catch(() => { if (vivo) setLista([]) })
    return () => { vivo = false }
  }, [])
  if (lista === null) return <p className="mt-6 text-(--a-b4aeca)">Carregando…</p>
  if (!lista.length) return <p className="mt-6 rounded-2xl border border-(--a-55456e) bg-(--s-201a32) p-6 text-sm text-(--a-c4b6d4)">Você ainda não está em nenhuma campanha. As rolagens feitas na mesa e nas fichas de campanha aparecem aqui.</p>
  return <ul className="mt-6 grid gap-3 sm:grid-cols-2">{lista.map(c => <li key={c.id}>
    <Link href={'/rolagens?campanha=' + c.id} className="flex items-center gap-3 rounded-2xl border border-(--a-55456e) bg-(--s-201a32)/90 p-4 transition hover:border-(--a-b79aff) hover:bg-(--s-2b2143)">
      <span className="text-2xl" aria-hidden>🎲</span>
      <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{c.nome}</span>
        <span className="text-xs text-(--a-b4aeca)">{c.meuPapel === 'mestre' ? '👑 Mestre' : c.meuPapel === 'comestre' ? '🎩 Co-mestre' : c.meuPapel === 'espectador' ? '👁️ Espectador' : '⚔️ Jogador'}{c.estado === 'encerrada' ? ' · encerrada' : ''}</span></span>
      <ChevronRight size={18} className="text-(--a-b69ad4)" />
    </Link></li>)}</ul>
}
