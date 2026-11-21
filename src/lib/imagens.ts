/** Imagem enviada pela própria plataforma (bucket público prg-mesa do Supabase). Sem rede: dá para usar no navegador e no servidor. */
export function imagemDaPlataforma(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 500 && /^https?:\/\/[^\s"'<>()]+\/storage\/v1\/object\/public\/prg-mesa\/[A-Za-z0-9/_.-]+\.(png|jpe?g|webp)$/.test(v)
}
/** Origem (protocolo+host) do Storage do Supabase configurado nesta instância, para não aceitar um áudio de outro servidor. */
function origemStorage(): string | null {
  const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  try { return base ? new URL(base).origin : null } catch { return null }
}
/** Áudio enviado pela própria plataforma para esta campanha (bucket prg-mesa/<campanha>/…). Usado pela Mesa de Som (v0.36.6). */
export function audioDaPlataforma(v: unknown, campanhaId?: string): v is string {
  if (typeof v !== 'string' || v.length > 500) return false
  const origem = origemStorage()
  if (!origem) return false
  // Confere o pathname já separado da query/âncora (não a string bruta): um "?x=/storage/.../prg-mesa/<campanha-certa>/a.mp3"
  // no final da URL faria o regex antigo casar com a campanha certa enquanto o arquivo de fato buscado era outro (achado do Codex).
  let u: URL
  try { u = new URL(v) } catch { return false }
  if (u.origin !== origem) return false
  const m = /^\/storage\/v1\/object\/public\/prg-mesa\/([0-9a-f-]{36})\/[A-Za-z0-9_.-]+\.(mp3|ogg|wav|m4a|aac|webm)$/.exec(u.pathname)
  return !!m && (!campanhaId || m[1] === campanhaId)
}
