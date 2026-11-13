'use client'

import { useState } from 'react'
import type { DadosFicha } from '@/lib/sistemas/tipos'
import { idDe } from '@/lib/sistemas/dnd2024Classes'
import { fontePermitida, FONTE_PHB } from '@/lib/sistemas/dnd2024Fontes'
import {
  ANTECEDENTES_GUIADOS, ATRIBUTOS_DND, TALENTOS_ORIGEM_LEGADO,
  aplicarAntecedenteDnd, lerRegistroAntecedenteDnd, validarDistribuicaoAntecedenteDnd,
  type AtributoDnd, type AumentosDnd,
} from '@/lib/sistemas/dnd2024Antecedentes'

const seletor = 'w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-sm text-white disabled:opacity-60'
const NOME: Record<AtributoDnd, string> = {
  FOR: 'Força', DES: 'Destreza', CON: 'Constituição',
  INT: 'Inteligência', SAB: 'Sabedoria', CAR: 'Carisma',
}

/**
 * Etapa guiada, explícita. Não soma atributos ao mudar só o nome do antecedente.
 * Guardar o último aumento evita reaplicar os mesmos três pontos ao salvar de novo.
 */
export default function GuiaAntecedenteDnd({ d, onChange, somenteLeitura, fontes }: {
  d: DadosFicha; onChange: (v: DadosFicha) => void; somenteLeitura?: boolean
  fontes: Set<string> | null
}) {
  const id = idDe(d.campos.antecedente)
  const def = ANTECEDENTES_GUIADOS[id]
  const anterior = lerRegistroAntecedenteDnd(d.dndAntecedente)
  const doAtual = anterior?.id === id ? anterior : null
  const [formato, setFormato] = useState<'2+1' | '1+1+1'>('2+1')
  const [mais2, setMais2] = useState<AtributoDnd | ''>('')
  const [mais1, setMais1] = useState<AtributoDnd | ''>('')
  const [tres, setTres] = useState<(AtributoDnd | '')[]>(['', '', ''])
  const [equipamento, setEquipamento] = useState<'' | 'pacote' | 'moedas'>(doAtual?.equipamento ?? '')
  const [talento, setTalento] = useState(doAtual?.talento ?? '')
  const [instrumento, setInstrumento] = useState(doAtual?.instrumento ?? '')
  const [idioma, setIdioma] = useState(doAtual?.idioma ?? '')
  const [erro, setErro] = useState('')

  if (!id) return <section className="rounded-xl border border-(--a-55456e) p-4 text-sm text-(--a-c4b6d4)">
    Escolha um antecedente na aba Principal para começar a distribuição guiada de atributos.
  </section>
  if (!def) return <section className="rounded-xl border border-amber-500/35 p-4 text-sm">
    <h3 className="font-semibold">Antecedente: {String(d.campos.antecedente)}</h3>
    <p className="mt-2 text-(--a-c4b6d4)">Opção de fonte comercial: o nome está disponível, mas os três atributos elegíveis e demais benefícios ainda precisam ser conferidos diretamente no livro. A plataforma não aplicará pontos arbitrários.</p>
    <p className="mt-2 text-xs text-amber-200">O mestre deve orientar a distribuição, as perícias, o talento, a ferramenta e o equipamento até existir uma implementação verificada deste antecedente.</p>
  </section>

  const legado = def.fonte === 'phb2014'
  const elegiveis = def.elegiveis
  const opcoes = elegiveis.map(a => ({ id: a, nome: NOME[a] }))
  const pontos: AumentosDnd = formato === '2+1'
    ? { ...(mais2 ? { [mais2]: 2 } : {}), ...(mais1 ? { [mais1]: mais1 === mais2 ? 3 : 1 } : {}) }
    : Object.fromEntries((legado ? tres : elegiveis).filter(Boolean).map(a => [a, 1])) as AumentosDnd
  const erros = validarDistribuicaoAntecedenteDnd(id, pontos)
  const detalhes = legado ? { talento, instrumento: instrumento.trim(), idioma: idioma.trim() }
    : { equipamento: equipamento === '' ? undefined : equipamento }
  const valido = !erros.length && (!legado || (!!talento && !!instrumento.trim() && !!idioma.trim()))
    && (legado || !!equipamento) && !somenteLeitura
  const talentos = TALENTOS_ORIGEM_LEGADO.filter(t => fontePermitida(t.fonte === 'phb2024' ? FONTE_PHB : undefined, fontes) || t.id === talento)

  const aplicar = () => {
    setErro('')
    if (!valido) { setErro(erros[0] ?? 'Complete as escolhas do antecedente antes de aplicar os aumentos.'); return }
    const resultado = aplicarAntecedenteDnd(d, pontos, detalhes)
    if (!resultado.ok) { setErro(resultado.erro); return }
    onChange(resultado.dados)
  }

  return <section aria-label="Criação guiada pelo antecedente" className="space-y-3 rounded-2xl border border-(--a-55456e) bg-(--s-201a32) p-4">
    <div>
      <h3 className="font-bold text-(--a-ed9cd8)">Atributos do antecedente · {def.nome}</h3>
      <p className="mt-1 text-xs text-(--a-c4b6d4)">{legado
        ? 'Legado 2014: compatibilidade oficial com D&D 2024. A fonte precisa estar liberada pelo mestre.'
        : 'SRD 5.2.1: os aumentos só podem ser distribuídos entre os três atributos do antecedente.'}</p>
    </div>
    <p className="text-sm text-(--a-cfc0df)"><strong>Atributos permitidos:</strong> {elegiveis.map(a => NOME[a]).join(', ')}.</p>
    <p className="text-sm text-(--a-cfc0df)"><strong>Perícias:</strong> {def.pericias.join(', ')}. <strong>Ferramenta:</strong> {def.ferramenta}. <strong>Talento:</strong> {def.talento}.</p>
    <p className="text-xs text-(--a-a998bd)">{def.nota}</p>
    {anterior && <p className="rounded-lg border border-(--a-62527e) p-2 text-xs text-(--a-cfc0df)">
      Últimos aumentos aplicados: {Object.entries(anterior.aumentos).map(([a, n]) => a + ' +' + n).join(' · ')}.
      {anterior.id !== id && <strong className="ml-1 text-amber-200">O antecedente mudou; confirme outra distribuição para substituir esses bônus.</strong>}
    </p>}
    <p className="rounded-lg border border-amber-500/30 p-2 text-xs text-amber-100">
      A ficha guarda os valores finais dos atributos. Se você já somou os aumentos à mão numa ficha antiga, ajuste primeiro os valores para evitar aplicar +3 duas vezes. Repetir a mesma distribuição registrada não soma novamente.
    </p>
    <fieldset className="space-y-2" disabled={somenteLeitura}>
      <legend className="text-sm font-semibold">Como distribuir os três pontos?</legend>
      <label className="mr-4 inline-flex items-center gap-2 text-sm">
        <input type="radio" checked={formato === '2+1'} onChange={() => setFormato('2+1')}/> +2 e +1
      </label>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="radio" checked={formato === '1+1+1'} onChange={() => setFormato('1+1+1')}/> +1, +1, +1
      </label>
      {formato === '2+1' ? <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs">Atributo +2
          <select className={seletor + ' mt-1'} value={mais2} onChange={e => setMais2(e.target.value as AtributoDnd | '')}>
            <option value="">Escolha...</option>{opcoes.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
        </label>
        <label className="text-xs">Outro atributo +1
          <select className={seletor + ' mt-1'} value={mais1} onChange={e => setMais1(e.target.value as AtributoDnd | '')}>
            <option value="">Escolha...</option>{opcoes.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
        </label>
      </div> : legado ? <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {tres.map((selecionado, i) => <label key={i} className="text-xs">Atributo {i + 1} (+1)
          <select className={seletor + ' mt-1'} value={selecionado} onChange={e => setTres(a => a.map((x, j) => i === j ? e.target.value as AtributoDnd | '' : x))}>
            <option value="">Escolha...</option>{opcoes.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
        </label>)}
      </div> : <p className="text-xs text-(--a-cfc0df)">+1 em {elegiveis.map(a => NOME[a]).join(', ')}.</p>}
    </fieldset>
    {legado ? <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs">Talento de origem (compatibilidade 2024)
        <select disabled={somenteLeitura} className={seletor + ' mt-1'} value={talento} onChange={e => setTalento(e.target.value)}>
          <option value="">Selecione...</option>{talentos.map(t => <option key={t.id} value={t.id}>{t.nome}{t.fonte === 'phb2024' ? ' (PHB 2024)' : ' (SRD)'}</option>)}
        </select>
      </label>
      <label className="text-xs">Instrumento musical
        <input className={seletor + ' mt-1'} disabled={somenteLeitura} value={instrumento} maxLength={70} onChange={e => setInstrumento(e.target.value)} placeholder="Ex.: flauta"/>
      </label>
      <label className="text-xs">Idioma adicional
        <input className={seletor + ' mt-1'} disabled={somenteLeitura} value={idioma} maxLength={70} onChange={e => setIdioma(e.target.value)} placeholder="Escolha permitida pelo mestre"/>
      </label>
      <p className="text-xs text-(--a-c4b6d4)">Equipamento legado e característica Viajante devem ser registrados com o mestre, conforme o livro de 2014.</p>
    </div> : <label className="block text-xs">Equipamento inicial do antecedente
      <select className={seletor + ' mt-1'} disabled={somenteLeitura} value={equipamento} onChange={e => setEquipamento(e.target.value as '' | 'pacote' | 'moedas')}>
        <option value="">Escolha...</option>
        <option value="pacote">Pacote do SRD (registrar no inventário)</option>
        <option value="moedas">50 PO para comprar equipamentos</option>
      </select>
      <span className="mt-1 block text-xs text-(--a-a998bd)">Esta escolha não insere itens automaticamente; confira no Inventário para não duplicar objetos ou moedas.</span>
    </label>}
    <p className="text-xs text-(--a-cfc0df)">Prévia: {Object.entries(pontos).map(([a, n]) => a + ' +' + n).join(' · ') || 'Escolha a distribuição.'}</p>
    {erro && <p role="alert" className="text-sm text-red-300">{erro}</p>}
    <button type="button" disabled={!valido}
      className="rounded-lg border border-emerald-600/70 px-3 py-2 text-sm font-semibold text-emerald-100 disabled:opacity-40"
      onClick={aplicar}>Aplicar os aumentos e registrar as escolhas</button>
  </section>
}
