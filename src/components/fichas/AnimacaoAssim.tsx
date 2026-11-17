'use client'
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { Simbolo } from './IconesAssimilacao'
import { faceDe, type LadoAssim } from '@/lib/sistemas/assimilacao'

type V = [number,number,number]
type Dado = { lados: LadoAssim; valor: number }
const dot=(a:V,b:V)=>a.reduce((s,x,i)=>s+x*b[i],0)
const cross=(a:V,b:V):V=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
const scale=(a:V,k:number):V=>[a[0]*k,a[1]*k,a[2]*k]
const unit=(a:V)=>scale(a,1/Math.hypot(...a))
const add=(a:V,b:V):V=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]]
// Intersect half-spaces with unit face normals: cube, pentagonal trapezohedron and dodecahedron.
function modelo(lados:LadoAssim) {
  const p=(1+Math.sqrt(5))/2
  const normals:V[]=lados===6?[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]:lados===10?
    Array.from({length:10},(_,i)=>unit([Math.cos(i*Math.PI/5),Math.sin(i*Math.PI/5),i%2?.62:-.62])):
    [ -1,1 ].flatMap(a=>[-1,1].flatMap(b=>[[0,a,b*p],[a,b*p,0],[b*p,0,a]] as V[])).map(unit)
  const vertices:V[]=[]
  for(let i=0;i<normals.length;i++)for(let j=i+1;j<normals.length;j++)for(let k=j+1;k<normals.length;k++){
    const a=normals[i],b=normals[j],c=normals[k],den=dot(a,cross(b,c))
    if(Math.abs(den)<1e-7)continue
    const v=scale(add(add(cross(b,c),cross(c,a)),cross(a,b)),1/den)
    if(normals.every(n=>dot(n,v)<=1.00001)&&!vertices.some(w=>Math.hypot(...add(v,scale(w,-1)))<1e-5))vertices.push(v)
  }
  return normals.map(n=>{
    const u=unit(cross(Math.abs(n[2])>.9?[0,1,0]:[0,0,1],n)), v=cross(n,u)
    const points=vertices.filter(w=>Math.abs(dot(n,w)-1)<1e-5).sort((a,b)=>Math.atan2(dot(a,v),dot(a,u))-Math.atan2(dot(b,v),dot(b,u)))
    return {n,u,v,points}
  })
}
const MODELOS={6:modelo(6),10:modelo(10),12:modelo(12)}
function Poliedro({d,t,i}:{d:Dado;t:number;i:number}) {
  const faces=MODELOS[d.lados], final=faces[Math.max(0,Math.min(d.lados-1,d.valor-1))]
  const a=(1-t)**2*(9+i%3), b=(1-t)**2*(13+i%4)
  const rot=(w:V):V=>{
    const x=dot(w,final.u),y=dot(w,final.v),z=dot(w,final.n)
    const yy=y*Math.cos(a)-z*Math.sin(a),zz=y*Math.sin(a)+z*Math.cos(a)
    return [x*Math.cos(b)+zz*Math.sin(b),yy,-x*Math.sin(b)+zz*Math.cos(b)]
  }
  const project=(w:V)=>{const q=rot(w),s=29/(1-q[2]*.12);return [60+q[0]*s,60-q[1]*s]}
  return <svg viewBox="0 0 120 120" className="h-24 w-24 sm:h-32 sm:w-32" style={{transform:'translateY('+(-Math.abs(Math.sin(t*13))*38*(1-t))+'px)'}} aria-label={'d'+d.lados}>
    {faces.map((f,k)=>({f,k,z:rot(f.n)[2]})).filter(x=>x.z>0).sort((a,b)=>a.z-b.z).map(({f,k,z})=>{
      const face=faceDe(d.lados,k+1), symbols=(['a','b','c'] as const).flatMap(tipo=>Array.from({length:face[tipo]},()=>tipo))
      const center=project(f.n), right=project(add(f.n,scale(f.u,.32))), up=project(add(f.n,scale(f.v,-.32)))
      return <g key={k}>
        <polygon points={f.points.map(w=>project(w).join(',')).join(' ')} fill={'rgb('+Math.round(12+z*22)+','+Math.round(32+z*45)+','+Math.round(60+z*65)+')'} stroke="#07182d" strokeWidth="1.5" strokeLinejoin="round"/>
        <g transform={'matrix('+[(right[0]-center[0])/12,(right[1]-center[1])/12,(up[0]-center[0])/12,(up[1]-center[1])/12,center[0],center[1]].join(' ')+')'}>
          {symbols.map((tipo,j)=><g key={j} transform={'translate('+((j%2)*18-(symbols.length===1?9:18))+','+(Math.floor(j/2)*18-(symbols.length>2?18:9))+')'}><Simbolo tipo={tipo} tamanho={18}/></g>)}
        </g>
      </g>
    })}
  </svg>
}
export default function AnimacaoAssim({dados,fechar}:{dados:Dado[];fechar:()=>void}) {
  const [t,setT]=useState(0)
  useEffect(()=>{
    const start=performance.now();let id=0
    const reduz=window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const frame=(now:number)=>{const p=reduz?1:Math.min(1,(now-start)/1450);setT(p);if(p<1)id=requestAnimationFrame(frame)}
    id=requestAnimationFrame(frame)
    const timer=window.setTimeout(fechar,2400)
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape')fechar()}
    window.addEventListener('keydown',key)
    return()=>{cancelAnimationFrame(id);clearTimeout(timer);window.removeEventListener('keydown',key)}
  },[fechar])
  if(typeof document==='undefined')return null
  return createPortal(<div role="dialog" aria-label="Rolagem de Assimilação" className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65" onClick={fechar}>
    <div className="flex max-h-[75vh] max-w-[94vw] flex-wrap justify-center overflow-auto">{dados.slice(0,20).map((d,i)=><Poliedro key={i} d={d} t={t} i={i}/>)}</div>
    <button type="button" className="absolute bottom-12 rounded-lg bg-slate-800 px-4 py-2 text-white" onClick={fechar}>Fechar rolagem</button>
  </div>,document.body)
}
