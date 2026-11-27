// v0.37.1: molduras de perfil (com as especiais travadas) e estilo de dados, vistos pelos outros na campanha e na mesa.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body, raiz='/api/prg/'){ const r=await fetch(BASE+raiz+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{} return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
const visual=(quem,v)=>call(quem,'PATCH',quem,{visual:v},'/api/aventureiros/')

let r=await visual(J,{moldura:'chamas',dado:'ouro'}); check('jogador escolhe moldura e dados', r.s===200 && r.d.perfil.visual?.moldura==='chamas' && r.d.perfil.visual?.dado==='ouro', r)
r=await visual(J,{moldura:'inventada',dado:'??'}); check('ids desconhecidos são descartados', r.s===200 && !r.d.perfil.visual, r)
r=await visual(M,{moldura:'mestre'}); check('Coroa do Mestre sem campanha: não pode', r.s===403 && /mestra/.test(r.d.erro), r)
r=await visual(J,{moldura:'leste'}); check('moldura especial fora da lista: não pode', r.s===403 && /especial/.test(r.d.erro), r)
r=await call(M,'POST','campanhas',{nome:'Mesa das Molduras',sistema:'tormenta20',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await visual(M,{moldura:'mestre',dado:'neon'}); check('mestrando uma campanha, a Coroa libera', r.s===200 && r.d.perfil.visual?.moldura==='mestre', r)
await visual(J,{moldura:'pirata',dado:'sangue'})
r=await call(M,'POST',`campanhas/${cid}/convites`,{usuario:'jogador_sol'}); await call(J,'POST','convites/'+r.d.convite.codigo,{})
r=await call(M,'GET','campanhas/'+cid); const mj=r.d.membros.find(m=>m.aventureiro_id===J)
check('na campanha aparece a moldura do jogador (e só ela do visual)', mj?.aventureiro?.moldura==='pirata' && !('visual' in mj.aventureiro), mj)
r=await call(M,'GET','mesa/'+cid); const ms=r.d.membros||[]
check('na mesa vêm a moldura e os dados de cada um', ms.find(m=>m.aventureiro_id===J)?.aventureiro?.dado==='sangue' && ms.find(m=>m.aventureiro_id===M)?.aventureiro?.dado==='neon', r.s===200 ? ms : r)
r=await call(M,'GET','',undefined,'/api/aventureiros'); check('no portal a moldura vem no visual', r.d.perfis.find(p=>p.id===J)?.visual?.moldura==='pirata', r.d.perfis?.find(p=>p.id===J))
await visual(J,null); await visual(M,null)
console.log(falhas ? `\n${falhas} falha(s)` : '\nTudo certo.'); process.exit(falhas ? 1 : 0)
