'use client'
import type { DadosFicha } from '@/lib/sistemas/tipos'
import { ATRS_2014, CONJUNTO_2014, CUSTOS_2014, diagnosticoAtributos2014, marcosIncremento2014, rolarAtributos2014, totalRolagem2014, type MetodoAtributos2014 } from '@/lib/sistemas/dnd2014Atributos'
import { niveisVida2014 } from '@/lib/sistemas/dnd2014Vitalidade'
import { progressoXp2014, xpParaNivel2014 } from '@/lib/sistemas/dnd2014Experiencia'
import { limitesTalentos2014 } from '@/lib/sistemas/dnd2014Talentos'
const estilo='mt-1 w-full min-w-0 rounded-lg border border-(--a-62527e) bg-(--s-151123) p-2 text-sm'
export default function AtributosProgressaoDnd2014({d,onChange,somenteLeitura}:{d:DadosFicha;onChange:(d:DadosFicha)=>void;somenteLeitura:boolean}) {
  const metodo=d.dnd2014MetodoAtributos??'manual'
  const marcos=marcosIncremento2014(d)
  const inc=d.dnd2014Incrementos??{}
  const nivel=Math.max(1,Math.min(20,Number(d.campos.nivel)||1))
  const xp=progressoXp2014(Number(d.campos.xp)||0,nivel)
  const usados=Object.keys(inc).length+Math.max(0,(d.dnd2014Talentos?.length??0)-limitesTalentos2014(d).variante)
  const diagnostico=diagnosticoAtributos2014(d)
  const trocarMetodo=(m:MetodoAtributos2014)=> {
    // A escolha é explícita e preserva a base existente; aplicar resultados é outra ação.
    onChange({...d,dnd2014MetodoAtributos:m})
  }
  const aplicar=(valores:number[],rolagens?:number[][])=>onChange({...d,
    dnd2014AtributosBase:Object.fromEntries(ATRS_2014.map((a,i)=>[a,valores[i]])),
    ...(rolagens?{dnd2014RolagensAtributos:rolagens}:{})})
  return <section aria-label="Método de atributos e progressão 2014" className="min-w-0 space-y-3 rounded-xl border border-(--a-55456e) p-3">
    <label className="block text-sm font-semibold">Método dos atributos-base
      <select value={metodo} disabled={somenteLeitura} className={estilo} onChange={e=>trocarMetodo(e.target.value as MetodoAtributos2014)}>
        <option value="manual">Manual / ficha existente</option><option value="padrao">Conjunto padrão</option>
        <option value="pontos">Compra de 27 pontos (opcional)</option><option value="rolagem">4d6, descartar o menor</option>
      </select>
    </label>
    <p className="text-xs">Trocar o método não altera atributos existentes. Os botões abaixo substituem os seis valores-base; use somente na criação. Distribua depois na tabela do guia.</p>
    {!somenteLeitura && metodo==='padrao' && <button type="button" className={estilo} onClick={()=>aplicar(CONJUNTO_2014)}>Aplicar 15, 14, 13, 12, 10, 8 como base</button>}
    {!somenteLeitura && metodo==='pontos' && <button type="button" className={estilo} onClick={()=>aplicar(ATRS_2014.map(()=>8))}>Iniciar compra: todos os atributos-base em 8</button>}
    {metodo==='pontos' && <p className="text-xs">Gastos: {ATRS_2014.reduce((s,a)=>s+(CUSTOS_2014[d.dnd2014AtributosBase?.[a]??8]??0),0)}/27. Custos: 8=0, 9=1, 10=2, 11=3, 12=4, 13=5, 14=7, 15=9.</p>}
    {!somenteLeitura && metodo==='rolagem' && <button type="button" className={estilo} onClick={()=>{const r=rolarAtributos2014();aplicar(r.map(totalRolagem2014),r)}}>Rolar seis grupos de 4d6 e aplicar como base</button>}
    {metodo==='rolagem' && d.dnd2014RolagensAtributos?.map((r,i)=><p key={i} className="text-xs">Grupo {i+1}: {r.join(', ')} → {totalRolagem2014(r)} (menor descartado)</p>)}
    {diagnostico.length>0 && <p role="status" className="text-xs text-amber-200">{diagnostico.join(' ')}</p>}
    <div className="space-y-2 rounded-lg border border-(--a-55456e) p-3">
      <h4 className="text-sm font-semibold">📈 Experiência e nível (PHB 2014)</h4>
      <p className="text-xs">Nível atual: {xp.nivel} · XP registrado: {xp.xp.toLocaleString('pt-BR')} · bônus de proficiência: +{Math.floor((xp.nivel-1)/4)+2}.</p>
      <p className="text-xs">{xp.proximo===null?'Nível 20: progressão por XP concluída.':
        'Próximo nível: '+xp.proximo.toLocaleString('pt-BR')+' XP (faltam '+xp.faltam.toLocaleString('pt-BR')+').'}</p>
      {xp.nivelPeloXp!==xp.nivel&&<p className="text-xs text-amber-200">
        XP sugere nível {xp.nivelPeloXp}; o nível informado é {xp.nivel}.
        Se a campanha usa progressão por marcos, o nível pode ser ajustado manualmente pelo mestre.</p>}
      <label className="block text-xs">XP total (não sobe de nível automaticamente)
        <input type="number" min={0} step={1} className={estilo} value={d.campos.xp??0}
          disabled={somenteLeitura} onChange={e=>onChange({...d,campos:{...d.campos,xp:Math.max(0,Math.floor(Number(e.target.value)||0))}})} />
      </label>
      {!somenteLeitura&&xp.xp===0&&xp.nivel>1&&<button type="button" className={estilo}
        onClick={()=>onChange({...d,campos:{...d.campos,xp:xpParaNivel2014(xp.nivel)}})}>
        Registrar XP mínimo do nível {xp.nivel} (opcional)
      </button>}
    </div>
    <details className="rounded-lg border border-(--a-55456e) p-2">
      <summary className="cursor-pointer text-sm font-semibold">Pontos de Vida por nível</summary>
      <p className="my-2 text-xs">Primeiro nível: dado máximo. Demais níveis: média fixa ou resultado rolado, mais Constituição (mínimo de 1 PV por nível). Alterações de Constituição são retroativas. Um máximo de PV digitado manualmente na ficha continua tendo prioridade.</p>
      <div className="grid gap-2 sm:grid-cols-2">{niveisVida2014(d).map(n=><label key={n.id} className="text-xs">{n.nome} · d{n.dado}
        {n.inicial ? <span className="block">{n.dado} + CON (dado máximo)</span> : <select className={estilo} disabled={somenteLeitura} value={d.dnd2014VidaRolada?.[n.id]??''}
          onChange={e=>{const novo={...d.dnd2014VidaRolada};if(e.target.value)novo[n.id]=Number(e.target.value);else delete novo[n.id];onChange({...d,dnd2014VidaRolada:novo})}}>
          <option value="">Média fixa: {Math.floor(n.dado/2)+1}</option>
          {Array.from({length:n.dado},(_,i)=><option key={i+1} value={i+1}>Rolagem registrada: {i+1}</option>)}
        </select>}
      </label>)}</div>
    </details>
    {marcos.length>0 && <>
      <h4 className="text-sm font-semibold">Incrementos de Atributo por classe</h4>
      <p className="text-xs">{usados}/{marcos.length} marcos utilizados. Cada marco permite +2 em um atributo ou +1 em dois, até 20, ou um talento opcional. Talentos são escolhidos no guia abaixo. Não inclui efeitos próprios de talentos.</p>
      {!d.dnd2014AtributosBase && <p className="text-xs text-amber-200">Ficha com totais manuais: mantenha seus valores atuais ou confirme uma base antes de usar incrementos automáticos.</p>}
      {marcos.map(m=><div key={m.id} className="rounded-lg border border-(--a-55456e) p-2">
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!inc[m.id]}
          disabled={somenteLeitura || !d.dnd2014AtributosBase || (!inc[m.id] && usados>=marcos.length)}
          onChange={e=>{const novo={...inc};if(e.target.checked)novo[m.id]={atributos:['FOR','FOR']};else delete novo[m.id];onChange({...d,dnd2014Incrementos:novo})}} />{m.nome}: aplicar pontos</label>
        {inc[m.id] && <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">{[0,1].map(i=><label key={i} className="text-xs">Ponto {i+1}
          <select className={estilo} disabled={somenteLeitura} value={inc[m.id].atributos[i]} onChange={e=>{const atributos=[...inc[m.id].atributos];atributos[i]=e.target.value;onChange({...d,dnd2014Incrementos:{...inc,[m.id]:{atributos}}})}}>
            {ATRS_2014.map(a=><option key={a}>{a}</option>)}
          </select></label>)}</div>}
      </div>)}
    </>}
  </section>
}
