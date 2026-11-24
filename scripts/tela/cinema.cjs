// v0.36.8: Cinema Secreto no notebook (anfitriã) e no celular (convidado): entrada secreta no portal, sala, fila, chat,
// lista de pessoas e passar o controle. O player do YouTube não carrega no servidor de teste (sem internet); o resto sim.
// Uso: NODE_PATH=$(npm root -g) node scripts/tela/cinema.cjs <pasta>  (servidor local em :3000, banco de teste, migração 038).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium, devices } = require('playwright')
const B = 'http://localhost:3000', M = '11111111-1111-4111-8111-111111111111', J = '22222222-2222-4222-8222-222222222222', O = process.argv[2] || '.'
const ok = (c, m) => { if (!c) { console.log('✘ ' + m); process.exitCode = 1 } else console.log('✓ ' + m) }
const semLado = p => p.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1)
;(async () => {
  const b = await chromium.launch(); const erros = []
  const abrir = async (opts, id) => { const c = await b.newContext(opts); await c.addInitScript(i => { try { localStorage.setItem('prg-aventureiro-selecionado-v1', i) } catch {} }, id)
    const p = await c.newPage(); p.on('pageerror', e => erros.push(e.message)); p.on('dialog', d => d.accept()); return p }
  const pc = await abrir({ viewport: { width: 1366, height: 860 } }, M)
  await pc.goto(B + '/portal', { waitUntil: 'domcontentloaded' }); await pc.waitForTimeout(2000)
  ok(await pc.getByRole('link', { name: 'Cinema Secreto' }).count() === 1, 'notebook: a entrada secreta existe no portal (escondida)')
  await pc.goto(B + '/cinema', { waitUntil: 'domcontentloaded' }); await pc.waitForTimeout(1500)
  await pc.getByLabel('Nome da sala').fill('Sessão da madrugada'); await pc.getByRole('button', { name: 'Abrir sala' }).click(); await pc.waitForTimeout(1500)
  ok(await pc.getByText('👑 Você é o anfitrião').count() === 1, 'notebook: sala aberta, anfitriã')
  const cod = new URL(pc.url()).searchParams.get('sala')
  ok(/^[A-F0-9]{16}$/.test(cod || ''), 'o endereço vira o link de convite')
  await pc.getByRole('tab', { name: /Fila/ }).click(); await pc.getByLabel('Link do YouTube').fill('https://youtu.be/dQw4w9WgXcQ'); await pc.getByLabel('Título (opcional)').fill('Abertura')
  await pc.getByRole('button', { name: 'Adicionar à fila' }).click(); await pc.waitForTimeout(800)
  await pc.getByRole('button', { name: 'Passar' }).first().click(); await pc.waitForTimeout(800)
  ok(await pc.getByText('Abertura').count() >= 1, 'notebook: vídeo na fila e escolhido')
  // convidado no celular, pelo link
  const cel = await abrir(devices['Pixel 7'], J)
  await cel.goto(B + '/cinema?sala=' + cod, { waitUntil: 'domcontentloaded' }); await cel.waitForTimeout(3000)
  ok(await cel.getByText(/Espectador · anfitrião: Mestra Lua/).count() === 1, 'celular: entra pelo link como espectador')
  ok(await cel.getByRole('button', { name: /Pausar/ }).count() === 0, 'celular: espectador não vê os controles')
  await cel.getByLabel('Mensagem', { exact: true }).fill('boa noite, pessoal!'); await cel.getByRole('button', { name: 'Enviar mensagem' }).click(); await cel.waitForTimeout(3500)
  await pc.getByRole('tab', { name: /Chat/ }).click(); await pc.waitForTimeout(300)
  ok(await pc.getByText('boa noite, pessoal!').count() === 1, 'notebook: a mensagem do celular chega no chat')
  await pc.getByLabel('Mensagem', { exact: true }).fill('pipoca pronta 🍿'); await pc.getByRole('button', { name: 'Enviar mensagem' }).click(); await cel.waitForTimeout(3500)
  ok(await cel.getByText('pipoca pronta 🍿').count() === 1, 'celular: a resposta chega')
  await pc.getByRole('tab', { name: /Pessoas/ }).click(); await pc.waitForTimeout(400)
  ok(await pc.locator('[data-pessoa]').count() === 2, 'notebook: duas pessoas na sala')
  await pc.screenshot({ path: O + '/cinema-notebook.png' })
  await cel.screenshot({ path: O + '/cinema-celular.png', fullPage: true })
  ok(await semLado(cel) && await semLado(pc), 'sem rolagem para o lado')
  await pc.locator('[data-pessoa="Jogador Sol"]').getByRole('button', { name: /Passar controle/ }).click(); await cel.waitForTimeout(3500)
  ok(await cel.getByText('👑 Você é o anfitrião').count() === 1 && await cel.getByRole('button', { name: /Pausar/ }).count() === 1, 'celular: recebeu o controle')
  ok(await pc.getByText(/Espectador · anfitrião: Jogador Sol/).count() === 1, 'notebook: virou espectador')
  await cel.screenshot({ path: O + '/cinema-celular-anfitriao.png' })
  ok(!erros.length, 'sem erros na página ' + erros.join(' | '))
  await b.close()
})()
