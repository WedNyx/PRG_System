/**
 * Browser real em viewport móvel controlada, com FICHA FICTÍCIA no localStorage.
 * Não depende de autenticação, APIs em nuvem ou dados de produção.
 * Executado após o build Next pelo workflow de qualidade.
 */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
const { chromium } = await import(process.env.PRG_PLAYWRIGHT_MODULE || 'playwright')

const base=process.env.MOBILE_E2E_URL || 'http://127.0.0.1:3000'
const local='qa-mobile-dnd2014'
const fixture={
  sistema:'dnd5e-srd',nome:'QA Mobile 2014',
  campos:{classe:'Guerreiro',especie:'Humano',subraca2014:'Humano padrão',
    antecedente:'Forasteiro',nivel:3,xp:900},
  atributos:{FOR:15,DES:12,CON:14,INT:10,SAB:13,CAR:8},
  pericias:{},recursos:{},listas:{},
  dndLivros:{base:'phb2014',suplementos:[]},
  dnd2014Subclasse:'mestre-batalha',
  dnd2014EscolhasSubclasse:{guerreiro:{subclasse:'mestre-batalha',
    grupos:{'manobras-3':['Aparar','Ataque de Precisão']}}},
  dnd2014EquipamentoInicial:{modo:'ouro',classe:'Guerreiro',
    antecedente:'Forasteiro',dados:[2,3,2,2,3]},
  dnd2014AntecedenteExtras:{antecedente:'Forasteiro',idiomas:['Élfico'],ferramentas:['Flauta']},
  uso:{itens:{},poderes:{},carteira:'120 PO'},
}
await mkdir('artifacts/mobile-2014',{recursive:true})
const browser=await chromium.launch({headless:true,args:['--no-sandbox']})
try {
  const context=await browser.newContext({viewport:{width:375,height:812},deviceScaleFactor:1,
    isMobile:true,hasTouch:true,locale:'pt-BR'})
  const page=await context.newPage()
  await page.addInitScript(([key,data])=>{
    localStorage.setItem('prg-ficha-gen-'+key,JSON.stringify(data))
  },[local,fixture])
  let erro=null
  for(let tentativa=0;tentativa<12;tentativa++){
    try{
      await page.goto(base+'/ficha?local='+local,{waitUntil:'domcontentloaded',timeout:10000})
      erro=null;break
    }catch(e){erro=e;await new Promise(resolve=>setTimeout(resolve,1200))}
  }
  if(erro)throw erro
  const guia=page.locator('section[aria-label="Regras de criação 2014"]').first()
  const equipamento=page.locator('section[aria-label="Equipamento inicial D&D 2014"]').first()
  const antecedentes=page.locator('section[aria-label="Ferramentas e idiomas do antecedente 2014"]').first()
  const subclasses=page.locator('section[aria-label="Escolhas internas das subclasses D&D 2014"]').first()
  // Regressão da captura da Kaelen: o cabeçalho antes mostrava 2024
  // apesar de toda a ficha e a árvore estarem configuradas para 2014.
  const tituloEdicao=page.locator('header.sticky').getByText(/D&D 2014 \(SRD 5\.1 \/ Livro do Jogador\)/)
  await tituloEdicao.waitFor({state:'visible',timeout:45000})
  assert.doesNotMatch(await page.locator('header.sticky').innerText(),/D&D 2024/)
  await guia.waitFor({state:'visible',timeout:45000})
  await equipamento.waitFor({state:'visible',timeout:12000})
  await antecedentes.waitFor({state:'visible',timeout:12000})
  await subclasses.waitFor({state:'visible',timeout:12000})
  assert.match(await subclasses.innerText(),/Mestre de Batalha/)
  assert.match(await subclasses.innerText(),/2\/3/)
  assert.match(await subclasses.innerText(),/Aparar/)
  assert.match(await subclasses.innerText(),/Ataque de Precisão/)

  assert.match((await equipamento.innerText()),/120 peças de ouro iniciais/)
  assert.match((await equipamento.innerText()),/2 \+ 3 \+ 2 \+ 2 \+ 3/)
  assert.equal(await antecedentes.getByPlaceholder('Ex.: Élfico').inputValue(),'Élfico')
  assert.equal(await antecedentes.getByPlaceholder('Qual instrumento, kit ou ferramenta?').inputValue(),'Flauta')
  const rolar=page.getByRole('button',{name:/Rolar ouro inicial da classe/i}).first()
  assert.equal(await rolar.isDisabled(),true,'A rolagem inicial não deve ser repetida.')

  const widths=[320,375,390,768]
  const resultados=[]
  for(const width of widths){
    await page.setViewportSize({width,height:812})
    await page.waitForTimeout(250)
    const medicao=await page.evaluate(()=>{
      const names=['Regras de criação 2014','Equipamento inicial D&D 2014',
        'Ferramentas e idiomas do antecedente 2014','Método de atributos e progressão 2014',
        'Escolhas internas das subclasses D&D 2014']
      const caixas=names.map(n=>{
        const el=document.querySelector('section[aria-label="'+n+'"]')
        if(!el)return {nome:n,presente:false}
        const rect=el.getBoundingClientRect()
        return {nome:n,presente:true,x:Math.round(rect.x),
          direita:Math.round(rect.right),largura:Math.round(rect.width),
          conteudo:el.scrollWidth,cliente:el.clientWidth}
      })
      return {viewport:innerWidth,documento:document.documentElement.scrollWidth,caixas}
    })
    resultados.push({width,...medicao})
    for(const c of medicao.caixas){
      assert.equal(c.presente,true,'Seção ausente: '+c.nome)
      assert(c.x>=-2,'Seção fora da tela à esquerda em '+width+': '+c.nome)
      assert(c.direita<=width+3,'Seção ultrapassa a tela em '+width+': '+c.nome)
      assert(c.conteudo<=c.cliente+3,'Overflow na seção '+c.nome+' em '+width)
    }
    await page.screenshot({path:'artifacts/mobile-2014/'+width+'px.png',fullPage:false})
  }
  console.log('SMOKE_MOBILE_DND2014_OK '+JSON.stringify(resultados))
  await context.close()
}finally {await browser.close()}
