'use client'

import Link from 'next/link'
import { Pencil, UserRound } from 'lucide-react'
import Aparencia from './Aparencia'
import { ConfigSenha } from '@/components/perfil/Senha'
import ApagarPerfil from '@/components/perfil/ApagarPerfil'
import { mudarPreferencias, usePreferencias, type Preferencias } from '@/lib/preferencias'
import type { Tema } from '@/lib/tema'
import { limparVisual, type Visual } from '@/lib/visual'
import { NUVEM_ATIVA } from '@/lib/nuvem/cliente'

export type AbaPerfil = 'aparencia' | 'jogabilidade' | 'notificacoes' | 'privacidade' | 'conta'
export const ABAS_PERFIL: { id: AbaPerfil; icone: string; nome: string; palavras: string }[] = [
  { id: 'aparencia', icone: '🎨', nome: 'Aparência', palavras: 'tema cores fundo fonte movimento efeitos' },
  { id: 'jogabilidade', icone: '🎲', nome: 'Jogabilidade', palavras: 'dados 3d som confetes chat mesa' },
  { id: 'notificacoes', icone: '🔔', nome: 'Notificações', palavras: 'avisos sininho baloes' },
  { id: 'privacidade', icone: '🔒', nome: 'Dados e privacidade', palavras: 'senha codigo recuperacao apagar perfil' },
  { id: 'conta', icone: '🧙', nome: 'Conta', palavras: 'apelido avatar trocar aventureiro' },
]

const bloco = 'rounded-2xl border border-(--a-55456e) bg-(--s-201a32)/90 p-4 sm:p-5'

/** Interruptor acessível (botão com aria-pressed). */
function Opcao({ chave, titulo, dica }: { chave: keyof Preferencias; titulo: string; dica: string }) {
  const pref = usePreferencias(), ligado = pref[chave] === true
  return <button type="button" role="switch" aria-checked={ligado} onClick={() => mudarPreferencias({ [chave]: !ligado })}
    className="flex w-full items-center gap-3 rounded-xl border border-(--a-3d3152) bg-(--s-171325)/80 px-3 py-3 text-left transition hover:border-(--a-6d5690)">
    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{titulo}</span><span className="block text-xs text-(--a-a99bbb)">{dica}</span></span>
    <span aria-hidden="true" className={'relative h-6 w-11 shrink-0 rounded-full transition ' + (ligado ? 'bg-(--a-7652ac)' : 'bg-black/50')}>
      <span className={'absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left] ' + (ligado ? 'left-[22px]' : 'left-0.5')} /></span>
  </button>
}

/**
 * Meu perfil (v0.36.5): configurações separadas por assunto.
 * Aparência fica salva no perfil; Jogabilidade e Notificações valem para este aparelho.
 */
export default function PerfilConfig({ aba, mudarAba, perfil, tema, escolherTema, visualSalvo, editarPerfil }: {
  aba: AbaPerfil; mudarAba: (a: AbaPerfil) => void
  perfil: { id: string; apelido: string; avatar?: string; grupo?: string; visual?: unknown }
  tema: Tema; escolherTema: (t: Tema) => void; visualSalvo: (v: Visual) => void; editarPerfil: () => void
}) {
  const pref = usePreferencias()
  return <>
    <div role="tablist" aria-label="Configurações do perfil" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {ABAS_PERFIL.map(a => <button key={a.id} type="button" role="tab" aria-selected={aba === a.id} onClick={() => mudarAba(a.id)} className="prg-chip shrink-0 !px-4 !py-2 !text-sm">{a.icone} {a.nome}</button>)}
    </div>
    <div className="mt-5">
      {aba === 'aparencia' && <Aparencia perfilId={perfil.id} inicial={limparVisual(perfil.visual)} tema={tema} escolherTema={escolherTema} salvo={visualSalvo} />}

      {aba === 'jogabilidade' && <div className="space-y-4">
        <p className="rounded-2xl border border-(--a-55456e) bg-(--s-171325)/80 px-4 py-3 text-sm text-(--a-cfc0df)">Valem para este aparelho: dá para jogar com som no computador e em silêncio no celular. As fichas continuam 100% manuais em qualquer escolha.</p>
        <section className={bloco + ' space-y-2'} aria-labelledby="pj-dados"><h2 id="pj-dados" className="mb-1 text-lg font-bold">🎲 Dados</h2>
          <Opcao chave="dados3d" titulo="Dados 3D" dica="Os dados caem na tela antes do resultado. Desligado: aparece só o cartão (mais rápido)." />
          <Opcao chave="somDados" titulo="Som dos dados" dica="Barulho da rolagem, fanfarra do crítico e descida da falha." />
          <Opcao chave="confetes" titulo="Confetes no crítico" dica="Comemoração quando sai o valor máximo do d20." />
        </section>
        <section className={bloco + ' space-y-2'} aria-labelledby="pj-mesa"><h2 id="pj-mesa" className="mb-1 text-lg font-bold">🗺️ Mesa virtual</h2>
          <Opcao chave="chatAbertoPc" titulo="Chat aberto ao entrar (computador)" dica="No celular o chat sempre começa recolhido para o mapa ter espaço." />
          <Opcao chave="sonsMesa" titulo="Ouvir a Mesa de Som" dica="Efeitos e ambientes que o mestre toca." />
          <Opcao chave="sonsRepentinos" titulo="Sons de susto" dica="Grito, explosão e rugido. Desligue se preferir não levar sustos." />
          <label className="flex items-center gap-3 rounded-xl border border-(--a-3d3152) bg-(--s-171325)/80 px-3 py-3 text-sm">
            <span className="w-32 shrink-0 font-semibold">Volume dos sons</span>
            <input type="range" min={0} max={1} step={0.05} value={pref.volumeSons} onChange={e => mudarPreferencias({ volumeSons: Number(e.target.value) })} aria-label="Volume da Mesa de Som" className="min-w-0 flex-1 accent-(--a-b99bff)" />
            <span className="w-10 text-right tabular-nums text-xs">{Math.round(pref.volumeSons * 100)}%</span></label>
        </section>
      </div>}

      {aba === 'notificacoes' && <section className={bloco + ' space-y-2'} aria-labelledby="pn-avisos">
        <h2 id="pn-avisos" className="mb-1 text-lg font-bold">🔔 Avisos</h2>
        <p className="mb-2 text-sm text-(--a-bfb2cf)">Os avisos ficam só dentro da plataforma, no sininho (convites, pedidos, sessões abertas). Nada é enviado por e-mail.</p>
        <Opcao chave="baloesAvisos" titulo="Balão rápido para avisos novos" dica="Desligado: os avisos chegam só no sininho, sem aparecer por cima da tela." />
      </section>}

      {aba === 'privacidade' && <div className="space-y-4">
        {NUVEM_ATIVA ? <>
          <section className={bloco} aria-labelledby="pp-senha"><h2 id="pp-senha" className="mb-2 text-lg font-bold">🔑 Senha do perfil</h2><ConfigSenha id={perfil.id} /></section>
          <section className={bloco} aria-labelledby="pp-dados"><h2 id="pp-dados" className="mb-2 text-lg font-bold">📦 Seus dados</h2>
            <p className="text-sm text-(--a-bfb2cf)">Cada ficha tem o botão de baixar (arquivo da ficha) e pode ser importada de volta. A aparência fica guardada no seu perfil; as preferências de jogo, só neste aparelho.</p></section>
          <section className={bloco} aria-labelledby="pp-apagar"><h2 id="pp-apagar" className="mb-2 text-lg font-bold">🗑️ Apagar perfil</h2><ApagarPerfil perfil={perfil} /></section>
        </> : <p className={bloco + ' text-sm'}>Os perfis estão guardados só neste aparelho.</p>}
      </div>}

      {aba === 'conta' && <section className={bloco + ' flex flex-wrap items-center gap-4'} aria-label="Conta">
        <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-(--ouro) bg-(--s-342749) text-2xl font-semibold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {perfil.avatar ? <img src={perfil.avatar} alt="" className="h-full w-full object-cover" /> : perfil.apelido[0]?.toUpperCase()}</span>
        <span className="min-w-0 flex-1"><span className="block text-lg font-bold">{perfil.apelido}</span><span className="block text-sm text-(--a-a99bbb)">{perfil.grupo || 'Aventureiro'}</span></span>
        <div className="flex flex-wrap gap-2">
          {NUVEM_ATIVA && <button type="button" onClick={editarPerfil} className="prg-botao prg-botao-primario"><Pencil size={16} /> Editar apelido e foto</button>}
          <Link href="/portal" className="prg-botao prg-botao-secundario"><UserRound size={16} /> Trocar aventureiro</Link>
        </div>
      </section>}
    </div>
  </>
}

