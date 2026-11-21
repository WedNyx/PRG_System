/** Imagem enviada pela própria plataforma (bucket público prg-mesa do Supabase). Sem rede: dá para usar no navegador e no servidor. */
export function imagemDaPlataforma(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 500 && /^https?:\/\/[^\s"'<>()]+\/storage\/v1\/object\/public\/prg-mesa\/[A-Za-z0-9/_.-]+\.(png|jpe?g|webp)$/.test(v)
}
/** Áudio enviado pela própria plataforma para esta campanha (bucket prg-mesa/<campanha>/…). Usado pela Mesa de Som (v0.36.6). */
export function audioDaPlataforma(v: unknown, campanhaId?: string): v is string {
  if (typeof v !== 'string' || v.length > 500) return false
  const m = /^https?:\/\/[^\s"'<>()]+\/storage\/v1\/object\/public\/prg-mesa\/([0-9a-f-]{36})\/[A-Za-z0-9_.-]+\.(mp3|ogg|wav|m4a|aac|webm)$/.exec(v)
  return !!m && (!campanhaId || m[1] === campanhaId)
}
