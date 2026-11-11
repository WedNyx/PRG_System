'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { relatarErro } from '@/lib/relatarErro'

/** Tela amigável quando uma página quebra; o erro vai para “Saúde da plataforma”. */
export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { relatarErro(error.message || 'Erro na página', (error.digest ? `digest ${error.digest}\n` : '') + (error.stack ?? '')) }, [error])
  return <main className="fundo-tema flex min-h-screen items-center justify-center px-4 text-(--a-f2ebff)">
    <div className="w-full max-w-md rounded-2xl border border-(--a-62527e) bg-(--s-1b1529)/95 p-6 text-center shadow-2xl">
      <p className="text-4xl" aria-hidden="true">🎲💥</p>
      <h1 className="mt-3 text-xl font-bold">Algo deu errado nesta tela</h1>
      <p className="mt-2 text-sm text-(--a-c9bcd9)">O erro já foi registrado para o administrador. Tente de novo ou volte ao portal.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={reset} className="rounded-lg bg-(--a-5b4380) px-4 py-2 font-semibold hover:bg-(--a-6b5190)">Tentar de novo</button>
        <Link href="/portal" className="rounded-lg border border-(--a-8b6cba) px-4 py-2 hover:bg-(--s-2b2140)">Voltar ao portal</Link>
      </div>
    </div>
  </main>
}
