// v0.32.9: aparência salva no perfil (migração 025). Ver LEIA-ME.md.
const M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222'
const BASE=process.env.PRG_BASE || 'http://localhost:3000'; let falhas=0
async function patch(quem, alvo, body){ const r=await fetch(BASE+'/api/aventureiros/'+alvo,{method:'PATCH',headers:{'content-type':'application/json','x-prg-aventureiro':quem,origin:BASE},body:JSON.stringify(body)}); let d={}; try{d=await r.json()}catch{}; return {s:r.status,d} }
const lista=async()=>(await (await fetch(BASE+'/api/aventureiros',{cache:'no-store'})).json()).perfis
function check(n,c,e){ console.log((c?'✔':'✘')+' '+n+(c?'':'  '+JSON.stringify(e).slice(0,400))); if(!c) falhas++ }
const FOTO=BASE.replace(/\/$/,'')+'/storage/v1/object/public/prg-mesa/imagens/fundo.webp'

let r=await patch(M,M,{visual:{tema:'lua',cor:155,intensidade:1.2,cartaoCor:210,cartaoAlfa:0.7,fonte:'elegante',tamanho:'g',fundo:FOTO,fundoEscuro:30,fundoDesfoque:4}})
check('salva a aparência no próprio perfil', r.s===200 && r.d.perfil.visual?.cor===155 && r.d.perfil.visual?.fundo===FOTO, r)
let p=(await lista()).find(x=>x.id===M)
check('a lista de perfis traz a aparência (para aplicar em qualquer aparelho)', p?.visual?.tema==='lua' && p.visual.fonte==='elegante', p?.visual)
r=await patch(J,M,{visual:{cor:10}}); check('não muda a aparência de outra pessoa', r.s===403, r)
r=await patch(M,M,{visual:{cor:999,fonte:'comic',fundo:'https://site-qualquer.com/a.png',lixo:'x'.repeat(50)}})
check('limpa campos inválidos (cor fora do círculo vira o resto, fonte e foto de fora somem)', r.s===200 && r.d.perfil.visual?.cor===279 && !r.d.perfil.visual.fonte && !r.d.perfil.visual.fundo && !('lixo' in r.d.perfil.visual), r.d.perfil?.visual)
r=await patch(M,M,{visual:null}); p=(await lista()).find(x=>x.id===M)
check('“Voltar ao padrão” apaga a aparência', r.s===200 && (p.visual===null || p.visual===undefined), p?.visual)
r=await patch(M,M,{visual:{}}); p=(await lista()).find(x=>x.id===M)
check('aparência vazia vira nula no banco', r.s===200 && p.visual===null, p?.visual)
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo!'); process.exit(falhas ? 1 : 0)
