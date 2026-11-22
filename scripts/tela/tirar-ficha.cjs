// v0.36.7: no painel da campanha, o mestre tira a ficha de um jogador (volta para ele) ou exclui de vez digitando o nome.
// Uso: NODE_PATH=$(npm root -g) node scripts/tela/tirar-ficha.cjs <pasta>  (servidor local em :3000, banco de teste).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium, devices } = require('playwright')
const B = 'http://localhost:3000', M = '11111111-1111-4111-8111-111111111111', J = '22222222-2222-4222-8222-222222222222', O = process.argv[2] || '.'
const call = async (q, m, c, body) => { const r = await fetch(B + '/api/prg/' + c, { method: m, headers: { 'content-type': 'application/json', 'x-prg-aventureiro': q, origin: B }, body: body && JSON.stringify(body) }); let d = {}; try { d = await r.json() } catch {} return { s: r.status, d } }
const ok = (c, m) => { if (!c) { console.log('✘ ' + m); process.exitCode = 1 } else console.log('✓ ' + m) }
;(async () => {
  let r = await call(M, 'POST', 'campanhas', { nome: 'Mesa do Painel', sistema: 'tormenta20', modeloPadrao: 'C' }); const cid = r.d.campanha.id
  r = await call(M, 'POST', `campanhas/${cid}/convites`, {}); await call(J, 'POST', 'convites/' + r.d.convite.codigo, {})
  r = await call(M, 'GET', 'campanhas/' + cid); for (const s of r.d.solicitacoes) await call(M, 'POST', `campanhas/${cid}/solicitacoes/${s.id}`, { decisao: 'aceitar' })
  for (const nome of ['Lyra', 'Borin']) await call(M, 'POST', `campanhas/${cid}/fichas`, { tipo: 'jogador', jogadorId: J, sistema: 'tormenta20', nome })
  const b = await chromium.launch(); const erros = []
  const c = await b.newContext(devices['Pixel 7']); await c.addInitScript(i => { try { localStorage.setItem('prg-aventureiro-selecionado-v1', i) } catch {} }, M)
  const p = await c.newPage(); p.on('pageerror', e => erros.push(e.message)); p.on('dialog', d => d.accept())
  await p.goto(B + '/central?secao=campanhas&campanha=' + cid, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000)
  const aba = p.getByRole('button', { name: /^Fichas/ }).or(p.getByRole('tab', { name: /Fichas/ })).first(); if (await aba.count()) { await aba.click(); await p.waitForTimeout(1200) }
  const lyra = p.locator('li').filter({ hasText: 'Lyra' }).last(), borin = p.locator('li').filter({ hasText: 'Borin' }).last()
  ok(await lyra.getByRole('button', { name: /Tirar da campanha/ }).count() === 1 && await lyra.getByRole('button', { name: /Excluir de vez/ }).count() === 1, 'mestre vê Tirar da campanha e Excluir de vez')
  await borin.getByRole('button', { name: /Excluir de vez/ }).click(); await p.waitForTimeout(300)
  const caixa = p.locator('[data-excluir-ficha]')
  ok(await caixa.getByRole('button', { name: /Excluir de vez/ }).isDisabled(), 'o botão só libera depois de digitar o nome')
  await caixa.getByRole('textbox').fill('borin'); await p.waitForTimeout(200)
  await p.screenshot({ path: O + '/tirar-ficha-confirmar.png' })
  await caixa.getByRole('button', { name: /Excluir de vez/ }).click(); await p.waitForTimeout(1500)
  ok(await p.locator('li').filter({ hasText: 'Borin' }).count() === 0, 'Borin foi excluída')
  await lyra.getByRole('button', { name: /Tirar da campanha/ }).click(); await p.waitForTimeout(1500)
  ok(await p.locator('li').filter({ hasText: 'Lyra' }).count() === 0, 'Lyra saiu da campanha')
  r = await call(J, 'GET', 'fichas'); ok(r.d.fichas.some(f => /^Lyra \(de Mesa do Painel\)$/.test(f.nome) && !f.campanha_id), 'Lyra voltou para o jogador como avulsa')
  ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1), 'sem rolagem para o lado')
  ok(!erros.length, 'sem erros ' + erros.join(' | '))
  await b.close()
})()
