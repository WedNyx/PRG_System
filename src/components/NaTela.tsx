'use client'

import { useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const nada = () => () => {}
/**
 * Janelas por cima de tudo (v0.33.6): desenha direto no <body>. Dentro de um cartão com efeito de vidro
 * (backdrop-filter), um `position: fixed` fica preso ao cartão — a janela aparecia cortada e sem rolar.
 */
export default function NaTela({ children }: { children: ReactNode }) {
  const pronto = useSyncExternalStore(nada, () => true, () => false)
  return pronto ? createPortal(children, document.body) : null
}
