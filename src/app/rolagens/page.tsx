'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { api, ErroNuvem } from '@/lib/nuvem/cliente'
import HistoricoRolagens from '@/components/mesa/HistoricoRolagens'

type Campanha = { campanha: { id: string; nome: string }; membros: { aventureiro_id: string; aventureiro: { apelido: string } | null }[] }

/** Histórico de rolagens de uma campanha em tela cheia (também com a sessão fechada). */
function Conteudo() {
  const cid = useSearchParams().get('campanha') ?? ''
  const [c, setC] = useState<Campanha | null>(null)
  const [erro, setErro] = useState('')
  useEffect(() => {
    let vivo = true
    api<Campanha>('campanhas/' + encodeURIComponent(cid)).then(r => { if (vivo) setC(r) }).catch(e => { if (vivo) setErro(e instanceof ErroNuvem ? e.message : 'Falha de conexão.') })
    return () => { vivo = false }
  }, [cid])
  return <main className="flex min-h-screen flex-col fundo-tema px-4 py-5 text-[#f2ebff]">
    <div className="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-3"><Link href="/central?secao=historico" className="text-sm text-[#b99bff] hover:underline">← Voltar</Link>
        {c && <Link href={'/mesa?campanha=' + cid} className="ml-auto text-sm text-[#b99bff] hover:underline">Ir para a mesa →</Link>}</div>
      <h1 className="mt-3 text-2xl font-bold">🎲 Rolagens{c ? ' — ' + c.campanha.nome : ''}</h1>
      {erro && <p role="alert" className="mt-4 text-red-200">{erro}</p>}
      {!c && !erro && <p className="mt-4 text-[#b4aeca]">Carregando…</p>}
      {c && <div className="mt-4 flex min-h-[70vh] flex-1 flex-col rounded-2xl border border-[#55456e] bg-[#19172c]/95 p-4"><HistoricoRolagens campanhaId={cid} membros={c.membros} /></div>}
    </div>
  </main>
}
export default function RolagensPage() { return <Suspense fallback={<p className="p-6 text-violet-200">Carregando…</p>}><Conteudo /></Suspense> }
