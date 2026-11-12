'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Dices, Loader2, Pencil, Plus, Sparkles } from 'lucide-react'
import { useSistemasAutorais } from '@/lib/sistemas/cliente'
import { NUVEM_ATIVA } from '@/lib/nuvem/cliente'
import GuiaSistema from '@/components/sistemas/GuiaSistema'
import { SISTEMAS_VISIVEIS } from '@/lib/sistemas/catalogo'
import { ErroNuvem } from '@/lib/nuvem/cliente'
import { criarEAbrirFicha, GRUPOS_SISTEMA, type GrupoSistema } from '@/lib/sistemas/criar'
import { ImagemCapa } from '@/components/sistemas/CapaDoSistema'
import { capaDoSistema, corDoSistema } from '@/lib/sistemas/capas'

const SELO: Record<string, { texto: string; cor: string }> = {
  autoral: { texto: 'Autoral', cor: 'border border-(--a-a98bd6)/60 bg-(--s-4a2d63)/90 text-(--a-e7c6ff)' },
  aberto: { texto: 'Licença aberta', cor: 'border border-[#4fbf86]/70 bg-[#17432d]/90 text-[#b5f5d2]' },
  estrutura: { texto: 'Estrutura de ficha', cor: 'border border-[#c9a27a]/50 bg-[#3a2a2a]/90 text-[#f0dcc8]' },
}
type Cartao = { id: string; guia: string; nome: string; tipo: string; dados: string; resumo: string; autor?: string; meu?: boolean; rascunho?: boolean; capa?: string | null }

const SERIFA = { fontFamily: 'var(--font-cormorant), Georgia, \'Times New Roman\', serif' }
/** “Pathfinder 2ª edição (Remaster)” → título e subtítulo, como nos cartões ilustrados. */
const partesNome = (nome: string) => { const i = nome.indexOf(' ('); return i > 0 && nome.endsWith(')') ? [nome.slice(0, i), nome.slice(i + 2, -1)] : [nome, ''] }

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
      {lista.map(s => { const cor = corDoSistema(s.id, s.nome)
        return <article key={s.id} style={{ '--cor': cor } as React.CSSProperties}
          className="cartao-sistema group relative isolate flex min-h-[17rem] flex-col overflow-hidden rounded-3xl border-2 border-[color-mix(in_oklab,var(--cor)_70%,#f3d9a4)] bg-[#0d0b16] shadow-[0_0_18px_-4px_var(--cor),inset_0_0_24px_-10px_var(--cor)] sm:min-h-[18.5rem]">
        {capaDoSistema(s.id, s.nome, s.capa).lado
          ? <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_85%_20%,color-mix(in_oklab,var(--cor)_30%,#0d0b16),#0b0912_70%)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={capaDoSistema(s.id, s.nome, s.capa).src} alt="" loading="lazy" draggable={false}
              className="absolute inset-y-0 right-0 h-full w-[68%] object-cover object-[60%_25%] transition duration-700 [mask-image:linear-gradient(to_right,transparent,#000_38%)] group-hover:scale-[1.03] sm:w-[62%]" /></div>
          : <div className="absolute inset-0 -z-10"><ImagemCapa id={s.id} nome={s.nome} capa={s.capa} className="object-[70%_center] transition duration-700 group-hover:scale-[1.03]" /></div>}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[#07060c]/85 via-[#07060c]/40 to-transparent" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-[#07060c]/90 via-[#07060c]/15 to-transparent" />
        <div className="pointer-events-none absolute inset-1.5 -z-10 rounded-[1.3rem] border border-white/10" />
        <div className="flex flex-1 flex-col p-5 pt-14 sm:pt-20">
          <h2 style={SERIFA} className="text-[1.75rem] font-bold leading-[1.05] tracking-normal text-[#fbf3e6] drop-shadow-[0_2px_6px_rgba(0,0,0,.95)] sm:text-[2rem]">{partesNome(s.nome)[0]}
            {partesNome(s.nome)[1] && <span className="block text-lg font-semibold text-[#efe2cf]/90 sm:text-xl">{partesNome(s.nome)[1]}</span>}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className={'rounded-full px-2.5 py-0.5 ' + SELO[s.tipo].cor}>{SELO[s.tipo].texto}</span>
            <span className="inline-flex items-center gap-1 text-white/85 drop-shadow"><Dices size={15} className="opacity-80" /> {s.dados}</span>
            {s.rascunho && <span className="rounded-full bg-[#4b3a14] px-2 py-0.5 text-amber-200">Rascunho (só você vê)</span>}
          </div>
          {s.autor && <p className="mt-3 w-fit rounded-xl border border-white/15 bg-black/45 px-3 py-1.5 text-sm backdrop-blur-sm">✍️ Criado por <strong className="text-[#ffd77a]">{s.autor}</strong>{s.meu && <span className="text-xs text-white/70"> (você)</span>}</p>}
          <p className="mt-3 flex-1 text-sm leading-relaxed text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,.95)] sm:max-w-[90%]">{s.resumo}</p>
          {guia === s.id && <div className="mt-4 rounded-2xl border border-white/10 bg-[#0b0912]/90 p-4 backdrop-blur"><GuiaSistema sistemaId={s.guia} compacto /></div>}
          <div className="mt-4 flex gap-2">
            {s.guia ? <button type="button" onClick={() => setGuia(g => g === s.id ? null : s.id)} aria-expanded={guia === s.id} style={SERIFA}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[color-mix(in_oklab,var(--cor)_35%,#f3d9a4)]/70 bg-[#0b0912]/75 px-3 py-2.5 text-base font-semibold text-[#f6ead8]  shadow-[inset_0_0_12px_-6px_#f3d9a4] backdrop-blur-sm transition hover:bg-[#1a1524]/90"><BookOpen size={17} className="text-[#e8c99a]" /> {guia === s.id ? 'Fechar guia' : 'Guia do mestre'}</button>
              : s.meu ? <Link href={'/sistemas/criar?id=' + s.id} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/30 bg-[#0b0912]/75 px-3 py-2.5 text-sm backdrop-blur-sm hover:bg-[#1a1524]/90"><Pencil size={15} /> Editar</Link> : null}
            <button type="button" disabled={!!criando} onClick={() => criar(s.id)} style={SERIFA}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/40 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--cor)_85%,white),var(--cor)_55%,color-mix(in_oklab,var(--cor)_70%,black))] px-4 py-2.5 text-base font-bold text-white  shadow-[0_0_16px_-2px_var(--cor)] transition hover:brightness-110 disabled:opacity-50">
              {criando === s.id ? <Loader2 className="animate-spin" size={16} /> : <Plus size={17} />} Criar ficha</button>
          </div>
        </div>
      </article> })}
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
