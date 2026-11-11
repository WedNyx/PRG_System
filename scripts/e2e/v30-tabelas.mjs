// v0.30.0: tabelas do mestre (prontas + da campanha), roladas no servidor e postadas no chat. Precisa da migração 022. Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222', X='33333333-3333-4333-8333-333333333333'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'Tabelas',sistema:'dnd5e-srd',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(J,'POST','convites/'+r.d.convite.codigo,{})
r=await call(M,'GET','campanhas/'+cid); await call(M,'POST',`campanhas/${cid}/solicitacoes/${r.d.solicitacoes[0].id}`,{decisao:'aceitar'})
const mesa=(quem,b)=>call(quem,'POST','mesa/'+cid,b)
await mesa(M,{acao:'sessao',aberta:true})

r=await call(M,'GET',`mesa/${cid}?tabelas=1`); check('mestre vê as prontas e nenhuma da campanha', r.s===200 && r.d.prontas.length>=10 && r.d.tabelas.length===0, r.d)
r=await call(J,'GET',`mesa/${cid}?tabelas=1`); check('jogador não abre as tabelas', r.s===403, r)
r=await call(X,'GET',`mesa/${cid}?tabelas=1`); check('quem não é da campanha não abre', r.s>=400, r)

const tabelas=[
  {id:'anoes',nome:'  Nomes de anões ',icone:'🐉',linhas:['Borin',' ','Dagna  ','']},
  {id:'saque',nome:'Saque',icone:'💀',linhas:['{2d2+10} moedas e [[anoes]]']},
  {id:'NOMES',nome:'id ruim',icone:'🎲',linhas:['x']},
  {id:'nomes',nome:'copia da pronta',icone:'🎲',linhas:['x']},
  {id:'vazia',nome:'Vazia',icone:'🎲',linhas:['  ']},
  {id:'anoes',nome:'Repetida',icone:'🎲',linhas:['x']}]
r=await mesa(J,{acao:'tabelas_salvar',tabelas}); check('jogador não salva tabelas', r.s===403, r)
r=await mesa(M,{acao:'tabelas_salvar',tabelas}); const t=r.d.tabelas??[]
check('mestre salva; inválidas, repetidas e vazias saem', r.s===200 && t.map(x=>x.id).join()==='anoes,saque', t)
check('linhas e nome limpos, ícone fora da lista vira 🎲', t[0]?.nome==='Nomes de anões' && t[0]?.linhas.join()==='Borin,Dagna' && t[0]?.icone==='🐉' && t[1]?.icone==='🎲', t)
r=await call(M,'GET',`mesa/${cid}?tabelas=1`); check('tabelas ficam salvas', r.d.tabelas?.length===2, r.d)

r=await mesa(J,{acao:'tabela_rolar',id:'nomes'}); check('jogador não rola tabela', r.s===403, r)
r=await mesa(M,{acao:'tabela_rolar',id:'nao-existe'}); check('tabela inexistente dá 404', r.s===404, r)
r=await mesa(M,{acao:'tabela_rolar',id:'saque',visibilidade:'publica'})
check('rolagem resolve dados e puxa outra tabela', r.s===200 && /^1[1-4] moedas e (Borin|Dagna)$/.test(r.d.resultado), r.d)
r=await mesa(M,{acao:'tabela_rolar',id:'npc-completo',visibilidade:'mestre'})
const segredo=r.d.resultado; check('gerador pronto combina tabelas', r.s===200 && /Segredo: /.test(segredo) && !/\[\[/.test(segredo), r.d)

r=await call(M,'GET','mesa/'+cid); const evM=(r.d.eventos??[]).filter(e=>e.tipo==='sistema')
check('mestre vê as duas rolagens no chat', evM.some(e=>/^🎲 Saque: /.test(e.texto)) && evM.some(e=>e.texto.includes(segredo) && e.visibilidade==='mestre'), evM.map(e=>e.texto))
r=await call(J,'GET','mesa/'+cid); const evJ=(r.d.eventos??[]).filter(e=>e.tipo==='sistema')
check('jogador vê a pública e não a secreta', evJ.some(e=>/^🎲 Saque: /.test(e.texto)) && !evJ.some(e=>e.texto.includes('NPC completo')), evJ.map(e=>e.texto))
r=await call(J,'GET','campanhas/'+cid); check('dados da campanha não vazam as tabelas', r.s===200 && !JSON.stringify(r.d).includes('Borin'), Object.keys(r.d.campanha??{}))
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
