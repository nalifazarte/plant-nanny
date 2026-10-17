// Original, code-drawn characters. No remote images or commercial game assets.
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
const face = (y, scale = 1) => `<g transform="translate(0 ${y}) scale(${scale})"><ellipse cx="-17" cy="0" rx="5" ry="7" fill="#294d3e"/><ellipse cx="17" cy="0" rx="5" ry="7" fill="#294d3e"/><circle cx="-15.5" cy="-2" r="1.8" fill="#fff"/><circle cx="18.5" cy="-2" r="1.8" fill="#fff"/><ellipse cx="-27" cy="10" rx="8" ry="4" fill="#eead9e" opacity=".65"/><ellipse cx="27" cy="10" rx="8" ry="4" fill="#eead9e" opacity=".65"/><path d="M-5 10Q0 16 5 10" fill="none" stroke="#294d3e" stroke-width="2.5" stroke-linecap="round"/></g>`;
function sprig(x, y, angle, color) {
  return `<path d="M0 0Q-30-32-48-12Q-33 13 0 0Q24-35 44-24Q45 4 0 0" transform="translate(${x} ${y}) rotate(${angle})" fill="${color}"/>`;
}
export function plantArt(species, lv = 1, pot = 'barro', { small = false } = {}) {
  const c = species.color, a = species.accent;
  const colors = { barro: ['#d39979', '#bd7e61'], creme: ['#ede9d9', '#d4d2bf'], rosa: ['#d8a4a3', '#bd8589'], azul: ['#91b8c1', '#729ca9'] };
  const [p, shadow] = colors[pot] ?? colors.barro;
  let body = '';
  if (lv === 1) {
    body = `<path d="M0 184v-41" stroke="${c}" stroke-width="9" stroke-linecap="round"/>${sprig(0, 146, -10, c)}<ellipse cy="181" rx="33" ry="29" fill="${c}"/>${face(178, .7)}`;
  } else if (species.shape === 'cactus') {
    const height = lv === 2 ? 100 : lv === 3 ? 80 : 61;
    body = `<path d="M-28 169h-27v-35M28 153h28v-37" fill="none" stroke="${c}" stroke-width="22" stroke-linecap="round"/><rect x="-36" y="${height}" width="72" height="${205-height}" rx="36" fill="${c}"/><path d="M-19 122v11m42-24v10m-3 57v9m-40-26v8" stroke="#dae7c9" stroke-width="3" stroke-linecap="round"/>${face(height + 45)}${lv === 4 ? `<g transform="translate(0 60)">${petals(a, 19)}<circle r="9" fill="#f1d690"/></g>` : ''}`;
  } else if (species.shape === 'tree') {
    body = `<path d="M-18 200-10 106h20l12 94" fill="#ae8970"/><circle cy="${lv === 2 ? 129 : 105}" r="${lv === 2 ? 43 : lv === 3 ? 57 : 64}" fill="${c}"/>${lv > 2 ? `<circle cx="-40" cy="106" r="34" fill="${c}"/><circle cx="37" cy="92" r="36" fill="${c}"/>` : ''}${face(lv === 2 ? 128 : 110)}${lv === 4 ? `<g fill="${a}"><ellipse cx="-38" cy="86" rx="10" ry="13" transform="rotate(-20 -38 86)"/><ellipse cx="32" cy="133" rx="10" ry="13"/><ellipse cx="24" cy="67" rx="10" ry="13"/></g>` : ''}`;
  } else if (species.shape === 'flower') {
    const y = lv === 2 ? 130 : lv === 3 ? 107 : 87;
    body = `<path d="M0 202V${y}" stroke="${c}" stroke-width="12" stroke-linecap="round"/>${sprig(0, 170, -9, c)}${lv >= 3 ? sprig(0, 148, 180, c) : ''}<g transform="translate(0 ${y})">${petals(a, lv === 2 ? 26 : lv === 3 ? 35 : 43)}<circle r="${lv === 2 ? 24 : 32}" fill="#f3d796"/>${face(0, lv === 2 ? .7 : .9)}</g>${lv === 4 ? `<path d="m-73 78 3-8 3 8 8 3-8 3-3 8-3-8-8-3Z" fill="${a}"/>` : ''}`;
  } else if (species.shape === 'berry') {
    const sz = lv === 2 ? .75 : lv === 3 ? .9 : 1.05;
    body = `<g transform="translate(0 ${lv === 2 ? 154 : 142}) scale(${sz})"><path d="M-51-10Q-73 16-31 56Q0 84 31 56Q73 16 51-10Q29-34 0-21Q-29-34-51-10" fill="${a}"/>${sprig(0,-21,5,c)}${face(12)}<g fill="#fae8c1"><ellipse cx="-38" cy="8" rx="2" ry="3"/><ellipse cx="36" cy="16" rx="2" ry="3"/><ellipse cx="-17" cy="49" rx="2" ry="3"/><ellipse cx="13" cy="54" rx="2" ry="3"/></g></g>`;
  } else {
    const size = lv === 2 ? .82 : lv === 3 ? 1 : 1.12;
    body = `<g transform="translate(0 ${lv === 2 ? 157 : 149}) scale(${size})"><path d="M0-59C-12-42-57-32-51 15Q-48 57 0 57Q52 57 54 15C57-18 17-33 0-59" fill="${c}"/><path d="M-30-6Q-42 11-32 29" fill="none" stroke="${a}" stroke-width="8" stroke-linecap="round"/>${face(10)}${sprig(0,-56,lv===4 ? -5 : -25,c)}${lv === 4 ? `<path d="M6-58Q22-103 49-82Q43-52 6-58" fill="${a}"/>` : ''}</g>`;
  }
  return `<svg class="plant-art ${small ? 'small' : ''}" viewBox="0 0 240 300" role="img" aria-label="${esc(species.name)}, nível ${lv}"><g transform="translate(120 0)"><ellipse cy="276" rx="77" ry="9" fill="#345949" opacity=".10"/>${body}<path d="M-64 207h128l-13 59Q49 277 0 277T-51 266Z" fill="${p}"/><path d="M39 215h23l-11 51Q48 273 35 274Z" fill="${shadow}" opacity=".55"/><rect x="-71" y="199" width="142" height="26" rx="9" fill="${p}"/><path d="M-61 204h105" stroke="#fff" opacity=".25" stroke-width="4" stroke-linecap="round"/><ellipse cy="201" rx="61" ry="5" fill="#765b43" opacity=".4"/></g></svg>`;
}
function petals(color, r) {
  return Array.from({length: 8}, (_,i) => `<ellipse cx="0" cy="-${r}" rx="${r*.45}" ry="${r*.7}" fill="${color}" transform="rotate(${i*45})"/>`).join('');
}
export function landscape(scene = 'amanhecer', decor = 'nenhuma') {
  const night = scene === 'noite', lake = scene === 'lago';
  const sky = night ? '#405763' : lake ? '#cfe8df' : '#e8edde';
  const hills = night ? ['#5b7370', '#72887a'] : lake ? ['#97bdb0', '#b3ccad'] : ['#becdb0', '#d3d9b8'];
  let extras = decor === 'cogumelos' ? '<g transform="translate(42 337)"><path d="M0-8v15m17-8v12" stroke="#eee9d4" stroke-width="7"/><path d="M-15-8Q0-31 15-8Z" fill="#cc8e7d"/><path d="M6 0q11-23 24 0Z" fill="#d6aa81"/><g fill="#f5e9d1"><circle cx="-3" cy="-14" r="2"/><circle cx="20" cy="-6" r="2"/></g></g>' : decor === 'pedras' ? '<g fill="#a8b1a1"><ellipse cx="48" cy="346" rx="18" ry="10"/><ellipse cx="75" cy="349" rx="12" ry="7"/><ellipse cx="335" cy="350" rx="17" ry="8"/></g>' : decor === 'estrelas' ? '<g fill="#e6cb83"><path d="m55 205 4-12 4 12 12 4-12 4-4 12-4-12-12-4Z"/><path d="m333 145 3-9 3 9 9 3-9 3-3 9-3-9-9-3Z"/></g>' : '';
  return `<svg class="landscape" viewBox="0 0 400 390" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="390" fill="${sky}"/>${night ? '<circle cx="304" cy="73" r="25" fill="#eee8c6"/><circle cx="315" cy="64" r="22" fill="#405763"/><g fill="#e2d8af"><circle cx="91" cy="53" r="2"/><circle cx="167" cy="93" r="2"/><circle cx="345" cy="128" r="2"/><circle cx="252" cy="39" r="2"/></g>' : '<circle cx="302" cy="88" r="43" fill="#f5e8bb"/><circle cx="302" cy="88" r="60" fill="#f5e8bb" opacity=".3"/>'}<path d="M0 218Q80 111 193 221Q308 111 400 204V390H0Z" fill="${hills[0]}"/><path d="M0 258Q130 192 216 251Q318 200 400 240V390H0Z" fill="${hills[1]}"/>${lake ? '<path d="M0 277Q163 250 400 279v35H0Z" fill="#b6d9cd"/><path d="M275 289h62m-39 12h68M25 295h61" stroke="#d7ebe0" stroke-width="2"/>' : ''}<path d="M22 0v300m356-300v300M0 299h400" stroke="${night ? '#819283' : '#fbf6e8'}" stroke-width="12" opacity=".65"/><rect y="310" width="400" height="80" fill="${night ? '#b2ad91' : '#dfd1af'}"/><path d="M0 322h400M0 380h400" stroke="#b5a585" stroke-width="2" opacity=".45"/><path d="M0 350q45-81 71-36Q49 339 0 350" fill="#8eaa7d"/><path d="M400 354q-45-89-77-39Q350 342 400 354" fill="#a0b28a"/>${extras}</svg>`;
}
