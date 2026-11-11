/** Imagem enviada pela própria plataforma (bucket público prg-mesa do Supabase). Sem rede: dá para usar no navegador e no servidor. */
export function imagemDaPlataforma(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 500 && /^https?:\/\/[^\s"'<>()]+\/storage\/v1\/object\/public\/prg-mesa\/[A-Za-z0-9/_.-]+\.(png|jpe?g|webp)$/.test(v)
}
