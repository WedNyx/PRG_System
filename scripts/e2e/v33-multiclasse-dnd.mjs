// v0.33.6: multiclasse de D&D 2024 — requisitos, nível da classe inicial, mestre libera, magias por classe e permissão de nível.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
// ficha avulsa do jogador
let r=await call(J,'POST','fichas',{sistema:'dnd5e-srd',dados:{nome:'Kael'}}); const f=r.d.ficha?.id
const salvar=async(quem, id, mudar)=>{ const g=await call(quem,'GET','fichas/'+id); const d=g.d.ficha.dados; return call(quem,'PUT','fichas/'+id,{versao:g.d.ficha.versao,dados:mudar(d)}) }
r=await salvar(J,f,d=>({...d,campos:{...d.campos,classe:'Guerreiro',nivel:4},atributos:{...d.atributos,FOR:15,INT:10}})); check('Guerreiro 4', r.s===200, r)
r=await salvar(J,f,d=>({...d,campos:{...d.campos,nivel:5},dndMulticlasse:{mago:1}})); check('sem Inteligência 13 não entra em Mago', r.s===400 && /Inteligência 13/.test(r.d.erro), r)
r=await salvar(J,f,d=>({...d,atributos:{...d.atributos,INT:14}})); check('sobe a Inteligência para 14', r.s===200, r)
r=await salvar(J,f,d=>({...d,campos:{...d.campos,nivel:5},dndMulticlasse:{mago:1}})); check('com 13+ entra em Mago (Guerreiro 4 / Mago 1)', r.s===200, r)
r=await call(J,'GET','fichas/'+f); check('multiclasse fica salva', r.d.ficha.dados.dndMulticlasse?.mago===1 && r.d.ficha.dados.campos.nivel===5, r.d.ficha.dados.dndMulticlasse)
r=await salvar(J,f,d=>({...d,dndMulticlasse:{mago:5}})); check('a classe inicial não pode ficar sem nível', r.s===400 && /pelo menos 1 nível/.test(r.d.erro), r)
r=await salvar(J,f,d=>({...d,dndMulticlasse:{mago:1,necromante:1}})); check('classe que não existe é recusada', r.s===400, r)
r=await salvar(J,f,d=>({...d,dndMagias:{'fire-bolt':'preparada-mago','magic-missile':'preparada-mago'}})); check('Mago 1 prepara Raio de Fogo e Mísseis Mágicos pela classe Mago', r.s===200, r)
r=await salvar(J,f,d=>({...d,dndMagias:{...d.dndMagias,'misty-step':'preparada-mago'}})); check('Passo Nebuloso (2º) recusado para Mago 1 mesmo com nível total 5', r.s===400 && /2º/.test(r.d.erro), r)
r=await salvar(J,f,d=>({...d,dndMagias:{...d.dndMagias,'cure-wounds':'preparada-clerigo'}})); check('preparar por classe que não está na ficha é recusado', r.s===400, r)
r=await salvar(J,f,d=>({...d,dndEscolhas:{...d.dndEscolhas,'mago-subclasse':'evocador'}})); check('subclasse de Mago no Mago 1 é recusada', r.s===400 && /nível 3/.test(r.d.erro), r)
r=await salvar(J,f,d=>({...d,dndEscolhas:{...d.dndEscolhas,'guerreiro-subclasse':'campeao'}})); check('subclasse de Guerreiro no Guerreiro 4 entra', r.s===200, r)
r=await salvar(J,f,d=>({...d,campos:{...d.campos,nivel:6},dndMulticlasse:{mago:2}})); check('sobe Mago para 2 (já está na classe: não pede requisito de novo)', r.s===200, r)
// campanha: o mestre libera sem requisitos; nível do jogador continua pedindo aprovação
r=await call(M,'POST','campanhas',{nome:'Mesa multiclasse',sistema:'dnd5e-srd',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(J,'POST','convites/'+r.d.convite.codigo,{})
r=await call(M,'GET','campanhas/'+cid); for (const s of r.d.solicitacoes) await call(M,'POST',`campanhas/${cid}/solicitacoes/${s.id}`,{decisao:'aceitar'})
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'dnd5e-srd',nome:'Brann'}); const fc=r.d.ficha?.id
{ const g=await call(M,'GET','fichas/'+fc); await call(M,'PUT','fichas/'+fc,{versao:g.d.ficha.versao,dados:{...g.d.ficha.dados,criacaoLivre:false}}) } // v0.33.7: mestre encerra a criação livre; daqui em diante valem as regras da campanha
r=await salvar(M,fc,d=>({...d,campos:{...d.campos,classe:'Bárbaro',nivel:3},atributos:{...d.atributos,FOR:16,CAR:8}})); check('mestre faz Bárbaro 3', r.s===200, r)
r=await salvar(M,fc,d=>({...d,campos:{...d.campos,nivel:4},dndMulticlasse:{bruxo:1}})); check('mestre libera Bruxo sem Carisma 13', r.s===200, r)
r=await salvar(J,fc,d=>({...d,campos:{...d.campos,nivel:5},dndMulticlasse:{bruxo:2}}))
r=await call(M,'GET','fichas/'+fc); check('nível pedido pelo jogador não entra sem o mestre', r.d.ficha.dados.dndMulticlasse?.bruxo===1 && r.d.ficha.dados.campos.nivel===4, r.d.ficha.dados)
console.log(falhas?`\n${falhas} falha(s)`:'\nTudo certo!'); process.exit(falhas?1:0)
