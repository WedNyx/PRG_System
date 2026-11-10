// v0.20.0: árvore padrão do sistema e progressão por nível no construtor. Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,300))); if(!c) falhas++ }
const soma=(g)=>{let s=0;return g.map(x=>s+=x)}
const def={ nome:'Ecos da Torre', resumo:'Teste v20', dados:'d20', rolagem:'d20',
  campos:[{id:'nivel',nome:'Nível',tipo:'numero',padrao:1}], atributos:[{id:'COR',nome:'Corpo',min:0,max:5,padrao:2}],
  derivados:[{id:'vida_max',nome:'Vida máxima',formula:'10 + prog_vida'}],
  recursos:[{id:'vida',nome:'Vida',formula:'vida_max'}],
  arvore:{ pontos:1, nos:[
    { id:'raiz', nome:'Despertar', custo:1, x:0, y:0, efeitos:[{tipo:'bonus',alvo:'atributo:COR',valor:1},{tipo:'bonus',alvo:'atributo:NADA',valor:2}] },
    { id:'golpe', nome:'Golpe', custo:1, x:0, y:-150, requer:['raiz'], efeitos:[{tipo:'poder',poder:{nome:'Golpe',expressao:'1d8'}}] } ] },
  progressoes:{ classes:[{ id:'nivel', nome:'Nível', campoNivel:'nivel', tabela:{ arvore:soma(Array(20).fill(1)), vida:soma([0,...Array(19).fill(5)]) } }], colunas:{ arvore:'Pontos da árvore', vida:'Vida' } } }
let r=await call(M,'POST','sistemas',{acao:'criar',definicao:{...def,progressoes:{classes:[{...def.progressoes.classes[0],campoNivel:'xp'}]}}})
check('progressão sem campo de nível é recusada com explicação', r.s===400 && r.d.erros?.some(e=>/nível/.test(e)), r)
r=await call(M,'POST','sistemas',{acao:'criar',definicao:def}); check('sistema com árvore e progressão é criado', r.s===201, r); const sid=r.d.id
check('bônus para alvo inexistente vira aviso', (r.d.avisos??[]).some(a=>/árvore/.test(a)), r.d)
r=await call(M,'GET','sistemas/'+sid); const sis=r.d.sistema
check('sistema guarda árvore e progressão', sis?.arvore?.nos?.length===2 && sis?.progressoes?.classes?.[0]?.tabela?.vida?.[2]===10, sis ? {arv:sis.arvore, prog:sis.progressoes} : r.d)
r=await call(M,'POST','fichas',{sistema:sid}); check('ficha nova criada', r.s===201, r); const fid=r.d.ficha.id
r=await call(M,'GET','fichas/'+fid); const d=r.d.ficha.dados
check('ficha nova já vem com a árvore do sistema (nada liberado)', d.arvore?.nos?.length===2 && d.arvore.pontos===1 && d.arvore.liberados.length===0, d.arvore)
check('bônus inválido não chegou na ficha', !JSON.stringify(d.arvore).includes('NADA'), d.arvore)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
