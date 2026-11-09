'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, ChevronDown, ChevronRight, Loader2, Plus, Sparkles } from 'lucide-react'
import GuiaSistema from '@/components/sistemas/GuiaSistema'
import { SISTEMAS } from '@/lib/sistemas/catalogo'
import { ErroNuvem } from '@/lib/nuvem/cliente'
import { criarEAbrirFicha } from '@/lib/sistemas/criar'

const SELO: Record<string, { texto: string; cor: string }> = {
  autoral: { texto: 'Autoral', cor: 'bg-[#4a2d63] text-[#e7c6ff]' },
  aberto: { texto: 'Licença aberta', cor: 'bg-[#1f4a35] text-[#a9f0c8]' },
  estrutura: { texto: 'Estrutura de ficha', cor: 'bg-[#3a3352] text-[#d6c8f0]' },
}

export default function SistemasGaleria({ aventureiroId, fichaV8Url }: { aventureiroId: string; fichaV8Url: string }) {
  const [criando, setCriando] = useState('')
  const [erro, setErro] = useState('')
  const [guia, setGuia] = useState<string | null>(null)

  async function criar(sistema: string) {
    setCriando(sistema); setErro('')
    try { await criarEAbrirFicha(sistema, aventureiroId) } catch (e) { setErro(e instanceof ErroNuvem ? e.message : 'Não foi possível criar a ficha.'); setCriando('') }
  }


  return <div className="mt-6 space-y-4">
    {erro && <p role="alert" className="text-sm text-red-200">{erro}</p>}
    <article className="rounded-2xl border border-[#8b6cba] bg-gradient-to-br from-[#302044] to-[#1b172b] p-5">
      <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold">Lunethernnyis — Opositores</h2><span className="rounded-full bg-[#4a2d63] px-2 py-0.5 text-xs text-[#e7c6ff]">Autoral · Ficha V8</span></div>
      <p className="mt-2 text-sm text-[#c4b6d4]">A Ficha V8 original continua disponível. Há também uma versão automática abaixo, que calcula as regras aprovadas.</p>
      <div className="mt-3 flex flex-wrap gap-4"><Link href={fichaV8Url} className="inline-flex items-center text-[#c7a8ff] underline underline-offset-4">Abrir Ficha V8 <ChevronRight size={16} /></Link>
        <button type="button" onClick={() => setGuia(g => g === 'v8' ? null : 'v8')} aria-expanded={guia === 'v8'} className="inline-flex items-center gap-1 text-[#c7a8ff] underline underline-offset-4">📖 Guia do mestre <ChevronDown size={16} className={guia === 'v8' ? 'rotate-180' : ''} /></button></div>
      {guia === 'v8' && <div className="mt-4 border-t border-[#55456e] pt-4"><GuiaSistema sistemaId="lunethernnyis" compacto /></div>}
    </article>
    <div className="grid gap-4 md:grid-cols-2">
      {SISTEMAS.map(s => <article key={s.id} className="flex flex-col rounded-2xl border border-[#55456e] bg-[#201a32] p-5">
        <div className="flex items-start gap-3"><BookOpen className="mt-1 shrink-0 text-[#c5a7ff]" size={22} />
          <div className="min-w-0 flex-1"><h2 className="font-semibold">{s.nome}</h2>
            <div className="mt-1 flex flex-wrap gap-1 text-xs"><span className={'rounded-full px-2 py-0.5 ' + SELO[s.tipo].cor}>{SELO[s.tipo].texto}</span><span className="rounded-full bg-[#2b2140] px-2 py-0.5 text-[#c4b6d4]">{s.dados}</span></div></div></div>
        <p className="mt-3 flex-1 text-sm text-[#d1c4df]">{s.resumo}</p>
        {guia === s.id && <div className="mt-4 border-t border-[#55456e] pt-4"><GuiaSistema sistemaId={s.id} compacto /></div>}
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => setGuia(g => g === s.id ? null : s.id)} aria-expanded={guia === s.id} className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-[#6d5690] px-3 py-2 text-sm hover:bg-[#2b2140]">📖 {guia === s.id ? 'Fechar guia' : 'Guia do mestre'}</button>
          <button type="button" disabled={!!criando} onClick={() => criar(s.id)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#7652ac] px-4 py-2 text-sm font-semibold hover:bg-[#8b68c4] disabled:opacity-50">
            {criando === s.id ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Criar ficha</button>
        </div>
      </article>)}
    </div>
    <div className="rounded-2xl border border-dashed border-[#6d5690] p-5 text-sm text-[#cbb9dc]">
      <p className="flex items-center gap-2 font-semibold text-[#e4d3ff]"><Sparkles size={18} /> Criar meu próprio sistema</p>
      <p className="mt-2">Em breve: monte atributos, perícias, fórmulas e recursos do seu sistema autoral. Quando você finalizar, ele aparece nesta lista junto dos outros.</p>
    </div>
    <p className="text-xs text-[#9d8db0]">Sistemas com licença aberta mostram os créditos exigidos no fim da ficha. Sistemas comerciais aparecem só como estrutura de ficha: as regras ficam com o livro oficial.</p>
  </div>
}
