'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Copy, Crown, DoorOpen, Film, ListVideo, MessageCircle, Send, Trash2, Users, X } from 'lucide-react'
import ReprodutorCinema from '@/components/cinema/ReprodutorCinema'
import { api, ErroNuvem } from '@/lib/nuvem/cliente'
import { codigoCinema, codigoValido, type EstadoCinema } from '@/lib/nuvem/cinema'

/**
 * Cinema Secreto (easter egg): salas para ver vídeos do YouTube juntos, com fila, chat e lista de quem está assistindo.
 * Entra-se com o perfil da plataforma. O anfitrião controla e pode passar o controle; se ele sumir, alguém assume.
 */
type Mensagem = { id: number; autor: { id: string | null; apelido: string } | null; texto: string; sistema: boolean; em: string }
type Pessoa = { id: string; apelido: string; anfitriao: boolean }
type Sala = {
  codigo: string; nome: string; estado: EstadoCinema; revisao: number; agora: number; eu: string
  anfitriao: { id: string; apelido: string } | null; souAnfitriao: boolean; podeAssumir: boolean; participantes: Pessoa[]; mensagens: Mensagem[]
}
type Aba = 'fila' | 'chat' | 'pessoas'
const msg = (e: unknown) => e instanceof ErroNuvem ? e.message : e instanceof Error ? e.message : 'Falha na conexão.'
const cartao = 'rounded-2xl border border-(--a-55456e) bg-(--s-201a32)/90 backdrop-blur'
const botao = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-(--a-7654bb) px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50'
const secundario = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-(--a-62527e) px-3 py-2 text-sm text-(--a-e4d3ff) hover:bg-(--s-2b2140) disabled:opacity-50'
const campo = 'w-full min-w-0 rounded-xl border border-(--a-5e4b78) bg-(--s-151123) px-3 py-2.5 text-sm text-white placeholder:text-(--a-8c7fa3)'
const hora = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

export default function Cinema() {
  const [sala, setSala] = useState<Sala | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [codigo, setCodigo] = useState('')
  const [nome, setNome] = useState('')
  const [url, setUrl] = useState(''), [titulo, setTitulo] = useState(''), [texto, setTexto] = useState('')
  const [erro, setErro] = useState(''), [aviso, setAviso] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [desvio, setDesvio] = useState(0)
  const [aba, setAba] = useState<Aba>('chat')
  const [naoLidas, setNaoLidas] = useState(0)
  const ultimo = useRef(0), abaRef = useRef<Aba>('chat'), lista = useRef<HTMLOListElement>(null)
  const ativa = sala?.codigo

  // Junta a resposta do servidor: estado da sala (sem voltar para uma revisão antiga) e só as mensagens novas.
  const receber = useCallback((d: Sala, inicio: number) => {
    setDesvio(d.agora - (inicio + Date.now()) / 2)
    setSala(velha => velha && velha.codigo === d.codigo && velha.revisao > d.revisao ? { ...velha, participantes: d.participantes, podeAssumir: d.podeAssumir } : d)
    const novas = d.mensagens.filter(m => m.id > ultimo.current)
    if (novas.length) {
      ultimo.current = novas[novas.length - 1].id
      setMensagens(l => [...l, ...novas].slice(-200))
      if (abaRef.current !== 'chat') setNaoLidas(n => n + novas.filter(m => !m.sistema && m.autor?.id !== d.eu).length)
    }
  }, [])
  const consultar = useCallback(async (c: string) => {
    const inicio = Date.now()
    receber(await api<Sala>(`cinema?codigo=${encodeURIComponent(c)}&desde=${ultimo.current}`), inicio)
  }, [receber])
  async function enviar(acao: string, extra: Record<string, unknown> = {}) {
    setOcupado(true); setErro('')
    const inicio = Date.now()
    try {
      const d = await api<Sala & { ok?: boolean }>('cinema', { method: 'POST', body: { acao, codigo: ativa, desde: ultimo.current, ...extra } })
      if (acao === 'sair' || acao === 'encerrar') { sairDaTela(); return }
      if (acao === 'criar') { ultimo.current = 0; setMensagens([]); history.replaceState(null, '', '/cinema?sala=' + d.codigo) }
      receber(d, inicio)
      if (acao === 'adicionar') { setUrl(''); setTitulo('') }
      if (acao === 'mensagem') setTexto('')
    } catch (e) { setErro(msg(e)) } finally { setOcupado(false) }
  }
  async function entrar(c: string) {
    const cod = codigoCinema(c)
    if (!codigoValido(cod)) { setErro('O código tem 16 letras e números.'); return }
    setOcupado(true); setErro(''); ultimo.current = 0; setMensagens([])
    try { await consultar(cod); history.replaceState(null, '', '/cinema?sala=' + cod) } catch (e) { setErro(msg(e)) } finally { setOcupado(false) }
  }
  function sairDaTela() { setSala(null); setMensagens([]); ultimo.current = 0; history.replaceState(null, '', '/cinema') }

  // Convite por link (/cinema?sala=CÓDIGO): entra sozinho.
  useEffect(() => {
    const c = codigoCinema(new URLSearchParams(window.location.search).get('sala') ?? '')
    if (!codigoValido(c)) return
    const t = window.setTimeout(() => { setCodigo(c); void entrar(c) }, 0)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // A sala continua atualizando a cada 2,5 s (estado, quem está e chat). Também é o “estou aqui” da lista de pessoas.
  // Com a aba em segundo plano, não consulta (economiza rede/bateria — e quem saiu da aba some da lista, como deveria).
  useEffect(() => {
    if (!ativa) return
    const consultarSeVisivel = () => { if (document.visibilityState === 'visible') void consultar(ativa).catch(e => { if (e instanceof ErroNuvem && e.status === 404) { setAviso('A sala foi encerrada pelo anfitrião.'); sairDaTela() } }) }
    const t = window.setInterval(consultarSeVisivel, 2500)
    document.addEventListener('visibilitychange', consultarSeVisivel)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', consultarSeVisivel) }
  }, [ativa, consultar])
  useEffect(() => { const el = lista.current; if (el && aba === 'chat') el.scrollTop = el.scrollHeight }, [mensagens, aba])
  const trocarAba = (a: Aba) => { abaRef.current = a; setAba(a); if (a === 'chat') setNaoLidas(0) }

  const host = !!sala?.souAnfitriao
  const convite = sala && typeof window !== 'undefined' ? `${window.location.origin}/cinema?sala=${sala.codigo}` : ''
  const abas: { id: Aba; nome: string; icone: typeof Film; extra?: number }[] = [
    { id: 'chat', nome: 'Chat', icone: MessageCircle, extra: naoLidas }, { id: 'pessoas', nome: 'Pessoas', icone: Users, extra: sala?.participantes.length },
    { id: 'fila', nome: 'Fila', icone: ListVideo, extra: sala?.estado.fila.length },
  ]

  return <main className="min-h-screen fundo-tema px-3 py-4 text-(--a-f4f0ff) sm:px-6 sm:py-6">
    <div className="mx-auto max-w-7xl space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-[11px] uppercase tracking-[.3em] text-(--a-c7a8ff)">PRG System · ✦ easter egg</p>
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl [font-family:var(--font-cinzel),serif]"><Film className="text-(--ouro)" /> Cinema Secreto</h1></div>
        <Link href="/portal" className={secundario}>Voltar ao portal</Link>
      </header>
      {erro && <p role="alert" className="flex items-start justify-between gap-2 rounded-xl border border-red-400/40 bg-red-950/70 p-3 text-sm">{erro}
        {/Selecione um aventureiro|Aventureiro não encontrado/.test(erro) && <Link href="/portal" className="underline">Escolher perfil</Link>}<button type="button" aria-label="Fechar aviso" onClick={() => setErro('')}><X size={16} /></button></p>}
      {aviso && <p role="status" className="rounded-xl border border-(--a-62527e) bg-(--s-2b2140) p-3 text-sm">{aviso}</p>}

      {!sala ? <div className="grid gap-4 md:grid-cols-2">
        <form className={cartao + ' space-y-3 p-5'} onSubmit={e => { e.preventDefault(); setAviso(''); void enviar('criar', { nome }) }}>
          <h2 className="text-lg font-bold">🎬 Abrir uma sala</h2>
          <p className="text-sm text-(--a-cfc0df)">Você vira o anfitrião: monta a fila e controla o vídeo para todo mundo. Depois é só mandar o convite.</p>
          <label className="block text-sm">Nome da sala<input className={campo + ' mt-1'} required maxLength={80} value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex.: Sessão da madrugada" /></label>
          <button className={botao} disabled={ocupado}>Abrir sala</button>
        </form>
        <form className={cartao + ' space-y-3 p-5'} onSubmit={e => { e.preventDefault(); setAviso(''); void entrar(codigo) }}>
          <h2 className="text-lg font-bold">🍿 Entrar com convite</h2>
          <p className="text-sm text-(--a-cfc0df)">Cole o código (ou abra o link de convite). Você entra com o seu perfil da plataforma.</p>
          <label className="block text-sm">Código da sala<input className={campo + ' mt-1 font-mono uppercase tracking-widest'} required maxLength={24} value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="16 letras e números" /></label>
          <button className={botao} disabled={ocupado}>Entrar</button>
        </form>
      </div> : <>
        <section className={cartao + ' flex flex-wrap items-center gap-2 p-3 sm:p-4'} aria-label="Sala">
          <div className="min-w-0 flex-1"><h2 className="truncate text-lg font-bold">{sala.nome}</h2>
            <p className="text-xs text-(--a-cfc0df)">{host ? <span className="font-semibold text-(--ouro)">👑 Você é o anfitrião</span> : <>🍿 Espectador · anfitrião: <strong>{sala.anfitriao?.apelido ?? 'ninguém'}</strong></>} · código <code className="font-mono">{sala.codigo}</code></p></div>
          <button type="button" className={secundario} onClick={() => { void navigator.clipboard.writeText(convite).then(() => setAviso('Link de convite copiado.')).catch(() => setAviso('Copie o código: ' + sala.codigo)) }}><Copy size={15} /> Convite</button>
          {host && <button type="button" className={secundario + ' text-[#f2a9c3]'} disabled={ocupado} onClick={() => { if (window.confirm('Encerrar a sala para todo mundo? A fila e o chat somem.')) void enviar('encerrar') }}><Trash2 size={15} /> Encerrar</button>}
          <button type="button" className={secundario} disabled={ocupado} onClick={() => void enviar('sair')}><DoorOpen size={15} /> Sair</button>
        </section>
        {sala.podeAssumir && <p className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-(--ouro)/50 bg-(--s-2b2140) p-3 text-sm" data-assumir>
          O anfitrião não está mais na sala.<button type="button" className={botao} disabled={ocupado} onClick={() => void enviar('assumir')}><Crown size={15} /> Assumir o controle</button></p>}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-3">
            <ReprodutorCinema estado={sala.estado} desvio={desvio} />
            {host ? <div className="flex flex-wrap gap-2" aria-label="Controles do anfitrião">
              {(['voltar', 'pausar', 'continuar', 'avancar'] as const).map((a, i) => <button key={a} type="button" className={i === 1 || i === 2 ? botao : secundario} disabled={ocupado || !sala.estado.reproducao.video_id} onClick={() => void enviar(a)}>{['⏪ −10 s', '⏸ Pausar', '▶ Reproduzir', '+10 s ⏩'][i]}</button>)}
            </div> : <p className="text-xs text-(--a-a998bd)">Quem controla o vídeo é o anfitrião. Se ele sair, alguém da sala pode assumir.</p>}
          </div>

          <aside className={cartao + ' flex min-h-[420px] min-w-0 flex-col lg:h-[calc(100vh-220px)] lg:max-h-[720px]'}>
            <div role="tablist" aria-label="Partes da sala" className="grid grid-cols-3 gap-1 border-b border-(--a-3d3152) p-2">
              {abas.map(a => <button key={a.id} type="button" role="tab" aria-selected={aba === a.id} onClick={() => trocarAba(a.id)}
                className={'relative inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold ' + (aba === a.id ? 'bg-(--s-3a2c58) text-white shadow-[inset_0_-2px_0_var(--ouro)]' : 'text-(--a-cfc0df) hover:bg-(--s-2b2140)')}>
                <a.icone size={15} /> {a.nome}{!!a.extra && <span className={'rounded-full px-1.5 text-[10px] ' + (a.id === 'chat' ? 'bg-(--ouro) text-black' : 'bg-white/15')}>{a.extra}</span>}</button>)}
            </div>

            {aba === 'chat' && <div className="flex min-h-0 flex-1 flex-col">
              <ol ref={lista} aria-live="polite" aria-label="Mensagens" className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                {!mensagens.length && <li className="text-center text-xs text-(--a-a998bd)">Ninguém falou nada ainda. Diga oi!</li>}
                {mensagens.map(m => m.sistema
                  ? <li key={m.id} className="text-center text-[11px] italic text-(--a-b5a5c8)">{m.texto}</li>
                  : <li key={m.id} className={'flex ' + (m.autor?.id === sala.eu ? 'justify-end' : 'justify-start')}>
                    <div className={'max-w-[85%] rounded-2xl px-3 py-2 text-sm ' + (m.autor?.id === sala.eu ? 'rounded-br-md bg-(--a-5b4380)' : 'rounded-bl-md bg-(--s-2b2140)')}>
                      {m.autor?.id !== sala.eu && <p className="text-[11px] font-semibold text-(--a-c7a8ff)">{m.autor?.apelido}</p>}
                      <p className="whitespace-pre-wrap break-words">{m.texto}</p><p className="mt-0.5 text-right text-[10px] opacity-60">{hora(m.em)}</p></div></li>)}
              </ol>
              <form className="flex gap-2 border-t border-(--a-3d3152) p-2" onSubmit={e => { e.preventDefault(); if (texto.trim()) void enviar('mensagem', { texto }) }}>
                <input aria-label="Mensagem" className={campo} maxLength={500} value={texto} onChange={e => setTexto(e.target.value)} placeholder="Escreva no chat…" />
                <button className={botao + ' !px-3'} disabled={ocupado || !texto.trim()} aria-label="Enviar mensagem"><Send size={16} /></button>
              </form>
            </div>}

            {aba === 'pessoas' && <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3" aria-label="Quem está na sala">
              {sala.participantes.map(p => <li key={p.id} className="flex items-center gap-2 rounded-xl bg-(--s-171325) p-2" data-pessoa={p.apelido}>
                <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-(--s-3b2470) to-(--s-1b1530) font-bold text-(--a-c3a4f5)">{p.apelido.trim()[0]?.toUpperCase()}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{p.apelido}{p.id === sala.eu && ' (você)'}</span>
                  <span className="text-[11px] text-(--a-b5a5c8)">{p.anfitriao ? '👑 Anfitrião' : 'Assistindo'}</span></span>
                {host && p.id !== sala.eu && <button type="button" className={secundario + ' !min-h-9 !px-2 text-xs'} disabled={ocupado}
                  onClick={() => { if (window.confirm(`Passar o controle da sala para ${p.apelido}? Você vira espectador.`)) void enviar('transferir', { para: p.id }) }}><Crown size={14} /> Passar controle</button>}
              </li>)}
              <li className="pt-1 text-[11px] text-(--a-a998bd)">Aparece aqui quem está com a sala aberta agora.</li>
            </ul>}

            {aba === 'fila' && <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              {host && <form className="space-y-2 rounded-xl border border-(--a-3d3152) p-2" onSubmit={e => { e.preventDefault(); void enviar('adicionar', { url, titulo }) }}>
                <input aria-label="Link do YouTube" className={campo} required placeholder="Link do YouTube" value={url} onChange={e => setUrl(e.target.value)} />
                <input aria-label="Título (opcional)" className={campo} maxLength={160} placeholder="Título (opcional)" value={titulo} onChange={e => setTitulo(e.target.value)} />
                <button className={botao + ' w-full'} disabled={ocupado}>Adicionar à fila</button></form>}
              {sala.estado.fila.map((v, i) => <div key={i + v.id} className={'flex items-center gap-2 rounded-xl p-2 ' + (i === sala.estado.atual ? 'bg-(--s-3a2c58) ring-1 ring-(--ouro)/60' : 'bg-(--s-171325)')}>
                <span className="w-6 text-center text-xs text-(--a-b5a5c8)">{i === sala.estado.atual ? '▶' : i + 1}</span>
                <span className="min-w-0 flex-1 break-words text-sm">{v.titulo}</span>
                {host && <><button type="button" className={secundario + ' !min-h-9 !px-2 text-xs'} disabled={ocupado} onClick={() => void enviar('selecionar', { indice: i })}>Passar</button>
                  <button type="button" aria-label={'Tirar ' + v.titulo + ' da fila'} className={secundario + ' !min-h-9 !px-2'} disabled={ocupado} onClick={() => void enviar('remover', { indice: i })}><X size={14} /></button></>}
              </div>)}
              {!sala.estado.fila.length && <p className="text-sm text-(--a-a998bd)">{host ? 'Cole um link do YouTube para começar.' : 'O anfitrião ainda não colocou nada na fila.'}</p>}
            </div>}
          </aside>
        </div>
      </>}
    </div>
  </main>
}
