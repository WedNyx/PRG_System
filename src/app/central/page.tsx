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
import RolagensCampanhas from '@/components/central/RolagensCampanhas'
import CabecalhoSecao from '@/components/central/CabecalhoSecao'
import ContinuarJornada from '@/components/central/ContinuarJornada'
import Aparencia from '@/components/central/Aparencia'
import { aplicarVisual, limparVisual, type Visual } from '@/lib/visual'
import Sino from '@/components/Sino'
import { CHAVE_ENTRADA } from '@/components/perfil/TransicaoPerfil'
import { aplicarTema, TEMA_PADRAO, temaAtual, TEMAS, type Tema } from '@/lib/tema'
import { VERSOES } from '@/lib/versoes'

type Perfil = { id: string; apelido: string; avatar?: string; grupo?: string; visual?: unknown }
type Section = 'inicio' | 'fichas' | 'campanhas' | 'sistemas' | 'historico' | 'temas'
const SELECTED_KEY = 'prg-aventureiro-selecionado-v1'
const LOCAL_KEY = 'prg-aventureiros-demo-v1'
const CLOUD_ENABLED = process.env.NEXT_PUBLIC_PRG_SHARED_PROFILES === 'true'

const navigation: { id: Section; label: string; curto: string; descricao: string; icon: typeof House }[] = [
  { id: 'inicio', label: 'Início', curto: 'Início', descricao: 'Resumo e atalhos', icon: House },
  { id: 'fichas', label: 'Fichas', curto: 'Fichas', descricao: 'Seus personagens', icon: ScrollText },
  { id: 'campanhas', label: 'Campanhas', curto: 'Campanhas', descricao: 'Aventuras e mesa virtual', icon: Castle },
  { id: 'sistemas', label: 'Sistemas de RPG', curto: 'Sistemas', descricao: 'Criar ficha de um sistema', icon: BookOpen },
  { id: 'historico', label: 'Histórico', curto: 'Rolagens', descricao: 'Dados rolados nas mesas', icon: Dice5 },
]

/** Explicação curta de cada seção (cabeçalho + “Como funciona?”). */
const SECOES: Record<Exclude<Section, 'inicio'>, { icone: string; titulo: string; descricao: string; ajuda: string[] }> = {
  fichas: { icone: '📜', titulo: 'Minhas fichas', descricao: 'Todos os seus personagens. Abra uma ficha para editar, rolar dados e cuidar do inventário.', ajuda: [
    '“Avulsas” são fichas só suas, fora de campanha — boas para testar ou guardar personagens.',
    '“Em campanhas” são as fichas ligadas a uma aventura; o mestre pode aprovar mudanças nelas.',
    'Para criar uma ficha nova, vá em Sistemas de RPG e escolha o sistema.',
    'Dentro da ficha, toque em um atributo ou perícia para rolar o dado na hora.'] },
  campanhas: { icone: '🏰', titulo: 'Campanhas', descricao: 'Crie uma aventura como mestre ou entre na de alguém com um código de convite.', ajuda: [
    'Mestre: crie a campanha, escolha o sistema e gere um convite para os jogadores.',
    'Jogador: cole o código do convite; o mestre aprova seu pedido.',
    'Na campanha você define quem pode editar as fichas e acompanha os pedidos.',
    'O botão “Mesa” abre a mesa virtual: mapa, chat, dados, iniciativa e música.'] },
  sistemas: { icone: '📚', titulo: 'Sistemas de RPG', descricao: 'Escolha um sistema e crie uma ficha que calcula as regras sozinha.', ajuda: [
    'Toque em um sistema para ver o resumo das regras e o guia do mestre.',
    '“Criar ficha” abre uma ficha nova já com os campos daquele sistema.',
    'A ficha nasce avulsa; depois você pode levá-la para uma campanha.'] },
  historico: { icone: '🎲', titulo: 'Histórico de rolagens', descricao: 'Escolha a campanha para ver tudo o que foi rolado nas mesas, com filtros e o resumo da sessão.', ajuda: [
    'Filtre por pessoa, personagem, tipo (dados, ataques, mensagens) e período.',
    '“Só críticos” e “Só falhas” mostram os 20 e os 1 naturais.',
    'O resumo mostra rolagens, acertos, maior dano e a média de d20 de cada um.',
    'Rolagens feitas em fichas fora de campanha não ficam salvas.'] },
  temas: { icone: '🎨', titulo: 'Aparência', descricao: 'Deixe a plataforma do seu jeito: tema, foto de fundo, cores, cartões e letras.', ajuda: [
    'Escolha um tema: cada um muda o fundo e as cores da plataforma inteira.',
    'Em “Foto de fundo”, use uma imagem da sua galeria; dá para escurecer e desfocar para o texto ler bem.',
    'A cor principal pinta botões e destaques; a dos cartões pinta os quadros. “Do tema” volta ao normal.',
    'Tudo muda na hora e fica salvo no seu perfil — vale no celular e no computador.'] },
}

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
          const achado: Perfil | null = (Array.isArray(data.perfis) ? data.perfis : []).find((p: Perfil) => p.id === id) || null
          // Aparência salva no perfil: aplica e guarda a cópia local (as outras páginas usam a cópia antes de desenhar).
          if (achado && achado.visual !== undefined) { const v = limparVisual(achado.visual); aplicarVisual(achado.id, v); if (v.tema) setTema(v.tema) }
          if (active) setPerfil(achado)
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
  const itemMenu = 'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-(--a-cbb6e5) hover:bg-(--s-2b213d)'
  const cardClass = 'group rounded-2xl border border-(--a-55456e) bg-(--s-201a32)/90 p-4 sm:p-5 text-left transition hover:-translate-y-0.5 hover:border-(--a-b79aff) hover:bg-(--s-2b2143) focus-visible:outline-2 focus-visible:outline-(--a-c5a7ff)'

  if (loading) return <main className="flex min-h-screen items-center justify-center fundo-tema text-(--a-e8dff7)">Carregando sua jornada...</main>
  if (!perfil) return <main className="flex min-h-screen flex-col items-center justify-center gap-4 fundo-tema px-5 text-center text-(--a-e8dff7)"><MoonStar size={48} className="text-(--a-bda0f5)" /><h1 className="text-2xl font-bold">Aventureiro não encontrado</h1><p className="text-(--a-bdb1ce)">{error || 'Selecione um perfil no portal para continuar.'}</p><Link href="/portal" className="rounded-xl bg-(--a-7853b4) px-5 py-3 font-semibold">Voltar aos perfis</Link></main>

  return (
    <main className={'min-h-screen fundo-tema text-(--a-f2ebff)' + (entrada ? ' prg-entrada' : '')}>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-(--a-4b3b62) bg-(--s-151123)/95 px-4 backdrop-blur lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg p-2 hover:bg-(--s-342749) lg:hidden" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button>
          <LuaLogo />
          <span className="whitespace-nowrap text-sm font-bold tracking-wide sm:text-base">PRG <span className="text-(--a-c5a7ff)">System</span></span>
        </div>
        <div className="flex items-center gap-2 text-sm sm:gap-3">
          <Sino />
          <Link href="/guia" className="inline-flex items-center gap-1.5 rounded-full border border-(--a-8d70b6) px-3 py-1.5 text-(--a-e4d3ff) hover:bg-(--s-342749)" title="Guia da plataforma"><CircleHelp size={18} aria-hidden="true" /><span>Guia</span></Link>
          <span className="hidden text-(--a-d0c2df) sm:inline">{perfil.apelido}</span>
          <button type="button" onClick={() => CLOUD_ENABLED && setEditando(true)} disabled={!CLOUD_ENABLED} aria-label="Editar perfil" title={CLOUD_ENABLED ? 'Editar perfil' : perfil.apelido} className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-(--a-8d70b6) bg-(--s-342749) font-semibold text-(--a-d8c0ff)">
            {perfil.avatar ? <img src={perfil.avatar} alt="" className="h-full w-full object-cover" /> : perfil.apelido[0]?.toUpperCase()}
          </button>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1500px]">
        {menuOpen && <button className="fixed inset-0 z-20 bg-black/60 lg:hidden" aria-label="Fechar navegação" onClick={() => setMenuOpen(false)} />}
        <aside className={`fixed bottom-0 left-0 top-16 z-20 w-72 overflow-y-auto border-r border-(--a-48385e) bg-(--s-171225)/95 p-4 pb-24 backdrop-blur lg:pb-4 lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)] lg:w-64 ${menuOpen ? 'block' : 'hidden'}`}>
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-(--a-4b3b62) bg-gradient-to-br from-(--s-2b1f40) to-(--s-1b1629) p-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-(--a-8d70b6) bg-(--s-342749) font-semibold text-(--a-d8c0ff)">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {perfil.avatar ? <img src={perfil.avatar} alt="" className="h-full w-full object-cover" /> : perfil.apelido[0]?.toUpperCase()}</span>
            <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{perfil.apelido}</span><span className="block truncate text-[11px] text-(--a-aa8ecb)">{perfil.grupo || 'Aventureiro'}</span></span>
          </div>
          <p className="mb-2 px-3 text-[11px] uppercase tracking-[.2em] text-(--a-aa8ecb)">Sua jornada</p>
          <nav aria-label="Navegação da Central" className="space-y-1">
            {navigation.map(item => { const ativo = section === item.id
              return <button key={item.id} type="button" onClick={() => choose(item.id)} aria-current={ativo ? 'page' : undefined} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${ativo ? 'border-(--a-8b6cba) bg-(--s-38274e) text-white shadow-[inset_3px_0_0_#c5a7ff]' : 'border-transparent text-(--a-c9bdd9) hover:bg-(--s-2b213d)'}`}>
                <item.icon size={19} aria-hidden="true" className={ativo ? 'text-(--a-e4d3ff)' : 'text-(--a-a98fd0)'} />
                <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.label}</span><span className="block truncate text-[11px] text-(--a-9f93b5)" aria-hidden="true">{item.descricao}</span></span>
              </button> })}
          </nav>
          <p className="mb-2 mt-6 px-3 text-[11px] uppercase tracking-[.2em] text-(--a-aa8ecb)">Conta</p>
          <div className="space-y-1">
            {CLOUD_ENABLED && <button type="button" onClick={() => { setEditando(true); setMenuOpen(false) }} className={itemMenu}><Pencil size={18} />Editar perfil</button>}
            <button type="button" onClick={() => choose('temas')} aria-current={section === 'temas' ? 'page' : undefined} className={itemMenu + (section === 'temas' ? ' border border-(--a-8b6cba) bg-(--s-38274e) text-white' : '')}><Palette size={18} /><span className="min-w-0 flex-1 truncate">Aparência · {TEMAS.find(t => t.id === tema)?.nome}</span></button>
            <Link href="/portal" className={itemMenu}><UserRound size={18} />Trocar aventureiro</Link>
          </div>
          <p className="mb-2 mt-6 px-3 text-[11px] uppercase tracking-[.2em] text-(--a-aa8ecb)">Ajuda</p>
          <div className="space-y-1">
            <Link href="/guia" className={itemMenu}><CircleHelp size={18} />Guia da plataforma</Link>
            <Link href="/tutorial" className={itemMenu}><GraduationCap size={18} />Tutoriais práticos</Link>
            <Link href="/novidades" className={itemMenu}><Sparkles size={18} /><span className="flex-1">Novidades</span><span className="rounded-full bg-(--s-3a2c58) px-2 py-0.5 text-[10px] text-(--a-e4d3ff)">v{VERSOES[0].versao}</span></Link>
          </div>
        </aside>
        <div className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-7 lg:px-10 lg:pb-10 lg:pt-8">
          {section === 'inicio' && <>
            <section className="relative overflow-hidden rounded-3xl border border-(--a-655079) bg-gradient-to-br from-(--s-302044) to-(--s-1b172b) p-6 shadow-[0_10px_40px_#09050b55] sm:p-9">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[.22em] text-(--a-d3adf0)">Sua próxima aventura começa aqui</p>
                  <h1 className="relative mt-3 text-2xl font-bold sm:text-4xl">Bem-vindo, {perfil.apelido}!</h1>
                  <p className="relative mt-3 max-w-xl text-sm leading-relaxed text-(--a-cfc0df)">Suas histórias, personagens e campanhas em um só lugar. Escolha o próximo capítulo da sua jornada.</p>
                  <p className="relative mt-3 max-w-xl text-sm italic text-(--a-e9d6ff)"><FraseDaLua /></p>
                </div>
              </div>
            </section>
            {CLOUD_ENABLED && <ComecePorAqui perfilId={perfil.id} abrirPerfil={() => setEditando(true)} irPara={choose} />}
            {CLOUD_ENABLED && <ContinuarJornada aventureiroId={perfil.id} />}
            <h2 className="mb-1 mt-9 text-xl font-bold">Explore sua central</h2>
            <p className="mb-4 text-sm text-(--a-bfb2cf)">Cada parte da Central tem um “Como funciona?” logo abaixo do título.</p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              {navigation.filter(item => item.id !== 'inicio').map(item => { const info = SECOES[item.id as Exclude<Section, 'inicio'>]
                return <button type="button" key={item.id} onClick={() => choose(item.id)} className={cardClass}>
                  <span className="mb-3 flex h-11 w-11 items-center sm:mb-4 sm:h-12 sm:w-12 justify-center rounded-2xl border border-(--a-6d5690) bg-gradient-to-br from-(--s-3a2a5c) to-(--s-211a35) text-2xl" aria-hidden="true">{info.icone}</span>
                  <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{item.label}</h3><ChevronRight size={18} className="text-(--a-b69ad4) transition group-hover:translate-x-0.5" /></div>
                  <p className="mt-1.5 text-xs text-(--a-bfb2cf) sm:mt-2 sm:text-sm"><span className="sm:hidden">{item.descricao}</span><span className="hidden sm:inline">{info.descricao}</span></p>
                </button> })}
            </div>
          </>}
          {section !== 'inicio' && <CabecalhoSecao {...SECOES[section]} />}
          {section === 'fichas' && <>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Tipos de ficha">
              {(['independentes', 'campanhas'] as const).map(tab => <button type="button" key={tab} role="tab" aria-selected={fichasTab === tab} onClick={() => setFichasTab(tab)} className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${fichasTab === tab ? 'bg-(--a-7652ac) text-white shadow-[0_4px_16px_#7652ac55]' : 'border border-(--a-55456e) text-(--a-cfc0df) hover:bg-(--s-2b213d)'}`}>{tab === 'independentes' ? '🧙 Avulsas' : '🏰 Em campanhas'}</button>)}
            </div>
            <p className="mt-2 text-xs text-(--a-a99bbb)">{fichasTab === 'independentes' ? 'Fichas só suas, fora de qualquer campanha.' : 'Fichas ligadas às suas aventuras, separadas por campanha.'}</p>
            {fichasTab === 'independentes' ? <FichasIndependentes aventureiroId={perfil.id} /> : CLOUD_ENABLED ? <FichasNuvem aventureiroId={perfil.id} tipo="campanhas" /> : <section className="mt-5 rounded-2xl border border-(--a-55456e) bg-(--s-201a32) p-6"><h2 className="text-xl font-semibold">Fichas de campanhas</h2><p className="mt-2 text-sm text-(--a-c4b6d4)">Quando o módulo de campanhas estiver conectado, suas fichas atribuídas aparecerão aqui, separadas por aventura.</p></section>}
          </>}
          {section === 'campanhas' && <Campanhas aventureiroId={perfil.id} abrirCampanha={params.get('campanha')} />}
          {section === 'temas' && <Aparencia perfilId={perfil.id} inicial={limparVisual(perfil.visual)} tema={tema} escolherTema={escolherTema} salvo={(v: Visual) => setPerfil(p => p && { ...p, visual: v })} />}
          {section === 'sistemas' && <SistemasGaleria aventureiroId={perfil.id} />}
          {section === 'historico' && CLOUD_ENABLED && <RolagensCampanhas />}
        </div>
      </div>
      <nav aria-label="Atalhos da Central" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-(--a-4b3b62) bg-(--s-151123)/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {navigation.map(item => { const ativo = section === item.id
          return <button key={item.id} type="button" onClick={() => choose(item.id)} aria-current={ativo ? 'page' : undefined} className={'flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition ' + (ativo ? 'text-white' : 'text-(--a-a99bbb)')}>
            <span className={'flex h-7 w-12 items-center justify-center rounded-full transition ' + (ativo ? 'bg-(--s-4a3470)' : '')}><item.icon size={18} aria-hidden="true" /></span>{item.curto}</button> })}
      </nav>
      {editando && <EditarPerfil perfil={perfil} fechar={() => setEditando(false)} salvo={p => setPerfil(antes => ({ ...antes, id: p.id, apelido: p.apelido, avatar: p.avatar ?? undefined, grupo: p.grupo }))} />}
    </main>
  )
}

export default function CentralAventureiro() {
  return <Suspense fallback={<main className="min-h-screen fundo-tema" />}><CentralContent /></Suspense>
}
