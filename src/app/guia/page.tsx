import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowUp, CircleHelp } from 'lucide-react'
import { CAPITULOS, DUVIDAS, GUIA, TRILHAS, type FotoGuia } from '@/lib/guia'
import { VERSOES } from '@/lib/versoes'

export const metadata: Metadata = { title: 'Guia da plataforma · PRG System', description: 'Por onde começar e como usar cada parte do PRG System, com fotos.' }

/** Tópicos do guia que têm lição prática no /tutorial. */
const PRATICA: Record<string, string> = { rolagens: 'dados', arvore: 'arvore', construtor: 'rolagem', fichas: 'imagens', campanhas: 'imagens', mesa: 'mesa', sessao: 'mesa', combate: 'mesa' }
const ABRIR: Record<string, { href: string; rotulo: string }> = { 'primeiro-sistema': { href: '/sistemas/criar', rotulo: '✍️ Abrir o construtor' } }

const SELO = { mestre: '🎩 Para o mestre', admin: '🔒 Administrador', todos: '' } as const
const tituloDe = (id: string) => GUIA.find(t => t.id === id)?.titulo ?? id

function Foto({ f, titulo }: { f: FotoGuia; titulo: string }) {
  return <figure className={f.larga ? 'sm:col-span-2' : ''}>
    <a href={'/guia/' + f.arquivo} target="_blank" rel="noopener" title="Abrir a foto em tamanho grande" className="block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={'/guia/' + f.arquivo} alt={f.legenda || titulo} loading="lazy"
        className={'mx-auto w-auto max-w-full rounded-2xl border border-(--a-62527e) shadow-xl ' + (f.larga ? 'max-h-[520px]' : 'max-h-[560px]')} />
    </a>
    <figcaption className="mt-2 text-center text-xs text-(--a-a99bbb)">{f.legenda} · toque para ampliar</figcaption>
  </figure>
}

/**
 * Guia da plataforma (v0.35.5): começa por “por onde começar” (jogador, mestre ou quem cria sistemas) e pelas
 * dúvidas comuns; depois, os capítulos com fotos atuais da plataforma (scripts/tela/guia.cjs).
 */
export default function GuiaPlataforma() {
  return <main id="topo" className="fundo-tema min-h-screen px-4 py-6 text-(--a-f2ebff) sm:py-10">
    <div className="mx-auto max-w-3xl">
      <Link href="/central" className="inline-flex items-center gap-1 text-sm text-(--a-c7a8ff) hover:underline"><ArrowLeft size={16} /> Voltar à Central</Link>
      <header className="mt-4 rounded-3xl border border-(--a-655079) bg-(--s-1d1733)/90 p-6 shadow-xl sm:p-8">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.22em] text-(--a-ed9cd8)"><CircleHelp size={16} /> Guia da plataforma</p>
        <h1 className="mt-3 text-2xl font-bold sm:text-4xl">Como usar o PRG System</h1>
        <p className="mt-3 text-sm leading-relaxed text-(--a-cfc0df)">O PRG System guarda as fichas do grupo e tem uma mesa virtual para jogar qualquer sistema de RPG, no celular ou no computador. Escolha abaixo o que você vai fazer e siga os passos. As fotos são da versão {VERSOES[0].versao}.</p>
      </header>

      <section aria-labelledby="comecar" className="mt-6">
        <h2 id="comecar" className="mb-3 text-lg font-bold sm:text-xl">🧭 Por onde começar</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {TRILHAS.map(tr => <div key={tr.id} className="rounded-2xl border border-(--a-655079) bg-(--s-1d1733)/92 p-4 shadow-lg">
            <p className="text-3xl" aria-hidden="true">{tr.icone}</p>
            <h3 className="mt-1 font-bold">{tr.titulo}</h3>
            <p className="text-xs text-(--a-c4b6d4)">{tr.para}</p>
            <ol className="mt-3 space-y-1.5 text-sm">
              {tr.passos.map((p, i) => <li key={p.texto} className="flex gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--a-5b4380) text-[11px] font-bold">{i + 1}</span>
                <a href={'#' + p.topico} className="text-(--a-e4d3ff) underline decoration-(--a-6d5690) underline-offset-2 hover:text-white">{p.texto}</a>
              </li>)}
            </ol>
          </div>)}
        </div>
        <Link href="/tutorial" className="mt-3 flex items-center gap-4 rounded-2xl border border-(--a-b99bff)/60 bg-gradient-to-r from-(--s-3b2470) to-(--s-5b2a6e) p-4 shadow-[0_0_24px_#7654bb55] transition hover:brightness-110">
          <span className="text-4xl" aria-hidden="true">🎓</span>
          <span className="min-w-0 flex-1"><span className="block font-bold">Prefere aprender fazendo?</span>
            <span className="block text-sm text-(--a-e4d3ff)">Missões curtas num campo de treino: dados, árvore de habilidades, rolagem personalizada, imagens e mesa. Nada do que você faz lá vai para as suas campanhas.</span></span>
          <span className="shrink-0 text-xl text-(--a-e4d3ff)">→</span>
        </Link>
      </section>

      <section aria-labelledby="duvidas" className="mt-6 rounded-3xl border border-(--a-55456e) bg-(--s-1d1733)/92 p-5 shadow-lg sm:p-7">
        <h2 id="duvidas" className="text-lg font-bold sm:text-xl">🙋 Dúvidas comuns</h2>
        <div className="mt-3 space-y-2">
          {DUVIDAS.map(d => <details key={d.pergunta} className="group rounded-xl bg-(--s-2a2142) px-4 py-3">
            <summary className="cursor-pointer list-none font-semibold marker:hidden"><span className="mr-2 inline-block transition group-open:rotate-90" aria-hidden="true">›</span>{d.pergunta}</summary>
            <p className="mt-2 text-sm text-(--a-d6c9e4)">{d.resposta}</p>
            {d.topico && <a href={'#' + d.topico} className="mt-2 inline-block text-xs text-(--a-c7a8ff) underline">Ler mais: {tituloDe(d.topico)}</a>}
          </details>)}
        </div>
      </section>

      <nav aria-label="Capítulos do guia" className="mt-6 rounded-3xl border border-(--a-55456e) bg-(--s-1d1733)/92 p-5 shadow-lg sm:p-7">
        <h2 className="text-lg font-bold sm:text-xl">📖 Tudo o que a plataforma tem</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {CAPITULOS.map(c => <a key={c.id} href={'#cap-' + c.id} className="flex items-start gap-3 rounded-xl bg-(--s-2a2142) px-3 py-2.5 hover:bg-(--s-3a2c58)">
            <span className="text-xl" aria-hidden="true">{c.icone}</span>
            <span><span className="block text-sm font-semibold">{c.titulo}</span><span className="block text-xs text-(--a-c4b6d4)">{c.resumo}</span></span>
          </a>)}
        </div>
      </nav>

      {CAPITULOS.map(cap => <section key={cap.id} id={'cap-' + cap.id} aria-labelledby={'titulo-' + cap.id} className="mt-10 scroll-mt-4">
        <div className="mb-4 flex items-end justify-between gap-2 border-b border-(--a-55456e) pb-2">
          <h2 id={'titulo-' + cap.id} className="text-xl font-bold sm:text-2xl"><span aria-hidden="true">{cap.icone}</span> {cap.titulo}</h2>
          <a href="#topo" className="flex shrink-0 items-center gap-1 text-xs text-(--a-c7a8ff) hover:underline"><ArrowUp size={14} /> Início</a>
        </div>
        <div className="space-y-6">
          {GUIA.filter(t => t.capitulo === cap.id).map(t => {
            return <article key={t.id} id={t.id} className="scroll-mt-4 rounded-3xl border border-(--a-55456e) bg-(--s-1d1733)/92 p-5 shadow-lg sm:p-7">
              <p className="text-xs text-(--a-a99bbb)">{GUIA.indexOf(t) + 1} de {GUIA.length}{t.quem && t.quem !== 'todos' ? ' · ' + SELO[t.quem] : ''}</p>
              <h3 className="mt-1 text-xl font-bold sm:text-2xl"><span aria-hidden="true">{t.icone}</span> {t.titulo}</h3>
              <p className="mt-2 text-sm text-(--a-d6c9e4)">{t.resumo}</p>
              {!!t.fotos?.length && <div className={'mt-4 grid gap-4 ' + (t.fotos.length > 1 ? 'sm:grid-cols-2' : '')}>{t.fotos.map(f => <Foto key={f.arquivo} f={f} titulo={t.titulo} />)}</div>}
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-(--a-e6dbf2)">{t.passos.map(p => <li key={p}>{p}</li>)}</ol>
              {t.dica && <p className="mt-4 rounded-xl border border-(--a-6d5690) bg-(--s-2a2142) p-3 text-sm text-(--a-e4d3ff)">💡 {t.dica}</p>}
              {ABRIR[t.id] && <Link href={ABRIR[t.id].href} className="mr-2 mt-4 inline-flex items-center gap-2 rounded-xl bg-(--a-5b4380) px-4 py-2 text-sm font-semibold hover:bg-(--a-6b5190)">{ABRIR[t.id].rotulo}</Link>}
              {PRATICA[t.id] && <Link href={'/tutorial?licao=' + PRATICA[t.id]} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-(--a-5b4380) px-4 py-2 text-sm font-semibold hover:bg-(--a-6b5190)">🎓 Praticar no tutorial</Link>}
            </article> })}
        </div>
      </section>)}
      <p className="mt-10 text-center text-xs text-(--a-a99bbb)">Ficou alguma dúvida? Fale com o mestre do seu grupo. <Link href="/novidades" className="underline">Ver novidades</Link></p>
    </div>
  </main>
}
