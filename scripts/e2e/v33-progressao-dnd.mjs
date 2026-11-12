// v0.33.6 (PR #42): modo de progressão da campanha (D&D 2024) e escolhas de subclasse validadas no servidor. Migração 027.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222', X='33333333-3333-4333-8333-333333333333'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
// Campanha "antiga": criada sem o modo → padrão Híbrido
let r=await call(M,'POST','campanhas',{nome:'Mesa antiga',sistema:'dnd5e-srd',modeloPadrao:'C'}); const antiga=r.d.campanha.id
check('campanha sem modo nasce Híbrida', r.d.campanha?.config_progressao?.modo==='hibrido', r.d)
r=await call(M,'POST','campanhas',{nome:'Mesa nova',sistema:'dnd5e-srd',modeloPadrao:'C',configProgressao:{modo:'automatico'}}); const cid=r.d.campanha.id
check('mestre cria com modo Automático', r.d.campanha?.config_progressao?.modo==='automatico', r.d)
r=await call(M,'POST','campanhas',{nome:'Mesa errada',sistema:'dnd5e-srd',modeloPadrao:'C',configProgressao:{modo:'turbo'}})
check('modo inválido é recusado', r.s===400, r)
for (const quem of [J, X]) { r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(quem,'POST','convites/'+r.d.convite.codigo,{}) }
r=await call(M,'GET','campanhas/'+cid); for (const s of r.d.solicitacoes) await call(M,'POST',`campanhas/${cid}/solicitacoes/${s.id}`,{decisao:'aceitar'})
await call(M,'PATCH',`campanhas/${cid}/membros/${X}`,{papel:'espectador'})
r=await call(J,'PATCH','campanhas/'+cid,{configProgressao:{modo:'manual'}}); check('jogador não muda o modo', r.s===403, r)
r=await call(X,'PATCH','campanhas/'+cid,{configProgressao:{modo:'manual'}}); check('espectador não muda o modo', r.s===403, r)
// fichas
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'dnd5e-srd',nome:'Lyra'}); const fL=r.d.ficha.id
r=await call(M,'PATCH','campanhas/'+cid,{configProgressao:{modo:'hibrido',excecoesPorFicha:{[fL]:'manual'}}}); check('mestre troca o modo e cria exceção para uma ficha', r.s===200 && r.d.campanha.config_progressao.excecoesPorFicha?.[fL]==='manual', r.d)
r=await call(M,'PATCH','campanhas/'+cid,{configProgressao:{modo:'automatico'}}); check('trocar o modo não apaga a exceção', r.d.campanha?.config_progressao?.modo==='automatico' && r.d.campanha.config_progressao.excecoesPorFicha?.[fL]==='manual', r.d)
r=await call(M,'GET','campanhas'); check('lista traz o modo das campanhas (antiga e nova)', r.d.campanhas.find(c=>c.id===antiga)?.config_progressao?.modo==='hibrido' && r.d.campanhas.find(c=>c.id===cid)?.config_progressao?.modo==='automatico', r.d.campanhas.map(c=>c.config_progressao))
r=await call(J,'GET','fichas/'+fL); check('a ficha do jogador recebe o modo da campanha', r.d.configProgressao?.modo==='automatico', r.d.configProgressao)
// escolhas de subclasse
const salvar=async(quem, mudar)=>{ const g=await call(M,'GET','fichas/'+fL); const d=g.d.ficha.dados; return call(quem,'PUT','fichas/'+fL,{versao:g.d.ficha.versao,dados:mudar(d)}) }
r=await salvar(M,d=>({...d,campos:{...d.campos,classe:'Guerreiro',nivel:1}})); check('mestre define Guerreiro nível 1', r.s===200, r)
r=await salvar(M,d=>({...d,dndEscolhas:{'guerreiro-subclasse':'campeao'}})); check('subclasse antes do nível 3 é recusada', r.s===400 && /nível 3/.test(r.d.erro), r)
r=await salvar(M,d=>({...d,campos:{...d.campos,nivel:3},dndEscolhas:{'guerreiro-subclasse':'mago-inventado'}})); check('opção que não existe é recusada', r.s===400, r)
r=await salvar(M,d=>({...d,campos:{...d.campos,nivel:3},dndEscolhas:{'mago-subclasse':'evocador'}})); check('subclasse de outra classe é recusada', r.s===400, r)
r=await salvar(M,d=>({...d,campos:{...d.campos,nivel:3},dndEscolhas:{'guerreiro-subclasse':'campeao'}})); check('no nível 3 o mestre escolhe Campeão', r.s===200, r)
r=await call(M,'GET','fichas/'+fL); check('a escolha fica salva na ficha', r.d.ficha.dados.dndEscolhas?.['guerreiro-subclasse']==='campeao', r.d.ficha.dados.dndEscolhas)
r=await salvar(M,d=>({...d,recursos:{...d.recursos,pv:{atual:9,max:9}}})); check('mexer em outra parte não estraga a escolha', r.s===200, r)
r=await call(M,'GET','fichas/'+fL); check('escolha continua depois de outra edição', r.d.ficha.dados.dndEscolhas?.['guerreiro-subclasse']==='campeao', r.d.ficha.dados)
r=await salvar(X,d=>({...d,dndEscolhas:{}})); check('espectador não edita a ficha', r.s===403 || r.s===404, r)
r=await salvar(J,d=>({...d,dndEscolhas:{'guerreiro-subclasse':'inventada'}})); check('jogador também não grava opção inválida', r.s===400, r)
r=await salvar(J,d=>({...d,campos:{...d.campos,nivel:2},dndEscolhas:{'guerreiro-subclasse':'campeao'}}))
r=await call(M,'GET','fichas/'+fL); check('o nível pedido pelo jogador não libera nada sem o mestre', r.d.ficha.dados.dndEscolhas?.['guerreiro-subclasse']==='campeao', r.d.ficha.dados)
await call(M,'PATCH',`campanhas/${cid}/membros/${X}`,{papel:'comestre'})
r=await call(X,'PATCH','campanhas/'+cid,{configProgressao:{modo:'manual'}}); check('co-mestre muda o modo', r.s===200 && r.d.campanha?.config_progressao?.modo==='manual', r)
// ficha avulsa de D&D: sem campanha → Híbrido
r=await call(J,'POST','fichas',{sistema:'dnd5e-srd',dados:{nome:'Avulsa'}}); const fa=r.d.ficha?.id
r=await call(J,'GET','fichas/'+fa); check('ficha avulsa usa o padrão Híbrido', r.d.configProgressao?.modo==='hibrido', r.d)
console.log(falhas?`\n${falhas} falha(s)`:'\nTudo certo!'); process.exit(falhas?1:0)
