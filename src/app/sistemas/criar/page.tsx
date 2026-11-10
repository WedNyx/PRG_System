'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Construtor from '@/components/sistemas/Construtor'
import { ehAutoral } from '@/lib/sistemas/autoral'

function Conteudo() {
  const id = useSearchParams().get('id')
  return <Construtor key={id ?? 'novo'} idInicial={ehAutoral(id) ? id : null} />
}
export default function CriarSistema() {
  return <Suspense fallback={<main className="fundo-tema min-h-screen" />}><Conteudo /></Suspense>
}
