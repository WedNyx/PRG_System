// v0.33.6: árvore — exceção de modo por ficha (D&D), hexágonos concedidos pelo mestre, nível mínimo e histórico guardado.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
const entrar=async cid=>{ let r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(J,'POST','convites/'+r.d.convite.codigo,{}); r=await call(M,'GET','campanhas/'+cid); for (const s of r.d.solicitacoes) await call(M,'POST',`campanhas/${cid}/solicitacoes/${s.id}`,{decisao:'aceitar'}) }
// D&D: exceção de modo para uma ficha
let r=await call(M,'POST','campanhas',{nome:'Mesa D&D',sistema:'dnd5e-srd',modeloPadrao:'C'}); const cid=r.d.campanha.id; await entrar(cid)
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'dnd5e-srd',nome:'Lyra'}); const fL=r.d.ficha.id
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'dnd5e-srd',nome:'Bram'}); const fB=r.d.ficha.id
r=await call(M,'PATCH','campanhas/'+cid,{excecaoFicha:{fichaId:fL,modo:'manual'}}); check('mestre põe a Lyra em Manual (exceção)', r.s===200 && r.d.campanha?.config_progressao?.excecoesPorFicha?.[fL]==='manual' && r.d.campanha.config_progressao.modo==='hibrido', r)
r=await call(J,'GET','fichas/'+fL); check('a ficha recebe a exceção', r.d.configProgressao?.excecoesPorFicha?.[fL]==='manual', r.d.configProgressao)
r=await call(J,'PATCH','campanhas/'+cid,{excecaoFicha:{fichaId:fB,modo:'automatico'}}); check('jogador não cria exceção', r.s===403, r)
r=await call(M,'PATCH','campanhas/'+cid,{excecaoFicha:{fichaId:fB,modo:'turbo'}}); check('modo inválido é recusado', r.s===400, r)
r=await call(M,'POST','campanhas',{nome:'Outra mesa',sistema:'dnd5e-srd',modeloPadrao:'C'}); const outra=r.d.campanha.id
r=await call(M,'PATCH','campanhas/'+outra,{excecaoFicha:{fichaId:fL,modo:'manual'}}); check('ficha de outra campanha não aceita exceção', r.s===404, r)
r=await call(M,'PATCH','campanhas/'+cid,{excecaoFicha:{fichaId:fB,modo:'automatico'}})
r=await call(M,'PATCH','campanhas/'+cid,{excecaoFicha:{fichaId:fL,modo:null}}); check('null tira a exceção e não mexe nas outras', r.s===200 && !(fL in r.d.campanha.config_progressao.excecoesPorFicha) && r.d.campanha.config_progressao.excecoesPorFicha[fB]==='automatico', r.d.campanha?.config_progressao)
r=await call(M,'PATCH','campanhas/'+cid,{configProgressao:{modo:'manual'}}); check('trocar o modo da campanha mantém a exceção', r.d.campanha?.config_progressao?.excecoesPorFicha?.[fB]==='automatico', r.d)
// Árvore num sistema em que o jogador mexe: concedidos só pelo mestre, histórico e nível mínimo guardados
r=await call(M,'POST','campanhas',{nome:'Mesa livre',sistema:'livre',modeloPadrao:'A'}); const cg=r.d.campanha.id; await entrar(cg)
r=await call(M,'POST',`campanhas/${cg}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'livre',nome:'Nix'}); const fg=r.d.ficha?.id
const salvar=async(quem, mudar)=>{ const g=await call(quem,'GET','fichas/'+fg); return call(quem,'PUT','fichas/'+fg,{versao:g.d.ficha.versao,dados:mudar(g.d.ficha.dados)}) }
const em=new Date().toISOString()
const arvore={pontos:1,nos:[{id:'a',nome:'Faísca',custo:1},{id:'b',nome:'Tempestade',custo:5,requer:['a'],nivel:5}],liberados:[]}
r=await salvar(M,d=>({...d,arvore})); check('mestre monta a árvore com nível mínimo', r.s===200, r)
r=await salvar(J,d=>({...d,arvore:{...d.arvore,liberados:['b'],concedidos:['b']}})); check('jogador não se concede hexágono', r.s===403 && /mestre/.test(r.d.erro), r)
r=await salvar(M,d=>({...d,arvore:{...d.arvore,liberados:['b'],concedidos:['b'],historico:[{id:'h1',acao:'conceder',no:'b',nome:'Tempestade',em}]}})); check('mestre concede Tempestade sem custo', r.s===200, r)
r=await call(J,'GET','fichas/'+fg); const a=r.d.ficha.dados.arvore
check('concessão, nível mínimo e histórico ficam salvos', a.concedidos?.[0]==='b' && a.nos.find(n=>n.id==='b')?.nivel===5 && a.historico?.[0]?.acao==='conceder', a)
r=await salvar(J,d=>({...d,arvore:{...d.arvore,liberados:[...d.arvore.liberados,'a'],historico:[{id:'h2',acao:'liberar',no:'a',nome:'Faísca',em},...d.arvore.historico]}})); check('jogador libera com pontos (sem mexer na concessão)', r.s===200, r)
r=await salvar(J,d=>({...d,arvore:{...d.arvore,concedidos:[]}})); check('jogador não retira a concessão', r.s===403, r)
console.log(falhas?`\n${falhas} falha(s)`:'\nTudo certo!'); process.exit(falhas?1:0)
