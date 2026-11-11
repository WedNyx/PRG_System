'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronDown, Eye, Globe, Loader2, Lock, Plus, Save, Trash2 } from 'lucide-react'
import FichaGenerica from '@/components/fichas/FichaGenerica'
import { CapaDoSistema } from './CapaDoSistema'
import { api } from '@/lib/nuvem/cliente'
import { SISTEMAS } from '@/lib/sistemas/catalogo'
import { fichaVazia } from '@/lib/sistemas/calculo'
import { idUnico, sistemaEmBranco, slug, validarSistema } from '@/lib/sistemas/autoral'
import { esquecerSistema } from '@/lib/sistemas/cliente'
import type { DadosFicha, Sistema } from '@/lib/sistemas/tipos'
import EditorRolagem from './EditorRolagem'
import EditorOpcoes, { type OpcaoDef } from './EditorOpcoes'
import EditorProgressao, { type DefProgressao } from './EditorProgressao'
import ArvoreHabilidades from '@/components/fichas/Arvore'
import { lerArvore } from '@/lib/sistemas/arvore'

/* Linhas editáveis: `auto` = o nome na fórmula ainda acompanha o nome (até salvar pela 1ª vez). */
type Linha = Record<string, unknown> & { id: string; nome: string; auto?: boolean }
type Def = {
  nome: string; resumo: string; capa?: string; dados: string; rolagem: 'd20' | 'd100' | 'nenhuma' | 'personalizada' | 'parada'; regraRolagem: { nome: string; formula: string }; parada: { lados: number }; creditos?: string
  campos: Linha[]; atributos: Linha[]; formulaModificador: string; derivados: Linha[]
  pericias: { modo: 'treino' | 'valor' | 'nenhuma'; titulo?: string; total: string; treinos: Linha[]; lista: Linha[] }
  recursos: Linha[]; listas: Linha[]; limites: { nome: string; uso: string; max: string }[]; observacoes: string; carga: { formula: string; unidade: string }
  arvore: { pontos: number; nos: unknown[] }; progressao: DefProgressao | null
}
const ID_TESTE = 'autoral-00000000000000000000000000000000'
const input = 'w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-sm text-white'
const pequeno = 'rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-sm text-white'
const botao = 'inline-flex items-center gap-1 rounded-lg border border-(--a-5e4b78) px-2.5 py-1.5 text-xs hover:bg-(--s-34294f) disabled:opacity-40'
const MODIFICADORES = [
  { id: '', nome: 'O próprio valor (atributo 3 = +3)' },
  { id: 'piso((X - 10) / 2)', nome: 'Estilo D&D: (valor − 10) ÷ 2' },
  { id: 'piso(X / 2)', nome: 'Metade do valor' },
  { id: 'X * 5', nome: 'Valor × 5 (porcentagem)' },
]

function paraDef(s: Partial<Sistema> & Record<string, unknown>, auto = false): Def {
  const l = (v: unknown) => (Array.isArray(v) ? v : []).map(x => ({ ...(x as Record<string, unknown>), auto }) as Linha)
  const p = s.pericias as Sistema['pericias'] | undefined
  return {
    nome: String(s.nome ?? ''), resumo: String(s.resumo ?? ''), ...(typeof s.capa === 'string' ? { capa: s.capa } : {}), dados: String(s.dados ?? 'd20'),
    rolagem: (s.rolagem as Def['rolagem']) ?? (String(s.dados ?? '').startsWith('d100') || s.id === 'brp' ? 'd100' : String(s.dados ?? 'd20').startsWith('d20') ? 'd20' : 'nenhuma'),
    regraRolagem: (s.regraRolagem as Def['regraRolagem']) ?? { nome: 'Teste', formula: '1d20+VALOR' },
    parada: (s.parada as Def['parada']) ?? { lados: 20 },
    creditos: typeof s.creditos === 'string' ? s.creditos : undefined,
    campos: l(s.campos), atributos: l(s.atributos), formulaModificador: String(s.formulaModificador ?? ''), derivados: l(s.derivados),
    pericias: p ? { modo: p.modo, titulo: p.titulo, total: p.total, treinos: l(p.treinos), lista: l(p.lista) } : { modo: 'nenhuma', total: 'MOD + TREINO', treinos: [], lista: [] },
    recursos: l(s.recursos), listas: l(s.listas), limites: (s.limites as Def['limites']) ?? [], observacoes: ((s.observacoes as string[]) ?? []).join('\n'),
    carga: { formula: (s.carga as Sistema['carga'])?.formula ?? '', unidade: (s.carga as Sistema['carga'])?.unidade ?? 'kg' },
    arvore: { pontos: Number((s.arvore as Sistema['arvore'])?.pontos) || 0, nos: (s.arvore as Sistema['arvore'])?.nos ?? [] },
    progressao: (s.progressoes as Sistema['progressoes'])?.classes?.length ? { classes: (s.progressoes as NonNullable<Sistema['progressoes']>).classes, colunas: (s.progressoes as NonNullable<Sistema['progressoes']>).colunas ?? {} } : null,
  }
}
function paraEnvio(d: Def) {
  const tira = (ls: Linha[]) => ls.map(({ auto: _a, ...r }) => r)
  return {
    nome: d.nome, resumo: d.resumo, ...(d.capa ? { capa: d.capa } : {}), dados: d.dados, rolagem: d.rolagem, ...(d.rolagem === 'personalizada' ? { regraRolagem: d.regraRolagem } : {}), ...(d.rolagem === 'parada' ? { parada: d.parada } : {}), creditos: d.creditos,
    campos: tira(d.campos), atributos: tira(d.atributos), formulaModificador: d.formulaModificador, derivados: tira(d.derivados),
    pericias: d.pericias.modo === 'nenhuma' ? undefined : { modo: d.pericias.modo, titulo: d.pericias.titulo, total: d.pericias.total, treinos: tira(d.pericias.treinos), lista: tira(d.pericias.lista) },
    recursos: tira(d.recursos), listas: tira(d.listas), limites: d.limites, observacoes: d.observacoes.split('\n').map(x => x.trim()).filter(Boolean),
    carga: d.carga.formula ? d.carga : undefined,
    ...(d.arvore.nos.length ? { arvore: d.arvore } : {}),
    ...(d.progressao ? { progressoes: d.progressao } : {}),
  }
}

/** Construtor de sistemas autorais: edita, testa com prévia ao vivo, salva e publica. */
export default function Construtor({ idInicial }: { idInicial: string | null }) {
  const router = useRouter()
  const [def, setDef] = useState<Def | null>(null)
  const [uuid, setUuid] = useState<string | null>(null)
  const [publicado, setPublicado] = useState(false)
  const [erroCarga, setErroCarga] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [alterado, setAlterado] = useState(false)
  const [previa, setPrevia] = useState(false)
  const [aberta, setAberta] = useState<string>('sobre')
  const [errosServidor, setErrosServidor] = useState<string[]>([])
  const ultimoCampo = useRef<{ set: (v: string) => void; valor: string } | null>(null)

  useEffect(() => {
    if (!idInicial) return
    let ativo = true
    api<{ sistema: Sistema; uuid: string; publicado: boolean; meu: boolean }>('sistemas/' + idInicial).then(r => {
      if (!ativo) return
      if (!r.meu) { setErroCarga('Só quem criou pode editar este sistema.'); return }
      setDef(paraDef(r.sistema as Sistema & Record<string, unknown>)); setUuid(r.uuid); setPublicado(r.publicado)
    }).catch(() => { if (ativo) setErroCarga('Não foi possível abrir este sistema.') })
    return () => { ativo = false }
  }, [idInicial])

  const validacao = useMemo(() => def ? validarSistema(paraEnvio(def), { id: ID_TESTE }) : null, [def])
  const mudar = (f: (d: Def) => Def) => { setDef(d => d && f(d)); setAlterado(true); setErrosServidor([]) }

  if (erroCarga) return <Tela><p role="alert" className="text-red-200">{erroCarga}</p><Link href="/central" className="mt-3 inline-block underline">Voltar</Link></Tela>
  if (!def && idInicial) return <Tela><p className="flex items-center gap-2"><Loader2 className="animate-spin" /> Abrindo…</p></Tela>
  if (!def) return <EscolherModelo escolher={d => { setDef(d); setAlterado(true) }} />

  // Variáveis que as fórmulas podem usar (com explicação), para tocar e inserir.
  const variaveis: { v: string; d: string }[] = [
    ...def.campos.filter(c => c.tipo === 'numero').map(c => ({ v: c.id, d: c.nome })),
    ...def.atributos.flatMap(a => [{ v: a.id, d: a.nome }, ...(def.formulaModificador ? [{ v: 'mod_' + a.id, d: 'Modificador de ' + a.nome }] : [])]),
    ...def.derivados.map(x => ({ v: x.id, d: x.nome })),
    ...(def.pericias.modo !== 'nenhuma' ? def.pericias.lista.map(p => ({ v: 'tot_' + p.id, d: 'Total de ' + p.nome })) : []),
    { v: 'soma_atributos', d: 'Soma dos atributos' }, { v: 'maior_atributo', d: 'Maior atributo' },
    ...(def.progressao ? [...new Set(def.progressao.classes.flatMap(c => Object.keys(c.tabela)))].map(c => ({ v: 'prog_' + c, d: (def.progressao!.colunas[c] ?? c).replace(/^\S+\s/, '') + ' (do nível)' })) : []),
  ]
  const inserir = (v: string) => { const u = ultimoCampo.current; if (!u) { toast('Toque primeiro numa fórmula.'); return } u.set((u.valor.trim() ? u.valor.trim() + ' + ' : '') + v) }
  const formula = (valor: string, set: (v: string) => void, extra = '') => <input value={valor} onChange={e => { set(e.target.value); ultimoCampo.current = { set, valor: e.target.value } }} onFocus={() => { ultimoCampo.current = { set, valor } }}
    placeholder={'Fórmula, ex.: 10 + FOR * 2' + extra} className={input + ' font-mono'} spellCheck={false} />
  // Linha de lista com nome que vira variável.
  const renomear = (lista: Linha[], i: number, nome: string, maiusculo = false): Linha[] => lista.map((x, k) => {
    if (k !== i) return x
    if (!x.auto) return { ...x, nome }
    const usados = new Set(lista.filter((_, j) => j !== i).map(y => y.id))
    return { ...x, nome, id: idUnico(slug(nome || 'item', maiusculo), usados) }
  })
  const novo = (lista: Linha[], extra: Record<string, unknown>, maiusculo = false): Linha => ({ id: idUnico(slug('novo', maiusculo), new Set(lista.map(x => x.id))), nome: '', auto: true, ...extra })

  async function salvar() {
    if (!def) return
    if (validacao && !validacao.ok) { toast.error('Corrija os problemas antes de salvar.'); document.getElementById('problemas')?.scrollIntoView({ behavior: 'smooth' }); return }
    setSalvando(true)
    try {
      const r = await api<{ id: string; uuid: string }>('sistemas', { method: 'POST', body: { acao: uuid ? 'salvar' : 'criar', uuid, definicao: paraEnvio(def) } })
      esquecerSistema(r.id)
      if (!uuid) { setUuid(r.uuid); router.replace('/sistemas/criar?id=' + r.id) }
      setDef(d => d && { ...d, campos: d.campos.map(x => ({ ...x, auto: false })), atributos: d.atributos.map(x => ({ ...x, auto: false })), derivados: d.derivados.map(x => ({ ...x, auto: false })),
        recursos: d.recursos.map(x => ({ ...x, auto: false })), listas: d.listas.map(x => ({ ...x, auto: false })), pericias: { ...d.pericias, lista: d.pericias.lista.map(x => ({ ...x, auto: false })), treinos: d.pericias.treinos.map(x => ({ ...x, auto: false })) } })
      setAlterado(false); toast.success(uuid ? 'Sistema salvo!' : 'Sistema criado! Já dá para criar fichas nele.')
    } catch (e) {
      const d = (e as { dados?: { erros?: string[] } }).dados
      if (d?.erros) setErrosServidor(d.erros)
      toast.error(e instanceof Error ? e.message : 'Não foi possível salvar.')
    } finally { setSalvando(false) }
  }
  async function publicar(v: boolean) {
    if (!uuid) return
    if (alterado) { toast('Salve antes de publicar.'); return }
    try { await api('sistemas', { method: 'POST', body: { acao: 'publicar', uuid, publicado: v } }); setPublicado(v); toast.success(v ? 'Publicado! Agora aparece em “Sistemas autorais” para todo mundo.' : 'Voltou a ser rascunho (só você vê).') }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Falha.') }
  }
  async function excluir() {
    if (!uuid || !confirm('Excluir este sistema? Isso não pode ser desfeito.')) return
    try { await api('sistemas', { method: 'POST', body: { acao: 'excluir', uuid } }); toast.success('Sistema excluído.'); router.push('/central') }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Falha.') }
  }

  const erros = validacao && !validacao.ok ? validacao.erros : errosServidor

  return <main className="min-h-screen fundo-tema pb-24 text-(--a-f2ebff)">
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b border-(--a-373251) bg-(--s-19172c)/95 px-3 py-2 backdrop-blur">
      <Link href="/central?secao=sistemas" className="inline-flex items-center gap-1 text-sm text-(--a-b99bff)"><ArrowLeft size={16} /> Sistemas</Link>
      <h1 className="order-last w-full truncate font-bold sm:order-none sm:w-auto sm:min-w-0 sm:flex-1">{def.nome || 'Novo sistema'}</h1>
      <span className="flex-1 sm:hidden" />
      <span className={'rounded-full px-2 py-0.5 text-[11px] ' + (publicado ? 'bg-emerald-800/70 text-emerald-100' : 'bg-(--s-2b2140) text-(--a-c4b6d4)')}>{publicado ? <><Globe size={11} className="inline" /> Publicado</> : <><Lock size={11} className="inline" /> Rascunho</>}</span>
      <button type="button" onClick={() => setPrevia(p => !p)} className={botao}><Eye size={14} /> {previa ? 'Editar' : 'Prévia'}</button>
      <button type="button" onClick={() => void salvar()} disabled={salvando || (!alterado && !!uuid)} className="inline-flex items-center gap-1 rounded-lg bg-(--a-7654bb) px-3 py-1.5 text-sm font-semibold disabled:opacity-50">{salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salvar</button>
    </header>

    <div className="mx-auto max-w-3xl space-y-3 px-3 pt-4">
      {erros.length > 0
        ? <section id="problemas" role="alert" className="rounded-2xl border border-[#c98b3a] bg-[#3a2a14]/95 p-4 text-sm text-[#f6dca8]">
          <p className="flex items-center gap-2 font-semibold"><AlertTriangle size={18} /> Falta corrigir {erros.length === 1 ? '1 coisa' : erros.length + ' coisas'}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">{erros.slice(0, 8).map(e => <li key={e}>{e}</li>)}</ul></section>
        : <p className="flex items-center gap-2 rounded-xl bg-[#1f3a2c]/90 px-3 py-2 text-sm text-[#a9f0c8]"><CheckCircle2 size={16} /> Tudo certo: as fórmulas calculam. Veja em “Prévia”.</p>}

      {previa ? <Previa def={def} validacao={validacao} /> : <>
        <SecaoBase id="sobre" titulo="📘 Sobre o sistema" sub="Nome, descrição e como se rola" aberta={aberta === 'sobre'} alternar={() => setAberta(a => a === 'sobre' ? '' : 'sobre')}>
          <label className="block">Nome<input value={def.nome} maxLength={80} onChange={e => mudar(d => ({ ...d, nome: e.target.value }))} className={input + ' mt-1'} placeholder="Ex.: Crônicas da Névoa" /></label>
          <label className="block">Descrição curta<textarea rows={2} value={def.resumo} maxLength={400} onChange={e => mudar(d => ({ ...d, resumo: e.target.value }))} className={input + ' mt-1'} /></label>
          <CapaDoSistema nome={def.nome} capa={def.capa} mudar={capa => mudar(d => ({ ...d, capa }))} />
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">Como se rola<select value={def.rolagem} onChange={e => mudar(d => ({ ...d, rolagem: e.target.value as Def['rolagem'] }))} className={input + ' mt-1'}>
              <option value="d20">d20 + bônus (toque na perícia para rolar)</option><option value="d100">d100 abaixo do valor (porcentagem)</option><option value="personalizada">🎲 Rolagem personalizada (monte a sua)</option>
              <option value="parada">🎲 Parada de dados (um dado por ponto, fica com o maior)</option><option value="nenhuma">Sem rolagem automática</option></select></label>
            <label className="block">Dados (texto que aparece no cartão)<input value={def.dados} maxLength={40} onChange={e => mudar(d => ({ ...d, dados: e.target.value }))} className={input + ' mt-1'} placeholder="Ex.: d20, 2d6, d100" /></label>
          </div>
          {def.rolagem === 'personalizada' && <EditorRolagem regra={def.regraRolagem} mudar={r => mudar(d => ({ ...d, regraRolagem: r }))} />}
          {def.rolagem === 'parada' && <label className="block">Lados do dado da parada (ex.: 20 como Ordem Paranormal, 6 como Blades)
            <input type="number" min={2} max={100} value={def.parada.lados} onChange={e => mudar(d => ({ ...d, parada: { lados: Number(e.target.value) || 20 } }))} className={input + ' mt-1 max-w-[8rem]'} /></label>}
          {def.creditos && <p className="rounded-lg bg-(--s-171325) p-2 text-[11px] text-(--a-a998bd)">Créditos do modelo usado (licença aberta): {def.creditos}</p>}
        </SecaoBase>

        <SecaoBase id="campos" titulo="🪪 Campos de identidade" sub="Classe, raça, nível… (número vira variável)" aberta={aberta === 'campos'} alternar={() => setAberta(a => a === 'campos' ? '' : 'campos')}>
          {def.campos.map((c, i) => <div key={i} className="space-y-1 rounded-xl bg-(--s-171325) p-2">
            <div className="flex gap-2">
              <input aria-label="Nome do campo" value={c.nome} onChange={e => mudar(d => ({ ...d, campos: renomear(d.campos, i, e.target.value) }))} className={input} placeholder="Nome do campo" />
              <select aria-label="Tipo" value={String(c.tipo ?? 'texto')} onChange={e => mudar(d => ({ ...d, campos: d.campos.map((x, k) => k === i ? { ...x, tipo: e.target.value, ...(e.target.value === 'escolha' && !Array.isArray(x.opcoes) ? { opcoes: [{ nome: '' }] } : {}) } : x) }))} className={pequeno}>
                <option value="texto">Texto</option><option value="numero">Número</option><option value="area">Texto longo</option><option value="escolha">Lista de opções</option></select>
              <Remover rotulo="Remover campo" onClick={() => mudar(d => ({ ...d, campos: d.campos.filter((_, k) => k !== i) }))} />
            </div>
            {c.tipo === 'numero' && <div className="flex items-center gap-2"><label className="text-xs">Começa em <input type="number" value={Number(c.padrao ?? 0)} onChange={e => mudar(d => ({ ...d, campos: d.campos.map((x, k) => k === i ? { ...x, padrao: Number(e.target.value) } : x) }))} className={pequeno + ' w-20'} /></label><Var id={c.id} /></div>}
            {c.tipo === 'escolha' && <EditorOpcoes opcoes={(c.opcoes as OpcaoDef[]) ?? []} alvos={alvosDoDef(def)} tabelas={def.progressao?.classes.map(t => ({ id: t.id, nome: t.nome })) ?? []} mudar={o => mudar(d => ({ ...d, campos: d.campos.map((x, k) => k === i ? { ...x, opcoes: o } : x) }))} />}
            {c.tipo === 'escolha' && ((c.opcoes as OpcaoDef[]) ?? []).some(o => o.progressao) && <label className="flex flex-wrap items-center gap-2 text-xs">O nível desta escolha fica em
              <select aria-label="Campo do nível desta escolha" value={String(c.nivel ?? '')} onChange={e => mudar(d => ({ ...d, campos: d.campos.map((x, k) => k === i ? { ...x, nivel: e.target.value || undefined } : x) }))} className={pequeno}>
                <option value="">o campo da tabela</option>{def.campos.filter(x => x.tipo === 'numero').map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}</select>
              <span className="text-(--a-a998bd)">(para multiclasse: “Segunda classe” usa “Nível 2”)</span></label>}
          </div>)}
          <button type="button" className={botao} onClick={() => mudar(d => ({ ...d, campos: [...d.campos, novo(d.campos, { tipo: 'texto' })] }))}><Plus size={14} /> Campo</button>
        </SecaoBase>

        <SecaoBase id="atributos" titulo="✨ Atributos" sub="Sigla, nome, mínimo e máximo" aberta={aberta === 'atributos'} alternar={() => setAberta(a => a === 'atributos' ? '' : 'atributos')}>
          {def.atributos.map((a, i) => <div key={i} className="space-y-1 rounded-xl bg-(--s-171325) p-2">
            <div className="flex gap-2">
              <input aria-label="Sigla" value={a.id} maxLength={6} onChange={e => { const v = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''); mudar(d => ({ ...d, atributos: d.atributos.map((x, k) => k === i ? { ...x, id: v || x.id, auto: false } : x) })) }} className={pequeno + ' w-20 font-mono uppercase'} placeholder="FOR" />
              <input aria-label="Nome do atributo" value={a.nome} onChange={e => mudar(d => ({ ...d, atributos: renomear(d.atributos, i, e.target.value, true) }))} className={input} placeholder="Força" />
              <Remover rotulo="Remover atributo" onClick={() => mudar(d => ({ ...d, atributos: d.atributos.filter((_, k) => k !== i) }))} />
            </div>
            <div className="flex flex-wrap gap-2 text-xs">{(['min', 'max', 'padrao'] as const).map(k => <label key={k} className="flex items-center gap-1">{k === 'min' ? 'Mín.' : k === 'max' ? 'Máx.' : 'Começa'}
              <input type="number" value={Number(a[k] ?? 0)} onChange={e => mudar(d => ({ ...d, atributos: d.atributos.map((x, j) => j === i ? { ...x, [k]: Number(e.target.value) } : x) }))} className={pequeno + ' w-16'} /></label>)}</div>
          </div>)}
          <button type="button" className={botao} onClick={() => mudar(d => ({ ...d, atributos: [...d.atributos, { ...novo(d.atributos, { min: 0, max: 5, padrao: 1 }, true), id: idUnico('ATR', new Set(d.atributos.map(x => x.id))) }] }))}><Plus size={14} /> Atributo</button>
          <label className="block">Modificador do atributo
            <select value={MODIFICADORES.some(m => m.id === def.formulaModificador) ? def.formulaModificador : '__outro'} onChange={e => mudar(d => ({ ...d, formulaModificador: e.target.value === '__outro' ? 'X' : e.target.value }))} className={input + ' mt-1'}>
              {MODIFICADORES.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}<option value="__outro">Outra fórmula (use X para o valor)</option></select></label>
          {!MODIFICADORES.some(m => m.id === def.formulaModificador) && formula(def.formulaModificador, v => mudar(d => ({ ...d, formulaModificador: v })), ' (X = valor)')}
        </SecaoBase>

        <SecaoBase id="derivados" titulo="🧮 Valores calculados" sub="Vida, defesa, iniciativa… a ficha calcula sozinha" aberta={aberta === 'derivados'} alternar={() => setAberta(a => a === 'derivados' ? '' : 'derivados')}>
          <Variaveis lista={variaveis} inserir={inserir} />
          {def.derivados.map((x, i) => <div key={i} className="space-y-1 rounded-xl bg-(--s-171325) p-2">
            <div className="flex gap-2"><input aria-label="Nome do valor" value={x.nome} onChange={e => mudar(d => ({ ...d, derivados: renomear(d.derivados, i, e.target.value) }))} className={input} placeholder="Ex.: Defesa" />
              <Remover rotulo="Remover valor" onClick={() => mudar(d => ({ ...d, derivados: d.derivados.filter((_, k) => k !== i) }))} /></div>
            {formula(String(x.formula ?? ''), v => mudar(d => ({ ...d, derivados: d.derivados.map((y, k) => k === i ? { ...y, formula: v } : y) })))}
            <Var id={x.id} />
          </div>)}
          <button type="button" className={botao} onClick={() => mudar(d => ({ ...d, derivados: [...d.derivados, novo(d.derivados, { formula: '0' })] }))}><Plus size={14} /> Valor calculado</button>
          <p className="text-[11px] text-(--a-a998bd)">Funções: piso(), teto(), arred(), min(a, b), max(a, b), se(x, a, b) (x diferente de 0 → a; senão b). Ex.: piso(nivel / 2) + FOR</p>
        </SecaoBase>

        <SecaoBase id="pericias" titulo="🎯 Perícias" sub="Lista, atributo de cada uma e graus de treino" aberta={aberta === 'pericias'} alternar={() => setAberta(a => a === 'pericias' ? '' : 'pericias')}>
          <label className="block">Tipo<select value={def.pericias.modo} onChange={e => mudar(d => ({ ...d, pericias: { ...d.pericias, modo: e.target.value as Def['pericias']['modo'], total: e.target.value === 'valor' ? 'VALOR' : d.pericias.total || 'MOD + TREINO' } }))} className={input + ' mt-1'}>
            <option value="treino">Por graus (destreinado, treinado…)</option><option value="valor">Por número (pontos ou porcentagem)</option><option value="nenhuma">Sem perícias</option></select></label>
          {def.pericias.modo === 'treino' && <div className="space-y-2 rounded-xl bg-(--s-171325) p-2">
            <p className="text-xs font-semibold text-(--a-d3adf0)">Graus de treino (bônus)</p>
            {def.pericias.treinos.map((t, i) => <div key={i} className="flex gap-2">
              <input aria-label="Nome do grau" value={t.nome} onChange={e => mudar(d => ({ ...d, pericias: { ...d.pericias, treinos: renomear(d.pericias.treinos, i, e.target.value) } }))} className={input} placeholder="Treinado" />
              <input aria-label="Bônus" value={String(t.formula ?? '0')} onChange={e => mudar(d => ({ ...d, pericias: { ...d.pericias, treinos: d.pericias.treinos.map((y, k) => k === i ? { ...y, formula: e.target.value } : y) } }))} className={pequeno + ' w-28 font-mono'} placeholder="+2" />
              <Remover rotulo="Remover grau" onClick={() => mudar(d => ({ ...d, pericias: { ...d.pericias, treinos: d.pericias.treinos.filter((_, k) => k !== i) } }))} /></div>)}
            {def.pericias.treinos.length < 8 && <button type="button" className={botao} onClick={() => mudar(d => ({ ...d, pericias: { ...d.pericias, treinos: [...d.pericias.treinos, novo(d.pericias.treinos, { formula: '0' })] } }))}><Plus size={14} /> Grau</button>}
          </div>}
          {def.pericias.modo !== 'nenhuma' && <>
            <label className="block text-xs">Total da perícia
              <select value={['MOD + TREINO', 'ATR + TREINO', 'TREINO', 'VALOR', 'MOD + VALOR'].includes(def.pericias.total) ? def.pericias.total : '__'} onChange={e => mudar(d => ({ ...d, pericias: { ...d.pericias, total: e.target.value === '__' ? d.pericias.total : e.target.value } }))} className={input + ' mt-1'}>
                {def.pericias.modo === 'treino' ? <><option value="MOD + TREINO">Modificador do atributo + grau</option><option value="ATR + TREINO">Valor do atributo + grau</option><option value="TREINO">Só o grau</option></>
                  : <><option value="VALOR">Só o número digitado</option><option value="MOD + VALOR">Modificador do atributo + número</option></>}
                <option value="__">Outra fórmula…</option></select></label>
            <div className="space-y-2">{def.pericias.lista.map((p, i) => <div key={i} className="flex flex-wrap gap-2 rounded-xl bg-(--s-171325) p-2">
              <input aria-label="Nome da perícia" value={p.nome} onChange={e => mudar(d => ({ ...d, pericias: { ...d.pericias, lista: renomear(d.pericias.lista, i, e.target.value) } }))} className={input + ' min-w-0 flex-1'} placeholder="Ex.: Furtividade" />
              <select aria-label="Atributo" value={String(p.atributo ?? '')} onChange={e => mudar(d => ({ ...d, pericias: { ...d.pericias, lista: d.pericias.lista.map((y, k) => k === i ? { ...y, atributo: e.target.value } : y) } }))} className={pequeno}>
                <option value="">Sem atributo</option>{def.atributos.map(a => <option key={a.id} value={a.id}>{a.id}</option>)}</select>
              <input aria-label="Grupo" value={String(p.grupo ?? '')} onChange={e => mudar(d => ({ ...d, pericias: { ...d.pericias, lista: d.pericias.lista.map((y, k) => k === i ? { ...y, grupo: e.target.value } : y) } }))} className={pequeno + ' w-32'} placeholder="Grupo (opcional)" />
              <Remover rotulo="Remover perícia" onClick={() => mudar(d => ({ ...d, pericias: { ...d.pericias, lista: d.pericias.lista.filter((_, k) => k !== i) } }))} />
            </div>)}</div>
            <button type="button" className={botao} onClick={() => mudar(d => ({ ...d, pericias: { ...d.pericias, lista: [...d.pericias.lista, novo(d.pericias.lista, { atributo: d.atributos[0]?.id ?? '' })] } }))}><Plus size={14} /> Perícia</button>
          </>}
        </SecaoBase>

        <SecaoBase id="recursos" titulo="❤️ Recursos" sub="Vida, mana, sanidade… com máximo" aberta={aberta === 'recursos'} alternar={() => setAberta(a => a === 'recursos' ? '' : 'recursos')}>
          {def.recursos.map((r, i) => <div key={i} className="space-y-1 rounded-xl bg-(--s-171325) p-2">
            <div className="flex gap-2"><input aria-label="Nome do recurso" value={r.nome} onChange={e => mudar(d => ({ ...d, recursos: renomear(d.recursos, i, e.target.value) }))} className={input} placeholder="Ex.: Mana" />
              <Remover rotulo="Remover recurso" onClick={() => mudar(d => ({ ...d, recursos: d.recursos.filter((_, k) => k !== i) }))} /></div>
            {formula(String(r.formula ?? ''), v => mudar(d => ({ ...d, recursos: d.recursos.map((y, k) => k === i ? { ...y, formula: v } : y) })), ' — vazio = jogador digita')}
          </div>)}
          <button type="button" className={botao} onClick={() => mudar(d => ({ ...d, recursos: [...d.recursos, novo(d.recursos, {})] }))}><Plus size={14} /> Recurso</button>
        </SecaoBase>

        <SecaoBase id="listas" titulo="📝 Espaços de texto" sub="Habilidades, história, anotações…" aberta={aberta === 'listas'} alternar={() => setAberta(a => a === 'listas' ? '' : 'listas')}>
          {def.listas.map((l, i) => <div key={i} className="flex gap-2"><input aria-label="Nome do espaço" value={l.nome} onChange={e => mudar(d => ({ ...d, listas: renomear(d.listas, i, e.target.value) }))} className={input} />
            <Remover rotulo="Remover" onClick={() => mudar(d => ({ ...d, listas: d.listas.filter((_, k) => k !== i) }))} /></div>)}
          <button type="button" className={botao} onClick={() => mudar(d => ({ ...d, listas: [...d.listas, novo(d.listas, {})] }))}><Plus size={14} /> Espaço de texto</button>
          <p className="text-[11px] text-(--a-a998bd)">Inventário e poderes estruturados já vêm em toda ficha.</p>
        </SecaoBase>

        <SecaoBase id="regras" titulo="⚖️ Regras e avisos (opcional)" sub="Limites de criação, carga e lembretes" aberta={aberta === 'regras'} alternar={() => setAberta(a => a === 'regras' ? '' : 'regras')}>
          <Variaveis lista={variaveis} inserir={inserir} />
          {def.limites.map((l, i) => <div key={i} className="space-y-1 rounded-xl bg-(--s-171325) p-2">
            <div className="flex gap-2"><input aria-label="Nome do limite" value={l.nome} onChange={e => mudar(d => ({ ...d, limites: d.limites.map((y, k) => k === i ? { ...y, nome: e.target.value } : y) }))} className={input} placeholder="Ex.: Pontos de atributo na criação" />
              <Remover rotulo="Remover limite" onClick={() => mudar(d => ({ ...d, limites: d.limites.filter((_, k) => k !== i) }))} /></div>
            <div className="grid grid-cols-2 gap-2">
              {formula(l.uso, v => mudar(d => ({ ...d, limites: d.limites.map((y, k) => k === i ? { ...y, uso: v } : y) })), ' (quanto usou)')}
              {formula(l.max, v => mudar(d => ({ ...d, limites: d.limites.map((y, k) => k === i ? { ...y, max: v } : y) })), ' (máximo)')}
            </div>
          </div>)}
          <button type="button" className={botao} onClick={() => mudar(d => ({ ...d, limites: [...d.limites, { nome: '', uso: 'soma_atributos', max: '10' }] }))}><Plus size={14} /> Limite (a ficha avisa quando passar)</button>
          <div className="grid grid-cols-[1fr_6rem] gap-2">
            <label className="block text-xs">Capacidade de carga (opcional){formula(def.carga.formula, v => mudar(d => ({ ...d, carga: { ...d.carga, formula: v } })))}</label>
            <label className="block text-xs">Unidade<input value={def.carga.unidade} maxLength={16} onChange={e => mudar(d => ({ ...d, carga: { ...d.carga, unidade: e.target.value } }))} className={input + ' mt-1'} /></label>
          </div>
          <label className="block text-xs">Lembretes de regras (um por linha; aparecem no fim da ficha)
            <textarea rows={4} value={def.observacoes} onChange={e => mudar(d => ({ ...d, observacoes: e.target.value }))} className={input + ' mt-1'} placeholder="Ex.: 20 natural é crítico." /></label>
        </SecaoBase>

        <SecaoBase id="progressao" titulo="📈 Progressão por nível" sub="O que o personagem ganha a cada nível" aberta={aberta === 'progressao'} alternar={() => setAberta(a => a === 'progressao' ? '' : 'progressao')}>
          <EditorProgressao valor={def.progressao} mudar={v => mudar(d => ({ ...d, progressao: v }))}
            camposNumero={def.campos.filter(c => c.tipo === 'numero').map(c => ({ id: c.id, nome: c.nome }))}
            criarCampoNivel={() => { mudar(d => d.campos.some(c => c.id === 'nivel') ? d : { ...d, campos: [...d.campos, { id: 'nivel', nome: 'Nível', tipo: 'numero', padrao: 1 }] }); return 'nivel' }}
            listas={def.campos.filter(c => c.tipo === 'escolha' && c.nome).map(c => ({ id: c.id, nome: c.nome }))}
            ligadas={ligadasDoDef(def)} ligar={id => mudar(d => ligarTabelas(d, id))} />
        </SecaoBase>
        <SecaoBase id="arvore" titulo="🌠 Árvore de habilidades padrão" sub="Toda ficha nova do sistema começa com ela" aberta={aberta === 'arvore'} alternar={() => setAberta(a => a === 'arvore' ? '' : 'arvore')}>
          {validacao?.ok ? <ArvoreHabilidades s={validacao.sistema} d={{ ...fichaVazia(validacao.sistema), arvore: { ...def.arvore, liberados: [] } }} somenteLeitura={false} rolar={() => {}} editorSistema
            onChange={nd => { const a = lerArvore(nd.arvore); mudar(d => ({ ...d, arvore: { pontos: a.pontos, nos: a.nos } })) }} />
            : <p className="rounded-lg bg-[#3a2a14]/90 p-3 text-xs text-[#f6dca8]">Corrija os problemas acima para montar a árvore (ela usa os atributos e recursos do sistema).</p>}
          <p className="text-xs text-(--a-a998bd)">Fichas que já existem podem trazer a árvore com o botão “Usar a árvore do sistema” (ou “Atualizar”, se você mudar depois).</p>
        </SecaoBase>

        <section className="rounded-2xl border border-(--a-55456e) bg-(--s-201a32)/95 p-4 text-sm">
          <h2 className="font-semibold">🌍 Publicar</h2>
          <p className="mt-1 text-xs text-(--a-c4b6d4)">Rascunho: só você vê e pode criar fichas para testar. Publicado: aparece em “Sistemas autorais” para todo mundo, com o seu nome.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {!uuid ? <p className="text-xs text-(--a-a998bd)">Salve primeiro.</p>
              : publicado ? <button type="button" className={botao} onClick={() => void publicar(false)}><Lock size={14} /> Voltar a ser rascunho</button>
                : <button type="button" className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold" onClick={() => void publicar(true)}><Globe size={14} /> Publicar para todos</button>}
            {uuid && <button type="button" className={botao + ' text-red-200'} onClick={() => void excluir()}><Trash2 size={14} /> Excluir sistema</button>}
          </div>
        </section>
      </>}
    </div>
  </main>
}

/** Quem escolhe cada tabela de níveis: { guerreiro: ['Guerreiro (Classe)'] }. */
function ligadasDoDef(d: Def): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const c of d.campos) for (const o of (c.opcoes as OpcaoDef[] | undefined) ?? []) if (o.progressao) (out[o.progressao] ??= []).push(`${o.nome} (${c.nome})`)
  return out
}
/** Cria uma tabela de níveis para cada opção da lista (copiando a primeira) e liga as opções a elas. */
function ligarTabelas(d: Def, campoId: string): Def {
  const campo = d.campos.find(c => c.id === campoId)
  if (!d.progressao || !campo) return d
  const classes = [...d.progressao.classes], base = classes[0], ids = new Set(classes.map(c => c.id))
  const opcoes = ((campo.opcoes as OpcaoDef[] | undefined) ?? []).map(o => {
    const nome = o.nome.trim(); if (!nome) return o
    let cl = classes.find(c => c.nome.trim().toLowerCase() === nome.toLowerCase())
    if (!cl) {
      if (classes.length >= 6) return o
      const raiz = slug(nome).slice(0, 20); let id = raiz, k = 2
      while (ids.has(id)) id = raiz + '_' + k++
      ids.add(id)
      cl = { id, nome: nome.slice(0, 40), campoNivel: base.campoNivel, tabela: JSON.parse(JSON.stringify(base.tabela)) }
      classes.push(cl)
    }
    return { ...o, progressao: cl.id }
  })
  const campos = d.campos.map(c => c.id === campoId ? { ...c, opcoes } : c)
  // A tabela geral que serviu de modelo sai, se ninguém a escolhe (senão somaria duas vezes).
  const usadas = new Set(campos.flatMap(c => ((c.opcoes as OpcaoDef[] | undefined) ?? []).flatMap(o => o.progressao ? [o.progressao] : [])))
  const finais = classes.filter(c => c !== base || usadas.has(c.id))
  return { ...d, campos, progressao: { ...d.progressao, classes: finais.length ? finais : classes } }
}
/** Onde um bônus pode entrar (igual a alvosDeBonus, mas direto do que está sendo editado). */
function alvosDoDef(d: Def) {
  return [
    ...d.atributos.map(a => ({ id: 'atributo:' + a.id, nome: a.nome })),
    ...d.derivados.map(x => ({ id: 'derivado:' + x.id, nome: x.nome })),
    ...(d.pericias.modo === 'nenhuma' ? [] : d.pericias.lista.map(p => ({ id: 'pericia:' + p.id, nome: 'Perícia ' + p.nome }))),
    ...d.recursos.map(x => ({ id: 'recurso:' + x.id, nome: x.nome + ' (máximo)' })),
  ].filter(a => a.nome)
}
function SecaoBase({ id, titulo, sub, aberta, alternar, children }: { id: string; titulo: string; sub?: string; aberta: boolean; alternar: () => void; children: React.ReactNode }) {
  return <section id={'secao-' + id} className="rounded-2xl border border-(--a-55456e) bg-(--s-201a32)/95">
    <button type="button" onClick={alternar} aria-expanded={aberta} className="flex w-full items-center gap-2 px-4 py-3 text-left">
      <span className="flex-1"><span className="block font-semibold">{titulo}</span>{sub && <span className="block text-xs text-(--a-b5a5c8)">{sub}</span>}</span>
      <ChevronDown size={18} className={'transition ' + (aberta ? 'rotate-180' : '')} />
    </button>
    {aberta && <div className="space-y-3 border-t border-(--a-3d3152) p-4 text-sm">{children}</div>}
  </section>
}
function Remover({ onClick, rotulo }: { onClick: () => void; rotulo: string }) {
  return <button type="button" onClick={onClick} aria-label={rotulo} className="shrink-0 rounded-lg p-2 text-red-300 hover:bg-[#4b253a]"><Trash2 size={15} /></button>
}
function Var({ id }: { id: string }) {
  return <span className="font-mono text-[11px] text-(--a-a998bd)">na fórmula: <strong className="text-(--a-e4d3ff)">{id}</strong></span>
}

function Tela({ children }: { children: React.ReactNode }) {
  return <main className="fundo-tema flex min-h-screen flex-col items-center justify-center p-6 text-center text-(--a-f2ebff)">{children}</main>
}

function Variaveis({ lista, inserir }: { lista: { v: string; d: string }[]; inserir: (v: string) => void }) {
  const [ver, setVer] = useState(false)
  return <div className="rounded-xl border border-dashed border-(--a-6d5690) p-2">
    <button type="button" onClick={() => setVer(v => !v)} className="text-xs font-semibold text-(--a-d3adf0)">{ver ? '▾' : '▸'} Variáveis que as fórmulas podem usar ({lista.length})</button>
    {ver && <><p className="mt-1 text-[11px] text-(--a-a998bd)">Toque numa fórmula e depois numa variável para inserir.</p>
      <div className="mt-2 flex flex-wrap gap-1">{lista.map(x => <button key={x.v} type="button" title={x.d} onMouseDown={e => e.preventDefault()} onClick={() => inserir(x.v)} className="rounded-full bg-(--s-2b2140) px-2 py-0.5 font-mono text-[11px] hover:bg-(--s-3a2c58)">{x.v}</button>)}</div></>}
  </div>
}

function Previa({ def, validacao }: { def: Def; validacao: ReturnType<typeof validarSistema> | null }) {
  const sistema = validacao?.ok ? validacao.sistema : null
  const [dados, setDados] = useState<DadosFicha | null>(null)
  const chave = sistema ? JSON.stringify([sistema.campos.map(c => c.id), sistema.atributos.map(a => a.id), sistema.pericias?.lista.map(p => p.id), sistema.recursos.map(r => r.id)]) : ''
  const [chaveDados, setChaveDados] = useState('')
  if (sistema && chave !== chaveDados) { setChaveDados(chave); setDados(fichaVazia(sistema, 'Personagem de teste')) }
  if (!sistema || !dados) return <p className="rounded-xl bg-[#3a2a14]/95 p-4 text-sm text-[#f6dca8]">Corrija os problemas acima para ver a prévia de “{def.nome || 'seu sistema'}”.</p>
  return <div className="rounded-2xl border border-(--a-8b6cba) bg-(--s-100d1c)/90 p-3">
    <p className="mb-3 flex items-center gap-2 text-xs text-(--a-d3adf0)">👀 Prévia: mexa à vontade, nada aqui é salvo.</p>
    <FichaGenerica sistema={sistema} dados={dados} onChange={setDados} />
  </div>
}

function EscolherModelo({ escolher }: { escolher: (d: Def) => void }) {
  const modelos = SISTEMAS.filter(s => !s.oculto)
  return <Tela>
    <div className="w-full max-w-lg rounded-3xl border border-(--a-655079) bg-(--s-1d1733)/95 p-6 text-left shadow-xl">
      <h1 className="text-2xl font-bold">✍️ Criar sistema autoral</h1>
      <p className="mt-2 text-sm text-(--a-cfc0df)">Monte atributos, perícias, fórmulas e recursos. A ficha calcula tudo sozinha e você vê o resultado na hora.</p>
      <button type="button" onClick={() => escolher(paraDef(sistemaEmBranco() as Partial<Sistema> & Record<string, unknown>, true))} className="mt-5 w-full rounded-xl bg-(--a-7654bb) p-3 text-left font-semibold hover:bg-(--a-8a67ce)">
        🌱 Começar com um exemplo simples<span className="block text-xs font-normal text-(--a-e4d3ff)">3 atributos, vida, defesa e algumas perícias para você mudar.</span></button>
      <label className="mt-4 block text-sm">Ou copiar a estrutura de um sistema da plataforma
        <select defaultValue="" onChange={e => { const s = modelos.find(m => m.id === e.target.value); if (s) escolher({ ...paraDef({ ...s, nome: s.nome + ' (minha versão)' } as unknown as Partial<Sistema> & Record<string, unknown>), creditos: s.creditos }) }} className={input + ' mt-1'}>
          <option value="">Escolha…</option>{modelos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}</select></label>
      <p className="mt-3 text-xs text-(--a-a998bd)">Ao copiar um sistema de licença aberta, os créditos exigidos vão junto.</p>
      <Link href="/central?secao=sistemas" className="mt-5 inline-block text-sm text-(--a-c7a8ff) underline">Voltar</Link>
    </div>
  </Tela>
}
