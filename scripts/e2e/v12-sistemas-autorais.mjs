// v0.12.0: construtor de sistemas autorais. Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,300))); if(!c) falhas++ }
const def={ nome:'Crônicas da Névoa', resumo:'Teste', dados:'d20', rolagem:'d20',
  campos:[{id:'nivel',nome:'Nível',tipo:'numero',padrao:1}], atributos:[{id:'COR',nome:'Corpo',min:0,max:5,padrao:2},{id:'ALM',nome:'Alma',min:0,max:5,padrao:1}],
  derivados:[{id:'vida_max',nome:'Vida máxima',formula:'10 + COR * 3 + nivel'}],
  pericias:{modo:'treino',total:'MOD + TREINO',treinos:[{id:'nada',nome:'Nada',formula:'0'},{id:'treinado',nome:'Treinado',formula:'2'}],lista:[{id:'luta',nome:'Luta',atributo:'COR'}]},
  recursos:[{id:'vida',nome:'Vida',formula:'vida_max'},{id:'essencia',nome:'Essência',formula:'ALM * 2'}], listas:[{id:'anotacoes',nome:'Anotações'}] }

let r=await call(M,'POST','sistemas',{acao:'criar',definicao:{...def,derivados:[{nome:'Defesa',formula:'10 + DESTREZA'}]}}); check('fórmula com variável inexistente é recusada com explicação', r.s===400 && r.d.erros?.[0]?.includes('DESTREZA'), r)
r=await call(M,'POST','sistemas',{acao:'criar',definicao:def}); check('mestre cria sistema', r.s===201 && /^autoral-[0-9a-f]{32}$/.test(r.d.id), r); const sid=r.d.id, uuid=r.d.uuid
r=await call(J,'GET','sistemas'); check('rascunho não aparece para os outros', !r.d.sistemas.some(s=>s.id===sid), r.d)
r=await call(M,'GET','sistemas'); check('autor vê o rascunho dele', r.d.sistemas.some(s=>s.id===sid && s.meu && !s.publicado), r.d)
r=await call(J,'POST','fichas',{sistema:sid}); check('outros não criam ficha num rascunho', r.s===400, r)
r=await call(M,'POST','fichas',{sistema:sid}); check('autor cria ficha para testar', r.s===201, r); const fm=r.d.ficha.id
r=await call(J,'POST','sistemas',{acao:'salvar',uuid,definicao:{...def,nome:'Roubado'}}); check('ninguém edita o sistema dos outros', r.s===403, r)
r=await call(J,'POST','sistemas',{acao:'publicar',uuid,publicado:true}); check('ninguém publica o sistema dos outros', r.s===403, r)
r=await call(M,'POST','sistemas',{acao:'publicar',uuid,publicado:true}); check('autor publica', r.s===200, r)
r=await call(J,'GET','sistemas'); check('publicado aparece para todos, com o nome do autor', r.d.sistemas.some(s=>s.id===sid && s.autor==='Mestra Lua'), r.d)
r=await call(J,'GET','sistemas/'+sid); check('definição completa para abrir fichas', r.s===200 && r.d.sistema.derivados[0].formula.includes('COR') && r.d.sistema.tipo==='autoral', r.d)
r=await call(J,'POST','fichas',{sistema:sid}); check('jogador cria ficha no sistema publicado', r.s===201, r)
// campanha com sistema autoral
r=await call(M,'POST','campanhas',{nome:'Névoa',sistema:sid,modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); await call(J,'POST','convites/'+r.d.convite.codigo,{}); r=await call(M,'GET','campanhas/'+cid); await call(M,'POST',`campanhas/${cid}/solicitacoes/${r.d.solicitacoes[0].id}`,{decisao:'aceitar'})
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:sid,nome:'Bruma'}); check('mestre cria ficha da campanha no sistema autoral (já com os campos)', r.s===201, r); const fc=r.d.ficha.id
r=await call(J,'GET','fichas/'+fc); check('ficha da campanha nasce com atributos do sistema', r.d.ficha.dados.atributos?.COR===2, r.d.ficha?.dados)
const d=r.d.ficha.dados
r=await call(J,'PUT','fichas/'+fc,{versao:r.d.ficha.versao,dados:{...d,atributos:{...d.atributos,COR:5}}}); check('alterar atributo segue as permissões da campanha (vai para aprovação)', r.s===200 && r.d.pendentes.includes('atributos'), r.d)
// editar sistema e excluir
r=await call(M,'POST','sistemas',{acao:'salvar',uuid,definicao:{...def,derivados:[...def.derivados,{nome:'Defesa',formula:'10 + ALM'}]}}); check('autor edita (versão sobe)', r.s===200, r)
r=await call(M,'GET','sistemas'); check('versão nova registrada', r.d.sistemas.find(s=>s.id===sid).versao===2, r.d)
r=await call(M,'POST','sistemas',{acao:'excluir',uuid}); check('não exclui sistema com fichas', r.s===409, r)
r=await call(M,'POST','sistemas',{acao:'criar',definicao:{...def,nome:'Descartável'}}); r=await call(M,'POST','sistemas',{acao:'excluir',uuid:r.d.uuid}); check('exclui sistema sem fichas', r.s===200, r)
// v0.12.1: Lunethernnyis e Ficha V8 saíram da plataforma (fichas antigas continuam abrindo)
r=await call(J,'POST','fichas',{sistema:'lunethernnyis'}); check('não cria ficha nova de Lunethernnyis automático', r.s===400, r)
r=await call(J,'POST','fichas',{sistema:'lunethernnyis-v8'}); check('não cria Ficha V8 nova', r.s===400, r)
r=await call(J,'POST','fichas',{sistema:'lunethernnyis-v8',dados:{version:2,fields:{name:'Antiga'}}}); check('ainda dá para trazer uma Ficha V8 que estava só no navegador', r.s===201, r)
r=await call(J,'GET','fichas/'+r.d.ficha.id); check('ficha antiga continua abrindo', r.s===200, r)
r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'npc',sistema:'lunethernnyis'}); check('campanha não cria NPC em sistema fora da plataforma', r.s===400, r)
r=await call(J,'GET','sistemas/'+sid); check('a ficha recebe o nome de quem criou o sistema', r.d.sistema.autor==='Mestra Lua', r.d.sistema)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
