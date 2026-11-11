'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Loader2, Pencil, Plus, Sparkles } from 'lucide-react'
import { useSistemasAutorais } from '@/lib/sistemas/cliente'
import { NUVEM_ATIVA } from '@/lib/nuvem/cliente'
import GuiaSistema from '@/components/sistemas/GuiaSistema'
import { SISTEMAS_VISIVEIS } from '@/lib/sistemas/catalogo'
import { ErroNuvem } from '@/lib/nuvem/cliente'
import { criarEAbrirFicha, GRUPOS_SISTEMA, type GrupoSistema } from '@/lib/sistemas/criar'
import { ImagemCapa } from '@/components/sistemas/CapaDoSistema'

const SELO: Record<string, { texto: string; cor: string }> = {
  autoral: { texto: 'Autoral', cor: 'bg-(--s-4a2d63) text-(--a-e7c6ff)' },
  aberto: { texto: 'Licença aberta', cor: 'bg-[#1f4a35] text-[#a9f0c8]' },
  estrutura: { texto: 'Estrutura de ficha', cor: 'bg-(--s-3a3352) text-(--a-d6c8f0)' },
}
type Cartao = { id: string; guia: string; nome: string; tipo: string; dados: string; resumo: string; autor?: string; meu?: boolean; rascunho?: boolean; capa?: string | null }

const PUBLICADOS: Cartao[] = SISTEMAS_VISIVEIS.filter(s => s.tipo !== 'autoral').map(s => ({ id: s.id, guia: s.id, nome: s.nome, tipo: s.tipo, dados: s.dados, resumo: s.resumo }))
const AUTORAIS: Cartao[] = SISTEMAS_VISIVEIS.filter(s => s.tipo === 'autoral').map(s => ({ id: s.id, guia: s.id, nome: s.nome, tipo: s.tipo, dados: s.dados, resumo: s.resumo }))

/** Sistemas separados em publicados (RPGs existentes) e autorais (criados por jogadores). */
export default function SistemasGaleria({ aventureiroId }: { aventureiroId: string }) {
  const [grupo, setGrupo] = useState<GrupoSistema>('publicado')
  const [criando, setCriando] = useState('')
  const [erro, setErro] = useState('')
  const [guia, setGuia] = useState<string | null>(null)

  async function criar(sistema: string) {
    setCriando(sistema); setErro('')
    try { await criarEAbrirFicha(sistema, aventureiroId) } catch (e) { setErro(e instanceof ErroNuvem ? e.message : 'Não foi possível criar a ficha.'); setCriando('') }
  }
  const { lista: criados } = useSistemasAutorais()
  const autorais: Cartao[] = [...AUTORAIS, ...(criados ?? []).map(a => ({ id: a.id, guia: '', nome: a.nome, tipo: 'autoral', dados: a.dados, resumo: a.resumo || 'Sistema criado no construtor.', autor: a.autor, meu: a.meu, rascunho: !a.publicado, capa: a.capa }))]
  const lista = grupo === 'publicado' ? PUBLICADOS : autorais
  const info = GRUPOS_SISTEMA.find(g => g.id === grupo)!

  return <div className="mt-6 space-y-4">
    <div role="tablist" aria-label="Tipo de sistema" className="grid grid-cols-2 gap-2 rounded-2xl border border-(--a-55456e) bg-(--s-1b1529)/90 p-1.5">
      {GRUPOS_SISTEMA.map(g => <button key={g.id} type="button" role="tab" aria-selected={grupo === g.id} onClick={() => { setGrupo(g.id); setGuia(null) }}
        className={'rounded-xl px-3 py-2.5 text-sm font-semibold transition ' + (grupo === g.id ? 'bg-(--a-7652ac) text-white' : 'text-(--a-cfc0df) hover:bg-(--s-2b2140)')}>
        {g.nome} <span className="font-normal opacity-80">({g.id === 'publicado' ? PUBLICADOS.length : autorais.length})</span></button>)}
    </div>
    <p className="text-sm text-(--a-cfc0df)">{info.descricao}</p>
    {erro && <p role="alert" className="text-sm text-red-200">{erro}</p>}

    <div className="grid gap-4 md:grid-cols-2">
      {lista.map(s => <article key={s.id} className="flex flex-col overflow-hidden rounded-2xl border border-(--a-55456e) bg-(--s-201a32)">
        <div className="relative aspect-[16/7] overflow-hidden border-b border-(--a-55456e)">
          <ImagemCapa id={s.id} nome={s.nome} capa={s.capa} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-(--s-201a32) to-transparent" />
        </div>
        <div className="flex flex-1 flex-col p-5 pt-3">
        <div className="flex items-start gap-3"><BookOpen className="mt-1 shrink-0 text-(--a-c5a7ff)" size={22} />
          <div className="min-w-0 flex-1"><h2 className="font-semibold">{s.nome}</h2>
            <div className="mt-1 flex flex-wrap gap-1 text-xs"><span className={'rounded-full px-2 py-0.5 ' + SELO[s.tipo].cor}>{SELO[s.tipo].texto}</span><span className="rounded-full bg-(--s-2b2140) px-2 py-0.5 text-(--a-c4b6d4)">{s.dados}</span>

              {s.rascunho && <span className="rounded-full bg-[#4b3a14] px-2 py-0.5 text-amber-200">Rascunho (só você vê)</span>}</div></div></div>
        {s.autor && <p className="mt-3 rounded-xl border border-(--a-8b6cba)/60 bg-gradient-to-r from-(--s-3b2a5c) to-(--s-2a1f40) px-3 py-2 text-sm">✍️ Criado por <strong className="text-[#ffd77a]">{s.autor}</strong>{s.meu && <span className="text-xs text-(--a-c4b6d4)"> (você)</span>}</p>}
        <p className="mt-3 flex-1 text-sm text-(--a-d1c4df)">{s.resumo}</p>
        {guia === s.id && <div className="mt-4 border-t border-(--a-55456e) pt-4"><GuiaSistema sistemaId={s.guia} compacto /></div>}
        <div className="mt-4 flex gap-2">
          {s.guia ? <button type="button" onClick={() => setGuia(g => g === s.id ? null : s.id)} aria-expanded={guia === s.id} className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-(--a-6d5690) px-3 py-2 text-sm hover:bg-(--s-2b2140)">📖 {guia === s.id ? 'Fechar guia' : 'Guia do mestre'}</button>
            : s.meu ? <Link href={'/sistemas/criar?id=' + s.id} className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-(--a-6d5690) px-3 py-2 text-sm hover:bg-(--s-2b2140)"><Pencil size={15} /> Editar</Link> : null}
          <button type="button" disabled={!!criando} onClick={() => criar(s.id)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-(--a-7652ac) px-4 py-2 text-sm font-semibold hover:bg-(--a-8b68c4) disabled:opacity-50">
            {criando === s.id ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Criar ficha</button>
        </div>
        </div>
      </article>)}
    </div>

    {grupo === 'autoral' && <div className="rounded-2xl border border-dashed border-(--a-6d5690) bg-(--s-1b1529)/80 p-5 text-sm text-(--a-cbb9dc)">
      <p className="flex items-center gap-2 font-semibold text-(--a-e4d3ff)"><Sparkles size={18} /> Criar meu próprio sistema</p>
      <p className="mt-2">Monte atributos, perícias, fórmulas e recursos, veja a ficha funcionando na hora e publique para o grupo.</p>
      {NUVEM_ATIVA ? <Link href="/sistemas/criar" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-(--a-7652ac) px-4 py-2 font-semibold text-white hover:bg-(--a-8b68c4)"><Plus size={16} /> Abrir o construtor</Link>
        : <p className="mt-2 text-xs">Disponível com a nuvem ligada.</p>}
    </div>}
    <p className="text-xs text-(--a-9d8db0)">{grupo === 'publicado' ? 'Sistemas com licença aberta mostram os créditos exigidos no fim da ficha. Sistemas comerciais aparecem só como estrutura de ficha: as regras ficam com o livro oficial.' : 'Sistemas autorais pertencem a quem os criou.'}</p>
  </div>
}
