/**
 * @usuario (v0.37.0): nome único e curto, tipo Discord/X (@lestedraco). O apelido continua livre para mostrar;
 * o @ serve para achar a pessoa e convidar para campanhas. Mesmas regras do banco (migração 040).
 */
export const USUARIO_MIN = 3
export const USUARIO_MAX = 20
const FORMATO = /^[a-z0-9_.]{3,20}$/

/** Tira o "@", espaços e deixa minúsculo (o que a pessoa digitou → o que vai pro banco). */
export const limparUsuario = (v: unknown) => typeof v === 'string' ? v.trim().replace(/^@+/, '').toLowerCase() : ''

export function validarUsuario(v: unknown): { ok: true; usuario: string } | { ok: false; erro: string } {
  const usuario = limparUsuario(v)
  if (usuario.length < USUARIO_MIN || usuario.length > USUARIO_MAX) return { ok: false, erro: `O @ deve ter de ${USUARIO_MIN} a ${USUARIO_MAX} letras.` }
  if (!FORMATO.test(usuario)) return { ok: false, erro: 'Use só letras sem acento, números, "_" e ".".' }
  if (/^\.|\.$|\.\./.test(usuario)) return { ok: false, erro: 'O @ não pode começar nem terminar com ponto, nem ter dois pontos seguidos.' }
  return { ok: true, usuario }
}

/** Sugestão de @ a partir do apelido (igual à do banco): "Leste Draco" → "leste_draco". */
export function sugerirUsuario(apelido: string): string {
  const base = apelido.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/\s+/g, '_').replace(/[^a-z0-9_.]/g, '').replace(/\.{2,}/g, '.').slice(0, USUARIO_MAX).replace(/^[._]+|[._]+$/g, '')
  return base.length >= USUARIO_MIN ? base : 'aventureiro'
}

/** Termo de busca seguro para o filtro do banco (só caracteres do @). */
export const termoDeBusca = (v: unknown) => limparUsuario(v).replace(/[^a-z0-9_.]/g, '').slice(0, USUARIO_MAX)
/** Termo para buscar pelo nome: letras (com acento), números, espaço, "_", "." e "-" — nada que quebre o filtro. */
export const termoDeNome = (v: unknown) => typeof v === 'string' ? v.trim().replace(/^@+/, '').replace(/[^\p{L}\p{N} _.-]/gu, '').replace(/\s+/g, ' ').slice(0, 40) : ''
