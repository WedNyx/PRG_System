// v0.15.0: árvore de habilidades nas fichas (servidor limpa/sincroniza, recompensa dá pontos, regras da campanha). Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,300))); if(!c) falhas++ }
const arvore = { pontos: 1, nos: [
  { id: 'a', nome: 'Força do Urso', custo: 1, x: 0, y: 0, efeitos: [{ tipo: 'bonus', alvo: 'atributo:FOR', valor: 2 }, { tipo: 'poder', poder: { nome: 'Rugido', expressao: '1d8' } }] },
  { id: 'b', nome: 'Fúria', custo: 2, x: 0, y: -150, requer: ['a'], efeitos: [{ tipo: 'poder', poder: { nome: 'Fúria', expressao: '2d6' } }] },
], liberados: [] }
let r=await call(M,'POST','campanhas',{nome:'Árvores',sistema:'dnd5e-srd',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(J,'POST','convites/'+r.d.convite.codigo,{}); r=await call(M,'GET','campanhas/'+cid); await call(M,'POST',`campanhas/${cid}/solicitacoes/${r.d.solicitacoes[0].id}`,{decisao:'aceitar'})
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'dnd5e-srd',nome:'Bruma'}); const fid=r.d.ficha.id
// mestre monta a árvore (ele edita tudo)
r=await call(M,'GET','fichas/'+fid); let v=r.d.ficha.versao, d=r.d.ficha.dados
r=await call(M,'PUT','fichas/'+fid,{versao:v,dados:{...d,arvore}}); check('mestre monta a árvore da ficha', r.s===200 && !r.d.pendentes.length, r.d)
r=await call(J,'GET','fichas/'+fid); d=r.d.ficha.dados; v=r.d.ficha.versao
check('árvore chega limpa', d.arvore.nos.length===2 && d.arvore.pontos===1, d.arvore)
// jogador libera: no modelo C, Habilidades pede aprovação
r=await call(J,'PUT','fichas/'+fid,{versao:v,dados:{...d,arvore:{...d.arvore,liberados:['a']},poderes:[{id:'arv-a-1',nome:'Rugido',tipo:'habilidade',expressao:'1d8'}]}})
check('liberar hexágono segue a regra "Habilidades" (vai para aprovação)', r.s===200 && r.d.pendentes.includes('habilidades'), r.d)
r=await call(M,'GET',`campanhas/${cid}/alteracoes`); const alt=(r.d.alteracoes??r.d.pedidos??[]).find(a=>a.ficha_id===fid)
if (alt) { r=await call(M,'POST',`campanhas/${cid}/alteracoes`,{id:alt.id,decisao:'aceitar'}); check('mestre aprova', r.s===200, r) } else check('pedido de alteração existe', false, r.d)
r=await call(J,'GET','fichas/'+fid); d=r.d.ficha.dados; v=r.d.ficha.versao
check('liberado e habilidade na lista de poderes', d.arvore.liberados.join()==='a' && d.poderes.some(p=>p.id==='arv-a-1' && p.nome==='Rugido'), {arv:d.arvore.liberados, pod:d.poderes})
// servidor não aceita poder "da árvore" inventado
r=await call(M,'PUT','fichas/'+fid,{versao:v,dados:{...d,poderes:[...d.poderes,{id:'arv-falso-0',nome:'Trapaça',tipo:'magia'}]}}); v=r.d.versao
r=await call(J,'GET','fichas/'+fid); check('poder falso com id da árvore é descartado', !r.d.ficha.dados.poderes.some(p=>p.id==='arv-falso-0'), r.d.ficha.dados.poderes)
// recompensa com pontos
r=await call(M,'POST',`campanhas/${cid}/recompensas`,{fichaIds:[fid],pontos:2,motivo:'Venceram o dragão'}); check('mestre dá 2 pontos de habilidade', r.s===200, r)
r=await call(J,'GET','fichas/'+fid); check('pontos somam na árvore', r.d.ficha.dados.arvore.pontos===3, r.d.ficha.dados.arvore)
r=await call(M,'POST',`campanhas/${cid}/recompensas`,{fichaIds:[fid],pontos:500}); check('pontos absurdos recusados', r.s===400, r)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
