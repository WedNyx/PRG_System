'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import FichasIndependentes from '@/components/central/FichasIndependentes'
import Campanhas from '@/components/central/Campanhas'
import { BookOpen, Castle, ChevronRight, Dice5, House, Menu, MoonStar, ScrollText, UserRound, X } from 'lucide-react'

type Perfil = { id: string; apelido: string; avatar?: string }
type Section = 'inicio' | 'fichas' | 'campanhas' | 'sistemas' | 'historico'
const SELECTED_KEY = 'prg-aventureiro-selecionado-v1'
const LOCAL_KEY = 'prg-aventureiros-demo-v1'
const CLOUD_ENABLED = process.env.NEXT_PUBLIC_PRG_SHARED_PROFILES === 'true'

const navigation: { id: Section; label: string; icon: typeof House }[] = [
  { id: 'inicio', label: 'Início', icon: House },
  { id: 'fichas', label: 'Fichas', icon: ScrollText },
  { id: 'campanhas', label: 'Campanhas', icon: Castle },
  { id: 'sistemas', label: 'Sistemas de RPG', icon: BookOpen },
  { id: 'historico', label: 'Histórico', icon: Dice5 },
]

function CentralContent() {
  const params = useSearchParams()
  const [section, setSection] = useState<Section>('inicio')
  const [fichasTab, setFichasTab] = useState<'independentes' | 'campanhas'>('independentes')
  const [menuOpen, setMenuOpen] = useState(false)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const id = params.get('personagem') || localStorage.getItem(SELECTED_KEY)
    if (!id) { setLoading(false); return }
    localStorage.setItem(SELECTED_KEY, id)
    let active = true
    async function load() {
      try {
        if (CLOUD_ENABLED) {
          const response = await fetch('/api/aventureiros', { cache: 'no-store' })
          if (!response.ok) throw new Error('Não foi possível consultar os perfis compartilhados.')
          const data = await response.json()
          if (active) setPerfil((Array.isArray(data.perfis) ? data.perfis : []).find((p: Perfil) => p.id === id) || null)
        } else {
          const list = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
          if (active) setPerfil(Array.isArray(list) ? list.find((p: Perfil) => p.id === id) || null : null)
        }
      } catch {
        if (active) setError('Não foi possível carregar o aventureiro. Tente novamente pelo portal.')
      } finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [params])

  const choose = (next: Section) => { setSection(next); setMenuOpen(false) }
  const cardClass = 'group rounded-2xl border border-[#55456e] bg-[#201a32]/90 p-5 text-left transition hover:-translate-y-0.5 hover:border-[#b79aff] hover:bg-[#2b2143] focus-visible:outline-2 focus-visible:outline-[#c5a7ff]'
  const sheetUrl = '/ficha-v8?personagem=' + encodeURIComponent(perfil?.id || '')

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#100d1c] text-[#e8dff7]">Carregando sua jornada...</main>
  if (!perfil) return <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#100d1c] px-5 text-center text-[#e8dff7]"><MoonStar size={48} className="text-[#bda0f5]" /><h1 className="text-2xl font-bold">Aventureiro não encontrado</h1><p className="text-[#bdb1ce]">{error || 'Selecione um perfil no portal para continuar.'}</p><Link href="/portal" className="rounded-xl bg-[#7853b4] px-5 py-3 font-semibold">Voltar aos perfis</Link></main>

  return (
    <main className="min-h-screen bg-[#100d1c] text-[#f2ebff]" style={{ backgroundImage: 'radial-gradient(ellipse at 85% 0%, #322044 0%, transparent 48%)' }}>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#4b3b62] bg-[#151123]/95 px-4 backdrop-blur lg:px-8">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg p-2 hover:bg-[#342749] lg:hidden" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button>
          <MoonStar className="text-[#c5a7ff] drop-shadow-[0_0_9px_#a76aff]" size={30} aria-hidden="true" />
          <span className="font-bold tracking-wide">PRG <span className="text-[#c5a7ff]">System</span></span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-[#d0c2df] sm:inline">{perfil.apelido}</span>
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#8d70b6] bg-[#342749] font-semibold text-[#d8c0ff]">
            {perfil.avatar ? <img src={perfil.avatar} alt="" className="h-full w-full object-cover" /> : perfil.apelido[0]?.toUpperCase()}
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1500px]">
        {menuOpen && <button className="fixed inset-0 z-20 bg-black/60 lg:hidden" aria-label="Fechar navegação" onClick={() => setMenuOpen(false)} />}
        <aside className={`fixed bottom-0 left-0 top-16 z-20 w-64 border-r border-[#48385e] bg-[#171225] p-4 lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)] ${menuOpen ? 'block' : 'hidden'}`}>
          <p className="mb-4 px-3 text-xs uppercase tracking-[.2em] text-[#aa8ecb]">Sua jornada</p>
          <nav aria-label="Navegação da Central" className="space-y-2">
            {navigation.map(item => <button key={item.id} type="button" onClick={() => choose(item.id)} aria-current={section === item.id ? 'page' : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${section === item.id ? 'border border-[#8b6cba] bg-[#38274e] text-white' : 'text-[#c9bdd9] hover:bg-[#2b213d]'}`}><item.icon size={19} aria-hidden="true" />{item.label}</button>)}
          </nav>
          <div className="mt-8 border-t border-[#49375f] pt-4">
            <Link href="/portal" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#cbb6e5] hover:bg-[#2b213d]"><UserRound size={19} />Trocar aventureiro</Link>
          </div>
        </aside>
        <div className="min-w-0 flex-1 px-4 py-8 sm:px-7 lg:px-10">
          {section === 'inicio' && <>
            <section className="relative overflow-hidden rounded-3xl border border-[#655079] bg-gradient-to-br from-[#302044] to-[#1b172b] p-6 shadow-[0_10px_40px_#09050b55] sm:p-9">
              <MoonStar className="absolute -right-3 -top-8 h-44 w-44 text-[#b89aff]/10" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#d3adf0]">Sua próxima aventura começa aqui</p>
              <h1 className="relative mt-3 text-2xl font-bold sm:text-4xl">Bem-vindo, {perfil.apelido}!</h1>
              <p className="relative mt-3 max-w-xl text-sm leading-relaxed text-[#cfc0df]">Suas histórias, personagens e campanhas em um só lugar. Escolha o próximo capítulo da sua jornada.</p>
            </section>
            <h2 className="mt-9 mb-4 text-xl font-bold">Explore sua central</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {navigation.filter(item => item.id !== 'inicio').map(item => <button type="button" key={item.id} onClick={() => choose(item.id)} className={cardClass}>
                <item.icon className="mb-5 text-[#c3a4f5]" size={30} aria-hidden="true" />
                <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{item.label}</h3><ChevronRight size={18} className="text-[#b69ad4]" /></div>
                <p className="mt-2 text-sm text-[#bfb2cf]">{item.id === 'fichas' ? 'Independentes e de campanhas' : item.id === 'campanhas' ? 'Entre ou crie uma aventura' : item.id === 'sistemas' ? 'Explore modelos de RPG' : 'Consulte suas rolagens'}</p>
                <p className="mt-4 text-xs text-[#a99bbb]">{item.id === 'fichas' ? 'Acesso à Ficha V8' : 'Em preparação'}</p>
              </button>)}
            </div>
          </>}
          {section === 'fichas' && <>
            <h1 className="text-3xl font-bold">Minhas fichas</h1><p className="mt-2 text-[#bfb2cf]">Seus personagens, organizados por tipo.</p>
            <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Tipos de ficha">
              {(['independentes', 'campanhas'] as const).map(tab => <button type="button" key={tab} role="tab" aria-selected={fichasTab === tab} onClick={() => setFichasTab(tab)} className={`rounded-xl px-5 py-3 text-sm font-semibold ${fichasTab === tab ? 'bg-[#7652ac] text-white' : 'border border-[#55456e] text-[#cfc0df]'}`}>{tab === 'independentes' ? 'Independentes' : 'Campanhas'}</button>)}
            </div>
            {fichasTab === 'independentes' ? <FichasIndependentes aventureiroId={perfil.id} /> : <section className="mt-5 rounded-2xl border border-[#55456e] bg-[#201a32] p-6"><h2 className="text-xl font-semibold">Fichas de campanhas</h2><p className="mt-2 text-sm text-[#c4b6d4]">Quando o módulo de campanhas estiver conectado, suas fichas atribuídas aparecerão aqui, separadas por aventura.</p></section>}
          </>}
          {section === 'campanhas' && <>
            <h1 className="text-3xl font-bold">Campanhas</h1><p className="mt-2 text-[#bfb2cf]">Prepare suas aventuras e defina as regras de edição das fichas.</p>
            <Campanhas aventureiroId={perfil.id} />
          </>}
          {section === 'sistemas' && <><h1 className="text-3xl font-bold">Sistemas de RPG</h1><p className="mt-2 text-[#bfb2cf]">Os modelos de fichas serão adicionados gradualmente.</p><div className="mt-6 rounded-2xl border border-[#55456e] bg-[#201a32] p-6"><h2 className="text-xl font-semibold">Lunethernnyis — Opositores</h2><p className="mt-2 text-sm text-[#c4b6d4]">A Ficha V8 existente continua disponível para uso.</p><Link href={sheetUrl} className="mt-4 inline-flex items-center text-[#c7a8ff] underline underline-offset-4">Abrir ficha atual <ChevronRight size={16} /></Link></div><p className="mt-5 text-sm text-[#bfb2cf]">D&D, Ordem Paranormal, Assimilação e outros sistemas: modelos ainda não implementados.</p></>}
          {section === 'historico' && <><h1 className="text-3xl font-bold">Histórico de rolagens</h1><p className="mt-2 text-[#bfb2cf]">Em breve, suas rolagens estarão organizadas por aventureiro e campanha.</p><div className="mt-6 rounded-2xl border border-[#55456e] bg-[#201a32] p-6 text-sm text-[#c4b6d4]">O histórico compartilhado ainda não está conectado. As rolagens existentes na Ficha V8 continuam disponíveis nela.</div><Link href={sheetUrl} className="mt-4 inline-flex items-center text-[#c7a8ff] underline underline-offset-4">Abrir Ficha V8 <ChevronRight size={16} /></Link></>}
        </div>
      </div>
    </main>
  )
}

export default function CentralAventureiro() {
  return <Suspense fallback={<main className="min-h-screen bg-[#100d1c]" />}><CentralContent /></Suspense>
}
