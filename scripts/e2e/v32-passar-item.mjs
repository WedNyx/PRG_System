// v0.32.0: passar item de um personagem para outro na mesma campanha (na hora, sem aprovação). Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222', X='33333333-3333-4333-8333-333333333333'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'Troca',sistema:'dnd5e-srd',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); const cod=r.d.convite.codigo
await call(J,'POST','convites/'+cod,{}); await call(X,'POST','convites/'+cod,{})
r=await call(M,'GET','campanhas/'+cid); for (const s of r.d.solicitacoes) await call(M,'POST',`campanhas/${cid}/solicitacoes/${s.id}`,{decisao:'aceitar'})
const nova=async(tipo,dono,nome)=>(await call(M,'POST',`campanhas/${cid}/fichas`,{tipo,jogadorId:dono,sistema:'dnd5e-srd',nome})).d.ficha.id
const fL=await nova('jogador',J,'Lyra'), fB=await nova('jogador',X,'Borin'), fG=await nova('npc',null,'Goblin')
const ler=async id=>(await call(M,'GET','fichas/'+id)).d.ficha
let f=await ler(fL)
r=await call(M,'PUT','fichas/'+fL,{versao:f.versao,dados:{...f.dados,itens:[{id:'arco',nome:'Arco',categoria:'arma',peso:1,dano:'1d8',bonus:[]},{id:'pc',nome:'Poção de cura',categoria:'consumivel',peso:0.5,bonus:[]}],uso:{itens:{arco:{qtd:1,equipado:true},pc:{qtd:3,equipado:false}},poderes:{},carteira:''}}})
check('Lyra começa com arco e 3 poções', r.s===200, r)
await call(M,'POST','mesa/'+cid,{acao:'sessao',aberta:true})

r=await call(J,'GET',`campanhas/${cid}/itens`); const ds=r.d.destinos??[]
check('jogador vê os personagens dos jogadores (sem NPC)', r.s===200 && ds.some(x=>x.id===fB && x.jogador==='Nix') && !ds.some(x=>x.npc), ds)
r=await call(M,'GET',`campanhas/${cid}/itens`); check('mestre vê também os NPCs', r.d.destinos?.some(x=>x.id===fG && x.npc), r.d)
r=await call(X,'POST',`campanhas/${cid}/itens`,{de:fL,para:fB,item:'arco',qtd:1}); check('ninguém passa item da ficha dos outros', r.s===403, r)
r=await call(J,'POST',`campanhas/${cid}/itens`,{de:fL,para:fG,item:'arco',qtd:1}); check('jogador não passa item para NPC', r.s===403, r)
r=await call(J,'POST',`campanhas/${cid}/itens`,{de:fL,para:fB,item:'pc',qtd:5}); check('não passa mais do que tem', r.s===400, r)
r=await call(J,'POST',`campanhas/${cid}/itens`,{de:fL,para:fB,item:'pc',qtd:2})
check('Lyra passa 2 poções para Borin', r.s===200 && r.d.qtd===2 && r.d.de?.dados?.uso?.itens?.pc?.qtd===1, r)
let fb=await ler(fB); const pcB=fb.dados.itens.find(i=>i.nome==='Poção de cura')
check('Borin recebe as 2 poções', pcB && fb.dados.uso.itens[pcB.id].qtd===2, fb.dados)
r=await call(J,'POST',`campanhas/${cid}/itens`,{de:fL,para:fB,item:'pc',qtd:1}); fb=await ler(fB)
check('a última poção empilha em Borin (3) e some de Lyra', r.s===200 && fb.dados.itens.filter(i=>i.nome==='Poção de cura').length===1 && fb.dados.uso.itens[pcB.id].qtd===3 && !(await ler(fL)).dados.itens.some(i=>i.id==='pc'), fb.dados)
r=await call(J,'POST',`campanhas/${cid}/itens`,{de:fL,para:fB,item:'arco',qtd:1}); fb=await ler(fB)
check('o arco vai desequipado', r.s===200 && fb.dados.uso.itens[fb.dados.itens.find(i=>i.nome==='Arco').id].equipado===false, fb.dados)
r=await call(M,'POST',`campanhas/${cid}/itens`,{de:fB,para:fG,item:pcB.id,qtd:1}); check('mestre passa item de jogador para NPC', r.s===200, r)
r=await call(M,'GET','mesa/'+cid); const ev=(r.d.eventos??[]).filter(e=>e.tipo==='sistema').map(e=>e.texto)
check('chat conta a troca', ev.some(t=>t==='🎁 Lyra passou 2× Poção de cura para Borin.'), ev)
r=await call(J,'GET','mesa/'+cid); check('troca com NPC fica só para o mestre', !(r.d.eventos??[]).some(e=>/Goblin/.test(e.texto??'')), r.d.eventos?.map(e=>e.texto))
r=await call(X,'GET','notificacoes'); check('quem recebe ganha um aviso', JSON.stringify(r.d).includes('Borin recebeu'), r.d)
r=await call(M,'POST',`campanhas/${cid}/fichas/${fB}`,{areasBloqueadas:['equipamentos']}); check('mestre trava o inventário de Borin', r.s===200, r)
r=await call(X,'POST',`campanhas/${cid}/itens`,{de:fB,para:fL,item:fb.dados.itens.find(i=>i.nome==='Arco').id,qtd:1}); check('inventário travado pelo mestre não passa item', r.s===423, r)
r=await call(M,'GET',`fichas/${fL}/historico`); check('histórico da ficha registra', r.s===200 && JSON.stringify(r.d).includes('Passou 2× Poção de cura para Borin'), r.d)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
