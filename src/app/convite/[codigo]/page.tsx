'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { Castle, Loader2, MoonStar, Send } from 'lucide-react'
import { api, aventureiroAtual, ErroNuvem, NUVEM_ATIVA } from '@/lib/nuvem/cliente'

type Previa = {
  convite: { codigo: string; situacao: 'valido' | 'revogado' | 'expirado' | 'esgotado' }
  campanha: { id: string; nome: string; descricao: string; sistema: string; estado: string; mestre: { apelido: string } | null } | null
  jaParticipa: boolean; pedidoPendente: boolean
}
const motivo = { revogado: 'Este convite foi revogado pelo mestre.', expirado: 'Este convite expirou. Peça um novo ao mestre.', esgotado: 'Este convite atingiu o limite de usos.' }

export default function ConvitePage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = use(params)
  const [previa, setPrevia] = useState<Previa | null>(null)
  const [erro, setErro] = useState('')
  const [semPerfil, setSemPerfil] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    if (!NUVEM_ATIVA) { setErro('Convites exigem a sincronização na nuvem, que ainda não está ativa.'); return }
    if (!aventureiroAtual()) { setSemPerfil(true); return }
    api<Previa>('convites/' + encodeURIComponent(codigo)).then(setPrevia).catch(e => setErro(e instanceof ErroNuvem ? e.message : 'Falha de conexão.'))
  }, [codigo])

  async function pedir() {
    setEnviando(true); setErro('')
    try { await api('convites/' + encodeURIComponent(codigo), { method: 'POST', body: { mensagem } }); setEnviado(true) }
    catch (e) { setErro(e instanceof ErroNuvem ? e.message : 'Falha de conexão.') } finally { setEnviando(false) }
  }

  const voltar = '/portal?depois=' + encodeURIComponent('/convite/' + codigo)
  return <main className="flex min-h-screen items-center justify-center fundo-tema px-4 py-10 text-[#f2ebff]">
    <div className="w-full max-w-md rounded-3xl border border-[#655079] bg-[#201a32] p-6 text-center sm:p-8">
      <MoonStar className="mx-auto text-[#c5a7ff]" size={40} />
      <p className="mt-3 text-xs uppercase tracking-[.2em] text-[#d3adf0]">Convite de campanha</p>
      {semPerfil && <><p className="mt-4 text-[#cfc0df]">Escolha seu aventureiro no portal e depois abra este link de novo.</p>
        <Link href={voltar} className="mt-5 inline-block rounded-xl bg-[#7652ac] px-5 py-3 font-semibold">Escolher aventureiro</Link></>}
      {!previa && !erro && !semPerfil && <p className="mt-6 flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={18} /> Carregando convite...</p>}
      {previa?.campanha && <>
        <h1 className="mt-3 break-words text-2xl font-bold">{previa.campanha.nome}</h1>
        <p className="mt-1 text-sm text-[#c4b6d4]">{previa.campanha.sistema}{previa.campanha.mestre ? ' · Mestre: ' + previa.campanha.mestre.apelido : ''}</p>
        {previa.campanha.descricao && <p className="mt-4 whitespace-pre-wrap break-words text-left text-sm text-[#d1c4df]">{previa.campanha.descricao}</p>}
        {previa.jaParticipa ? <p className="mt-6 text-[#a9f0c8]">Você já participa desta campanha.</p>
          : enviado || previa.pedidoPendente ? <p className="mt-6 text-[#a9f0c8]">Pedido enviado! Assim que o mestre aceitar, a campanha aparece na sua Central.</p>
          : previa.convite.situacao !== 'valido' ? <p className="mt-6 text-[#f2a9c3]">{motivo[previa.convite.situacao]}</p>
          : previa.campanha.estado === 'encerrada' ? <p className="mt-6 text-[#f2a9c3]">Esta campanha foi encerrada.</p>
          : <div className="mt-6 space-y-3 text-left">
            <label className="block text-sm">Mensagem para o mestre (opcional)
              <textarea maxLength={300} rows={2} value={mensagem} onChange={e => setMensagem(e.target.value)} className="mt-2 w-full rounded-xl border border-[#70588c] bg-[#151123] p-3 text-white" placeholder="Ex.: Quero jogar com uma maga!" /></label>
            <button type="button" onClick={pedir} disabled={enviando} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7652ac] px-5 py-3 font-semibold hover:bg-[#8b68c4] disabled:opacity-50">
              {enviando ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} Pedir para entrar</button>
          </div>}
      </>}
      {erro && <p role="alert" className="mt-5 text-sm text-red-200">{erro}</p>}
      <Link href="/central" className="mt-6 inline-flex items-center gap-2 text-sm text-[#c7a8ff] underline underline-offset-4"><Castle size={16} /> Ir para a Central</Link>
    </div>
  </main>
}
