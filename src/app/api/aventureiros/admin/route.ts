import { lerJson, ok, rota } from '@/lib/nuvem/servidor'
import { exigirAdmin } from '@/lib/nuvem/admin'

export const dynamic = 'force-dynamic'

/** Confere a senha de administrador (para liberar “Gerenciar perfis”). */
export const POST = rota(async req => {
  const b = await lerJson(req, 1000) as { senha?: unknown }
  await exigirAdmin(req, b.senha)
  return ok({ ok: true })
})
