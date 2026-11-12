'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import FerramentasDnd from '@/components/mestre/FerramentasDnd'

function Conteudo() {
  const cid = useSearchParams().get('campanha') ?? ''
  return <FerramentasDnd campanhaInicial={/^[0-9a-f-]{36}$/.test(cid) ? cid : ''} />
}
/** Ferramentas do mestre de D&D 2024 (v0.33.6). */
export default function FerramentasDndPage() { return <Suspense fallback={<p className="p-6 text-violet-200">Carregando…</p>}><Conteudo /></Suspense> }
