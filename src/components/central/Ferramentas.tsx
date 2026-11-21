'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import RolagensCampanhas from './RolagensCampanhas'
import { VERSOES } from '@/lib/versoes'

export type Ferramenta = { id: string; icone: string; nome: string; descricao: string; grupo: 'Jogar' | 'Mestre e criação' | 'Ajuda'; href?: string; acao?: () => void; palavras?: string }

/** Ferramentas da Central (v0.36.5). A lista também alimenta a busca universal. */
export function listaFerramentas(ir: { rolagens: () => void; sistemas: () => void; aparencia: () => void; campanhas: () => void }): Ferramenta[] {
  return [
    { id: 'rolagens', icone: '🎲', nome: 'Histórico de rolagens', descricao: 'Tudo o que foi rolado em cada campanha, com filtros e resumo.', grupo: 'Jogar', acao: ir.rolagens, palavras: 'dados criticos falhas historico' },
    { id: 'sistemas', icone: '📚', nome: 'Sistemas de RPG', descricao: 'Regras resumidas e guia de cada sistema; crie uma ficha.', grupo: 'Jogar', acao: ir.sistemas, palavras: 'dnd ordem tormenta pathfinder guia regras' },
    { id: 'som', icone: '🔊', nome: 'Mesa de Som', descricao: 'Efeitos, ambientes e cenas: na mesa, em Música › Mesa de som.', grupo: 'Mestre e criação', acao: ir.campanhas, palavras: 'audio efeitos sonoros ambiente cena musica' },
    { id: 'mestre-dnd', icone: '🐉', nome: 'Ferramentas do mestre (D&D)', descricao: 'Encontros, CDs, XP e condições.', grupo: 'Mestre e criação', href: '/mestre/dnd', palavras: 'encontro xp cd condicoes' },
    { id: 'criar-sistema', icone: '🛠️', nome: 'Criar sistema de RPG', descricao: 'Monte o seu próprio sistema com atributos, perícias e árvore.', grupo: 'Mestre e criação', href: '/sistemas/criar', palavras: 'construtor autoral' },
    { id: 'aparencia', icone: '🎨', nome: 'Aparência', descricao: 'Tema, cores, fonte e conforto visual.', grupo: 'Ajuda', acao: ir.aparencia, palavras: 'tema cores fundo fonte' },
    { id: 'guia', icone: '🧭', nome: 'Guia da plataforma', descricao: 'Por onde começar e dúvidas comuns.', grupo: 'Ajuda', href: '/guia', palavras: 'ajuda duvidas' },
    { id: 'tutorial', icone: '🎓', nome: 'Tutoriais práticos', descricao: 'Passo a passo para jogadores e mestres.', grupo: 'Ajuda', href: '/tutorial' },
    { id: 'novidades', icone: '✨', nome: 'Novidades', descricao: 'O que mudou em cada versão (agora v' + VERSOES[0].versao + ').', grupo: 'Ajuda', href: '/novidades', palavras: 'versao atualizacao' },
  ]
}

const cartao = 'group flex h-full items-start gap-3 rounded-2xl border border-(--a-55456e) bg-(--s-201a32)/90 p-4 text-left transition hover:-translate-y-0.5 hover:border-(--a-b79aff) hover:bg-(--s-2b2143) focus-visible:outline-2 focus-visible:outline-(--a-c5a7ff)'

export default function Ferramentas({ aba, mudarAba, ferramentas }: { aba: 'todas' | 'rolagens'; mudarAba: (a: 'todas' | 'rolagens') => void; ferramentas: Ferramenta[] }) {
  return <>
    <div role="tablist" aria-label="Ferramentas" className="flex flex-wrap gap-2">
      <button type="button" role="tab" aria-selected={aba === 'todas'} onClick={() => mudarAba('todas')} className="prg-chip !px-4 !py-2 !text-sm">🧰 Todas</button>
      <button type="button" role="tab" aria-selected={aba === 'rolagens'} onClick={() => mudarAba('rolagens')} className="prg-chip !px-4 !py-2 !text-sm">🎲 Histórico de rolagens</button>
    </div>
    {aba === 'rolagens' ? <RolagensCampanhas /> : (['Jogar', 'Mestre e criação', 'Ajuda'] as const).map(g => <section key={g} className="mt-6">
      <h2 className="mb-2 flex items-center gap-3 text-xs font-semibold uppercase tracking-[.2em] text-(--ouro) [font-family:inherit]">{g}<span className="prg-divisoria flex-1" /></h2>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ferramentas.filter(f => f.grupo === g).map(f => { const dentro = <>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-(--a-6d5690) bg-gradient-to-br from-(--s-3a2a5c) to-(--s-211a35) text-2xl" aria-hidden="true">{f.icone}</span>
          <span className="min-w-0 flex-1"><span className="block font-semibold">{f.nome}</span><span className="mt-0.5 block text-sm text-(--a-bfb2cf)">{f.descricao}</span></span>
          <ChevronRight size={18} className="mt-1 shrink-0 text-(--a-b69ad4) transition group-hover:translate-x-0.5" aria-hidden="true" /></>
          return <li key={f.id}>{f.href ? <Link href={f.href} className={cartao}>{dentro}</Link> : <button type="button" onClick={f.acao} className={cartao + ' w-full'}>{dentro}</button>}</li> })}
      </ul>
    </section>)}
  </>
}
