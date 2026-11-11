import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { VERSOES } from '@/lib/versoes'
import pacote from '../../../package.json'

export const metadata = { title: 'Novidades · PRG System' }

export default function NovidadesPage() {
  return <main className="min-h-screen fundo-tema px-4 py-8 text-(--a-f2ebff)">
    <div className="mx-auto max-w-2xl">
      <Link href="/central" className="text-sm text-(--a-b99bff) hover:underline">← Início</Link>
      <h1 className="mt-3 flex items-center gap-2 text-3xl font-bold"><Sparkles className="text-(--a-c5a7ff)" /> Novidades</h1>
      <p className="mt-1 text-sm text-(--a-bfb2cf)">Versão atual: <strong>v{pacote.version}</strong></p>
      <ol className="mt-6 space-y-4">{VERSOES.map((v, i) => <li key={v.versao} className={'rounded-2xl border p-5 ' + (i === 0 ? 'border-(--a-b79aff) bg-(--s-2b2140)' : 'border-(--a-55456e) bg-(--s-201a32)')}>
        <p className="text-xs text-(--a-b5a5c8)">v{v.versao} · {new Date(v.data + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
        <h2 className="mt-1 text-lg font-semibold">{v.titulo}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-(--a-d1c4df)">{v.itens.map(t => <li key={t}>{t}</li>)}</ul>
      </li>)}</ol>
    </div>
  </main>
}
