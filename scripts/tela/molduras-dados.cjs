// v0.37.1: escolher moldura e dados em Perfil › Aparência; moldura no portal, na Central e na campanha; cartão da rolagem com o estilo.
// Uso: NODE_PATH=$(npm root -g) node scripts/tela/molduras-dados.cjs <pasta>  (servidor local em :3000, banco de teste).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium, devices } = require('playwright')
const B = 'http://localhost:3000', M = '11111111-1111-4111-8111-111111111111', J = '22222222-2222-4222-8222-222222222222', O = process.argv[2] || '.'
const call = async (q, m, c, body, raiz = '/api/prg/') => { const r = await fetch(B + raiz + c, { method: m, headers: { 'content-type': 'application/json', 'x-prg-aventureiro': q, origin: B }, body: body && JSON.stringify(body) }); let d = {}; try { d = await r.json() } catch {} return { s: r.status, d } }
const ok = (c, m) => { if (!c) { console.log('✘ ' + m); process.exitCode = 1 } else console.log('✓ ' + m) }
;(async () => {
  let r = await call(M, 'POST', 'campanhas', { nome: 'Mesa das Molduras', sistema: 'tormenta20', modeloPadrao: 'C' }); const cid = r.d.campanha.id
  r = await call(M, 'POST', `campanhas/${cid}/convites`, { usuario: 'jogador_sol' }); await call(J, 'POST', 'convites/' + r.d.convite.codigo, {})
  await call(M, 'PATCH', M, { visual: { moldura: 'mestre', dado: 'ouro' } }, '/api/aventureiros/')
  const b = await chromium.launch(); const erros = []
  const abrir = async (quem, disp, url) => {
    const c = await b.newContext(disp); await c.addInitScript(i => { try { localStorage.setItem('prg-aventureiro-selecionado-v1', i) } catch {} }, quem)
    const p = await c.newPage(); p.on('pageerror', e => erros.push(e.message)); p.on('dialog', d => d.accept())
    await p.goto(B + url, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000); return p
  }
  // Jogador escolhe no celular
  let p = await abrir(J, devices['Pixel 7'], '/central?secao=perfil&aba=aparencia')
  const sec = p.locator('[data-escolher-moldura]'); await sec.scrollIntoViewIfNeeded()
  ok(await sec.getByRole('button', { name: /Coroa do Mestre/ }).isDisabled() && await sec.getByRole('button', { name: /Escamas do Dragão/ }).isDisabled(), 'as especiais aparecem travadas para o jogador')
  await sec.getByRole('button', { name: /Chamas/ }).click(); await p.waitForTimeout(400)
  await p.screenshot({ path: O + '/md-1-molduras.png' })
  const sd = p.locator('[data-escolher-dado]'); await sd.scrollIntoViewIfNeeded()
  await sd.getByRole('button', { name: /Esmeralda/ }).click(); await p.waitForTimeout(1600)
  await p.screenshot({ path: O + '/md-2-dados.png' })
  r = await call(J, 'GET', '', undefined, '/api/aventureiros'); const v = r.d.perfis.find(x => x.id === J)?.visual
  ok(v?.moldura === 'chamas' && v?.dado === 'esmeralda', 'escolhas salvas no perfil')
  ok(await p.locator('header [data-moldura="chamas"]').count() > 0, 'a moldura aparece na hora no topo da Central')
  ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1), 'sem rolagem para o lado (celular)')
  await p.context().close()

  // Campanha (mestre no computador): participantes com moldura
  p = await abrir(M, { viewport: { width: 1366, height: 860 } }, '/central?secao=campanhas&campanha=' + cid)
  const parts = p.locator('section').filter({ hasText: 'Participantes' }).first(); await parts.scrollIntoViewIfNeeded()
  ok(await parts.locator('[data-moldura="chamas"]').count() === 1 && await parts.locator('[data-moldura="mestre"]').count() === 1, 'participantes aparecem com as molduras')
  await parts.screenshot({ path: O + '/md-3-participantes.png' })
  await p.context().close()

  // Portal
  p = await abrir(J, { viewport: { width: 1366, height: 860 } }, '/portal')
  const lun = p.getByRole('button', { name: /Lunethernnyis/ }).first(); if (await lun.count()) { await lun.click(); await p.waitForTimeout(1200) }
  ok(await p.locator('[data-moldura]').count() >= 1, 'no portal os perfis aparecem com moldura')
  await p.screenshot({ path: O + '/md-4-portal.png' })
  await p.context().close()

  ok(!erros.length, 'sem erros ' + erros.join(' | '))
  await b.close()
})()
