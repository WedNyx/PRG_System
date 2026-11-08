import { ErroNuvem } from '@/lib/nuvem/cliente'

export const btn = 'inline-flex items-center gap-1 rounded-lg border border-[#5e4b78] px-2.5 py-1.5 text-xs hover:bg-[#34294f] disabled:opacity-50'
export const input = 'w-full rounded-lg border border-[#5e4b78] bg-[#100f20] p-2 text-sm text-white'
export const msg = (e: unknown) => e instanceof ErroNuvem ? e.message : e instanceof Error ? e.message : 'Falha de conexão.'
