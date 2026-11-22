'use client'

import { useState, type ReactNode } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Eye, EyeOff, GripVertical, ImagePlus, Loader2, Pencil, X } from 'lucide-react'
import NaTela from '@/components/NaTela'
import FichaManual from '@/components/fichas/FichaManual'
import ListaArrastavel from '@/components/mesa/ListaArrastavel'
import { enviarImagemNuvem, ErroNuvem } from '@/lib/nuvem/cliente'
import { fichaVazia, tornarManual } from '@/lib/sistemas/calculo'
import { ABAS_FICHA, BLOCOS_FICHA, LARGURAS, blocosEmOrdem } from '@/lib/sistemas/montagemFicha'
import { ARVORES_VISUAIS, TEMAS_ESTUDIO } from '@/lib/sistemas/visualAutor'
import type { DadosFicha, FonteAutor, LarguraBloco, MontagemFicha, SecaoFicha, Sistema, VisualAutor } from '@/lib/sistemas/tipos'

/**
 * Estúdio da ficha (v0.36.6): o autor monta a ficha do sistema do jeito dele, vendo a prévia ao vivo.
 * Partes: arrastar abas e partes, largura numa grade de 12 colunas, esconder e renomear.
 * Cores, imagens (logo, fundo, moldura) e formatos (cartões, bordas, atributos, barras). Nada vira código livre:
 * tudo é escolhido em listas e conferido no servidor (montagemFicha.ts).
 */
type Aba = 'partes' | 'cores' | 'imagens' | 'formatos'
const ABAS: { id: Aba; nome: string }[] = [{ id: 'partes', nome: '🧩 Partes' }, { id: 'cores', nome: '🎨 Cores' }, { id: 'imagens', nome: '🖼️ Imagens' }, { id: 'formatos', nome: '✨ Formatos' }]
const EXTRAS_ABA = ['marcas', 'formas', 'invocacoes', 'efeitos']
const FONTES: { id: '' | FonteAutor; nome: string }[] = [{ id: '', nome: 'Normal' }, { id: 'serifada', nome: 'Serifada (livro antigo)' }, { id: 'classica', nome: 'Clássica (gravada em pedra)' }, { id: 'moderna', nome: 'Moderna' }, { id: 'mono', nome: 'Máquina de escrever' }]
const campo = 'w-full min-w-0 rounded-lg border border-(--a-5e4b78) bg-(--s-151123) px-2 py-1.5 text-sm text-white'

function Opcoes<T extends string | number | undefined>({ rotulo, valor, opcoes, mudar }: { rotulo: string; valor: T; opcoes: { id: T; nome: string; desabilitado?: boolean }[]; mudar: (v: T) => void }) {
  return <fieldset className="text-xs"><legend className="mb-1 font-semibold">{rotulo}</legend>
    <div className="flex flex-wrap gap-1.5">{opcoes.map(o => <button key={String(o.id)} type="button" aria-pressed={valor === o.id} disabled={o.desabilitado} onClick={() => mudar(o.id)}
      className={'min-h-9 rounded-lg border px-2.5 py-1 text-xs transition disabled:opacity-40 ' + (valor === o.id ? 'border-(--ouro) bg-(--s-3a2c58) text-white' : 'border-(--a-55456e) text-(--a-d6c8e8) hover:bg-(--s-2b2140)')}>{o.nome}</button>)}</div>
  </fieldset>
}

function EnviarImagem({ rotulo, dica, url, mudar }: { rotulo: string; dica: string; url?: string; mudar: (u: string | undefined) => void }) {
  const [ocupado, setOcupado] = useState(false), [erro, setErro] = useState('')
  async function enviar(f: File) {
    setOcupado(true); setErro('')
    try { mudar(await enviarImagemNuvem('imagens', f, 1600)) } catch (e) { setErro(e instanceof ErroNuvem ? e.message : 'Falha ao enviar a imagem.') } finally { setOcupado(false) }
  }
  return <div className="rounded-xl border border-(--a-3d3152) p-3 text-xs">
    <p className="font-semibold">{rotulo}</p><p className="mt-0.5 text-(--a-b4aeca)">{dica}</p>
    <div className="mt-2 flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url ? <img src={url} alt="" className="h-14 w-20 rounded-lg border border-(--a-55456e) object-cover" /> : <span className="grid h-14 w-20 place-items-center rounded-lg border border-dashed border-(--a-55456e) text-(--a-a998bd)">sem imagem</span>}
      <label className={'inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-lg bg-(--a-7654bb) px-2.5 py-1.5 font-semibold ' + (ocupado ? 'pointer-events-none opacity-60' : '')}>
        {ocupado ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />} {url ? 'Trocar' : 'Enviar'}
        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label={rotulo} onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void enviar(f) }} /></label>
      {url && <button type="button" onClick={() => mudar(undefined)} className="min-h-9 rounded-lg border border-(--a-55456e) px-2.5">Tirar</button>}
    </div>
    {erro && <p role="alert" className="mt-1 text-red-200">{erro}</p>}
  </div>
}

function Caixa({ id, largura, oculto, selecionado, nome, escolher, alternar }: { id: string; largura: LarguraBloco; oculto: boolean; selecionado: boolean; nome: string; escolher: () => void; alternar: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, gridColumn: `span ${largura}`, zIndex: isDragging ? 5 : undefined }}
    data-caixa={id} className={'relative flex min-h-16 min-w-0 flex-col rounded-lg border p-1.5 text-[11px] leading-tight ' + (selecionado ? 'border-(--ouro) bg-(--s-3a2c58)' : 'border-(--a-55456e) bg-(--s-201a32)') + (oculto ? ' opacity-45 [background-image:repeating-linear-gradient(135deg,transparent_0_6px,#ffffff0d_6px_12px)]' : '') + (isDragging ? ' shadow-[0_8px_24px_#000a]' : '')}>
    <div className="flex items-center gap-0.5">
      <button type="button" {...attributes} {...listeners} aria-label={'Arrastar ' + nome} className="touch-none cursor-grab rounded p-0.5 text-(--a-a998bd) hover:bg-white/10"><GripVertical size={13} /></button>
      <button type="button" onClick={alternar} aria-label={(oculto ? 'Mostrar ' : 'Esconder ') + nome} aria-pressed={!oculto} className="ml-auto rounded p-0.5 hover:bg-white/10">{oculto ? <EyeOff size={13} /> : <Eye size={13} />}</button>
    </div>
    <button type="button" onClick={escolher} aria-pressed={selecionado} className="mt-0.5 flex-1 break-words text-left font-semibold">{nome}<span className="block font-normal text-(--a-a998bd)">{LARGURAS.find(l => l.valor === largura)?.nome}</span></button>
  </li>
}

function GradePartes({ secao, montagem, mudar, titulos }: { secao: string; montagem: MontagemFicha; mudar: (m: MontagemFicha) => void; titulos: Record<string, string> }) {
  const blocos = blocosEmOrdem(secao, montagem)
  const [sel, setSel] = useState<string | null>(null)
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const chave = (id: string) => secao + '.' + id
  const mudarBloco = (id: string, f: (b: NonNullable<MontagemFicha['blocos']>[string]) => NonNullable<MontagemFicha['blocos']>[string]) => {
    // Grava a ordem de todas as partes desta aba, para a ordem nunca ficar pela metade.
    const base = { ...(montagem.blocos ?? {}) }
    blocos.forEach((b, i) => { base[chave(b.id)] = { ...base[chave(b.id)], ordem: i + 1 } })
    base[chave(id)] = f(base[chave(id)] ?? {})
    mudar({ ...montagem, blocos: base })
  }
  const soltar = (ev: DragEndEvent) => {
    if (!ev.over || ev.active.id === ev.over.id) return
    const ids = blocos.map(b => b.id), de = ids.indexOf(String(ev.active.id)), para = ids.indexOf(String(ev.over.id))
    if (de < 0 || para < 0) return
    ids.splice(para, 0, ids.splice(de, 1)[0])
    const base = { ...(montagem.blocos ?? {}) }
    ids.forEach((id, i) => { base[chave(id)] = { ...base[chave(id)], ordem: i + 1 } })
    mudar({ ...montagem, blocos: base })
  }
  const atual = blocos.find(b => b.id === sel)
  return <div className="space-y-2">
    <p className="text-[11px] text-(--a-b4aeca)">Arraste as caixas para mudar a ordem. A grade mostra o computador; no celular, as partes ficam uma embaixo da outra, nesta ordem.</p>
    <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={soltar}>
      <SortableContext items={blocos.map(b => b.id)} strategy={rectSortingStrategy}>
        <ol className="grid grid-cols-12 gap-1.5 rounded-xl border border-(--a-3d3152) bg-black/25 p-1.5" aria-label={'Partes da aba, na ordem'}>
          {blocos.map(b => <Caixa key={b.id} id={b.id} nome={titulos[b.id] ?? b.cfg.titulo ?? b.nome} largura={b.cfg.largura ?? 12} oculto={!!b.cfg.oculto} selecionado={sel === b.id}
            escolher={() => setSel(s => s === b.id ? null : b.id)} alternar={() => mudarBloco(b.id, x => ({ ...x, oculto: x.oculto ? undefined : true }))} />)}
        </ol>
      </SortableContext>
    </DndContext>
    {atual ? <div className="space-y-2 rounded-xl border border-(--ouro)/50 p-2.5" data-inspetor>
      <p className="flex items-center gap-1.5 text-xs font-semibold"><Pencil size={13} /> {atual.nome}</p>
      <Opcoes rotulo="Largura no computador" valor={atual.cfg.largura ?? 12} opcoes={LARGURAS.map(l => ({ id: l.valor, nome: l.nome }))} mudar={v => mudarBloco(atual.id, x => ({ ...x, largura: v === 12 ? undefined : v }))} />
      {atual.titulo && <label className="block text-xs">Nome na ficha<input value={atual.cfg.titulo ?? ''} maxLength={40} placeholder={atual.titulo} onChange={e => mudarBloco(atual.id, x => ({ ...x, titulo: e.target.value || undefined }))} className={campo + ' mt-1'} /></label>}
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!atual.cfg.oculto} onChange={e => mudarBloco(atual.id, x => ({ ...x, oculto: e.target.checked ? undefined : true }))} /> Aparece na ficha</label>
    </div> : <p className="text-[11px] text-(--a-a998bd)">Toque no nome de uma caixa para mudar a largura{secao === 'principal' || secao === 'atributos' ? ' e o nome' : ''}.</p>}
  </div>
}

export default function EstudioFicha({ sistema, visual, mudarVisual, nomes, mudarNome, extras, fechar }: {
  sistema: Sistema | null; visual: VisualAutor; mudarVisual: (v: VisualAutor) => void
  nomes: Partial<Record<SecaoFicha, string>>; mudarNome: (id: SecaoFicha, nome: string) => void; extras: string[]; fechar: () => void
}) {
  const [aba, setAba] = useState<Aba>('partes')
  const [ver, setVer] = useState<'editar' | 'previa'>('editar')
  const [secao, setSecao] = useState<string>('principal')
  const montagem = visual.montagem ?? {}
  const mudarMontagem = (m: MontagemFicha) => mudarVisual({ ...visual, montagem: m })
  const set = <K extends keyof VisualAutor>(k: K, v: VisualAutor[K]) => { const n = { ...visual }; if (v === undefined || v === '') delete n[k]; else n[k] = v; mudarVisual(n) }

  // Abas que existem neste sistema, na ordem do autor.
  const existentes = ABAS_FICHA.filter(a => !EXTRAS_ABA.includes(a.id) || extras.includes(a.id))
  const ordem = (montagem.secoes ?? []).map(x => x.id)
  const abas = [...existentes].sort((a, b) => { const ia = ordem.indexOf(a.id), ib = ordem.indexOf(b.id); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) })
  const cfgAba = (id: string) => montagem.secoes?.find(x => x.id === id) ?? { id }
  const gravarAbas = (lista: { id: string; oculta?: boolean; icone?: string }[]) => mudarMontagem({ ...montagem, secoes: lista.map(x => ({ id: x.id, ...(x.oculta ? { oculta: true } : {}), ...(x.icone ? { icone: x.icone } : {}) })) })
  const mudarAba = (id: string, f: (x: { id: string; oculta?: boolean; icone?: string }) => { id: string; oculta?: boolean; icone?: string }) => gravarAbas(abas.map(a => a.id === id ? f(cfgAba(a.id)) : cfgAba(a.id)))
  const titulos: Record<string, string> = sistema ? {
    atributos: sistema.tituloAtributos?.trim() || 'Atributos', pericias: sistema.pericias?.titulo?.trim() || 'Perícias',
  } : {}

  // Ficha de teste para a prévia (recomeça quando a estrutura do sistema muda).
  const chave = sistema ? JSON.stringify([sistema.campos.map(c => c.id), sistema.atributos.map(a => a.id), sistema.recursos.map(r => r.id), sistema.listas.map(l => l.id)]) : ''
  const [dados, setDados] = useState<DadosFicha | null>(null), [chaveDados, setChaveDados] = useState('')
  if (sistema && chave !== chaveDados) { setChaveDados(chave); setDados(tornarManual(sistema, fichaVazia(sistema, 'Personagem de teste'))) }

  let conteudo: ReactNode
  if (aba === 'partes') conteudo = <div className="space-y-4">
    <section className="space-y-2"><h3 className="text-sm font-bold">Abas da ficha</h3>
      <p className="text-[11px] text-(--a-b4aeca)">Arraste para mudar a ordem do menu. Troque o ícone e o nome, esconda o que o seu sistema não usa (a Principal sempre fica) e toque em Montar para arrumar as partes de dentro.</p>
      <ListaArrastavel rotulo="Abas da ficha" itens={abas} chave={a => a.id} className="space-y-1.5"
        mover={(de, para) => { const l = abas.map(a => cfgAba(a.id)); l.splice(para, 0, l.splice(de, 1)[0]); gravarAbas(l) }}>
        {(a, _i, alca) => { const c = cfgAba(a.id), temBlocos = !!BLOCOS_FICHA[a.id]
          return <div className={'flex items-center gap-1.5 rounded-xl border p-1.5 ' + (secao === a.id ? 'border-(--ouro) bg-(--s-2b2140)' : 'border-(--a-3d3152)') + (c.oculta ? ' opacity-50' : '')} data-aba-estudio={a.id}>
            {alca}
            <input aria-label={'Ícone de ' + a.nome} value={c.icone ?? ''} placeholder={a.icone} maxLength={4} onChange={e => mudarAba(a.id, x => ({ ...x, icone: e.target.value.trim() || undefined }))} className={campo + ' !w-11 shrink-0 text-center'} />
            {a.id === 'arvore' ? <span className="min-w-0 flex-1 truncate text-sm">{a.nome}</span>
              : <input aria-label={'Nome da aba ' + a.nome} value={nomes[a.id as SecaoFicha] ?? ''} placeholder={a.id === 'atributos' && titulos.atributos ? titulos.atributos : a.nome} maxLength={40} onChange={e => mudarNome(a.id as SecaoFicha, e.target.value)} className={campo + ' flex-1'} />}
            {a.id !== 'principal' && <button type="button" aria-pressed={!c.oculta} aria-label={(c.oculta ? 'Mostrar a aba ' : 'Esconder a aba ') + a.nome} onClick={() => mudarAba(a.id, x => ({ ...x, oculta: x.oculta ? undefined : true }))} className="grid size-9 shrink-0 place-items-center rounded-lg hover:bg-white/10">{c.oculta ? <EyeOff size={15} /> : <Eye size={15} />}</button>}
            {temBlocos && <button type="button" onClick={() => { setSecao(a.id); setVer('editar') }} aria-pressed={secao === a.id} className="min-h-9 shrink-0 rounded-lg border border-(--a-55456e) px-2 text-xs">Montar</button>}
          </div> }}
      </ListaArrastavel>
    </section>
    {BLOCOS_FICHA[secao] && <section className="space-y-2" data-grade-estudio={secao}><h3 className="text-sm font-bold">Partes de “{nomes[secao as SecaoFicha] || abas.find(a => a.id === secao)?.nome}”</h3>
      <GradePartes key={secao} secao={secao} montagem={montagem} mudar={mudarMontagem} titulos={secao === 'atributos' ? titulos : {}} /></section>}
    {visual.montagem && <button type="button" onClick={() => set('montagem', undefined)} className="text-xs text-(--a-c7a8ff) underline">Desfazer a montagem (volta à ordem padrão)</button>}
  </div>
  else if (aba === 'cores') conteudo = <div className="space-y-4">
    <section><h3 className="mb-1 text-sm font-bold">Temas prontos</h3><p className="mb-2 text-[11px] text-(--a-b4aeca)">Um ponto de partida: depois mude o que quiser. Não mexe na montagem nem nas imagens.</p>
      <div className="grid grid-cols-2 gap-1.5">{TEMAS_ESTUDIO.map(t => <button key={t.id} type="button" onClick={() => mudarVisual({ ...t.visual, ...(visual.arvore ? { arvore: visual.arvore } : {}), ...(visual.montagem ? { montagem: visual.montagem } : {}),
        ...(visual.logo ? { logo: visual.logo } : {}), ...(visual.fundoImagem ? { fundoImagem: visual.fundoImagem, fundoEscuro: visual.fundoEscuro } : {}) })}
        className="flex min-h-11 items-center gap-2 rounded-lg border border-(--a-55456e) px-2 text-left text-xs hover:bg-(--s-2b2140)">
        <span aria-hidden className="flex shrink-0 overflow-hidden rounded-md border border-white/20">{[t.visual.fundo, t.visual.cartao, t.visual.acento].map((c, i) => <span key={i} className="block size-4" style={{ background: c }} />)}</span>{t.nome}</button>)}</div></section>
    <section><h3 className="mb-2 text-sm font-bold">Cores</h3>
      <div className="grid grid-cols-3 gap-2">{([['acento', 'Destaque', '#ed9cd8'], ['borda', 'Bordas', '#55456e'], ['cartao', 'Cartões', '#201a32'], ['texto', 'Texto', '#e9e1f5'], ['fundo', 'Fundo da página', '#0d0b14']] as const).map(([k, nome, padrao]) =>
        <label key={k} className="block text-xs">{nome}<input type="color" value={visual[k] ?? padrao} onChange={e => set(k, e.target.value)} className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-1" />
          {visual[k] && <button type="button" onClick={() => set(k, undefined)} className="mt-0.5 text-[10px] text-(--a-c7a8ff) underline">padrão</button>}</label>)}</div></section>
    <section className="grid gap-2">
      <label className="block text-xs">Letra dos títulos<select value={visual.fonte ?? ''} onChange={e => set('fonte', (e.target.value || undefined) as FonteAutor | undefined)} className={campo + ' mt-1'}>{FONTES.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select></label>
      <label className="block text-xs">Letra do texto<select value={visual.fonteCorpo ?? ''} onChange={e => set('fonteCorpo', (e.target.value || undefined) as FonteAutor | undefined)} className={campo + ' mt-1'}>{FONTES.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select></label>
      <label className="block text-xs">Desenho da árvore<select value={visual.arvore ?? ''} onChange={e => set('arvore', e.target.value || undefined)} className={campo + ' mt-1'}>{ARVORES_VISUAIS.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs">Ligações da árvore<select value={visual.arvoreLigacao ?? ''} onChange={e => set('arvoreLigacao', (e.target.value || undefined) as VisualAutor['arvoreLigacao'])} className={campo + ' mt-1'}>
          <option value="">Tracejadas</option><option value="reta">Retas</option><option value="curva">Curvas</option><option value="circuito">Circuito</option></select></label>
        <label className="block text-xs">Fundo da árvore<select value={visual.arvoreFundo ?? ''} onChange={e => set('arvoreFundo', (e.target.value || undefined) as VisualAutor['arvoreFundo'])} className={campo + ' mt-1'}>
          <option value="">Grade</option><option value="estrelas">Estrelas</option><option value="liso">Liso</option></select></label>
      </div>
      <p className="text-[11px] text-(--a-a998bd)">A árvore aparece na ficha como você montou no construtor (em “Árvore de habilidades padrão”), crescendo do centro para fora. Em cada hexágono dá para escolher símbolo, forma e tamanho.</p>
    </section>
  </div>
  else if (aba === 'imagens') conteudo = <div className="space-y-3">
    <p className="text-[11px] text-(--a-b4aeca)">PNG, JPG ou WebP. As imagens ficam guardadas na plataforma e só aparecem nas fichas do seu sistema. Use só imagens suas ou que você pode usar.</p>
    <EnviarImagem rotulo="Logo do sistema" dica="Aparece no topo de todas as abas da ficha. PNG com fundo transparente fica melhor." url={visual.logo} mudar={u => set('logo', u)} />
    <EnviarImagem rotulo="Fundo da ficha" dica="Cobre a página atrás dos cartões." url={visual.fundoImagem} mudar={u => mudarVisual(Object.fromEntries(Object.entries({ ...visual, fundoImagem: u, fundoEscuro: u ? visual.fundoEscuro : undefined }).filter(([, x]) => x !== undefined)) as VisualAutor)} />
    {visual.fundoImagem && <label className="block text-xs">Escurecer o fundo ({visual.fundoEscuro ?? 45}%) — deixa o texto mais fácil de ler
      <input type="range" min={0} max={90} step={5} value={visual.fundoEscuro ?? 45} onChange={e => set('fundoEscuro', Number(e.target.value))} className="mt-1 w-full" /></label>}
    <EnviarImagem rotulo="Moldura dos cartões" dica="A imagem vira a borda de cada cartão (os cantos da imagem viram os cantos da moldura)." url={visual.molduraImagem}
      mudar={u => mudarVisual(Object.fromEntries(Object.entries({ ...visual, molduraImagem: u, moldura: u ? 'imagem' : visual.moldura === 'imagem' ? undefined : visual.moldura }).filter(([, x]) => x !== undefined)) as VisualAutor)} />
  </div>
  else conteudo = <div className="space-y-4">
    <Opcoes rotulo="Cartões" valor={visual.cartaoEstilo} opcoes={[{ id: undefined, nome: 'Sólido' }, { id: 'vidro', nome: 'Vidro' }, { id: 'contorno', nome: 'Só contorno' }, { id: 'pergaminho', nome: 'Pergaminho' }]} mudar={v => set('cartaoEstilo', v)} />
    <Opcoes rotulo="Moldura" valor={visual.moldura} opcoes={[{ id: undefined, nome: 'Simples' }, { id: 'dupla', nome: 'Dupla' }, { id: 'ornamento', nome: 'Ornamento' }, { id: 'pergaminho', nome: 'Pergaminho' }, { id: 'neon', nome: 'Neon' }, { id: 'imagem', nome: 'Minha imagem', desabilitado: !visual.molduraImagem }]} mudar={v => set('moldura', v)} />
    <label className="block text-xs font-semibold">Cantos arredondados ({visual.raio ?? 16}px)<input type="range" min={0} max={32} value={visual.raio ?? 16} onChange={e => set('raio', Number(e.target.value))} className="mt-1 w-full" /></label>
    <Opcoes rotulo="Brilho dos cartões" valor={visual.brilho} opcoes={[{ id: undefined, nome: 'Nenhum' }, { id: 'suave', nome: 'Suave' }, { id: 'forte', nome: 'Forte' }]} mudar={v => set('brilho', v)} />
    <Opcoes rotulo="Formato dos atributos" valor={visual.atributosEstilo} opcoes={[{ id: undefined, nome: 'Quadrado' }, { id: 'circulo', nome: 'Círculo' }, { id: 'hexagono', nome: 'Hexágono' }, { id: 'escudo', nome: 'Escudo' }, { id: 'losango', nome: 'Losango' }]} mudar={v => set('atributosEstilo', v)} />
    <p className="-mt-2 text-[11px] text-(--a-a998bd)">A “lua minguante” continua na parte de Atributos do construtor.</p>
    <Opcoes rotulo="Barras de vida e recursos" valor={visual.barrasEstilo} opcoes={[{ id: undefined, nome: 'Normal' }, { id: 'fina', nome: 'Fina' }, { id: 'grossa', nome: 'Grossa' }, { id: 'brilho', nome: 'Brilhante' }, { id: 'segmentada', nome: 'Em gomos' }]} mudar={v => set('barrasEstilo', v)} />
  </div>

  return <NaTela><div role="dialog" aria-modal="true" aria-label="Estúdio da ficha" className="fixed inset-0 z-[95] flex flex-col bg-[#0d0b14] text-white">
    <header className="flex shrink-0 items-center gap-2 border-b border-(--a-3d3152) px-3 py-2">
      <h2 className="min-w-0 flex-1 truncate font-bold">🎨 Estúdio da ficha</h2>
      <div role="tablist" aria-label="Ver" className="flex gap-1 rounded-xl border border-(--a-55456e) p-0.5 lg:hidden">
        {(['editar', 'previa'] as const).map(v => <button key={v} type="button" role="tab" aria-selected={ver === v} onClick={() => setVer(v)} className={'rounded-lg px-3 py-1.5 text-xs font-semibold ' + (ver === v ? 'bg-(--a-5b4380)' : '')}>{v === 'editar' ? 'Editar' : '👀 Prévia'}</button>)}
      </div>
      <button type="button" onClick={fechar} className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-(--a-7654bb) px-3 text-sm font-semibold"><X size={16} /> Pronto</button>
    </header>
    <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[440px_minmax(0,1fr)]">
      <aside className={'h-full min-h-0 flex-col overflow-y-auto border-(--a-3d3152) lg:flex lg:border-r ' + (ver === 'editar' ? 'flex' : 'hidden')}>
        <div role="tablist" aria-label="Partes do estúdio" className="sticky top-0 z-10 grid grid-cols-4 gap-1 border-b border-(--a-3d3152) bg-[#0d0b14] p-2">
          {ABAS.map(a => <button key={a.id} type="button" role="tab" aria-selected={aba === a.id} onClick={() => setAba(a.id)} className={'min-h-10 rounded-lg px-1 text-[11px] font-semibold sm:text-xs ' + (aba === a.id ? 'bg-(--s-3a2c58) text-white shadow-[inset_0_-2px_0_var(--ouro)]' : 'text-(--a-cfc0df) hover:bg-(--s-2b2140)')}>{a.nome}</button>)}
        </div>
        <div className="p-3">{conteudo}
          {Object.keys(visual).length > 0 && <button type="button" onClick={() => mudarVisual({})} className="mt-6 w-full rounded-lg border border-(--a-55456e) py-2 text-xs">Voltar tudo à aparência padrão</button>}
        </div>
      </aside>
      <main aria-label="Prévia da ficha" className={'previa-estudio h-full min-h-0 overflow-y-auto p-3 sm:p-5 ' + (ver === 'previa' ? 'block' : 'hidden lg:block')}>
        <p className="mb-3 text-xs text-(--a-d3adf0)">👀 Prévia ao vivo: mexa à vontade, nada da ficha de teste é salvo.</p>
        {sistema && dados ? <FichaManual sistema={sistema} dados={dados} onChange={setDados} secaoForcada={secao} />
          : <p className="rounded-xl bg-[#3a2a14]/95 p-4 text-sm text-[#f6dca8]">Corrija os problemas do sistema para ver a prévia.</p>}
      </main>
    </div>
  </div></NaTela>
}
