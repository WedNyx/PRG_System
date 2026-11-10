'use client'

import { useEffect } from 'react'
import { relatarErro } from '@/lib/relatarErro'

/** Escuta erros que escaparam (tela e promessas) e manda para “Saúde da plataforma”. */
export default function RelatorErros() {
  useEffect(() => {
    const erro = (e: ErrorEvent) => {
      if (e.filename && !e.filename.startsWith(location.origin)) return
      relatarErro(e.message, e.error instanceof Error ? (e.error.stack ?? '') : `${e.filename}:${e.lineno}:${e.colno}`)
    }
    const promessa = (e: PromiseRejectionEvent) => {
      const r = e.reason
      relatarErro(r instanceof Error ? r.message : String(r), r instanceof Error ? (r.stack ?? '') : '')
    }
    window.addEventListener('error', erro)
    window.addEventListener('unhandledrejection', promessa)
    return () => { window.removeEventListener('error', erro); window.removeEventListener('unhandledrejection', promessa) }
  }, [])
  return null
}
