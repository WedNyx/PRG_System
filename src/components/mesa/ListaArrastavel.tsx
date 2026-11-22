'use client'

import type { CSSProperties, ReactNode } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

/**
 * Lista que dá para reordenar arrastando (v0.36.6, dnd-kit): no mouse, no toque (segure um instante) e no teclado
 * (foque a alça, Espaço para pegar, setas para mover, Espaço para soltar). Os botões ↑↓ de cada lista continuam valendo.
 */

function Item({ id, desabilitado, children }: { id: string; desabilitado: boolean; children: (alca: ReactNode, arrastando: boolean) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: desabilitado })
  const estilo: CSSProperties = { transform: CSS.Transform.toString(transform), transition, position: 'relative', zIndex: isDragging ? 5 : undefined }
  const alca = desabilitado ? null : <button type="button" {...attributes} {...listeners} aria-label="Arrastar para mudar a ordem" title="Arrastar"
    className="touch-none cursor-grab rounded p-1 text-(--a-a998bd) hover:bg-white/10 active:cursor-grabbing"><GripVertical size={14} /></button>
  return <li ref={setNodeRef} style={estilo} className={isDragging ? 'opacity-90 shadow-[0_8px_24px_#000a]' : undefined}>{children(alca, isDragging)}</li>
}

export default function ListaArrastavel<T>({ itens, chave, mover, desabilitado = false, className, rotulo, children }: {
  itens: T[]; chave: (x: T) => string; mover: (de: number, para: number) => void; desabilitado?: boolean; className?: string; rotulo: string
  children: (x: T, i: number, alca: ReactNode, arrastando: boolean) => ReactNode
}) {
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const ids = itens.map(chave)
  const soltar = (ev: DragEndEvent) => {
    if (!ev.over || ev.active.id === ev.over.id) return
    const de = ids.indexOf(String(ev.active.id)), para = ids.indexOf(String(ev.over.id))
    if (de >= 0 && para >= 0) mover(de, para)
  }
  return <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={soltar}
    accessibility={{ screenReaderInstructions: { draggable: 'Para mover, aperte Espaço, use as setas e aperte Espaço de novo para soltar.' } }}>
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      <ol className={className} aria-label={rotulo}>
        {itens.map((x, i) => <Item key={ids[i]} id={ids[i]} desabilitado={desabilitado}>{(alca, arr) => children(x, i, alca, arr)}</Item>)}
      </ol>
    </SortableContext>
  </DndContext>
}
