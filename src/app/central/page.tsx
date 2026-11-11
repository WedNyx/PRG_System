'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import FichasIndependentes from '@/components/central/FichasIndependentes'
import Campanhas from '@/components/central/Campanhas'
import FichasNuvem from '@/components/central/FichasNuvem'
import SistemasGaleria from '@/components/central/SistemasGaleria'
import { BookOpen, Castle, ChevronRight, CircleHelp, GraduationCap, Dice5, House, Menu, MoonStar, Palette, Pencil, ScrollText, Sparkles, UserRound, X } from 'lucide-react'
import EditarPerfil from '@/components/perfil/EditarPerfil'
import LuaLogo, { FraseDaLua } from '@/components/LuaDinamica'
import ComecePorAqui from '@/components/central/ComecePorAqui'
import Sino from '@/components/Sino'
import { CHAVE_ENTRADA } from '@/components/perfil/TransicaoPerfil'
import { aplicarTema, TEMA_PADRAO, temaAtual, TEMAS, type Tema } from '@/lib/tema'
import { VERSOES } from '@/lib/versoes'

type Perfil = { id: string; apelido: string; avatar?: string; grupo?: string }
type Section = 'inicio' | 'fichas' | 'campanhas' | 'sistemas' | 'historico' | 'temas'
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
  // Links diretos (ex.: avisos): /central?secao=campanhas&campanha=<id>
  const [section, setSection] = useState<Section>(() => { const s = params.get('secao'); return s && ['inicio', 'fichas', 'campanhas', 'sistemas', 'historico', 'temas'].includes(s) ? s as Section : 'inicio' })
  const [fichasTab, setFichasTab] = useState<'independentes' | 'campanhas'>('independentes')
  const [menuOpen, setMenuOpen] = useState(false)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editando, setEditando] = useState(false)
  // Veio da animação do portal? Então a Central “aparece” suavemente.
  const [entrada] = useState(() => { try { const v = sessionStorage.getItem(CHAVE_ENTRADA) === '1'; sessionStorage.removeItem(CHAVE_ENTRADA); return v } catch { return false } })
  const [tema, setTema] = useState<Tema>(TEMA_PADRAO)
  useEffect(() => { setTema(temaAtual()) }, []) // eslint-disable-line react-hooks/set-state-in-effect
  const escolherTema = (t: Tema) => { aplicarTema(t); setTema(t) }

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

  if (loading) return <main className="flex min-h-screen items-center justify-center fundo-tema text-[#e8dff7]">Carregando sua jornada...</main>
  if (!perfil) return <main className="flex min-h-screen flex-col items-center justify-center gap-4 fundo-tema px-5 text-center text-[#e8dff7]"><MoonStar size={48} className="text-[#bda0f5]" /><h1 className="text-2xl font-bold">Aventureiro não encontrado</h1><p className="text-[#bdb1ce]">{error || 'Selecione um perfil no portal para continuar.'}</p><Link href="/portal" className="rounded-xl bg-[#7853b4] px-5 py-3 font-semibold">Voltar aos perfis</Link></main>

  return (
    <main className={'min-h-screen fundo-tema text-[#f2ebff]' + (entrada ? ' prg-entrada' : '')}>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#4b3b62] bg-[#151123]/95 px-4 backdrop-blur lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg p-2 hover:bg-[#342749] lg:hidden" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button>
          <LuaLogo />
          <span className="whitespace-nowrap text-sm font-bold tracking-wide sm:text-base">PRG <span className="text-[#c5a7ff]">System</span></span>
        </div>
        <div className="flex items-center gap-2 text-sm sm:gap-3">
          <Sino />
          <Link href="/guia" className="inline-flex items-center gap-1.5 rounded-full border border-[#8d70b6] px-3 py-1.5 text-[#e4d3ff] hover:bg-[#342749]" title="Guia da plataforma"><CircleHelp size={18} aria-hidden="true" /><span>Guia</span></Link>
          <span className="hidden text-[#d0c2df] sm:inline">{perfil.apelido}</span>
          <button type="button" onClick={() => CLOUD_ENABLED && setEditando(true)} disabled={!CLOUD_ENABLED} aria-label="Editar perfil" title={CLOUD_ENABLED ? 'Editar perfil' : perfil.apelido} className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#8d70b6] bg-[#342749] font-semibold text-[#d8c0ff]">
            {perfil.avatar ? <img src={perfil.avatar} alt="" className="h-full w-full object-cover" /> : perfil.apelido[0]?.toUpperCase()}
          </button>
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
            {CLOUD_ENABLED && <button type="button" onClick={() => { setEditando(true); setMenuOpen(false) }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-[#cbb6e5] hover:bg-[#2b213d]"><Pencil size={19} />Editar perfil</button>}
            <Link href="/portal" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#cbb6e5] hover:bg-[#2b213d]"><UserRound size={19} />Trocar aventureiro</Link>
            <button type="button" onClick={() => choose('temas')} aria-current={section === 'temas' ? 'page' : undefined} className={'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm hover:bg-[#2b213d] ' + (section === 'temas' ? 'border border-[#8b6cba] bg-[#38274e] text-white' : 'text-[#cbb6e5]')}><Palette size={19} /><span className="min-w-0 flex-1 truncate">Temas · {TEMAS.find(t => t.id === tema)?.nome}</span></button>
            <Link href="/guia" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#cbb6e5] hover:bg-[#2b213d]"><CircleHelp size={19} />Guia da plataforma</Link>
            <Link href="/tutorial" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#cbb6e5] hover:bg-[#2b213d]"><GraduationCap size={19} />Tutoriais práticos</Link>
            <Link href="/novidades" className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#cbb6e5] hover:bg-[#2b213d]"><Sparkles size={19} />Novidades · v{VERSOES[0].versao}</Link>
          </div>
        </aside>
        <div className="min-w-0 flex-1 px-4 py-8 sm:px-7 lg:px-10">
          {section === 'inicio' && <>
            <section className="relative overflow-hidden rounded-3xl border border-[#655079] bg-gradient-to-br from-[#302044] to-[#1b172b] p-6 shadow-[0_10px_40px_#09050b55] sm:p-9">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#d3adf0]">Sua próxima aventura começa aqui</p>
                  <h1 className="relative mt-3 text-2xl font-bold sm:text-4xl">Bem-vindo, {perfil.apelido}!</h1>
                  <p className="relative mt-3 max-w-xl text-sm leading-relaxed text-[#cfc0df]">Suas histórias, personagens e campanhas em um só lugar. Escolha o próximo capítulo da sua jornada.</p>
                  <p className="relative mt-3 max-w-xl text-sm italic text-[#e9d6ff]"><FraseDaLua /></p>
                </div>
              </div>
            </section>
            {CLOUD_ENABLED && <ComecePorAqui perfilId={perfil.id} abrirPerfil={() => setEditando(true)} irPara={choose} />}
            <h2 className="mt-9 mb-4 text-xl font-bold">Explore sua central</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {navigation.filter(item => item.id !== 'inicio').map(item => <button type="button" key={item.id} onClick={() => choose(item.id)} className={cardClass}>
                <item.icon className="mb-5 text-[#c3a4f5]" size={30} aria-hidden="true" />
                <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{item.label}</h3><ChevronRight size={18} className="text-[#b69ad4]" /></div>
                <p className="mt-2 text-sm text-[#bfb2cf]">{item.id === 'fichas' ? 'Independentes e de campanhas' : item.id === 'campanhas' ? 'Entre ou crie uma aventura' : item.id === 'sistemas' ? 'D&D, Pathfinder, Fate, Tormenta20 e mais' : 'Consulte suas rolagens'}</p>
                <p className="mt-4 text-xs text-[#a99bbb]">{item.id === 'fichas' ? 'Personagens de todos os sistemas' : item.id === 'campanhas' ? 'Convites, mesa virtual e música' : item.id === 'sistemas' ? 'Com guia do mestre' : 'Rolagens no histórico de cada mesa'}</p>
              </button>)}
            </div>
          </>}
          {section === 'fichas' && <>
            <h1 className="text-3xl font-bold">Minhas fichas</h1><p className="mt-2 text-[#bfb2cf]">Seus personagens, organizados por tipo.</p>
            <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Tipos de ficha">
              {(['independentes', 'campanhas'] as const).map(tab => <button type="button" key={tab} role="tab" aria-selected={fichasTab === tab} onClick={() => setFichasTab(tab)} className={`rounded-xl px-5 py-3 text-sm font-semibold ${fichasTab === tab ? 'bg-[#7652ac] text-white' : 'border border-[#55456e] text-[#cfc0df]'}`}>{tab === 'independentes' ? 'Independentes' : 'Campanhas'}</button>)}
            </div>
            {fichasTab === 'independentes' ? <FichasIndependentes aventureiroId={perfil.id} /> : CLOUD_ENABLED ? <FichasNuvem aventureiroId={perfil.id} tipo="campanhas" /> : <section className="mt-5 rounded-2xl border border-[#55456e] bg-[#201a32] p-6"><h2 className="text-xl font-semibold">Fichas de campanhas</h2><p className="mt-2 text-sm text-[#c4b6d4]">Quando o módulo de campanhas estiver conectado, suas fichas atribuídas aparecerão aqui, separadas por aventura.</p></section>}
          </>}
          {section === 'campanhas' && <>
            <h1 className="text-3xl font-bold">Campanhas</h1><p className="mt-2 text-[#bfb2cf]">Prepare suas aventuras e defina as regras de edição das fichas.</p>
            <Campanhas aventureiroId={perfil.id} abrirCampanha={params.get('campanha')} />
          </>}
          {section === 'temas' && <EscolherTema tema={tema} escolher={escolherTema} />}
          {section === 'sistemas' && <><h1 className="text-3xl font-bold">Sistemas de RPG</h1><p className="mt-2 text-[#bfb2cf]">Escolha um sistema e crie uma ficha que calcula as regras sozinha.</p><SistemasGaleria aventureiroId={perfil.id} /></>}
          {section === 'historico' && <><h1 className="text-3xl font-bold">Histórico de rolagens</h1><p className="mt-2 text-[#bfb2cf]">Onde encontrar suas rolagens.</p><div className="mt-6 rounded-2xl border border-[#55456e] bg-[#201a32] p-6 text-sm text-[#c4b6d4]">As rolagens das campanhas ficam salvas no histórico da mesa: abra a campanha, entre na mesa e toque em “Histórico” no chat (dá para filtrar por pessoa, personagem e tipo). Rolagens feitas em fichas fora de campanha não entram nesse histórico.</div></>}
        </div>
      </div>
      {editando && <EditarPerfil perfil={perfil} fechar={() => setEditando(false)} salvo={p => setPerfil({ id: p.id, apelido: p.apelido, avatar: p.avatar ?? undefined, grupo: p.grupo })} />}
    </main>
  )
}

export default function CentralAventureiro() {
  return <Suspense fallback={<main className="min-h-screen fundo-tema" />}><CentralContent /></Suspense>
}

/** Aba “Temas”: cada cartão mostra a cara do tema; tocar já aplica (só neste aparelho). */
function EscolherTema({ tema, escolher }: { tema: Tema; escolher: (t: Tema) => void }) {
  return <>
    <h1 className="text-3xl font-bold">🎨 Temas</h1>
    <p className="mt-2 text-[#bfb2cf]">Escolha o fundo da plataforma. Cada tema tem uma versão para celular (em pé) e outra para computador (deitada). A escolha vale para este aparelho.</p>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {TEMAS.map(t => { const ativo = t.id === tema
        return <button key={t.id} type="button" onClick={() => escolher(t.id)} aria-pressed={ativo}
          className={'group overflow-hidden rounded-2xl border-2 text-left transition hover:-translate-y-0.5 ' + (ativo ? 'border-[#e4d3ff] shadow-[0_0_24px_#9b7bff66]' : 'border-[#48385e] hover:border-[#8b6cba]')}>
          <span className="relative block h-32 w-full" style={{ background: t.mini }}>
            {ativo && <span className="absolute right-2 top-2 rounded-full bg-[#7853b4] px-2.5 py-1 text-xs font-bold text-white shadow">✓ Em uso</span>}
            <span className="absolute inset-x-3 bottom-3 rounded-lg border border-white/10 bg-[#201a32]/85 px-2.5 py-1.5 text-[11px] text-[#e4d3ff] backdrop-blur-sm">Prévia de um cartão da plataforma</span>
          </span>
          <span className="block bg-[#201a32]/95 p-3"><span className="block font-semibold">{t.nome}</span><span className="block text-xs text-[#bfb2cf]">{t.descricao}</span></span>
        </button> })}
    </div>
  </>
}
