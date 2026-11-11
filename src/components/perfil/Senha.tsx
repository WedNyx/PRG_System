'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Eye, EyeOff, Lock, X } from 'lucide-react'
import { toast } from 'sonner'
import { EVENTO_SENHA } from '@/lib/nuvem/cliente'

type PerfilCurto = { id: string; apelido?: string; avatar?: string | null }
const campo = 'w-full rounded-lg border border-(--a-4a4267) bg-(--s-100f20) p-3 text-white outline-none focus:border-(--a-b99bff)'

async function chamar(id: string, corpo: Record<string, unknown>) {
  const r = await fetch('/api/prg/perfil/' + id, { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json', 'x-prg-aventureiro': id }, body: JSON.stringify(corpo) })
  const d = await r.json().catch(() => ({})) as Record<string, unknown>
  if (!r.ok) throw new Error(typeof d.erro === 'string' ? d.erro : 'Falha de conexão. Tente novamente.')
  return d
}
export async function situacaoSenha(id: string): Promise<{ protegido: boolean; conectado: boolean; aparelhos: { id: string; aparelho: string; criado_em: string; este: boolean }[] }> {
  const r = await fetch('/api/prg/perfil/' + id, { cache: 'no-store' })
  if (!r.ok) throw new Error('Não foi possível conferir a senha do perfil.')
  return r.json()
}

function CampoSenha({ valor, mudar, rotulo, auto, foco }: { valor: string; mudar: (v: string) => void; rotulo: string; auto: string; foco?: boolean }) {
  const [ver, setVer] = useState(false)
  return <label className="block text-sm text-(--a-b4aeca)">{rotulo}
    <span className="relative mt-1 block">
      <input type={ver ? 'text' : 'password'} value={valor} onChange={e => mudar(e.target.value)} autoComplete={auto} autoFocus={foco} maxLength={72} className={campo + ' pr-11'} />
      <button type="button" onClick={() => setVer(v => !v)} aria-label={ver ? 'Esconder senha' : 'Mostrar senha'} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-(--a-b4aeca) hover:bg-white/10">{ver ? <EyeOff size={18} /> : <Eye size={18} />}</button>
    </span>
  </label>
}

/** Janela “digite a senha” deste perfil. Ao acertar, o aparelho fica lembrado por 30 dias. */
export function JanelaSenha({ perfil, aoEntrar, fechar }: { perfil: PerfilCurto; aoEntrar: () => void; fechar: () => void }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  async function entrar(e: FormEvent) {
    e.preventDefault(); setOcupado(true); setErro('')
    try { await chamar(perfil.id, { acao: 'entrar', senha }); aoEntrar() }
    catch (er) { setErro(er instanceof Error ? er.message : 'Senha incorreta.'); setSenha('') }
    finally { setOcupado(false) }
  }
  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4" onMouseDown={e => { if (e.target === e.currentTarget) fechar() }}>
    <form onSubmit={entrar} role="dialog" aria-modal="true" aria-labelledby="senha-perfil-titulo" onKeyDown={e => { if (e.key === 'Escape') fechar() }}
      className="w-full max-w-sm rounded-2xl border border-(--a-62527e) bg-(--s-19172c) p-5 text-(--a-f4f0ff) shadow-2xl">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-(--a-62527e) bg-(--s-28233e) text-xl font-bold text-(--a-b99bff)">
          {perfil.avatar ? <img src={perfil.avatar} alt="" className="h-full w-full object-cover" /> : (perfil.apelido?.[0] ?? '?').toUpperCase()}</span>
        <div className="min-w-0 flex-1"><h2 id="senha-perfil-titulo" className="flex items-center gap-1.5 text-lg font-bold"><Lock size={16} /> {perfil.apelido ?? 'Perfil protegido'}</h2>
          <p className="text-xs text-(--a-b4aeca)">Este perfil tem senha.</p></div>
        <button type="button" onClick={fechar} aria-label="Fechar" className="rounded-lg p-1 text-(--a-b4aeca) hover:bg-white/10"><X size={18} /></button>
      </div>
      <div className="mt-4"><CampoSenha valor={senha} mudar={setSenha} rotulo="Senha" auto="current-password" foco /></div>
      {erro && <p role="alert" className="mt-3 text-sm text-red-200">{erro}</p>}
      <button type="submit" disabled={ocupado || !senha} className="mt-4 w-full rounded-lg bg-(--a-7654bb) p-2.5 font-semibold disabled:opacity-50">{ocupado ? 'Conferindo…' : 'Entrar'}</button>
      <p className="mt-3 text-center text-[11px] text-(--a-8f88a8)">Este aparelho fica lembrado por 30 dias. Esqueceu? Peça ao administrador para redefinir.</p>
    </form>
  </div>
}

/** Fica na página toda: se alguma chamada responder “este perfil tem senha”, pede a senha e recarrega. */
export function PedirSenhaGlobal() {
  const [perfil, setPerfil] = useState<PerfilCurto | null>(null)
  useEffect(() => {
    const ouvir = (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      if (!id) return
      setPerfil(atual => atual ?? { id })
      fetch('/api/aventureiros', { cache: 'no-store' }).then(r => r.json()).then((d: { perfis?: PerfilCurto[] }) => {
        const p = d.perfis?.find(x => x.id === id); if (p) setPerfil(a => a && a.id === id ? { ...a, apelido: p.apelido, avatar: p.avatar } : a)
      }).catch(() => {})
    }
    window.addEventListener(EVENTO_SENHA, ouvir)
    return () => window.removeEventListener(EVENTO_SENHA, ouvir)
  }, [])
  if (!perfil) return null
  return <JanelaSenha perfil={perfil} aoEntrar={() => window.location.reload()} fechar={() => { setPerfil(null); window.location.href = '/portal' }} />
}

/** Seção “Senha do perfil” na janela Editar perfil: criar, trocar, remover e aparelhos lembrados. */
export function ConfigSenha({ id }: { id: string }) {
  const [sit, setSit] = useState<Awaited<ReturnType<typeof situacaoSenha>> | null>(null)
  const [modo, setModo] = useState<'' | 'definir' | 'remover'>('')
  const [atual, setAtual] = useState(''), [nova, setNova] = useState(''), [repetir, setRepetir] = useState('')
  const [erro, setErro] = useState(''), [ocupado, setOcupado] = useState(false)
  const [versao, setVersao] = useState(0)
  useEffect(() => {
    let vivo = true
    situacaoSenha(id).then(s => { if (vivo) setSit(s) }).catch(() => { if (vivo) setErro('Não foi possível conferir a senha agora.') })
    return () => { vivo = false }
  }, [id, versao])
  const limpar = () => { setModo(''); setAtual(''); setNova(''); setRepetir(''); setErro('') }

  // Fica dentro do formulário “Editar perfil”: por isso não é um <form> (Enter aqui não salva o perfil).
  async function enviar() {
    setErro('')
    if (modo === 'definir' && nova !== repetir) { setErro('As duas senhas novas não são iguais.'); return }
    setOcupado(true)
    try {
      await chamar(id, modo === 'definir' ? { acao: 'definir', nova, atual } : { acao: 'remover', atual })
      toast.success(modo === 'remover' ? 'Senha removida.' : sit?.protegido ? 'Senha trocada. Os outros aparelhos foram desconectados.' : 'Senha criada! Este aparelho fica lembrado por 30 dias.')
      limpar(); setVersao(v => v + 1)
    } catch (er) { setErro(er instanceof Error ? er.message : 'Falha ao salvar.') } finally { setOcupado(false) }
  }
  async function sairTodos() {
    if (!confirm('Desconectar todos os aparelhos, inclusive este? Será preciso digitar a senha de novo em cada um.')) return
    try { await chamar(id, { acao: 'sair', todos: true }); window.location.href = '/portal' } catch (er) { setErro(er instanceof Error ? er.message : 'Falha.') }
  }

  return <section className="rounded-xl border border-(--a-4a4267) bg-(--s-151223) p-3" aria-label="Senha do perfil">
    <div className="flex flex-wrap items-center gap-2">
      <h3 className="flex flex-1 items-center gap-1.5 text-sm font-semibold"><Lock size={15} /> Senha do perfil</h3>
      {sit && <span className={'rounded-full px-2 py-0.5 text-[11px] ' + (sit.protegido ? 'bg-emerald-900/60 text-emerald-200' : 'bg-(--s-34294f) text-(--a-b4aeca)')}>{sit.protegido ? '🔒 Protegido' : 'Sem senha'}</span>}
    </div>
    {!sit && !erro && <p className="mt-2 text-xs text-(--a-b4aeca)">Carregando…</p>}
    {sit && !modo && <>
      <p className="mt-2 text-xs text-(--a-b4aeca)">{sit.protegido
        ? 'Só entra neste perfil quem souber a senha. Cada aparelho fica lembrado por 30 dias.'
        : 'Opcional: com senha, ninguém mais consegue entrar no seu perfil pelo portal. Não precisa de e-mail.'}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => setModo('definir')} className="rounded-lg bg-(--a-7654bb) px-3 py-1.5 text-sm font-semibold">{sit.protegido ? 'Trocar senha' : 'Criar senha'}</button>
        {sit.protegido && <button type="button" onClick={() => setModo('remover')} className="rounded-lg border border-(--a-62527e) px-3 py-1.5 text-sm">Remover senha</button>}
      </div>
      {sit.protegido && sit.aparelhos.length > 0 && <div className="mt-3">
        <p className="text-xs font-semibold text-(--a-d6c8e8)">Aparelhos lembrados</p>
        <ul className="mt-1 space-y-1">{sit.aparelhos.map(a => <li key={a.id} className="flex justify-between text-xs text-(--a-b4aeca)"><span>{a.aparelho}{a.este && <b className="ml-1 text-emerald-300">(este)</b>}</span><span>{new Date(a.criado_em).toLocaleDateString('pt-BR')}</span></li>)}</ul>
        <button type="button" onClick={() => void sairTodos()} className="mt-2 text-xs text-[#ff9eb5] underline underline-offset-2">Desconectar todos os aparelhos</button>
      </div>}
    </>}
    {sit && modo && <div className="mt-2 space-y-2" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (!ocupado) void enviar() } }}>
      {sit.protegido && <CampoSenha valor={atual} mudar={setAtual} rotulo="Senha atual" auto="current-password" foco />}
      {modo === 'definir' && <>
        <CampoSenha valor={nova} mudar={setNova} rotulo="Senha nova (6 a 72 caracteres)" auto="new-password" foco={!sit.protegido} />
        <CampoSenha valor={repetir} mudar={setRepetir} rotulo="Repita a senha nova" auto="new-password" />
        <p className="text-[11px] text-(--a-8f88a8)">Não há recuperação por e-mail: se esquecer, só o administrador da plataforma consegue apagar a senha.</p>
      </>}
      {erro && <p role="alert" className="text-sm text-red-200">{erro}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={limpar} className="flex-1 rounded-lg border border-(--a-62527e) p-2 text-sm">Cancelar</button>
        <button type="button" onClick={() => void enviar()} disabled={ocupado || (sit.protegido && !atual) || (modo === 'definir' && (!nova || !repetir))} className={'flex-1 rounded-lg p-2 text-sm font-semibold disabled:opacity-50 ' + (modo === 'remover' ? 'bg-[#8a2f4b]' : 'bg-(--a-7654bb)')}>
          {ocupado ? 'Salvando…' : modo === 'remover' ? 'Remover senha' : 'Salvar senha'}</button>
      </div>
    </div>}
    {erro && !modo && <p role="alert" className="mt-2 text-sm text-red-200">{erro}</p>}
  </section>
}
