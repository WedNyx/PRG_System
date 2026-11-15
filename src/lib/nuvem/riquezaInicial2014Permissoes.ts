/**
 * Uma rolagem de ouro inicial cria dois efeitos inseparáveis:
 * a escolha do método de equipamento e a entrada de moedas na carteira.
 * Se o mestre exige aprovação para equipamentos, impedir que "uso"
 * (normalmente livre para PV/consumo) libere ouro antes da aprovação.
 */
import type { Mudanca } from './categorias'
import type { DadosFicha } from '../sistemas/tipos'
import { lerUso } from '../sistemas/inventario'

export function agruparRiquezaInicial2014(
  sistema:string, antes:Partial<DadosFicha>, depois:Partial<DadosFicha>,
  mudancas:readonly Mudanca[],
):Mudanca[] {
  if(sistema!=='dnd5e-srd'||depois.dnd2014EquipamentoInicial?.modo!=='ouro' ||
     !mudancas.some(m=>m.caminho==='dnd2014EquipamentoInicial'))return [...mudancas]
  const carteiraAntes=lerUso(antes.uso).carteira
  const carteiraDepois=lerUso(depois.uso).carteira
  if(carteiraAntes===carteiraDepois)return [...mudancas]
  return mudancas.map(m=>m.caminho==='uso'?{...m,categoria:'equipamentos' as const}:m)
}
