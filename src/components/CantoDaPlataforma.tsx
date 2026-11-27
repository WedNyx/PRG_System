'use client'

import { useState } from 'react'
import { ExternalLink, Heart, Loader2, MessageCircleHeart, Send, X } from 'lucide-react'
import NaTela from './NaTela'
import { api, ErroNuvem } from '@/lib/nuvem/cliente'
import { TIPOS_FEEDBACK, type TipoFeedback } from '@/lib/feedback'

export const REPOSITORIO = 'https://github.com/WedNyx/PRG_System'

/**
 * Canto inferior direito (v0.37.0): a aba “Homenagem a Leste” e o balão de feedback.
 * O feedback vai para o Discord do Wed (nunca por e-mail) e só aparece com um perfil escolhido.
 * `acimaDaBarra`: na Central do celular há a barra de atalhos embaixo, então o canto sobe um pouco.
 */
export default function CantoDaPlataforma({ aventureiroId, acimaDaBarra }: { aventureiroId?: string; acimaDaBarra?: boolean }) {
  const [aberto, setAberto] = useState<'homenagem' | 'feedback' | null>(null)
  return <>
    <div data-canto-plataforma className={'fixed right-3 z-30 flex items-center gap-2 ' + (acimaDaBarra ? 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:bottom-4' : 'bottom-4')}>
      <button type="button" onClick={() => setAberto('homenagem')} data-homenagem-leste
        className="inline-flex items-center gap-1.5 rounded-full border border-(--a-8b68c4)/70 bg-(--s-171325)/90 px-3 py-1.5 text-[11px] font-semibold text-(--a-d3adf0) shadow-lg backdrop-blur hover:bg-(--s-2b2140)">
        <Heart size={12} aria-hidden /> Homenagem a Leste</button>
      {aventureiroId && <button type="button" onClick={() => setAberto('feedback')} aria-label="Mandar feedback" title="Mandar feedback" data-abrir-feedback
        className="flex h-10 w-10 items-center justify-center rounded-full border border-(--a-8b68c4) bg-(--a-7654bb) text-white shadow-lg hover:bg-(--a-8a67ce)">
        <MessageCircleHeart size={19} aria-hidden /></button>}
    </div>
    {aberto && <NaTela><div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-3 sm:items-center" onMouseDown={e => { if (e.target === e.currentTarget) setAberto(null) }}>
      <div role="dialog" aria-modal="true" aria-labelledby="canto-titulo" onKeyDown={e => { if (e.key === 'Escape') setAberto(null) }}
        className="w-full max-w-md rounded-2xl border border-(--a-62527e) bg-(--s-19172c) p-5 text-(--a-f2ebff) shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <h2 id="canto-titulo" className="text-lg font-bold">{aberto === 'homenagem' ? '🐉 Homenagem a Leste' : 'Mandar feedback'}</h2>
          <button type="button" onClick={() => setAberto(null)} aria-label="Fechar" className="rounded-lg p-1 hover:bg-white/10"><X size={20} /></button>
        </div>
        {aberto === 'homenagem' ? <Homenagem /> : <FormFeedback aventureiroId={aventureiroId!} fechar={() => setAberto(null)} />}
      </div>
    </div></NaTela>}
  </>
}

function Homenagem() {
  return <div className="mt-3 space-y-3 text-sm leading-relaxed text-(--a-d6c8e8)" data-texto-homenagem>
    <p>O Leste testou a plataforma, achou problemas e trouxe ideias: chamar jogadores pelo @, desvincular o próprio personagem da campanha e este balão de feedback vieram dele.</p>
    <p>Ele também se ofereceu para ajudar no código. Por isso o código-fonte da plataforma fica no GitHub, sempre atualizado, para ele olhar e abrir no VS Code quando quiser.</p>
    <p className="font-semibold text-(--a-e4d3ff)">Valeu, Leste! 💜 <span className="font-normal text-(--a-a99bbb)">— Wed</span></p>
    <a href={REPOSITORIO} target="_blank" rel="noopener noreferrer"
      className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-(--a-7654bb) px-4 py-3 font-semibold text-white hover:bg-(--a-8a67ce)">
      <ExternalLink size={17} aria-hidden /> Ver o código no GitHub</a>
  </div>
}

function FormFeedback({ aventureiroId, fechar }: { aventureiroId: string; fechar: () => void }) {
  const [tipo, setTipo] = useState<TipoFeedback>('ideia')
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<'' | 'enviando' | 'ok'>('')
  const [erro, setErro] = useState('')
  async function enviar(e: React.FormEvent) {
    e.preventDefault(); setEstado('enviando'); setErro('')
    try { await api('feedback', { method: 'POST', aventureiro: aventureiroId, body: { tipo, texto, pagina: window.location.pathname } }); setEstado('ok') }
    catch (er) { setErro(er instanceof ErroNuvem ? er.message : 'Falha de conexão.'); setEstado('') }
  }
  if (estado === 'ok') return <div className="mt-4 text-center" role="status">
    <p className="text-[#a9f0c8]">Recebido! Obrigado por ajudar a melhorar a plataforma. 💜</p>
    <button type="button" onClick={fechar} className="mt-4 rounded-lg border border-(--a-62527e) px-4 py-2 text-sm">Fechar</button>
  </div>
  return <form onSubmit={enviar} className="mt-3 space-y-3" data-form-feedback>
    <p className="text-xs text-(--a-a99bbb)">Vai direto para o Wed. Uma ideia, um problema que apareceu, um elogio… tudo ajuda.</p>
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Tipo de feedback">
      {TIPOS_FEEDBACK.map(t => <button key={t.id} type="button" role="radio" aria-checked={tipo === t.id} onClick={() => setTipo(t.id)}
        className={'rounded-full border px-3 py-1.5 text-xs ' + (tipo === t.id ? 'border-(--a-b99bff) bg-(--s-3a2a53) text-white' : 'border-(--a-4a4267) text-(--a-c4b6d4)')}>{t.emoji} {t.nome}</button>)}
    </div>
    <label className="block text-sm"><span className="sr-only">Seu feedback</span>
      <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={5} maxLength={1500} required minLength={3} autoFocus
        placeholder={tipo === 'problema' ? 'O que aconteceu? Em que tela?' : 'Escreva aqui…'}
        className="w-full rounded-xl border border-(--a-4a4267) bg-(--s-100f20) p-3 text-white outline-none focus:border-(--a-b99bff)" /></label>
    <p className="text-right text-[11px] text-(--a-8f84aa)">{texto.length}/1500</p>
    {erro && <p role="alert" className="text-sm text-red-200">{erro}</p>}
    <button type="submit" disabled={estado === 'enviando' || texto.trim().length < 3}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-(--a-7654bb) px-4 py-3 font-semibold text-white hover:bg-(--a-8a67ce) disabled:opacity-50">
      {estado === 'enviando' ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />} Enviar</button>
  </form>
}
