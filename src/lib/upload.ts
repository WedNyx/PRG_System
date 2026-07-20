import { createClient } from '@/lib/supabase/client'

/**
 * Faz upload de uma imagem para o bucket público e retorna a URL.
 * Usado para mapas e tokens (client-side).
 */
export async function uploadImagem(
  file: File,
  pasta: string
): Promise<{ url?: string; error?: string }> {
  if (!file.type.startsWith('image/')) {
    return { error: 'O arquivo precisa ser uma imagem.' }
  }
  if (file.size > 8 * 1024 * 1024) {
    return { error: 'Imagem muito grande (máximo 8MB).' }
  }

  const supabase = createClient()
  const ext = file.name.split('.').pop() ?? 'png'
  const caminho = `${pasta}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from('imagens').upload(caminho, file)
  if (error) return { error: error.message }

  const { data } = supabase.storage.from('imagens').getPublicUrl(caminho)
  return { url: data.publicUrl }
}
