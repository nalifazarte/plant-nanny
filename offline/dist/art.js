// Local ink-and-gouache game art, generated from the user's visual direction.
// Interface icons and freely colorable custom plants retain a code-native layer.
export const icons = {
  drop: '<path d="M12 3C9 8 5 11 5 15a7 7 0 0 0 14 0c0-4-4-7-7-12Z"/><path d="M8 15a4 4 0 0 0 4 4"/>',
  leaf: '<path d="M20 3C8 2 3 8 5 15c7 4 15-1 15-12Z"/><path d="M4 21 15 9"/>',
  garden: '<path d="M4 14h16l-2 7H6l-2-7ZM12 14V7M12 10C5 10 4 6 4 3c5 0 8 2 8 7ZM12 8c0-5 4-6 8-6 0 4-3 7-8 6Z"/>',
  chart: '<path d="M4 3v18h17M8 16v-4m5 4V6m5 10V9"/>',
  settings: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',
  arrow: '<path d="m5 12 14 0m-5-5 5 5-5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  undo: '<path d="M8 4 3 9l5 5M3 9h10a6 6 0 0 1 0 12"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  upload: '<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',
  cup: '<path d="m5 4 2 17h10l2-17H5ZM6 10h12"/>',
  sparkle: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z"/>',
  edit: '<path d="m14 5 5 5M3 21l5-1L21 7l-5-5L3 15v6Z"/>'
};
export const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] ?? icons.leaf}</svg>`;
export const esc = x => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const rows = { trevo: 0, flor: 1, cacto: 2, limao: 3, luna: 4, morango: 5 };
const pots = { barro: 0, creme: 1, rosa: 2, azul: 3 };
const shapeRows = { leaf: 0, flower: 4, cactus: 2, tree: 3, berry: 5 };
const sprite = (asset, x, y, sheetWidth, sheetHeight, frame = '0 0 240 240') => `<svg x="${frame.split(' ')[0]}" y="${frame.split(' ')[1]}" width="${frame.split(' ')[2]}" height="${frame.split(' ')[3]}" viewBox="${x} ${y} 256 256" overflow="hidden"><image href="./assets/${asset}" width="${sheetWidth}" height="${sheetHeight}"/></svg>`;
export function plantArt(species, lv = 1, pot = 'barro', {small = false} = {}) {
  const row = rows[species.id] ?? shapeRows[species.shape] ?? 0;
  const col = Math.max(0, Math.min(3, lv - 1));
  const custom = rows[species.id] === undefined;
  // Keep custom colors functional without flattening the illustrated texture.
  // Two masks distinguish green foliage from colored flowers/fruit; black ink
  // and the transparent background remain unchanged.
  const filterKey = `tint-${species.color.replace('#','')}-${species.accent.replace('#','')}-${row}-${col}`;
  const colorMatrix = hex => {
    const rgb = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255);
    return rgb.map(v => `${(.28*v*1.6).toFixed(4)} ${(.59*v*1.6).toFixed(4)} ${(.13*v*1.6).toFixed(4)} 0 0`).join(' ') + ' 0 0 0 1 0';
  };
  const defs = custom ? `<defs><filter id="${filterKey}-green" color-interpolation-filters="sRGB"><feColorMatrix values="${colorMatrix(species.color)}"/></filter><filter id="${filterKey}-accent" color-interpolation-filters="sRGB"><feColorMatrix values="${colorMatrix(species.accent)}"/></filter><filter id="${filterKey}-mask" color-interpolation-filters="sRGB"><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 -3 5 -2 0 0"/><feComponentTransfer><feFuncA type="discrete" tableValues="0 0 1 1"/></feComponentTransfer></filter><mask id="${filterKey}-foliage" mask-type="alpha"><g filter="url(#${filterKey}-mask)">${sprite('plants-ink.webp', col*256, row*256,1024,1536,'10 -5 220 220')}</g></mask><filter id="${filterKey}-color-mask" color-interpolation-filters="sRGB"><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 3 -4 3 0 -0.7"/><feComponentTransfer><feFuncA type="discrete" tableValues="0 0 1 1"/></feComponentTransfer></filter><mask id="${filterKey}-flowers" mask-type="alpha"><g filter="url(#${filterKey}-color-mask)">${sprite('plants-ink.webp',col*256,row*256,1024,1536,'10 -5 220 220')}</g></mask></defs>` : '';
  const body = sprite('plants-ink.webp',col*256,row*256,1024,1536,'10 -5 220 220');
  return `<svg class="plant-art ink-plant ${small?'small':''}" viewBox="0 0 240 300" role="img" aria-label="${esc(species.name)}, nível ${lv}">${defs}<ellipse class="plant-shadow" cx="121" cy="288" rx="70" ry="7" fill="#17251b" opacity=".16"/><g class="plant-reaction"><g class="plant-foliage" style="--sway-time:${6.5+row*.55}s;--sway-phase:-${1+row*.7+col*.3}s;--sway-angle:${lv===1?2.2:row===2?1:1.6}deg"><g class="plant-breath">${body}${custom?`<g mask="url(#${filterKey}-foliage)" filter="url(#${filterKey}-green)">${body}</g><g mask="url(#${filterKey}-flowers)" filter="url(#${filterKey}-accent)">${body}</g>`:''}</g></g></g>${sprite('props-ink.webp',(pots[pot]??0)*256,0,1024,512,'48 171 144 130')}<g aria-hidden="true" class="water-wish" style="--wish-delay:.05s"><path d="m48 142 3-7 3 7 7 3-7 3-3 7-3-7-7-3Z" fill="#c5a1e5" stroke="#37492b" stroke-width=".8"/></g><g aria-hidden="true" class="water-wish" style="--wish-delay:.2s"><path d="M189 119q-7 9-7 12a7 7 0 0 0 14 0q0-3-7-12" fill="#b9d9c1" stroke="#37492b" stroke-width=".8"/></g></svg>`;
}
export function landscape(scene='amanhecer', decor='nenhuma') {
  const col = {amanhecer:0,lago:1,noite:2}[scene]??0;
  const decoration = {pedras:0,cogumelos:1,estrelas:2}[decor];
  const night = scene==='noite';
  const fireflies = night ? [[65,240],[320,225],[275,265],[97,185],[340,130]].map(([x,y],i)=>`<circle class="ambient-firefly" cx="${x}" cy="${y}" r="${i%2?1.6:2}" fill="#f2dc99" style="--phase:-${i*1.7}s;--period:${7+i*.8}s"/>`).join('') : '';
  const stars = night ? [[68,86],[133,48],[287,129]].map(([x,y],i)=>`<path class="ambient-sparkle" d="m${x} ${y-6} 1.8 4.2 4.2 1.8-4.2 1.8-1.8 4.2-1.8-4.2-4.2-1.8 4.2-1.8Z" fill="#fff0cd" style="--phase:-${i*2.1}s"/>`).join('') : '';
  const daylight = night ? '' : `<g class="ambient-cloud"><path d="M111 115q-3-8 5-10 5-11 13-3 10-4 12 6 11-1 11 7Z" fill="#fff9e8"/></g><g class="ambient-cloud second"><path d="M250 155q-3-7 4-9 4-8 11-3 8-2 10 5 7 0 8 7Z" fill="#fff9e8"/></g><g class="ambient-butterfly"><g class="butterfly-wings">${sprite('props-ink.webp',768,256,1024,512,'306 138 40 40')}</g></g>`;
  const halo = scene==='amanhecer' ? '<circle class="ambient-halo" cx="303" cy="79" r="38" fill="#ffd56e"/>' : '';
  const ripples = scene==='lago' ? '<g fill="none" stroke="#fff5d7" stroke-width="1.4" stroke-linecap="round"><path class="ambient-ripple" d="M76 232q16-3 32 0" style="--phase:-2s"/><path class="ambient-ripple" d="M260 249q20-3 40 0" style="--phase:-6s"/><path class="ambient-ripple" d="M192 216q10-2 20 0" style="--phase:-4s"/></g>' : '';
  const decorArt = decoration===undefined ? '' : sprite('props-ink.webp',decoration*256,256,1024,512,decoration===2?'292 83 65 65':'16 283 85 85');
  return `<svg class="landscape ink-landscape" viewBox="0 0 400 390" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><svg width="400" height="390" viewBox="${col*600} 0 600 600" preserveAspectRatio="xMidYMid slice" overflow="hidden"><image href="./assets/scenes-ink.webp" width="1800" height="600"/></svg><g class="ambient-motion">${halo}${daylight}${stars}${fireflies}${ripples}</g><g class="${decor==='cogumelos'?'decor-sway':decor==='estrelas'?'ambient-sparkle':''}">${decorArt}</g></svg>`;
}
