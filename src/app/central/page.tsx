'use client'

import CantoDaPlataforma from '@/components/CantoDaPlataforma'
import Moldura from '@/components/perfil/Moldura'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import FichasIndependentes from '@/components/central/FichasIndependentes'
import Campanhas from '@/components/central/Campanhas'
import FichasNuvem from '@/components/central/FichasNuvem'
import SistemasGaleria from '@/components/central/SistemasGaleria'
import { Castle, ChevronRight, CircleHelp, House, MoonStar, PanelLeftClose, PanelLeftOpen, Plus, ScrollText, Search, UserRound, Wrench } from 'lucide-react'
import EditarPerfil from '@/components/perfil/EditarPerfil'
import LuaLogo, { FraseDaLua } from '@/components/LuaDinamica'
import ComecePorAqui from '@/components/central/ComecePorAqui'
import CabecalhoSecao from '@/components/central/CabecalhoSecao'
import ContinuarJornada from '@/components/central/ContinuarJornada'
import BuscaUniversal, { type ItemBusca } from '@/components/central/BuscaUniversal'
import Ferramentas, { listaFerramentas } from '@/components/central/Ferramentas'
import PerfilConfig, { ABAS_PERFIL, type AbaPerfil } from '@/components/central/PerfilConfig'
import { aplicarVisual, limparVisual, type Visual } from '@/lib/visual'
import Sino from '@/components/Sino'
import { CHAVE_ENTRADA } from '@/components/perfil/TransicaoPerfil'
import { aplicarTema, TEMA_PADRAO, temaAtual, type Tema } from '@/lib/tema'

type Perfil = { id: string; apelido: string; avatar?: string; grupo?: string; visual?: unknown; usuario?: string }
/** Os cinco destinos da Central (v0.36.5). */
type Destino = 'inicio' | 'personagens' | 'campanhas' | 'ferramentas' | 'perfil'
type AbaPersonagens = 'avulsas' | 'campanhas' | 'criar'
type AbaFerramentas = 'todas' | 'rolagens'
const SELECTED_KEY = 'prg-aventureiro-selecionado-v1'
const LOCAL_KEY = 'prg-aventureiros-demo-v1'
const CHAVE_LATERAL = 'prg-central-lateral-v1'
const CLOUD_ENABLED = process.env.NEXT_PUBLIC_PRG_SHARED_PROFILES === 'true'

const DESTINOS: { id: Destino; nome: string; descricao: string; icon: typeof House }[] = [
  { id: 'inicio', nome: 'Início', descricao: 'Resumo e atalhos', icon: House },
  { id: 'personagens', nome: 'Personagens', descricao: 'Fichas e criação', icon: ScrollText },
  { id: 'campanhas', nome: 'Campanhas', descricao: 'Mesas e convites', icon: Castle },
  { id: 'ferramentas', nome: 'Ferramentas', descricao: 'Dados, sistemas e ajuda', icon: Wrench },
  { id: 'perfil', nome: 'Meu perfil', descricao: 'Aparência e preferências', icon: UserRound },
]

const SECOES: Record<Exclude<Destino, 'inicio'>, { icone: string; titulo: string; descricao: string; ajuda: string[] }> = {
  personagens: { icone: '📜', titulo: 'Personagens', descricao: 'Suas fichas avulsas e de campanha, e a criação de personagens novos.', ajuda: [
    '“Avulsas” são fichas só suas, fora de campanha — boas para testar ou guardar personagens.',
    '“Em campanhas” são as fichas ligadas a uma aventura; o mestre pode aprovar mudanças nelas.',
    '“Criar ficha” mostra os sistemas: escolha um e a ficha já vem com os campos dele.',
    'Na ficha, escolha o modo: 🎲 Jogo, ✏️ Criação ou 📖 Consulta.'] },
  campanhas: { icone: '🏰', titulo: 'Campanhas', descricao: 'Crie uma aventura como mestre ou entre na de alguém com um código de convite.', ajuda: [
    'Mestre: crie a campanha, escolha o sistema e gere um convite para os jogadores.',
    'Jogador: cole o código do convite; o mestre aprova seu pedido.',
    'Na campanha você define quem pode editar as fichas e acompanha os pedidos.',
    'O botão “Mesa” abre a mesa virtual: mapa, chat, dados, iniciativa, música e Mesa de Som.'] },
  ferramentas: { icone: '🧰', titulo: 'Ferramentas', descricao: 'Histórico de rolagens, sistemas, ferramentas do mestre e ajuda — tudo num lugar.', ajuda: [
    'Use a 🔎 busca (ou Ctrl+K) para achar qualquer ferramenta, ficha ou campanha.',
    'O histórico mostra tudo o que foi rolado em cada campanha, com filtros.',
    'A Mesa de Som fica dentro da mesa, em Música › Mesa de som.'] },
  perfil: { icone: '🧙', titulo: 'Meu perfil', descricao: 'Aparência, jogo, avisos e privacidade separados por assunto.', ajuda: [
    'Aparência fica salva no perfil e vale em qualquer aparelho.',
    'Jogabilidade e Notificações valem para este aparelho (ex.: som no computador, silêncio no celular).',
    'Em Dados e privacidade ficam a senha do perfil e a opção de apagar o perfil.'] },
}

function lerDestino(p: URLSearchParams): { destino: Destino; personagens: AbaPersonagens; ferramentas: AbaFerramentas; perfil: AbaPerfil } {
  const s = p.get('secao'), aba = p.get('aba')
  const r = { destino: 'inicio' as Destino, personagens: 'avulsas' as AbaPersonagens, ferramentas: 'todas' as AbaFerramentas, perfil: 'aparencia' as AbaPerfil }
  // Nomes antigos (avisos e links salvos de antes da v0.36.5) continuam funcionando.
  if (s === 'fichas' || s === 'personagens') { r.destino = 'personagens'; if (aba === 'campanhas' || aba === 'criar') r.personagens = aba }
  else if (s === 'sistemas') { r.destino = 'personagens'; r.personagens = 'criar' }
  else if (s === 'campanhas') r.destino = 'campanhas'
  else if (s === 'historico') { r.destino = 'ferramentas'; r.ferramentas = 'rolagens' }
  else if (s === 'ferramentas') { r.destino = 'ferramentas'; if (aba === 'rolagens') r.ferramentas = 'rolagens' }
  else if (s === 'temas') { r.destino = 'perfil'; r.perfil = 'aparencia' }
  else if (s === 'perfil') { r.destino = 'perfil'; if (ABAS_PERFIL.some(a => a.id === aba)) r.perfil = aba as AbaPerfil }
  return r
}

function CentralContent() {
  const params = useSearchParams()
  const [inicio] = useState(() => lerDestino(params))
  const [destino, setDestino] = useState<Destino>(inicio.destino)
  const [abaPersonagens, setAbaPersonagens] = useState<AbaPersonagens>(inicio.personagens)
  const [abaFerramentas, setAbaFerramentas] = useState<AbaFerramentas>(inicio.ferramentas)
  const [abaPerfil, setAbaPerfil] = useState<AbaPerfil>(inicio.perfil)
  const [recolhida, setRecolhida] = useState(() => { try { return localStorage.getItem(CHAVE_LATERAL) === '1' } catch { return false } })
  const [buscando, setBuscando] = useState(false)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editando, setEditando] = useState(false)
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

  // Ctrl+K / ⌘K ou “/” abrem a busca (o “/” não vale enquanto se digita num campo).
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const digitando = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))
      if ((e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !digitando && !e.ctrlKey && !e.metaKey)) { e.preventDefault(); setBuscando(true) }
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [])

  const ir = useCallback((d: Destino) => { setDestino(d); window.scrollTo({ top: 0 }) }, [])
  const fecharBusca = useCallback(() => setBuscando(false), [])
  const alternarLateral = () => setRecolhida(r => { try { localStorage.setItem(CHAVE_LATERAL, r ? '0' : '1') } catch { /* sem espaço */ } return !r })
  const ferramentas = useMemo(() => listaFerramentas({
    rolagens: () => { setAbaFerramentas('rolagens'); ir('ferramentas') },
    sistemas: () => { setAbaPersonagens('criar'); ir('personagens') },
    aparencia: () => { setAbaPerfil('aparencia'); ir('perfil') },
    campanhas: () => ir('campanhas'),
  }), [ir])
  const fixosBusca = useMemo<ItemBusca[]>(() => [
    ...DESTINOS.map(d => ({ id: 'dest-' + d.id, titulo: d.nome, sub: d.descricao, icone: { inicio: '🏠', personagens: '📜', campanhas: '🏰', ferramentas: '🧰', perfil: '🧙' }[d.id], grupo: 'Ir para', acao: () => ir(d.id) })),
    { id: 'criar-ficha', titulo: 'Criar ficha', sub: 'Escolher um sistema e criar um personagem', icone: '➕', grupo: 'Ir para', acao: () => { setAbaPersonagens('criar'); ir('personagens') }, palavras: 'novo personagem sistema' },
    ...ferramentas.map(f => ({ id: 'ferr-' + f.id, titulo: f.nome, sub: f.descricao, icone: f.icone, grupo: 'Ferramentas', href: f.href, acao: f.acao, palavras: f.palavras })),
    ...ABAS_PERFIL.map(a => ({ id: 'perfil-' + a.id, titulo: a.nome, sub: 'Meu perfil', icone: a.icone, grupo: 'Configurações', acao: () => { setAbaPerfil(a.id); ir('perfil') }, palavras: a.palavras })),
  ], [ferramentas, ir])

  if (loading) return <main className="flex min-h-screen items-center justify-center fundo-tema text-(--a-e8dff7)">Carregando sua jornada...</main>
  if (!perfil) return <main className="flex min-h-screen flex-col items-center justify-center gap-4 fundo-tema px-5 text-center text-(--a-e8dff7)"><MoonStar size={48} className="text-(--a-bda0f5)" /><h1 className="text-2xl font-bold">Aventureiro não encontrado</h1><p className="text-(--a-bdb1ce)">{error || 'Selecione um perfil no portal para continuar.'}</p><Link href="/portal" className="rounded-xl bg-(--a-7853b4) px-5 py-3 font-semibold">Voltar aos perfis</Link></main>

  const cardClass = 'group rounded-2xl border border-(--a-55456e) bg-(--s-201a32)/90 p-4 sm:p-5 text-left transition hover:-translate-y-0.5 hover:border-(--a-b79aff) hover:bg-(--s-2b2143) focus-visible:outline-2 focus-visible:outline-(--a-c5a7ff)'
  const avatar = (classe: string) => <Moldura id={limparVisual(perfil.visual).moldura}><span className={'flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-(--ouro) bg-(--s-342749) font-semibold text-(--a-d8c0ff) ' + classe}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {perfil.avatar ? <img src={perfil.avatar} alt="" className="h-full w-full object-cover" /> : perfil.apelido[0]?.toUpperCase()}</span></Moldura>

  return (
    <main className={'min-h-screen fundo-tema text-(--a-f2ebff)' + (entrada ? ' prg-entrada' : '')}>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-(--a-4b3b62) bg-(--s-151123)/95 px-3 backdrop-blur sm:gap-3 lg:px-5">
        <button type="button" onClick={alternarLateral} aria-label={recolhida ? 'Abrir o menu lateral' : 'Recolher o menu lateral'} title={recolhida ? 'Abrir o menu lateral' : 'Recolher o menu lateral'}
          className="hidden rounded-lg p-2 text-(--a-cbb6e5) hover:bg-(--s-342749) lg:block">{recolhida ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}</button>
        <button type="button" onClick={() => ir('inicio')} className="flex shrink-0 items-center gap-2" aria-label="PRG System — Início"><LuaLogo />
          <span className="whitespace-nowrap text-sm font-bold tracking-wide sm:text-base">PRG <span className="text-(--ouro-claro)">System</span></span></button>
        <button type="button" onClick={() => setBuscando(true)} aria-label="Buscar (Ctrl+K)"
          className="mx-auto hidden h-10 w-full max-w-md items-center gap-2 rounded-xl border border-(--a-55456e) bg-(--s-171325)/80 px-3 text-sm text-(--a-a99bbb) transition hover:border-(--a-8d70b6) md:flex">
          <Search size={16} aria-hidden="true" /><span className="flex-1 text-left">Buscar personagem, campanha, ferramenta…</span><kbd className="rounded border border-(--a-55456e) px-1.5 text-[11px]">Ctrl K</kbd></button>
        <div className="ml-auto flex items-center gap-1.5 text-sm sm:gap-2 md:ml-0">
          <button type="button" onClick={() => setBuscando(true)} aria-label="Buscar" className="rounded-lg p-2 text-(--a-e4d3ff) hover:bg-(--s-342749) md:hidden"><Search size={20} /></button>
          <Sino />
          <Link href="/guia" className="hidden items-center gap-1.5 rounded-full border border-(--a-8d70b6) px-3 py-1.5 text-(--a-e4d3ff) hover:bg-(--s-342749) sm:inline-flex" title="Guia da plataforma"><CircleHelp size={18} aria-hidden="true" /><span>Guia</span></Link>
          <button type="button" onClick={() => { setAbaPerfil('conta'); ir('perfil') }} aria-label="Meu perfil" title={perfil.apelido} className="rounded-full">{avatar('h-9 w-9')}</button>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1500px]">
        <aside aria-label="Menu da Central" className={'sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 flex-col border-r border-(--a-48385e) bg-(--s-171225)/95 p-3 backdrop-blur transition-[width] lg:flex ' + (recolhida ? 'w-[76px]' : 'w-64')}>
          {!recolhida && <div className="mb-4 flex items-center gap-3 rounded-2xl border border-(--a-4b3b62) bg-gradient-to-br from-(--s-2b1f40) to-(--s-1b1629) p-3">
            {avatar('h-11 w-11')}
            <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{perfil.apelido}</span><span className="block truncate text-[11px] text-(--a-aa8ecb)">{perfil.usuario ? '@' + perfil.usuario : perfil.grupo || 'Aventureiro'}</span></span>
          </div>}
          {!recolhida && <p className="mb-2 px-3 text-[11px] uppercase tracking-[.2em] text-(--ouro)">Sua jornada</p>}
          <nav aria-label="Navegação da Central" className="space-y-1">
            {DESTINOS.map(item => { const ativo = destino === item.id
              return <button key={item.id} type="button" onClick={() => ir(item.id)} aria-current={ativo ? 'page' : undefined} aria-label={recolhida ? item.nome : undefined} title={recolhida ? item.nome : undefined}
                className={'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ' + (recolhida ? 'justify-center ' : '') + (ativo ? 'prg-nav-ativo border-(--a-8b6cba) bg-(--s-38274e) text-white' : 'border-transparent text-(--a-c9bdd9) hover:bg-(--s-2b213d)')}>
                <item.icon size={19} aria-hidden="true" className={ativo ? 'text-(--ouro-claro)' : 'text-(--a-a98fd0)'} />
                {!recolhida && <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.nome}</span><span className="block truncate text-[11px] text-(--a-9f93b5)" aria-hidden="true">{item.descricao}</span></span>}
              </button> })}
          </nav>
          <div className="mt-auto space-y-1 pt-4">
            <div className="prg-divisoria mb-3" />
            <button type="button" onClick={() => setBuscando(true)} className={'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-(--a-cbb6e5) hover:bg-(--s-2b213d) ' + (recolhida ? 'justify-center' : '')} aria-label={recolhida ? 'Buscar' : undefined} title="Buscar (Ctrl+K)"><Search size={18} />{!recolhida && 'Buscar'}</button>
            <button type="button" onClick={alternarLateral} className={'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-(--a-cbb6e5) hover:bg-(--s-2b213d) ' + (recolhida ? 'justify-center' : '')} aria-label={recolhida ? 'Abrir o menu lateral' : undefined}>{recolhida ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}{!recolhida && 'Recolher menu'}</button>
          </div>
        </aside>
        <div className="min-w-0 flex-1 px-4 pb-40 pt-6 sm:px-7 lg:px-10 lg:pb-24 lg:pt-8">
          {destino === 'inicio' && <>
            <section className="relative overflow-hidden rounded-3xl border border-(--a-655079) bg-gradient-to-br from-(--s-302044) to-(--s-1b172b) p-6 shadow-[0_10px_40px_#09050b55] sm:p-9">
              <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full border border-(--ouro)/25" />
              <span aria-hidden="true" className="pointer-events-none absolute -right-2 -top-8 size-36 rounded-full border border-dashed border-(--ouro)/20" />
              <p className="text-xs font-semibold uppercase tracking-[.22em] text-(--ouro-claro)">Sua próxima aventura começa aqui</p>
              <h1 className="relative mt-3 text-2xl font-bold sm:text-4xl">Bem-vindo, {perfil.apelido}!</h1>
              <p className="relative mt-3 max-w-xl text-sm leading-relaxed text-(--a-cfc0df)">Suas histórias, personagens e campanhas em um só lugar.</p>
              <p className="relative mt-2 max-w-xl text-sm italic text-(--a-e9d6ff)"><FraseDaLua /></p>
              <div className="relative mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={() => { setAbaPersonagens('criar'); ir('personagens') }} className="prg-botao prg-botao-primario"><Plus size={16} /> Criar ficha</button>
                <button type="button" onClick={() => ir('campanhas')} className="prg-botao prg-botao-secundario"><Castle size={16} /> Campanhas</button>
                <button type="button" onClick={() => setBuscando(true)} className="prg-botao prg-botao-secundario"><Search size={16} /> Buscar</button>
              </div>
            </section>
            {CLOUD_ENABLED && <ComecePorAqui perfilId={perfil.id} abrirPerfil={() => setEditando(true)} irPara={s => { if (s === 'campanhas') ir('campanhas'); else { setAbaPersonagens(s === 'sistemas' ? 'criar' : 'avulsas'); ir('personagens') } }} />}
            {CLOUD_ENABLED && <ContinuarJornada aventureiroId={perfil.id} />}
            <h2 className="mb-1 mt-9 flex items-center gap-3 text-xl font-bold">Explore sua central<span className="prg-divisoria flex-1" /></h2>
            <p className="mb-4 text-sm text-(--a-bfb2cf)">Cinco lugares: tudo o que você usa está em um deles.</p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              {DESTINOS.filter(item => item.id !== 'inicio').map(item => { const info = SECOES[item.id as Exclude<Destino, 'inicio'>]
                return <button type="button" key={item.id} onClick={() => ir(item.id)} className={cardClass}>
                  <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-(--a-6d5690) bg-gradient-to-br from-(--s-3a2a5c) to-(--s-211a35) text-2xl sm:mb-4 sm:h-12 sm:w-12" aria-hidden="true">{info.icone}</span>
                  <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{item.nome}</h3><ChevronRight size={18} className="text-(--a-b69ad4) transition group-hover:translate-x-0.5" /></div>
                  <p className="mt-1.5 text-xs text-(--a-bfb2cf) sm:mt-2 sm:text-sm"><span className="sm:hidden">{item.descricao}</span><span className="hidden sm:inline">{info.descricao}</span></p>
                </button> })}
            </div>
          </>}
          {destino !== 'inicio' && <CabecalhoSecao {...SECOES[destino]}>
            {destino === 'personagens' && abaPersonagens !== 'criar' && <button type="button" onClick={() => setAbaPersonagens('criar')} className="prg-botao prg-botao-primario"><Plus size={16} /> Criar ficha</button>}
          </CabecalhoSecao>}
          {destino === 'personagens' && <>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Personagens">
              {([['avulsas', '🧙 Avulsas'], ['campanhas', '🏰 Em campanhas'], ['criar', '➕ Criar ficha']] as const).map(([id, nome]) =>
                <button type="button" key={id} role="tab" aria-selected={abaPersonagens === id} onClick={() => setAbaPersonagens(id)} className="prg-chip !px-4 !py-2 !text-sm">{nome}</button>)}
            </div>
            <p className="mt-2 text-xs text-(--a-a99bbb)">{abaPersonagens === 'avulsas' ? 'Fichas só suas, fora de qualquer campanha.' : abaPersonagens === 'campanhas' ? 'Fichas ligadas às suas aventuras, separadas por campanha.' : 'Escolha o sistema: toque nele para ver as regras e o guia, ou em “Criar ficha”.'}</p>
            {abaPersonagens === 'avulsas' && <FichasIndependentes aventureiroId={perfil.id} />}
            {abaPersonagens === 'campanhas' && (CLOUD_ENABLED ? <FichasNuvem aventureiroId={perfil.id} tipo="campanhas" /> : <section className="mt-5 rounded-2xl border border-(--a-55456e) bg-(--s-201a32) p-6"><h2 className="text-xl font-semibold">Fichas de campanhas</h2><p className="mt-2 text-sm text-(--a-c4b6d4)">Quando o módulo de campanhas estiver conectado, suas fichas atribuídas aparecerão aqui, separadas por aventura.</p></section>)}
            {abaPersonagens === 'criar' && <div className="mt-4"><SistemasGaleria aventureiroId={perfil.id} /></div>}
          </>}
          {destino === 'campanhas' && <Campanhas aventureiroId={perfil.id} abrirCampanha={params.get('campanha')} />}
          {destino === 'ferramentas' && <Ferramentas aba={abaFerramentas} mudarAba={setAbaFerramentas} ferramentas={ferramentas} />}
          {destino === 'perfil' && <PerfilConfig aba={abaPerfil} mudarAba={setAbaPerfil} perfil={perfil} tema={tema} escolherTema={escolherTema}
            visualSalvo={(v: Visual) => setPerfil(p => p && { ...p, visual: v })} editarPerfil={() => setEditando(true)} />}
        </div>
      </div>
      <nav aria-label="Atalhos da Central" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-(--a-4b3b62) bg-(--s-151123)/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {DESTINOS.map(item => { const ativo = destino === item.id
          return <button key={item.id} type="button" onClick={() => ir(item.id)} aria-current={ativo ? 'page' : undefined} className={'flex min-h-14 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium transition ' + (ativo ? 'text-white' : 'text-(--a-a99bbb)')}>
            <span className={'flex h-7 w-12 items-center justify-center rounded-full transition ' + (ativo ? 'bg-(--s-4a3470) shadow-[inset_0_-2px_0_var(--ouro)]' : '')}><item.icon size={18} aria-hidden="true" /></span>{item.id === 'perfil' ? 'Perfil' : item.nome}</button> })}
      </nav>
      <CantoDaPlataforma aventureiroId={CLOUD_ENABLED ? perfil.id : undefined} acimaDaBarra />
      <BuscaUniversal aberto={buscando} fechar={fecharBusca} aventureiroId={perfil.id} fixos={fixosBusca} />
      {editando && <EditarPerfil perfil={perfil} fechar={() => setEditando(false)} salvo={p => setPerfil(antes => ({ ...antes, id: p.id, apelido: p.apelido, avatar: p.avatar ?? undefined, grupo: p.grupo, usuario: p.usuario }))} />}
    </main>
  )
}

export default function CentralAventureiro() {
  return <Suspense fallback={<main className="min-h-screen fundo-tema" />}><CentralContent /></Suspense>
}
