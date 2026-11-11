import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CircleHelp } from 'lucide-react'
import { GUIA } from '@/lib/guia'
import { VERSOES } from '@/lib/versoes'

export const metadata: Metadata = { title: 'Guia da plataforma · PRG System', description: 'Tudo o que o PRG System tem e como usar cada parte.' }

/** Tópicos do guia que têm lição prática no /tutorial. */
const PRATICA: Record<string, string> = { rolagens: 'dados', arvore: 'arvore', construtor: 'rolagem', fichas: 'imagens', campanhas: 'imagens', mesa: 'mesa', sessao: 'mesa', combate: 'mesa' }
const ABRIR: Record<string, { href: string; rotulo: string }> = { 'primeiro-sistema': { href: '/sistemas/criar', rotulo: '✍️ Abrir o construtor' } }

const SELO = { mestre: '🎩 Para o mestre', admin: '🔒 Administrador', todos: '' } as const

export default function GuiaPlataforma() {
  return <main className="fundo-tema min-h-screen px-4 py-6 text-(--a-f2ebff) sm:py-10">
    <div className="mx-auto max-w-3xl">
      <Link href="/central" className="inline-flex items-center gap-1 text-sm text-(--a-c7a8ff) hover:underline"><ArrowLeft size={16} /> Voltar à Central</Link>
      <header className="mt-4 rounded-3xl border border-(--a-655079) bg-(--s-1d1733)/90 p-6 shadow-xl sm:p-8">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.22em] text-(--a-ed9cd8)"><CircleHelp size={16} /> Guia da plataforma</p>
        <h1 className="mt-3 text-2xl font-bold sm:text-4xl">Como usar o PRG System</h1>
        <p className="mt-3 text-sm leading-relaxed text-(--a-cfc0df)">Tudo o que a plataforma tem, com fotos de cada parte. Versão {VERSOES[0].versao}.</p>
        <Link href="/tutorial" className="mt-5 flex items-center gap-4 rounded-2xl border border-(--a-b99bff)/60 bg-gradient-to-r from-(--s-3b2470) to-(--s-5b2a6e) p-4 shadow-[0_0_24px_#7654bb55] transition hover:brightness-110">
          <span className="text-4xl" aria-hidden="true">🎓</span>
          <span className="min-w-0 flex-1"><span className="block font-bold">Tutoriais práticos: aprenda fazendo</span>
            <span className="block text-sm text-(--a-e4d3ff)">Missões curtas num campo de treino: dados, árvore de habilidades, rolagem personalizada, imagens e mesa.</span></span>
          <span className="shrink-0 text-xl text-(--a-e4d3ff)">→</span>
        </Link>
        <nav aria-label="Tópicos do guia" className="mt-5 grid gap-2 sm:grid-cols-2">
          {GUIA.map(t => <a key={t.id} href={'#' + t.id} className="flex items-center gap-2 rounded-xl bg-(--s-2a2142) px-3 py-2 text-sm hover:bg-(--s-3a2c58)"><span aria-hidden="true">{t.icone}</span>{t.titulo}</a>)}
        </nav>
      </header>

      <div className="mt-6 space-y-6">
        {GUIA.map((t, i) => <section key={t.id} id={t.id} className="scroll-mt-4 rounded-3xl border border-(--a-55456e) bg-(--s-1d1733)/92 p-5 shadow-lg sm:p-7">
          <p className="text-xs text-(--a-a99bbb)">{i + 1} de {GUIA.length}{t.quem && t.quem !== 'todos' ? ' · ' + SELO[t.quem] : ''}</p>
          <h2 className="mt-1 text-xl font-bold sm:text-2xl"><span aria-hidden="true">{t.icone}</span> {t.titulo}</h2>
          <p className="mt-2 text-sm text-(--a-d6c9e4)">{t.resumo}</p>
          {t.foto && <figure className="mt-4">
            <a href={'/guia/' + t.foto} target="_blank" rel="noopener" title="Abrir a foto em tamanho grande">
              <img src={'/guia/' + t.foto} alt={t.legenda ?? t.titulo} loading="lazy" className="mx-auto max-h-[560px] w-auto max-w-full rounded-2xl border border-(--a-62527e) shadow-xl" />
            </a>
            {t.legenda && <figcaption className="mt-2 text-center text-xs text-(--a-a99bbb)">{t.legenda} · toque para ampliar</figcaption>}
          </figure>}
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-(--a-e6dbf2)">{t.passos.map(p => <li key={p}>{p}</li>)}</ol>
          {t.dica && <p className="mt-4 rounded-xl border border-(--a-6d5690) bg-(--s-2a2142) p-3 text-sm text-(--a-e4d3ff)">💡 {t.dica}</p>}
          {ABRIR[t.id] && <Link href={ABRIR[t.id].href} className="mr-2 mt-4 inline-flex items-center gap-2 rounded-xl bg-(--a-5b4380) px-4 py-2 text-sm font-semibold hover:bg-(--a-6b5190)">{ABRIR[t.id].rotulo}</Link>}
          {PRATICA[t.id] && <Link href={'/tutorial?licao=' + PRATICA[t.id]} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-(--a-5b4380) px-4 py-2 text-sm font-semibold hover:bg-(--a-6b5190)">🎓 Praticar no tutorial</Link>}
          <a href="#topo" className="sr-only">Voltar ao topo</a>
        </section>)}
      </div>
      <p className="mt-8 text-center text-xs text-(--a-a99bbb)">Ficou alguma dúvida? Fale com o mestre do seu grupo. <Link href="/novidades" className="underline">Ver novidades</Link></p>
    </div>
  </main>
}
