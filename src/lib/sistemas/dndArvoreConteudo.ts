/**
 * Resumos PRÓPRIOS, escritos para consulta rápida DENTRO da ficha.
 * As opções de 2014 abaixo seguem o PDF do Livro do Jogador recebido:
 * Patrulheiro, Tiferino e Forasteiro. Não reproduzem seus textos integrais.
 * A árvore continua SOMENTE informativa: nunca concede efeitos duplicados.
 */
import type {DadosFicha} from './tipos'
import type {HexagonoDnd} from './arvoreDndOficial'
import type {LivroBaseDnd} from './dndLivros'
import {detalhesAntecedente2014} from './dnd2014AntecedentesDetalhes'

export type ConteudoDetalheDnd={
  titulo:string
  resumo:string
  beneficios:string[]
  registro?:string
  atencao?:string
}

export function conteudoDetalheDnd(
  d:DadosFicha, no:HexagonoDnd, edicao:LivroBaseDnd,
):ConteudoDetalheDnd {
  const base:ConteudoDetalheDnd={
    titulo:no.titulo,
    resumo:no.descricao || 'Característica registrada na progressão do personagem.',
    beneficios:[],
    atencao: no.estado==='referencia'
      ?'Este cartão explica a característica, mas não concede bônus sozinho. Benefícios condicionais devem ser aplicados na ficha quando pertinentes.'
      :undefined,
  }
  if(edicao!=='phb2014')return base
  if(no.titulo.startsWith('Inimigo Favorito')){
    const x=d.dnd2014InimigoFavorito
    return {
      ...base,
      resumo:'O Patrulheiro se especializa em reconhecer, rastrear e enfrentar tipos específicos de criaturas. No material de 2014 fornecido, isso também influencia ataques com armas.',
      beneficios:[
        'Escolha um tipo de inimigo: bestas, fadas, humanoides, monstruosidades ou mortos-vivos.',
        'Contra o tipo selecionado, o material enviado prevê +2 nas jogadas de dano de ataques com armas.',
        'Vantagem em Sobrevivência para rastrear esse tipo e em testes de Inteligência para lembrar informações sobre ele.',
        'Aprenda um idioma falado pelo inimigo escolhido, quando isso fizer sentido.',
      ],
      registro:x?'Inimigo selecionado: '+x+(d.dnd2014IdiomaInimigo?'; idioma: '+d.dnd2014IdiomaInimigo:'')
        :'Escolha seu inimigo favorito na seção de Patrulheiro do guia de criação.',
      atencao:'As regras de Patrulheiro no PDF enviado têm diferenças em relação a outras publicações de D&D 2014. Não aplique o bônus de dano automaticamente sem confirmar a variante escolhida com o mestre.',
    }
  }
  if(no.titulo.startsWith('Explorador Natural')){
    return {
      ...base,
      resumo:'Especialização em explorar áreas naturais, preparar emboscadas e orientar o grupo. Neste PDF, os benefícios são gerais, sem selecionar um terreno favorito.',
      beneficios:[
        'Ignora terreno difícil e tem vantagem em iniciativa.',
        'No primeiro turno, tem vantagem contra criaturas que ainda não agiram.',
        'Em viagens longas, ajuda a evitar que o grupo se perca e que terrenos difíceis atrasem a marcha.',
        'Mantém atenção a perigos durante outras atividades, pode deslocar-se furtivamente sozinho em ritmo normal e melhora coleta de alimento e rastreamento.',
      ],
      atencao:'Resumo da variante apresentada no livro enviado. Algumas mesas usam a redação original do Patrulheiro 2014, que exige terreno favorito; confirme a versão adotada antes de aplicar os benefícios.',
    }
  }
  if(no.id==='2014-raca'&&d.campos.especie==='Tiferino'){
    return {
      ...base,
      resumo:'Ancestralidade infernal com aptidão social e arcana, resistência natural e magia inata.',
      beneficios:[
        '+1 em Inteligência e +2 em Carisma (quando os atributos-base forem registrados).',
        'Deslocamento de 9 m, visão no escuro de 18 m e resistência ao dano de fogo.',
        'Conhece Taumaturgia; a partir do nível 3 pode usar Repreensão Infernal e, no nível 5, Escuridão. As magias especiais recuperam seu uso após descanso longo.',
        'Idiomas Comum e Infernal; Carisma é usado nas magias raciais.',
      ],
      registro:'Na aba Atributos e no guia de criação, confira a base dos atributos. As magias raciais devem ter seus usos acompanhados no grimório.',
      atencao:'A Árvore exibe o benefício; ela não aplica nem gasta usos de magia sozinha.',
    }
  }
  if(no.id==='2014-antecedente'&&d.campos.antecedente==='Forasteiro'){
    const extra=d.dnd2014AntecedenteExtras
    return {
      ...base,
      resumo:'Viajante habituado a regiões selvagens. O antecedente oferece habilidades práticas de exploração e sobrevivência.',
      beneficios:[
        'Proficiência em Atletismo e Sobrevivência.',
        'Proficiência com um instrumento musical e escolha de um idioma adicional.',
        'Característica Andarilho: boa memória de mapas e geografia; pode obter alimento e água para si e até cinco companheiros por dia se o ambiente permitir.',
        'Equipamento inicial: bordão, armadilha de caça, lembrança animal, roupa de viajante e 10 peças de ouro.',
      ],
      registro:extra?.antecedente==='Forasteiro'
        ?'Instrumento: '+(extra.ferramentas[0]||'não escolhido')+'; idioma: '+(extra.idiomas[0]||'não escolhido')+'.'
        :'Registre um instrumento e um idioma na seção do antecedente 2014.',
    }
  }
  if(no.id==='2014-antecedente'){
    const meta=detalhesAntecedente2014(d.campos.antecedente)
    if(meta)return {
      ...base,
      resumo:base.resumo,
      beneficios:[
        ...(meta.ferramentasFixas.length?['Proficiências em ferramentas: '+meta.ferramentasFixas.join(', ')+'.']:[]),
        ...(meta.ferramentasLivres?['Escolha '+meta.ferramentasLivres+' ferramenta(s) do tipo '+(meta.tipoFerramenta??'permitido')+'.']:[]),
        ...(meta.idiomas?['Escolha '+meta.idiomas+' idioma(s) adicional(is).']:[]),
        'Equipamento indicado: '+meta.equipamentos+'.',
      ],
      registro:'Complete os idiomas, ferramentas e demais escolhas do antecedente no guia de 2014.',
    }
  }
  if(no.id==='2014-raca')return {
    ...base,
    registro:'Confira os bônus raciais e eventuais magias na seção de criação de personagem.',
    atencao:'A descrição é um resumo da raça; efeitos que dependem de situação não são concedidos pelo cartão.',
  }
  if(no.id.startsWith('2014-classe-')||no.id.startsWith('2014-')){
    return {...base,registro:no.escolha?'Classe: '+no.escolha+'. Confira os recursos disponíveis no nível indicado.':undefined}
  }
  if(no.id.startsWith('2014-talento-')){
    return {...base,registro:'Os pré-requisitos, atributos e listas escolhidas aparecem no guia de talentos 2014.'}
  }
  if(no.id==='2014-grimorio')return {
    ...base,registro:'Abra a seção Magias para ver conjurações, componentes, concentrações e limites por classe.',
  }
  return base
}
