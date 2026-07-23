'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import confetti from 'canvas-confetti'
import { detectarCritico } from '@/lib/dice'
import { somCritico, somFalha, somRolagem } from '@/lib/sons'

export type Dados3DHandle = {
  /** Anima a rolagem em 3D com os resultados já sorteados pelo servidor */
  animar: (expressao: string, resultados: number[]) => void
}

type DiceBoxInstance = {
  init: () => Promise<unknown>
  roll: (notation: string | string[]) => void
  clear: () => void
}

/**
 * Constrói a notação do dice-box com resultados pré-determinados:
 * "2d6+3" com [4,6] vira ["2d6@4,6"].
 * O servidor já sorteou — o 3D é só a coreografia. 🎲
 */
export function montarNotacao(expressao: string, resultados: number[]): string[] | null {
  const termos = expressao.toLowerCase().replace(/\s+/g, '').match(/[+-]?[^+-]+/g)
  if (!termos) return null

  const grupos: string[] = []
  let cursor = 0
  for (const termo of termos) {
    const corpo = termo.replace(/^[+-]/, '')
    const dado = corpo.match(/^(\d*)d(\d+)/)
    if (!dado) continue
    const qtd = parseInt(dado[1] || '1', 10)
    const faces = parseInt(dado[2], 10)
    // dados explosivos geram resultados extras — nesse caso animamos sem pré-determinação
    if (corpo.includes('!')) return null
    if (![4, 6, 8, 10, 12, 20, 100].includes(faces)) return null
    const valores = resultados.slice(cursor, cursor + qtd)
    if (valores.length !== qtd) return null
    cursor += qtd
    grupos.push(`${qtd}d${faces}@${valores.join(',')}`)
  }
  return grupos.length > 0 ? grupos : null
}

const Dados3D = forwardRef<Dados3DHandle, { somAtivo: boolean }>(function Dados3D({ somAtivo }, ref) {
  const boxRef = useRef<DiceBoxInstance | null>(null)
  const prontoRef = useRef(false)
  const limparTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const somAtivoRef = useRef(somAtivo)
  somAtivoRef.current = somAtivo

  useEffect(() => {
    let cancelado = false
    async function iniciar() {
      try {
        const { default: DiceBox } = await import('@3d-dice/dice-box')
        const box = new DiceBox({
          container: '#dados-3d-container',
          assetPath: '/assets/dice-box/',
          theme: 'default',
          themeColor: '#f59e0b',
          scale: 6,
          gravity: 1.4,
          throwForce: 6,
          lightIntensity: 1,
        }) as DiceBoxInstance
        await box.init()
        if (!cancelado) {
          boxRef.current = box
          prontoRef.current = true
        }
      } catch (e) {
        console.warn('Dados 3D indisponíveis:', e)
      }
    }
    iniciar()
    return () => {
      cancelado = true
    }
  }, [])

  useImperativeHandle(ref, () => ({
    animar(expressao: string, resultados: number[]) {
      const critico = detectarCritico(expressao, resultados)

      if (somAtivoRef.current) somRolagem()

      if (prontoRef.current && boxRef.current) {
        const notacao = montarNotacao(expressao, resultados)
        try {
          boxRef.current.clear()
          boxRef.current.roll(notacao ?? expressao.replace(/[!]|k[hl]\d+/g, ''))
        } catch (e) {
          console.warn('Erro ao animar dados:', e)
        }
        if (limparTimer.current) clearTimeout(limparTimer.current)
        limparTimer.current = setTimeout(() => boxRef.current?.clear(), 6000)
      }

      // Efeitos do crítico chegam quando os dados "param" (~1.6s)
      if (critico) {
        setTimeout(() => {
          if (critico === 'critico') {
            if (somAtivoRef.current) somCritico()
            confetti({
              particleCount: 120,
              spread: 75,
              origin: { y: 0.7 },
              colors: ['#f59e0b', '#fbbf24', '#fde68a', '#ffffff'],
            })
          } else if (somAtivoRef.current) {
            somFalha()
          }
        }, 1600)
      }
    },
  }))

  return (
    <div
      id="dados-3d-container"
      className="pointer-events-none fixed inset-0 z-[60]"
      aria-hidden
    />
  )
})

export default Dados3D
