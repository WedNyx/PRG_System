// Mesa virtual (v0.36.4): mapa em destaque, chat numa aba lateral recolhível, painel de ferramentas recolhível e música compacta.
// Uso: NODE_PATH=$(npm root -g) node scripts/tela/mesa-layout.cjs <pasta>  (servidor local em :3000, banco de teste).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium, devices } = require('playwright')
const B = 'http://localhost:3000', M = '11111111-1111-4111-8111-111111111111', J = '22222222-2222-4222-8222-222222222222'
const O = process.argv[2] || '.', ANTES = process.env.ANTES === '1'
const call = async (q, metodo, c, body) => { const r = await fetch(B + '/api/prg/' + c, { method: metodo, headers: { 'content-type': 'application/json', 'x-prg-aventureiro': q, origin: B }, body: body && JSON.stringify(body) }); let d = {}; try { d = await r.json() } catch {} return { s: r.status, d } }
const ok = (c, m) => { if (!c) { console.log('✘ ' + m); process.exitCode = 1 } else console.log('✓ ' + m) }
const DISP = [['celular', devices['Pixel 7']], ['computador', { viewport: { width: 1366, height: 800 } }]]

;(async () => {
  let r = await call(M, 'POST', 'campanhas', { nome: 'Mesa nova', sistema: 'tormenta20', modeloPadrao: 'C' }); const cid = r.d.campanha.id
  r = await call(M, 'POST', `campanhas/${cid}/convites`, {}); await call(J, 'POST', 'convites/' + r.d.convite.codigo, {})
  r = await call(M, 'GET', 'campanhas/' + cid); for (const s of r.d.solicitacoes) await call(M, 'POST', `campanhas/${cid}/solicitacoes/${s.id}`, { decisao: 'aceitar' })
  await call(M, 'POST', 'mesa/' + cid, { acao: 'sessao', aberta: true })
  r = await call(M, 'POST', 'mesa/' + cid, { acao: 'cena_criar', nome: 'Taverna do Javali', grid_cols: 16, grid_rows: 12 }); const cena = r.d.cena.id
  r = await call(M, 'GET', 'mesa/' + cid); if (!r.d.cenaAtiva) await call(M, 'POST', 'mesa/' + cid, { acao: 'cena_ativar', cenaId: cena })
  for (const [nome, x, y] of [['Guarda', 3, 4], ['Bandido', 8, 6], ['Lyra', 5, 8]]) { r = await call(M, 'POST', 'mesa/' + cid, { acao: 'token_criar', cenaId: cena, nome, hp_max: 12 }); await call(M, 'POST', 'mesa/' + cid, { acao: 'token_mover', tokenId: r.d.token.id, x, y }) }
  await call(M, 'POST', 'mesa/' + cid, { acao: 'evento', tipo: 'chat', texto: 'Bem-vindos à Taverna do Javali! 🍺', visibilidade: 'publica' })
  await call(J, 'POST', 'mesa/' + cid, { acao: 'evento', tipo: 'chat', texto: 'Lyra entra e procura um lugar perto da lareira.', visibilidade: 'publica', personagem: 'Lyra' })
  await call(J, 'POST', 'mesa/' + cid, { acao: 'evento', tipo: 'rolagem', expressao: '1d20+3', visibilidade: 'publica', personagem: 'Lyra' })
  await call(M, 'POST', 'mesa/' + cid, { acao: 'evento', tipo: 'chat', texto: 'O taverneiro olha desconfiado para vocês.', visibilidade: 'publica' })
  r = await call(M, 'POST', `campanhas/${cid}/musica`, { acao: 'playlist_criar', nome: 'Taverna' }); const pl = r.d.playlist.id
  r = await call(M, 'POST', `campanhas/${cid}/musica`, { acao: 'musica_adicionar', playlistId: pl, url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', titulo: 'Música de taverna medieval' })
  await call(M, 'POST', `campanhas/${cid}/musica`, { acao: 'tocar', musicaId: r.d.musica.id })
  const b = await chromium.launch(); const erros = []
  for (const [disp, opts] of DISP) for (const [quem, id] of [['mestre', M], ['jogador', J]]) {
    const ctx = await b.newContext(opts)
    await ctx.addInitScript(i => { try { localStorage.setItem('prg-aventureiro-selecionado-v1', i); for (const x of ['mestre', 'jogador', 'espectador']) localStorage.setItem('prg-dicas-mesa-v1-' + x, '1') } catch {} }, id)
    const p = await ctx.newPage(); p.on('pageerror', e => erros.push(disp + ': ' + e.message)); p.on('dialog', d => d.accept())
    await p.goto(B + '/mesa?campanha=' + cid, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3500)
    await p.screenshot({ path: `${O}/${ANTES ? 'antes' : 'depois'}-${disp}-${quem}-1.png` })
    if (!ANTES) {
      ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1), `${disp}/${quem}: sem rolagem para o lado`)
      const mapa = await p.locator('section[aria-label="Mapa da mesa"]').boundingBox()
      const vp = p.viewportSize()
      ok(mapa && mapa.width * mapa.height > vp.width * vp.height * (disp === 'celular' ? 0.6 : 0.5), `${disp}/${quem}: o mapa ocupa a maior parte da tela (${Math.round(mapa.width)}×${Math.round(mapa.height)})`)
      const musica = await p.getByRole('region', { name: 'Música da mesa' }).boundingBox()
      ok(musica && musica.height <= 56 && musica.width <= 260, `${disp}/${quem}: música compacta (${musica && Math.round(musica.width)}×${musica && Math.round(musica.height)})`)
      // Chat: abre, mostra as mensagens, envia uma e recolhe
      const chat = p.getByRole('complementary', { name: 'Chat da mesa' })
      ok((disp === 'computador') === (await chat.isVisible()), `${disp}/${quem}: chat começa ${disp === 'computador' ? 'aberto no computador' : 'recolhido no celular'}`)
      if (!(await chat.isVisible())) { await p.getByRole('button', { name: /^Chat/ }).first().click(); await p.waitForTimeout(500) }
      ok(await chat.isVisible(), `${disp}/${quem}: o chat abre na aba lateral`)
      ok(await chat.getByText('Bem-vindos à Taverna do Javali!').count() === 1, `${disp}/${quem}: mensagens aparecem`)
      await chat.getByRole('textbox', { name: 'Mensagem' }).fill('Oi do ' + quem + ' no ' + disp); await chat.getByRole('button', { name: 'Enviar', exact: true }).click(); await p.waitForTimeout(900)
      ok(await chat.getByText('Oi do ' + quem + ' no ' + disp).count() === 1, `${disp}/${quem}: mensagem enviada aparece no chat`)
      await p.screenshot({ path: `${O}/depois-${disp}-${quem}-2-chat.png` })
      await chat.getByRole('tab', { name: /Dados/ }).click(); await p.waitForTimeout(300)
      ok(await chat.getByText('1d20+3').count() >= 1, `${disp}/${quem}: rolagens ficam na aba Dados`)
      await chat.getByRole('button', { name: 'Recolher o chat' }).click(); await p.waitForTimeout(400)
      ok(!(await chat.isVisible()), `${disp}/${quem}: o chat recolhe`)
      // Música: expande e compacta
      await p.getByRole('button', { name: 'Expandir música' }).click(); await p.waitForTimeout(300)
      await p.screenshot({ path: `${O}/depois-${disp}-${quem}-3-musica.png` })
      await p.getByRole('button', { name: 'Compactar música' }).click(); await p.waitForTimeout(300)
      // Painel de ferramentas
      await p.getByRole('button', { name: /^Jogo/ }).first().click(); await p.waitForTimeout(400)
      ok(await p.getByRole('complementary', { name: 'Painel da mesa' }).isVisible(), `${disp}/${quem}: painel de ferramentas abre`)
      await p.screenshot({ path: `${O}/depois-${disp}-${quem}-4-painel.png` })
    }
    await ctx.close()
  }
  if (!ANTES) {
    // Aviso de mensagem nova com o chat recolhido
    const ctx = await b.newContext(devices['Pixel 7'])
    await ctx.addInitScript(i => { try { localStorage.setItem('prg-aventureiro-selecionado-v1', i); for (const x of ['mestre', 'jogador', 'espectador']) localStorage.setItem('prg-dicas-mesa-v1-' + x, '1') } catch {} }, J)
    const p = await ctx.newPage(); p.on('pageerror', e => erros.push('aviso: ' + e.message))
    await p.goto(B + '/mesa?campanha=' + cid, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000)
    await call(M, 'POST', 'mesa/' + cid, { acao: 'evento', tipo: 'chat', texto: 'Mensagem nova do mestre', visibilidade: 'publica' }); await p.waitForTimeout(5500)
    ok(/1/.test(await p.getByRole('button', { name: /^Chat/ }).first().innerText()), 'com o chat recolhido, aparece o número de mensagens novas')
    await ctx.close()
  }
  ok(!erros.length, 'sem erros ' + erros.join(' | '))
  await b.close()
})()
