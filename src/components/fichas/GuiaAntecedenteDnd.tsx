'use client'

import { useState } from 'react'
import type { DadosFicha } from '@/lib/sistemas/tipos'
import { idDe } from '@/lib/sistemas/dnd2024Classes'
import { MAGIAS_SRD } from '@/lib/sistemas/dnd2024Magias'
import { fontePermitida, FONTE_PHB } from '@/lib/sistemas/dnd2024Fontes'
import {
  ANTECEDENTES_GUIADOS, ATRIBUTOS_DND, PERICIAS_DND_ORIGENS, TALENTOS_ORIGEM_LEGADO,
  aplicarAntecedenteDnd, lerRegistroAntecedenteDnd, validarDetalhesAntecedenteDnd, validarDistribuicaoAntecedenteDnd,
  type AtributoDnd, type AumentosDnd, type RegistroAntecedenteDnd,
} from '@/lib/sistemas/dnd2024Antecedentes'

const seletor = 'w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-sm text-white disabled:opacity-60'
const NOME: Record<AtributoDnd, string> = {
  FOR: 'Força', DES: 'Destreza', CON: 'Constituição',
  INT: 'Inteligência', SAB: 'Sabedoria', CAR: 'Carisma',
}
const nomePericia = (id: string) => id.replaceAll('_', ' ').replace(/^./, s => s.toUpperCase())
const nomeAtributo = (id: string) => NOME[id as AtributoDnd] ?? id
const nomeFerramenta = (id: string) => id.startsWith('ferramenta_') ? id.slice('ferramenta_'.length).replaceAll('_', ' ') : nomePericia(id)
const slugFerramenta = (s: string) => 'ferramenta_' + s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 56)

/** Os valores de atributos já incluem os aumentos aplicados pela criação. */
export default function GuiaAntecedenteDnd({ d, onChange, somenteLeitura, fontes }: {
  d: DadosFicha; onChange: (v: DadosFicha) => void; somenteLeitura?: boolean
  fontes: Set<string> | null
}) {
  const id = idDe(d.campos.antecedente)
  const def = ANTECEDENTES_GUIADOS[id]
  const anterior = lerRegistroAntecedenteDnd(d.dndAntecedente)
  const atual = anterior?.id === id ? anterior : null
  const entradas = Object.entries(atual?.aumentos ?? {})
  const [formato, setFormato] = useState<'2+1' | '1+1+1'>(entradas.length === 3 ? '1+1+1' : '2+1')
  const [mais2, setMais2] = useState<AtributoDnd | ''>((entradas.find(([, n]) => n === 2)?.[0] ?? '') as AtributoDnd | '')
  const [mais1, setMais1] = useState<AtributoDnd | ''>((entradas.find(([, n]) => n === 1)?.[0] ?? '') as AtributoDnd | '')
  const [tres, setTres] = useState<(AtributoDnd | '')[]>(entradas.length === 3 ? entradas.map(([a]) => a as AtributoDnd) : ['', '', ''])
  const [equipamento, setEquipamento] = useState<'' | 'pacote' | 'moedas'>(atual?.equipamento ?? '')
  const [talento, setTalento] = useState(atual?.talento ?? '')
  const [instrumento, setInstrumento] = useState(atual?.instrumento ?? '')
  const [idioma, setIdioma] = useState(atual?.idioma ?? '')
  const [ferramentaEscolhida, setFerramentaEscolhida] = useState(atual?.ferramentaEscolhida ?? '')
  const [talentoPericias, setTalentoPericias] = useState<string[]>(atual?.talentoPericias ?? ['', '', ''])
  const [talentoFerramentas, setTalentoFerramentas] = useState<string[]>(atual?.talentoFerramentas ?? ['', '', ''])
  const [talentoLista, setTalentoLista] = useState<'clerigo' | 'druida' | 'mago'>(atual?.talentoLista ?? 'mago')
  const [talentoAtributo, setTalentoAtributo] = useState<'' | 'INT' | 'SAB' | 'CAR'>(atual?.talentoAtributo ?? '')
  const [talentoMagias, setTalentoMagias] = useState<string[]>(atual?.talentoMagias ?? ['', '', ''])
  const [erro, setErro] = useState('')

  if (!id) return <section className="rounded-xl border border-(--a-55456e) p-4 text-sm text-(--a-c4b6d4)">
    Escolha um antecedente na aba Principal para começar a distribuição guiada de atributos.
  </section>
  if (!def) return <section className="rounded-xl border border-amber-500/35 p-4 text-sm">
    <h3 className="font-semibold">Antecedente desconhecido: {String(d.campos.antecedente)}</h3>
    <p className="mt-2 text-(--a-c4b6d4)">O mestre precisa conferir essa origem antes de calcular ou aplicar seus benefícios.</p>
  </section>

  const legado = def.fonte === 'phb2014'
  const comercial = def.fonte === 'phb2024'
  const elegiveis = def.elegiveis
  const bonus: AumentosDnd = formato === '2+1'
    ? { ...(mais2 ? { [mais2]: 2 } : {}), ...(mais1 ? { [mais1]: mais1 === mais2 ? 3 : 1 } : {}) }
    : Object.fromEntries((legado ? tres : elegiveis).filter(Boolean).map(a => [a, 1])) as AumentosDnd
  const talentoId = legado ? talento : def.talentoId
  const listaFixada = talentoId === 'iniciado-magia-clerigo' ? 'clerigo'
    : talentoId === 'iniciado-magia-druida' ? 'druida'
    : talentoId === 'iniciado-magia-mago' ? 'mago' : null
  const listaMagia = listaFixada ?? talentoLista
  const usarMagias = talentoId?.startsWith('iniciado-magia') ?? false
  const periciasAdicionais = talentoId === 'habilidoso'
  const ferramentasAdicionais = talentoId === 'crafter' || talentoId === 'musician'

  const extras: Partial<RegistroAntecedenteDnd> = legado
    ? { talento, instrumento: instrumento.trim(), idioma: idioma.trim() }
    : { equipamento: equipamento || undefined }
  if (def.ferramentaEscolha) extras.ferramentaEscolhida = ferramentaEscolhida.trim()
  if (periciasAdicionais) extras.talentoPericias = talentoPericias
  if (ferramentasAdicionais) extras.talentoFerramentas = talentoFerramentas.map(x => x.trim())
  if (usarMagias) {
    extras.talentoLista = listaMagia
    extras.talentoAtributo = talentoAtributo || undefined
    extras.talentoMagias = talentoMagias
  }

  const registro: RegistroAntecedenteDnd = { id, aumentos: bonus, ...extras }
  const avisos = [
    ...validarDistribuicaoAntecedenteDnd(id, bonus),
    ...validarDetalhesAntecedenteDnd(registro),
    ...(legado && (!talento || !instrumento.trim() || !idioma.trim())
      ? ['Forasteiro: escolha o talento, o instrumento e o idioma.'] : []),
    ...(legado && TALENTOS_ORIGEM_LEGADO.find(t => t.id === talento)?.fonte === 'phb2024'
      && !fontePermitida(FONTE_PHB, fontes)
      ? ['O mestre precisa liberar o PHB 2024 para esse talento.'] : []),
    ...(comercial && !fontePermitida(FONTE_PHB, fontes) ? ['O mestre precisa liberar o PHB 2024.'] : []),
  ]
  const valido = avisos.length === 0 && !somenteLeitura
  const talentos = TALENTOS_ORIGEM_LEGADO.filter(t =>
    fontePermitida(t.fonte === 'phb2024' ? FONTE_PHB : undefined, fontes) || t.id === talento)
  const listaTruques = MAGIAS_SRD.filter(m => m.nivel === 0 && m.classes.includes(listaMagia))
  const listaNivel1 = MAGIAS_SRD.filter(m => m.nivel === 1 && m.classes.includes(listaMagia))
  const setTresItem = (i: number, valor: string) => setTres(v => v.map((x, j) => i === j ? valor as AtributoDnd | '' : x))
  const setTalentoItem = (i: number, valor: string) => setTalentoPericias(v => v.map((x, j) => i === j ? valor : x))
  const setFerramentaItem = (i: number, valor: string) => setTalentoFerramentas(v => v.map((x, j) => i === j ? valor : x))
  const setMagiaItem = (i: number, valor: string) => setTalentoMagias(v => v.map((x, j) => i === j ? valor : x))
  const salvar = () => {
    setErro('')
    if (!valido) { setErro(avisos[0] ?? 'Complete as escolhas antes de aplicar os aumentos.'); return }
    const resultado = aplicarAntecedenteDnd(d, bonus, extras)
    if (!resultado.ok) { setErro(resultado.erro); return }
    onChange(resultado.dados)
  }

  return <section aria-label="Criação guiada pelo antecedente" className="space-y-4 rounded-2xl border border-(--a-55456e) bg-(--s-201a32) p-4">
    <div>
      <h3 className="font-bold text-(--a-ed9cd8)">Criação guiada · {def.nome}</h3>
      <p className="mt-1 text-xs text-(--a-c4b6d4)">{comercial
        ? 'Livro do Jogador 2024: atributos, perícias, ferramenta, talento e equipamento conferidos; consulte o livro para os efeitos completos dos talentos.'
        : legado ? 'Legado 2014: opção autorizada pelo mestre e adaptada às regras de 2024.'
          : 'SRD 5.2.1: os aumentos só podem ser distribuídos entre os três atributos do antecedente.'}</p>
    </div>
    <p className="text-sm text-(--a-cfc0df)"><strong>Atributos permitidos:</strong> {elegiveis.map(nomeAtributo).join(', ')}.</p>
    <p className="text-sm text-(--a-cfc0df)"><strong>Perícias:</strong> {def.pericias.map(nomePericia).join(', ')}.
      <strong> Ferramenta:</strong> {def.ferramenta}. <strong>Talento:</strong> {def.talento}.</p>
    <p className="text-xs text-(--a-a998bd)">{def.nota}</p>
    {anterior && <p className="rounded-lg border border-(--a-62527e) p-2 text-xs text-(--a-cfc0df)">
      Últimos aumentos aplicados: {Object.entries(anterior.aumentos).map(([a, n]) => a + ' +' + n).join(' · ')}.
      {anterior.id !== id && <strong className="ml-1 text-amber-200">O antecedente mudou; confirme uma nova distribuição para substituir os bônus anteriores.</strong>}
    </p>}
    <p className="rounded-lg border border-amber-500/30 p-2 text-xs text-amber-100">
      A ficha guarda atributos finais. Se os bônus já foram somados manualmente numa ficha antiga, confira os valores antes de aplicar. Repetir a mesma distribuição registrada não soma novamente.
    </p>
    <fieldset className="space-y-2" disabled={somenteLeitura}>
      <legend className="text-sm font-semibold">Distribuição dos três pontos</legend>
      <label className="mr-4 inline-flex items-center gap-2 text-sm">
        <input type="radio" checked={formato === '2+1'} onChange={() => setFormato('2+1')}/> +2 e +1
      </label>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="radio" checked={formato === '1+1+1'} onChange={() => setFormato('1+1+1')}/> +1, +1, +1
      </label>
      {formato === '2+1' ? <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs">Atributo +2
          <select className={seletor + ' mt-1'} value={mais2} onChange={e => setMais2(e.target.value as AtributoDnd | '')}>
            <option value="">Escolha...</option>{elegiveis.map(a => <option key={a} value={a}>{NOME[a]}</option>)}
          </select>
        </label>
        <label className="text-xs">Outro atributo +1
          <select className={seletor + ' mt-1'} value={mais1} onChange={e => setMais1(e.target.value as AtributoDnd | '')}>
            <option value="">Escolha...</option>{elegiveis.map(a => <option key={a} value={a}>{NOME[a]}</option>)}
          </select>
        </label>
      </div> : legado ? <div className="grid gap-3 sm:grid-cols-3">
        {tres.map((selecionado, i) => <label key={i} className="text-xs">Atributo {i + 1} (+1)
          <select className={seletor + ' mt-1'} value={selecionado} onChange={e => setTresItem(i, e.target.value)}>
            <option value="">Escolha...</option>{elegiveis.map(a => <option key={a} value={a}>{NOME[a]}</option>)}
          </select>
        </label>)}
      </div> : <p className="text-xs text-(--a-cfc0df)">+1 em {elegiveis.map(nomeAtributo).join(', ')}.</p>}
    </fieldset>
    {def.ferramentaEscolha && <label className="block text-xs">Qual {def.ferramentaEscolha === 'artesao' ? 'tipo de ferramentas de artesão' : def.ferramentaEscolha === 'jogo' ? 'tipo de kit de jogos' : 'instrumento musical'}?
      <input className={seletor + ' mt-1'} disabled={somenteLeitura} value={ferramentaEscolhida} maxLength={70}
        onChange={e => setFerramentaEscolhida(e.target.value)} placeholder="Ex.: ferramentas de carpinteiro"/>
    </label>}
    {legado && <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs">Talento de origem (compatibilidade 2024)
        <select className={seletor + ' mt-1'} disabled={somenteLeitura} value={talento} onChange={e => setTalento(e.target.value)}>
          <option value="">Selecione...</option>{talentos.map(t => <option key={t.id} value={t.id}>{t.nome}{t.fonte === 'phb2024' ? ' (PHB 2024)' : ' (SRD)'}</option>)}
        </select>
      </label>
      <label className="text-xs">Instrumento musical
        <input className={seletor + ' mt-1'} disabled={somenteLeitura} value={instrumento} maxLength={70}
          onChange={e => setInstrumento(e.target.value)} placeholder="Ex.: flauta"/>
      </label>
      <label className="text-xs">Idioma adicional
        <input className={seletor + ' mt-1'} disabled={somenteLeitura} value={idioma} maxLength={70}
          onChange={e => setIdioma(e.target.value)} placeholder="Escolha permitida pelo mestre"/>
      </label>
      <p className="self-center text-xs text-(--a-c4b6d4)">Equipamento e característica Viajante devem ser conferidos com o PHB 2014.</p>
    </div>}
    {periciasAdicionais && <fieldset className="space-y-2" disabled={somenteLeitura}>
      <legend className="text-sm font-semibold">Talento Habilidoso: escolha três novas perícias ou ferramentas</legend>
      {talentoPericias.map((selecionado, i) => <div key={i} className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs">Escolha {i + 1}
          <select className={seletor + ' mt-1'}
            value={selecionado.startsWith('ferramenta_') ? '__ferramenta' : selecionado}
            onChange={e => setTalentoItem(i, e.target.value === '__ferramenta' ? 'ferramenta_' : e.target.value)}>
            <option value="">Escolha uma perícia ou ferramenta</option>
            {PERICIAS_DND_ORIGENS.map(p => <option key={p} value={p}>{nomePericia(p)}</option>)}
            <option value="__ferramenta">Ferramenta (descrever ao lado)</option>
          </select>
        </label>
        {selecionado.startsWith('ferramenta_') && <label className="text-xs">Nome da ferramenta
          <input className={seletor + ' mt-1'} value={nomeFerramenta(selecionado)} disabled={somenteLeitura}
            onChange={e => setTalentoItem(i, slugFerramenta(e.target.value))} placeholder="Ex.: kit de herbalismo"/>
        </label>}
      </div>)}
      <p className="text-xs text-(--a-a998bd)">Perícias elegíveis são aplicadas como proficiência; ferramentas ficam registradas para conferência do mestre.</p>
    </fieldset>}
    {ferramentasAdicionais && <fieldset className="grid gap-2 sm:grid-cols-3" disabled={somenteLeitura}>
      <legend className="text-sm font-semibold">{talentoId === 'crafter' ? 'Artesão: três tipos de ferramentas de artesão' : 'Músico: três instrumentos musicais'}</legend>
      {talentoFerramentas.map((v, i) => <label key={i} className="text-xs">Escolha {i + 1}
        <input className={seletor + ' mt-1'} value={v} maxLength={70} disabled={somenteLeitura}
          onChange={e => setFerramentaItem(i, e.target.value)} placeholder={talentoId === 'crafter' ? 'Ex.: ferraria' : 'Ex.: alaúde'}/>
      </label>)}
    </fieldset>}
    {usarMagias && <fieldset className="space-y-3" disabled={somenteLeitura}>
      <legend className="text-sm font-semibold">Iniciado em Magia: duas magias de nível 0 e uma de nível 1</legend>
      {!listaFixada && <label className="block text-xs">Lista de magias
        <select className={seletor + ' mt-1'} value={talentoLista} onChange={e => { setTalentoLista(e.target.value as 'clerigo' | 'druida' | 'mago'); setTalentoMagias(['', '', '']) }}>
          <option value="clerigo">Clérigo</option><option value="druida">Druida</option><option value="mago">Mago</option>
        </select>
      </label>}
      <label className="block text-xs">Atributo de conjuração do talento
        <select className={seletor + ' mt-1'} value={talentoAtributo} onChange={e => setTalentoAtributo(e.target.value as '' | 'INT' | 'SAB' | 'CAR')}>
          <option value="">Escolha...</option>{(['INT', 'SAB', 'CAR'] as const).map(a => <option key={a} value={a}>{NOME[a]}</option>)}
        </select>
      </label>
      <div className="grid gap-2 sm:grid-cols-3">
        {talentoMagias.map((v, i) => <label key={i} className="text-xs">Magia {i + 1} ({i === 2 ? 'nível 1' : 'truque'})
          <select className={seletor + ' mt-1'} value={v} onChange={e => setMagiaItem(i, e.target.value)}>
            <option value="">Escolha...</option>
            {(i === 2 ? listaNivel1 : listaTruques).map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </label>)}
      </div>
      <p className="text-xs text-(--a-a998bd)">As escolhas ficam registradas no antecedente. Para usar as magias nas rolagens, confira também o Grimório da ficha; a plataforma não adiciona magias automaticamente nem modifica a CD da classe.</p>
    </fieldset>}
    {!legado && <div className="space-y-2">
      <label className="block text-xs">Equipamento inicial do antecedente
        <select className={seletor + ' mt-1'} disabled={somenteLeitura} value={equipamento}
          onChange={e => setEquipamento(e.target.value as '' | 'pacote' | 'moedas')}>
          <option value="">Escolha...</option>
          <option value="pacote">Pacote do antecedente (registrar no inventário)</option>
          <option value="moedas">50 PO para comprar equipamento</option>
        </select>
      </label>
      {equipamento === 'pacote' && <p className="rounded-lg border border-(--a-62527e) p-2 text-xs text-(--a-cfc0df)">
        <strong>Resumo do pacote:</strong> {(def.pacote ?? []).join(', ')}, {def.moedasPacote ?? 0} PO.
      </p>}
      <p className="text-xs text-(--a-a998bd)">O pacote é apenas uma referência visual: o inventário não é preenchido automaticamente, evitando itens ou moedas duplicados.</p>
    </div>}
    <p className="text-xs text-(--a-cfc0df)">Prévia dos aumentos: {Object.entries(bonus).map(([a, n]) => a + ' +' + n).join(' · ') || 'Escolha a distribuição.'}</p>
    {avisos.length > 0 && <p role="status" className="text-xs text-amber-200">{avisos[0]}</p>}
    {erro && <p role="alert" className="text-sm text-red-300">{erro}</p>}
    <button type="button" disabled={!valido} onClick={salvar}
      className="rounded-lg border border-emerald-600/70 px-3 py-2 text-sm font-semibold text-emerald-100 disabled:opacity-40">
      Registrar decisões e aplicar aumentos
    </button>
  </section>
}
