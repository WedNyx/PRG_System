// Estúdio da ficha (v0.36.6): o autor monta a ficha do sistema (abas, partes, larguras, nomes, cores e formatos) com prévia ao vivo,
// salva, e uma ficha de verdade do sistema aparece montada no computador e no celular.
// Uso: NODE_PATH=$(npm root -g) node scripts/tela/estudio.cjs <pasta>  (servidor local em :3000, banco de teste).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium, devices } = require('playwright')
const B = 'http://localhost:3000', J = '22222222-2222-4222-8222-222222222222', O = process.argv[2] || '.'
const call = async (q, m, c, body) => { const r = await fetch(B + '/api/prg/' + c, { method: m, headers: { 'content-type': 'application/json', 'x-prg-aventureiro': q, origin: B }, body: body && JSON.stringify(body) }); let d = {}; try { d = await r.json() } catch {} return { s: r.status, d } }
const ok = (c, m) => { if (!c) { console.log('✘ ' + m); process.exitCode = 1 } else console.log('✓ ' + m) }
const semLado = p => p.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1)

;(async () => {
  const b = await chromium.launch(); const erros = []
  const contexto = async opts => { const c = await b.newContext(opts); await c.addInitScript(i => { try { localStorage.setItem('prg-aventureiro-selecionado-v1', i) } catch {} }, J)
    const p = await c.newPage(); p.on('pageerror', e => erros.push(e.message)); p.on('dialog', d => d.accept()); return { c, p } }
  // ---- Computador: montar no estúdio
  const { c, p } = await contexto({ viewport: { width: 1366, height: 860 } })
  await p.goto(B + '/sistemas/criar', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  await p.getByRole('button', { name: /Começar com um exemplo simples/ }).click(); await p.waitForTimeout(1200)
  await p.getByRole('textbox', { name: 'Nome' }).first().fill('Crônicas do Estúdio').catch(() => {})
  await p.getByRole('button', { name: /Estúdio da ficha/ }).first().click(); await p.waitForTimeout(300)
  await p.locator('[data-abrir-estudio]').click(); await p.waitForTimeout(1200)
  const dlg = p.getByRole('dialog', { name: 'Estúdio da ficha' })
  ok(await dlg.count() === 1, 'o estúdio abre em tela cheia')
  const previa = dlg.locator('main[aria-label="Prévia da ficha"]')
  ok(await previa.locator('[data-ficha-autor], [data-visual]').count() >= 1, 'prévia ao vivo com a ficha de teste')
  await dlg.getByRole('button', { name: 'Esconder Ações rápidas' }).click(); await p.waitForTimeout(300)
  for (const [bloco, larg] of [['identidade', '½'], ['recursos', '½']]) {
    await dlg.locator(`[data-caixa="${bloco}"] button.flex-1`).click(); await p.waitForTimeout(200)
    await dlg.locator('[data-inspetor]').getByRole('button', { name: larg, exact: true }).click(); await p.waitForTimeout(300)
  }
  await dlg.locator('[data-inspetor]').getByLabel('Nome na ficha').fill('Vida e poder'); await p.waitForTimeout(300)
  // arrastar pelo teclado: Valores e recursos para cima
  const antes = await dlg.locator('[data-grade-estudio] li').evaluateAll(l => l.map(x => x.getAttribute('data-caixa')).join(','))
  await dlg.getByRole('button', { name: 'Arrastar Vida e poder' }).focus(); await p.keyboard.press('Space'); await p.waitForTimeout(200)
  for (let i = 0; i < 1; i++) { await p.keyboard.press('ArrowUp'); await p.waitForTimeout(150) }
  await p.keyboard.press('Space'); await p.waitForTimeout(500)
  const depois = await dlg.locator('[data-grade-estudio] li').evaluateAll(l => l.map(x => x.getAttribute('data-caixa')).join(','))
  ok(antes !== depois, `arrastar muda a ordem das partes (${antes} → ${depois})`)
  await dlg.getByRole('button', { name: 'Esconder a aba Anotações e regras' }).click()
  await dlg.getByLabel('Ícone de Inventário').fill('🗡️'); await p.waitForTimeout(300)
  await dlg.getByRole('tab', { name: /Cores/ }).click(); await dlg.getByRole('button', { name: /Neon/ }).click(); await p.waitForTimeout(300)
  await dlg.getByRole('tab', { name: /Formatos/ }).click(); await dlg.getByRole('button', { name: 'Hexágono' }).click(); await p.waitForTimeout(600)
  const ficha = previa.locator('[data-ficha-autor]')
  ok(await ficha.count() === 1, 'a prévia usa a aparência do autor')
  ok(await previa.locator('[data-bloco="acoes"]').evaluate(e => getComputedStyle(e).display === 'none').catch(() => true), 'parte escondida some da prévia')
  ok(await previa.locator('[data-bloco="identidade"]').evaluate(e => getComputedStyle(e).gridColumnStart) === 'span 6', 'identidade ocupa metade da linha no computador')
  ok(await previa.getByRole('heading', { name: 'Vida e poder' }).count() === 1, 'nome novo da parte aparece na ficha')
  ok(await previa.locator('nav[aria-label="Seções da ficha"] button').filter({ hasText: /Anotações/ }).count() === 0 && await previa.locator('nav[aria-label="Seções da ficha"]').getByText('🗡️').count() >= 1, 'aba escondida some e o ícone novo aparece')
  ok(await previa.locator('[data-bloco="recursos"]').evaluate(e => +getComputedStyle(e).order < +getComputedStyle(e.parentElement.querySelector('[data-bloco="identidade"]')).order), 'a ordem arrastada vale na prévia')
  await p.screenshot({ path: `${O}/estudio-computador.png` })
  await dlg.getByRole('tab', { name: /Partes/ }).click()
  await dlg.locator('[data-aba-estudio="atributos"]').getByRole('button', { name: 'Montar' }).click(); await p.waitForTimeout(700)
  ok(await previa.locator('[data-secao="atributos"]').count() === 1, 'Montar abre a mesma aba na prévia')
  ok(await previa.locator('.ficha-atributo-percentual').first().evaluate(e => getComputedStyle(e).clipPath.startsWith('polygon')), 'atributos em hexágono')
  await p.screenshot({ path: `${O}/estudio-atributos.png` })
  await dlg.getByRole('button', { name: /Pronto/ }).click(); await p.waitForTimeout(400)
  await p.getByRole('button', { name: /Salvar/ }).first().click(); await p.waitForURL(/id=autoral-/, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(1500)
  const id = new URL(p.url()).searchParams.get('id')
  ok(!!id, 'sistema salvo com a montagem')
  if (!await p.locator('[data-abrir-estudio]').isVisible()) await p.getByRole('button', { name: /Estúdio da ficha/ }).first().click()
  await p.waitForTimeout(300)
  ok(await p.getByText(/parte\(s\) arrumada\(s\)/).count() === 1, 'o construtor resume o que foi personalizado')
  await c.close()
  // ---- Ficha de verdade do sistema
  const f = await call(J, 'POST', 'fichas', { sistema: id, dados: { nome: 'Lyra do Estúdio' } })
  ok(f.s < 300 && f.d.ficha?.id, 'ficha criada no sistema')
  for (const [disp, opts] of [['computador', { viewport: { width: 1366, height: 860 } }], ['celular', devices['Pixel 7']]]) {
    const { c, p } = await contexto(opts)
    await p.goto(B + '/ficha?nuvem=' + f.d.ficha.id, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2800)
    ok(await p.locator('[data-ficha-autor]').count() === 1, `${disp}: a ficha usa a montagem do autor`)
    const col = await p.locator('[data-bloco="identidade"]').evaluate(e => getComputedStyle(e).gridColumnStart)
    ok(disp === "celular" ? col !== "span 6" : col === "span 6", `${disp}: largura certa da identidade (${col})`)
    ok(await p.locator('[data-bloco="acoes"]').evaluate(e => getComputedStyle(e).display === 'none').catch(() => true), `${disp}: parte escondida continua escondida`)
    ok(await semLado(p), `${disp}: sem rolagem para o lado`)
    await p.screenshot({ path: `${O}/estudio-ficha-${disp}.png`, fullPage: disp === 'celular' })
    if (disp === 'celular') {
      await p.goto(B + '/sistemas/criar?id=' + id, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
      await p.getByRole('button', { name: /Estúdio da ficha/ }).first().click(); await p.locator('[data-abrir-estudio]').click(); await p.waitForTimeout(1000)
      const d2 = p.getByRole('dialog', { name: 'Estúdio da ficha' })
      ok(await semLado(p), 'celular: estúdio sem rolagem para o lado')
      await p.screenshot({ path: `${O}/estudio-celular-editar.png` })
      await d2.getByRole('tab', { name: /Prévia/ }).click(); await p.waitForTimeout(800)
      ok(await d2.locator('main[aria-label="Prévia da ficha"]').isVisible(), 'celular: botão Prévia mostra a ficha')
      await p.screenshot({ path: `${O}/estudio-celular-previa.png` })
    }
    await c.close()
  }
  ok(!erros.length, 'sem erros na página ' + erros.join(' | '))
  await b.close()
})()
