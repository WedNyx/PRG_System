// v0.28.0: mundo da campanha (mapa, páginas, relações; “só o mestre” escondido dos jogadores). Precisa da migração 021. Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222', X='33333333-3333-4333-8333-333333333333'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'Mundo',sistema:'dnd5e-srd',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(J,'POST','convites/'+r.d.convite.codigo,{})
r=await call(M,'GET','campanhas/'+cid); await call(M,'POST',`campanhas/${cid}/solicitacoes/${r.d.solicitacoes[0].id}`,{decisao:'aceitar'})
r=await call(M,'GET',`campanhas/${cid}/mundo`); check('mundo começa vazio, mestre edita', r.s===200 && r.d.admin && r.d.mundo.paginas.length===0 && r.d.mundo.versao===0, r.d)
const mundo={ mapa:'https://fora.com/mapa.jpg', paginas:[
  {id:'valmor',nome:'Castelo de Valmor',tipo:'lugar',icone:'🏰',texto:'Sede do rei.',mapa:{x:30,y:40}},
  {id:'vex',nome:'Vex',tipo:'npc',icone:'🐍',oculto:true,teia:{x:700,y:300}},
  {id:'rei',nome:'Rei Aldric',tipo:'npc',icone:'👑'}],
  relacoes:[{id:'r1',de:'vex',para:'rei',tipo:'inimigo',rotulo:'quer o trono'},{id:'r2',de:'rei',para:'valmor',tipo:'serve'},{id:'r3',de:'rei',para:'valmor',tipo:'aliado',oculto:true}] }
r=await call(J,'PUT',`campanhas/${cid}/mundo`,{mundo,versao:0}); check('jogador não muda o mundo', r.s===403, r)
r=await call(M,'PUT',`campanhas/${cid}/mundo`,{mundo,versao:0}); check('mestre salva o mundo (versão 1)', r.s===200 && r.d.mundo.versao===1, r)
check('mapa de fora não entra', !r.d.mundo.mapa, r.d.mundo.mapa)
r=await call(M,'PUT',`campanhas/${cid}/mundo`,{mundo,versao:0}); check('versão velha é recusada (409)', r.s===409, r)
r=await call(M,'GET',`campanhas/${cid}/mundo`); check('mestre vê tudo', r.d.mundo.paginas.length===3 && r.d.mundo.relacoes.length===3, r.d.mundo)
r=await call(J,'GET',`campanhas/${cid}/mundo`); const mj=r.d.mundo
check('jogador não vê página nem relações “só o mestre”', !r.d.admin && mj.paginas.map(p=>p.id).join()==='valmor,rei' && mj.relacoes.map(x=>x.id).join()==='r2', mj)
r=await call(J,'GET',`campanhas/${cid}`); check('dados da campanha não vazam o mundo', r.s===200 && !('mundo' in (r.d.campanha??{})) && !JSON.stringify(r.d).includes('Vex'), Object.keys(r.d.campanha??{}))
r=await call(X,'GET',`campanhas/${cid}/mundo`); check('quem não é da campanha não vê', r.s===404, r)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
