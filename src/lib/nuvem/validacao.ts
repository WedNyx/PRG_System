/** Validações puras (sem rede) usadas pela API da Fase 1. Testadas em validacao.test.ts. */
import { CAMPOS, REGRAS, permissoesPadrao, type Campo, type Modelo, type Permissoes, type Regra } from '../campanhas/permissoes'
import { lerItens, lerPoderes } from '../sistemas/inventario'

export const ESTADOS = ['planejada', 'ativa', 'pausada', 'encerrada'] as const
export type EstadoCampanha = typeof ESTADOS[number]
export const ESTADO_TITULO: Record<EstadoCampanha, string> = {
  planejada: 'Planejada', ativa: 'Ativa', pausada: 'Pausada', encerrada: 'Encerrada',
}
export const PAPEIS = ['mestre', 'comestre', 'jogador', 'espectador'] as const
export type Papel = typeof PAPEIS[number]

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID.test(v)
export const isModelo = (v: unknown): v is Modelo => v === 'A' || v === 'B' || v === 'C'
export const isEstado = (v: unknown): v is EstadoCampanha => typeof v === 'string' && (ESTADOS as readonly string[]).includes(v)
export const isPapel = (v: unknown): v is Papel => typeof v === 'string' && (PAPEIS as readonly string[]).includes(v)
const isRegra = (v: unknown): v is Regra => REGRAS.some(r => r.id === v)

type Ok<T> = { ok: true; valor: T }
type Erro = { ok: false; erro: string }

/** Aceita só campos conhecidos e regras válidas; o resto vem do modelo padrão. */
export function normalizarPermissoes(valor: unknown, modelo: Modelo): Permissoes {
  const base = permissoesPadrao(modelo)
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return base
  const v = valor as Record<string, unknown>
  for (const c of CAMPOS) if (isRegra(v[c.id])) base[c.id] = v[c.id] as Regra
  return base
}

/** Exceções por jogador: só campos conhecidos (parcial). */
export function normalizarExcecoes(valor: unknown): Partial<Permissoes> {
  const out: Partial<Permissoes> = {}
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return out
  const v = valor as Record<string, unknown>
  for (const c of CAMPOS) if (isRegra(v[c.id])) out[c.id as Campo] = v[c.id] as Regra
  return out
}

export type DadosCampanha = { nome: string; descricao: string; sistema: string; modelo_padrao: Modelo; permissoes: Permissoes; estado?: EstadoCampanha; capa_url?: string | null }

/** Imagem enviada pela própria plataforma (bucket público prg-mesa do Supabase). */
export function imagemDaPlataforma(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 500 && /^https?:\/\/[^\s"'<>()]+\/storage\/v1\/object\/public\/prg-mesa\/[A-Za-z0-9/_.-]+\.(png|jpe?g|webp)$/.test(v)
}

export function validarCampanha(body: unknown, parcial = false): Ok<Partial<DadosCampanha>> | Erro {
  if (!body || typeof body !== 'object') return { ok: false, erro: 'Dados inválidos.' }
  const b = body as Record<string, unknown>
  const out: Partial<DadosCampanha> = {}
  const texto = (k: string, min: number, max: number, nome: string): string | Erro | undefined => {
    if (b[k] === undefined && parcial) return undefined
    if (typeof b[k] !== 'string') return { ok: false, erro: `Informe ${nome}.` }
    const t = (b[k] as string).trim()
    if (t.length < min || t.length > max) return { ok: false, erro: `${nome[0].toUpperCase() + nome.slice(1)} deve ter entre ${min} e ${max} caracteres.` }
    return t
  }
  const nome = texto('nome', 3, 80, 'o nome'); if (typeof nome === 'object') return nome; if (nome !== undefined) out.nome = nome
  const desc = b.descricao === undefined && !parcial ? '' : texto('descricao', 0, 600, 'a descrição')
  if (typeof desc === 'object') return desc; if (desc !== undefined) out.descricao = desc
  const sis = texto('sistema', 2, 80, 'o sistema'); if (typeof sis === 'object') return sis; if (sis !== undefined) out.sistema = sis
  if (b.modeloPadrao !== undefined || !parcial) {
    if (!isModelo(b.modeloPadrao)) return { ok: false, erro: 'Modelo de edição inválido.' }
    out.modelo_padrao = b.modeloPadrao
  }
  if (b.permissoes !== undefined || !parcial) out.permissoes = normalizarPermissoes(b.permissoes, out.modelo_padrao ?? 'C')
  if (b.estado !== undefined) {
    if (!isEstado(b.estado)) return { ok: false, erro: 'Estado da campanha inválido.' }
    out.estado = b.estado
  }
  if (b.capa !== undefined) {
    if (b.capa !== null && !imagemDaPlataforma(b.capa)) return { ok: false, erro: 'Capa inválida: envie a imagem pela plataforma.' }
    out.capa_url = b.capa as string | null
  }
  return { ok: true, valor: out }
}

/** Códigos sem letras/números ambíguos (sem I, O, 0, 1). */
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const CODIGO_REGEX = /^[A-HJ-NP-Z2-9]{8}$/
export function gerarCodigoConvite(rand: (n: number) => Uint8Array = n => crypto.getRandomValues(new Uint8Array(n))): string {
  // 256 % 32 === 0, então não há viés de módulo.
  return Array.from(rand(8), b => ALFABETO[b % ALFABETO.length]).join('')
}
export function normalizarCodigo(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const c = v.trim().toUpperCase().replace(/[\s-]/g, '')
  return CODIGO_REGEX.test(c) ? c : null
}

export const DIAS_CONVITE_PADRAO = 7
export function validarConvite(body: unknown): Ok<{ dias: number; maxUsos: number }> | Erro {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  const dias = b.dias === undefined ? DIAS_CONVITE_PADRAO : Number(b.dias)
  const maxUsos = b.maxUsos === undefined ? 20 : Number(b.maxUsos)
  if (!Number.isInteger(dias) || dias < 1 || dias > 30) return { ok: false, erro: 'Validade do convite: de 1 a 30 dias.' }
  if (!Number.isInteger(maxUsos) || maxUsos < 1 || maxUsos > 100) return { ok: false, erro: 'Limite de usos: de 1 a 100.' }
  return { ok: true, valor: { dias, maxUsos } }
}

export type ConviteRow = { codigo: string; expira_em: string; usos: number; max_usos: number; revogado: boolean }
export function situacaoConvite(c: ConviteRow, agora = Date.now()): 'valido' | 'revogado' | 'expirado' | 'esgotado' {
  if (c.revogado) return 'revogado'
  if (Date.parse(c.expira_em) <= agora) return 'expirado'
  if (c.usos >= c.max_usos) return 'esgotado'
  return 'valido'
}

/** Ficha: dados JSON da Ficha V8 (ou outro sistema), com limite de tamanho. */
export const FICHA_MAX_BYTES = 500_000
export const SISTEMA_FICHA = /^[a-z0-9-]{2,40}$/
export function validarFichaDados(dados: unknown): Ok<{ dados: Record<string, unknown>; nome: string }> | Erro {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return { ok: false, erro: 'Ficha inválida.' }
  let tamanho: number
  try { tamanho = new TextEncoder().encode(JSON.stringify(dados)).length } catch { return { ok: false, erro: 'Ficha inválida.' } }
  if (tamanho > FICHA_MAX_BYTES) return { ok: false, erro: 'Ficha muito grande (retrato ou textos longos demais).' }
  let d = dados as Record<string, unknown>
  // Retrato das fichas genéricas: só imagens enviadas pela plataforma (nada de links de fora).
  if ('retrato' in d && !imagemDaPlataforma(d.retrato)) { const { retrato: _fora, ...resto } = d; void _fora; d = resto }
  // Itens e poderes guardados já limpos (forma/cores da forja, raridade, bônus e rolagens válidos).
  if (Array.isArray(d.itens)) d = { ...d, itens: lerItens(d.itens) }
  if (Array.isArray(d.poderes)) d = { ...d, poderes: lerPoderes(d.poderes) }
  const fields = d.fields && typeof d.fields === 'object' ? d.fields as Record<string, unknown> : {}
  // Ficha V8 guarda o nome em fields.name; os modelos genéricos, em nome.
  const bruto = typeof fields.name === 'string' ? fields.name : typeof d.nome === 'string' ? d.nome : ''
  const nome = bruto.trim().slice(0, 90)
  return { ok: true, valor: { dados: d, nome } }
}

/** Quem pode administrar a campanha. */
export const podeAdministrar = (papel: Papel | null) => papel === 'mestre' || papel === 'comestre'
/** Espectador só assiste (mesa, música) e conversa no chat; não mexe em nada. */
export const ehEspectador = (papel: Papel | null) => papel === 'espectador'
