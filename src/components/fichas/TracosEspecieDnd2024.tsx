'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { BookOpen, Dice5, Sparkles } from 'lucide-react'
import type { DadosFicha } from '@/lib/sistemas/tipos'
import type { Calculo } from '@/lib/sistemas/calculo'
import { lerUso } from '@/lib/sistemas/inventario'
import { lerEscolhasDnd } from '@/lib/sistemas/dnd2024Ficha'
import { CHAVE_ENGENHOCAS_GNOMO, lerEngenhocasGnomicas, poderesUsaveisEspecieDnd,
  tracosDeEspecieDnd, especieEscolhidaDnd } from '@/lib/sistemas/dnd2024TracosEspecie'

const botao = 'inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-(--a-5e4b78) px-3 py-1.5 text-xs hover:bg-(--s-34294f) disabled:cursor-not-allowed disabled:opacity-40'
type Props = {
  d: DadosFicha; c: Calculo; onChange: (d: DadosFicha) => void; somenteLeitura: boolean
  rolar: (expressao: string, nome: string) => void
  irPara: (secao: string) => void
}

/** Referência viva dos traços da espécie, sem criar cópias permanentes em d.poderes. */
export default function TracosEspecieDnd2024({ d, c, onChange, somenteLeitura, rolar, irPara }: Props) {
  const [novoDispositivo, setNovoDispositivo] = useState('')
  const tracos = tracosDeEspecieDnd(d)
  const especie = especieEscolhidaDnd(d)
  const escolhas = lerEscolhasDnd(d.dndEscolhas)
  const poderes = poderesUsaveisEspecieDnd(d)
  const uso = lerUso(d.uso)
  const engenhocas = lerEngenhocasGnomicas(d.listas[CHAVE_ENGENHOCAS_GNOMO])
  const rochas = especie === 'gnomo' && escolhas['esp-gnomo-linhagem'] === 'rochas'
  const ancestral = escolhas['esp-draconato-ancestral']
  const linhagem = especie === 'elfo' ? escolhas['esp-elfo-linhagem']
    : especie === 'tiferino' ? escolhas['esp-tiferino-legado']
      : especie === 'gnomo' ? escolhas['esp-gnomo-linhagem'] : ''
  const nome = String(d.campos.especie || '').trim()

  function gravarEngenhocas(lista: string[]) {
    onChange({ ...d, listas: { ...d.listas, [CHAVE_ENGENHOCAS_GNOMO]: JSON.stringify(lista.slice(0, 3)) } })
  }
  if (!nome) return <section className="rounded-2xl border border-(--a-55456e) bg-(--s-201a32) p-4">
    <h3 className="font-bold text-(--a-ed9cd8)">🧬 Habilidades da espécie</h3>
    <p className="mt-2 text-sm text-(--a-c4b6d4)">Escolha uma espécie na aba Principal para consultar os traços, poderes e escolhas disponíveis.</p>
    <button type="button" className={botao + ' mt-2'} onClick={() => irPara('principal')}>Selecionar espécie</button>
  </section>

  return <section aria-label="Traços e poderes da espécie" className="space-y-3 rounded-2xl border border-(--a-55456e) bg-(--s-201a32) p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h3 className="flex items-center gap-2 font-bold text-(--a-ed9cd8)"><Sparkles size={18} /> Habilidades da espécie · {nome}</h3>
        <p className="mt-1 text-xs text-(--a-c4b6d4)">Traços concedidos pela espécie/raça escolhida. São derivados da ficha, sem duplicar poderes manuais.</p>
      </div>
      <button type="button" className={botao} onClick={() => irPara('arvore')}>Editar escolhas</button>
    </div>
    {linhagem && <p className="rounded-lg bg-(--s-171325) p-2 text-xs text-(--a-d3adf0)">
      Linhagem/legado: <strong>{linhagem.replaceAll('-', ' ')}</strong> · efeitos específicos aparecem abaixo e no Grimório.
    </p>}
    {!tracos.length && <div className="rounded-lg border border-amber-500/40 bg-amber-950/20 p-3 text-xs text-amber-100">
      Esta espécie está marcada como conteúdo de livro adicional ou não possui traços abertos neste catálogo. Consulte o livro habilitado pelo mestre; não presumimos poderes comerciais.
    </div>}

    <div className="grid gap-2 sm:grid-cols-2">
      {tracos.map(m => {
        const opcao = m.opcoes?.find(x => x.id === escolhas[m.id])
        const pendente = m.estado === 'escolher' || m.estado === 'pendente'
        return <article key={m.id} className={'rounded-xl border p-3 ' +
          (pendente ? 'border-amber-500/45 bg-amber-950/15' : 'border-(--a-55456e) bg-(--s-171325)')}>
          <div className="flex flex-wrap items-start justify-between gap-1.5">
            <strong className="text-sm">{m.nome}</strong>
            <span className={'rounded-full px-2 py-0.5 text-[10px] ' +
              (pendente ? 'bg-amber-950 text-amber-200' : 'bg-emerald-950 text-emerald-200')}>
              {pendente ? 'Escolher' : 'Concedido'} · Nv. {m.nivel}</span>
          </div>
          <p className="mt-1 text-xs text-(--a-cfc0df)">{m.descricao}</p>
          {opcao && <p className="mt-1 text-xs font-semibold text-(--a-d3adf0)">Sua escolha: {opcao.nome}</p>}
          {pendente && <button type="button" onClick={() => irPara('arvore')} className={botao + ' mt-2'}>Escolher na progressão</button>}
        </article>
      })}
    </div>

    {especie === 'elfo' && linhagem === 'drow' && <p className="text-xs text-sky-200">Drow: alcance da Visão no Escuro aumenta para 36 m.</p>}
    {especie === 'elfo' && linhagem === 'elfo-floresta' && <p className="text-xs text-sky-200">Elfo da Floresta: deslocamento +1,5 m (somado automaticamente).</p>}
    {especie === 'tiferino' && linhagem && <p className="text-xs text-sky-200">Resistência do legado: {linhagem === 'abissal' ? 'Veneno' : linhagem === 'ctonico' ? 'Necrótico' : 'Fogo'}.</p>}

    {poderes.length > 0 && <div className="space-y-2">
      <h4 className="text-sm font-semibold text-(--a-d3adf0)">Poderes raciais com usos</h4>
      <div className="grid gap-2 sm:grid-cols-2">{poderes.map(p => {
        const gastos = Math.max(0, Math.min(p.usosMax, uso.poderes[p.id] ?? 0))
        const resto = Math.max(0, p.usosMax - gastos)
        const faltaAncestral = p.id === 'especie-srd-draconato-sopro' && !ancestral
        const expressao = p.id === 'especie-srd-golias-ancestral' && escolhas['esp-golias-ancestralidade'] === 'pedra'
          ? '1d12' + ((c.mods.CON ?? 0) >= 0 ? '+' : '') + (c.mods.CON ?? 0) : p.expressao
        return <article key={p.id} className="rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="text-sm">{p.nome}</strong>
            <span className="text-xs text-(--a-d3adf0)">{resto}/{p.usosMax} · {p.recarga === 'curto' ? 'curto ou longo' : 'longo'}</span>
          </div>
          <p className="mt-1 text-xs text-(--a-cfc0df)">{p.descricao}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={botao} disabled={somenteLeitura || resto < 1 || faltaAncestral}
              onClick={() => {
                onChange({ ...d, uso: { ...uso, poderes: { ...uso.poderes, [p.id]: gastos + 1 } } })
                toast.success(p.nome + ': uso registrado')
              }}>Usar ({resto})</button>
            {expressao && <button type="button" className={botao} onClick={() => rolar(expressao, p.nome + ' · rolagem racial')}>
              <Dice5 size={14} /> Rolar {expressao}</button>}
          </div>
          {faltaAncestral && <p className="mt-1 text-xs text-amber-200">Escolha primeiro o ancestral dracônico na progressão.</p>}
        </article>
      })}</div>
    </div>}

    {rochas && <div className="space-y-2 rounded-xl border border-violet-400/40 bg-violet-950/15 p-3">
      <h4 className="text-sm font-bold text-violet-100">⚙️ Engenhocas do Gnomo das Rochas ({engenhocas.length}/3)</h4>
      <p className="text-xs text-(--a-cfc0df)">Passe 10 minutos da história criando um dispositivo Minúsculo (CA 5, 1 PV) que reproduz um efeito escolhido de Prestidigitação ao ser ativado por toque com Ação Bônus. Até 3 dispositivos simultâneos; cada um dura 8 horas de tempo fictício ou até ser desmontado com uma ação Utilizar.</p>
      <ul className="space-y-1">{engenhocas.map((nome, i) => <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-(--s-171325) p-2 text-xs">
        <span className="min-w-0 flex-1">{i + 1}. {nome}</span>
        {!somenteLeitura && <button type="button" className={botao} onClick={() => gravarEngenhocas(engenhocas.filter((_, j) => i !== j))}>Desmontar / expirou</button>}
      </li>)}</ul>
      {!somenteLeitura && <div className="flex flex-wrap gap-2">
        <input value={novoDispositivo} onChange={e => setNovoDispositivo(e.target.value)} maxLength={90}
          placeholder="Ex.: Caixa de música — som suave" aria-label="Dispositivo e efeito escolhido"
          className="min-w-0 flex-1 rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-sm text-white" />
        <button type="button" className={botao} disabled={engenhocas.length >= 3 || !novoDispositivo.trim()}
          onClick={() => { gravarEngenhocas([...engenhocas, novoDispositivo.trim()]); setNovoDispositivo('') }}>Criar engenhoca</button>
      </div>}
      <p className="text-[11px] text-(--a-a998bd)">A duração é controlada em tempo de aventura, não pelo relógio do dispositivo. Registre o efeito exato e confirme com o mestre.</p>
    </div>}
    <p className="flex items-start gap-2 text-[11px] text-(--a-a998bd)"><BookOpen size={14} className="shrink-0" />
      Fonte: SRD 5.2.1 (CC BY 4.0). Efeitos condicionais, testes e resistências são resolvidos com o mestre. Magias inatas aparecem também no Grimório, com seus recursos independentes.
    </p>
  </section>
}
