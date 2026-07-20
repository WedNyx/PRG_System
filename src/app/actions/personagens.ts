'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function criarPersonagem(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const campanhaId = formData.get('campanha_id') as string
  const nome = (formData.get('nome') as string)?.trim()
  const isNpc = formData.get('is_npc') === 'true'

  if (!nome) return { error: 'O personagem precisa de um nome.' }

  const { data, error } = await supabase
    .from('personagens')
    .insert({
      campanha_id: campanhaId,
      player_id: user.id,
      nome,
      is_npc: isNpc,
      visivel: !isNpc, // NPCs nascem escondidos dos players
      cor: isNpc ? '#ef4444' : '#f59e0b',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  if (isNpc) {
    revalidatePath(`/campanha/${campanhaId}`)
    return {}
  }

  redirect(`/campanha/${campanhaId}/ficha/${data.id}`)
}

export async function atualizarFicha(
  personagemId: string,
  campanhaId: string,
  ficha: {
    nome?: string
    dados?: Record<string, string | number>
    hp_atual?: number
    hp_max?: number
    cor?: string
    token_url?: string | null
    macros?: { nome: string; expressao: string }[]
  }
) {
  const supabase = await createClient()
  const { error } = await supabase.from('personagens').update(ficha).eq('id', personagemId)
  if (error) return { error: error.message }
  revalidatePath(`/campanha/${campanhaId}/ficha/${personagemId}`)
  return {}
}

export async function alternarVisibilidadeNpc(personagemId: string, campanhaId: string, visivel: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('personagens').update({ visivel }).eq('id', personagemId)
  if (error) return { error: error.message }
  revalidatePath(`/campanha/${campanhaId}`)
  return {}
}

export async function deletarPersonagem(personagemId: string, campanhaId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('personagens').delete().eq('id', personagemId)
  if (error) return { error: error.message }
  revalidatePath(`/campanha/${campanhaId}`)
  return {}
}

export async function moverToken(personagemId: string, posX: number, posY: number) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('personagens')
    .update({ pos_x: posX, pos_y: posY })
    .eq('id', personagemId)
  if (error) return { error: error.message }
  return {}
}

export async function atualizarHp(personagemId: string, hpAtual: number) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('personagens')
    .update({ hp_atual: hpAtual })
    .eq('id', personagemId)
  if (error) return { error: error.message }
  return {}
}

export async function atualizarCondicoes(personagemId: string, condicoes: string[]) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('personagens')
    .update({ condicoes })
    .eq('id', personagemId)
  if (error) return { error: error.message }
  return {}
}

export async function criarNpcDoBestiario(
  campanhaId: string,
  monstro: { nome: string; hp: number; ca: number; cor: string; ataques: string; descricao: string }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('personagens').insert({
    campanha_id: campanhaId,
    player_id: user.id,
    nome: monstro.nome,
    is_npc: true,
    visivel: false,
    cor: monstro.cor,
    hp_atual: monstro.hp,
    hp_max: monstro.hp,
    dados: {
      ca: monstro.ca,
      ataques: monstro.ataques,
      historia: monstro.descricao,
    },
  })
  if (error) return { error: error.message }
  revalidatePath(`/campanha/${campanhaId}`)
  return {}
}
