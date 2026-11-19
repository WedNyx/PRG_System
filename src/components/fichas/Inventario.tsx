'use client'

import { useState } from 'react'
import { SimboloElementoOrdem } from './AtributosOrdem'
import { toast } from 'sonner'
import { enviarImagemNuvem, ErroNuvem, NUVEM_ATIVA } from '@/lib/nuvem/cliente'
import ArteItem from './ArteItem'
import BuscaIcones from './BuscaIcones'
import ArsenalPronto from './ArsenalPronto'
import { itemDoArsenal } from '@/lib/arsenal'
import { ICONES_RPG } from '@/lib/iconesRpg'
import { corDaRaridade, RARIDADES } from '@/lib/itensArte'
import { Backpack, Dice5, Gift, Minus, Moon, Package, Pencil, Plus, Shield, Sparkles, Trash2, X } from 'lucide-react'
import type { Calculo } from '@/lib/sistemas/calculo'
import type { DadosFicha, Sistema } from '@/lib/sistemas/tipos'
import type { LivroBaseDnd } from '@/lib/sistemas/dndLivros'
import { alvosDeBonus, CATEGORIAS_ITEM, ELEMENTOS_ORDEM, FONTES_ORDEM, lerItens, lerPeso, lerPoderes, mostrarPeso, lerUso, MAX_ROLAGENS_ITEM, normalizarItem, normalizarPoder, podeUsar, TIPOS_PODER, type Bonus, type Item, type Poder, type RolagemItem, type Uso } from '@/lib/sistemas/inventario'
import NaTela from '@/components/NaTela'
import CatalogoArmasDnd2024 from './CatalogoArmasDnd2024'
import { alcanceEmMetrosArmaDnd, atributoParaArmaDnd, descricaoArmaDnd, expressaoDanoArmaDnd, expressaoDanoLivreDnd, pesoEmKgArmaDnd, type ArmaDnd2024 } from '@/lib/sistemas/dnd2024Armas'
import { ARMAS_DND_2014, armaDndPorIdEdicao, descricaoArma2014 } from '@/lib/sistemas/dnd2014Armas'
import { ARMAS_DND_2024 } from '@/lib/sistemas/dnd2024Armas'
import { lerLivrosDnd } from '@/lib/sistemas/dndLivros'
import { arsenaisPermitidosDnd } from '@/lib/sistemas/dndArsenais'
import { referenciaArmaDndPorId, type ReferenciaArmaDnd } from '@/lib/sistemas/dnd2024ArmasExpandidas'

const card = 'rounded-2xl border border-(--a-55456e) bg-(--s-201a32) p-4 sm:p-5'
const input = 'w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-white disabled:opacity-70'
const botao = 'inline-flex items-center gap-1 rounded-lg border border-(--a-5e4b78) px-2.5 py-1.5 text-xs hover:bg-(--s-34294f) disabled:opacity-40'
const novoId = () => Math.random().toString(36).slice(2, 12)
export type Rolar = (expressao: string, rotulo: string) => Promise<void>

type Props = { s: Sistema; d: DadosFicha; c: Calculo; onChange: (d: DadosFicha) => void; somenteLeitura: boolean; rolar: Rolar
  /** Abre a janela de descanso (curto/longo). */
  abrirDescanso?: () => void
  /** Ficha de campanha: abre a janela para passar o item a outro personagem. */
  passarItem?: (it: Item, tem: number) => void
  edicaoDnd?: LivroBaseDnd }

/** Seção “Inventário”: itens com quantidade, peso, equipado, dano e bônus automáticos. */
/** Mantém o registro textual da carteira e não converte anotações livres. */
function CarteiraDnd({ valor, mudar, somenteLeitura }: { valor: string; mudar: (v: string) => void; somenteLeitura: boolean }) {
  const moedas = [{ id: 'PC', nome: 'Cobre', fator: 0.01 }, { id: 'PP', nome: 'Prata', fator: 0.1 }, { id: 'PE', nome: 'Electro', fator: 0.5 }, { id: 'PO', nome: 'Ouro', fator: 1 }, { id: 'PL', nome: 'Platina', fator: 10 }]
  const saldo: Record<string, number> = {}
  const partes = valor.trim() ? valor.trim().split(/[,;\s]+(?=\d)/) : []
  const reconhecida = partes.every(p => {
    const m = p.trim().match(/^(\d+)\s*(PC|PP|PE|PO|PL)$/i)
    if (!m || !Number.isSafeInteger(Number(m[1])) || Number(m[1]) > 999999999) return false
    const id = m[2].toUpperCase()
    if (id in saldo) return false
    saldo[id] = Number(m[1])
    return true
  })
  const total = moedas.reduce((acc,m)=>acc+(saldo[m.id]??0)*m.fator,0)
  function ajustar(id: string, texto: string) {
    const n = Number(texto)
    if (!reconhecida || somenteLeitura || !Number.isSafeInteger(n) || n < 0 || n > 999999999) return
    mudar(moedas.map(m=>({id:m.id,n:m.id===id?n:saldo[m.id]??0})).filter(m=>m.n>0).map(m=>m.n+' '+m.id).join(', '))
  }
  return <div className="dnd-carteira">
    <h3 className="font-semibold">Tesouraria do aventureiro</h3>
    {reconhecida ? <><div className="dnd-moedas">{moedas.map(m=><label key={m.id}><span className="dnd-moeda" data-moeda={m.id} aria-hidden="true">{m.id}</span><span>{m.nome}</span><input type="number" min={0} max={999999999} step={1} aria-label={'Moedas de '+m.nome} value={saldo[m.id]??0} disabled={somenteLeitura} onChange={e=>ajustar(m.id,e.target.value)}/></label>)}</div><p className="text-xs">Valor equivalente: <strong>{total.toLocaleString('pt-BR',{maximumFractionDigits:2})} PO</strong></p></> : <p className="text-xs">Carteira com anotações livres. Edite o registro abaixo para usar os contadores (ex.: 35 PO, 12 PP). Nenhum valor foi convertido.</p>}
    <label className="block text-xs">Registro da carteira<input value={valor} disabled={somenteLeitura} maxLength={500} onChange={e=>mudar(e.target.value)} className={input+' mt-1'} placeholder="35 PO, 12 PP"/></label>
  </div>
}

export function InventarioFicha({ s, d, c, onChange, somenteLeitura, rolar, passarItem, edicaoDnd = 'phb2024' }: Props) {
  const temaDnd = s.id === 'dnd5e-srd' || s.id === 'dnd5e-manual'
  const itens = lerItens(d.itens), uso = lerUso(d.uso)
  const livrosDnd = lerLivrosDnd(d.dndLivros, edicaoDnd)
  const [editando, setEditando] = useState<Item | null>(null)
  const [catalogoAberto, setCatalogoAberto] = useState(false)
  const [arsenalAberto, setArsenalAberto] = useState(false)
  const [atributosArma, setAtributosArma] = useState<Record<string, 'FOR' | 'DES'>>({})
  const [duasMaosArma, setDuasMaosArma] = useState<Record<string, boolean>>({})
  const [ataqueLeveExtra, setAtaqueLeveExtra] = useState<Record<string, boolean>>({})
  const salvarUso = (u: Uso) => onChange({ ...d, uso: u })
  const qtd = (it: Item) => uso.itens[it.id]?.qtd ?? 1
  const mudarQtd = (it: Item, delta: number) => salvarUso({ ...uso, itens: { ...uso.itens, [it.id]: { equipado: uso.itens[it.id]?.equipado ?? false, qtd: Math.max(0, qtd(it) + delta) } } })
  const equipar = (it: Item) => salvarUso({ ...uso, itens: { ...uso.itens, [it.id]: { qtd: qtd(it), equipado: !uso.itens[it.id]?.equipado } } })
  function salvarItem(it: Item) {
    const existe = itens.some(x => x.id === it.id)
    onChange({ ...d, itens: existe ? itens.map(x => x.id === it.id ? it : x) : [...itens, it], uso: existe ? uso : { ...uso, itens: { ...uso.itens, [it.id]: { qtd: 1, equipado: false } } } })
    setEditando(null)
  }
  function adicionarArmaCatalogo(a: ArmaDnd2024) {
    if (itens.length >= 300) { toast.error('O inventário já chegou ao limite de 300 itens.'); return }
    salvarItem({ id: novoId(), nome: a.nome, categoria: 'arma', peso: pesoEmKgArmaDnd(a),
      ...(a.dano ? { dano: a.dano } : {}), alcance: alcanceEmMetrosArmaDnd(a),
      descricao: a.id.startsWith('2014-') ? descricaoArma2014(a) : descricaoArmaDnd(a),
      armaDnd: a.id, bonus: [] })
    setCatalogoAberto(false)
    toast.success(a.nome + ' adicionada ao inventário!')
  }
  function adicionarReferenciaCatalogo(ref: ReferenciaArmaDnd, baseId?: string) {
    if (itens.length >= 300) { toast.error('O inventário já chegou ao limite de 300 itens.'); return }
    const base = armaDndPorIdEdicao(baseId)
    const magico = ref.classe === 'magica' || ref.classe === 'indice'
    const item: Item = { id: novoId(), nome: ref.nome, categoria: 'arma',
      peso: base ? pesoEmKgArmaDnd(base) : 0, bonus: [],
      ...(base ? { armaDnd: base.id, dano: base.dano, alcance: alcanceEmMetrosArmaDnd(base) } : {}),
      ...(!base && ref.dano ? { dano: ref.dano } : {}),
      armaRefDnd: ref.id, ...(magico ? { magico: true } : {}),
      descricao: 'Origem: ' + ref.livro + ' (' + ref.edicao + '). ' +
        (magico ? 'Para efeitos mágicos, consulte o livro e registre bônus/dados adicionais manualmente.' :
          'Consulte o mestre para confirmar propriedades e proficiências.') }
    salvarItem(item)
    setCatalogoAberto(false)
    toast.success(ref.nome + ' adicionada ao inventário!')
  }
  function remover(it: Item) {
    if (!confirm(`Remover "${it.nome}" do inventário?`)) return
    const { [it.id]: _, ...resto } = uso.itens; void _
    onChange({ ...d, itens: itens.filter(x => x.id !== it.id), uso: { ...uso, itens: resto } })
  }
  async function usarConsumivel(it: Item) {
    if (qtd(it) <= 0) return
    mudarQtd(it, -1)
    if (it.dano) await rolar(it.dano, it.nome)
    else toast(`${it.nome} usado`, { description: `Restam ${qtd(it) - 1}` })
  }
  const nomeAlvo = Object.fromEntries(alvosDeBonus(s).map(a => [a.id, a.nome]))
  const [buscaItens, setBuscaItens] = useState('')
  const [estadoItens, setEstadoItens] = useState('todos')
  const itensBuscados = temaDnd && buscaItens.trim()
    ? itens.filter(it => [it.nome, it.descricao ?? '', referenciaArmaDndPorId(it.armaRefDnd)?.livro ?? ''].join(' ')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(buscaItens.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()))
    : itens
  const itensVisiveis = temaDnd ? itensBuscados.filter(it=>estadoItens==='todos'||(estadoItens==='equipados'?!!uso.itens[it.id]?.equipado:estadoItens==='disponiveis'?qtd(it)>0:qtd(it)===0)) : itensBuscados
  const pct = c.carga.max ? Math.min(100, (c.carga.total / c.carga.max) * 100) : 0
  // Abas por tipo (os nomes seguem o sistema, quando ele tem os seus) e a ala dos itens mágicos.
  const [aba, setAba] = useState<'todos' | 'magico' | Item['categoria']>('todos')
  const nomeCategoria = (id: Item['categoria']) => s.nomesItens?.[id] ?? CATEGORIAS_ITEM.find(c => c.id === id)!.nome
  const nomeMagico = s.nomesItens?.magico ?? '✨ Itens mágicos'
  const magicos = itensVisiveis.filter(i => i.magico)
  const abasItens = [{ id: 'todos' as const, nome: 'Todos', n: itensVisiveis.length },
    ...CATEGORIAS_ITEM.map(c => ({ id: c.id, nome: `${c.icone} ${nomeCategoria(c.id)}`, n: itensVisiveis.filter(i => i.categoria === c.id).length })).filter(x => x.n),
    ...(magicos.length ? [{ id: 'magico' as const, nome: nomeMagico, n: magicos.length }] : [])]
  const abaAtual = abasItens.some(x => x.id === aba) ? aba : 'todos'
  const linhaItem = (it: Item) => {
          const eq = !!uso.itens[it.id]?.equipado, n = qtd(it)
          const armaDnd = s.id === 'dnd5e-srd' && it.categoria === 'arma' ? armaDndPorIdEdicao(it.armaDnd) : null
          const referenciaDnd = s.id === 'dnd5e-srd' && it.categoria === 'arma' ? referenciaArmaDndPorId(it.armaRefDnd) : null
          const armaForaDaEdicao = !!armaDnd && (edicaoDnd === 'phb2014'
            ? !armaDnd.id.startsWith('2014-')
            : armaDnd.id.startsWith('2014-') && !livrosDnd.suplementos.includes('phb2014'))
          const atributoArma = armaDnd ? atributoParaArmaDnd(armaDnd, c.mods, atributosArma[it.id]) : null
          const duasMaos = !!duasMaosArma[it.id], leveExtra = !!ataqueLeveExtra[it.id]
          const danoNormal = armaDnd && atributoArma ? expressaoDanoArmaDnd(armaDnd, atributoArma.mod, false, duasMaos, it.bonusArma, leveExtra) : ''
          const danoCritico = armaDnd && atributoArma ? expressaoDanoArmaDnd(armaDnd, atributoArma.mod, true, duasMaos, it.bonusArma, leveExtra) : ''
          const atributoLivre = atributosArma[it.id] ?? (referenciaDnd && ['moderna','futurista'].includes(referenciaDnd.classe) ? 'DES' : 'FOR')
          const modLivre = referenciaDnd ? (c.mods[atributoLivre] ?? 0) : 0
          const danoNormalLivre = s.id === 'dnd5e-srd' && it.categoria === 'arma' && !armaDnd && it.dano ? expressaoDanoLivreDnd(it.dano, false, modLivre) : null
          const danoCriticoLivre = s.id === 'dnd5e-srd' && it.categoria === 'arma' && !armaDnd && it.dano ? expressaoDanoLivreDnd(it.dano, true, modLivre) : null
          return <li key={it.id} data-categoria={it.categoria} data-equipado={eq ? 'sim' : 'nao'} className={'ficha-item rounded-xl border p-3 ' + (eq ? 'border-(--a-8b6cba) bg-(--s-2b2143)' : 'border-transparent bg-(--s-171325)') + (n <= 0 ? ' opacity-60' : '')}>
            <div className="flex items-center gap-3">
              <ArteItem item={it} tamanho={46} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{it.nome}{eq && <span className="ficha-equipado-selo ml-2 rounded bg-(--a-5b4380) px-1.5 py-0.5 text-[10px]">equipado</span>}</span>
                <span className="block text-[11px]">{it.raridade && <strong style={{ color: corDaRaridade(it.raridade) }}>{RARIDADES.find(x => x.id === it.raridade)?.nome} · </strong>}<span className="text-(--a-c4b6d4)">{it.peso ? `${mostrarPeso(it.peso, c.carga.unidade)} cada` : ''}</span></span>
              </span>
            </div>
            {(it.bonus.length > 0 || it.descricao) && <p className="mt-1 text-xs text-(--a-c9bcd9)">{it.bonus.map(b => `${nomeAlvo[b.alvo] ?? b.alvo} ${b.valor >= 0 ? '+' : ''}${b.valor}`).join(' · ')}{it.bonus.length && it.descricao ? ' — ' : ''}{it.descricao}</p>}
            {referenciaDnd && <p className="mt-1 text-[11px] font-medium text-(--a-d3adf0)">📖 {referenciaDnd.livro} · {referenciaDnd.edicao}</p>}
            {armaForaDaEdicao && <p role="alert" className="mt-2 rounded-lg border border-amber-500/40 p-2 text-xs text-amber-200">
              ⚠️ Arma registrada com regras de outra edição. Escolha o modelo correspondente ao livro atual antes de rolar.
              Os dados foram preservados; nenhuma conversão automática foi feita.
            </p>}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center rounded-lg border border-(--a-5e4b78)">
                <button type="button" disabled={somenteLeitura || n <= 0} onClick={() => mudarQtd(it, -1)} aria-label={'Menos ' + it.nome} className="px-2 py-1 disabled:opacity-40"><Minus size={13} /></button>
                <span className="min-w-8 text-center text-sm tabular-nums" aria-label="Quantidade">{n}</span>
                <button type="button" disabled={somenteLeitura} onClick={() => mudarQtd(it, 1)} aria-label={'Mais ' + it.nome} className="px-2 py-1 disabled:opacity-40"><Plus size={13} /></button>
              </span>
              {it.categoria !== 'consumivel' && it.categoria !== 'tesouro' && <button type="button" className={botao} disabled={somenteLeitura || n <= 0} onClick={() => equipar(it)}><Shield size={13} /> {eq ? 'Desequipar' : 'Equipar'}</button>}
              {it.categoria === 'consumivel' && <button type="button" className={botao} disabled={somenteLeitura || n <= 0} onClick={() => void usarConsumivel(it)}><Sparkles size={13} /> Usar</button>}
              {it.dano && it.categoria !== 'consumivel' && !armaDnd && !(s.id === 'dnd5e-srd' && it.categoria === 'arma') && <button type="button" className={botao} onClick={() => void rolar(it.dano!, it.nome)}><Dice5 size={13} /> {it.dano}</button>}
              {passarItem && !somenteLeitura && n > 0 && <button type="button" className={botao} onClick={() => passarItem(it, n)} aria-label={'Passar ' + it.nome + ' para outro personagem'}><Gift size={13} /> Passar</button>}
              {!somenteLeitura && <><button type="button" className={botao} onClick={() => setEditando(it)} aria-label={'Editar ' + it.nome}><Pencil size={13} /></button>
                <button type="button" className={botao} onClick={() => remover(it)} aria-label={'Remover ' + it.nome}><Trash2 size={13} /></button></>}
            </div>
            {!!it.rolagens?.length && <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={'Rolagens de ' + it.nome}>
              {it.rolagens.map(r => <button key={r.nome + r.expr} type="button" className={botao} disabled={n <= 0} onClick={() => void rolar(r.expr, it.nome + ' · ' + r.nome)}><Dice5 size={13} /> {r.nome}: {r.expr}</button>)}
              {it.rolagens.length > 1 && <button type="button" className={botao} disabled={n <= 0} onClick={async () => { for (const r of it.rolagens!) await rolar(r.expr, it.nome + ' · ' + r.nome) }}>Rolar tudo</button>}
            </div>}
            {armaDnd && !armaDnd.dano && <p className="mt-2 text-xs text-amber-200">Rede 2014: sem dano; verifique as regras especiais de captura no PHB 2014.</p>}
            {!armaDnd && s.id === 'dnd5e-srd' && it.categoria === 'arma' && <div className="mt-3 space-y-2 rounded-lg border border-(--a-5e4b78)/70 bg-(--s-151123)/50 p-2.5">
              {referenciaDnd && it.dano && <label className="flex items-center gap-2 text-xs text-(--a-c4b6d4)">Atributo do dano
                <select value={atributoLivre} aria-label={'Atributo de dano para ' + it.nome}
                  onChange={e => setAtributosArma(o => ({ ...o, [it.id]: e.target.value as 'FOR' | 'DES' }))}
                  className="rounded-lg border border-(--a-5e4b78) bg-(--s-151123) px-2 py-1">
                  <option value="FOR">FOR</option><option value="DES">DES</option>
                </select>
              </label>}
              {danoNormalLivre && danoCriticoLivre ? <div className="flex flex-wrap gap-2">
                <button type="button" className={botao} disabled={n <= 0}
                  onClick={() => void rolar(danoNormalLivre, it.nome + ' · dano')}>🎲 Dano: {danoNormalLivre}</button>
                <button type="button" className={botao + ' border-amber-400/50 text-amber-100'} disabled={n <= 0}
                  onClick={() => void rolar(danoCriticoLivre, it.nome + ' · CRÍTICO')}>✨ Crítico: {danoCriticoLivre}</button>
              </div> : <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-amber-200">Sem dano definido: escolha a arma base ou informe o dano seguindo o livro.</p>
                {!somenteLeitura && <button type="button" className={botao} onClick={() => setEditando(it)}>⚙️ Configurar</button>}
              </div>}
              <p className="text-[11px] text-(--a-a998bd)">No crítico somente os dados dobram. Confira bônus especiais, condições e proficiência no livro e com o mestre.</p>
            </div>}
            {armaDnd && atributoArma && !!armaDnd.dano && <div className="mt-3 space-y-2 rounded-lg border border-(--a-5e4b78)/70 bg-(--s-151123)/50 p-2.5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-(--a-cfc0df)">
                <span>{armaDnd.tipo}</span>{armaDnd.maestria && <span>· Maestria {armaDnd.maestria}</span>}
                <span>· Atributo {atributoArma.atributo} ({atributoArma.mod >= 0 ? '+' : ''}{atributoArma.mod})</span>
                {it.bonusArma ? <span>· Encantamento +{it.bonusArma}</span> : null}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {armaDnd.propriedades.includes('Acuidade') && <label className="flex items-center gap-1.5">Acuidade
                  <select aria-label={'Atributo de ataque para ' + it.nome} value={atributoArma.atributo}
                    onChange={e => setAtributosArma(a => ({ ...a, [it.id]: e.target.value as 'FOR' | 'DES' }))}
                    className="rounded border border-(--a-5e4b78) bg-(--s-151123) px-1.5 py-1">
                    <option value="FOR">Força</option><option value="DES">Destreza</option>
                  </select>
                </label>}
                {armaDnd.versatil && <label className="flex items-center gap-1.5"><input type="checkbox" checked={duasMaos}
                  onChange={e => setDuasMaosArma(a => ({ ...a, [it.id]: e.target.checked }))} /> Empunhar com duas mãos ({armaDnd.versatil})</label>}
                {armaDnd.propriedades.includes('Leve') && <label className="flex items-center gap-1.5"><input type="checkbox" checked={leveExtra}
                  onChange={e => setAtaqueLeveExtra(a => ({ ...a, [it.id]: e.target.checked }))} /> Ataque adicional (sem modificador positivo)</label>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={botao} disabled={n <= 0 || armaForaDaEdicao}
                  onClick={() => void rolar(danoNormal, it.nome + ' · dano ' + armaDnd.tipo)}>
                  <Dice5 size={14} /> Dano: {danoNormal}</button>
                <button type="button" className={botao + ' border-amber-400/50 text-amber-100'} disabled={n <= 0 || armaForaDaEdicao}
                  onClick={() => void rolar(danoCritico, it.nome + ' · CRÍTICO ' + armaDnd.tipo)}>
                  <Sparkles size={14} /> Crítico: {danoCritico}</button>
              </div>
              <p className="text-[11px] text-(--a-a998bd)">Crítico dobra apenas os dados. A maestria só se aplica se a classe ou talento permitir; efeitos especiais são resolvidos com o mestre.</p>
            </div>}
          </li>
  }

  return <section className={card + (temaDnd ? ' dnd-arsenal' : '')}>
    {temaDnd && <div className="dnd-bau" aria-hidden="true"><svg viewBox="0 0 120 84" fill="none"><path d="M8 40V25Q8 8 30 8H90Q112 8 112 25V40Z" fill="#49312a" stroke="#bc9764" strokeWidth="2"/><path d="M8 40H112V73H8Z" fill="#36221e" stroke="#bc9764" strokeWidth="2"/><path d="M24 10V73M96 10V73M8 48H112M8 65H112" stroke="#bc9764" strokeWidth="3"/><rect x="49" y="34" width="22" height="22" rx="3" fill="#bc9764"/><path d="M60 41V50" stroke="#36221e" strokeWidth="3"/></svg><span>Arsenal do aventureiro</span></div>}
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 font-bold text-(--a-ed9cd8)"><Backpack size={18} /> Inventário</h2>
      {!somenteLeitura && <div className="flex flex-wrap gap-2">
        {s.id === 'dnd5e-srd' && <button type="button" className={botao + ' border-(--a-b99bff) min-h-10'} onClick={() => setCatalogoAberto(true)}><Dice5 size={14} /> Arsenais por livro ({arsenaisPermitidosDnd(edicaoDnd, livrosDnd.suplementos).length})</button>}
        <button type="button" className={botao} onClick={() => setArsenalAberto(true)}><Package size={14} /> Arsenal pronto</button>
        <button type="button" className={botao} onClick={() => setEditando({ id: novoId(), nome: '', categoria: 'equipamento', peso: 0, bonus: [] })}><Plus size={14} /> Novo item</button>
      </div>}
    </div>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl bg-(--s-171325) p-3 text-sm">
        <p className="ficha-carga-titulo text-xs text-(--a-c4b6d4)">Carga{s.carga?.dica ? ' · ' + s.carga.dica : ''}</p>
        <p className="text-lg font-bold">{c.carga.total.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} {c.carga.max !== null ? `/ ${c.carga.max.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}` : ''} <span className="text-xs font-normal text-(--a-c4b6d4)">{c.carga.unidade}</span></p>
        {c.carga.max ? <div className="mt-1 h-2 overflow-hidden rounded-full bg-(--s-2b2140)"><div className={'h-full transition-all ' + (c.carga.total > c.carga.max ? 'bg-red-400' : 'bg-(--a-b06ad8)')} style={{ width: pct + '%' }} /></div> : null}
        {c.carga.max !== null && c.carga.total > c.carga.max && <p className="mt-1 text-xs text-red-200">Acima da capacidade!</p>}
      </div>
      {temaDnd ? <CarteiraDnd valor={uso.carteira} mudar={carteira=>salvarUso({...uso,carteira})} somenteLeitura={!!somenteLeitura}/> : <label className="ficha-carteira rounded-xl bg-(--s-171325) p-3 text-xs text-(--a-c4b6d4)">💰 Carteira (moedas e valores)
        <input value={uso.carteira} disabled={somenteLeitura} maxLength={500} onChange={e => salvarUso({ ...uso, carteira: e.target.value })} placeholder="Ex.: 35 PO, 12 PP" className={input + ' mt-1 text-sm'} /></label>}
    </div>
    {temaDnd && itens.length > 0 && <div className="mt-3 rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3">
      <label className="block text-xs font-semibold text-(--a-d3adf0)">🔎 Encontrar item na bolsa</label>
      <input type="search" value={buscaItens} onChange={e => setBuscaItens(e.target.value)}
        placeholder="Busque nome, descrição ou livro…" className={input + ' mt-1 text-sm'} />
      <div className="dnd-filtros-arsenal" role="group" aria-label="Estado dos equipamentos">{[['todos','Todos'],['equipados','Equipados'],['disponiveis','Disponíveis'],['esgotados','Esgotados']].map(([id,nome])=><button key={id} type="button" aria-pressed={estadoItens===id} onClick={()=>setEstadoItens(id)}>{nome}</button>)}</div>
      <p className="mt-1 text-[11px] text-(--a-c4b6d4)">{itensVisiveis.length} de {itens.length} itens encontrados</p>
    </div>}
    {Object.keys(c.bonus).length > 0 && <p className="mt-3 rounded-lg bg-[#1f3a2c] p-2 text-xs text-[#a9f0c8]">Itens equipados somando: {Object.entries(c.bonus).map(([a, v]) => `${nomeAlvo[a] ?? a} ${v >= 0 ? '+' : ''}${v}`).join(' · ')}</p>}
    {!itensVisiveis.length && <p className="mt-3 text-sm text-(--a-bfb2cf)">{itens.length ? 'Nenhum item corresponde à busca.' : 'Nenhum item ainda.'}{!itens.length && !somenteLeitura && ' Toque em “Novo item” ou pegue um pronto no “Arsenal pronto”.'}</p>}
    {itensVisiveis.length > 0 && <nav aria-label="Tipos de item" className="ficha-categorias mt-4 flex gap-1.5 overflow-x-auto pb-1">
      {abasItens.map(a => <button key={a.id} type="button" onClick={() => setAba(a.id)} aria-pressed={abaAtual === a.id}
        className={'shrink-0 rounded-full border px-3 py-1 text-xs ' + (abaAtual === a.id ? (a.id === 'magico' ? 'border-[#f0c46a] bg-(--s-3a2c58) text-amber-100' : 'border-(--a-b99bff) bg-(--s-3a2c58) text-white') : 'border-(--a-3d3152) text-(--a-cfc0df)')}>{a.nome} <span className="opacity-70">({a.n})</span></button>)}
    </nav>}
    {abaAtual === 'todos' && magicos.length > 0 && <div className="mt-3 rounded-2xl border border-[#f0c46a]/50 bg-gradient-to-br from-(--s-2e2147) to-(--s-1a1428) p-3 shadow-[0_0_18px_#b99bff33]">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-200">{nomeMagico}</h3>
      <ul className="ficha-lista-itens space-y-2">{magicos.map(linhaItem)}</ul>
    </div>}
    {abaAtual === 'todos' ? CATEGORIAS_ITEM.map(cat => {
      const lista = itensVisiveis.filter(i => i.categoria === cat.id && !i.magico); if (!lista.length) return null
      return <div key={cat.id} className="ficha-compartimento mt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-(--a-d3adf0)">{cat.icone} {nomeCategoria(cat.id)}</h3>
        <ul className="ficha-lista-itens space-y-2">{lista.map(linhaItem)}</ul>
      </div>
    }) : <ul className="ficha-lista-itens mt-3 space-y-2">{itensVisiveis.filter(i => abaAtual === 'magico' ? i.magico : i.categoria === abaAtual).map(linhaItem)}</ul>}
    {editando && <EditorItem s={s} edicaoDnd={edicaoDnd} inicial={editando} salvar={salvarItem} fechar={() => setEditando(null)} />}
    {arsenalAberto && <ArsenalPronto fechar={() => setArsenalAberto(false)} adicionar={x => {
      if (itens.length >= 300) { toast.error('O inventário já chegou ao limite de 300 itens.'); return }
      salvarItem(itemDoArsenal(x, novoId)); toast.success(x.nome + ' entrou no inventário!')
    }} />}
    {catalogoAberto && s.id === 'dnd5e-srd' && <CatalogoArmasDnd2024 edicao={edicaoDnd} livrosAtivos={livrosDnd.suplementos} adicionar={adicionarArmaCatalogo} adicionarReferencia={adicionarReferenciaCatalogo} fechar={() => setCatalogoAberto(false)} />}
  </section>
}

/** Seção “Poderes”: magias e habilidades com custo em recurso, usos por descanso e rolagem. */
export function PoderesFicha({ s, d, c, onChange, somenteLeitura, rolar, abrirDescanso }: Props) {
  const poderes = lerPoderes(d.poderes), uso = lerUso(d.uso)
  const [editando, setEditando] = useState<Poder | null>(null)
  const nomeRecurso = Object.fromEntries(s.recursos.map(r => [r.id, r.nome]))
  const ordem = s.id === 'ordem-paranormal'
  const [elemento, setElemento] = useState('Todos')
  const [circulo, setCirculo] = useState('Todos')
  const [abaOrdem, setAbaOrdem] = useState<'poderes' | 'rituais'>('poderes')
  const rituais = poderes.filter(p => p.tipo === 'magia')
  const grupos = ordem ? abaOrdem === 'poderes'
    ? FONTES_ORDEM.map(f => ({ titulo: f === 'Outro' ? 'Outros poderes' : 'Poderes de ' + f.toLowerCase(), itens: poderes.filter(p => p.tipo !== 'magia' && (p.fonteOrdem ?? 'Outro') === f) }))
    : [...ELEMENTOS_ORDEM, 'Sem elemento'].filter(e => elemento === 'Todos' || elemento === e).flatMap(e =>
        ['1','2','3','4','Sem círculo'].filter(n => (circulo === 'Todos' || circulo === n) && ((e !== 'Sem elemento' && n !== 'Sem círculo') || rituais.some(p => (p.elementoOrdem || 'Sem elemento') === e && (p.circuloOrdem ? String(p.circuloOrdem) : 'Sem círculo') === n))).map(n => ({
          titulo: e + ' · ' + (n === 'Sem círculo' ? n : n + 'º círculo'),
          itens: rituais.filter(p => (p.elementoOrdem || 'Sem elemento') === e && (p.circuloOrdem ? String(p.circuloOrdem) : 'Sem círculo') === n).sort((a,b) => a.nome.localeCompare(b.nome,'pt-BR'))
        })))
    : [{ titulo: '', itens: poderes }]
  function salvarPoder(p: Poder) {
    onChange({ ...d, poderes: poderes.some(x => x.id === p.id) ? poderes.map(x => x.id === p.id ? p : x) : [...poderes, p] }); setEditando(null)
  }
  function remover(p: Poder) {
    if (!confirm(`Remover "${p.nome}"?`)) return
    const { [p.id]: _, ...resto } = uso.poderes; void _
    onChange({ ...d, poderes: poderes.filter(x => x.id !== p.id), uso: { ...uso, poderes: resto } })
  }
  async function usar(p: Poder) {
    const atual = p.recurso ? d.recursos[p.recurso]?.atual ?? 0 : undefined
    const v = podeUsar(p, uso, atual)
    if (!v.ok) { toast.error(v.motivo); return }
    const recursos = p.recurso && p.custo ? { ...d.recursos, [p.recurso]: { ...d.recursos[p.recurso], atual: (atual ?? 0) - p.custo } } : d.recursos
    onChange({ ...d, recursos, uso: { ...uso, poderes: { ...uso.poderes, [p.id]: (uso.poderes[p.id] ?? 0) + (p.usosMax ? 1 : 0) } } })
    if (p.expressao) await rolar(p.expressao, p.nome)
    else toast(`${p.nome} usado`, { description: p.recurso && p.custo ? `−${p.custo} ${nomeRecurso[p.recurso] ?? p.recurso}` : undefined })
  }
  const descansar = () => { if (abrirDescanso) return abrirDescanso(); onChange({ ...d, uso: { ...uso, poderes: {} } }); toast.success('Usos recuperados!') }
  const comUsos = poderes.some(p => p.usosMax && uso.poderes[p.id])

  return <section className={card}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 font-bold text-(--a-ed9cd8)"><Sparkles size={18} /> {s.id === 'dnd5e-srd' ? 'Poderes extras e personalizados' : ordem ? 'Poderes e rituais' : 'Poderes e magias'}</h2>
      <div className="flex gap-2">
        {comUsos && !somenteLeitura && <button type="button" className={botao} onClick={descansar} title="Zera os usos gastos"><Moon size={14} /> Descansar</button>}
        {!somenteLeitura && <button type="button" className={botao} onClick={() => setEditando({ id: novoId(), nome: '', tipo: ordem && abaOrdem === 'rituais' ? 'magia' : 'habilidade' })}><Plus size={14} /> {ordem && abaOrdem === 'rituais' ? 'Novo ritual' : 'Novo poder'}</button>}
      </div>
    </div>
    {s.id === 'dnd5e-srd' && <p className="mt-2 text-xs text-(--a-c4b6d4)">Habilidades de raça/espécie, classe e antecedente são geradas nos hexágonos oficiais da Árvore. Adicione aqui apenas poderes aprendidos ou concedidos além daqueles naturais.</p>}
    {!poderes.length && <p className="mt-3 text-sm text-(--a-bfb2cf)">Nenhum poder ainda.{!somenteLeitura && ' Toque em “Novo poder”.'}</p>}
    {ordem && <div className="ordem-acervo-abas mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Seção do acervo">
      <button type="button" className={botao + (abaOrdem === "poderes" ? " !border-red-500 !bg-red-950" : "")} aria-pressed={abaOrdem === 'poderes'} onClick={() => setAbaOrdem('poderes')}>Poderes ({poderes.length - rituais.length})</button>
      <button type="button" className={botao + (abaOrdem === "rituais" ? " !border-red-500 !bg-red-950" : "")} aria-pressed={abaOrdem === 'rituais'} onClick={() => setAbaOrdem('rituais')}>Rituais ({rituais.length})</button>
    </div>}
      {ordem && abaOrdem === "rituais" && <div className="ordem-filtros" role="group" aria-label="Filtrar rituais por elemento">{["Todos", ...ELEMENTOS_ORDEM].map(e => <button key={e} type="button" data-elemento={e} aria-pressed={elemento === e} onClick={() => setElemento(e)}>{e !== "Todos" && <SimboloElementoOrdem elemento={e} tamanho={28}/>}<span>{e}</span></button>)}</div>}
      {ordem && abaOrdem === "rituais" && <label className="ordem-circulo-filtro">Círculo<select value={circulo} onChange={e => setCirculo(e.target.value)} className={input}>{["Todos","1","2","3","4"].map(n => <option key={n} value={n}>{n === "Todos" ? n : n + "º círculo"}</option>)}</select></label>}
    {ordem && !grupos.some(g => g.itens.length) && <p className="mt-3 text-sm">Nenhum {abaOrdem === 'rituais' ? 'ritual neste filtro' : 'poder cadastrado'}.</p>}
    {grupos.filter(g => !ordem || abaOrdem === "rituais" || g.itens.length).map(g => <div key={g.titulo} className={ordem ? "ordem-grupo-poderes" : undefined}>
      {ordem && <h3>{g.titulo} <span className="text-xs opacity-70">({g.itens.length})</span></h3>}
      {ordem && abaOrdem === "rituais" && !g.itens.length && <p className="text-xs opacity-75">Nenhum ritual aprendido neste grupo.</p>}
      <ul className="ficha-lista-poderes mt-3 space-y-2">{g.itens.map(p => {
      const tipo = TIPOS_PODER.find(t => t.id === p.tipo)!, gastos = uso.poderes[p.id] ?? 0
      const atual = p.recurso ? d.recursos[p.recurso]?.atual ?? 0 : undefined
      const ok = podeUsar(p, uso, atual).ok
      return <li key={p.id} data-elemento={ordem ? p.elementoOrdem : undefined} className={"ficha-poder rounded-xl bg-(--s-171325) p-3" + (ordem ? p.tipo === "magia" ? " ordem-ritual-card" : " ordem-poder-card" : "")}>
        <div className="flex flex-wrap items-center gap-2">
          {ordem && p.tipo === "magia" && p.elementoOrdem && <SimboloElementoOrdem elemento={p.elementoOrdem} tamanho={36}/>}
          <span className="min-w-0 flex-1 font-semibold">{!ordem && tipo.icone} {p.nome}</span>
          <span className="rounded bg-(--s-2b2140) px-1.5 py-0.5 text-[10px] text-(--a-d6c8e8)">{ordem && p.tipo === "magia" ? [p.elementoOrdem ?? "Ritual", p.circuloOrdem ? p.circuloOrdem + "º círculo" : ""].filter(Boolean).join(" · ") : tipo.nome}</span>
          {p.id.startsWith('arv-') && <span className="rounded bg-(--s-3b2b57) px-1.5 py-0.5 text-[10px] text-amber-200" title="Vem de um hexágono liberado; muda na Árvore de habilidades">🌠 Árvore</span>}
        </div>
        <p className="mt-1 text-xs text-(--a-c9bcd9)">
          {[p.recurso && p.custo ? `Custo: ${p.custo} ${nomeRecurso[p.recurso] ?? p.recurso}` : '', p.usosMax ? `Usos: ${p.usosMax - gastos}/${p.usosMax} (${p.recarga === 'curto' ? 'descanso curto' : 'descanso longo'})` : '', p.expressao ? `Rolagem: ${p.expressao}` : ''].filter(Boolean).join(' · ')}
          {p.descricao && !ordem && <span className="mt-1 block whitespace-pre-wrap">{p.descricao}</span>}
        </p>
        {ordem && <details className="ordem-consulta"><summary>Consultar</summary><p className="whitespace-pre-wrap">{p.descricao || "Nenhuma descrição cadastrada."}</p></details>}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button type="button" className={botao} disabled={somenteLeitura || !ok} onClick={() => void usar(p)}><Sparkles size={13} /> {ordem && p.tipo === "magia" ? "Conjurar" : "Usar"}</button>
          {p.expressao && <button type="button" className={botao} onClick={() => void rolar(p.expressao!, p.nome)}><Dice5 size={13} /> Só rolar</button>}
          {!somenteLeitura && !p.id.startsWith('arv-') && <><button type="button" className={botao} onClick={() => setEditando(p)} aria-label={'Editar ' + p.nome}><Pencil size={13} /></button>
            <button type="button" className={botao} onClick={() => remover(p)} aria-label={'Remover ' + p.nome}><Trash2 size={13} /></button></>}
        </div>
      </li>
    })}</ul></div>)}
    {c && editando && <EditorPoder s={s} inicial={editando} salvar={salvarPoder} fechar={() => setEditando(null)} />}
  </section>
}

function Janela({ titulo, fechar, children, ampla = false, temaDnd = false }: { titulo: string; fechar: () => void; children: React.ReactNode; ampla?: boolean; temaDnd?: boolean }) {
  return <NaTela><div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-2 sm:p-4" onMouseDown={e => { if (e.target === e.currentTarget) fechar() }}>
    <div role="dialog" aria-modal="true" aria-label={titulo} className={'w-full min-w-0 overflow-y-auto overscroll-contain rounded-2xl border border-(--a-6d5690) bg-(--s-1b1529) text-sm text-(--a-f2ebff) ' + (ampla ? 'max-h-[96dvh] max-w-2xl p-3 sm:p-5' : 'max-h-[88vh] max-w-lg p-5') + (temaDnd ? ' dnd-janela-editor' : '')}>
      <div className="sticky top-0 z-10 mb-3 flex items-center justify-between rounded-lg bg-(--s-1b1529) py-2"><h2 className="text-lg font-bold">{temaDnd && <span className="dnd-editor-selo" aria-hidden="true"><Shield size={20}/></span>}{titulo}</h2><button type="button" onClick={fechar} aria-label="Fechar" className="rounded-lg p-1.5 hover:bg-(--s-38294d)"><X size={18} /></button></div>
      {children}
    </div>
  </div></NaTela>
}

/** Editor de item (usado na ficha e na biblioteca do mestre). `s` pode faltar (biblioteca sem sistema conhecido). */
/** Foto do item (da galeria do celular ou do computador). Com foto, ela aparece no lugar do ícone. */
function FotoDoItem({ it, setIt }: { it: Item; setIt: React.Dispatch<React.SetStateAction<Item>> }) {
  const [ocupado, setOcupado] = useState(false)
  async function enviar(f: File) {
    setOcupado(true)
    try {
      const url = await enviarImagemNuvem('imagens', f, 600)
      // Evita sobrescrever nome, categoria e outros campos editados enquanto a foto é enviada.
      setIt(atual => ({ ...atual, imagem: url }))
    } catch (e) { toast.error(e instanceof ErroNuvem ? e.message : 'Falha ao enviar a imagem.') } finally { setOcupado(false) }
  }
  return <div className="flex items-center gap-3 rounded-xl border border-(--a-8b6cba)/70 bg-(--s-171325) p-3">
    <ArteItem item={it} tamanho={64} />
    <div className="min-w-0 flex-1 text-sm">
      <p className="font-semibold">📷 Foto do item <span className="text-xs font-normal text-(--a-c4b6d4)">(opcional)</span></p>
      <p className="text-[11px] text-(--a-c4b6d4)">{it.imagem ? 'Sua foto aparece no lugar da ilustração, sem apagar a arte selecionada.' : 'Escolha uma foto da sua galeria ou use as ilustrações da biblioteca.'}</p>
      {!NUVEM_ATIVA && <p className="mt-1 text-xs text-amber-200">Envio de fotos indisponível neste ambiente: o armazenamento de imagens precisa estar habilitado.</p>}
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <label className={botao + ' min-h-11 cursor-pointer border-(--a-b99bff) bg-(--s-2b2140) px-3 py-2 font-semibold ' + (ocupado || !NUVEM_ATIVA ? 'pointer-events-none opacity-50' : '')}>📷 {ocupado ? 'Enviando…' : it.imagem ? 'Trocar foto' : 'Escolher foto'}
          <input type="file" accept="image/png,image/jpeg,image/webp" disabled={ocupado || !NUVEM_ATIVA} className="sr-only" aria-label="Escolher foto do item" onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void enviar(f) }} /></label>
        {it.imagem && <button type="button" className={botao} onClick={() => setIt({ ...it, imagem: undefined })}>Usar o desenho</button>}
      </div>
    </div>
  </div>
}

export function EditorItem({ s, inicial, salvar, fechar, edicaoDnd = 'phb2024' }: { s?: Sistema; inicial: Item; salvar: (i: Item) => void; fechar: () => void; edicaoDnd?: LivroBaseDnd }) {
  const [it, setIt] = useState<Item>(inicial)
  const dnd = s?.id === 'dnd5e-srd'
  const temaDnd = dnd || s?.id === 'dnd5e-manual'
  const referencia = dnd ? referenciaArmaDndPorId(it.armaRefDnd) : null
  const armasEdicao = edicaoDnd === 'phb2014' ? ARMAS_DND_2014 : ARMAS_DND_2024
  // Ícones sugeridos pelo tipo do item (os outros ficam em “Ver todos”).
  const icoCategoria = it.categoria === 'arma'
    ? ['espada-medieval','adaga-medieval','machado-combate','maca-pesada','lanca-medieval','tridente-medieval','arqueiro','flecha','revolver','pistola','espada-encantada','garra-flamejante','varinha']
    : it.categoria === 'armadura' ? ['escudo','amuleto','coroa']
    : it.categoria === 'consumivel' ? ['frasco-veneno','gema','varinha']
    : it.categoria === 'tesouro' ? ['gema','anel','coroa','amuleto']
    : ['grimorio','mapa','mochila','candelabro','anel','amuleto']
  const iconesIndicados = ICONES_RPG.filter(x => icoCategoria.includes(x.id))
    .sort((x, y) => icoCategoria.indexOf(x.id) - icoCategoria.indexOf(y.id))
  const alvos = s ? alvosDeBonus(s) : []
  const setB = (i: number, b: Partial<Bonus>) => setIt({ ...it, bonus: it.bonus.map((x, k) => k === i ? { ...x, ...b } : x) })
  return <Janela titulo={temaDnd ? (inicial.nome ? 'Editar item · D&D' : 'Criar item · D&D') : (inicial.nome ? 'Editar item' : 'Novo item')} fechar={fechar} ampla temaDnd={temaDnd}>
    <form noValidate className="space-y-3" onSubmit={e => { e.preventDefault(); const v = normalizarItem(it); if (!v) { toast.error('Dê um nome ao item.'); return }
      if ((it.rolagens?.length ?? 0) > (v.rolagens?.length ?? 0)) toast.warning('Rolagens sem nome ou com dados inválidos ficaram de fora.')
      salvar({ ...v, id: inicial.id }) }}>
      <div className="flex items-center gap-3 rounded-xl border border-(--a-62527e) bg-gradient-to-r from-(--s-2b2143) to-(--s-171325) p-3">
        <ArteItem item={it} tamanho={72} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-(--a-d3adf0)">Prévia do item</p>
          <p className="mt-1 truncate font-semibold">{it.nome || 'Sua próxima descoberta'}</p>
          <p className="mt-1 text-[11px] text-(--a-c4b6d4)">Escolha um ícone do Game-Icons ou use sua própria foto. A raridade dá a cor da moldura.</p>
        </div>
      </div>
      <FotoDoItem it={it} setIt={setIt} />
      <label className="block">Nome<input required value={it.nome} maxLength={120} onChange={e => setIt({ ...it, nome: e.target.value })} className={input + ' mt-1'} placeholder="Ex.: Espada longa" /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">Tipo<select value={it.categoria} onChange={e => setIt({ ...it, categoria: e.target.value as Item['categoria'] })} className={input + ' mt-1'}>{CATEGORIAS_ITEM.map(c => <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>)}</select></label>
        <CampoPeso valor={it.peso} unidade={s?.carga?.unidade ?? 'kg'} mudar={peso => setIt({ ...it, peso })} />
      </div>
      {dnd && it.categoria === 'arma' && <div className="space-y-2 rounded-lg border border-(--a-55456e) bg-(--s-171325) p-3 text-xs">
        {referencia && <p className="rounded-lg border border-(--a-8b6cba)/50 bg-(--s-241a3a) p-2">📖 <strong>{referencia.nome}</strong> · {referencia.livro} ({referencia.edicao}). Efeitos exclusivos devem ser conferidos no livro.</p>}
        <label className="block">Modelo físico da arma (opcional)
          <select className={input + ' mt-1'} value={it.armaDnd ?? ''} onChange={e => {
            const a = armaDndPorIdEdicao(e.target.value)
            setIt({ ...it, armaDnd: a?.id, ...(a ? { dano: a.dano, peso: pesoEmKgArmaDnd(a), alcance: alcanceEmMetrosArmaDnd(a) } : {}) })
          }}>
            <option value="">Dano configurado manualmente</option>
            {armasEdicao.map(a => <option key={a.id} value={a.id}>{a.nome} · {a.dano || 'Sem dano'}</option>)}
          </select>
        </label>
        <p className="text-[11px] text-(--a-c4b6d4)">Escolher uma arma base permite rolar dano e crítico automaticamente. Não aplica efeitos mágicos exclusivos.</p>
      </div>}
      {dnd && <label className="flex items-center gap-2 rounded-lg border border-(--a-8b6cba)/50 bg-(--s-241a3a) p-3 text-xs"><input type="checkbox" checked={!!it.magico} onChange={e => setIt({ ...it, magico: e.target.checked || undefined })} className="h-4 w-4 accent-(--a-b99bff)" /> ✨ Item mágico · Exibir na coleção mágica</label>}
      {s?.id === 'dnd5e-srd' && it.armaDnd && <div className="rounded-lg border border-(--a-55456e) p-3 text-xs">
        <p className="mb-2">Arma do catálogo: <strong>{armaDndPorIdEdicao(it.armaDnd)?.nome}</strong>. {it.armaDnd?.startsWith('2014-') ? 'Regras e dano da edição 2014.' : 'Regras e dano da edição 2024.'} O crítico dobra apenas os dados, não os modificadores.</p>
        <label className="flex items-center gap-2">Bônus mágico da arma (+0 a +3)
          <select value={it.bonusArma ?? 0} onChange={e => setIt({ ...it, bonusArma: Number(e.target.value), magico: Number(e.target.value) > 0 ? true : it.magico })}
            className={input + ' max-w-24'}>{[0,1,2,3].map(v => <option key={v} value={v}>+{v}</option>)}</select>
        </label>
      </div>}
      <details className="rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3">
        <summary className="cursor-pointer font-semibold text-(--a-d3adf0)">🎨 Ícone e raridade</summary>
        <div className="mt-3 space-y-3">
          <p className="text-xs text-(--a-c4b6d4)">Escolha uma ilustração da biblioteca. A foto enviada sempre tem prioridade; você pode removê-la depois.</p>
          <div className="grid grid-cols-3 gap-2 min-[400px]:grid-cols-4 sm:grid-cols-6" role="group" aria-label="Biblioteca de ilustrações de itens">
            {iconesIndicados.map(icone => <button key={icone.id} type="button" title={icone.nome}
              aria-label={'Usar ilustração ' + icone.nome} aria-pressed={it.iconeBiblioteca === icone.id}
              onClick={() => setIt({ ...it, iconeBiblioteca: icone.id, arte: undefined })}
              className={'flex min-w-0 flex-col items-center gap-1 rounded-lg border p-2 transition hover:bg-(--s-34294f) ' +
                (it.iconeBiblioteca === icone.id ? 'border-(--a-ed9cd8) bg-(--s-3a2c58)' : 'border-(--a-55456e)')}>
              <ArteItem item={{ ...it, imagem: undefined, arte: undefined, iconeBiblioteca: icone.id }}
                tamanho={45} />
              <span className="w-full truncate text-[10px]">{icone.nome}</span>
            </button>)}
          </div>
          <button type="button" className={botao}
            onClick={() => setIt({ ...it, iconeBiblioteca: undefined, arte: undefined })}>Usar ilustração automática</button>
          <p className="text-[11px] text-(--a-c4b6d4)">
            Ilustrações: <a href="https://game-icons.net" target="_blank" rel="noopener noreferrer" className="underline">Game-Icons.net</a>
            {' · '}Lorc, Delapouite e outros autores{' · '}licença CC BY 3.0. Vetores com o fundo removido e cores aplicadas.
          </p>
          <details className="rounded-lg border border-(--a-55456e) p-2">
            <summary className="cursor-pointer text-xs font-semibold text-(--a-d3adf0)">🔎 Buscar entre todos os ícones do Game-Icons</summary>
            <div className="mt-2"><BuscaIcones valor={it.iconeBiblioteca} escolher={id => setIt({ ...it, iconeBiblioteca: id, arte: undefined })} /></div>
          </details>
          <label className="block text-xs">Raridade
            <select value={it.raridade ?? ''} onChange={e => setIt({ ...it, raridade: e.target.value as Item['raridade'] || undefined })} className={input + ' mt-1'}>
              <option value="">Sem raridade</option>
              {RARIDADES.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
          </label>
        </div>
      </details>
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-2">
        <label className="block">{it.categoria === 'consumivel' ? 'Rolagem ao usar (ex.: cura 2d4+2)' : 'Dano ou rolagem (ex.: 1d8+3)'}
          <input value={it.dano ?? ''} maxLength={40} disabled={s?.id === 'dnd5e-srd' && !!it.armaDnd}
            onChange={e => setIt({ ...it, dano: e.target.value })} className={input + ' mt-1 disabled:opacity-50'} placeholder="Opcional" /></label>
        <label className="block">Alcance (m)<input type="number" min={0} max={1000} step="any" value={it.alcance ?? ''} onChange={e => setIt({ ...it, alcance: Number(e.target.value) || undefined })} className={input + ' mt-1'} placeholder="1,5" /></label>
      </div>
      <EditorRolagens rolagens={it.rolagens ?? []} mudar={r => setIt({ ...it, rolagens: r.length ? r : undefined })} />
      {alvos.length > 0 && <fieldset className="rounded-xl border border-(--a-55456e) p-3">
        <legend className="px-1 text-xs text-(--a-d3adf0)">Bônus quando equipado</legend>
        {it.bonus.map((b, i) => <div key={i} className="mb-2 flex gap-2">
          <select aria-label="Onde soma" value={b.alvo} onChange={e => setB(i, { alvo: e.target.value })} className={input + ' flex-1'}>{alvos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}</select>
          <input aria-label="Valor" type="number" value={b.valor} onChange={e => setB(i, { valor: Number(e.target.value) || 0 })} className={input + ' w-20'} />
          <button type="button" onClick={() => setIt({ ...it, bonus: it.bonus.filter((_, k) => k !== i) })} aria-label="Tirar bônus" className={botao}><Trash2 size={13} /></button>
        </div>)}
        {it.bonus.length < 8 && <button type="button" className={botao} onClick={() => setIt({ ...it, bonus: [...it.bonus, { alvo: alvos[0].id, valor: 1 }] })}><Plus size={13} /> Adicionar bônus</button>}
        <p className="mt-2 text-[11px] text-(--a-a998bd)">Ex.: escudo → Classe de Armadura +2; anel → uma resistência +1.</p>
      </fieldset>}
      <label className="block">Descrição<textarea rows={3} value={it.descricao ?? ''} maxLength={2000} onChange={e => setIt({ ...it, descricao: e.target.value })} className={input + ' mt-1'} /></label>
      <div className="sticky bottom-0 -mx-3 flex gap-2 rounded-xl border-t border-(--a-62527e) bg-(--s-1b1529) p-3 shadow-2xl sm:mx-0"><button type="button" onClick={fechar} className="flex-1 rounded-lg border border-(--a-62527e) p-2.5">Cancelar</button>
        <button type="submit" className="min-h-11 flex-1 rounded-lg bg-(--a-7654bb) p-2.5 font-semibold">Salvar item</button></div>
    </form>
  </Janela>
}

export function EditorPoder({ s, inicial, salvar, fechar }: { s?: Sistema; inicial: Poder; salvar: (p: Poder) => void; fechar: () => void }) {
  const [p, setP] = useState<Poder>(inicial)
  const recursos = s?.recursos ?? []
  return <Janela titulo={inicial.nome ? 'Editar poder' : 'Novo poder'} fechar={fechar} temaDnd={s?.id === 'dnd5e-srd' || s?.id === 'dnd5e-manual'}>
    <form noValidate className="space-y-3" onSubmit={e => { e.preventDefault(); const v = normalizarPoder(p); if (!v) { toast.error('Dê um nome ao poder.'); return } salvar({ ...v, id: inicial.id }) }}>
      {(s?.id === 'dnd5e-srd' || s?.id === 'dnd5e-manual') && <div className="dnd-editor-intro"><Sparkles size={22} aria-hidden="true"/><div><strong>{p.nome || 'Uma nova habilidade'}</strong><p>Registre sua técnica, magia ou poder personalizado.</p></div></div>}
      <label className="block">Nome<input autoFocus required value={p.nome} maxLength={120} onChange={e => setP({ ...p, nome: e.target.value })} className={input + ' mt-1'} placeholder="Ex.: Bola de fogo" /></label>
      <label className="block">Tipo<select value={p.tipo} onChange={e => setP({ ...p, tipo: e.target.value as Poder['tipo'] })} className={input + ' mt-1'}>{TIPOS_PODER.map(t => <option key={t.id} value={t.id}>{t.icone} {s?.id === "ordem-paranormal" && t.id === "magia" ? "Ritual" : t.nome}</option>)}</select></label>
      {s?.id === "ordem-paranormal" && (p.tipo === "magia" ? <div className="grid grid-cols-2 gap-2"><label>Elemento<select className={input} value={p.elementoOrdem ?? ""} onChange={e => setP({...p, elementoOrdem: (e.target.value || undefined) as Poder["elementoOrdem"]})}><option value="">Não definido</option>{ELEMENTOS_ORDEM.map(e => <option key={e}>{e}</option>)}</select></label><label>Círculo<select className={input} value={p.circuloOrdem ?? ""} onChange={e => setP({...p, circuloOrdem: Number(e.target.value) || undefined})}><option value="">Não definido</option>{[1,2,3,4].map(n => <option key={n} value={n}>{n}º</option>)}</select></label></div> : <label>Origem do poder<select className={input} value={p.fonteOrdem ?? ""} onChange={e => setP({...p, fonteOrdem: (e.target.value || undefined) as Poder["fonteOrdem"]})}><option value="">Não definida</option>{FONTES_ORDEM.map(f => <option key={f}>{f}</option>)}</select></label>)}
      {recursos.length > 0 && <div className="grid grid-cols-2 gap-2">
        <label className="block">Gasta<select value={p.recurso ?? ''} onChange={e => setP({ ...p, recurso: e.target.value || undefined, custo: e.target.value ? p.custo ?? 1 : undefined })} className={input + ' mt-1'}>
          <option value="">Nada</option>{recursos.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}</select></label>
        <label className="block">Quanto<input type="number" min={0} disabled={!p.recurso} value={p.custo ?? ''} onChange={e => setP({ ...p, custo: Number(e.target.value) || 0 })} className={input + ' mt-1'} /></label>
      </div>}
      <div className="grid grid-cols-2 gap-2">
        <label className="block">Usos até descansar<input type="number" min={0} max={99} value={p.usosMax ?? ''} onChange={e => setP({ ...p, usosMax: Number(e.target.value) || undefined })} className={input + ' mt-1'} placeholder="Sem limite" /></label>
        <label className="block">Rolagem<input value={p.expressao ?? ''} maxLength={40} onChange={e => setP({ ...p, expressao: e.target.value })} className={input + ' mt-1'} placeholder="Ex.: 8d6" /></label>
      </div>
      {!!p.usosMax && <label className="block">Os usos voltam no<select value={p.recarga ?? 'longo'} onChange={e => setP({ ...p, recarga: e.target.value === 'curto' ? 'curto' : undefined })} className={input + ' mt-1'}>
        <option value="longo">🌙 Descanso longo</option><option value="curto">☕ Descanso curto (ou longo)</option></select></label>}
      <label className="block">Alcance na mesa (metros)<input type="number" min={0} max={1000} step="any" value={p.alcance ?? ''} onChange={e => setP({ ...p, alcance: Number(e.target.value) || undefined })} className={input + ' mt-1'} placeholder="Corpo a corpo (1,5 m)" /></label>
      <label className="block">Descrição<textarea rows={4} value={p.descricao ?? ''} maxLength={2000} onChange={e => setP({ ...p, descricao: e.target.value })} className={input + ' mt-1'} placeholder="Alcance, duração, efeito…" /></label>
      <div className="flex gap-2"><button type="button" onClick={fechar} className="flex-1 rounded-lg border border-(--a-62527e) p-2.5">Cancelar</button>
        <button type="submit" className="flex-1 rounded-lg bg-(--a-7654bb) p-2.5 font-semibold">Salvar</button></div>
    </form>
  </Janela>
}


/** Rolagens prontas do item (v0.35.3): cada uma vira um botão no inventário e nas ações rápidas. */
function EditorRolagens({ rolagens, mudar }: { rolagens: RolagemItem[]; mudar: (r: RolagemItem[]) => void }) {
  const set = (i: number, v: Partial<RolagemItem>) => mudar(rolagens.map((r, k) => k === i ? { ...r, ...v } : r))
  const valida = (e: string) => !e.trim() || /^[0-9dkhlfrs!+\- ]{0,40}$/i.test(e.trim()) && /\d/.test(e)
  const nomes = rolagens.map(r => r.nome)
  return <fieldset className="rounded-xl border border-(--a-55456e) p-3">
    <legend className="px-1 text-xs text-(--a-d3adf0)">🎲 Rolagens prontas</legend>
    {rolagens.map((r, i) => <div key={i} className="mb-2 flex gap-2">
      <input aria-label="Nome da rolagem" value={r.nome} maxLength={40} onChange={e => set(i, { nome: e.target.value })} className={input + ' min-w-0 flex-1'} placeholder="Ex.: Acerto" />
      <input aria-label="Dados da rolagem" value={r.expr} maxLength={40} aria-invalid={!valida(r.expr)} onChange={e => set(i, { expr: e.target.value })} className={input + ' w-28' + (valida(r.expr) ? '' : ' !border-amber-400')} placeholder="1d20+5" />
      <button type="button" onClick={() => mudar(rolagens.filter((_, k) => k !== i))} aria-label="Tirar rolagem" className={botao}><Trash2 size={13} /></button>
    </div>)}
    {rolagens.length < MAX_ROLAGENS_ITEM && <div className="flex flex-wrap gap-1.5">
      {[{ nome: 'Acerto', expr: '1d20' }, { nome: 'Dano', expr: '1d6' }, { nome: 'Crítico', expr: '2d6' }].filter(p => !nomes.includes(p.nome)).map(p =>
        <button key={p.nome} type="button" className={botao} onClick={() => mudar([...rolagens, p])}><Plus size={13} /> {p.nome}</button>)}
      <button type="button" className={botao} onClick={() => mudar([...rolagens, { nome: '', expr: '' }])}><Plus size={13} /> Outra</button>
    </div>}
    <p className="mt-2 text-[11px] text-(--a-a998bd)">Escreva os dados com os números da ficha (ex.: Acerto 1d20+5, Dano 2d6+3). Nada é somado sozinho. Com o item equipado, os botões aparecem nas ações rápidas.</p>
  </fieldset>
}

/**
 * Peso do item (v0.33.8): campo de texto para aceitar vírgula e gramas (“0,25”, “250 g”). O antigo campo numérico
 * com passo 0,1 recusava valores como 0,25 e travava o “Salvar” sem avisar.
 */
function CampoPeso({ valor, unidade, mudar }: { valor: number; unidade: string; mudar: (n: number) => void }) {
  const [txt, setTxt] = useState(valor ? String(valor).replace('.', ',') : '')
  const n = lerPeso(txt, unidade)
  return <label className="block">Peso ({unidade})
    <input value={txt} inputMode="decimal" placeholder={/^kg/i.test(unidade) ? 'Ex.: 1,5 ou 250 g' : '0'} aria-invalid={n === null}
      onChange={e => { setTxt(e.target.value); const v = lerPeso(e.target.value, unidade); if (v !== null) mudar(v) }} className={input + ' mt-1' + (n === null ? ' !border-amber-400' : '')} />
    <span className="mt-0.5 block text-[11px] text-(--a-a998bd)">{n === null ? 'Use números, como 0,25 ou 250 g.' : n > 0 ? mostrarPeso(n, unidade) : 'Sem peso'}</span></label>
}
