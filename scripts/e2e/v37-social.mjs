// v0.37.0: @usuario, convite pelo @, desvincular personagem, fichas voltam ao sair e feedback.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222', C='33333333-3333-4333-8333-333333333333'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body, raiz='/api/prg/'){ const r=await fetch(BASE+raiz+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{} return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }

// @usuario
let r=await call(M,'GET','',undefined,'/api/aventureiros'); const eu=r.d.perfis.find(p=>p.id===M)
check('todo perfil tem um @', r.d.perfis.every(p=>/^[a-z0-9_.]{3,20}$/.test(p.usuario)) && eu.usuario==='mestra_lua', r.d.perfis.map(p=>p.usuario))
r=await call(J,'PATCH',J,{usuario:'@Jogador.Sol'},'/api/aventureiros/'); check('trocar o próprio @ (vira minúsculo, sem o @)', r.s===200 && r.d.perfil.usuario==='jogador.sol', r)
r=await call(M,'PATCH',M,{usuario:'jogador.sol'},'/api/aventureiros/'); check('@ de outra pessoa não pode', r.s===409 && /outra pessoa/.test(r.d.erro), r)
r=await call(M,'PATCH',M,{usuario:'com espaço'},'/api/aventureiros/'); check('@ inválido não pode', r.s===400, r)
r=await call(M,'PATCH',J,{usuario:'hackeado'},'/api/aventureiros/'); check('não dá para mudar o @ dos outros', r.s===403, r)
r=await call(M,'GET','usuarios?busca=jog'); check('busca pelo @ acha o jogador', r.d.perfis?.some(p=>p.id===J) && !r.d.perfis.some(p=>p.id===M), r.d)
r=await call(M,'GET','usuarios?busca=Jogador%20S'); check('busca pelo nome também', r.d.perfis?.some(p=>p.id===J), r.d)
r=await call(M,'GET','usuarios?busca=x'); check('busca curta não devolve nada', r.d.perfis?.length===0, r.d)

// Convite pelo @
r=await call(M,'POST','campanhas',{nome:'Mesa do Arroba',sistema:'tormenta20',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{usuario:'@ninguem_aqui'}); check('@ que não existe', r.s===404, r)
r=await call(M,'POST',`campanhas/${cid}/convites`,{usuario:'mestra_lua'}); check('não convida a si mesmo', r.s===400, r)
r=await call(J,'POST',`campanhas/${cid}/convites`,{usuario:'nix'}); check('só o mestre convida', r.s===403, r)
r=await call(M,'POST',`campanhas/${cid}/convites`,{usuario:'@Jogador.Sol'}); check('mestre convida pelo @', r.s===201 && r.d.convite.max_usos===1 && r.d.convite.para.usuario==='jogador.sol', r)
const cod=r.d.convite.codigo
r=await call(M,'POST',`campanhas/${cid}/convites`,{usuario:'jogador.sol'}); check('não repete convite esperando resposta', r.s===409, r)
r=await call(J,'GET','notificacoes'); check('o convidado recebe o aviso com o link', JSON.stringify(r.d).includes('/convite/'+cod), r.d)
r=await call(C,'GET','convites/'+cod); check('outra pessoa não vê o convite pelo @', r.s===404, r)
r=await call(C,'POST','convites/'+cod,{}); check('nem consegue usar', r.s===404, r)
r=await call(J,'GET','convites/'+cod); check('o convidado vê o convite (direto)', r.s===200 && r.d.convite.direto===true, r)
r=await call(J,'POST','convites/'+cod,{}); check('aceitando, entra direto', r.s===201 && r.d.entrou===true, r)
r=await call(M,'GET','campanhas/'+cid); const mj=r.d.membros.find(m=>m.aventureiro_id===J)
check('vira jogador e aparece com o @', mj?.papel==='jogador' && mj.aventureiro.usuario==='jogador.sol' && r.d.solicitacoes.length===0, r.d.membros)
check('o convite aparece como aceito na lista do mestre', r.d.convites.some(v=>v.codigo===cod && v.situacao==='esgotado' && v.para?.usuario==='jogador.sol'), r.d.convites)
r=await call(M,'GET','notificacoes'); check('o mestre é avisado', JSON.stringify(r.d).includes('aceitou o convite'), r.d)
r=await call(M,'POST',`campanhas/${cid}/convites`,{usuario:'jogador.sol'}); check('quem já participa não é convidado de novo', r.s===409, r)
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); check('o convite por link continua funcionando', r.s===201 && r.d.convite.max_usos===20, r)

// Desvincular: cópia enviada e nunca mexida só some
const avulsa=(await call(J,'POST','fichas',{sistema:'tormenta20',dados:{nome:'Kael'}})).d.ficha.id
r=await call(J,'POST',`fichas/${avulsa}/enviar`,{campanhaId:cid}); const copia=r.d.ficha.id
r=await call(J,'POST',`campanhas/${cid}/fichas/${copia}`,{acao:'devolver'}); check('jogador cancela o envio', r.s===200 && r.d.resultado==='removida', r)
r=await call(J,'GET','fichas/'+copia); check('a cópia some', r.s===404, r.s)
r=await call(J,'GET','fichas/'+avulsa); check('a original continua', r.s===200 && !r.d.ficha.campanha_id, r.s)
// Desvincular ficha de campanha
const nova=async nome=>(await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'tormenta20',nome})).d.ficha.id
const f1=await nova('Lyra')
r=await call(C,'POST',`campanhas/${cid}/fichas/${f1}`,{acao:'devolver'}); check('quem não é dono nem mestre não desvincula', r.s===403, r)
r=await call(J,'POST',`campanhas/${cid}/fichas/${f1}`,{acao:'devolver'}); check('jogador desvincula a própria ficha', r.s===200 && r.d.resultado==='devolvida', r)
r=await call(J,'GET','fichas/'+f1); check('ela vira avulsa com o nome da campanha', !r.d.ficha?.campanha_id && /\(de Mesa do Arroba\)$/.test(r.d.ficha?.nome), r.d.ficha?.nome)
r=await call(M,'GET','notificacoes'); check('o mestre é avisado', JSON.stringify(r.d).includes('tirou Lyra de Mesa do Arroba'), r.d)
const npc=(await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'npc',sistema:'tormenta20',nome:'Goblin'})).d.ficha.id
r=await call(J,'POST',`campanhas/${cid}/fichas/${npc}`,{acao:'devolver'}); check('jogador não mexe em NPC', r.s===403, r)
// Sair da campanha: as fichas voltam
const f2=await nova('Borin')
r=await call(J,'DELETE',`campanhas/${cid}/membros/${J}`); check('jogador sai e a ficha volta', r.s===200 && r.d.devolvidas===1, r)
r=await call(J,'GET','fichas/'+f2); check('Borin é avulsa agora (não arquivada)', r.d.ficha?.status==='ativa' && !r.d.ficha.campanha_id, r.d.ficha)
r=await call(J,'POST',`campanhas/${cid}/convites`,{usuario:'nix'}); check('quem saiu não convida', r.s===404 || r.s===403, r)

// Feedback
r=await call(J,'POST','feedback',{tipo:'ideia',texto:'oi'}); check('feedback curto demais', r.s===400, r)
let ok3=true; for (let i=0;i<3;i++){ r=await call(J,'POST','feedback',{tipo:'ideia',texto:'Ideia número '+i,pagina:'/central'}); ok3&&=r.s===201 }
check('manda feedback (sem webhook, fica guardado)', ok3, r)
r=await call(J,'POST','feedback',{tipo:'ideia',texto:'Mais uma'}); check('limite contra flood', r.s===429, r)
r=await fetch(BASE+'/api/prg/feedback',{method:'POST',headers:{'content-type':'application/json',origin:BASE},body:'{"texto":"sem perfil"}'}); check('sem perfil não manda', r.status===401, r.status)

await call(J,'PATCH',J,{usuario:'jogador_sol'},'/api/aventureiros/')
console.log(falhas ? `\n${falhas} falha(s)` : '\nTudo certo.'); process.exit(falhas ? 1 : 0)
