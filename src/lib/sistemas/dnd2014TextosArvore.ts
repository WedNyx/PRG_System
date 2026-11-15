/** Resumos originais e práticos para os detalhes da Árvore D&D 2014.
 * Dados abertos SRD 5.1 (CC BY 4.0); não são transcrições de livros comerciais.
 * A árvore explica regras, mas nunca adiciona bônus ou edita a ficha.
 */
import {detalhesAntecedente2014} from './dnd2014AntecedentesDetalhes'

export const TEXTO_PATRULHEIRO_2014 = {
 inimigo: 'Escolha um tipo de criatura (ou dois povos humanoides). Você tem vantagem em testes de Sobrevivência para rastreá-la e em testes de Inteligência para recordar informações sobre ela. Aprenda também um idioma ligado ao inimigo, se ele falar algum. Você recebe novos inimigos nos níveis 6 e 14 de Patrulheiro. Esta versão clássica NÃO acrescenta dano fixo contra o inimigo favorito.',
 terreno: 'Escolha um ambiente favorito. Em testes de Inteligência ou Sabedoria relacionados a esse ambiente, dobre a proficiência caso ela se aplique. Após ao menos 1 hora viajando nele, seu grupo lida melhor com terreno difícil, orientação e busca de alimento; você pode rastrear com informações adicionais. Novos terrenos são adquiridos nos níveis 6 e 10 de Patrulheiro.',
}

const RACAS:Record<string,string>={
 'Anão':'Constituição +2, visão no escuro de 18 m, resistência a dano de veneno e vantagem contra a condição Envenenado. Deslocamento de 7,5 m e treinamento com certas armas e ferramentas. Os benefícios adicionais dependem da sub-raça escolhida.',
 'Elfo':'Destreza +2, visão no escuro de 18 m, proficiência em Percepção, ancestralidade feérica e transe. Escolha Alto Elfo, Elfo da Floresta ou Drow para os benefícios específicos.',
 'Halfling':'Destreza +2, Sorte (pode repetir um resultado 1 em ataque, teste de atributo ou resistência), Bravura e agilidade para passar pelo espaço de criaturas maiores. Escolha a sub-raça.',
 'Humano':'O Humano padrão recebe +1 nos seis atributos. A variante opcional distribui +1 em dois atributos, uma perícia e um talento inicial, se o mestre permitir.',
 'Draconato':'Força +2 e Carisma +1. Escolha a ancestralidade dracônica para definir o tipo de dano de sua arma de sopro e a resistência correspondente.',
 'Gnomo':'Inteligência +2, visão no escuro e vantagem em resistências de Inteligência, Sabedoria e Carisma contra magia. A sub-raça determina benefícios adicionais.',
 'Meio-Elfo':'Carisma +2 e +1 em dois atributos distintos; visão no escuro, ancestralidade feérica e proficiência em duas perícias escolhidas.',
 'Meio-Orc':'Força +2, Constituição +1, visão no escuro, Intimidação, resistência implacável para ficar com 1 PV em vez de cair a zero uma vez por descanso longo e ataques críticos mais perigosos.',
 'Tiferino':'Inteligência +1 e Carisma +2; visão no escuro (18 m), resistência a dano de fogo e idiomas Comum e Infernal. Aprende Taumaturgia no nível 1, Repreensão Infernal no nível 3 e Escuridão no nível 5. As magias de nível 3 e 5 são conjuradas uma vez por descanso longo por este traço, usando Carisma.',
}

const RESUMOS_MARCOS:Record<string,Record<string,string>>={
 'Patrulheiro':{
  'Inimigo Favorito (escolha)':TEXTO_PATRULHEIRO_2014.inimigo,
  'Explorador Natural (escolha)':TEXTO_PATRULHEIRO_2014.terreno,
  'Estilo de Luta (escolha)':'No nível 2, escolha um estilo de combate. Arquearia melhora ataques à distância; Defesa melhora CA com armadura; Duelismo melhora dano com arma de uma mão; Combate com Duas Armas acrescenta o modificador ao dano do segundo ataque.',
  'Conjuração':'A partir do nível 2, o Patrulheiro conhece magias da lista da classe e usa Sabedoria para suas CDs e ataques mágicos. Os espaços gastos voltam no descanso longo.',
  'Consciência Primeva':'Use sua ligação com a natureza para investigar a presença de certos tipos de criaturas. A interpretação, o alcance e o gasto de espaços seguem as condições da característica de 2014.',
  'Inimigo Favorito e Explorador Natural adicionais':'Nos níveis apropriados de Patrulheiro, registre inimigos e terrenos favoritos adicionais. Os novos tipos ampliam os benefícios de rastreamento e exploração; não substituem os anteriores.',
  'Inimigo Favorito adicional':'No nível 14 de Patrulheiro, adicione outro inimigo favorito e idioma pertinente.',
  'Explorador Natural adicional':'No nível 10 de Patrulheiro, adicione outro tipo de terreno favorito.',
  'Ataque Extra':'Desde o nível 5 de Patrulheiro, você pode atacar duas vezes com a ação Atacar.',
 },
 'Guerreiro':{
  'Retomar o Fôlego':'Uma vez por descanso curto ou longo, use uma ação bônus para recuperar 1d10 + nível de Guerreiro em PV.',
  'Surto de Ação':'No seu turno, receba uma ação adicional além da ação e eventual ação bônus habituais. Recupera após descanso curto ou longo.',
  'Ataque Extra':'Aumenta a quantidade de ataques ao usar a ação Atacar; confira o marco exato da sua classe.',
  'Indomável':'Repita uma salvaguarda malsucedida; deve ficar com o novo resultado. Os usos aumentam em níveis posteriores.',
 },
 'Bárbaro':{
  'Fúria':'Durante a Fúria você recebe vantagens e resistências específicas, além de bônus de dano para ataques corpo a corpo com Força. Confira os usos disponíveis e as condições para mantê-la.',
  'Defesa sem Armadura':'Sem armadura, a CA básica é 10 + modificador de Destreza + modificador de Constituição. Escudo ainda pode ser usado.',
  'Ataque Descuidado':'Na primeira jogada de ataque do turno, pode atacar com vantagem ao usar Força no corpo a corpo; em troca, ataques contra você têm vantagem até seu próximo turno.',
 },
 'Ladino':{
  'Ataque Furtivo':'Uma vez por turno, pode adicionar dados de dano ao acertar com arma de acuidade ou à distância, desde que atenda às condições de vantagem ou de aliado adjacente.',
  'Ação Ardilosa':'A partir do nível 2, pode usar uma ação bônus para Disparada, Desengajar ou Esconder.',
  'Esquiva Sobrenatural':'Quando um atacante que você vê lhe acerta, use a reação para reduzir à metade o dano daquele ataque.',
 },
 'Mago':{
  'Conjuração e Grimório':'O Mago registra magias no grimório e prepara diariamente um número conforme seu nível de Mago e Inteligência. Espaços e magias preparadas são controles diferentes.',
  'Recuperação Arcana':'Uma vez por dia, após terminar um descanso curto, recupera uma combinação limitada de espaços de magia já gastos.',
 },
 'Bardo':{
  'Inspiração de Bardo':'Como ação bônus, conceda um dado de Inspiração a uma criatura que possa ouvi-lo. O dado pode ajudar em testes ou ataques conforme a classe; usos dependem do Carisma.',
  'Pau para Toda Obra':'Acrescente metade do bônus de proficiência (arredondada para baixo) a testes de atributo que não incluam sua proficiência.',
  'Canção de Descanso':'Durante um descanso curto, aliados que gastarem Dados de Vida recebem cura adicional, que cresce conforme o nível do Bardo.',
 },
 'Feiticeiro':{
  'Fonte de Magia':'Pontos de Feitiçaria permitem alterar conjurações e converter recursos. A ficha registra o saldo disponível.',
  'Metamagia (escolha)':'Selecione técnicas de Metamagia no guia. Os custos em Pontos de Feitiçaria são descontados ao confirmar o uso; o efeito situacional é verificado com o mestre.',
 },
 'Bruxo':{
  'Magia de Pacto':'Bruxo tem seus próprios espaços de Magia de Pacto, recuperados em descanso curto ou longo, separados dos demais conjuradores.',
  'Dádiva do Pacto (escolha)':'No nível 3, escolha a Dádiva da Corrente, da Lâmina ou do Tomo no guia. A dádiva é diferente do patrono.',
  'Arcana Mística':'A partir dos níveis 11, 13, 15 e 17 de Bruxo, escolha respectivamente uma magia de 6º, 7º, 8º e 9º círculo; cada uma pode ser usada uma vez por descanso longo sem consumir espaço de Pacto.',
 },
 'Druida':{
  'Druídico e Conjuração':'Aprenda o idioma druídico e conjure magias preparadas conforme nível de Druida e Sabedoria. A preparação se atualiza após o descanso longo.',
  'Forma Selvagem':'Transforme-se em uma besta permitida pela tabela de nível de Druida. Você mantém determinadas capacidades mentais e adota estatísticas da forma; os usos voltam após descanso curto ou longo.',
 },
 'Paladino':{
  'Cura pelas Mãos':'Uma reserva de cura equivalente a 5 vezes o nível de Paladino permite recuperar PV ao tocar criaturas, com condições próprias para doenças e venenos.',
  'Destruição Divina':'Ao acertar um ataque corpo a corpo, pode gastar um espaço de magia para causar dano radiante adicional, com valores conforme o espaço utilizado.',
 },
 'Clérigo':{
  'Canalizar Divindade':'Use a energia divina para Expulsar Mortos-Vivos ou para um efeito do seu domínio. O recurso tem usos e recuperação determinados pela progressão.',
  'Intervenção Divina':'Peça auxílio à sua divindade; o resultado é determinado pelas regras e pela decisão do mestre.',
 },
 'Monge':{
  'Ki e técnicas':'Pontos de Ki permitem usar técnicas como Rajada de Golpes, Defesa Paciente e Passo do Vento. Os pontos são recuperados em descanso curto ou longo segundo as condições.',
  'Defesa sem Armadura':'Sem armadura e sem escudo, a CA do Monge é 10 + modificador de Destreza + modificador de Sabedoria.',
 },
}

const ANT_FEATURE:Record<string,string>={
 'Forasteiro':'Andarilho: conhece bem mapas e a geografia geral, conseguindo recordar caminhos e pontos de referência. Quando a região dispõe de recursos, encontra comida e água para si e até outras cinco pessoas por dia.',
 'Acólito':'Abrigo dos Fiéis: pode solicitar acolhimento básico a membros de sua fé, em locais adequados; serviços especiais dependem da situação e do mestre.',
 'Criminoso':'Contato Criminoso: mantém uma conexão confiável com uma rede de informantes que pode transmitir mensagens conforme as condições da aventura.',
 'Sábio':'Pesquisador: quando desconhece uma informação, normalmente sabe onde ou com quem começar a procurá-la.',
 'Nobre':'Posição de Privilégio: costuma receber tratamento respeitoso e acesso à alta sociedade conforme as circunstâncias da aventura.',
 'Soldado':'Patente Militar: sua trajetória militar pode abrir portas e garantir respeito entre soldados que reconheçam essa posição.',
 'Marinheiro':'Passagem de Navio: pode conseguir passagem em embarcações conhecidas, respeitando rotas e limites da tripulação.',
 'Órfão':'Segredos da Cidade: conhece atalhos, passagens e caminhos discretos dos assentamentos urbanos.',
 'Herói do Povo':'Hospitalidade Rústica: pessoas comuns podem acolher, esconder e ajudar você quando a situação permitir.',
}

export function resumoRaca2014(nome:string,original:string):string {
 return [original,RACAS[nome]].filter(Boolean).join('\n\n')
}
export function resumoAntecedente2014(nome:string,original:string):string {
 const detalhes=detalhesAntecedente2014(nome)
 const itens=detalhes?[
   detalhes.idiomas?'Idiomas adicionais: '+detalhes.idiomas+'.':'',
   detalhes.ferramentasFixas.length?'Proficiências com ferramentas: '+detalhes.ferramentasFixas.join(', ')+'.':'',
   detalhes.ferramentasLivres?'Escolha '+detalhes.ferramentasLivres+' '+(detalhes.tipoFerramenta??'ferramenta')+'.':'',
   detalhes.equipamentos?'Equipamento inicial: '+detalhes.equipamentos+'.':'',
 ]:[]
 return [original,ANT_FEATURE[nome],...itens].filter(Boolean).join('\n\n')
}
export function resumoMarcoClasse2014(classe:string,nome:string,original:string):string {
 return RESUMOS_MARCOS[classe]?.[nome] ?? original
}
