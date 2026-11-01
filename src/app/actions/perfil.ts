'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function atualizarApelido(apelido: string) {
  const username = apelido.trim()
  if (username.length < 3 || username.length > 30) {
    return { error: 'O apelido deve ter entre 3 e 30 caracteres.' }
  }
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Entre na sua conta para editar o perfil.' }
  const { error } = await supabase.from('profiles').update({ username }).eq('id', user.id)
  if (error) return { error: 'Não foi possível salvar o apelido.' }
  revalidatePath('/dashboard', 'layout')
  return { success: true }
}

export async function atualizarAvatar(caminho: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Entre na sua conta para editar o perfil.' }
  // Aceita apenas objetos no diretório do próprio usuário.
  const prefixo = user.id + '/'
  const nomeArquivo = caminho.startsWith(prefixo) ? caminho.slice(prefixo.length) : ''
  if (!/^avatar-[a-z0-9-]+\.(png|jpg|webp)$/.test(nomeArquivo)) {
    return { error: 'Imagem inválida.' }
  }
  const { error } = await supabase.from('profiles').update({ avatar_url: caminho }).eq('id', user.id)
  if (error) return { error: 'Não foi possível salvar a imagem.' }
  revalidatePath('/dashboard', 'layout')
  return { success: true }
}
