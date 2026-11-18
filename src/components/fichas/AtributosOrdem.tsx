'use client'

import type { AtributoDef } from '@/lib/sistemas/tipos'
import { limiteSomaAtributosOrdem, somaAtributosOrdem } from '@/lib/sistemas/ordemCriacao'

const POSICOES: Record<string, [number, number]> = { AGI: [50, 22.5], FOR: [25.6, 39.7], INT: [74.8, 39.7], PRE: [32.9, 68.7], VIG: [66.7, 68.7] }

/**
 * Cinco hexágonos em uma disposição circular, exclusiva de Ordem Paranormal.
 * Inputs reais e rotulados: navegação por teclado, leitor de tela e edição móvel.
 */
export default function AtributosOrdem({ atributos, valores, nex, somenteLeitura, onChange, semLimite = false }: {
  /** Ficha manual: sem a conta de pontos por NEX. */
  semLimite?: boolean
  atributos: AtributoDef[]
  valores: Record<string, number>
  nex: number
  somenteLeitura: boolean
  onChange: (id: string, valor: number) => void
}) {
  const soma = somaAtributosOrdem(valores)
  const limite = limiteSomaAtributosOrdem(nex)

  return <div className="space-y-3">
    <div role="group" aria-label="Cinco atributos de Ordem Paranormal" className="hexatombe-atributos">
      <svg viewBox="0 0 500 500" className="hexatombe-sigilo" aria-hidden="true">
        <path d="M310,9 320,38 314,58 302,71 294,67 299,61 290,64 283,58 288,55 287,48 278,58 269,52 273,44 266,38 269,45 264,49 258,42 254,44 248,37 249,44 243,48 237,42 239,47 235,53 231,53 228,46 221,44 229,56 226,58 220,61 217,54 213,51 217,64 205,56 201,37 207,10 196,30 191,62 204,71 196,74 175,67 193,83 170,109 195,130 195,136 187,142 134,78 180,146 171,152 128,126 111,137 91,94 92,131 89,133 80,130 64,137 41,165 57,151 79,142 91,149 63,168 47,187 39,207 57,183 73,176 74,187 67,192 74,196 74,206 69,208 75,216 71,218 75,231 64,241 84,239 97,249 87,258 78,254 53,253 37,245 22,226 32,251 50,264 31,273 10,267 26,279 43,282 65,266 80,276 79,279 109,256 127,267 148,257 149,267 67,304 150,272 156,281 125,300 107,299 116,305 99,316 85,333 76,357 89,335 112,319 112,373 77,407 119,382 134,392 120,409 125,420 124,436 143,447 161,452 138,435 133,411 143,397 161,409 170,436 196,465 174,425 176,405 184,399 187,402 189,395 195,401 195,392 207,384 208,402 205,425 219,370 224,356 233,350 245,351 250,450 254,352 272,350 280,354 279,406 298,424 327,439 302,417 290,400 292,383 303,391 301,398 308,393 320,402 316,407 318,413 324,404 334,418 331,425 337,420 337,411 347,403 353,419 343,433 350,443 341,465 332,474 356,454 363,436 356,432 368,419 360,396 365,392 409,411 375,386 386,377 386,369 390,367 386,362 393,360 395,355 387,352 396,342 386,339 386,322 405,331 418,347 405,323 385,306 391,285 416,293 392,283 399,268 386,281 364,271 368,264 375,268 398,254 423,271 440,258 458,267 471,267 489,255 466,260 455,252 482,222 455,240 426,247 420,256 410,248 452,229 429,225 430,175 445,184 461,209 462,216 453,180 425,157 468,112 415,147 409,120 397,140 374,125 335,150 322,142 365,80 316,139 308,134 324,95 307,122 306,85 329,55 328,42 324,29Z M281,333 281,341 260,347 254,346 255,336Z M218,333 244,336 245,346 220,343Z M281,311 280,325 255,329 256,315Z M218,310 244,315 245,330 220,326Z M333,288 376,313 377,370 334,399 290,371 290,313Z M164,288 208,313 208,371 165,399 121,372 121,313Z M357,289 362,276 384,283 372,298Z M159,270 174,265 188,288 165,277Z M341,270 337,278 314,289 326,264Z M330,242 347,252 343,264 328,258Z M170,242 173,257 157,263 154,252Z M193,163 204,178 184,197 183,170Z M310,162 319,169 319,195 299,178Z M303,157 292,173 275,166 296,152Z M198,158 205,152 227,166 211,173Z M374,140 417,165 420,170 420,228 375,257 328,229 328,168Z M127,140 173,167 173,229 128,257 83,228 83,167Z M193,97 195,98 194,118 186,110Z M249,55 296,82 296,140 250,170 205,141 205,82Z" fill="#ff0030" fillRule="evenodd"/>
        <path d="M247,215 253,219 258,218 262,223 262,228 257,233 261,237 260,248 246,257 244,247 244,217Z M289,212 287,226 291,217 300,234 294,256 291,259 285,250 284,234 286,228 283,226 283,251 274,262 273,260 277,251 277,227 272,227 276,231 276,246 269,254 262,247 262,217 268,221 269,242 270,222 280,221Z M203,196 205,198 202,205 202,221 204,210 207,214 216,214 218,217 219,212 230,216 237,224 238,216 243,220 243,248 239,266 235,258 237,250 237,227 231,234 236,239 234,265 231,272 228,259 229,248 226,240 226,249 222,255 220,266 218,261 218,219 213,221 211,261 207,250 207,221 203,225 209,275 200,262 197,234 191,237 187,250 190,274 178,251 183,239 179,241 177,239 186,230 190,217 188,210Z M300,194 306,202 320,209 317,216 317,228 312,215 303,211 302,215 308,228 324,239 320,243 320,259 312,274 303,267 292,270 296,262 296,250 301,236 305,255 307,258 312,259 313,242 300,232 293,211 297,206Z" fill="#080708"/>
      </svg>
      {atributos.map((a, i) => {
        const [x,y] = POSICOES[a.id] ?? Object.values(POSICOES)[i % 5]
        return <div key={a.id} className="hexatombe-no" style={{ left: x+'%', top: y+'%' }}>
          <input id={`ordem-atributo-${a.id}`} type="number" inputMode="numeric"
            aria-label={`${a.nome} (${a.id})`} min={a.min} max={a.max} step={1}
            value={valores[a.id] ?? a.padrao} disabled={somenteLeitura}
            onChange={e => onChange(a.id, Math.max(a.min, Math.min(a.max, Math.trunc(Number(e.target.value) || 0))))}
          />
          <span className="hexatombe-nome">{a.nome}</span>
          <label htmlFor={`ordem-atributo-${a.id}`}>{a.id}</label>
        </div>
      })}
    </div>
    {!semLimite && <p role="status" aria-live="polite" className={`text-center text-xs ${soma > limite ? 'text-amber-300' : 'text-violet-200'}`}>
      Total de atributos: <strong>{soma}</strong> / {limite} (limite básico para este NEX).
      {soma > limite ? ' Revise a distribuição.' : ''}
    </p>}
    {!semLimite && <p className="text-center text-xs text-(--a-a998bd)">
      Os botões de rolagem e as perícias permanecem abaixo; alterar um hexágono atualiza a ficha normalmente.
    </p>}
  </div>
}
