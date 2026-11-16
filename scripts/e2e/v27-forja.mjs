// v0.27.0: forja de itens (arte e raridade guardadas na ficha, limpas pelo servidor). Ver LEIA-ME.md.
// v0.35.3: a Forja saiu: o desenho antigo vira o ícone equivalente; ícones do acervo (gi:) e rolagens prontas são guardados.
const M='11111111-1111-4111-8111-111111111111'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,300))); if(!c) falhas++ }
let r=await call(M,'POST','fichas',{sistema:'dnd5e-srd'}); const f=r.d.ficha.id
r=await call(M,'GET','fichas/'+f); const d=r.d.ficha.dados
r=await call(M,'PUT','fichas/'+f,{versao:r.d.ficha.versao,dados:{...d,itens:[
  {id:'a',nome:'Lâmina do Crepúsculo',categoria:'arma',peso:1,dano:'1d8',bonus:[],arte:{forma:'espada',cor:'#a78bfa',cor2:'#f59e0b'},raridade:'lendario'},
  {id:'b',nome:'Trapaça',categoria:'arma',peso:1,bonus:[],arte:{forma:'<img src=x onerror=alert(1)>',cor:'red'},raridade:'divino'},
  {id:'c',nome:'Cor esquisita',categoria:'tesouro',peso:0,bonus:[],arte:{forma:'gema',cor:'url(javascript:1)',cor2:'#10b981'}},
  {id:'d',nome:'Espingarda',categoria:'arma',peso:3.5,dano:'3d6',bonus:[],iconeBiblioteca:'gi:sbed/shotgun',rolagens:[{nome:'De longe',expr:'1d6'},{nome:'Ruim',expr:'alert(1)'}]},
  {id:'e',nome:'Truque',categoria:'arma',peso:1,bonus:[],iconeBiblioteca:'gi:../../x/y'}]}})
check('ficha salva', r.s===200, r)
r=await call(M,'GET','fichas/'+f); const it=r.d.ficha.dados.itens
check('desenho antigo vira ícone e a raridade fica', !it[0].arte && it[0].iconeBiblioteca==='espada' && it[0].raridade==='lendario', it[0])
check('forma e raridade inventadas são descartadas', !it[1].arte && !it[1].raridade, it[1])
check('gema antiga vira o ícone de gema', !it[2].arte && it[2].iconeBiblioteca==='gema', it[2])
check('ícone do acervo e rolagens válidas guardados', it[3].iconeBiblioteca==='gi:sbed/shotgun' && it[3].rolagens?.length===1 && it[3].rolagens[0].nome==='De longe' && it[3].rolagens[0].expr==='1d6', it[3])
check('ícone com caminho estranho sai', !it[4].iconeBiblioteca, it[4])
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
