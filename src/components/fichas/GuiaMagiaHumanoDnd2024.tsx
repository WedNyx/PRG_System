'use client'

/** Criador de Iniciado em Magia do Humano Versátil (independente do antecedente). */
import { useState } from 'react'
import type { DadosFicha } from '@/lib/sistemas/tipos'
import { MAGIAS_SRD } from '@/lib/sistemas/dnd2024Magias'
import {
  humanoTemIniciado, lerTalentoMagiaHumano, listaIniciadoAntecedente, validarTalentoMagiaHumano,
  type ListaIniciado, type AtributoMagico, type RegistroTalentoMagiaHumano,
} from '@/lib/sistemas/dnd2024MagiaHumano'

const campo = 'w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-sm text-white disabled:opacity-50'
const LISTAS: { id: ListaIniciado; nome: string }[] = [
  { id: 'clerigo', nome: 'Clérigo' }, { id: 'druida', nome: 'Druida' }, { id: 'mago', nome: 'Mago' },
]
type Props = { d: DadosFicha; onChange: (d: DadosFicha) => void; somenteLeitura: boolean }

export default function GuiaMagiaHumanoDnd2024({ d, onChange, somenteLeitura }: Props) {
  const atual = lerTalentoMagiaHumano(d.dndTalentoHumano)
  const [lista, setLista] = useState<ListaIniciado | ''>(atual?.lista ?? '')
  const [atributo, setAtributo] = useState<AtributoMagico | ''>(atual?.atributo ?? '')
  const [magias, setMagias] = useState<string[]>(atual?.magias ?? ['', '', ''])
  const [erro, setErro] = useState('')
  if (!humanoTemIniciado(d)) return null

  const listaDoAntecedente = listaIniciadoAntecedente(d)
  const opcoes = LISTAS.filter(l => l.id !== listaDoAntecedente)
  const magiasDisponiveis = (nivel: number) => MAGIAS_SRD.filter(m => m.nivel === nivel && m.classes.includes(lista))
  const troca = (i: number, id: string) => { setMagias(ms => ms.map((x, j) => i === j ? id : x)); setErro('') }
  const salvar = () => {
    if (somenteLeitura) return
    const candidata: RegistroTalentoMagiaHumano = {
      lista: lista as ListaIniciado, atributo: atributo as AtributoMagico,
      magias: [magias[0] ?? '', magias[1] ?? '', magias[2] ?? ''],
    }
    const avisos = validarTalentoMagiaHumano({ ...d, dndTalentoHumano: candidata })
    if (avisos.length) { setErro(avisos[0]); return }
    const primeiroRegistro = !atual
    onChange({
      ...d,
      dndTalentoHumano: candidata,
      recursos: primeiroRegistro
        ? { ...d.recursos, magia_humano_gratis: { atual: 1 } }
        : d.recursos,
    })
    setErro('')
  }
  const completo = validarTalentoMagiaHumano(d).length === 0
  return <section className="space-y-3 rounded-xl border border-violet-400/40 bg-violet-950/10 p-4" aria-label="Iniciado em Magia do Humano Versátil">
    <h3 className="font-semibold text-violet-100">Humano Versátil · Iniciado em Magia</h3>
    <p className="text-xs text-(--a-c4b6d4)">Escolha duas magias de nível 0 e uma de nível 1. Estas escolhas não alteram as magias do antecedente nem as preparadas da classe.</p>
    {listaDoAntecedente && <p className="text-xs text-amber-200">A lista de {LISTAS.find(l => l.id === listaDoAntecedente)?.nome} já pertence ao talento do antecedente e não pode ser repetida.</p>}
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs">Lista de magias
        <select value={lista} disabled={somenteLeitura} className={campo + ' mt-1'} onChange={e => { setLista(e.target.value as ListaIniciado | ''); setMagias(['', '', '']); setErro('') }}>
          <option value="">Selecione a lista</option>
          {opcoes.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}
        </select>
      </label>
      <label className="text-xs">Atributo de conjuração
        <select value={atributo} disabled={somenteLeitura} className={campo + ' mt-1'} onChange={e => { setAtributo(e.target.value as AtributoMagico | ''); setErro('') }}>
          <option value="">Selecione o atributo</option>
          <option value="INT">Inteligência</option><option value="SAB">Sabedoria</option><option value="CAR">Carisma</option>
        </select>
      </label>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      {([0, 1, 2] as const).map(i => <label key={i} className="text-xs">
        {i === 2 ? 'Magia de 1º nível' : 'Truque ' + (i + 1)}
        <select className={campo + ' mt-1'} value={magias[i] ?? ''} disabled={somenteLeitura || !lista}
          onChange={e => troca(i, e.target.value)}>
          <option value="">Escolha uma magia</option>
          {magiasDisponiveis(i === 2 ? 1 : 0).map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select>
      </label>)}
    </div>
    {erro && <p className="text-xs text-red-200" role="alert">{erro}</p>}
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs text-(--a-c4b6d4)">{completo ? 'Escolhas confirmadas · disponíveis no Grimório.' : 'Pendente: preencha e salve as três magias.'}</p>
      <button type="button" className="rounded-lg border border-violet-400/50 px-3 py-2 text-xs font-semibold disabled:opacity-40"
        disabled={somenteLeitura} onClick={salvar}>Salvar magias do Humano</button>
    </div>
  </section>
}
