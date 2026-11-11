// v0.32.5: histórico de rolagens com filtros e resumo; itens com foto e “mágico”. Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222', X='33333333-3333-4333-8333-333333333333'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function call(quem, metodo, caminho, body){ const r=await fetch(BASE+'/api/prg/'+caminho,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:body===undefined?undefined:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
let r=await call(M,'POST','campanhas',{nome:'Histórico',sistema:'dnd5e-srd',modeloPadrao:'C'}); const cid=r.d.campanha.id
r=await call(M,'POST',`campanhas/${cid}/convites`,{}); const cod=r.d.convite.codigo; await call(J,'POST','convites/'+cod,{}); await call(X,'POST','convites/'+cod,{})
r=await call(M,'GET','campanhas/'+cid); for (const s of r.d.solicitacoes) await call(M,'POST',`campanhas/${cid}/solicitacoes/${s.id}`,{decisao:'aceitar'})
await call(M,'POST','mesa/'+cid,{acao:'sessao',aberta:true})
const ev=(q,b)=>call(q,'POST','mesa/'+cid,{acao:'evento',...b})
for (let i=0;i<40;i++) await ev(J,{tipo:'rolagem',expressao:'1d20+2',personagem:'Lyra',texto:i%2?'Furtividade':'Percepção'})
for (let i=0;i<10;i++) await ev(X,{tipo:'rolagem',expressao:'2d6',personagem:'Borin'})
await ev(J,{tipo:'chat',texto:'olá mesa'}); await ev(M,{tipo:'rolagem',expressao:'1d20',visibilidade:'mestre',texto:'segredo'})
const h=p=>call(J,'GET',`mesa/${cid}?historico=1&${p}`)
r=await h('tipo=dados'); check('tipo “dados” traz rolagens (sem a secreta do mestre)', r.s===200 && r.d.eventos.length===50 && !r.d.eventos.some(e=>e.texto==='segredo'), r.d.eventos?.length)
r=await h('tipo=chat'); check('só mensagens', r.d.eventos.length===1 && r.d.eventos[0].texto==='olá mesa', r.d.eventos)
r=await h('personagem=lyr'); check('filtra por personagem', r.d.eventos.length===40 && r.d.eventos.every(e=>e.personagem==='Lyra'), r.d.eventos.length)
r=await h('busca=Furtiv&tipo=dados'); check('procura no texto', r.d.eventos.length===20, r.d.eventos.length)
r=await h('resultado=critico'); check('só críticos: todos com 20 num d20', r.d.eventos.every(e=>e.resultados.includes(20) && /d20/.test(e.expressao)), r.d.eventos.map(e=>e.resultados))
r=await h('resultado=falha'); check('só falhas: todos com 1 num d20', r.d.eventos.every(e=>e.resultados.includes(1) && /d20/.test(e.expressao)), r.d.eventos.map(e=>e.resultados))
r=await h('desde='+encodeURIComponent(new Date(Date.now()+60000).toISOString())); check('período no futuro: nada', r.d.eventos.length===0 && 'sessaoAbertaEm' in r.d, r.d)
r=await h('busca=*,()%&tipo=dados'); check('caracteres especiais na busca não quebram', r.s===200, r)
r=await h('resumo=1')
const res=r.d.resumo, lyra=res?.porPersonagem.find(p=>p.nome==='Lyra')
check('resumo conta rolagens e calcula a média do d20', r.s===200 && res.rolagens===50 && lyra.rolagens===40 && lyra.mediaD20>=1 && lyra.mediaD20<=20 && res.porPersonagem.find(p=>p.nome==='Borin').mediaD20===null, res)
check('resumo do jogador não conta a rolagem secreta do mestre', r.d.total===50, r.d.total)
r=await call(M,'GET',`mesa/${cid}?historico=1&resumo=1`); check('mestre vê a secreta no resumo', r.d.total===51, r.d.total)
r=await call('44444444-4444-4444-8444-444444444444','GET',`mesa/${cid}?historico=1`); check('quem não é da campanha não vê', r.s>=400, r.s)

// itens: foto e mágico
const fL=(await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'dnd5e-srd',nome:'Lyra'})).d.ficha.id
r=await call(M,'GET','fichas/'+fL); const f=r.d.ficha
r=await call(M,'PUT','fichas/'+fL,{versao:f.versao,dados:{...f.dados,itens:[
  {id:'a',nome:'Anel lunar',categoria:'tesouro',peso:0,bonus:[],magico:true,imagem:'https://abc.supabase.co/storage/v1/object/public/prg-mesa/imagens/anel.webp'},
  {id:'b',nome:'Espada',categoria:'arma',peso:1,bonus:[],imagem:'https://evil.com/x.png',magico:'sim'}]}})
r=await call(M,'GET','fichas/'+fL); const it=r.d.ficha.dados.itens
check('item guarda foto da plataforma e “mágico”', it[0]?.magico===true && it[0]?.imagem?.includes('prg-mesa'), it[0])
check('foto de fora e “mágico” inválido saem', !it[1]?.imagem && !it[1]?.magico, it[1])
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
