'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { IniciativaEntry } from '@/types/database'

export async function criarCampanha(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const nome = (formData.get('nome') as string)?.trim()
  const sistema = formData.get('sistema') as string
  const descricao = (formData.get('descricao') as string)?.trim() || null

  if (!nome) return { error: 'A campanha precisa de um nome.' }

  const { data, error } = await supabase
    .from('campanhas')
    .insert({ nome, sistema, descricao, mestre_id: user.id })
    .select('id')
    .single()

  if (error) return { error: error.message }

  redirect(`/campanha/${data.id}`)
}

export async function entrarComCodigo(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const codigo = (formData.get('codigo') as string)?.trim()
  if (!codigo) return { error: 'Digite o código de convite.' }

  const { data, error } = await supabase.rpc('entrar_com_codigo', { codigo })

  if (error) {
    return { error: error.message.includes('inválido') ? 'Código de convite inválido.' : error.message }
  }

  redirect(`/campanha/${data}`)
}

export async function atualizarMapa(
  campanhaId: string,
  config: { mapa_url?: string | null; grid_cols?: number; grid_rows?: number }
) {
  const supabase = await createClient()
  const { error } = await supabase.from('campanhas').update(config).eq('id', campanhaId)
  if (error) return { error: error.message }
  revalidatePath(`/mesa/${campanhaId}`)
  return {}
}

export async function atualizarFog(
  campanhaId: string,
  fog: { fog_ativo?: boolean; fog_revelado?: string[] }
) {
  const supabase = await createClient()
  const { error } = await supabase.from('campanhas').update(fog).eq('id', campanhaId)
  if (error) return { error: error.message }
  return {}
}

export async function atualizarIniciativa(campanhaId: string, iniciativa: IniciativaEntry[]) {
  const supabase = await createClient()
  const { error } = await supabase.from('campanhas').update({ iniciativa }).eq('id', campanhaId)
  if (error) return { error: error.message }
  return {}
}

export async function salvarNotas(campanhaId: string, conteudo: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('notas')
    .upsert({ campanha_id: campanhaId, conteudo, updated_at: new Date().toISOString() })
  if (error) return { error: error.message }
  return {}
}
