/**
 * Grimório da Ordem Paranormal (v0.36.9): os rituais do Livro de Regras por elemento e círculo, com o custo base em PE
 * e um resumo curto escrito por nós. Ordem Paranormal é um sistema comercial (Jambô/Cellbit): aqui não entra o texto
 * do livro — execução, alcance, dados e as versões Discente e Verdadeiro ficam no livro. Lista montada de memória:
 * confira no livro (marcados com `conferir` os que mais pedem atenção).
 */
import type { Poder } from './inventario'

export type Elemento = NonNullable<Poder['elementoOrdem']>
export type RitualOrdem = { nome: string; elemento: Elemento; circulo: 1 | 2 | 3 | 4; resumo: string; conferir?: boolean }
export const CUSTO_CIRCULO = [0, 1, 3, 6, 10] as const

const r = (elemento: Elemento, circulo: RitualOrdem['circulo'], lista: [string, string, boolean?][]): RitualOrdem[] =>
  lista.map(([nome, resumo, conferir]) => ({ nome, elemento, circulo, resumo, ...(conferir ? { conferir: true } : {}) }))

const AMALDICOAR = (e: Elemento): RitualOrdem => ({ nome: 'Amaldiçoar Arma', elemento: e, circulo: 1, resumo: `Uma arma (ou munição) causa dano extra de ${e} durante a cena.` })

export const RITUAIS_ORDEM: RitualOrdem[] = [
  // ---------------- Conhecimento
  AMALDICOAR('Conhecimento'),
  ...r('Conhecimento', 1, [
    ['Compreensão Paranormal', 'Entende qualquer idioma ou escrita, inclusive a paranormal, por um tempo.'],
    ['Enfeitiçar', 'Deixa uma pessoa mais amigável e disposta a ajudar.'],
    ['Ouvir os Sussurros', 'Pergunta ao Outro Lado sobre uma ação que vai fazer e recebe um presságio.'],
    ['Perturbação', 'Dá uma ordem curta que o alvo sente vontade de cumprir.'],
    ['Tecer Ilusão', 'Cria uma ilusão de imagem ou som.'],
    ['Terceiro Olho', 'Enxerga auras e presenças paranormais à sua volta.'],
  ]),
  ...r('Conhecimento', 2, [
    ['Aprimorar Mente', 'Fortalece a mente: bônus em perícias de Intelecto ou Presença.'],
    ['Detecção de Ameaças', 'Sente perigos e emboscadas por perto.'],
    ['Esconder dos Olhos', 'Some da percepção de quem está olhando.'],
    ['Invadir Mente', 'Ataca a mente do alvo ou cria um elo mental com ele.'],
    ['Localização', 'Descobre onde está uma pessoa ou um objeto.'],
  ]),
  ...r('Conhecimento', 3, [
    ['Alterar Memória', 'Apaga ou muda lembranças de uma pessoa.'],
    ['Contato Paranormal', 'Faz um pacto com o Outro Lado em troca de ajuda.'],
    ['Mergulho Mental', 'Mergulha na mente do alvo para descobrir o que ele sabe.', true],
    ['Vidência', 'Vê e ouve um lugar ou uma pessoa à distância.'],
  ]),
  ...r('Conhecimento', 4, [
    ['Controle Mental', 'Domina as ações de uma pessoa.'],
    ['Inexistir', 'Apaga o alvo da realidade.'],
    ['Possessão', 'Toma o corpo de outra pessoa.'],
  ]),
  // ---------------- Energia
  AMALDICOAR('Energia'),
  ...r('Energia', 1, [
    ['Amaldiçoar Tecnologia', 'Melhora (ou atrapalha) um aparelho eletrônico ou mecânico.'],
    ['Coincidência Forçada', 'Puxa a sorte a seu favor num teste.'],
    ['Eletrocussão', 'Descarga elétrica que causa dano de Energia.'],
    ['Embaralhar', 'Cria cópias ilusórias suas que confundem os ataques.'],
    ['Luz', 'Faz um objeto brilhar e iluminar o lugar.'],
    ['Polarização Caótica', 'Atrai ou repele objetos de metal.'],
  ]),
  ...r('Energia', 2, [
    ['Chamas do Caos', 'Controla e cria fogo.'],
    ['Contenção Fantasmagórica', 'Prende o alvo com laços de energia.'],
    ['Dissonância Acústica', 'Cria silêncio ou um ruído que atrapalha.'],
    ['Sopro da Sorte', 'Espalha sorte para os aliados.'],
    ['Tela de Ruído', 'Escudo de energia que absorve dano.'],
  ]),
  ...r('Energia', 3, [
    ['Convocação Instantânea', 'Traz um objeto marcado para a sua mão.'],
    ['Salto Fantasma', 'Teleporta você para um ponto próximo.'],
    ['Transfigurar Água', 'Molda e controla a água.'],
    ['Transfigurar Terra', 'Molda terra, pedra e lama.'],
  ]),
  ...r('Energia', 4, [
    ['Alterar Destino', 'Muda o resultado de um acontecimento.'],
    ['Deflagração de Energia', 'Grande explosão de energia em área.'],
    ['Teletransporte', 'Leva você e outros para longe num instante.'],
  ]),
  // ---------------- Morte
  AMALDICOAR('Morte'),
  ...r('Morte', 1, [
    ['Cicatrização', 'Acelera o tempo do corpo do alvo e recupera PV.'],
    ['Consumir Manancial', 'Tira vida do ambiente para ganhar PV temporários.'],
    ['Decadência', 'Toque que apodrece e causa dano de Morte.'],
    ['Definhar', 'Deixa o alvo fatigado e mais lento.'],
    ['Espirais da Perdição', 'Os aliados acertam mais ou os inimigos erram mais.'],
    ['Nuvem de Cinzas', 'Nuvem de cinzas que atrapalha a visão.'],
  ]),
  ...r('Morte', 2, [
    ['Desacelerar Impacto', 'Diminui a velocidade de quedas e golpes.'],
    ['Eco Espiral', 'Guarda o dano que o alvo recebe e o devolve depois.'],
    ['Miasma Entrópico', 'Nuvem tóxica que causa dano e enjoo.'],
    ['Paradoxo', 'Distorce o tempo numa área e causa dano.'],
    ['Velocidade Mortal', 'Acelera o alvo: mais ações por turno.'],
  ]),
  ...r('Morte', 3, [
    ['Âncora Temporal', 'Prende o alvo no tempo, sem conseguir agir.'],
    ['Tentáculos de Lodo', 'Tentáculos de lodo prendem e machucam numa área.'],
    ['Zerar Entropia', 'Paralisa o alvo no tempo.'],
  ]),
  ...r('Morte', 4, [
    ['Convocar o Algoz', 'Chama uma criatura da Morte para caçar o alvo.'],
    ['Distorção Temporal', 'Para o tempo para todos, menos para você.'],
    ['Fim Inevitável', 'Cria um vórtice que suga tudo à volta.'],
  ]),
  // ---------------- Sangue
  AMALDICOAR('Sangue'),
  ...r('Sangue', 1, [
    ['Arma Atroz', 'A arma fica mais violenta: acerta e corta mais.'],
    ['Armadura de Sangue', 'Uma camada de sangue endurecido protege o corpo.'],
    ['Corpo Adaptado', 'O corpo se adapta a calor, frio, falta de ar ou água.'],
    ['Distorcer Aparência', 'Muda a aparência de quem conjura.'],
    ['Fortalecimento Sensorial', 'Aguça os sentidos: bônus em percepção e iniciativa.'],
    ['Ódio Incontrolável', 'Fúria que aumenta o dano corpo a corpo.'],
  ]),
  ...r('Sangue', 2, [
    ['Aprimorar Físico', 'Bônus em Força ou Agilidade.'],
    ['Descarnar', 'Arranca a carne do alvo e causa sangramento.'],
    ['Flagelo de Sangue', 'Marca o alvo para que ele sofra ao agir contra você.'],
    ['Hemofagia', 'Rouba vida do alvo para você.'],
    ['Transfusão Vital', 'Passa os seus PV para outra pessoa.'],
  ]),
  ...r('Sangue', 3, [
    ['Ferver Sangue', 'Faz o sangue do alvo ferver.'],
    ['Forma Monstruosa', 'Vira uma criatura de Sangue, mais forte e resistente.'],
    ['Purgatório', 'Área de sangue que fere quem tenta sair dela.'],
    ['Vomitar Pestes', 'Vomita uma nuvem de insetos que ataca.'],
  ]),
  ...r('Sangue', 4, [
    ['Capturar o Coração', 'Faz o alvo se apaixonar e obedecer.'],
    ['Invólucro de Carne', 'Cria uma cópia de carne de alguém.'],
    ['Vínculo de Sangue', 'Liga o seu corpo ao do alvo: o que acontece com um acontece com o outro.'],
  ]),
  // ---------------- Medo
  ...r('Medo', 1, [['Cinerária', 'Névoa que fortalece os rituais conjurados dentro dela.']]),
  ...r('Medo', 2, [
    ['Proteção contra Rituais', 'Protege contra efeitos paranormais.', true],
    ['Rejeitar Névoa', 'Afasta a névoa e enfraquece rituais na área.', true],
  ]),
  ...r('Medo', 3, [['Dissipar Ritual', 'Acaba com um ritual ativo.', true]]),
  ...r('Medo', 4, [
    ['Canalizar o Medo', 'Transfere um poder do Medo para outra pessoa.', true],
    ['Conhecendo o Medo', 'Mostra o Medo puro ao alvo, com efeitos terríveis.', true],
    ['Lâmina do Medo', 'Cria uma lâmina de Medo que corta qualquer coisa.', true],
    ['Medo Tangível', 'O corpo ignora ferimentos comuns.', true],
  ]),
]

/** Quantos rituais por elemento (para conferir a lista). */
export const contarRituais = () => RITUAIS_ORDEM.reduce<Record<string, number>>((a, x) => ({ ...a, [x.elemento]: (a[x.elemento] ?? 0) + 1 }), {})
