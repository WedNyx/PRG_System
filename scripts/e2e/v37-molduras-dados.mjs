// v0.37.1/v0.37.2: molduras de perfil (especiais: Coroa com 15 min mestrando, Criador com sistema criado) e estilo de dados.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body, raiz='/api/prg/'){ const r=await fetch(BASE+raiz+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{} return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
const visual=(quem,v)=>call(quem,'PATCH',quem,{visual:v},'/api/aventureiros/')
const REST=process.env.PRG_REST || 'http://localhost:3001/rest/v1', H={'content-type':'application/json',apikey:process.env.KEY,Authorization:'Bearer '+process.env.KEY}
const banco=(caminho,metodo,body)=>fetch(REST+'/'+caminho,{method:metodo,headers:H,body:body&&JSON.stringify(body)})
await banco(`prg_public_adventurers?id=in.(${M},${J})`,'PATCH',{minutos_mestrados:0})

let r=await visual(J,{moldura:'chamas',dado:'ouro'}); check('jogador escolhe moldura e dados', r.s===200 && r.d.perfil.visual?.moldura==='chamas' && r.d.perfil.visual?.dado==='ouro', r)
r=await visual(J,{moldura:'inventada',dado:'??'}); check('ids desconhecidos são descartados', r.s===200 && !r.d.perfil.visual, r)
r=await visual(M,{moldura:'mestre'}); check('Coroa do Mestre sem campanha: não pode', r.s===403 && /mestra/.test(r.d.erro), r)
r=await visual(J,{moldura:'leste'}); check('moldura especial fora da lista: não pode', r.s===403 && /especial/.test(r.d.erro), r)
r=await call(M,'POST','campanhas',{nome:'Mesa das Molduras',sistema:'tormenta20',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await visual(M,{moldura:'mestre'}); check('só criar campanha não libera a Coroa (precisa mestrar 15 min)', r.s===403 && /15 minutos/.test(r.d.erro), r)
await call(M,'POST','mesa/'+cid,{acao:'sessao',aberta:true})
await banco(`prg_campanhas?id=eq.${cid}`,'PATCH',{sessao_aberta_em:new Date(Date.now()-10*60000).toISOString()})
await call(M,'POST','mesa/'+cid,{acao:'sessao',aberta:false})
r=await call(M,'GET','conquistas'); check('sessão de 10 min conta, mas ainda não libera', r.d.minutos===10 && r.d.mestre===false, r.d)
await call(M,'POST','mesa/'+cid,{acao:'sessao',aberta:true})
await banco(`prg_campanhas?id=eq.${cid}`,'PATCH',{sessao_aberta_em:new Date(Date.now()-6*60000).toISOString()})
await call(M,'POST','mesa/'+cid,{acao:'sessao',aberta:false})
r=await call(M,'GET','conquistas'); check('somando as sessões (16 min), a Coroa libera', r.d.minutos===16 && r.d.mestre===true, r.d)
r=await visual(M,{moldura:'mestre',dado:'neon'}); check('com 15 min mestrando, a Coroa libera', r.s===200 && r.d.perfil.visual?.moldura==='mestre', r)
r=await visual(J,{moldura:'criador'}); check('Criador de Mundos sem sistema: não pode', r.s===403 && /sistema/.test(r.d.erro), r)
const def={ nome:'Mundo do Jogador', resumo:'Teste', dados:'d20', rolagem:'d20', campos:[], atributos:[{id:'COR',nome:'Corpo',min:0,max:5,padrao:2}], derivados:[], pericias:{modo:'treino',total:'MOD + TREINO',treinos:[{id:'nada',nome:'Nada',formula:'0'}],lista:[]}, recursos:[], listas:[] }
r=await call(J,'POST','sistemas',{acao:'criar',definicao:def}); check('jogador cria um sistema', r.s===201, r)
r=await visual(J,{moldura:'criador'}); check('criando um sistema, o Criador de Mundos libera', r.s===200 && r.d.perfil.visual?.moldura==='criador', r)
await visual(J,{moldura:'pirata',dado:'sangue'})
r=await call(M,'POST',`campanhas/${cid}/convites`,{usuario:'jogador_sol'}); await call(J,'POST','convites/'+r.d.convite.codigo,{})
r=await call(M,'GET','campanhas/'+cid); const mj=r.d.membros.find(m=>m.aventureiro_id===J)
check('na campanha aparece a moldura do jogador (e só ela do visual)', mj?.aventureiro?.moldura==='pirata' && !('visual' in mj.aventureiro), mj)
r=await call(M,'GET','mesa/'+cid); const ms=r.d.membros||[]
check('na mesa vêm a moldura e os dados de cada um', ms.find(m=>m.aventureiro_id===J)?.aventureiro?.dado==='sangue' && ms.find(m=>m.aventureiro_id===M)?.aventureiro?.dado==='neon', r.s===200 ? ms : r)
r=await call(M,'GET','',undefined,'/api/aventureiros'); check('no portal a moldura vem no visual', r.d.perfis.find(p=>p.id===J)?.visual?.moldura==='pirata', r.d.perfis?.find(p=>p.id===J))
await visual(J,null); await visual(M,null); await banco(`prg_public_adventurers?id=in.(${M},${J})`,'PATCH',{minutos_mestrados:0})
console.log(falhas ? `\n${falhas} falha(s)` : '\nTudo certo.'); process.exit(falhas ? 1 : 0)
