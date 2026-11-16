// Arsenal pronto, rolagens dos itens, ações rápidas e busca no acervo do Game-Icons (v0.35.3), no celular e no computador.
// Uso: NODE_PATH=$(npm root -g) node scripts/tela/arsenal.cjs <pasta-das-fotos>  (servidor local em :3000, banco de teste).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium, devices } = require('playwright')
const B = 'http://localhost:3000', J = '22222222-2222-4222-8222-222222222222'
const O = process.argv[2] || '.'
const call = async (q, metodo, c, body) => { const r = await fetch(B + '/api/prg/' + c, { method: metodo, headers: { 'content-type': 'application/json', 'x-prg-aventureiro': q, origin: B }, body: body && JSON.stringify(body) }); let d = {}; try { d = await r.json() } catch {} return { s: r.status, d } }
const DISPOSITIVOS = [['celular', devices['Pixel 7']], ['computador', { viewport: { width: 1280, height: 800 } }]]
const ok = (c, m) => { if (!c) { console.log('✘ ' + m); process.exitCode = 1 } else console.log('✓ ' + m) }

;(async () => {
  const b = await chromium.launch()
  for (const [disp, opts] of DISPOSITIVOS) {
    const r = await call(J, 'POST', 'fichas', { sistema: 'faroeste-arcano', dados: { nome: 'Jesse ' + disp } })
    const id = r.d.ficha.id
    const ctx = await b.newContext(opts)
    await ctx.addInitScript(i => { try { localStorage.setItem('prg-aventureiro-selecionado-v1', i) } catch {} }, J)
    const p = await ctx.newPage(); const erros = []
    p.on('pageerror', e => erros.push(e.message)); p.on('dialog', d => d.accept())
    await p.goto(B + '/ficha?nuvem=' + id, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000)
    await p.screenshot({ path: `${O}/${disp}-1-acoes-vazias.png`, fullPage: true })
    await p.locator('nav[aria-label="Seções da ficha"] button', { hasText: 'Inventário' }).click(); await p.waitForTimeout(400)
    await p.getByRole('button', { name: 'Arsenal pronto' }).click(); await p.waitForTimeout(500)
    await p.getByRole('dialog', { name: 'Arsenal pronto' }).getByRole('button', { name: 'Faroeste' }).click(); await p.waitForTimeout(400)
    await p.screenshot({ path: `${O}/${disp}-2-arsenal.png` })
    const dlg = p.getByRole('dialog', { name: 'Arsenal pronto' })
    await dlg.getByRole('button', { name: 'Adicionar Espingarda' }).click(); await p.waitForTimeout(300)
    await dlg.getByRole('button', { name: 'Adicionar Revólver', exact: true }).click(); await p.waitForTimeout(300)
    await dlg.getByRole('searchbox').fill('poção'); await p.waitForTimeout(300)
    ok(await dlg.getByText('Poção de cura').count() > 0, disp + ': busca em todos os estilos')
    await dlg.getByRole('button', { name: 'Fechar' }).click(); await p.waitForTimeout(300)
    await p.locator('li', { hasText: 'Espingarda' }).getByRole('button', { name: 'Equipar' }).click(); await p.waitForTimeout(300)
    await p.locator('li', { hasText: 'Espingarda' }).getByRole('button', { name: /De longe: 1d6/ }).click(); await p.waitForTimeout(1200)
    await p.screenshot({ path: `${O}/${disp}-3-inventario.png`, fullPage: true })
    // Editar a espingarda: rolagem Acerto e ícone do acervo completo.
    await p.keyboard.press('Escape').catch(() => {})
    await p.locator('li', { hasText: 'Espingarda' }).getByRole('button', { name: 'Editar Espingarda' }).click(); await p.waitForTimeout(400)
    await p.getByRole('button', { name: 'Acerto' }).click()
    await p.getByText('🎨 Ícone e raridade').click()
    await p.getByText('🔎 Buscar entre todos os ícones do Game-Icons').click(); await p.waitForTimeout(800)
    await p.getByRole('searchbox', { name: 'Buscar ícone' }).fill('caveira'); await p.waitForTimeout(400)
    await p.getByRole('searchbox', { name: 'Buscar ícone' }).scrollIntoViewIfNeeded()
    await p.screenshot({ path: `${O}/${disp}-4-busca-icones.png` })
    await p.getByRole('group', { name: 'Ícones do acervo' }).getByRole('button').first().click()
    await p.getByRole('button', { name: 'Salvar item' }).click(); await p.waitForTimeout(800)
    await p.locator('nav[aria-label="Seções da ficha"] button', { hasText: 'Principal' }).click(); await p.waitForTimeout(600)
    const acoes = p.locator('section[aria-labelledby="titulo-acoes"]')
    await acoes.scrollIntoViewIfNeeded()
    ok(await acoes.getByText('Espingarda').count() === 1, disp + ': espingarda equipada nas ações rápidas')
    ok(await acoes.getByText('Revólver').count() === 0, disp + ': revólver não equipado fica de fora')
    await acoes.getByRole('button', { name: /Rolar Acerto de Espingarda/ }).click(); await p.waitForTimeout(1200)
    await p.screenshot({ path: `${O}/${disp}-5-acoes.png` })
    await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
    ok(await p.locator('section[aria-labelledby="titulo-acoes"]').getByRole('button', { name: /Acerto de Espingarda: 1d20/ }).count() === 1, disp + ': rolagem salva no servidor')
    const largura = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    ok(largura <= 1, disp + ': sem rolagem para o lado')
    ok(!erros.length, disp + ': sem erros na página ' + erros.join(' | '))
    await ctx.close()
  }
  await b.close()
})()
