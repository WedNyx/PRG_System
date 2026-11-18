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
  const tituloEdicao=page.locator('header.sticky').getByText(/D&D 2014 \(SRD 5\.1 \/ Livro do Jogador\)/)
  await tituloEdicao.waitFor({state:'visible',timeout:45000})
  const nav=page.getByRole('navigation',{name:'Seções da ficha'})
  const resultados=[]
  for(const width of [320,375,390,768]){
    await page.setViewportSize({width,height:812})
    for(const [nome,selector,slug] of [
      [/Principal/i,'.ficha-recursos-gerais','principal'],
      [/Atributos e perícias/i,'.dnd-brasoes','atributos'],
      [/Poderes e habilidades/i,'.ficha-acervo-poderes','poderes'],
      [/Inventário/i,'.ficha-acervo-inventario','inventario'],
      [/Anotações e regras/i,'.ficha-capitulo','notas']
    ]){
      try {
        await nav.getByRole('button',{name:nome}).click()
        await page.locator(selector).first().waitFor({state:'visible',timeout:12000})
        assert.match(await page.locator('.ficha-capitulo-universo').innerText(),/D&D 2014/)
        const m=await page.locator(selector).first().evaluate(el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,scroll:el.scrollWidth,client:el.clientWidth,doc:document.documentElement.scrollWidth,viewport:innerWidth}))
        resultados.push({width,slug,...m})
        assert(m.left>=-2 && m.right<=width+3,'Painel fora da tela: '+slug+' '+width)
        assert(m.scroll<=m.client+3,'Overflow do painel: '+slug+' '+width)
        assert(m.doc<=m.viewport+3,'Overflow da página: '+slug+' '+width)
        if(slug==='atributos')assert.equal(await page.locator('.dnd-brasao').count(),6)
        await page.screenshot({path:'artifacts/mobile-2014/'+width+'-'+slug+'.png'})
      } catch(e) {
        await page.screenshot({path:'artifacts/mobile-2014/falha-'+width+'-'+slug+'.png'}).catch(()=>{})
        throw e
      }
    }
  }
  console.log('SMOKE_MOBILE_DND2014_OK '+JSON.stringify(resultados))
  await context.close()
}finally {await browser.close()}
