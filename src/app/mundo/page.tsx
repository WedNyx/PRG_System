'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import MundoCampanha from '@/components/mundo/MundoCampanha'
import { NUVEM_ATIVA } from '@/lib/nuvem/cliente'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function Conteudo() {
  const id = useSearchParams().get('campanha') ?? ''
  if (!NUVEM_ATIVA || !UUID.test(id)) return <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-(--s-0d0c19) p-6 text-center text-(--a-d6c8e8)">
    <p>Campanha não encontrada.</p><Link href="/central" className="underline">Voltar ao início</Link></main>
  return <MundoCampanha campanhaId={id} />
}
export default function MundoPage() { return <Suspense fallback={null}><Conteudo /></Suspense> }
