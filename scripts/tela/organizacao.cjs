// Organização das fichas (v0.36.1): menu em grade, resumo fixo, Árvore Yggdrasil, Arsenal, editor de itens em 3 etapas,
// poderes por sistema, somente leitura e salvamento. Uso: NODE_PATH=$(npm root -g) node scripts/tela/organizacao.cjs <pasta>
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium, devices } = require('playwright')
const B = 'http://localhost:3000', O = process.argv[2] || '.'
const J = '22222222-2222-4222-8222-222222222222', M = '11111111-1111-4111-8111-111111111111'
const call = async (q, m, c, body) => { const r = await fetch(B + '/api/prg/' + c, { method: m, headers: { 'content-type': 'application/json', 'x-prg-aventureiro': q, origin: B }, body: body && JSON.stringify(body) }); let d = {}; try { d = await r.json() } catch {} return { s: r.status, d } }
const ok = (c, m) => { if (!c) { console.log('✘ ' + m); process.exitCode = 1 } else console.log('✓ ' + m) }
const DISP = [['celular', devices['Pixel 7']], ['pequeno', { viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true }], ['computador', { viewport: { width: 1280, height: 900 } }]]
const ficha = async (sistema, dados, quem = J) => (await call(quem, 'POST', 'fichas', { sistema, dados: { nome: 'Teste', ...dados } })).d.ficha?.id
;(async () => {
  const b = await chromium.launch(); const erros = []
  const abrir = async (opts, id, quem = J) => {
    const c = await b.newContext(opts); await c.addInitScript(i => localStorage.setItem('prg-aventureiro-selecionado-v1', i), quem)
    const p = await c.newPage(); p.on('pageerror', e => erros.push(e.message)); p.on('dialog', x => x.accept())
    await p.goto(B + '/ficha?nuvem=' + id, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500); return { c, p }
  }
  const nav = p => p.locator('nav[aria-label="Seções da ficha"] button')
  const aba = async (p, re) => { await nav(p).filter({ hasText: re }).first().click(); await p.waitForTimeout(600) }
  const semLado = async p => p.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1)

  // 1–2. Menus e resumo fixo em vários sistemas e telas
  const sistemas = ['dnd5e-srd', 'pf2e', 'ordem-paranormal', 'fate-core', 'call-of-cthulhu', 'livre']
  const ids = {}
  for (const s of sistemas) ids[s] = await ficha(s, { nome: 'Menu ' + s, ...(s === 'dnd5e-srd' ? { campos: { classe: 'Guerreiro', nivel: 3, especie: 'Humano', antecedente: 'Soldado' } } : {}) })
  ids.dnd2014 = await ficha('dnd5e-srd', { nome: 'Borin 2014', dndLivros: { base: 'phb2014', suplementos: [] }, campos: { classe: 'Guerreiro', nivel: 3, especie: 'Anão', subraca2014: 'Anão da Colina', antecedente: 'Soldado' } })
  for (const [disp, opts] of DISP) for (const s of sistemas) {
    const { c, p } = await abrir(opts, ids[s])
    const botoes = await nav(p).count()
    const cortados = await nav(p).evaluateAll(bs => bs.filter(x => x.scrollWidth > x.clientWidth + 1 || x.getBoundingClientRect().right > innerWidth + 1).map(x => x.textContent))
    ok(botoes >= (s === 'livre' ? 4 : 5) && !cortados.length, `${disp}/${s}: ${botoes} botões no menu, nenhum cortado ${cortados.join(',')}`)
    let tudoOk = true
    for (let i = 0; i < botoes; i++) { await nav(p).nth(i).click(); await p.waitForTimeout(350); if (!(await semLado(p))) tudoOk = false
      if (!(await p.locator('aside[aria-label="Orientações da seção"]').count())) tudoOk = false }
    ok(tudoOk, `${disp}/${s}: todas as seções abrem, com orientação e sem rolagem para o lado`)
    if (disp === 'celular' && s === 'dnd5e-srd') {
      await nav(p).first().click(); await p.waitForTimeout(400)
      const alto = (await p.locator('.ficha-resumo').boundingBox()).height
      await p.screenshot({ path: O + '/menu-dnd-celular.png' })
      await p.mouse.wheel(0, 900); await p.waitForTimeout(600)
      const baixo = (await p.locator('.ficha-resumo').boundingBox()).height
      ok(baixo < alto, `resumo fixo compacta ao rolar (${Math.round(alto)} → ${Math.round(baixo)} px)`)
      ok(await p.locator('.ficha-resumo').isVisible(), 'resumo continua visível ao rolar')
      await p.screenshot({ path: O + '/resumo-compacto.png' })
    }
    await c.close()
  }

  // 7. Árvore Yggdrasil (D&D)
  for (const [disp, opts, qual] of [[...DISP[0], 'dnd5e-srd'], [...DISP[2], 'dnd5e-srd'], ['celular-2014', DISP[0][1], 'dnd2014']]) {
    const { c, p } = await abrir(opts, ids[qual])
    await aba(p, /Árvore/)
    const txt = await p.evaluate(() => document.body.innerText)
    ok(!txt.includes('\\n'), disp + ': árvore sem “\\n” solto na tela')
    ok(await p.getByRole('button', { name: '🌳 Yggdrasil' }).count() === 1, disp + ': árvore abre com Yggdrasil e Lista')
    await p.getByRole('checkbox', { name: /níveis futuros/ }).check(); await p.waitForTimeout(400)
    const no = p.locator('ol[aria-label^="Yggdrasil"] button').first()
    if (await no.count()) { await no.click(); await p.waitForTimeout(400) }
    ok(await semLado(p), disp + ': Yggdrasil sem rolagem para o lado')
    await p.screenshot({ path: `${O}/yggdrasil-${disp}.png`, fullPage: true })
    await p.getByRole('button', { name: '☷ Lista' }).click(); await p.waitForTimeout(400)
    ok(await p.locator('ol[aria-label^="Progressão vertical"]').count() === 1 && await semLado(p), disp + ': modo lista funciona')
    await c.close()
  }

  // 4–5. Arsenal e editor de itens (celular)
  {
    const id = await ficha('faroeste-arcano', { nome: 'Arsenal' })
    const { c, p } = await abrir(DISP[0][1], id)
    await aba(p, /Inventário/)
    await p.getByRole('button', { name: /^Arsenal pronto/ }).click(); await p.waitForTimeout(500)
    const dlg = p.getByRole('dialog', { name: 'Arsenal pronto' })
    const total = Number((await dlg.getByText(/de \d+ modelos/).textContent()).match(/de (\d+)/)[1])
    await dlg.getByLabel('Ambientação').selectOption('faroeste'); await p.waitForTimeout(200)
    const faroeste = Number((await dlg.getByText(/de \d+ modelos/).textContent()).match(/^(\d+)/)[1])
    await dlg.getByLabel('Categoria').selectOption('arma'); await p.waitForTimeout(200)
    const armas = Number((await dlg.getByText(/de \d+ modelos/).textContent()).match(/^(\d+)/)[1])
    ok(total > faroeste && faroeste > armas && armas > 0, `filtros do arsenal: ${total} → faroeste ${faroeste} → armas ${armas}`)
    await dlg.getByLabel('Ordenar por').selectOption('peso'); await p.waitForTimeout(200)
    const pesos = await dlg.locator('dd').evaluateAll(x => x.map(e => e.textContent).filter(t => /kg$/.test(t)).map(t => Number(t.replace(' kg', '').replace(',', '.'))))
    ok(pesos.length > 1 && pesos.every((v, i) => !i || v >= pesos[i - 1]), 'ordenar por menor peso')
    await dlg.getByRole('searchbox').fill('revólver'); await p.waitForTimeout(200)
    ok(await dlg.getByRole('listitem').count() >= 1, 'busca no arsenal')
    await dlg.getByRole('button', { name: 'Limpar filtros' }).click()
    await dlg.getByRole('searchbox').fill('espingarda')
    await p.screenshot({ path: O + '/arsenal-celular.png' })
    await dlg.getByRole('button', { name: /^Adicionar Espingarda/ }).first().click(); await p.waitForTimeout(400)
    await dlg.getByRole('button', { name: /^Adicionar Espingarda/ }).first().click(); await p.waitForTimeout(400)
    await dlg.getByRole('button', { name: 'Fechar arsenal' }).click(); await p.waitForTimeout(2500)
    let r = await call(J, 'GET', 'fichas/' + id)
    const esp = (r.d.ficha.dados.itens ?? []).filter(i => i.nome === 'Espingarda')
    ok(esp.length === 1 && r.d.ficha.dados.uso.itens[esp[0].id].qtd === 2, 'adicionar o mesmo modelo 2× soma a quantidade, sem duplicar')
    // Editor em três etapas
    await p.getByRole('button', { name: /^Criar item/ }).click(); await p.waitForTimeout(400)
    await p.getByRole('button', { name: 'Salvar item' }).click(); await p.waitForTimeout(300)
    ok(await p.getByRole('dialog').count() === 1 && await p.getByRole('textbox', { name: 'Nome' }).isVisible(), 'salvar sem nome volta para Identidade e não fecha')
    await p.getByRole('textbox', { name: 'Nome' }).fill('Lâmina rúnica')
    await p.getByRole('button', { name: 'Próxima seção' }).click(); await p.waitForTimeout(200)
    await p.getByRole('textbox', { name: /Dano ou rolagem/ }).fill('1d8+2')
    await p.getByRole('spinbutton', { name: /Alcance/ }).fill('3')
    if (await p.getByRole('button', { name: 'Adicionar bônus' }).count()) await p.getByRole('button', { name: 'Adicionar bônus' }).click()
    await p.screenshot({ path: O + '/editor-mecanicas.png' })
    await p.getByRole('button', { name: 'Próxima seção' }).click(); await p.waitForTimeout(200)
    ok(await p.getByText('🎨 Ícone e raridade').isVisible(), 'terceira etapa: aparência com ícone e foto')
    await p.screenshot({ path: O + '/editor-aparencia.png' })
    await p.getByRole('button', { name: 'Salvar item' }).click(); await p.waitForTimeout(2500)
    r = await call(J, 'GET', 'fichas/' + id)
    const lam = r.d.ficha.dados.itens.find(i => i.nome === 'Lâmina rúnica')
    ok(lam && lam.dano === '1d8+2' && lam.alcance === 3 && lam.bonus.length === 1, 'item novo salvo com dano, alcance e bônus')
    // Reabrir e mudar só o nome: o resto continua
    await p.locator('li', { hasText: 'Lâmina rúnica' }).getByText('Gerenciar item').click()
    await p.getByRole('button', { name: 'Editar Lâmina rúnica' }).click(); await p.waitForTimeout(300)
    await p.getByRole('textbox', { name: 'Nome' }).fill('Lâmina rúnica +1')
    await p.getByRole('button', { name: 'Salvar item' }).click(); await p.waitForTimeout(2500)
    r = await call(J, 'GET', 'fichas/' + id)
    const lam2 = r.d.ficha.dados.itens.find(i => i.id === lam.id)
    ok(lam2.nome === 'Lâmina rúnica +1' && lam2.dano === '1d8+2' && lam2.alcance === 3 && lam2.bonus.length === 1, 'editar o nome não perde dano, alcance nem bônus')
    const esp2 = r.d.ficha.dados.itens.find(i => i.nome === 'Espingarda')
    ok(!!esp2.rolagens?.length, 'rolagens do arsenal continuam no item')
    await p.getByLabel('Localizar equipamento').fill('lâmina'); await p.waitForTimeout(200)
    ok(await p.getByText(/1 de \d+ itens encontrados/).count() === 1, 'busca no inventário')
    ok(await semLado(p), 'inventário sem rolagem para o lado')
    await p.screenshot({ path: O + '/inventario-celular.png', fullPage: true })
    await c.close()
  }

  // 6. Poderes: custo, usos, filtros e rótulos por sistema
  {
    const id = await ficha('ordem-paranormal', { nome: 'Poderes', recursos: { pe: { atual: 5, max: 5 } },
      poderes: [{ id: 'p1', nome: 'Rajada de sangue', tipo: 'magia', recurso: 'pe', custo: 2, usosMax: 2, expressao: '2d6' }, { id: 'p2', nome: 'Reflexos', tipo: 'habilidade' }] })
    const { c, p } = await abrir(DISP[0][1], id)
    await aba(p, /Poderes|Rituais|Habilidades/)
    ok(await p.getByRole('heading', { name: /Habilidades e rituais/ }).count() === 1, 'Ordem: poderes com títulos do sistema (Habilidades e rituais)')
    await p.getByRole('group', { name: 'Filtrar poderes por categoria' }).getByRole('button', { name: /^Rituais/ }).click(); await p.waitForTimeout(200)
    ok(await p.getByText('1 de 2 registros').count() === 1, 'filtro por categoria')
    await p.locator('li', { hasText: 'Rajada de sangue' }).getByRole('button', { name: 'Usar' }).click(); await p.waitForTimeout(1500); await p.keyboard.press('Escape'); await p.waitForTimeout(2500)
    const r = await call(J, 'GET', 'fichas/' + id)
    ok(r.d.ficha.dados.recursos.pe.atual === 3 && r.d.ficha.dados.uso.poderes.p1 === 1, 'Usar gasta 2 PE e 1 uso')
    await p.screenshot({ path: O + '/poderes-ordem.png', fullPage: true })
    await c.close()
  }

  // 3/9. Somente leitura: outra pessoa abre a ficha e não vê os botões de edição
  {
    const { c, p } = await abrir(DISP[0][1], ids['dnd5e-srd'], M)
    if (await nav(p).count()) await aba(p, /Inventário|Itens/)
    ok(await p.getByRole('button', { name: /^Criar item/ }).count() === 0, 'ficha de outra pessoa: sem criar item')
    await c.close()
  }
  ok(!erros.length, 'sem erros na página ' + erros.join(' | '))
  await b.close()
})()
