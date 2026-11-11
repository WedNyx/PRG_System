'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { api } from '@/lib/nuvem/cliente'
import { ImagemCapa } from '@/components/sistemas/CapaDoSistema'
import { sistemaPorId } from '@/lib/sistemas/catalogo'
import { linkFicha } from './PainelFichasCampanha'

type Ficha = { id: string; nome: string; sistema: string; retrato?: string | null; atualizada_em: string; campanha: { nome: string } | null }
type Campanha = { id: string; nome: string; sistema: string; meuPapel: string; estado: string; sessao_aberta?: boolean; capa_url?: string | null; pendencias?: number }

/** “Continuar”: as fichas abertas por último e as campanhas, com o botão certo para cada uma. */
export default function ContinuarJornada({ aventureiroId }: { aventureiroId: string }) {
  const [fichas, setFichas] = useState<Ficha[] | null>(null)
  const [camps, setCamps] = useState<Campanha[] | null>(null)
  useEffect(() => {
    let vivo = true
    api<{ fichas: Ficha[] }>('fichas', { aventureiro: aventureiroId }).then(r => { if (vivo) setFichas([...r.fichas].sort((a, b) => b.atualizada_em.localeCompare(a.atualizada_em)).slice(0, 3)) }).catch(() => { if (vivo) setFichas([]) })
    api<{ campanhas: Campanha[] }>('campanhas', { aventureiro: aventureiroId }).then(r => { if (vivo) setCamps(r.campanhas.filter(c => c.estado !== 'encerrada').slice(0, 3)) }).catch(() => { if (vivo) setCamps([]) })
    return () => { vivo = false }
  }, [aventureiroId])
  if (!fichas?.length && !camps?.length) return null
  const papel = (p: string) => p === 'mestre' ? '👑 Mestre' : p === 'comestre' ? '🎩 Co-mestre' : p === 'espectador' ? '👁️ Espectador' : '⚔️ Jogador'
  return <section className="mt-6" aria-label="Continuar">
    <h2 className="mb-3 text-lg font-bold">↩️ Continuar de onde parou</h2>
    <div className="grid gap-3 md:grid-cols-2">
      {!!camps?.length && <div className="space-y-2">{camps.map(c => <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-(--a-55456e) bg-(--s-201a32)/90 p-2.5">
        <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-(--a-55456e)">{c.capa_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={c.capa_url} alt="" className="h-full w-full object-cover" /> : <ImagemCapa id={c.sistema} nome={c.nome} />}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{c.nome}</p>
          <p className="truncate text-xs text-(--a-b4aeca)">{papel(c.meuPapel)} · {sistemaPorId(c.sistema)?.nome ?? 'Sistema'}{c.sessao_aberta ? ' · 🟢 sessão aberta' : ''}{c.pendencias ? ` · 🔔 ${c.pendencias}` : ''}</p>
        </div>
        <Link href={'/mesa?campanha=' + c.id} className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-(--a-7652ac) px-3 py-2 text-xs font-semibold hover:bg-(--a-8b68c4)">🗺️ Mesa</Link>
      </div>)}</div>}
      {!!fichas?.length && <div className="space-y-2">{fichas.map(f => <Link key={f.id} href={linkFicha(f)} className="flex items-center gap-3 rounded-2xl border border-(--a-55456e) bg-(--s-201a32)/90 p-2.5 transition hover:border-(--a-b79aff) hover:bg-(--s-2b2143)">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-(--a-55456e) bg-(--s-2a2142) text-xl font-bold text-(--a-c5a7ff)">{f.retrato
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={f.retrato} alt="" className="h-full w-full object-cover" /> : (f.nome || '?')[0].toUpperCase()}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{f.nome || 'Personagem sem nome'}</p>
          <p className="truncate text-xs text-(--a-b4aeca)">📜 {sistemaPorId(f.sistema)?.nome ?? 'Ficha'}{f.campanha ? ' · 🏰 ' + f.campanha.nome : ''}</p>
        </div>
        <ChevronRight size={18} className="shrink-0 text-(--a-b69ad4)" />
      </Link>)}</div>}
    </div>
  </section>
}
