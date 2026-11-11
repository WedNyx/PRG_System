'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronRight, X } from 'lucide-react'
import { api } from '@/lib/nuvem/cliente'
import { situacaoSenha } from '@/components/perfil/Senha'

/** Chave guardada quando a pessoa entra numa mesa pela primeira vez (ver DicasMesa). */
export const CHAVE_VISITOU_MESA = 'prg-visitou-mesa-v1'
const chaveEscondido = (id: string) => 'prg-comece-escondido-v1-' + id

type Estado = { senha: boolean; campanha: { id: string; nome: string } | null; pedido: string | null; ficha: boolean; mesa: boolean }
type Passo = { id: string; icone: string; titulo: string; texto: string; feito: boolean; opcional?: boolean; acao?: { rotulo: string; href?: string; onClick?: () => void } }

/**
 * “Comece por aqui” na Central (v0.32.2): os primeiros passos de quem acabou de chegar
 * (senha, campanha, personagem, mesa). Some quando tudo está feito ou quando a pessoa esconde.
 */
export default function ComecePorAqui({ perfilId, abrirPerfil, irPara }: { perfilId: string; abrirPerfil: () => void; irPara: (secao: 'campanhas' | 'fichas' | 'sistemas') => void }) {
  const [e, setE] = useState<Estado | null>(null)
  const [escondido, setEscondido] = useState(true)
  useEffect(() => {
    let vivo = true
    let esc = false, mesa = false
    try { esc = localStorage.getItem(chaveEscondido(perfilId)) === '1'; mesa = localStorage.getItem(CHAVE_VISITOU_MESA) === '1' } catch {}
    Promise.all([
      situacaoSenha(perfilId).catch(() => ({ protegido: false })),
      api<{ campanhas: { id: string; nome: string; meuPapel: string; estado: string }[]; pedidos?: { campanha_id: string; nome: string }[] }>('campanhas').catch(() => ({ campanhas: [], pedidos: [] })),
      api<{ fichas: unknown[] }>('fichas').catch(() => ({ fichas: [] })),
    ]).then(([s, c, f]) => {
      if (!vivo) return
      const ativa = c.campanhas.find(x => x.meuPapel !== 'espectador' && x.estado !== 'encerrada') ?? c.campanhas[0] ?? null
      setE({ senha: s.protegido, campanha: ativa ? { id: ativa.id, nome: ativa.nome } : null, pedido: c.pedidos?.[0]?.nome ?? null, ficha: f.fichas.length > 0, mesa })
      setEscondido(esc)
    })
    return () => { vivo = false }
  }, [perfilId])
  if (!e || escondido) return null

  const passos: Passo[] = [
    { id: 'campanha', icone: '🏰', titulo: 'Entrar numa campanha', feito: !!e.campanha,
      texto: e.campanha ? `Você está em “${e.campanha.nome}”.` : e.pedido ? `Pedido enviado para “${e.pedido}”. Assim que o mestre aceitar, ela aparece aqui.` : 'Abra o link de convite que o mestre mandou, ou crie a sua própria campanha.',
      acao: e.campanha || e.pedido ? undefined : { rotulo: 'Ver campanhas', onClick: () => irPara('campanhas') } },
    { id: 'ficha', icone: '📜', titulo: 'Criar o seu personagem', feito: e.ficha,
      texto: e.ficha ? 'Seu personagem já existe.' : e.campanha ? 'Na campanha, toque em “Criar ficha”: a ficha já vem no sistema do mestre e calcula as regras sozinha.' : 'Escolha um sistema e crie a ficha. Depois dá para enviar ao mestre.',
      acao: e.ficha ? undefined : { rotulo: 'Criar ficha', onClick: () => irPara(e.campanha ? 'campanhas' : 'sistemas') } },
    { id: 'mesa', icone: '🎲', titulo: 'Entrar na mesa', feito: e.mesa,
      texto: e.mesa ? 'Você já conhece a mesa.' : 'Quando o mestre abrir a sessão, entre na mesa: dados, mapa, chat e combate ficam lá.',
      acao: e.mesa || !e.campanha ? undefined : { rotulo: 'Abrir a mesa', href: '/mesa?campanha=' + e.campanha.id } },
    { id: 'senha', icone: '🔒', titulo: 'Proteger o seu perfil', feito: e.senha, opcional: true,
      texto: e.senha ? 'Seu perfil tem senha.' : 'Opcional: com uma senha, só você entra no seu perfil. Não precisa de e-mail.',
      acao: e.senha ? undefined : { rotulo: 'Criar senha', onClick: abrirPerfil } },
  ]
  const feitos = passos.filter(p => p.feito).length
  if (feitos === passos.length) return null
  const esconder = () => { try { localStorage.setItem(chaveEscondido(perfilId), '1') } catch {} ; setEscondido(true) }

  return <section className="mt-6 rounded-3xl border border-[#8b6cba] bg-[#1d1730]/95 p-5 sm:p-6" aria-label="Comece por aqui">
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-bold">✨ Comece por aqui</h2>
        <p className="text-sm text-[#cfc0df]">{feitos} de {passos.length} passos · {feitos === 0 ? 'bem-vindo à plataforma!' : 'falta pouco!'}</p>
      </div>
      <button type="button" onClick={esconder} aria-label="Esconder “Comece por aqui”" title="Esconder" className="rounded-lg p-1.5 text-[#b4aeca] hover:bg-white/10"><X size={18} /></button>
    </div>
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#2b2140]" aria-hidden><div className="h-full rounded-full bg-gradient-to-r from-[#7652ac] to-[#d4a23a] transition-all" style={{ width: `${(feitos / passos.length) * 100}%` }} /></div>
    <ol className="mt-4 grid gap-2 sm:grid-cols-2">{passos.map(p => <li key={p.id} className={'flex gap-3 rounded-2xl border p-3 ' + (p.feito ? 'border-emerald-800/60 bg-emerald-950/30' : 'border-[#55456e] bg-[#201a32]')}>
      <span className={'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg ' + (p.feito ? 'bg-emerald-700' : 'bg-[#34294f]')} aria-hidden>{p.feito ? <Check size={18} /> : p.icone}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{p.titulo}{p.opcional && <span className="ml-1 text-xs font-normal text-[#a99bbb]">(opcional)</span>}<span className="sr-only">{p.feito ? ' — feito' : ' — falta'}</span></p>
        <p className="text-xs text-[#cfc0df]">{p.texto}</p>
        {p.acao && (p.acao.href
          ? <Link href={p.acao.href} className="mt-2 inline-flex items-center gap-1 rounded-lg bg-[#7652ac] px-3 py-1.5 text-xs font-semibold hover:bg-[#8b68c4]">{p.acao.rotulo} <ChevronRight size={14} /></Link>
          : <button type="button" onClick={p.acao.onClick} className="mt-2 inline-flex items-center gap-1 rounded-lg bg-[#7652ac] px-3 py-1.5 text-xs font-semibold hover:bg-[#8b68c4]">{p.acao.rotulo} <ChevronRight size={14} /></button>)}
      </div>
    </li>)}</ol>
    <p className="mt-3 text-xs text-[#a99bbb]">Dúvidas? O <Link href="/guia" className="underline">Guia</Link> e os <Link href="/tutorial" className="underline">Tutoriais</Link> explicam tudo passo a passo.</p>
  </section>
}
