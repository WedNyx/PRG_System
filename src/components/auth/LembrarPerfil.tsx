'use client'

import { useEffect } from 'react'

const STORAGE_KEY = 'prg-perfil-lembrado-v1'

export default function LembrarPerfil({ apelido }: { apelido: string }) {
  useEffect(() => {
    if (!apelido || apelido.length > 40) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ apelido }))
    } catch {
      // Navegação continua mesmo se o armazenamento estiver indisponível.
    }
  }, [apelido])
  return null
}
