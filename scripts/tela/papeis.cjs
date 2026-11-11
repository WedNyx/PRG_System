// Teste geral pela tela (Playwright): mestre (celular), jogador (celular) e espectador (computador).
// Uso: NODE_PATH=$(npm root -g) node scripts/tela/papeis.cjs <pasta-das-fotos>  (servidor local em :3000, banco de teste). Ver scripts/e2e/LEIA-ME.md.
const { chromium, devices } = require('playwright');
const B='http://localhost:3000', M='11111111-1111-4111-8111-111111111111', J='22222222-2222-4222-8222-222222222222', X='33333333-3333-4333-8333-333333333333'
const O=process.argv[2] || '.'
const call=async(q,metodo,c,body)=>{const r=await fetch(B+'/api/prg/'+c,{method:metodo,headers:{'content-type':'application/json','x-prg-aventureiro':q,origin:B},body:body&&JSON.stringify(body)});let d={};try{d=await r.json()}catch{};return {s:r.status,d}}
// Painel da mesa em grupos (v0.32.6): abre o grupo e, se houver, a parte dele.
const GRUPO={Fichas:'Jogo',Iniciativa:'Jogo',Tokens:'Jogo',Chat:'Chat',Mestre:'Mestre',Controles:'Mestre',Biblioteca:'Mestre',Tabelas:'Mestre',Diário:'Diário',Música:'Música'}
const aba=async(pg,nome)=>{ await pg.getByRole('button',{name:new RegExp('^'+GRUPO[nome]+'$')}).click(); const t=pg.getByRole('tab',{name:new RegExp('^'+(nome==='Mestre'?'Controles':nome)+'$')}); if(await t.count()) await t.first().click(); await pg.waitForTimeout(200) }
const res=[]; let n=0
async function passo(nome, pg, fn){ n++; try { await fn(); res.push('✔ '+nome) } catch(e){ res.push('✘ '+nome+' — '+String(e.message).split('\n')[0].slice(0,160)); try{ await pg.screenshot({path:`${O}/falha-${n}.png`}) }catch{} } }
const centro=async(pg,nome)=>{ const bb=await pg.locator(`div[title="${nome}"]`).first().boundingBox(); if(!bb) throw new Error('token '+nome+' não está no mapa'); return {x:bb.x+bb.width/2,y:bb.y+bb.height/2} }
const toque=async(pg,nome)=>{ const c=await centro(pg,nome); if(pg.touchscreen && pg.context()._options?.hasTouch) await pg.touchscreen.tap(c.x,c.y); else await pg.mouse.click(c.x,c.y) }
;(async () => {
  // ---------- preparação (API) ----------
  let r=await call(M,'POST','campanhas',{nome:'Teste Geral',sistema:'dnd5e-srd',modeloPadrao:'C'}); const cid=r.d.campanha.id
  r=await call(M,'POST',`campanhas/${cid}/convites`,{}); const cod=r.d.convite.codigo
  await call(J,'POST','convites/'+cod,{}); await call(X,'POST','convites/'+cod,{})
  r=await call(M,'GET','campanhas/'+cid); for (const s of r.d.solicitacoes) await call(M,'POST',`campanhas/${cid}/solicitacoes/${s.id}`,{decisao:'aceitar'})
  await call(M,'PATCH',`campanhas/${cid}/membros/${X}`,{papel:'espectador'})
  r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'jogador',jogadorId:J,sistema:'dnd5e-srd',nome:'Lyra'}); const fL=r.d.ficha.id
  r=await call(M,'GET','fichas/'+fL); await call(M,'PUT','fichas/'+fL,{versao:r.d.ficha.versao,dados:{...r.d.ficha.dados,itens:[{id:'arco',nome:'Arco',categoria:'arma',peso:1,dano:'1d8+3',alcance:30,bonus:[]}]}})
  r=await call(M,'POST',`campanhas/${cid}/fichas`,{tipo:'npc',sistema:'dnd5e-srd',nome:'Goblin'}); const fG=r.d.ficha.id
  await call(M,'POST','mesa/'+cid,{acao:'cena_criar',nome:'Ponte',grid_cols:12,grid_rows:16}); r=await call(M,'GET','mesa/'+cid); const cena=r.d.cenaAtiva?.id ?? r.d.cenas[0].id; if(!r.d.cenaAtiva) await call(M,'POST','mesa/'+cid,{acao:'cena_ativar',cenaId:cena})

  await call(M,'POST','mesa/'+cid,{acao:'sessao',aberta:true})
  const b = await chromium.launch({ args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'] })
  const abrir=async(id, disp)=>{ const ctx=await b.newContext(disp); await ctx.addInitScript(i=>{try{localStorage.setItem('prg-aventureiro-selecionado-v1',i); localStorage.setItem('prg-grupo-v1','lunethernnyis'); for (const p of ['mestre','jogador','espectador']) localStorage.setItem('prg-dicas-mesa-v1-'+p,'1')}catch{}}, id); const p=await ctx.newPage(); p.erros=[]; p.on('pageerror',e=>p.erros.push(e.message)); p.on('response',x=>{ if(x.status()>=500) p.erros.push('HTTP '+x.status()+' '+x.url()) }); return p }
  const mestre=await abrir(M, devices['Pixel 7']), jog=await abrir(J, devices['Pixel 7']), esp=await abrir(X, { viewport:{width:1280,height:800} })

  // ---------- páginas gerais ----------
  for (const [nome,url] of [['portal','/portal'],['guia','/guia'],['novidades','/novidades'],['tutorial','/tutorial'],['construtor','/sistemas/criar']]) await passo('abre '+nome, esp, async()=>{ await esp.goto(B+url); await esp.waitForTimeout(1500); if (await esp.getByText(/Application error|erro inesperado/i).count()) throw new Error('tela de erro') })
  await passo('portal: cartões de grupo e perfis', jog, async()=>{ const ctx=jog; await ctx.goto(B+'/portal'); await ctx.waitForTimeout(1200); await ctx.getByRole('button',{name:'Trocar grupo'}).click(); await ctx.getByRole('button',{name:/De Fora/}).waitFor(); await ctx.getByRole('button',{name:/Lunethernnyis/}).click(); await ctx.getByText('Jogador Sol').waitFor() })
  for (const sec of ['Fichas','Campanhas','Sistemas de RPG','Histórico']) await passo('central do jogador: '+sec, jog, async()=>{ await jog.goto(B+'/central?personagem='+J); await jog.waitForTimeout(1200); await jog.getByRole('button',{name:/☰|Menu|Abrir menu/}).first().click().catch(()=>{}); await jog.getByRole('navigation',{name:'Navegação da Central'}).getByRole('button',{name:new RegExp('^'+sec)}).first().click({force:true}).catch(()=>jog.getByRole('navigation',{name:'Atalhos da Central'}).getByRole('button').nth(['Fichas','Campanhas','Sistemas de RPG','Histórico'].indexOf(sec)+1).click()); await jog.waitForTimeout(800) })
  await passo('jogador abre a própria ficha', jog, async()=>{ await jog.goto(B+'/ficha?nuvem='+fL); await jog.waitForTimeout(2500); await jog.getByText('Lyra').first().waitFor() })
  await passo('jogador rola um teste na ficha (dados 3D + cartão)', jog, async()=>{ await jog.getByRole('button',{name:/Atributos/}).first().click(); await jog.waitForTimeout(500); await jog.getByRole('button',{name:'FOR +0'}).click(); await jog.getByRole('status').first().waitFor({timeout:9000}); await jog.keyboard.press('Escape') })
  await passo('espectador não abre ficha dos outros', esp, async()=>{ const rr=await call(X,'GET','fichas/'+fL); if(rr.s===200) throw new Error('espectador leu a ficha ('+rr.s+')') })

  // ---------- mesa: mestre ----------
  await passo('mestre abre a mesa e a sessão', mestre, async()=>{ await mestre.goto(B+'/mesa?campanha='+cid); await mestre.waitForTimeout(3000); await mestre.getByRole('button',{name:/Encerrar sessão/}).waitFor() })
  await passo('mestre coloca as fichas na mesa (aba Fichas)', mestre, async()=>{ await aba(mestre,'Fichas'); await mestre.waitForTimeout(1200)
    for (const nome of ['Lyra','Goblin']) { await mestre.getByRole('button',{name:new RegExp('^'+nome)}).first().click(); await mestre.waitForTimeout(400); await mestre.getByRole('button',{name:/Colocar na mesa/}).first().click(); await mestre.waitForTimeout(1200); await mestre.keyboard.press('Escape').catch(()=>{}) }
    await centro(mestre,'Lyra'); await centro(mestre,'Goblin') })
  await passo('mestre rola no chat', mestre, async()=>{ await aba(mestre,'Chat'); const c=mestre.getByPlaceholder(/Mensagem/); await c.fill('/r 1d20+2'); await c.press('Enter'); await mestre.getByRole('status').first().waitFor({timeout:9000}); await mestre.waitForTimeout(500); await mestre.keyboard.press('Escape') })
  await passo('mestre põe Queimando (2 rodadas) no Goblin', mestre, async()=>{ await mestre.waitForTimeout(800); await toque(mestre,'Goblin'); await mestre.getByRole('dialog',{name:/Token Goblin/}).waitFor(); await mestre.getByRole('button',{name:/Queimando/}).click(); await mestre.waitForTimeout(1500); await mestre.getByLabel('Duração de Queimando').selectOption('2'); await mestre.waitForTimeout(1200); const v=await mestre.getByLabel('Dano por turno de Queimando').inputValue(); if(v!=='1d6') throw new Error('dano sugerido = '+v); await mestre.getByRole('button',{name:'Fechar'}).first().click() })
  await passo('mestre prepara o combate (Lyra começa)', mestre, async()=>{ await aba(mestre,'Iniciativa'); await mestre.getByRole('button',{name:/Preparar combate/}).click(); await mestre.waitForTimeout(600)
    const ini = mestre.getByLabel(/Bônus de Goblin|bônus.*Goblin/i); if (await ini.count()) await ini.fill('-40'); const ini2 = mestre.getByLabel(/Bônus de Lyra|bônus.*Lyra/i); if (await ini2.count()) await ini2.fill('40')
    await mestre.getByRole('button',{name:/Rolar iniciativa/}).click(); await mestre.waitForTimeout(2500); await mestre.keyboard.press('Escape').catch(()=>{}); await mestre.getByText(/Rodada/).first().waitFor() })

  // ---------- mesa: jogador ----------
  await passo('jogador entra na mesa e vê o mapa', jog, async()=>{ await jog.goto(B+'/mesa?campanha='+cid); await jog.waitForTimeout(3000); await centro(jog,'Lyra') })
  const vez = (await call(M,'GET','mesa/'+cid)).d.mesa; const vezLyra = vez.iniciativa?.[vez.turno]?.nome==='Lyra'
  if (!vezLyra) await call(M,'POST','mesa/'+cid,{acao:'turno',direcao:1})
  await jog.waitForTimeout(2500)
  await passo('jogador ataca o Goblin tocando no mapa', jog, async()=>{ await jog.reload(); await jog.waitForTimeout(3000); await toque(jog,'Lyra'); await jog.getByRole('button',{name:'⚔️ Atacar'}).click(); await jog.getByRole('button',{name:/Escolher o alvo no mapa/}).click(); await jog.waitForTimeout(400); await toque(jog,'Goblin'); await jog.getByText('Alvo:',{exact:false}).waitFor({timeout:4000}); await jog.getByRole('button',{name:/Atacar!/}).click(); await jog.waitForTimeout(1500) })
  await passo('ataque aparece no chat do mestre', mestre, async()=>{ await aba(mestre,'Chat'); await mestre.waitForTimeout(2500); await mestre.reload(); await mestre.waitForTimeout(3000); await mestre.getByText(/Lyra.*→|Lyra →/).first().waitFor({timeout:6000}).catch(async()=>{ await mestre.getByText('Goblin').first().waitFor() }) })
  await passo('mestre aplica o dano (se acertou)', mestre, async()=>{ const ap=mestre.getByRole('button',{name:/^Aplicar \d+/}); if(await ap.count()){ const antes=(await call(M,'GET','fichas/'+fG)).d.ficha.dados.recursos.pv.atual; await ap.first().click(); await mestre.waitForTimeout(1500); const depois=(await call(M,'GET','fichas/'+fG)).d.ficha.dados.recursos.pv.atual; if(!(depois<antes)) throw new Error(`vida não mudou ${antes}→${depois}`) } })
  await passo('jogador termina o turno → Goblin queima', jog, async()=>{ await aba(jog,'Iniciativa'); await jog.getByRole('button',{name:/Terminar meu turno/}).click(); await jog.waitForTimeout(2000); const ev=(await call(M,'GET','mesa/'+cid)).d.eventos.map(e=>e.texto||''); if(!ev.some(t=>t.startsWith('🔥 Queimando: Goblin sofreu'))) throw new Error('sem dano de queimando no chat') })
  await passo('jogador não vê botões de mestre', jog, async()=>{ if(await jog.getByRole('button',{name:/Abrir sessão|Encerrar sessão|Preparar combate/}).count()) throw new Error('jogador vê controle de mestre') })

  // ---------- mesa: espectador ----------
  await passo('espectador assiste a mesa', esp, async()=>{ await esp.goto(B+'/mesa?campanha='+cid); await esp.waitForTimeout(3000); await esp.getByText(/Espectador/).first().waitFor(); await centro(esp,'Goblin') })
  await passo('espectador conversa no chat', esp, async()=>{ const c=esp.getByPlaceholder(/Mensagem/); await c.fill('Que luta!'); await c.press('Enter'); await esp.waitForTimeout(1200); await esp.getByText('Que luta!').first().waitFor() })
  await passo('espectador não rola dados nem mexe em token', esp, async()=>{ const rr=await call(X,'POST','mesa/'+cid,{acao:'evento',tipo:'rolagem',expressao:'1d20'}); if(rr.s!==403) throw new Error('rolou: '+rr.s); await toque(esp,'Goblin'); await esp.waitForTimeout(600); if(await esp.getByRole('dialog',{name:/Token Goblin/}).count()) throw new Error('abriu janela do token') })

  await passo('mestre encerra o combate', mestre, async()=>{ mestre.once('dialog', d=>d.accept()); await aba(mestre,'Iniciativa'); await mestre.getByRole('button',{name:/Encerrar$/}).click(); await mestre.waitForTimeout(1500); if((await call(M,'GET','mesa/'+cid)).d.mesa.iniciativa.length) throw new Error('não encerrou') })
  await mestre.screenshot({path:O+'/mestre.png'}); await jog.screenshot({path:O+'/jogador.png'}); await esp.screenshot({path:O+'/espectador.png'})
  console.log(res.join('\n'))
  for (const [q,p] of [['mestre',mestre],['jogador',jog],['espectador',esp]]) console.log('erros '+q+':', JSON.stringify([...new Set(p.erros)]).slice(0,600))
  await b.close()
})().catch(e => { console.error(e); console.log(res.join('\n')); process.exit(1) })
