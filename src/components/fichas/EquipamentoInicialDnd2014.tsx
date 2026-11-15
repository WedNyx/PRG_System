'use client'

import type { DadosFicha } from '@/lib/sistemas/tipos'
import { lerItens, lerUso } from '@/lib/sistemas/inventario'
import { KITS_CLASSES_2014, escolhasKitClasse2014Validas } from '@/lib/sistemas/dnd2014EquipamentoOpcoes'
import { escolherKitInicial2014, escolherOuroInicial2014, formulaRiquezaInicial2014,
  registroEquipamentoAtual2014, totalRiquezaInicial2014 } from '@/lib/sistemas/dnd2014EquipamentoInicial'

const btn='min-h-11 w-full sm:w-auto rounded-lg border border-(--a-62527e) bg-(--s-251a38) px-3 py-2 text-xs font-semibold hover:bg-(--s-34294f) disabled:opacity-40'

export default function EquipamentoInicialDnd2014({d,onChange,somenteLeitura,irPara}:{
  d:DadosFicha;onChange:(d:DadosFicha)=>void;somenteLeitura:boolean;irPara?:(secao:string)=>void
}) {
  const classe=String(d.campos.classe??''),antecedente=String(d.campos.antecedente??'')
  const tabela=formulaRiquezaInicial2014(classe)
  const registro=d.dnd2014EquipamentoInicial
  const atual=registroEquipamentoAtual2014(d)
  const inventario=lerItens(d.itens)
  const carteira=lerUso(d.uso).carteira
  const kit=KITS_CLASSES_2014[classe]
  const kitCompleto=escolhasKitClasse2014Validas(classe,registro?.escolhas,true)
  const ouro=registro?.modo==='ouro' ? totalRiquezaInicial2014(registro.classe,registro.dados??[]) : null
  const podeEscolher=!!tabela&&!!antecedente&&!somenteLeitura
  const confirmarTroca=()=>!registro||confirm('Alterar o método de equipamento inicial? Itens e moedas já registrados no inventário não serão removidos.')
  return <section aria-label="Equipamento inicial D&D 2014" className="min-w-0 space-y-3 rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3">
    <h4 className="font-semibold text-(--a-d3adf0)">🎒 Equipamento inicial · PHB 2014</h4>
    <p className="text-xs text-(--a-cfc0df)">No Livro do Jogador (capítulos 1 e 5), escolha uma alternativa:
      registrar os equipamentos da classe <strong>e</strong> do antecedente no Inventário, ou começar com ouro da classe
      e comprar os itens. A alternativa em ouro não fornece os kits gratuitos.</p>
    {!tabela&&<p className="text-xs text-amber-200">Selecione uma das 12 classes de 2014 para mostrar a riqueza inicial.</p>}
    {!antecedente&&<p className="text-xs text-amber-200">Escolha também o antecedente antes de registrar o equipamento.</p>}
    {tabela&&<p className="text-xs">Riqueza inicial da classe <strong>{classe}</strong>: {tabela.expressao}.</p>}
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={!podeEscolher} className={btn} aria-pressed={registro?.modo==='kit'&&atual}
        onClick={()=>{if(confirmarTroca())onChange(escolherKitInicial2014(d))}}>Usar equipamentos de classe + antecedente</button>
      <button type="button" disabled={!podeEscolher||(registro?.modo==='ouro'&&atual)} className={btn} aria-pressed={registro?.modo==='ouro'&&atual}
        onClick={()=>{if(!confirmarTroca())return;const proximo=escolherOuroInicial2014(d);if(proximo)onChange(proximo)}}>
        Rolar ouro inicial da classe
      </button>
    </div>
    {registro && !atual && (registro.classe!==classe||registro.antecedente!==antecedente) &&
      <p role="status" className="text-xs text-amber-200">Classe ou antecedente mudaram. Revise e registre a escolha de equipamento inicial novamente.</p>}
    {registro?.modo==='kit'&&<div className="space-y-2 rounded-lg border border-(--a-55456e) p-3">
      <p className="text-xs">Método: equipamentos do <strong>{registro.classe}</strong> + antecedente <strong>{registro.antecedente}</strong>.
        Confira as escolhas oferecidas em cada capítulo e lance cada arma, armadura, ferramenta e kit no Inventário.
        Não adicionamos automaticamente itens presumidos ou duplicados.</p>
      {kit&&registro.classe===classe&&<div className="space-y-2">
        <p className="text-xs font-semibold">Opções de equipamento de {classe} (capítulo 3)</p>
        {kit.grupos.map(grupo=><label key={grupo.id} className="block text-xs">{grupo.titulo}
          <select value={registro.escolhas?.[grupo.id]??''} disabled={somenteLeitura}
            onChange={e=>{const escolhas={...registro.escolhas};if(e.target.value)escolhas[grupo.id]=e.target.value;else delete escolhas[grupo.id];
              onChange({...d,dnd2014EquipamentoInicial:{...registro,conferido:false,escolhas}})}}
            className="mt-1 min-h-11 min-w-0 w-full rounded-lg border border-(--a-55456e) bg-(--s-151123) p-2 text-white">
            <option value="">Selecione a alternativa...</option>
            {grupo.opcoes.map(op=><option key={op} value={op}>{op}</option>)}
          </select>
        </label>)}
        {kit.fixos.length>0&&<p className="text-xs">Itens fixos da classe: {kit.fixos.join(' · ')}.</p>}
        <p className="text-xs text-(--a-cfc0df)">
          Confira ainda os itens concedidos pelo antecedente <strong>{antecedente}</strong> na seção dele no livro.
          Opções genéricas de arma ou instrumento precisam ser especificadas no Inventário.</p>
      </div>}
      <p className="text-xs text-(--a-cfc0df)">Itens no inventário: {inventario.length}.
        Selecionar uma alternativa aqui não adiciona nem duplica itens automaticamente.</p>
      <label className="flex items-start gap-2 text-xs"><input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0" checked={atual&&registro.conferido===true}
        disabled={somenteLeitura||inventario.length===0||!kitCompleto||registro.classe!==classe||registro.antecedente!==antecedente}
        onChange={e=>onChange({...d,dnd2014EquipamentoInicial:{...registro,conferido:e.target.checked}})}/>
        Já registrei os equipamentos da classe e do antecedente no Inventário conforme o livro.</label>
    </div>}
    {registro?.modo==='ouro'&&<div className="space-y-2 rounded-lg border border-(--a-55456e) p-3">
      <p className="text-sm font-semibold text-amber-200">{ouro===null?'Rolagem inválida':ouro+' peças de ouro iniciais'}</p>
      <p className="text-xs">Rolagem inicial registrada: esta escolha não pode ser rolada novamente por um segundo clique.</p>
      <p className="text-xs">Dados d4 registrados: {registro.dados?.join(' + ')??'—'}.
        A carteira só é preenchida automaticamente se estava vazia, sem apagar moedas existentes.</p>
      <p className="text-xs">Carteira atual: {carteira||'vazia'}. Use o Inventário para registrar compras e gastos;
        o modo de ouro não dá os equipamentos da classe ou do antecedente gratuitamente.</p>
    </div>}
    {irPara&&<button type="button" className={btn} onClick={()=>irPara('equipamentos')}>Abrir Inventário</button>}
    {!registro&&<p className="text-xs text-amber-200">Equipamento inicial ainda não registrado. Fichas antigas permanecem intactas.</p>}
  </section>
}
