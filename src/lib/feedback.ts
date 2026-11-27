/** Feedback (v0.37.0): validação e a mensagem que vai para o canal privado do Discord do Wed. */
export const TIPOS_FEEDBACK = [
  { id: 'ideia', nome: 'Ideia', emoji: '💡' },
  { id: 'problema', nome: 'Problema', emoji: '🐞' },
  { id: 'elogio', nome: 'Elogio', emoji: '💜' },
  { id: 'outro', nome: 'Outro', emoji: '💬' },
] as const
export type TipoFeedback = typeof TIPOS_FEEDBACK[number]['id']
export type Feedback = { tipo: TipoFeedback; texto: string; pagina: string }

export function validarFeedback(b: unknown): { ok: true; valor: Feedback } | { ok: false; erro: string } {
  const o = (b && typeof b === 'object' ? b : {}) as Record<string, unknown>
  const tipo = TIPOS_FEEDBACK.find(t => t.id === o.tipo)?.id ?? 'outro'
  const texto = typeof o.texto === 'string' ? o.texto.trim() : ''
  if (texto.length < 3) return { ok: false, erro: 'Escreva um pouco mais (pelo menos 3 letras).' }
  if (texto.length > 1500) return { ok: false, erro: 'Máximo de 1500 caracteres.' }
  // Só o caminho da página (sem domínio nem ?parâmetros), para saber onde a pessoa estava.
  const pagina = typeof o.pagina === 'string' && o.pagina.startsWith('/') ? o.pagina.split(/[?#]/)[0].slice(0, 200) : ''
  return { ok: true, valor: { tipo, texto, pagina } }
}

/** Só aceita link de webhook do próprio Discord (evita mandar dados para outro lugar por engano). */
export const webhookValido = (u: string) => /^https:\/\/(?:discord\.com|discordapp\.com|ptb\.discord\.com|canary\.discord\.com)\/api\/webhooks\/\d+\/[\w-]+$/.test(u.trim())

/** Mensagem do webhook. `allowed_mentions` vazio: ninguém consegue marcar @everyone ou pessoas pelo feedback. */
export function mensagemDiscord(f: Feedback, autor: { apelido: string; usuario?: string }) {
  const t = TIPOS_FEEDBACK.find(x => x.id === f.tipo)!
  const quem = autor.usuario ? `${autor.apelido} (@${autor.usuario})` : autor.apelido
  return {
    username: 'PRG System · Feedback',
    allowed_mentions: { parse: [] as string[] },
    embeds: [{
      title: `${t.emoji} ${t.nome}`.slice(0, 256),
      description: f.texto.slice(0, 1500),
      color: 0x7654bb,
      fields: [{ name: 'De', value: quem.slice(0, 200), inline: true }, ...(f.pagina ? [{ name: 'Página', value: f.pagina, inline: true }] : [])],
      timestamp: new Date().toISOString(),
    }],
  }
}
