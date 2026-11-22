// Árvore em constelação (v0.36.7): a árvore do autor aparece na ficha como ele montou, do centro para fora, com visual moderno;
// pontos da árvore (árvore + tabela de níveis), aviso de escolha pendente, liberar pela constelação; aparência do nó no construtor.
// Uso: NODE_PATH=$(npm root -g) node scripts/tela/constelacao.cjs <pasta>  (servidor local em :3000, banco de teste).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium, devices } = require('playwright')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs'), path = require('path')
const B = 'http://localhost:3000', J = '22222222-2222-4222-8222-222222222222', O = process.argv[2] || '.'
const call = async (q, m, c, body) => { const r = await fetch(B + '/api/prg/' + c, { method: m, headers: { 'content-type': 'application/json', 'x-prg-aventureiro': q, origin: B }, body: body && JSON.stringify(body) }); let d = {}; try { d = await r.json() } catch {} return { s: r.status, d } }
const ok = (c, m) => { if (!c) { console.log('✘ ' + m); process.exitCode = 1 } else console.log('✓ ' + m) }
const semLado = p => p.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1)
const poder = (id, nome) => [{ tipo: 'poder', poder: { id: 'arv-' + id + '-0', nome, tipo: 'habilidade', custo: 1, recurso: 'clareza' } }]

;(async () => {
  const base = JSON.parse(fs.readFileSync(path.join(__dirname, '../../supabase/sementes/nova.json'), 'utf8'))
  const tabela = { arvore: [1, 2, 4, 6, 9, 12, 15, 19, 23, 28], atributos: [0, 1, 1, 1, 2, 2, 2, 3, 3, 3] }
  const definicao = { ...base, nome: 'Constelação de Teste',
    campos: [...base.campos.map(c => c.id === 'destaque' ? { ...c, opcoes: [{ nome: 'Físico', progressao: 'fisico' }, { nome: 'Psicológico', progressao: 'psicologico' }] } : c), { id: 'nivel', nome: 'Nível', tipo: 'numero', padrao: 1 }],
    progressoes: { colunas: { arvore: '🌠 Pontos da árvore', atributos: '💪 Pontos de atributo' }, classes: [{ id: 'fisico', nome: 'Físico', campoNivel: 'nivel', tabela }, { id: 'psicologico', nome: 'Psicológico', campoNivel: 'nivel', tabela }] },
    visual: { acento: '#af142c', borda: '#4b1b1b', cartao: '#100a09', fundo: '#070405', texto: '#e8d6d9', fonte: 'mono', arvore: 'nova' },
    arvore: { pontos: 1, nos: [
      { id: 'pec', x: 40, y: -70, cor: '#e2e8f0', nome: 'Peculiaridade', custo: 1, requer: [], efeitos: [], descricao: 'O poder com que todos nascem.', tamanho: 'g', icone: '◈' },
      { id: 'res', x: -140, y: -150, cor: '#a78bfa', nome: 'RESISTÊNCIA IMPLACÁVEL', custo: 1, nivel: 1, requer: ['pec'], efeitos: poder('res', 'RESISTÊNCIA IMPLACÁVEL'), descricao: 'Reduz o dano recebido.' },
      { id: 'men', x: 210, y: -150, cor: '#a78bfa', nome: 'MENTE DE AÇO', custo: 1, nivel: 1, requer: ['pec'], efeitos: poder('men', 'MENTE DE AÇO'), descricao: 'Reduz o dano pela mente.', forma: 'circulo' },
      { id: 'sab', x: 40, y: 100, cor: '#a78bfa', nome: 'SABEDORIA ESPONTÂNEA', custo: 1, nivel: 1, requer: ['pec'], efeitos: poder('sab', 'SABEDORIA ESPONTÂNEA'), descricao: 'Aumenta 2 graus de uma vivência.' },
      { id: 'ult', x: 40, y: 260, cor: '#a78bfa', nome: 'Despertar', custo: 2, nivel: 3, requer: ['sab'], efeitos: [], descricao: 'Mais longe do centro.', forma: 'losango' },
    ] } }
  const r = await call(J, 'POST', 'sistemas', { acao: 'criar', definicao })
  ok(r.s < 300 && r.d.id, 'sistema de teste criado ' + (r.d.erros || r.d.erro || ''))
  const sem = await call(J, 'POST', 'fichas', { sistema: r.d.id, dados: { nome: 'Sem destaque', campos: { nivel: 1 }, atributos: {}, pericias: {}, recursos: {}, listas: {} } })
  const b = await chromium.launch(); const erros = []
  for (const [disp, opts] of [['computador', { viewport: { width: 1366, height: 900 } }], ['celular', devices['Pixel 7']]]) {
    const c = await b.newContext(opts); await c.addInitScript(i => { try { localStorage.setItem('prg-aventureiro-selecionado-v1', i) } catch {} }, J)
    const p = await c.newPage(); p.on('pageerror', e => erros.push(e.message)); p.on('dialog', d => d.accept())
    const com = await call(J, 'POST', 'fichas', { sistema: r.d.id, dados: { nome: 'Kairo Knox', campos: { nivel: 2, destaque: 'Físico' }, atributos: {}, pericias: {}, recursos: {}, listas: {} } })
    const abrirArvore = async id => { await p.goto(B + '/ficha?nuvem=' + id, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2600)
      await p.locator('nav[aria-label="Seções da ficha"] button').filter({ hasText: /Árvore/ }).first().click(); await p.waitForTimeout(1500) }
    await abrirArvore(sem.d.ficha.id)
    ok(await p.locator('[data-constelacao]').count() === 1, `${disp}: a árvore do autor abre em constelação`)
    ok(await p.getByText(/Escolha “Atributo que se destaca”/).count() === 1, `${disp}: avisa que falta a escolha (Destaque) para ganhar pontos por nível`)
    await abrirArvore(com.d.ficha.id)
    await p.locator('.react-flow__node-hab').first().waitFor({ timeout: 8000 }).catch(() => {})
    ok(await p.locator('.react-flow__node-hab').count() === 5 && await p.locator('.react-flow__edge').count() === 4, `${disp}: 5 habilidades e 4 ligações nas posições do autor`)
    const painel = p.locator('[data-pontos-arvore]')
    ok(/^\s*3/.test(await painel.innerText()) && /1 da árvore \+ 2 pela tabela de níveis \(nível 2\)/.test(await painel.innerText()), `${disp}: 3 pontos = 1 da árvore + 2 do nível 2`)
    ok(/Ao subir para o nível 3: \+2 pontos/.test(await painel.innerText()), `${disp}: mostra quanto entra no próximo nível`)
    const centro = await p.locator('[data-estado]').evaluateAll(l => l.map(e => { const r = e.getBoundingClientRect(); return { e: e.getAttribute('data-estado'), x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width } }))
    ok(centro.filter(x => x.e === 'proximo').length === 1 && centro.some(x => x.e === 'futuro'), `${disp}: só a Peculiaridade pode ser liberada no começo`)
    const pec = centro.reduce((a, x) => x.w > a.w ? x : a)
    ok(centro.filter(x => x !== pec).every(x => Math.hypot(x.x - pec.x, x.y - pec.y) > 40), `${disp}: o núcleo (grande) fica no centro e as outras em volta`)
    await p.screenshot({ path: `${O}/constelacao-${disp}-1.png` })
    await p.getByRole('button', { name: /^Peculiaridade, pode liberar/ }).click(); await p.waitForTimeout(500)
    await p.getByRole('button', { name: /^Liberar \(−1 ponto\)/ }).click(); await p.waitForTimeout(900)
    ok(await p.locator('[data-estado="recebido"]').count() === 1 && await p.locator('[data-estado="proximo"]').count() === 3, `${disp}: liberar o núcleo abre as 3 do primeiro anel`)
    await p.getByRole('button', { name: /^MENTE DE AÇO, pode liberar/ }).click(); await p.waitForTimeout(400)
    await p.getByRole('button', { name: /^Liberar/ }).click(); await p.waitForTimeout(900)
    ok(/^\s*1/.test(await painel.innerText()), `${disp}: os pontos descem ao liberar`)
    ok(await semLado(p), `${disp}: sem rolagem para o lado`)
    await p.locator('[data-constelacao]').scrollIntoViewIfNeeded()
    await p.screenshot({ path: `${O}/constelacao-${disp}-2.png`, fullPage: disp === 'celular' })
    await p.getByRole('button', { name: '☷ Lista' }).click(); await p.waitForTimeout(400)
    ok(await p.getByRole('list', { name: /Lista de/ }).count() === 1, `${disp}: a lista continua como alternativa`)
    if (disp === 'computador') {
      await p.goto(B + '/sistemas/criar?id=' + r.d.id, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500)
      await p.getByRole('button', { name: /Árvore de habilidades padrão/ }).click(); await p.waitForTimeout(800)
      ok(await p.locator('svg polygon, svg circle').count() > 3, 'construtor: hexágonos com as formas do autor')
      await p.screenshot({ path: `${O}/constelacao-construtor.png` })
    }
    await c.close()
  }
  ok(!erros.length, 'sem erros na página ' + erros.join(' | '))
  await b.close()
})()
