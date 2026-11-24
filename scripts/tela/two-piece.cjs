// v0.36.9: Two Piece (Raijin) — ficha com parada de d20, árvore em constelação com espaços em aberto:
// liberar, escrever a habilidade (dano, custo em MP/EM, usos) e ver em Poderes e habilidades. Construtor do dono.
// Uso: NODE_PATH=$(npm root -g) node scripts/tela/two-piece.cjs <pasta>  (servidor local; migração 039 aplicada e perfil Raijin).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium, devices } = require('playwright')
const B = 'http://localhost:3000', J = '22222222-2222-4222-8222-222222222222', R = '3e380df6-5095-4d0f-a630-fa7d03813628', O = process.argv[2] || '.'
const ID = 'autoral-8d2f6a1c4b7e4e9a9c3b5d7f1a2e4c6b'
const call = async (q, m, c, body) => { const r = await fetch(B + '/api/prg/' + c, { method: m, headers: { 'content-type': 'application/json', 'x-prg-aventureiro': q, origin: B }, body: body && JSON.stringify(body) }); let d = {}; try { d = await r.json() } catch {} return { s: r.status, d } }
const ok = (c, m) => { if (!c) { console.log('✘ ' + m); process.exitCode = 1 } else console.log('✓ ' + m) }
const semLado = p => p.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1)
;(async () => {
  const b = await chromium.launch(); const erros = []
  for (const [disp, opts] of [['celular', devices['Pixel 7']], ['notebook', { viewport: { width: 1366, height: 860 } }]]) {
    const f = await call(J, 'POST', 'fichas', { sistema: ID, dados: { nome: 'Kairo ' + disp } })
    ok(f.s < 300 && f.d.ficha?.id, `${disp}: ficha de Two Piece criada`)
    const c = await b.newContext(opts); await c.addInitScript(i => { try { localStorage.setItem('prg-aventureiro-selecionado-v1', i) } catch {} }, J)
    const p = await c.newPage(); p.on('pageerror', e => erros.push(e.message)); p.on('dialog', d => d.accept())
    await p.goto(B + '/ficha?nuvem=' + f.d.ficha.id, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000)
    const secao = async re => { await p.locator('nav[aria-label="Seções da ficha"] button').filter({ hasText: re }).first().click(); await p.waitForTimeout(900) }
    ok(await p.locator('datalist#sugestoes-classe option').count() === 3 && await p.locator('datalist#sugestoes-raca option').count() === 3, `${disp}: Classe e Raça com as opções do Raijin`)
    await p.screenshot({ path: `${O}/two-piece-${disp}-1-principal.png`, fullPage: disp === 'celular' })
    await secao(/Atributos/)
    ok(await p.getByText(/Força de vontade/).count() >= 1, `${disp}: os 6 atributos`)
    await secao(/Árvore/)
    await p.locator('.react-flow__node-hab').first().waitFor({ timeout: 8000 }).catch(() => {})
    ok(await p.locator('.react-flow__node-hab').count() === 45, `${disp}: árvore com o centro e os 44 espaços`)
    ok(await p.locator('[data-pontos-arvore]').count() === 0, `${disp}: sem painel de pontos (a árvore não usa pontos)`)
    await p.locator('[data-constelacao]').scrollIntoViewIfNeeded(); await p.screenshot({ path: `${O}/two-piece-${disp}-2-arvore.png` })
    await p.getByRole('button', { name: /^Personagem, pode liberar/ }).dispatchEvent('click'); await p.waitForTimeout(400)
    await p.getByRole('button', { name: /^Liberar/ }).click(); await p.waitForTimeout(900)
    await p.getByRole('button', { name: /^Haki do Armamento 1, pode liberar/ }).dispatchEvent('click'); await p.waitForTimeout(400)
    ok(await p.getByText(/Espaço em aberto: depois de liberar/).count() >= 1, `${disp}: antes de liberar, explica o espaço em aberto`)
    await p.getByRole('button', { name: /^Liberar/ }).click(); await p.waitForTimeout(900)
    const form = p.locator('[data-escrever-habilidade]')
    ok(await form.count() === 1 && await form.getByText('Custo (EM)').count() === 1, `${disp}: depois de liberar, aparece “Sua habilidade” com custo em EM`)
    await form.getByLabel('Nome').fill('Punho Negro'); await form.getByLabel('Descrição').fill('Endurece o braço com Haki.')
    await form.getByLabel('Dados de dano').fill('2d8+3'); await form.getByLabel(/Custo/).fill('4'); await form.getByLabel('Usos por combate').fill('2')
    await form.getByRole('button', { name: 'Salvar habilidade' }).click(); await p.waitForTimeout(1200)
    await p.locator('.constelacao-no[aria-label^="Punho Negro, liberada"]').waitFor({ state: 'attached', timeout: 6000 }).catch(() => {})
    ok(await p.locator('.constelacao-no[aria-label^="Punho Negro, liberada"]').count() === 1, `${disp}: o espaço passa a mostrar o nome da habilidade`)
    await p.screenshot({ path: `${O}/two-piece-${disp}-3-habilidade.png`, fullPage: disp === 'celular' })
    ok(await semLado(p), `${disp}: sem rolagem para o lado`)
    await secao(/Poderes/)
    ok(await p.getByText('Punho Negro').count() >= 1 && await p.getByText(/2d8\+3/).count() >= 1, `${disp}: a habilidade aparece em Poderes e habilidades com o dano`)
    await p.screenshot({ path: `${O}/two-piece-${disp}-4-poderes.png`, fullPage: disp === 'celular' })
    await p.waitForTimeout(2500)
    const g = await call(J, 'GET', 'fichas/' + f.d.ficha.id)
    ok(g.d.ficha?.dados?.arvore?.preenchidas?.['tp-haki-arm-1']?.nome === 'Punho Negro', `${disp}: salvo na ficha`)
    await c.close()
  }
  const c = await b.newContext({ viewport: { width: 1366, height: 860 } }); await c.addInitScript(i => { try { localStorage.setItem('prg-aventureiro-selecionado-v1', i) } catch {} }, R)
  const p = await c.newPage(); p.on('pageerror', e => erros.push(e.message))
  await p.goto(B + '/sistemas/criar?id=' + ID, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2600)
  ok(await p.getByText('Tudo certo').count() === 1, 'construtor: o Raijin abre o Two Piece sem problemas')
  ok(await p.getByRole('button', { name: /Salvar/ }).count() >= 1, 'construtor: só o dono edita (botão Salvar)')
  ok(!erros.length, 'sem erros na página ' + erros.join(' | '))
  await b.close()
})()
