'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function criarConquista(formData: FormData) {
  const supabase = await createClient()
  const campanhaId = formData.get('campanha_id') as string
  const titulo = (formData.get('titulo') as string)?.trim()
  const descricao = (formData.get('descricao') as string)?.trim() ?? ''
  const emoji = (formData.get('emoji') as string)?.trim() || '🏆'

  if (!titulo) return { error: 'O marco precisa de um título.' }

  const { error } = await supabase.from('conquistas').insert({
    campanha_id: campanhaId,
    titulo,
    descricao,
    emoji,
  })
  if (error) return { error: error.message }
  revalidatePath(`/campanha/${campanhaId}`)
  return {}
}

export async function deletarConquista(conquistaId: string, campanhaId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('conquistas').delete().eq('id', conquistaId)
  if (error) return { error: error.message }
  revalidatePath(`/campanha/${campanhaId}`)
  return {}
}
