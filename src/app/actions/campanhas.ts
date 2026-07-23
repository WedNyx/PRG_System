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

export async function atualizarTurno(campanhaId: string, turno: number) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('campanhas')
    .update({ iniciativa_turno: turno })
    .eq('id', campanhaId)
  if (error) return { error: error.message }
  return {}
}

// ── Cenas ──────────────────────────────────────────────────────

export async function salvarCena(
  campanhaId: string,
  cena: { nome: string; mapa_url: string | null; grid_cols: number; grid_rows: number }
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cenas')
    .insert({ campanha_id: campanhaId, ...cena })
    .select('*')
    .single()
  if (error) return { error: error.message }
  return { cena: data }
}

export async function ativarCena(campanhaId: string, cenaId: string) {
  const supabase = await createClient()
  const { data: cena, error } = await supabase.from('cenas').select('*').eq('id', cenaId).single()
  if (error || !cena) return { error: error?.message ?? 'Cena não encontrada' }

  const { error: upError } = await supabase
    .from('campanhas')
    .update({
      mapa_url: cena.mapa_url,
      grid_cols: cena.grid_cols,
      grid_rows: cena.grid_rows,
      fog_revelado: [],
    })
    .eq('id', campanhaId)
  if (upError) return { error: upError.message }
  return {}
}

export async function deletarCena(cenaId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('cenas').delete().eq('id', cenaId)
  if (error) return { error: error.message }
  return {}
}

// ── Handouts ───────────────────────────────────────────────────

export async function criarHandout(formData: FormData) {
  const supabase = await createClient()
  const campanhaId = formData.get('campanha_id') as string
  const titulo = (formData.get('titulo') as string)?.trim()
  const conteudo = (formData.get('conteudo') as string)?.trim() ?? ''
  const imagemUrl = (formData.get('imagem_url') as string)?.trim() || null
  const destinatarios = formData.getAll('destinatarios') as string[]
  const paraTodos = destinatarios.length === 0

  if (!titulo) return { error: 'O handout precisa de um título.' }

  const { error } = await supabase.from('handouts').insert({
    campanha_id: campanhaId,
    titulo,
    conteudo,
    imagem_url: imagemUrl,
    para_todos: paraTodos,
    destinatarios,
  })
  if (error) return { error: error.message }
  revalidatePath(`/campanha/${campanhaId}`)
  return {}
}

export async function alternarHandout(handoutId: string, campanhaId: string, visivel: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('handouts').update({ visivel }).eq('id', handoutId)
  if (error) return { error: error.message }
  revalidatePath(`/campanha/${campanhaId}`)
  return {}
}

export async function deletarHandout(handoutId: string, campanhaId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('handouts').delete().eq('id', handoutId)
  if (error) return { error: error.message }
  revalidatePath(`/campanha/${campanhaId}`)
  return {}
}

// ── Journal compartilhado ──────────────────────────────────────

export async function salvarJournal(campanhaId: string, conteudo: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('journal')
    .upsert({ campanha_id: campanhaId, conteudo, updated_at: new Date().toISOString() })
  if (error) return { error: error.message }
  return {}
}
