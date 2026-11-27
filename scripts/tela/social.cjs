// v0.37.0: convite pelo @, desvincular personagem, @ no perfil, balão de feedback e Homenagem a Leste (celular e computador).
// Uso: NODE_PATH=$(npm root -g) node scripts/tela/social.cjs <pasta>  (servidor local em :3000, banco de teste).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium, devices } = require('playwright')
const B = 'http://localhost:3000', M = '11111111-1111-4111-8111-111111111111', J = '22222222-2222-4222-8222-222222222222', O = process.argv[2] || '.'
const call = async (q, m, c, body) => { const r = await fetch(B + '/api/prg/' + c, { method: m, headers: { 'content-type': 'application/json', 'x-prg-aventureiro': q, origin: B }, body: body && JSON.stringify(body) }); let d = {}; try { d = await r.json() } catch {} return { s: r.status, d } }
const ok = (c, m) => { if (!c) { console.log('✘ ' + m); process.exitCode = 1 } else console.log('✓ ' + m) }
const semRolagem = p => p.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1)
;(async () => {
  let r = await call(M, 'POST', 'campanhas', { nome: 'Mesa do Arroba', sistema: 'tormenta20', modeloPadrao: 'C' }); const cid = r.d.campanha.id
  const b = await chromium.launch(); const erros = []
  const abrir = async (quem, disp, url) => {
    const c = await b.newContext(disp); await c.addInitScript(i => { try { localStorage.setItem('prg-aventureiro-selecionado-v1', i) } catch {} }, quem)
    const p = await c.newPage(); p.on('pageerror', e => erros.push(e.message)); p.on('dialog', d => d.accept())
    await p.goto(B + url, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000); return p
  }

  // Mestre convida pelo @ (celular)
  let p = await abrir(M, devices['Pixel 7'], '/central?secao=campanhas&campanha=' + cid)
  const campo = p.locator('[data-convidar-arroba] input'); await campo.scrollIntoViewIfNeeded(); await campo.fill('jog'); await p.waitForTimeout(1200)
  const opc = p.getByRole('option', { name: /Jogador Sol/ })
  ok(await opc.count() === 1, 'digitando “jog” aparece o Jogador Sol com o @')
  await p.screenshot({ path: O + '/social-1-sugestao.png' })
  await opc.click(); await p.waitForTimeout(1500)
  ok(await p.getByText('@jogador_sol').first().isVisible(), 'o convite pelo @ aparece na lista')
  await p.locator('[data-convidar-arroba]').scrollIntoViewIfNeeded(); await p.screenshot({ path: O + '/social-2-convite-enviado.png' })
  ok(await semRolagem(p), 'campanha sem rolagem para o lado (celular)')
  await p.context().close()

  // Jogador aceita pelo sino/link e desvincula
  r = await call(J, 'GET', 'notificacoes'); const link = (r.d.itens || []).map(n => n.link).find(l => l && l.startsWith('/convite/'))
  ok(!!link, 'o jogador recebeu o convite no sino')
  p = await abrir(J, devices['Pixel 7'], link)
  await p.screenshot({ path: O + '/social-3-aceitar.png' })
  await p.getByRole('button', { name: /Aceitar convite/ }).click(); await p.waitForTimeout(1500)
  ok(await p.getByText(/Você entrou na campanha/).isVisible(), 'aceitou e entrou direto')
  await p.screenshot({ path: O + '/social-4-entrou.png' })
  await call(M, 'POST', `campanhas/${cid}/fichas`, { tipo: 'jogador', jogadorId: J, sistema: 'tormenta20', nome: 'Lyra' })
  await p.goto(B + '/central?secao=personagens', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
  await p.getByRole('tab', { name: /Em campanhas/ }).click(); await p.waitForTimeout(1500)
  const bt = p.locator('[data-desvincular]').first()
  ok(await bt.isVisible(), 'o jogador vê “Desvincular” nas fichas de campanha')
  await bt.scrollIntoViewIfNeeded(); await p.screenshot({ path: O + '/social-5-desvincular.png' })
  await bt.click(); await p.waitForTimeout(1800)
  r = await call(J, 'GET', 'fichas'); ok(r.d.fichas.some(f => f.nome === 'Lyra (de Mesa do Arroba)' && !f.campanha_id), 'Lyra voltou como avulsa')

  // Canto: homenagem e feedback (celular, acima da barra)
  const canto = p.locator('[data-canto-plataforma]')
  const caixa = await canto.boundingBox(), barra = await p.locator('nav[aria-label="Atalhos da Central"]').boundingBox()
  ok(caixa && barra && caixa.y + caixa.height <= barra.y, 'o canto fica acima da barra de atalhos no celular')
  await p.screenshot({ path: O + '/social-6-canto-celular.png' })
  await p.locator('[data-homenagem-leste]').click(); await p.waitForTimeout(400)
  ok(await p.getByRole('link', { name: /Ver o código no GitHub/ }).getAttribute('href') === 'https://github.com/WedNyx/PRG_System', 'a homenagem leva ao GitHub')
  await p.screenshot({ path: O + '/social-7-homenagem.png' })
  await p.keyboard.press('Escape'); await p.getByRole('button', { name: 'Fechar' }).click().catch(() => {}); await p.waitForTimeout(300)
  await p.locator('[data-abrir-feedback]').click(); await p.waitForTimeout(400)
  await p.getByRole('radio', { name: /Problema/ }).click(); await p.locator('[data-form-feedback] textarea').fill('O botão de dados some quando giro o celular.')
  await p.screenshot({ path: O + '/social-8-feedback.png' })
  await p.getByRole('button', { name: /^Enviar/ }).click(); await p.waitForTimeout(1200)
  ok(await p.getByText(/Recebido!/).isVisible(), 'feedback enviado')
  await p.context().close()

  // Computador: perfil com o @ e editar
  p = await abrir(J, { viewport: { width: 1366, height: 800 } }, '/central?secao=perfil&aba=conta')
  ok(await p.locator('[data-meu-arroba]').first().textContent() === '@jogador_sol', 'o perfil mostra o @')
  await p.getByRole('button', { name: /Editar apelido/ }).first().click(); await p.waitForTimeout(500)
  ok(await p.locator('[data-campo-usuario]').inputValue() === 'jogador_sol', 'editar perfil tem o campo do @')
  await p.screenshot({ path: O + '/social-9-editar-arroba.png' })
  await p.keyboard.press('Escape'); await p.waitForTimeout(300)
  await p.screenshot({ path: O + '/social-10-canto-pc.png' })
  ok(await semRolagem(p), 'sem rolagem para o lado (computador)')
  await p.context().close()

  // Portal: só a homenagem (sem perfil, sem balão)
  p = await abrir(J, devices['Pixel 7'], '/portal')
  ok(await p.locator('[data-homenagem-leste]').isVisible() && await p.locator('[data-abrir-feedback]').count() === 0, 'no portal aparece só a homenagem')
  await p.context().close()

  ok(!erros.length, 'sem erros ' + erros.join(' | '))
  await b.close()
})()
