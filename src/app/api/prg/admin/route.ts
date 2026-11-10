import { NextResponse } from 'next/server'
import packageJson from '../../../../../package.json'
import { ErroApi, lerJson, ok, rest, rota } from '@/lib/nuvem/servidor'
import { exigirAdmin } from '@/lib/nuvem/admin'
import { baixarCopia, gerarCopia, guardarCopia, listarCopias, MANTER, nomeDaCopia, podarCopias, resumo } from '@/lib/nuvem/backup'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Erro = { id: number; origem: string; local: string; mensagem: string; detalhe: string; criado_em: string }

const download = (nome: string, conteudo: string) => new NextResponse(conteudo, {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="${nome}"`, 'Cache-Control': 'no-store' },
})

/** Área do administrador (senha PRG_ADMIN_SENHA): saúde da plataforma, erros e cópias de segurança. */
export const POST = rota(async req => {
  const b = await lerJson(req, 2000) as { senha?: unknown; acao?: unknown; nome?: unknown }
  await exigirAdmin(req, b.senha)
  switch (b.acao) {
    case 'saude': {
      const inicio = Date.now()
      let banco = true
      try { await rest('prg_public_adventurers?select=id&limit=1') } catch { banco = false }
      const ms = Date.now() - inicio
      const dia = new Date(Date.now() - 86_400_000).toISOString()
      const [erros, copias] = await Promise.all([
        rest<Erro[]>('prg_erros?select=*&order=criado_em.desc&limit=50').catch(() => [] as Erro[]),
        listarCopias().catch(() => null),
      ])
      return ok({
        versao: packageJson.version, revisao: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
        banco, ms, erros, erros24h: erros.filter(e => e.criado_em >= dia).length,
        copias, manter: MANTER, agendada: !!process.env.CRON_SECRET,
      })
    }
    case 'backup_agora': {
      const copia = await gerarCopia(packageJson.version)
      const nome = await guardarCopia(copia)
      await podarCopias()
      return ok({ nome, tabelas: resumo(copia) })
    }
    case 'baixar': {
      if (typeof b.nome === 'string' && b.nome) return download(b.nome, await baixarCopia(b.nome))
      const copia = await gerarCopia(packageJson.version)
      return download(nomeDaCopia(), JSON.stringify(copia))
    }
    case 'limpar_erros':
      await rest('prg_erros?id=gt.0', { method: 'DELETE' })
      return ok({ ok: true })
    default:
      throw new ErroApi(400, 'Ação desconhecida.')
  }
})
