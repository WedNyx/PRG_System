import { useId, type ReactNode } from 'react'

const C = 68
const pol = (r: number, g: number) => { const a = (g - 90) * Math.PI / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)] }
const f = (n: number) => Math.round(n * 10) / 10
const volta = (n: number, ini = 0) => Array.from({ length: n }, (_, i) => ini + i * 360 / n)
const estrela = (x: number, y: number, r: number, extra = '') => { const p = Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4 - Math.PI / 2, k = i % 2 ? r * .36 : r; return f(x + k * Math.cos(a)) + ',' + f(y + k * Math.sin(a)) }); return `<polygon ${extra} points="${p.join(' ')}"/>` }

const MOLDURAS = [
  { id: 'lua', nome: 'Lua Minguante', desc: 'Anel de prata, lua e estrelas', arte: () => `
    <circle cx="68" cy="68" r="56" fill="url(#g-prata)" opacity=".95" mask="url(#m-anel)"/>
    <circle cx="68" cy="68" r="51.5" fill="none" stroke="#efeaff" stroke-width="2.2"/>
    <circle cx="68" cy="68" r="58.5" fill="none" stroke="#8b7bd1" stroke-width="1.2"/>
    <circle cx="68" cy="68" r="62" fill="none" stroke="#c4b5fd" stroke-width=".8" stroke-dasharray="1 5" class="girar"/>
    <g class="flutuar" filter="url(#f-brilho)"><path d="M101 5 a21 21 0 1 0 25 29 a16.5 16.5 0 1 1 -25 -29z" fill="url(#g-lua)" stroke="#8b7bd1" stroke-width="1"/>
      <circle cx="108" cy="27" r="2.2" fill="#c9bdf0" opacity=".7"/><circle cx="114" cy="34" r="1.4" fill="#c9bdf0" opacity=".7"/></g>
    <g fill="#fffbea" filter="url(#f-brilho)">${estrela(24, 20, 5.5, 'class="piscar"')}${estrela(10, 66, 3.5, 'class="piscar" style="animation-delay:.8s"')}${estrela(118, 104, 4.5, 'class="piscar" style="animation-delay:1.6s"')}${estrela(36, 122, 3, 'class="piscar" style="animation-delay:2.1s"')}</g>` },
  { id: 'estrelas', nome: 'Constelação', desc: 'Estrelas ligadas, órbita girando', arte: () => { const ps = volta(9, 12).map((g, i) => pol(i % 2 ? 58 : 63, g))
    return `<circle cx="68" cy="68" r="52" fill="none" stroke="#c7d2fe" stroke-width="2"/>
    <g class="girar"><circle cx="68" cy="68" r="60.5" fill="none" stroke="#818cf8" stroke-width=".8" stroke-dasharray="3 3" opacity=".6"/></g>
    <polyline points="${[...ps, ps[0]].map(p => p.map(f).join(',')).join(' ')}" fill="none" stroke="#a5b4fc" stroke-width=".9" opacity=".75"/>
    <g fill="#eef2ff" filter="url(#f-brilho)">${ps.map(([x, y], i) => estrela(x, y, i % 3 ? 3.6 : 6, `class="piscar" style="animation-delay:${(i * .37).toFixed(2)}s"`)).join('')}</g>` } },
  { id: 'chamas', nome: 'Chamas', desc: 'Labaredas em camadas, brasas subindo', arte: () => `
    ${volta(14).map((g, i) => { const h = i % 2 ? 15 : 20; return `<g transform="rotate(${g} 68 68)"><path class="chama" style="animation-delay:${(i * .11).toFixed(2)}s" d="M60 19 C60 ${19 - h * .5} 66 ${19 - h * .7} 68 ${19 - h} C70 ${19 - h * .7} 76 ${19 - h * .5} 76 19 Z" fill="url(#g-fogo)"/></g>` }).join('')}
    ${volta(14, 13).map((g, i) => `<g transform="rotate(${g} 68 68)"><path class="chama" style="animation-delay:${(i * .13 + .3).toFixed(2)}s" d="M63 18 C63 12 67 9 68 4 C69 9 73 12 73 18 Z" fill="url(#g-fogo2)" opacity=".9"/></g>`).join('')}
    <circle cx="68" cy="68" r="51.5" fill="none" stroke="#fb923c" stroke-width="3.2" filter="url(#f-brilho)"/>
    <circle cx="68" cy="68" r="54.5" fill="none" stroke="#7f1d1d" stroke-width="1.4"/>
    ${[[30, 20], [104, 14], [118, 64], [20, 92], [92, 118]].map(([x, y], i) => `<circle class="brasa" style="animation-delay:${i * .5}s" cx="${x}" cy="${y}" r="1.6" fill="#fde047"/>`).join('')}` },
  { id: 'gelo', nome: 'Gelo', desc: 'Cristais com reflexo passando', arte: () => `
    <circle cx="68" cy="68" r="52.5" fill="none" stroke="#e0f2fe" stroke-width="3"/>
    ${volta(12).map((g, i) => { const [x, y] = pol(51, g), [tx, ty] = pol(i % 2 ? 61 : 68, g), [ax, ay] = pol(55.5, g - 5.5), [bx, by] = pol(55.5, g + 5.5)
      return `<path d="M${f(ax)} ${f(ay)} L${f(tx)} ${f(ty)} L${f(bx)} ${f(by)} L${f(x)} ${f(y)}Z" fill="url(#g-gelo)" stroke="#e0f2fe" stroke-width=".7" opacity=".95"/><path d="M${f(x)} ${f(y)} L${f(tx)} ${f(ty)}" stroke="#fff" stroke-width=".6" opacity=".7"/>` }).join('')}
    <g class="brilho"><path d="M68 8 A60 60 0 0 1 110 26" fill="none" stroke="url(#g-reflexo)" stroke-width="5" stroke-linecap="round" opacity=".85"/></g>
    <g fill="#fff" filter="url(#f-brilho)">${estrela(22, 30, 3.5, 'class="piscar"')}${estrela(116, 92, 3, 'class="piscar" style="animation-delay:1.3s"')}</g>` },
  { id: 'folhas', nome: 'Floresta', desc: 'Cipó com folhas balançando', arte: () => `
    <circle cx="68" cy="68" r="53" fill="none" stroke="#3f6212" stroke-width="3.5"/>
    <circle cx="68" cy="68" r="53" fill="none" stroke="#84cc16" stroke-width="1.2" stroke-dasharray="9 5"/>
    ${volta(13).map((g, i) => { const [x, y] = pol(58, g), rot = g + (i % 2 ? 50 : -50)
      return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})"><g class="balancar" style="animation-delay:${(i * .23).toFixed(2)}s"><path d="M0 -10 C6 -5 6 5 0 10 C-6 5 -6 -5 0 -10Z" fill="url(#g-folha)" stroke="#14532d" stroke-width=".8"/><path d="M0 -8 L0 8" stroke="#14532d" stroke-width=".6" opacity=".7"/></g></g>` }).join('')}
    ${[[20, 104], [114, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#f9a8d4" stroke="#9d174d" stroke-width=".8"/><circle cx="${x}" cy="${y}" r="1.1" fill="#fde047"/>`).join('')}` },
  { id: 'pirata', nome: 'Pirata', desc: 'Corda trançada, leme e âncora', arte: () => `
    <circle cx="68" cy="68" r="55.5" fill="none" stroke="#5c3a17" stroke-width="8"/>
    <circle cx="68" cy="68" r="55.5" fill="none" stroke="url(#g-corda)" stroke-width="6" stroke-dasharray="5 2.5"/>
    <circle cx="68" cy="68" r="55.5" fill="none" stroke="#3b2410" stroke-width=".8" stroke-dasharray="1 6.5" stroke-dashoffset="2"/>
    <g transform="translate(68 124)" filter="url(#f-sombra)"><g class="balancar" style="transform-origin:50% 0%">
      <circle cx="0" cy="-9" r="3.2" fill="none" stroke="#d4a017" stroke-width="2"/><rect x="-1.7" y="-6" width="3.4" height="15" fill="#d4a017"/><rect x="-7.5" y="-3" width="15" height="2.8" fill="#d4a017"/>
      <path d="M-11 4 Q0 17 11 4 L8 4 Q0 11 -8 4Z" fill="#d4a017"/></g></g>
    <g transform="translate(68 12)" filter="url(#f-sombra)"><g class="rodar">
      <circle r="8" fill="none" stroke="#8b5a2b" stroke-width="2.5"/><circle r="2.6" fill="#8b5a2b"/>
      ${volta(8).map(g => `<line x1="0" y1="0" x2="0" y2="-12" stroke="#8b5a2b" stroke-width="1.8" stroke-linecap="round" transform="rotate(${g})"/>`).join('')}</g></g>` },
  { id: 'neon', nome: 'Neon', desc: 'Anéis ciano e rosa girando', arte: () => `
    <g filter="url(#f-neon)" class="neon">
      <g class="girar"><circle cx="68" cy="68" r="54" fill="none" stroke="#22d3ee" stroke-width="2.6" stroke-dasharray="40 8 4 8"/></g>
      <g class="girar-rapido"><circle cx="68" cy="68" r="60.5" fill="none" stroke="#f472b6" stroke-width="1.8" stroke-dasharray="14 10"/></g>
    </g>
    ${volta(4, 45).map(g => { const [x, y] = pol(60.5, g); return `<g class="pulsar"><rect x="${f(x) - 3}" y="${f(y) - 3}" width="6" height="6" fill="#fdf2f8" transform="rotate(45 ${f(x)} ${f(y)})" filter="url(#f-neon)"/></g>` }).join('')}` },
  { id: 'runas', nome: 'Ritual', desc: 'Círculo de runas inventadas girando', arte: () => { const G = ['M-3 -5 L3 5 M3 -5 L-3 5', 'M0 -5 L0 5 M-3 -2 L3 -2', 'M-3 5 L0 -5 L3 5', 'M-3 -5 L3 -5 L-3 5 L3 5', 'M0 -5 L0 5 M0 0 L3 -4', 'M-3 0 A3 3 0 1 0 3 0 M0 -5 L0 5']
    return `<circle cx="68" cy="68" r="52" fill="none" stroke="#450a0a" stroke-width="4.5"/>
    <circle cx="68" cy="68" r="52" fill="none" stroke="url(#g-sangue)" stroke-width="1.4" class="pulsar" filter="url(#f-brilho)"/>
    <g class="girar"><circle cx="68" cy="68" r="58.5" fill="none" stroke="#7f1d1d" stroke-width=".9"/><circle cx="68" cy="68" r="65" fill="none" stroke="#7f1d1d" stroke-width=".9"/>
      ${volta(12).map((g, i) => { const [x, y] = pol(61.8, g); return `<path d="${G[i % G.length]}" transform="translate(${f(x)} ${f(y)}) rotate(${g}) scale(.62)" stroke="#f87171" stroke-width="1.6" fill="none" stroke-linecap="round" filter="url(#f-brilho)"/>` }).join('')}</g>
    <path d="${[0, 1, 2, 3, 4].map(i => pol(52, i * 144)).map((p, i) => (i ? 'L' : 'M') + f(p[0]) + ' ' + f(p[1])).join(' ')}Z" fill="none" stroke="#dc2626" stroke-width=".7" opacity=".45"/>` } },
  { id: 'ouro', nome: 'Ouro Real', desc: 'Filigrana dourada com gemas', arte: () => `
    <circle cx="68" cy="68" r="52.5" fill="none" stroke="url(#g-ouro)" stroke-width="3.6"/>
    <circle cx="68" cy="68" r="61.5" fill="none" stroke="url(#g-ouro)" stroke-width="2.4"/>
    ${volta(36).map((g, i) => { const [x1, y1] = pol(55.5, g), [x2, y2] = pol(i % 3 ? 58 : 59.5, g); return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="#d4a017" stroke-width="1.1"/>` }).join('')}
    ${volta(4).map((g, i) => { const [x, y] = pol(57, g), c = ['#e11d48', '#2563eb', '#16a34a', '#9333ea'][i]; return `<g filter="url(#f-sombra)"><path d="M${f(x)} ${f(y) - 7} L${f(x) + 6} ${f(y)} L${f(x)} ${f(y) + 7} L${f(x) - 6} ${f(y)}Z" fill="url(#g-ouro)"/><circle cx="${f(x)}" cy="${f(y)}" r="3.6" fill="${c}"/><circle cx="${f(x) - 1.1}" cy="${f(y) - 1.2}" r="1" fill="#fff" class="piscar" style="animation-delay:${i * .6}s"/></g>` }).join('')}
    <g class="brilho"><path d="M68 6.5 A61.5 61.5 0 0 1 98 14.5" fill="none" stroke="url(#g-reflexo)" stroke-width="3" stroke-linecap="round"/></g>` },
  { id: 'mestre', nome: 'Coroa do Mestre', desc: 'Quem já mestrou na mesa por 15 minutos ou mais', especial: true, arte: () => `
    <circle cx="68" cy="68" r="52.5" fill="none" stroke="url(#g-ouro)" stroke-width="4"/>
    <circle cx="68" cy="68" r="57.5" fill="none" stroke="#fcd34d" stroke-width=".9" stroke-dasharray="1 4" class="girar"/>
    ${[-1, 1].map(lado => volta(7, 0).map((_, i) => { const g = 180 + lado * (28 + i * 15), [x, y] = pol(58, g); return `<g transform="translate(${f(x)} ${f(y)}) rotate(${g + lado * 60})"><g class="balancar" style="animation-delay:${(i * .2).toFixed(1)}s"><path d="M0 -6 C3.5 -3 3.5 3 0 6 C-3.5 3 -3.5 -3 0 -6Z" fill="url(#g-folha)" stroke="#365314" stroke-width=".6"/></g></g>` }).join('')).join('')}
    <path d="M${f(pol(58, 150)[0])} ${f(pol(58, 150)[1])} A58 58 0 0 0 ${f(pol(58, 210)[0])} ${f(pol(58, 210)[1])}" fill="none" stroke="#4d7c0f" stroke-width="1.4"/>
    <g filter="url(#f-sombra)" class="flutuar">
      <path d="M40 25 L43 0 L55 13 L68 -6 L81 13 L93 0 L96 25 Z" fill="url(#g-ouro)" stroke="#78350f" stroke-width="1.3" stroke-linejoin="round"/>
      <rect x="39" y="21" width="58" height="8" rx="3" fill="url(#g-ouro)" stroke="#78350f" stroke-width="1"/>
      ${[48, 58, 68, 78, 88].map((x, i) => `<circle cx="${x}" cy="25" r="${i === 2 ? 2.6 : 1.8}" fill="${['#2563eb', '#16a34a', '#e11d48', '#16a34a', '#2563eb'][i]}"/>`).join('')}
      <circle cx="68" cy="9" r="3.6" fill="#e11d48" stroke="#fde68a" stroke-width="1"/><circle cx="43" cy="0" r="2.4" fill="#fde68a"/><circle cx="93" cy="0" r="2.4" fill="#fde68a"/><circle cx="68" cy="-6" r="2.6" fill="#fde68a"/>
      <g fill="#fff" filter="url(#f-brilho)">${estrela(68, -6, 3.6, 'class="piscar"')}${estrela(43, 0, 2.6, 'class="piscar" style="animation-delay:.9s"')}${estrela(93, 0, 2.6, 'class="piscar" style="animation-delay:1.7s"')}</g>
    </g>
    <g class="brilho"><path d="M68 15.5 A52.5 52.5 0 0 1 112 41" fill="none" stroke="url(#g-reflexo)" stroke-width="3" stroke-linecap="round"/></g>` },
  { id: 'criador', nome: 'Criador de Mundos', desc: 'Quem criou um sistema de RPG no site', especial: true, arte: () => `
    <circle cx="68" cy="68" r="53" fill="none" stroke="#134e4a" stroke-width="6"/>
    <circle cx="68" cy="68" r="53" fill="none" stroke="#5eead4" stroke-width="1" stroke-dasharray="2 2.5" class="girar"/>
    <circle cx="68" cy="68" r="58.5" fill="none" stroke="url(#g-ouro)" stroke-width="1.8"/>
    ${volta(24).map((g, i) => { const [x1, y1] = pol(58.5, g), [x2, y2] = pol(i % 6 ? 61 : 64, g); return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="#d4a017" stroke-width="${i % 6 ? .9 : 1.6}"/>` }).join('')}
    <g transform="translate(112 50)" filter="url(#f-sombra)"><g class="rodar">
      <circle r="9" fill="url(#g-ouro)" stroke="#78350f" stroke-width="1"/>${volta(10).map(g => `<rect x="-2" y="-12.5" width="4" height="5" rx="1" fill="url(#g-ouro)" stroke="#78350f" stroke-width=".6" transform="rotate(${g})"/>`).join('')}
      <circle r="3.4" fill="#134e4a" stroke="#78350f" stroke-width=".8"/></g></g>
    <g transform="translate(68 124)" filter="url(#f-sombra)">
      <path d="M-20 -6 Q-10 -10 0 -5 Q10 -10 20 -6 L20 7 Q10 3 0 8 Q-10 3 -20 7 Z" fill="#f5e6c4" stroke="#7c5a2a" stroke-width="1.1"/>
      <path d="M0 -5 L0 8" stroke="#7c5a2a" stroke-width="1"/>
      ${[-15, -11, -7, 5, 9, 13].map((x, i) => `<line x1="${x}" y1="${-3 + (i % 3)}" x2="${x + 4}" y2="${-4 + (i % 3)}" stroke="#0f766e" stroke-width=".8" class="onda" style="animation-delay:${i * .3}s"/>`).join('')}
    </g>
    <g transform="translate(26 26) rotate(-40)" filter="url(#f-sombra)"><g class="balancar">
      <path d="M0 -24 C9 -16 9 2 0 16 C-9 2 -9 -16 0 -24Z" fill="#f8fafc" stroke="#64748b" stroke-width=".9"/>
      ${[-16, -10, -4, 2, 8].map(y => `<path d="M0 ${y} L${y < -5 ? 6 : 5} ${y - 4} M0 ${y} L${y < -5 ? -6 : -5} ${y - 4}" stroke="#94a3b8" stroke-width=".7"/>`).join('')}
      <path d="M0 -20 L0 22" stroke="#475569" stroke-width="1.1"/><path d="M-1.6 16 L0 26 L1.6 16Z" fill="#1e293b"/></g></g>
    <g fill="#5eead4" filter="url(#f-brilho)">${estrela(40, 46, 2.6, 'class="piscar"')}${estrela(98, 98, 2.4, 'class="piscar" style="animation-delay:1.1s"')}</g>` },
  { id: 'leste', nome: 'Dragão do Leste', desc: 'Homenagem a Leste: o dragão oriental e sua pérola', especial: true, arte: () => {
    const [ax, ay] = pol(57, 42), [bx, by] = pol(57, 318), [hx, hy] = pol(57, 30), [tx, ty] = pol(57, 326)
    return `
    <defs><radialGradient id="g-perola" cx="40%" cy="35%" r="65%"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#bae6fd"/><stop offset="1" stop-color="#0e7490"/></radialGradient>
      <linearGradient id="g-jade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6ee7b7"/><stop offset=".5" stop-color="#059669"/><stop offset="1" stop-color="#064e3b"/></linearGradient></defs>
    <circle cx="68" cy="68" r="57" fill="none" stroke="#34d399" stroke-width="14" opacity=".18" class="pulsar" filter="url(#f-neon)"/>
    <circle cx="68" cy="68" r="51.5" fill="none" stroke="#065f46" stroke-width="2"/>
    ${volta(26, 50).filter(g => g < 312).map(g => { const [x, y] = pol(62.5, g); return `<path d="M-2.6 0 L0 -5.5 L2.6 0Z" fill="#f59e0b" stroke="#92400e" stroke-width=".5" transform="translate(${f(x)} ${f(y)}) rotate(${g})"/>` }).join('')}
    <path d="M${f(ax)} ${f(ay)} A57 57 0 1 1 ${f(bx)} ${f(by)}" fill="none" stroke="#064e3b" stroke-width="11" stroke-linecap="round"/>
    <path d="M${f(ax)} ${f(ay)} A57 57 0 1 1 ${f(bx)} ${f(by)}" fill="none" stroke="url(#g-jade)" stroke-width="9" stroke-linecap="round"/>
    <path class="escamas" d="M${f(ax)} ${f(ay)} A57 57 0 1 1 ${f(bx)} ${f(by)}" fill="none" stroke="#a7f3d0" stroke-width="5" stroke-dasharray="1.2 3.4" stroke-linecap="round" opacity=".75"/>
    <path d="M${f(pol(53.5, 44)[0])} ${f(pol(53.5, 44)[1])} A53.5 53.5 0 1 1 ${f(pol(53.5, 316)[0])} ${f(pol(53.5, 316)[1])}" fill="none" stroke="#fde68a" stroke-width="1.2" opacity=".8"/>
    ${[[16, 96, 1], [120, 92, -1], [44, 128, 1]].map(([x, y, e], i) => `<g transform="translate(${x} ${y}) scale(${e} 1)"><g class="flutuar" style="animation-delay:${i * .7}s"><path d="M-9 2 C-12 -3 -6 -7 -2 -4 C0 -9 8 -8 8 -2 C12 -2 12 4 7 4 L-7 4 C-10 4 -11 3 -9 2Z" fill="#ecfeff" fill-opacity=".9" stroke="#0e7490" stroke-width=".8"/><path d="M-2 -1 C0 -3 3 -3 3 0" fill="none" stroke="#0e7490" stroke-width=".7"/></g></g>`).join('')}
    <g transform="translate(${f(tx)} ${f(ty)}) rotate(-30)" filter="url(#f-sombra)"><g class="balancar"><path d="M0 0 C-6 -6 -12 -4 -14 -10 C-10 -6 -6 -10 -8 -15 C-3 -10 2 -8 2 -2Z" fill="#f59e0b" stroke="#92400e" stroke-width=".8"/></g></g>
    <g transform="translate(${f(hx)} ${f(hy)}) rotate(24) scale(1.45)" filter="url(#f-sombra)">
      <path d="M2 -6 L12 -16 L9 -5 M4 -4 L16 -11 L10 -2" fill="#fbbf24" stroke="#92400e" stroke-width="1" stroke-linejoin="round"/>
      <path d="M6 -6 L11 -9 L9 -4 L13 -4 L8 0 L12 2 L6 4" fill="#f59e0b" stroke="#92400e" stroke-width=".7"/>
      <path d="M0 -6 C-8 -7 -15 -5 -19 -1 L-19 2 C-15 3 -10 2 -7 5 C-3 6 3 5 6 2 C7 -1 5 -5 0 -6Z" fill="url(#g-jade)" stroke="#064e3b" stroke-width="1.1"/>
      <path d="M-19 2 C-14 6 -8 7 -4 6" fill="none" stroke="#064e3b" stroke-width=".9"/>
      <circle cx="-16" cy="-1.5" r=".9" fill="#064e3b"/>
      <ellipse cx="-5" cy="-2.6" rx="2.2" ry="1.6" fill="#fde047" class="pulsar" filter="url(#f-brilho)"/><ellipse cx="-5" cy="-2.6" rx=".5" ry="1.4" fill="#111"/>
      <g class="bigode"><path d="M-18 -1 C-25 -7 -29 -2 -34 -8" fill="none" stroke="#fcd34d" stroke-width="1" stroke-linecap="round"/><path d="M-17 2 C-24 7 -28 3 -33 9" fill="none" stroke="#fcd34d" stroke-width="1" stroke-linecap="round"/></g>
    </g>
    <g class="flutuar">${volta(8).map((g, i) => `<g transform="translate(${f(60 + 10 * Math.sin(g * Math.PI / 180))} ${f(2 - 10 * Math.cos(g * Math.PI / 180))}) rotate(${g})"><path class="chama" style="animation-delay:${i * .12}s" d="M-2 0 C-2 -4 0 -6 0 -9 C1 -6 2 -4 2 0Z" fill="#fbbf24" opacity=".85"/></g>`).join('')}
      <circle cx="60" cy="2" r="8" fill="url(#g-perola)" filter="url(#f-brilho)" class="pulsar"/>
      </g>
    <g fill="#fde68a" filter="url(#f-brilho)">${estrela(46, 2, 2.4, 'class="piscar"')}${estrela(88, -3, 2, 'class="piscar" style="animation-delay:1s"')}</g>` } },
]


const details: Record<string,string> = {
lua: '<circle cx="68" cy="68" r="55" fill="none" stroke="url(#g-prata)" stroke-width="5"/><g fill="#b69aff"><path d="M10 68l5 -8 5 8 -5 8z M68 119l5 8 -5 8 -5 -8z"/></g>',
estrelas: '<ellipse cx="68" cy="68" rx="64" ry="54" transform="rotate(-35 68 68)" fill="none" stroke="#818cf8" stroke-width="1.5" stroke-dasharray="12 4"/><circle cx="68" cy="68" r="57" fill="none" stroke="#4338ca" stroke-width="5" opacity=".4"/>',
chamas: '<circle cx="68" cy="68" r="54" fill="none" stroke="#421b20" stroke-width="8"/><circle cx="68" cy="68" r="55" fill="none" stroke="#fb923c" stroke-width="2" stroke-dasharray="7 4 2 3"/>',
gelo: '<circle cx="68" cy="68" r="55" fill="none" stroke="url(#g-gelo)" stroke-width="7"/>',
folhas: '<circle cx="68" cy="68" r="54" fill="none" stroke="#513522" stroke-width="8"/><circle cx="68" cy="68" r="56" fill="none" stroke="#84cc16" stroke-width="2" stroke-dasharray="12 5"/>',
pirata: '<circle cx="68" cy="68" r="58" fill="none" stroke="#442b1a" stroke-width="8"/><circle cx="68" cy="68" r="61" fill="none" stroke="#b88b50" stroke-width="1.5"/>',
neon: '<circle cx="68" cy="68" r="57" fill="none" stroke="#102c42" stroke-width="8" stroke-dasharray="35 9"/><circle cx="68" cy="68" r="64" fill="none" stroke="#22d3ee" stroke-width="1" stroke-dasharray="2 7" class="girar"/>',
runas: '<circle cx="68" cy="68" r="57" fill="none" stroke="#4c101c" stroke-width="7"/><circle cx="68" cy="68" r="66" fill="none" stroke="#fb7185" stroke-width=".8" stroke-dasharray="3 8" class="girar-rapido"/>',
ouro: '<circle cx="68" cy="68" r="57" fill="none" stroke="url(#g-ouro)" stroke-width="7"/>',
mestre: '<circle cx="68" cy="68" r="55" fill="none" stroke="url(#g-ouro)" stroke-width="7"/>',
leste: '<circle cx="68" cy="68" r="55" fill="none" stroke="#063c35" stroke-width="6"/>'
};

const defs = "\n    <radialGradient id=\"g-prata\" cx=\"50%\" cy=\"50%\" r=\"50%\"><stop offset=\".72\" stop-color=\"#5b4d86\"/><stop offset=\".8\" stop-color=\"#e9e4ff\"/><stop offset=\".86\" stop-color=\"#9d8fd0\"/><stop offset=\".92\" stop-color=\"#f6f3ff\"/><stop offset=\"1\" stop-color=\"#6c5ca3\"/></radialGradient>\n    <linearGradient id=\"g-lua\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fffbea\"/><stop offset=\".6\" stop-color=\"#e8dcff\"/><stop offset=\"1\" stop-color=\"#a996e6\"/></linearGradient>\n    <linearGradient id=\"g-fogo\" x1=\"0\" y1=\"1\" x2=\"0\" y2=\"0\"><stop offset=\"0\" stop-color=\"#7f1d1d\"/><stop offset=\".35\" stop-color=\"#dc2626\"/><stop offset=\".7\" stop-color=\"#f97316\"/><stop offset=\"1\" stop-color=\"#fde047\"/></linearGradient>\n    <linearGradient id=\"g-fogo2\" x1=\"0\" y1=\"1\" x2=\"0\" y2=\"0\"><stop offset=\"0\" stop-color=\"#f97316\"/><stop offset=\"1\" stop-color=\"#fef3c7\"/></linearGradient>\n    <linearGradient id=\"g-gelo\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#f0f9ff\"/><stop offset=\".5\" stop-color=\"#7dd3fc\"/><stop offset=\"1\" stop-color=\"#0369a1\"/></linearGradient>\n    <linearGradient id=\"g-ouro\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fff3b0\"/><stop offset=\".35\" stop-color=\"#f5c542\"/><stop offset=\".65\" stop-color=\"#b7791f\"/><stop offset=\"1\" stop-color=\"#fde68a\"/></linearGradient>\n    <linearGradient id=\"g-folha\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#bef264\"/><stop offset=\"1\" stop-color=\"#15803d\"/></linearGradient>\n    <linearGradient id=\"g-corda\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#e3c08d\"/><stop offset=\".5\" stop-color=\"#a0703c\"/><stop offset=\"1\" stop-color=\"#e3c08d\"/></linearGradient>\n    <linearGradient id=\"g-escama\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#5eead4\"/><stop offset=\".55\" stop-color=\"#0f766e\"/><stop offset=\"1\" stop-color=\"#042f2e\"/></linearGradient>\n    <linearGradient id=\"g-sangue\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fca5a5\"/><stop offset=\".5\" stop-color=\"#dc2626\"/><stop offset=\"1\" stop-color=\"#450a0a\"/></linearGradient>\n    \n    <linearGradient id=\"g-reflexo\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#fff\" stop-opacity=\"0\"/><stop offset=\".5\" stop-color=\"#fff\" stop-opacity=\".9\"/><stop offset=\"1\" stop-color=\"#fff\" stop-opacity=\"0\"/></linearGradient>\n    <filter id=\"f-brilho\" x=\"-50%\" y=\"-50%\" width=\"200%\" height=\"200%\"><feGaussianBlur stdDeviation=\"2.2\" result=\"b\"/><feMerge><feMergeNode in=\"b\"/><feMergeNode in=\"SourceGraphic\"/></feMerge></filter>\n    <filter id=\"f-neon\" x=\"-50%\" y=\"-50%\" width=\"200%\" height=\"200%\"><feGaussianBlur stdDeviation=\"3\" result=\"b\"/><feMerge><feMergeNode in=\"b\"/><feMergeNode in=\"b\"/><feMergeNode in=\"SourceGraphic\"/></feMerge></filter>\n    <filter id=\"f-sombra\" x=\"-30%\" y=\"-30%\" width=\"160%\" height=\"160%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.5\" flood-color=\"#000\" flood-opacity=\".7\"/></filter>\n  "
const animationCss = "/* Animações: só quando \"Animadas\" está ligado e o aparelho não pede menos movimento. */\n  .prg-frame .an .piscar, .prg-frame .an .chama, .prg-frame .an .brasa, .prg-frame .an .balancar, .prg-frame .an .pulsar, .prg-frame .an .flutuar, .prg-frame .an .onda, .prg-frame .an .neon { transform-box: fill-box; transform-origin: center; }\n  .prg-frame .an .chama { transform-origin: center bottom; }\n  .prg-frame .an .girar { animation: girar 24s linear infinite; transform-box: view-box; transform-origin: 68px 68px; }\n  .prg-frame .an .girar-rapido { animation: girar 9s linear infinite reverse; transform-box: view-box; transform-origin: 68px 68px; }\n  .prg-frame .an .piscar { animation: piscar 2.6s ease-in-out infinite; }\n  .prg-frame .an .chama { animation: chama 0.9s ease-in-out infinite alternate; transform-origin: center bottom; }\n  .prg-frame .an .brasa { animation: brasa 2.4s linear infinite; }\n  .prg-frame .an .balancar { animation: balancar 3.2s ease-in-out infinite; }\n  .prg-frame .an .pulsar { animation: pulsar 2.2s ease-in-out infinite; }\n  .prg-frame .an .neon { animation: neon 3.5s steps(1) infinite; }\n  .prg-frame .an .brilho { animation: girar 4.5s linear infinite; transform-box: view-box; transform-origin: 68px 68px; }\n  .prg-frame .an .rodar { animation: girar 7s linear infinite; transform-box: fill-box; transform-origin: center; }\n  .prg-frame .an .escamas { animation: escamas 3s linear infinite; }\n  .prg-frame .an .bigode { animation: balancar 2.6s ease-in-out infinite; transform-box: fill-box; transform-origin: 100% 50%; }\n  .prg-frame .an .flutuar { animation: flutuar 4s ease-in-out infinite; }\n  .prg-frame .an .onda { animation: onda 2.4s ease-in-out infinite; }\n  @keyframes escamas { to { stroke-dashoffset: -46; } }\n  @keyframes girar { to { transform: rotate(360deg); } }\n  @keyframes piscar { 0%,100% { opacity:.25; transform: scale(.7); } 50% { opacity:1; transform: scale(1.15); } }\n  @keyframes chama { from { transform: scaleY(.82) skewX(-3deg); } to { transform: scaleY(1.12) skewX(3deg); } }\n  @keyframes brasa { 0% { transform: translateY(0); opacity:0; } 20% { opacity:1; } 100% { transform: translateY(-18px); opacity:0; } }\n  @keyframes balancar { 0%,100% { transform: rotate(-9deg); } 50% { transform: rotate(9deg); } }\n  @keyframes pulsar { 0%,100% { opacity:.55; } 50% { opacity:1; } }\n  @keyframes neon { 0%,100% { opacity:1; } 8% { opacity:.35; } 10% { opacity:1; } 52% { opacity:1; } 54% { opacity:.5; } 56% { opacity:1; } }\n  @keyframes flutuar { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2.5px); } }\n  @keyframes onda { 0%,100% { opacity:.65; } 50% { opacity:1; } }\n  @media (prefers-reduced-motion: reduce) { .prg-frame .an * { animation: none !important; } }"
function Arte({ id, uid }: { id: string; uid: string }) {
 const m = MOLDURAS.find(m => m.id === id); if (!m) return null;
 const raw = '<defs>'+defs+'<mask id="m-anel"><rect x="-20" y="-20" width="176" height="176" fill="white"/><circle cx="68" cy="68" r="50" fill="black"/></mask></defs><g class="an">'+(details[id] || '')+m.arte()+'</g>';
 const markup = raw.replace(/id="([\w-]+)"/g, (_, x: string) => `id="${uid}-${x}"`).replace(/url\(#([\w-]+)\)/g, (_, x: string) => `url(#${uid}-${x})`);
 return <><style>{animationCss}</style><g dangerouslySetInnerHTML={{ __html: markup }} /></>;
}
/** Envolve a foto redonda com a moldura escolhida. Sem moldura, devolve a foto como está. */
export default function Moldura({ id, children, className = '' }: { id?: string | null; children: ReactNode; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  if (!id) return <>{children}</>
  return <span className={'relative inline-flex shrink-0 ' + className} data-moldura={id}>
    {children}
    <svg aria-hidden viewBox="0 0 136 136" className="prg-frame pointer-events-none absolute -inset-[18%] h-[136%] w-[136%] overflow-visible drop-shadow-[0_1px_2px_rgba(0,0,0,.6)]"><Arte id={id} uid={uid} /></svg>
  </span>
}

/** Só a arte (para a vitrine de escolha). */
export function AmostraMoldura({ id, letra = '✦' }: { id: string; letra?: string }) {
  return <Moldura id={id}><span className="flex size-12 items-center justify-center rounded-full border border-(--a-62527e) bg-(--s-342749) text-lg font-bold text-(--a-d8c0ff)">{letra}</span></Moldura>
}
