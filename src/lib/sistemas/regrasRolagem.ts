/** Rolagens personalizadas dos sistemas autorais: modelos prontos e validação da fórmula. */
import { montarRolagem, rolarExpressao } from '../dice'

export type RegraRolagem = { nome: string; formula: string }

/** Modelos para começar (VALOR = o número do atributo/perícia em que a pessoa tocou). */
export const MODELOS_ROLAGEM: (RegraRolagem & { id: string; explica: string })[] = [
  { id: 'd20', nome: 'd20 + valor', formula: '1d20+VALOR', explica: 'Um d20 somando o valor. O clássico.' },
  { id: 'vantagem', nome: 'Vantagem', formula: '2d20kh1+VALOR', explica: 'Rola 2d20, fica com o maior e soma o valor.' },
  { id: 'desvantagem', nome: 'Desvantagem', formula: '2d20kl1+VALOR', explica: 'Rola 2d20, fica com o menor e soma o valor.' },
  { id: '2d6', nome: '2d6 + valor', formula: '2d6+VALOR', explica: 'Estilo Powered by the Apocalypse.' },
  { id: '3d6', nome: '3d6 + valor', formula: '3d6+VALOR', explica: 'Curva suave, resultados mais previsíveis.' },
  { id: 'pool-soma', nome: 'Pool somada', formula: 'VALORd6', explica: 'Rola tantos d6 quanto o valor e soma tudo.' },
  { id: 'sucessos', nome: 'Contar sucessos', formula: 'VALORd6s5', explica: 'Rola tantos d6 quanto o valor; cada 5 ou 6 é um sucesso.' },
  { id: 'roll-keep', nome: 'Rola e mantém', formula: 'VALORd10!kh2', explica: 'Rola tantos d10 quanto o valor (10 explode) e soma os 2 maiores.' },
  { id: 'atributos', nome: 'Gerar atributo', formula: '4d6kh3', explica: 'Rola 4d6 e soma os 3 maiores (não usa o valor).' },
  { id: 'fate', nome: 'Fate (dados Fudge)', formula: '4dF+VALOR', explica: 'Quatro dados de −1, 0 ou +1, somando o valor.' },
  { id: 'explosivo', nome: 'Dado explosivo', formula: '1d6!+VALOR', explica: 'Tirou 6? Rola de novo e soma.' },
  { id: 'rerrola', nome: 'Rerrolar 1', formula: '2d6r1+VALOR', explica: 'Quem tirar 1 rola aquele dado mais uma vez.' },
]

/** Pedaços que dá para inserir na fórmula, com explicação curta. */
export const PECAS_ROLAGEM: { texto: string; rotulo: string; dica: string }[] = [
  { texto: 'VALOR', rotulo: 'VALOR', dica: 'O número do atributo/perícia' },
  { texto: '1d20', rotulo: 'd20', dica: 'Um dado de 20 faces' },
  { texto: '1d6', rotulo: 'd6', dica: 'Um dado de 6 faces' },
  { texto: '+', rotulo: '+', dica: 'Somar' }, { texto: '-', rotulo: '−', dica: 'Subtrair' },
  { texto: 'kh1', rotulo: 'Maior', dica: 'Fica com o maior dado (kh1)' }, { texto: 'kl1', rotulo: 'Menor', dica: 'Fica com o menor dado (kl1)' },
  { texto: '!', rotulo: 'Explodir', dica: 'Face máxima rola de novo e soma' }, { texto: 'r1', rotulo: 'Rerrolar 1', dica: 'Rola de novo quem tirar 1' },
  { texto: 's5', rotulo: 'Sucessos ≥5', dica: 'Conta quantos dados tiraram 5 ou mais' },
  { texto: 'dF', rotulo: 'Fudge', dica: 'Dado de −1, 0 ou +1 (ex.: 4dF)' },
]

/** Confere se a fórmula funciona para vários valores. Devolve o erro em português ou null. */
export function erroDaFormula(formula: string): string | null {
  const f = formula.trim()
  if (!f) return 'Escreva a fórmula da rolagem (ex.: 1d20+VALOR).'
  if (f.length > 60) return 'Fórmula longa demais (máximo 60 caracteres).'
  if (!/^[0-9dkhlfrs!+\-\sVALOR]+$/i.test(f)) return 'A fórmula só pode ter dados (ex.: 2d6), números, + e −, VALOR e os sufixos kh, kl, !, r1, s.'
  if (!/d/i.test(f.replace(/VALOR/gi, ''))) return 'A fórmula precisa de pelo menos um dado (ex.: 1d20).'
  for (const v of [0, 3, 12]) if (!rolarExpressao(montarRolagem(f, v))) return `A fórmula não funciona com VALOR = ${v}. Confira os dados e os sufixos (ex.: 2d6s9 não dá: um d6 nunca chega a 9).`
  return null
}
