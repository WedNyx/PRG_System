'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import MesaNova from '@/components/mesa/MesaNova'
import { NUVEM_ATIVA } from '@/lib/nuvem/cliente'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function Conteudo() {
  const id = useSearchParams().get('campanha') ?? ''
  if (!NUVEM_ATIVA || !UUID.test(id)) return <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-(--s-0d0c19) p-6 text-center text-(--a-d6c8e8)">
    <p>{NUVEM_ATIVA ? 'Campanha não encontrada.' : 'A mesa virtual precisa da sincronização na nuvem ligada.'}</p>
    <Link href="/central" className="underline">Voltar ao início</Link></main>
  return <MesaNova campanhaId={id} />
}
export default function MesaPage() { return <Suspense fallback={null}><Conteudo /></Suspense> }
