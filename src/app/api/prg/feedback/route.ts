import { ator, lerJson, ok, q, rest, rota, ErroApi } from '@/lib/nuvem/servidor'
import { mensagemDiscord, validarFeedback, webhookValido } from '@/lib/feedback'

export const dynamic = 'force-dynamic'

/**
 * Feedback (v0.37.0): fica guardado no banco e é avisado num canal privado do Discord do Wed (webhook).
 * Nunca por e-mail. O link do webhook fica só na Vercel (DISCORD_WEBHOOK_FEEDBACK), nunca no navegador.
 * Limites contra flood: 3 a cada 10 minutos e 10 por dia por perfil; 40 por hora no site todo.
 */
export const POST = rota(async req => {
  const eu = await ator(req)
  const v = validarFeedback(await lerJson(req, 5000))
  if (!v.ok) throw new ErroApi(400, v.erro)
  const desde = (min: number) => q(new Date(Date.now() - min * 60_000).toISOString())
  const [recentes, hoje, geral] = await Promise.all([
    rest<unknown[]>(`prg_feedback?select=id&autor_id=eq.${q(eu)}&criado_em=gt.${desde(10)}&limit=3`),
    rest<unknown[]>(`prg_feedback?select=id&autor_id=eq.${q(eu)}&criado_em=gt.${desde(1440)}&limit=10`),
    rest<unknown[]>(`prg_feedback?select=id&criado_em=gt.${desde(60)}&limit=40`),
  ])
  if (recentes.length >= 3) throw new ErroApi(429, 'Você mandou vários seguidos. Espere uns minutinhos.')
  if (hoje.length >= 10) throw new ErroApi(429, 'Limite de 10 feedbacks por dia. Obrigado por ajudar tanto!')
  if (geral.length >= 40) throw new ErroApi(429, 'Muita gente mandando agora. Tente daqui a pouco.')

  const [linha] = await rest<{ id: number }[]>('prg_feedback', { method: 'POST', prefer: 'return=representation', body: JSON.stringify({ autor_id: eu, ...v.valor }) })
  const hook = process.env.DISCORD_WEBHOOK_FEEDBACK
  if (hook && webhookValido(hook)) {
    try {
      const [p] = await rest<{ apelido: string; usuario?: string }[]>(`prg_public_adventurers?select=apelido,usuario&id=eq.${q(eu)}&limit=1`)
      const r = await fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mensagemDiscord(v.valor, p ?? { apelido: 'Alguém' })), signal: AbortSignal.timeout(5000) })
      if (r.ok) await rest(`prg_feedback?id=eq.${linha.id}`, { method: 'PATCH', body: JSON.stringify({ enviado: true }) })
    } catch { /* o Discord fora do ar não perde o feedback: ele já está no banco */ }
  }
  return ok({ ok: true }, 201)
})
