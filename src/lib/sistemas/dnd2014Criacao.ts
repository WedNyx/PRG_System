/**
 * Seletores de criação LEGADA (Player's Handbook 2014 / D&D 5e).
 * São METADADOS de identificação, sem transcrever descrições de livros pagos.
 * O motor SRD 5.2.1 só funciona em fichas com livro-base 2024; em 2014 a
 * interface guia o preenchimento sem aplicar efeitos errados de 2024.
 */
import type { Sistema, DadosFicha, OpcaoCampo } from './tipos'
import { lerLivrosDnd, type LivroBaseDnd } from './dndLivros'

const op = (nome: string, descricao: string): OpcaoCampo => ({ nome, descricao })
export const RACAS_2014: OpcaoCampo[] = [
  op('Anão', 'PHB 2014: Constituição +2; escolha Anão da Colina ou da Montanha.'),
  op('Elfo', 'PHB 2014: Destreza +2; escolha Alto Elfo, Elfo da Floresta ou Drow.'),
  op('Halfling', 'PHB 2014: Destreza +2; escolha Pés-Leves ou Robusto.'),
  op('Humano', 'PHB 2014: seis atributos +1; Humano Variante é opção sujeita à aprovação do mestre.'),
  op('Draconato', 'PHB 2014: Força +2, Carisma +1; ancestral dracônico e arma de sopro de 2014.'),
  op('Gnomo', 'PHB 2014: Inteligência +2; escolha Gnomo da Floresta ou das Rochas.'),
  op('Meio-Elfo', 'PHB 2014: Carisma +2 e +1 em dois atributos diferentes à escolha.'),
  op('Meio-Orc', 'PHB 2014: Força +2, Constituição +1.'),
  op('Tiferino', 'PHB 2014: Inteligência +1, Carisma +2.'),
]
export const ANTECEDENTES_2014: OpcaoCampo[] = [
  op('Acólito', 'PHB 2014: Intuição, Religião; idiomas e Abrigo dos Fiéis.'),
  op('Charlatão', 'PHB 2014: Enganação, Prestidigitação; Identidade Falsa.'),
  op('Criminoso', 'PHB 2014: Enganação, Furtividade; Contato Criminoso.'),
  op('Artista', 'PHB 2014: Acrobacia, Atuação; Pela Demanda Popular.'),
  op('Herói do Povo', 'PHB 2014: Adestrar Animais, Sobrevivência; Hospitalidade Rústica.'),
  op('Artesão de Guilda', 'PHB 2014: Intuição, Persuasão; Associação a Guilda.'),
  op('Eremita', 'PHB 2014: Medicina, Religião; Descoberta.'),
  op('Nobre', 'PHB 2014: História, Persuasão; Posição de Privilégio.'),
  op('Forasteiro', 'PHB 2014: Atletismo, Sobrevivência; Viajante.'),
  op('Sábio', 'PHB 2014: Arcanismo, História; Pesquisador.'),
  op('Marinheiro', 'PHB 2014: Atletismo, Percepção; Passagem de Navio.'),
  op('Soldado', 'PHB 2014: Atletismo, Intimidação; Patente Militar.'),
  op('Órfão', 'PHB 2014: Prestidigitação, Furtividade; Segredos da Cidade.'),
]
export const SUBRACAS_2014: Record<string, { nome: string; detalhe: string }[]> = {
  'Anão': [
    { nome: 'Anão da Colina', detalhe: '+1 Sabedoria e +1 PV por nível.' },
    { nome: 'Anão da Montanha', detalhe: '+2 Força e treinamento em armaduras leves e médias.' },
  ],
  'Elfo': [
    { nome: 'Alto Elfo', detalhe: '+1 Inteligência, truque de Mago e idioma adicional.' },
    { nome: 'Elfo da Floresta', detalhe: '+1 Sabedoria e deslocamento maior.' },
    { nome: 'Drow', detalhe: '+1 Carisma, magia drow e visão no escuro superior.' },
  ],
  'Halfling': [
    { nome: 'Pés-Leves', detalhe: '+1 Carisma e Furtividade Natural.' },
    { nome: 'Robusto', detalhe: '+1 Constituição e resiliência à veneno.' },
  ],
  'Gnomo': [
    { nome: 'Gnomo da Floresta', detalhe: '+1 Destreza e comunicação com animais pequenos.' },
    { nome: 'Gnomo das Rochas', detalhe: '+1 Constituição e engenhocas legadas.' },
  ],
  'Humano': [
    { nome: 'Humano padrão', detalhe: '+1 em cada um dos seis atributos.' },
    { nome: 'Humano Variante', detalhe: '+1 em dois atributos, uma perícia e um talento, com anuência do mestre.' },
  ],
}
export function esquemaFichaPorLivro(s: Sistema, d: Pick<DadosFicha,'dndLivros'>, obrigatorio?: LivroBaseDnd | null): Sistema {
  if (s.id !== 'dnd5e-srd' || (obrigatorio ?? lerLivrosDnd(d.dndLivros).base) !== 'phb2014') return s
  return { ...s, regraLivroDnd: 'phb2014' as const, nome: 'D&D 5e (2014) — Livro do Jogador', resumo: 'Regras legadas de 2014: seleção de raça/sub-raça e antecedentes próprios. Regras automáticas do SRD 5.1 para atributos raciais, perícias, salvaguardas e recursos básicos. Opções comerciais e subclasses: revisão manual.',
    campos: s.campos.map(c => {
      if (c.id === 'especie') return { ...c, nome: 'Raça (Livro do Jogador 2014)', opcoes: RACAS_2014 }
      if (c.id === 'antecedente') return { ...c, nome: 'Antecedente (Livro do Jogador 2014)', opcoes: ANTECEDENTES_2014 }
      return c
    }),
    recursos: s.recursos.filter(x => !['magia_origem_gratis','magia_humano_gratis','magia_especie_3','magia_especie_5','magia_gnomo_animais','marca_cacador','pontos_sorte'].includes(x.id))
      .map(x => x.id === 'foco' ? { ...x, nome: 'Pontos de Ki (Monge 2014)' }
        : x.id === 'inspiracao' ? { ...x, nome: 'Inspiração (2014)', contador: true }
        : x.id === 'exaustao' ? { ...x, nome: 'Exaustão 2014 (efeitos por nível, não −2 por nível)', baixaNoDescanso: 0 }
        : x),
    observacoes: [...(s.observacoes ?? []), 'Edição 2014 (SRD 5.1): bônus raciais aplicados apenas a valores-base confirmados, perícias e salvaguardas automáticas, recursos gerais. Subclasses, progressão avançada e suplementos comerciais exigem conferência manual.'],
  }
}


/** Evita gravar características e preparações 2024 novas numa ficha 2014.
 * Dados antigos ficam preservados para quem voltar à edição revisada.
 */
export function validarAlteracoesExclusivas2024(
  antes: Partial<DadosFicha>, depois: Partial<DadosFicha>,
): string[] {
  const chaves = ['dndEscolhas','dndMagias','dndAntecedente','dndTalentoHumano','dndMulticlasse'] as const
  return chaves.filter(k => JSON.stringify(antes[k] ?? null) !== JSON.stringify(depois[k] ?? null))
    .map(k => 'A opção ' + k + ' pertence ao motor de 2024 e não pode ser alterada numa ficha de 2014.')
}
