/**
 * Formato de TEXTO para escrever um sistema fora da plataforma e importar no construtor.
 * Pensado para ser fácil de escrever no bloco de notas ou no celular. Ida e volta testadas (texto.test.ts).
 */
import { slug } from './autoral'
import type { Sistema } from './tipos'

type Def = Record<string, unknown>
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const MODS: Record<string, string> = { igual: '', proprio: '', valor: '', dnd: 'piso((X - 10) / 2)', metade: 'piso(X / 2)' }
const SECOES: [RegExp, string][] = [
  [/^(sistema|sobre)$/, 'sobre'], [/^(identidade|campos)$/, 'campos'], [/^atributos?$/, 'atributos'],
  [/^(valores|valores calculados|calculados|derivados)$/, 'derivados'], [/^pericias?$/, 'pericias'], [/^recursos?$/, 'recursos'],
  [/^(textos|espacos de texto|listas)$/, 'listas'], [/^limites?$/, 'limites'], [/^carga$/, 'carga'], [/^(regras|lembretes|observacoes)$/, 'regras'],
]
/** "Vida máxima {vida} = 10 + FOR" → nome, id opcional e o resto. */
function nomeComId(s: string): { nome: string; id?: string } {
  const m = s.match(/^(.*?)\s*\{([A-Za-z][A-Za-z0-9_]{0,23})\}\s*$/)
  return m ? { nome: m[1].trim(), id: m[2] } : { nome: s.trim() }
}

export type ResultadoImportacao = { definicao: Def; avisos: string[] }

/** Lê o formato de texto. Linhas que não entende viram avisos (com o número da linha). */
export function lerTextoSistema(texto: string): ResultadoImportacao {
  const avisos: string[] = []
  const d = { campos: [] as Def[], atributos: [] as Def[], derivados: [] as Def[], recursos: [] as Def[], listas: [] as Def[], limites: [] as Def[], observacoes: [] as string[] } as Def & Record<string, unknown>
  const per = { modo: 'treino', total: '', treinos: [] as Def[], lista: [] as Def[], titulo: '' }
  let secao = 'sobre', grupo = '', temPericias = false
  const carga = { formula: '', unidade: 'kg' }
  const linhas = texto.replace(/\r/g, '').split('\n')
  linhas.forEach((bruta, i) => {
    const n = i + 1
    const l = bruta.replace(/\s+\/\/.*$/, '').trim()
    if (!l || l.startsWith('//')) return
    const cab = l.match(/^\[(.+)\]$/) ?? l.match(/^#{1,3}\s*(.+)$/)
    if (cab) {
      const alvo = SECOES.find(([re]) => re.test(norm(cab[1])))
      if (alvo) { secao = alvo[1]; grupo = ''; if (secao === 'pericias') temPericias = true } else avisos.push(`Linha ${n}: seção “${cab[1]}” desconhecida.`)
      return
    }
    const chave = l.match(/^([A-Za-zÀ-ÿ ]{2,20}):\s*(.*)$/)
    const k = chave ? norm(chave[1]) : ''
    const v = chave ? chave[2].trim() : ''
    // Cabeçalho (vale em qualquer seção)
    if (chave && ['sistema', 'nome'].includes(k) && secao === 'sobre') { d.nome = v; return }
    if (chave && ['descricao', 'resumo'].includes(k)) { d.resumo = v; return }
    if (chave && k === 'dados') {
      d.dados = v; const nv = norm(v)
      if (!d.rolagem) d.rolagem = nv.startsWith('d100') ? 'd100' : nv.startsWith('nenhum') || nv === 'livre' ? 'nenhuma' : 'd20'
      return
    }
    if (chave && k === 'rolagem') { const nv = norm(v); d.rolagem = nv.startsWith('d100') || nv.startsWith('porcent') ? 'd100' : nv.startsWith('nenhum') ? 'nenhuma' : 'd20'; return }
    if (chave && k === 'creditos') { d.creditos = v; return }

    switch (secao) {
      case 'campos': {
        const m = l.match(/^(.+?)(?::\s*(numero|número|texto longo|texto|area))?(?:\s*=\s*(-?\d+(?:\.\d+)?))?$/i)
        if (!m) break
        const { nome, id } = nomeComId(m[1]); const t = norm(m[2] ?? 'texto')
        const tipo = t === 'numero' ? 'numero' : t.startsWith('texto longo') || t === 'area' ? 'area' : 'texto'
        ;(d.campos as Def[]).push({ ...(id ? { id } : {}), nome, tipo, ...(tipo === 'numero' ? { padrao: Number(m[3] ?? 0) } : {}) })
        return
      }
      case 'atributos': {
        if (chave && k === 'modificador') { const nv = norm(v); d.formulaModificador = nv in MODS ? MODS[nv] : v; return }
        const m = l.match(/^([A-Za-z][A-Za-z0-9_]{0,5})\s+(.+?)(?:\s+(-?\d+)\s*(?:-|–|a|até)\s*(-?\d+))?(?:\s*=\s*(-?\d+))?$/i)
        if (!m) break
        const min = m[3] !== undefined ? Number(m[3]) : 0, max = m[4] !== undefined ? Number(m[4]) : 5
        if (m[3] === undefined) avisos.push(`Linha ${n}: “${m[2]}” sem mínimo e máximo; usei 0 a 5.`)
        ;(d.atributos as Def[]).push({ id: m[1].toUpperCase(), nome: m[2].trim(), min, max, padrao: m[5] !== undefined ? Number(m[5]) : min })
        return
      }
      case 'derivados': {
        const m = l.match(/^(.+?)\s*=\s*(.+)$/)
        if (!m) break
        const { nome, id } = nomeComId(m[1]); const [formula, dica] = m[2].split(/\s+\|\s+/)
        ;(d.derivados as Def[]).push({ ...(id ? { id } : {}), nome, formula: formula.trim(), ...(dica ? { dica: dica.trim() } : {}) })
        return
      }
      case 'pericias': {
        if (chave && k === 'tipo') { const nv = norm(v); per.modo = nv.startsWith('numero') || nv.startsWith('porcent') || nv === 'valor' ? 'valor' : nv.startsWith('nenhum') || nv === 'sem' ? 'nenhuma' : 'treino'; return }
        if (chave && k === 'total') { per.total = v; return }
        if (chave && k === 'titulo') { per.titulo = v; return }
        if (chave && k === 'grupo') { grupo = v; return }
        if (chave && k === 'grau') {
          const m = v.match(/^(.+?)\s*=\s*(.+?)(?:\s*\(\s*custo\s*(\d+)\s*\))?$/i)
          if (!m) { avisos.push(`Linha ${n}: grau precisa ser “grau: Nome = bônus”.`); return }
          const g = nomeComId(m[1])
          per.treinos.push({ ...(g.id ? { id: g.id } : {}), nome: g.nome, formula: m[2].replace(/^\+/, '').trim(), ...(m[3] ? { custo: Number(m[3]) } : {}) })
          return
        }
        const m = l.match(/^(.+?)(?:\s*\(([A-Za-z0-9_/ ]+)\))?(?:\s+[-—–]\s+(.+))?$/)
        if (!m) break
        const { nome, id } = nomeComId(m[1])
        per.lista.push({ ...(id ? { id } : {}), nome, ...(m[2] ? { atributo: m[2].replace(/\s+/g, '').toUpperCase() } : {}), ...((m[3] ?? grupo) ? { grupo: (m[3] ?? grupo).trim() } : {}) })
        return
      }
      case 'recursos': {
        const fixo = l.match(/^(.+?)\s*\(\s*m[aá]ximo\s+(\d+)\s*\)$/i)
        if (fixo) { const { nome, id } = nomeComId(fixo[1]); (d.recursos as Def[]).push({ ...(id ? { id } : {}), nome, maxFixo: Number(fixo[2]) }); return }
        const m = l.match(/^(.+?)(?:\s*=\s*(.+))?$/)
        if (!m) break
        const { nome, id } = nomeComId(m[1])
        ;(d.recursos as Def[]).push({ ...(id ? { id } : {}), nome, ...(m[2] ? { formula: m[2].trim() } : {}) })
        return
      }
      case 'listas': { const { nome, id } = nomeComId(l); (d.listas as Def[]).push({ ...(id ? { id } : {}), nome }); return }
      case 'limites': {
        const m = l.match(/^(.+?):\s*(.+?)\s*(?:<=|≤|até)\s*(.+)$/)
        if (!m) { avisos.push(`Linha ${n}: limite precisa ser “Nome: uso <= máximo”.`); return }
        ;(d.limites as Def[]).push({ nome: m[1].trim(), uso: m[2].trim(), max: m[3].trim() })
        return
      }
      case 'carga': {
        if (chave && k === 'unidade') { carga.unidade = v; return }
        carga.formula = chave && k === 'capacidade' ? v : l
        return
      }
      case 'regras': (d.observacoes as string[]).push(l.replace(/^[-•*]\s*/, '')); return
    }
    avisos.push(`Linha ${n}: não entendi “${l.slice(0, 60)}”.`)
  })
  if (temPericias && per.modo !== 'nenhuma') {
    if (per.modo === 'treino' && !per.treinos.length) per.treinos.push({ nome: 'Destreinado', formula: '0' }, { nome: 'Treinado', formula: '2' })
    d.pericias = { modo: per.modo, total: per.total || (per.modo === 'valor' ? 'VALOR' : 'MOD + TREINO'), ...(per.titulo ? { titulo: per.titulo } : {}), treinos: per.treinos, lista: per.lista }
  }
  if (carga.formula) d.carga = carga
  if (!d.nome) avisos.push('Faltou a linha “SISTEMA: nome do sistema”.')
  return { definicao: d, avisos }
}

/** Escreve um sistema no formato de texto (para baixar, editar e importar de volta). */
export function textoDoSistema(s: Partial<Sistema>): string {
  const L: string[] = []
  const id = (nome: string, idReal: string, maiusculo = false) => slug(nome, maiusculo) === idReal ? '' : ` {${idReal}}`
  L.push(`SISTEMA: ${s.nome ?? ''}`)
  if (s.resumo) L.push(`DESCRIÇÃO: ${s.resumo}`)
  L.push(`DADOS: ${s.dados ?? 'd20'}`)
  if (s.rolagem) L.push(`ROLAGEM: ${s.rolagem}`)
  if (s.creditos) L.push(`CRÉDITOS: ${s.creditos}`)
  if (s.campos?.length) { L.push('', '[IDENTIDADE]'); for (const c of s.campos) L.push(`${c.nome}${id(c.nome, c.id)}${c.tipo === 'numero' ? `: número = ${c.padrao ?? 0}` : c.tipo === 'area' ? ': texto longo' : ''}`) }
  if (s.atributos?.length) {
    L.push('', '[ATRIBUTOS]')
    const mod = Object.entries(MODS).find(([, f]) => f === (s.formulaModificador ?? ''))?.[0]
    L.push(`modificador: ${mod === 'proprio' || mod === 'valor' ? 'igual' : mod ?? s.formulaModificador}`)
    for (const a of s.atributos) L.push(`${a.id} ${a.nome} ${a.min}-${a.max} = ${a.padrao}`)
  }
  if (s.derivados?.length) { L.push('', '[VALORES]'); for (const x of s.derivados) L.push(`${x.nome}${id(x.nome, x.id)} = ${x.formula}${x.dica ? ` | ${x.dica}` : ''}`) }
  if (s.pericias) {
    const p = s.pericias
    L.push('', '[PERÍCIAS]', `tipo: ${p.modo === 'valor' ? 'número' : 'graus'}`, `total: ${p.total}`)
    if (p.titulo) L.push(`título: ${p.titulo}`)
    for (const t of p.treinos ?? []) L.push(`grau: ${t.nome}${id(t.nome, t.id)} = ${t.formula}${t.custo ? ` (custo ${t.custo})` : ''}`)
    let g = ''
    for (const x of p.lista) {
      if ((x.grupo ?? '') !== g) { g = x.grupo ?? ''; L.push(`grupo: ${g}`) }
      L.push(`${x.nome}${id(x.nome, x.id)}${x.atributo ? ` (${x.atributo})` : ''}`)
    }
  }
  if (s.recursos?.length) { L.push('', '[RECURSOS]'); for (const r of s.recursos) L.push(`${r.nome}${id(r.nome, r.id)}${r.formula ? ` = ${r.formula}` : r.maxFixo ? ` (máximo ${r.maxFixo})` : ''}`) }
  if (s.listas?.length) { L.push('', '[TEXTOS]'); for (const l of s.listas) L.push(`${l.nome}${id(l.nome, l.id)}`) }
  if (s.limites?.length) { L.push('', '[LIMITES]'); for (const l of s.limites) L.push(`${l.nome}: ${l.uso} <= ${l.max}`) }
  if (s.carga?.formula) L.push('', '[CARGA]', `capacidade: ${s.carga.formula}`, `unidade: ${s.carga.unidade}`)
  if (s.observacoes?.length) { L.push('', '[REGRAS]'); for (const o of s.observacoes) L.push(o) }
  return L.join('\n') + '\n'
}

/** Arquivo .json exportado pelo construtor (ou só a definição). */
export function lerJsonSistema(texto: string): ResultadoImportacao {
  let o: unknown
  try { o = JSON.parse(texto) } catch { return { definicao: {}, avisos: ['O arquivo .json está com erro de formato.'] } }
  const obj = (o && typeof o === 'object' ? o : {}) as Def
  const def = (obj.formato === 'prg-sistema' && obj.sistema && typeof obj.sistema === 'object' ? obj.sistema : obj) as Def
  const { id: _id, tipo: _t, licenca: _l, autor: _a, ...resto } = def; void _id; void _t; void _l; void _a
  return { definicao: resto, avisos: def.nome ? [] : ['O arquivo não tem o nome do sistema.'] }
}
export const jsonDoSistema = (s: Partial<Sistema>) => JSON.stringify({ formato: 'prg-sistema', versao: 1, sistema: s }, null, 2)

/** Modelo comentado para baixar e preencher. */
export const MODELO_TEXTO = `// Modelo de sistema para o PRG System. Linhas com // são comentários (pode apagar).
// Preencha, salve como .txt e importe em “Criar sistema autoral” → “Importar arquivo”.
// Nas fórmulas, use os nomes em minúsculas, sem acento e com _ no lugar de espaço
// (ex.: “Vida máxima” vira vida_maxima). Para escolher outro nome, escreva {nome} depois: Vida máxima {vida} = ...

SISTEMA: Crônicas da Névoa
DESCRIÇÃO: Mistério e magia numa cidade coberta de névoa.
DADOS: d20            // d20 (d20 + bônus), d100 (porcentagem) ou nenhum

[IDENTIDADE]
Conceito
Origem
Nível: número = 1
História: texto longo

[ATRIBUTOS]
modificador: igual    // igual (o próprio valor), dnd ((valor − 10) ÷ 2), metade, ou uma fórmula com X
FOR Força 0-5 = 1
AGI Agilidade 0-5 = 1
MEN Mente 0-5 = 1

[VALORES]
Vida máxima {vida_max} = 10 + FOR * 2 + nivel * 3
Defesa = 10 + AGI | Somar armadura à parte
Iniciativa = AGI

[PERÍCIAS]
tipo: graus           // graus (destreinado, treinado…) ou número (pontos/porcentagem)
total: MOD + TREINO   // modificador do atributo + bônus do grau
grau: Destreinado = 0
grau: Treinado = 2 (custo 1)
grau: Mestre = 4 (custo 3)
grupo: Combate
Luta (FOR)
Pontaria (AGI)
grupo: Exploração
Furtividade (AGI)
Investigação (MEN)

[RECURSOS]
Vida = vida_max
Mana = MEN * 3
Sorte (máximo 3)
Ferimentos            // sem fórmula: o jogador digita o máximo

[TEXTOS]
Habilidades
Anotações e história

[LIMITES]
Pontos de atributo: soma_atributos - 3 <= 4

[CARGA]
capacidade: FOR * 5
unidade: kg

[REGRAS]
20 natural no d20 é sucesso crítico.
Descansar recupera metade da Vida.
`
