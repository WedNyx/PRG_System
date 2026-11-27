/**
 * Molduras de perfil v0.37.2 — a arte (SVG) de cada moldura, desenhada por nós.
 * Só texto SVG gerado aqui (nada vem do usuário). `id` deixa os ids internos (gradientes, filtros) únicos por moldura na página.
 * A foto ocupa o círculo de raio 50 no centro (68,68) de uma caixa 136×136.
 */
type Pt = [number, number]
const C = 68
export const pol = (r: number, g: number): Pt => { const a = (g - 90) * Math.PI / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)] }
export const f = (n: number) => Math.round(n * 100) / 100
export const volta = (n: number, ini = 0) => Array.from({ length: n }, (_, i) => ini + i * 360 / n)
export function semente(s: number) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 } }


const defsComuns = (id: string) => `
  <filter id="${id}-sombra" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="1.3" stdDeviation="1.2" flood-color="#000" flood-opacity=".75"/></filter>
  <filter id="${id}-luz" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="${id}-ouro" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="1.1" result="a"/>
    <feSpecularLighting in="a" surfaceScale="3.2" specularConstant="1.1" specularExponent="22" lighting-color="#fff6d5" result="s"><fePointLight class="luz-movel" x="20" y="10" z="70"/></feSpecularLighting>
    <feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/>
    <feComposite in="SourceGraphic" in2="s2" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/></filter>
  <linearGradient id="${id}-dourado" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset=".25" stop-color="#e9b949"/><stop offset=".5" stop-color="#a86b12"/><stop offset=".75" stop-color="#f3c95b"/><stop offset="1" stop-color="#7a4a08"/></linearGradient>`

function gema(x: number, y: number, r: number, cor: string, id: string) {
  const pts = Array.from({ length: 8 }, (_, i) => [x + r * Math.cos(i * Math.PI / 4 + Math.PI / 8), y + r * Math.sin(i * Math.PI / 4 + Math.PI / 8)])
  const mesa = pts.map(([px, py]) => [x + (px - x) * .48, y + (py - y) * .48])
  const fac = pts.map((p, i) => { const q = pts[(i + 1) % 8], m1 = mesa[i], m2 = mesa[(i + 1) % 8]; const luz = [.55, .35, .1, -.15, -.3, -.15, .1, .35][i]
    return `<path d="M${f(p[0])} ${f(p[1])} L${f(q[0])} ${f(q[1])} L${f(m2[0])} ${f(m2[1])} L${f(m1[0])} ${f(m1[1])}Z" fill="${luz > 0 ? '#fff' : '#000'}" fill-opacity="${Math.abs(luz)}"/>` }).join('')
  return `<g filter="url(#${id}-sombra)"><path d="M${pts.map(p => p.map(f).join(' ')).join(' L')}Z" fill="${cor}" stroke="#3b2a05" stroke-width=".5"/>${fac}
    <path d="M${mesa.map(p => p.map(f).join(' ')).join(' L')}Z" fill="${cor}" stroke="#fff" stroke-opacity=".35" stroke-width=".3"/>
    <path d="M${f(mesa[5][0])} ${f(mesa[5][1])} L${f(mesa[6][0])} ${f(mesa[6][1])}" stroke="#fff" stroke-width=".5" opacity=".9"/></g>`
}

function anelBrasa(id: string) {
  return `<defs>
    <filter id="${id}-trinca" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 .45  0 0 0 0 .05  0 0 0 6 -3.2" result="t"/><feComposite in="t" in2="SourceGraphic" operator="in"/></filter>
    <radialGradient id="${id}-metal" cx="50%" cy="50%" r="50%"><stop offset=".72" stop-color="#1a0c08"/><stop offset=".76" stop-color="#3b1a0e"/><stop offset=".8" stop-color="#140806"/></radialGradient></defs>
    <circle cx="68" cy="68" r="52.5" fill="none" stroke="#1a0b07" stroke-width="5"/>
    <circle cx="68" cy="68" r="52.5" fill="none" stroke="#000" stroke-width="5" filter="url(#${id}-trinca)" class="brasa-pulsa"/>
    <circle cx="68" cy="68" r="50.4" fill="none" stroke="#ffb347" stroke-width="1.3" opacity=".9"/>
    <circle cx="68" cy="68" r="55" fill="none" stroke="#ff7a1a" stroke-width=".8" opacity=".6"/>`
}

function gelo(id: string) {
  const r = semente(11), cacos: { g: number; L: number; w: number; incl: number }[] = []
  for (let i = 0; i < 30; i++) {
    const g = i * 12 + r() * 8 - 4, longo = i % 3 === 0
    cacos.push({ g, L: longo ? 13 + r() * 11 : 6 + r() * 7, w: longo ? 9 + r() * 4 : 6 + r() * 4, incl: r() * 16 - 8 })
  }
  cacos.sort((a, b) => b.L - a.L)
  const caco = (c: { g: number; L: number; w: number; incl: number }) => {
    const [bx, by] = pol(49.5, c.g), [lx, ly] = pol(50.5, c.g - c.w / 2.2), [rx, ry] = pol(50.5, c.g + c.w / 2.2), [tx, ty] = pol(50 + c.L, c.g + c.incl * .35)
    const [mx, my] = pol(50 + c.L * .45, c.g + c.incl * .2)
    return `<g><path d="M${f(lx)} ${f(ly)} L${f(tx)} ${f(ty)} L${f(mx)} ${f(my)} L${f(bx)} ${f(by)}Z" fill="url(#${id}-claro)"/>
      <path d="M${f(rx)} ${f(ry)} L${f(tx)} ${f(ty)} L${f(mx)} ${f(my)} L${f(bx)} ${f(by)}Z" fill="url(#${id}-escuro)"/>
      <path d="M${f(lx)} ${f(ly)} L${f(tx)} ${f(ty)} L${f(rx)} ${f(ry)}" fill="none" stroke="#f0fbff" stroke-width=".55" stroke-opacity=".85" stroke-linejoin="round"/>
      <path d="M${f(mx)} ${f(my)} L${f(tx)} ${f(ty)}" stroke="#ffffff" stroke-width=".5" opacity=".9"/></g>`
  }
  const pontas = cacos.filter(c => c.L > 14).map(c => pol(50 + c.L, c.g + c.incl * .35))
  return `<defs>
    <linearGradient id="${id}-claro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".97"/><stop offset=".5" stop-color="#bfe9ff" stop-opacity=".9"/><stop offset="1" stop-color="#6cc6f0" stop-opacity=".85"/></linearGradient>
    <linearGradient id="${id}-escuro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fd0f5" stop-opacity=".9"/><stop offset=".6" stop-color="#2b8fc7" stop-opacity=".85"/><stop offset="1" stop-color="#0b4f7a" stop-opacity=".9"/></linearGradient>
    <filter id="${id}-geada" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="3" seed="7" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="5"/><feGaussianBlur stdDeviation=".35"/></filter>
    <filter id="${id}-frio" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
    <radialGradient id="${id}-borda" cx="50%" cy="50%" r="50%"><stop offset=".86" stop-color="#fff" stop-opacity="0"/><stop offset=".93" stop-color="#e6f7ff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity=".95"/></radialGradient></defs>
    <circle cx="68" cy="68" r="60" fill="none" stroke="#7dd3fc" stroke-width="12" opacity=".16" filter="url(#${id}-frio)" class="frio-pulsa"/>
    <circle cx="68" cy="68" r="54" fill="url(#${id}-borda)" filter="url(#${id}-geada)"/>
    ${cacos.map(caco).join('')}
    <circle cx="68" cy="68" r="50.2" fill="none" stroke="#e0f6ff" stroke-width="1.6" filter="url(#${id}-geada)" opacity=".95"/>
    <g class="reflexo-gelo"><path d="M${pol(64, -20).map(f).join(' ')} A64 64 0 0 1 ${pol(64, 25).map(f).join(' ')}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".0"/></g>
    ${pontas.map(([x, y], i) => `<g class="cintilar" style="--d:${(i * .53) % 3}s"><path d="M${f(x)} ${f(y - 4)} L${f(x + .8)} ${f(y - .8)} L${f(x + 4)} ${f(y)} L${f(x + .8)} ${f(y + .8)} L${f(x)} ${f(y + 4)} L${f(x - .8)} ${f(y + .8)} L${f(x - 4)} ${f(y)} L${f(x - .8)} ${f(y - .8)}Z" fill="#fff"/></g>`).join('')}`
}

function luaSvg(id: string) {
  return `<defs>${defsComuns(id)}
    <linearGradient id="${id}-prata" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".3" stop-color="#b9b3cf"/><stop offset=".5" stop-color="#f4f1ff"/><stop offset=".72" stop-color="#8b84a8"/><stop offset="1" stop-color="#e9e6f5"/></linearGradient>
    <radialGradient id="${id}-luaf" cx="35%" cy="35%" r="75%"><stop offset="0" stop-color="#fffdf2"/><stop offset=".6" stop-color="#e8e1cc"/><stop offset="1" stop-color="#a59d8a"/></radialGradient>
    <filter id="${id}-crateras"><feTurbulence type="fractalNoise" baseFrequency=".18" numOctaves="4" seed="3" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 .45  0 0 0 0 .42  0 0 0 0 .38  0 0 -1.4 0 1.05"/><feComposite in2="SourceGraphic" operator="in"/></filter>
    <mask id="${id}-crescente"><rect x="0" y="-20" width="160" height="160" fill="#fff"/><circle cx="111" cy="13" r="18" fill="#000"/></mask>
    <filter id="${id}-halo" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="5"/></filter></defs>
    <circle cx="68" cy="68" r="53" fill="none" stroke="#2a2440" stroke-width="6"/>
    <circle cx="68" cy="68" r="53" fill="none" stroke="url(#${id}-prata)" stroke-width="4.2" filter="url(#${id}-ouro)"/>
    <circle cx="68" cy="68" r="50.4" fill="none" stroke="#f4f1ff" stroke-width=".6" opacity=".8"/>
    <circle cx="68" cy="68" r="58.5" fill="none" stroke="#cfc8ec" stroke-width=".8" stroke-dasharray=".6 3.4" class="gira-lento"/>
    <g mask="url(#${id}-crescente)">
      <circle cx="102" cy="21" r="19" fill="url(#${id}-luaf)"/>
      <circle cx="102" cy="21" r="19" fill="#fff" filter="url(#${id}-crateras)" opacity=".85"/>
      ${[[94, 14, 3.2], [90, 26, 2.2], [97, 33, 2.6], [88, 19, 1.4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#9c937f" opacity=".55"/><path d="M${x - r * .8} ${y + r * .45} A${r} ${r} 0 0 0 ${x + r * .8} ${y + r * .45}" fill="none" stroke="#fffaf0" stroke-width=".5" opacity=".8"/>`).join('')}
    </g>`
}

function constelacaoSvg(id: string) {
  const ps = volta(9, 12).map((g, i) => pol(i % 2 ? 58 : 63, g))
  return `<defs>${defsComuns(id)}</defs>
    <circle cx="68" cy="68" r="51.5" fill="none" stroke="#c7d2fe" stroke-width="1.6" opacity=".9"/>
    <circle cx="68" cy="68" r="53.5" fill="none" stroke="#6366f1" stroke-width=".6" opacity=".7"/>
    <path d="M${[...ps, ps[0]].map(p => p.map(f).join(' ')).join(' L')}" fill="none" stroke="#a5b4fc" stroke-width="1" opacity=".75" filter="url(#${id}-luz)" class="linhas-const"/>`
}

function florestaSvg(id: string) {
  const r = semente(21)
  const caule = (fase: number, cor: string, larg: number) => { const pts = Array.from({ length: 121 }, (_, i) => { const a = i * 3, rr = 54.5 + 2.2 * Math.sin(a * Math.PI / 180 * 9 + fase); return pol(rr, a) }); return `<path d="M${pts.map(p => p.map(f).join(' ')).join(' L')}" fill="none" stroke="${cor}" stroke-width="${larg}" stroke-linecap="round"/>` }
  const folhas = Array.from({ length: 22 }, (_, i) => ({ g: i * 360 / 22 + r() * 8, rr: 56 + r() * 6, s: .8 + r() * .55, rot: (r() - .5) * 100, tom: r() }))
  const folha = (fl: { g: number; rr: number; s: number; rot: number; tom: number }, i: number) => { const [x, y] = pol(fl.rr, fl.g)
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(fl.g + fl.rot)}) scale(${f(fl.s)})"><g class="folha-viva" style="--d:${(i * .37) % 3}s">
      <path d="M0 0 C4 -3 6 -9 0 -16 C-6 -9 -4 -3 0 0Z" fill="url(#${id}-folha${fl.tom > .66 ? 2 : fl.tom > .33 ? 1 : 0})" stroke="#14532d" stroke-width=".45"/>
      <path d="M0 -1 L0 -14" stroke="#14532d" stroke-width=".5" opacity=".8"/>
      <path d="M0 -4 L2.6 -6.5 M0 -7 L3 -9.6 M0 -10 L2.2 -12 M0 -4 L-2.6 -6.5 M0 -7 L-3 -9.6 M0 -10 L-2.2 -12" stroke="#14532d" stroke-width=".3" opacity=".6"/>
      <path d="M0 -15 C-3 -10 -3.5 -5 -1 -1" fill="none" stroke="#ecfccb" stroke-width=".5" opacity=".55"/></g></g>` }
  const flor = ([x, y]: number[], c: number) => `<g transform="translate(${x} ${y})" filter="url(#${id}-sombra)">${volta(5).map(g => `<ellipse cx="0" cy="-3.3" rx="2.3" ry="3.6" fill="url(#${id}-petala${c})" transform="rotate(${g})"/>`).join('')}<circle r="1.7" fill="#fde047" stroke="#ca8a04" stroke-width=".4"/></g>`
  return `<defs>${defsComuns(id)}
    ${[['#d9f99d', '#4d7c0f'], ['#86efac', '#166534'], ['#bef264', '#365314']].map(([a, b], i) => `<linearGradient id="${id}-folha${i}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></linearGradient>`).join('')}
    ${[['#fff1f2', '#f472b6'], ['#fefce8', '#facc15']].map(([a, b], i) => `<radialGradient id="${id}-petala${i}" cx="50%" cy="80%" r="80%"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></radialGradient>`).join('')}
    <radialGradient id="${id}-cogu" cx="40%" cy="30%" r="70%"><stop offset="0" stop-color="#fca5a5"/><stop offset="1" stop-color="#b91c1c"/></radialGradient>
    <filter id="${id}-musgo"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="2" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 .3  0 0 0 0 .55  0 0 0 0 .15  0 0 0 2 -.7"/><feComposite in2="SourceGraphic" operator="in"/></filter></defs>
    <circle cx="68" cy="68" r="54" fill="none" stroke="#1a2e05" stroke-width="7"/>
    <circle cx="68" cy="68" r="54" fill="none" stroke="#fff" stroke-width="7" filter="url(#${id}-musgo)"/>
    ${caule(0, '#3f2a14', 2.6)}${caule(Math.PI, '#5b3a1a', 2)}${caule(Math.PI, '#a16207', .5)}
    ${folhas.map(folha).join('')}
    ${([[[18, 100], 0], [[116, 28], 1], [[30, 30], 0]] as [number[], number][]).map(([p, c]) => flor(p, c)).join('')}
    <g transform="translate(96 121)" filter="url(#${id}-sombra)"><rect x="-1.6" y="-4" width="3.2" height="6" rx="1.4" fill="#fef3c7" stroke="#a16207" stroke-width=".4"/><path d="M-6 -3 C-6 -9 6 -9 6 -3Z" fill="url(#${id}-cogu)" stroke="#7f1d1d" stroke-width=".4"/>${[[-3, -5], [1, -7], [3.5, -4.5]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".8" fill="#fff"/>`).join('')}</g>
    <g transform="translate(104 117) scale(.7)" filter="url(#${id}-sombra)"><rect x="-1.6" y="-4" width="3.2" height="6" rx="1.4" fill="#fef3c7" stroke="#a16207" stroke-width=".4"/><path d="M-6 -3 C-6 -9 6 -9 6 -3Z" fill="url(#${id}-cogu)" stroke="#7f1d1d" stroke-width=".4"/><circle cx="0" cy="-6" r=".9" fill="#fff"/></g>`
}

function pirataSvg(id: string) {
  const cordas = volta(64).map((g, i) => { const [x, y] = pol(55.5, g); return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.9" ry="1.5" transform="rotate(${f(g + 45)} ${f(x)} ${f(y)})" fill="url(#${id}-fio)" stroke="#4a2c0f" stroke-width=".35"/>` }).join('')
  return `<defs>${defsComuns(id)}
    <linearGradient id="${id}-fio" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3d9a4"/><stop offset=".5" stop-color="#c08a4a"/><stop offset="1" stop-color="#6b4218"/></linearGradient>
    <linearGradient id="${id}-madeira" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b9783a"/><stop offset=".4" stop-color="#7a4416"/><stop offset=".6" stop-color="#9a5a22"/><stop offset="1" stop-color="#4a250a"/></linearGradient>
    <linearGradient id="${id}-ferro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#94a3b8"/><stop offset=".5" stop-color="#334155"/><stop offset="1" stop-color="#0f172a"/></linearGradient></defs>
    <circle cx="68" cy="68" r="55.5" fill="none" stroke="#3b2208" stroke-width="7.4"/>
    ${cordas}
    <circle cx="68" cy="68" r="51.6" fill="none" stroke="#2a1606" stroke-width="1"/>
    <g transform="translate(68 11)" filter="url(#${id}-sombra)"><g class="leme">
      ${volta(8).map(g => `<g transform="rotate(${g})"><rect x="-1.1" y="-15.5" width="2.2" height="15" fill="url(#${id}-madeira)" stroke="#2a1606" stroke-width=".35"/><ellipse cx="0" cy="-16.5" rx="1.7" ry="2.6" fill="url(#${id}-madeira)" stroke="#2a1606" stroke-width=".35"/></g>`).join('')}
      <circle r="10.5" fill="none" stroke="#2a1606" stroke-width="4.2"/><circle r="10.5" fill="none" stroke="url(#${id}-madeira)" stroke-width="3.2"/>
      <circle r="3.6" fill="url(#${id}-dourado)" stroke="#5a3a05" stroke-width=".5" filter="url(#${id}-ouro)"/></g></g>
    <g transform="translate(68 123)" filter="url(#${id}-sombra)"><g class="ancora">
      <circle cx="0" cy="-11" r="3" fill="none" stroke="url(#${id}-ferro)" stroke-width="2.2"/>
      <rect x="-1.8" y="-8.5" width="3.6" height="17" rx="1" fill="url(#${id}-ferro)"/><rect x="-8" y="-5" width="16" height="3" rx="1.2" fill="url(#${id}-ferro)"/>
      <path d="M-12 3 C-10 11 -4 13 0 13 C4 13 10 11 12 3 L9 5 C8 9 4 10.5 0 10.5 C-4 10.5 -8 9 -9 5Z" fill="url(#${id}-ferro)" stroke="#0f172a" stroke-width=".4"/>
      <path d="M-12 3 L-13.5 7 L-9.5 5.6Z M12 3 L13.5 7 L9.5 5.6Z" fill="#475569"/></g></g>`
}

function neonSvg(id: string) {
  const tubo = (r: number, cor: string, dash: string, cls: string) => `<g class="${cls}"><circle cx="68" cy="68" r="${r}" fill="none" stroke="${cor}" stroke-width="7" stroke-dasharray="${dash}" opacity=".35" filter="url(#${id}-neon)"/>
    <circle cx="68" cy="68" r="${r}" fill="none" stroke="${cor}" stroke-width="3" stroke-dasharray="${dash}" stroke-linecap="round"/>
    <circle cx="68" cy="68" r="${r}" fill="none" stroke="#ffffff" stroke-width="1" stroke-dasharray="${dash}" stroke-linecap="round" opacity=".95"/></g>`
  return `<defs>${defsComuns(id)}<filter id="${id}-neon" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2"/></filter></defs>
    <circle cx="68" cy="68" r="57" fill="none" stroke="#0b0f1a" stroke-width="16" opacity=".85"/>
    ${tubo(53.5, '#22d3ee', '46 6 10 6', 'tubo-a')}${tubo(60.5, '#f472b6', '22 8', 'tubo-b')}
    ${volta(6, 15).map(g => { const [x, y] = pol(57, g); return `<rect x="${f(x) - 1.4}" y="${f(y) - 4}" width="2.8" height="8" rx=".8" fill="#334155" stroke="#94a3b8" stroke-width=".4" transform="rotate(${g} ${f(x)} ${f(y)})"/>` }).join('')}`
}

function ritualSvg(id: string) {
  const G = ['M-3 -5 L3 5 M3 -5 L-3 5', 'M0 -5 L0 5 M-3 -2 L3 -2', 'M-3 5 L0 -5 L3 5', 'M-3 -5 L3 -5 L-3 5 L3 5', 'M0 -5 L0 5 M0 0 L3 -4', 'M-3 0 A3 3 0 1 0 3 0 M0 -5 L0 5', 'M-3 -5 L0 0 L3 -5 M0 0 L0 5', 'M-3 -3 L3 -3 M-3 3 L3 3 M0 -5 L0 5']
  const runas = (r: number, n: number, esc: number, cls: string) => `<g class="${cls}">${volta(n).map((g, i) => { const [x, y] = pol(r, g); return `<path d="${G[(i * 3) % G.length]}" transform="translate(${f(x)} ${f(y)}) rotate(${g}) scale(${esc})" stroke="#fecaca" stroke-width="1.3" fill="none" stroke-linecap="round"/>` }).join('')}</g>`
  const tri = (rot: number) => `<path d="M${[0, 120, 240].map(g => pol(51, g + rot).map(f).join(' ')).join(' L')}Z" fill="none" stroke="#ef4444" stroke-width=".6" opacity=".5"/>`
  return `<defs>${defsComuns(id)}<filter id="${id}-sangue" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" result="b"/><feFlood flood-color="#ff2a2a"/><feComposite in2="b" operator="in" result="c"/><feMerge><feMergeNode in="c"/><feMergeNode in="c"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <circle cx="68" cy="68" r="52.5" fill="none" stroke="#1a0505" stroke-width="5"/>
    <g filter="url(#${id}-sangue)">
      <circle cx="68" cy="68" r="51" fill="none" stroke="#fca5a5" stroke-width=".9"/><circle cx="68" cy="68" r="54" fill="none" stroke="#fca5a5" stroke-width=".5"/>
      <g class="anel-ext"><circle cx="68" cy="68" r="58" fill="none" stroke="#fca5a5" stroke-width=".7"/><circle cx="68" cy="68" r="66" fill="none" stroke="#fca5a5" stroke-width=".7"/>${runas(62, 16, .6, 'r1')}</g>
      <g class="anel-int"><circle cx="68" cy="68" r="50.8" fill="none" stroke="#fca5a5" stroke-width=".4" stroke-dasharray="1 2.2"/></g>
    </g>`
}

function ouroSvg(id: string) {
  return `<defs>${defsComuns(id)}</defs>
    <g filter="url(#${id}-ouro)">
      <circle cx="68" cy="68" r="52.5" fill="none" stroke="url(#${id}-dourado)" stroke-width="4.4"/>
      <circle cx="68" cy="68" r="61.5" fill="none" stroke="url(#${id}-dourado)" stroke-width="3"/>
      ${volta(32).map(g => { const [x, y] = pol(57, g); return `<path d="M${f(x)} ${f(y)} m-1.6 0 a1.6 1.6 0 1 0 3.2 0 a1.6 1.6 0 1 0 -3.2 0" fill="none" stroke="url(#${id}-dourado)" stroke-width="1.1"/>` }).join('')}
      ${volta(8, 22.5).map(g => { const [x, y] = pol(57, g); return `<path d="M${f(x)} ${f(y) - 4.5} L${f(x) + 2.6} ${f(y)} L${f(x)} ${f(y) + 4.5} L${f(x) - 2.6} ${f(y)}Z" fill="url(#${id}-dourado)" transform="rotate(${g} ${f(x)} ${f(y)})"/>` }).join('')}
    </g>
    ${volta(4).map((g, i) => { const [x, y] = pol(57, g); return `<circle cx="${f(x)}" cy="${f(y)}" r="7.2" fill="url(#${id}-dourado)" filter="url(#${id}-ouro)"/>${gema(x, y, 5.4, ['#be123c', '#1d4ed8', '#047857', '#7e22ce'][i], id)}` }).join('')}`
}

function coroaSvg(id: string) {
  const lado = (s: number) => volta(9).map((_, i) => { const g = 180 + s * (24 + i * 13.5), [x, y] = pol(57.5, g); return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(g + s * 62)})"><path d="M0 -7 C4 -3.5 4 3.5 0 7 C-4 3.5 -4 -3.5 0 -7Z" fill="url(#${id}-louro)" stroke="#365314" stroke-width=".45"/><path d="M0 -6 L0 6" stroke="#365314" stroke-width=".4"/><path d="M0 -6 C-2 -2 -2 2 0 6" fill="none" stroke="#ecfccb" stroke-width=".4" opacity=".6"/></g>` }).join('')
  return `<defs>${defsComuns(id)}
    <linearGradient id="${id}-louro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9f99d"/><stop offset=".5" stop-color="#65a30d"/><stop offset="1" stop-color="#1a2e05"/></linearGradient>
    <linearGradient id="${id}-veludo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e11d48"/><stop offset="1" stop-color="#4c0519"/></linearGradient>
    <linearGradient id="${id}-fita" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7f1d1d"/><stop offset=".5" stop-color="#ef4444"/><stop offset="1" stop-color="#7f1d1d"/></linearGradient></defs>
    <circle cx="68" cy="68" r="52.5" fill="none" stroke="url(#${id}-dourado)" stroke-width="4.4" filter="url(#${id}-ouro)"/>
    ${lado(-1)}${lado(1)}
    <g transform="translate(68 124)" filter="url(#${id}-sombra)"><path d="M0 0 C-6 -5 -12 -3 -11 2 C-10 6 -4 4 0 0Z M0 0 C6 -5 12 -3 11 2 C10 6 4 4 0 0Z" fill="url(#${id}-fita)"/><path d="M-1 1 L-5 11 L-2 9 L0 12 L1 1Z M1 1 L5 11 L2 9 L0 12" fill="#b91c1c"/><circle r="2.2" fill="#991b1b"/></g>
    <g class="coroa-g" filter="url(#${id}-sombra)">
      <path d="M45 22 C45 8 57 2 68 8 C79 2 91 8 91 22Z" fill="url(#${id}-veludo)"/>
      <g filter="url(#${id}-ouro)">
        <path d="M38 27 L41 4 L51 15 L58 0 L68 -8 L78 0 L85 15 L95 4 L98 27Z" fill="url(#${id}-dourado)" stroke="#5a3a05" stroke-width=".6" stroke-linejoin="round"/>
        <rect x="36" y="23" width="64" height="9" rx="2.5" fill="url(#${id}-dourado)" stroke="#5a3a05" stroke-width=".6"/>
        <circle cx="68" cy="-10.5" r="3" fill="url(#${id}-dourado)"/><path d="M68 -16 L68 -12 M66 -14 L70 -14" stroke="url(#${id}-dourado)" stroke-width="1.6"/>
        ${[41, 58, 78, 95].map(x => `<circle cx="${x}" cy="${x === 41 || x === 95 ? 3 : -1}" r="2.2" fill="url(#${id}-dourado)"/>`).join('')}
      </g>
      ${[[50, 27.5, 2.6, '#1d4ed8'], [68, 27.5, 3.3, '#be123c'], [86, 27.5, 2.6, '#1d4ed8'], [68, 9, 3.6, '#047857'], [55, 13, 2, '#7e22ce'], [81, 13, 2, '#7e22ce']].map(([x, y, r, c]) => gema(x as number, y as number, r as number, c as string, id)).join('')}
    </g>`
}

function criadorSvg(id: string) {
  const G = ['M-3 -5 L3 5 M3 -5 L-3 5', 'M0 -5 L0 5 M-3 -2 L3 -2', 'M-3 5 L0 -5 L3 5', 'M-3 -5 L3 -5 L-3 5 L3 5', 'M0 -5 L0 5 M0 0 L3 -4', 'M-3 -3 L3 -3 M-3 3 L3 3 M0 -5 L0 5']
  return `<defs>${defsComuns(id)}
    <linearGradient id="${id}-couro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c2d12"/><stop offset="1" stop-color="#3b0f05"/></linearGradient>
    <radialGradient id="${id}-pagina" cx="50%" cy="20%" r="80%"><stop offset="0" stop-color="#fffbeb"/><stop offset="1" stop-color="#e7d3a3"/></radialGradient>
    <linearGradient id="${id}-pena" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e0f2fe"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#94a3b8"/></linearGradient>
</defs>
    <g filter="url(#${id}-ouro)"><circle cx="68" cy="68" r="52.5" fill="none" stroke="url(#${id}-dourado)" stroke-width="3.4"/><circle cx="68" cy="68" r="64" fill="none" stroke="url(#${id}-dourado)" stroke-width="1.6"/></g>
    <g class="astrolabio gira-lento">${volta(72).map((g, i) => { const [x1, y1] = pol(55, g), [x2, y2] = pol(i % 6 ? 56.8 : 58, g); return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="#d4a017" stroke-width="${i % 6 ? .4 : .8}"/>` }).join('')}</g>
    <g class="runas-criador" filter="url(#${id}-luz)">${volta(28).filter(g => g < 150 || g > 215).map((g, i) => { const [x, y] = pol(60.6, g); return `<path d="${G[i % G.length]}" transform="translate(${f(x)} ${f(y)}) rotate(${g}) scale(.42)" stroke="#5eead4" stroke-width="1.6" fill="none" stroke-linecap="round" class="runa-c" style="--d:${(i * .17).toFixed(2)}s"/>` }).join('')}</g>
    <g transform="translate(68 122)" filter="url(#${id}-sombra)">
      <path d="M-23 -7 Q-12 -11 0 -6 Q12 -11 23 -7 L24 9 Q12 5 0 10 Q-12 5 -24 9Z" fill="url(#${id}-couro)" stroke="#1c0a03" stroke-width=".6"/>
      <path d="M-21 -7.5 Q-11 -11 0 -6 L0 8 Q-11 3.5 -21 7Z" fill="url(#${id}-pagina)"/><path d="M21 -7.5 Q11 -11 0 -6 L0 8 Q11 3.5 21 7Z" fill="url(#${id}-pagina)"/>
      <path d="M0 -6 L0 8.5" stroke="#a16207" stroke-width=".6"/>
      ${[-3, -.5, 2, 4.5].map((y, i) => `<path d="M-18 ${y} Q-10 ${y - 1.6} -3 ${y}" fill="none" stroke="#0f766e" stroke-width=".45" opacity=".8"/><path d="M3 ${y} Q10 ${y - 1.6} 18 ${y}" fill="none" stroke="#0f766e" stroke-width=".45" opacity=".8"/>`).join('')}
      <circle cx="0" cy="-2" r="7" fill="#5eead4" opacity=".25" filter="url(#${id}-luz)" class="pagina-brilho"/></g>
    <g class="pena" filter="url(#${id}-sombra)"><g transform="rotate(-35)">
      <path d="M0 -26 C10 -18 10 2 0 18 C-10 2 -10 -18 0 -26Z" fill="url(#${id}-pena)" stroke="#64748b" stroke-width=".6"/>
      ${[-20, -15, -10, -5, 0, 5, 10].map(y => `<path d="M0 ${y} L${y < 0 ? 6.5 : 5} ${y - 4.5} M0 ${y} L${y < 0 ? -6.5 : -5} ${y - 4.5}" stroke="#94a3b8" stroke-width=".4"/>`).join('')}
      <path d="M0 -22 L0 24" stroke="#334155" stroke-width="1"/><path d="M-1.6 19 L0 29 L1.6 19Z" fill="url(#${id}-dourado)"/></g></g>`
}

/** Moldura antiga da homenagem (Escamas do Dragão), mantida até o novo desenho do Leste. */
function lesteSvg(id: string) {
  void id
  return `${volta(18).map(g => { const [x, y] = pol(57, g); return `<circle cx="${f(x)}" cy="${f(y)}" r="6.5" fill="#0f766e" stroke="#5eead4" stroke-width="1.2"/>` }).join('')}
    <circle cx="68" cy="68" r="52" fill="none" stroke="#14b8a6" stroke-width="3"/>
    <path d="M44 22 Q36 6 26 2 Q36 14 38 26z M92 22 Q100 6 110 2 Q100 14 98 26z" fill="#5eead4" stroke="#134e4a" stroke-width="1.2"/>`
}

const ARTES: Record<string, (id: string) => string> = {
  lua: luaSvg, estrelas: constelacaoSvg, chamas: anelBrasa, gelo, folhas: florestaSvg, pirata: pirataSvg, neon: neonSvg, runas: ritualSvg,
  ouro: ouroSvg, mestre: coroaSvg, criador: criadorSvg, leste: lesteSvg,
}
/** SVG (conteúdo do <svg viewBox="0 0 136 136">) da moldura, ou '' se não existir. */
export const arteDaMoldura = (moldura: string, id: string) => ARTES[moldura]?.(id) ?? ''
