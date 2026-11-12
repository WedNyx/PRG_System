// v0.33.6: magias de D&D 2024 (SRD 5.2.1) na ficha — limites da classe conferidos no servidor, extras e permissões.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
// ficha avulsa (dono = jogador)
let r=await call(J,'POST','fichas',{sistema:'dnd5e-srd',dados:{nome:'Elara'}}); const f=r.d.ficha?.id
const salvar=async(quem, mudar)=>{ const g=await call(quem,'GET','fichas/'+f); const d=g.d.ficha.dados; return call(quem,'PUT','fichas/'+f,{versao:g.d.ficha.versao,dados:mudar(d)}) }
r=await salvar(J,d=>({...d,campos:{...d.campos,classe:'Mago',nivel:3}})); check('Mago nível 3', r.s===200, r)
r=await salvar(J,d=>({...d,dndMagias:{'fire-bolt':'preparada','magic-missile':'preparada','misty-step':'preparada'}})); check('truque, 1º e 2º nível da lista do Mago entram', r.s===200, r)
r=await call(J,'GET','fichas/'+f); check('magias ficam salvas', r.d.ficha.dados.dndMagias?.['misty-step']==='preparada', r.d.ficha.dados.dndMagias)
r=await salvar(J,d=>({...d,dndMagias:{...d.dndMagias,fireball:'preparada'}})); check('Bola de Fogo no nível 3 é recusada (sem espaço de 3º)', r.s===400 && /3º/.test(r.d.erro), r)
r=await salvar(J,d=>({...d,dndMagias:{...d.dndMagias,'cure-wounds':'preparada'}})); check('magia fora da lista do Mago é recusada', r.s===400 && /lista/.test(r.d.erro), r)
r=await salvar(J,d=>({...d,dndMagias:{...d.dndMagias,'cure-wounds':'extra'}})); check('a mesma magia como extra (talento/item) entra', r.s===200, r)
r=await salvar(J,d=>({...d,dndMagias:{...d.dndMagias,'inventada':'preparada'}})); check('magia que não existe é recusada', r.s===400, r)
const sete=['shield','sleep','mage-armor','detect-magic','burning-hands','thunderwave'].reduce((o,id)=>({...o,[id]:'preparada'}),{})
r=await salvar(J,d=>({...d,dndMagias:{...d.dndMagias,...sete}})); check('passar do limite de preparadas (6 no nível 3) é recusado', r.s===400 && /Limite/.test(r.d.erro), r)
r=await salvar(J,d=>({...d,campos:{...d.campos,nivel:1}})); check('baixar o nível não apaga magias antigas', r.s===200, r)
r=await call(J,'GET','fichas/'+f); check('Passo Nebuloso continua depois de baixar o nível', r.d.ficha.dados.dndMagias?.['misty-step']==='preparada', r.d.ficha.dados.dndMagias)
r=await salvar(J,d=>({...d,dndMagias:'lixo'})); check('formato inválido é recusado', r.s===400, r)
// campanha: o mestre edita a ficha do jogador
r=await call(M,'POST','campanhas',{nome:'Mesa das magias',sistema:'dnd5e-srd',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(J,'POST','convites/'+r.d.convite.codigo,{})
r=await call(M,'GET','campanhas/'+cid); for (const s of r.d.solicitacoes) await call(M,'POST',`campanhas/${cid}/solicitacoes/${s.id}`,{decisao:'aceitar'})
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'dnd5e-srd',nome:'Brann'}); const fc=r.d.ficha?.id
const g=await call(M,'GET','fichas/'+fc)
r=await call(M,'PUT','fichas/'+fc,{versao:g.d.ficha.versao,dados:{...g.d.ficha.dados,campos:{...g.d.ficha.dados.campos,classe:'Bruxo',nivel:11},dndMagias:{'eldritch-blast':'preparada','circle-of-death':'preparada'}}})
check('mestre dá Rajada Mística e Arcana Mística de 6º ao Bruxo 11', r.s===200, r)
const g2=await call(M,'GET','fichas/'+fc)
r=await call(M,'PUT','fichas/'+fc,{versao:g2.d.ficha.versao,dados:{...g2.d.ficha.dados,dndMagias:{...g2.d.ficha.dados.dndMagias,'eyebite':'preparada'}}})
check('segunda Arcana Mística de 6º é recusada', r.s===400 && /Arcana/.test(r.d.erro), r)
console.log(falhas?`\n${falhas} falha(s)`:'\nTudo certo!'); process.exit(falhas?1:0)
