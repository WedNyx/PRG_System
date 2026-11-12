// v0.32.10: fichas revisadas (Ordem Paranormal, Tormenta20, D&D 5e, Pathfinder 2e). Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
const ficha=async(cid,sistema,nome,mudar)=>{ let r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'npc',sistema,nome}); const id=r.d.ficha.id
  r=await call(M,'GET','fichas/'+id); const d=r.d.ficha.dados; r=await call(M,'PUT','fichas/'+id,{versao:r.d.ficha.versao,dados:mudar(d)}); return { id, s:r.s } }

// Ordem Paranormal: parada de d20 na mesa
let r=await call(M,'POST','campanhas',{nome:'Operação',sistema:'ordem-paranormal',modeloPadrao:'C'}); const cid=r.d.campanha.id
const mesa=b=>call(M,'POST','mesa/'+cid,b)
await mesa({acao:'sessao',aberta:true})
const ag=await ficha(cid,'ordem-paranormal','Agente',d=>({...d,campos:{...d.campos,classe:'Combatente',nex:10},atributos:{AGI:3,FOR:2,INT:1,PRE:1,VIG:2},
  pericias:{...d.pericias,luta:'treinado',iniciativa:'veterano'},itens:[{id:'faca',nome:'Faca',categoria:'arma',peso:1,dano:'1d4',bonus:[]}]}))
const cr=await ficha(cid,'ordem-paranormal','Criatura',d=>({...d,campos:{...d.campos,classe:'Ocultista'}}))
check('fichas de Ordem Paranormal salvam', ag.s===200 && cr.s===200, [ag,cr])
r=await call(M,'GET',`mesa/${cid}?fichas=1`); const fa=r.d.fichas.find(f=>f.id===ag.id)
check('combate lê PV pela classe e NEX (20+2+4+2 = 28) e Defesa 13', fa?.combate.vida.max===28 && fa.combate.defesa.valor===13, fa?.combate)
check('teste de Luta rola 2 dados (Força 2) com +5', fa?.combate.testes.find(t=>t.id==='pericia:luta')?.dados===2, fa?.combate.testes.find(t=>t.id==='pericia:luta'))
r=await mesa({acao:'cena_criar',nome:'Sala',grid_cols:10,grid_rows:10}); let cena=r.d.cena?.id
r=await call(M,'GET','mesa/'+cid); cena=r.d.cenaAtiva?.id ?? cena; if(!r.d.cenaAtiva) await mesa({acao:'cena_ativar',cenaId:cena})
const tA=(await mesa({acao:'token_criar',cenaId:cena,fichaId:ag.id,x:2,y:2})).d.token.id
const tC=(await mesa({acao:'token_criar',cenaId:cena,fichaId:cr.id,x:3,y:2})).d.token.id
r=await mesa({acao:'ataque',atacante:tA,alvo:tC,fonte:{tipo:'item',id:'faca'},teste:'pericia:luta'})
check('ataque na mesa rola 2d20, fica com o maior, +5', r.s===201 && r.d.evento.expressao==='2d20kh1+5' && r.d.evento.resultados.length===2, r.d.evento ?? r)
r=await mesa({acao:'combate_preparar',tokens:[{tokenId:tA},{tokenId:tC}]})
const rolA=r.d.rolagens?.find(o=>o.tokenId===tA)
check('iniciativa rola a parada de Agilidade (3 dados) + 10', r.s===200 && rolA?.bonus===10 && rolA?.dados.length===3, r.d)

// Tormenta20, D&D e Pathfinder: máximos sugeridos aparecem no combate
for (const [sistema, nome, mudar, esperado] of [
  ['tormenta20', 'Guerreira', d=>({...d,campos:{...d.campos,classe:'Guerreiro',nivel:2},atributos:{...d.atributos,CON:2}}), 20+2+5+2],
  ['dnd5e-srd', 'Bárbaro', d=>({...d,campos:{...d.campos,classe:'Bárbaro',nivel:2},atributos:{...d.atributos,CON:14}}), 12+2+7+2],
  ['pf2e', 'Anã', d=>({...d,campos:{...d.campos,ancestralidade:'Anão',classe:'Guerreiro',nivel:1},atributos:{...d.atributos,CON:2}}), 10+10+2],
]) {
  r=await call(M,'POST','campanhas',{nome:'Teste '+sistema,sistema,modeloPadrao:'C'}); const c2=r.d.campanha.id
  const f=await ficha(c2,sistema,nome,mudar)
  r=await call(M,'GET',`mesa/${c2}?fichas=1`); const vida=r.d.fichas?.find(x=>x.id===f.id)?.combate.vida
  check(`${sistema}: PV máximo pela classe = ${esperado}`, f.s===200 && vida?.max===esperado, vida)
}
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
