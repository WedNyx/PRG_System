/** Dados públicos de apresentação, nunca credenciais ou autorização. */
export const AVENTUREIRO_APELIDO_MIN = 3
export const AVENTUREIRO_APELIDO_MAX = 40

export function validarApelidoAventureiro(valor: unknown):
  | { ok: true; apelido: string }
  | { ok: false; erro: string } {
  if (typeof valor !== 'string') return { ok: false, erro: 'Informe um apelido válido.' }
  const apelido = valor.trim().replace(/\s+/g, ' ')
  if (apelido.length < AVENTUREIRO_APELIDO_MIN || apelido.length > AVENTUREIRO_APELIDO_MAX)
    return { ok: false, erro: 'O apelido deve ter entre 3 e 40 caracteres.' }
  if (/[\u0000-\u001f\u007f]/.test(apelido))
    return { ok: false, erro: 'O apelido contém caracteres inválidos.' }
  return { ok: true, apelido }
}

/** O apelido não é identificador de login; o ID da conta é imutável. */
export type AventureiroPublico = {
  id: string
  apelido: string
  avatarUrl: string | null
}
