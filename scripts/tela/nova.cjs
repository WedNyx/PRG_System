// Sistema autoral com graus de dado, perícias livres, tabelas e regras (v0.35.6): Projeto N.O.V.A do godgamer.
// Uso: NODE_PATH=$(npm root -g) node scripts/tela/nova.cjs <pasta> (servidor local em :3000; perfil godgamer = 4444… e migração 034 aplicada).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium, devices } = require('playwright')
const B = 'http://localhost:3000', O = process.argv[2] || '.'
const G = '44444444-4444-4444-8444-444444444444', J = '22222222-2222-4222-8222-222222222222'
const ID = 'autoral-4e0a7c1d2b6f4c8e9a3d5f1e2d3c4b5a'
const call = async (q, metodo, c, body) => { const r = await fetch(B + '/api/prg/' + c, { method: metodo, headers: { 'content-type': 'application/json', 'x-prg-aventureiro': q, origin: B }, body: body && JSON.stringify(body) }); let d = {}; try { d = await r.json() } catch {} return { s: r.status, d } }
const ok = (c, m) => { if (!c) { console.log('✘ ' + m); process.exitCode = 1 } else console.log('✓ ' + m) }

;(async () => {
  const b = await chromium.launch(); const erros = []
  const pagina = async (quem, url, opts = devices['Pixel 7']) => {
    const c = await b.newContext(opts)
    await c.addInitScript(i => { try { localStorage.setItem('prg-aventureiro-selecionado-v1', i) } catch {} }, quem)
    const p = await c.newPage(); p.on('pageerror', e => erros.push(e.message)); p.on('dialog', d => d.accept())
    await p.goto(B + url, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500); return p
  }
  // 1) Só o godgamer edita.
  let r = await call(J, 'POST', 'sistemas', { acao: 'salvar', uuid: '4e0a7c1d-2b6f-4c8e-9a3d-5f1e2d3c4b5a', definicao: { nome: 'Roubado', atributos: [{ nome: 'X' }] } })
  ok(r.s === 403, 'outro perfil não edita o N.O.V.A')
  r = await call(J, 'GET', 'sistemas')
  ok(r.d.sistemas?.some(s => s.id === ID && s.autor === 'godgamer' && !s.meu), 'aparece nos sistemas autorais, com o nome do godgamer')
  // 2) Construtor aberto pelo godgamer.
  let p = await pagina(G, '/sistemas/criar?id=' + ID)
  ok(await p.getByText('Tudo certo: as fórmulas calculam').count() === 1, 'o construtor abre o N.O.V.A sem problemas')
  await p.screenshot({ path: O + '/1-construtor-sobre.png', fullPage: true })
  for (const [sec, arq] of [[/Atributos/, '2-construtor-atributos'], [/Regras do sistema/, '3-construtor-regras'], [/Tabelas para rolar/, '4-construtor-tabelas']]) {
    await p.getByRole('button', { name: sec }).first().click(); await p.waitForTimeout(400)
    await p.screenshot({ path: `${O}/${arq}.png`, fullPage: true })
  }
  // Muda o resumo e salva: o godgamer pode mudar o que quiser.
  await p.getByRole('button', { name: /Sobre o sistema/ }).click(); await p.waitForTimeout(300)
  await p.getByRole('textbox', { name: 'Descrição curta' }).fill('RPG misto de investigação e combate. Editado pelo autor.')
  await p.getByRole('button', { name: 'Salvar' }).click(); await p.waitForTimeout(1500)
  r = await call(G, 'GET', 'sistemas/' + ID)
  ok(r.d.sistema?.resumo?.includes('Editado pelo autor') && r.d.sistema?.regras?.length === 7 && r.d.sistema?.tabelas?.length === 1 && r.d.sistema?.graus, 'o godgamer salva e nada se perde (regras, tabela, graus)')
  await p.getByRole('button', { name: 'Prévia' }).click(); await p.waitForTimeout(800)
  await p.screenshot({ path: O + '/5-construtor-previa.png', fullPage: true })
  await p.context().close()
  // 3) Ficha de um jogador no N.O.V.A.
  r = await call(J, 'POST', 'fichas', { sistema: ID, dados: { nome: 'Íris' } }); const fid = r.d.ficha?.id
  ok(!!fid, 'jogador cria ficha no N.O.V.A')
  p = await pagina(J, '/ficha?nuvem=' + fid)
  await p.screenshot({ path: O + '/6-ficha-principal.png', fullPage: true })
  await p.locator('nav[aria-label="Seções da ficha"] button', { hasText: 'Atributos e vivências' }).click(); await p.waitForTimeout(500)
  await p.getByRole('combobox', { name: 'Grau de Físico' }).selectOption('8')
  await p.getByRole('textbox', { name: /Nova vivências/i }).fill('Investigação'); await p.getByRole('button', { name: 'Criar' }).click(); await p.waitForTimeout(400)
  await p.getByRole('combobox', { name: 'Grau de Investigação' }).selectOption('6')
  await p.getByRole('combobox', { name: 'Atributo' }).selectOption('PSI')
  await p.getByRole('combobox', { name: 'Vivência' }).selectOption({ label: 'Investigação (d6)' })
  await p.getByRole('button', { name: 'Rolar', exact: true }).click(); await p.waitForTimeout(1500)
  await p.screenshot({ path: O + '/7-ficha-atributos.png', fullPage: false })
  await p.keyboard.press('Escape'); await p.waitForTimeout(800)
  await p.screenshot({ path: O + '/8-ficha-atributos-toda.png', fullPage: true })
  await p.locator('nav[aria-label="Seções da ficha"] button', { hasText: 'Anotações' }).click(); await p.waitForTimeout(500)
  await p.getByRole('button', { name: /Rolar 1d10/ }).click(); await p.waitForTimeout(500)
  await p.getByRole('button', { name: /Guardar em/ }).click(); await p.waitForTimeout(300)
  await p.getByText('Dados especiais').click(); await p.waitForTimeout(300)
  await p.screenshot({ path: O + '/9-ficha-regras.png', fullPage: true })
  await p.waitForTimeout(2500)
  r = await call(J, 'GET', 'fichas/' + fid); const d = r.d.ficha?.dados
  ok(d?.atributos?.FIS === 8 && d?.periciasExtras?.[0]?.nome === 'Investigação' && d?.pericias?.[d.periciasExtras[0].id] === 6 && !!d?.campos?.efeito_especial, 'a ficha salva graus, vivência criada e o efeito do dado especial')
  ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1, 'sem rolagem para o lado')
  ok(!erros.length, 'sem erros na página ' + erros.join(' | '))
  await b.close()
})()
