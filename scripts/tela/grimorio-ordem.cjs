// v0.36.9: Grimório da Ordem com os rituais do Livro de Regras (resumo nosso, custo por círculo) e aprender um ritual.
// Uso: NODE_PATH=$(npm root -g) node scripts/tela/grimorio-ordem.cjs <pasta>  (servidor local em :3000, banco de teste).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium, devices } = require('playwright')
const B = 'http://localhost:3000', J = '22222222-2222-4222-8222-222222222222', O = process.argv[2] || '.'
const call = async (q, m, c, body) => { const r = await fetch(B + '/api/prg/' + c, { method: m, headers: { 'content-type': 'application/json', 'x-prg-aventureiro': q, origin: B }, body: body && JSON.stringify(body) }); let d = {}; try { d = await r.json() } catch {} return { s: r.status, d } }
const ok = (c, m) => { if (!c) { console.log('✘ ' + m); process.exitCode = 1 } else console.log('✓ ' + m) }
;(async () => {
  const b = await chromium.launch(); const erros = []
  for (const [disp, opts] of [['celular', devices['Pixel 7']], ['notebook', { viewport: { width: 1366, height: 860 } }]]) {
    const f = await call(J, 'POST', 'fichas', { sistema: 'ordem-paranormal', dados: { nome: 'Agente ' + disp, campos: { classe: 'Ocultista', nex: 25 } } })
    const c = await b.newContext(opts); await c.addInitScript(i => { try { localStorage.setItem('prg-aventureiro-selecionado-v1', i) } catch {} }, J)
    const p = await c.newPage(); p.on('pageerror', e => erros.push(e.message)); p.on('dialog', d => d.accept())
    await p.goto(B + '/ficha?nuvem=' + f.d.ficha.id, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2800)
    await p.locator('nav[aria-label="Seções da ficha"] button').filter({ hasText: /Poderes|Rituais/ }).first().click(); await p.waitForTimeout(1000)
    ok(await p.getByText(/Grimório: 8\d rituais/).count() === 1, `${disp}: grimório com todos os rituais`)
    for (const nome of ['Eletrocussão', 'Hemofagia', 'Controle Mental', 'Fim Inevitável', 'Cinerária']) ok(await p.locator('article').filter({ hasText: nome }).count() >= 1, `${disp}: tem ${nome}`)
    ok(await p.getByText(/Livro de Regras v1\.2, p\./).count() === 0, `${disp}: sem texto nem página do livro`)
    await p.getByLabel('Buscar ritual').fill('Eletro'); await p.waitForTimeout(400)
    const art = p.locator('article').filter({ hasText: 'Eletrocussão' }).first()
    ok(await art.getByText('1 PE').count() >= 1, `${disp}: custo do 1º círculo`)
    await p.screenshot({ path: `${O}/grimorio-${disp}.png`, fullPage: disp === 'celular' })
    await art.getByRole('button', { name: /Aprender ritual/ }).click(); await p.waitForTimeout(800)
    const salvar = p.getByRole('button', { name: /^Salvar|Adicionar|Guardar/ }).last(); if (await salvar.count()) { await salvar.click(); await p.waitForTimeout(800) }
    ok(await art.getByRole('button', { name: /Ritual aprendido/ }).count() === 1 || await p.getByText('Eletrocussão').count() >= 2, `${disp}: ritual aprendido`)
    await c.close()
  }
  ok(!erros.length, 'sem erros ' + erros.join(' | '))
  await b.close()
})()
