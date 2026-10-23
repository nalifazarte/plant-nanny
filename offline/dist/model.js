export const APP = 'brota-offline';
export const VERSION = 1;
export const STAGES = [0, 2, 5, 9];
export const POTS = ['barro', 'creme', 'rosa', 'azul'];
export const SCENES = ['amanhecer', 'lago', 'noite'];
export const DECOR = ['nenhuma', 'pedras', 'cogumelos', 'estrelas'];
export const SPECIES = [
  { id: 'trevo', name: 'Trevinho', shape: 'leaf', color: '#67a96b', accent: '#c7df9c' },
  { id: 'flor', name: 'Flor de sol', shape: 'flower', color: '#79a871', accent: '#efbc61' },
  { id: 'cacto', name: 'Cacto abraço', shape: 'cactus', color: '#78ae91', accent: '#e7a5ae' },
  { id: 'limao', name: 'Limoeiro', shape: 'tree', color: '#679569', accent: '#e4cf6c' },
  { id: 'luna', name: 'Flor da lua', shape: 'flower', color: '#8ca38a', accent: '#c0b4e1' },
  { id: 'morango', name: 'Moranguinho', shape: 'berry', color: '#7aaf7d', accent: '#e88f87' }
];
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export const id = () => crypto.randomUUID();
export function initialState() {
  return { app: APP, version: VERSION, settings: { goal: 1800, defaultCup: 'copo', motionEnabled: true, profile: { weight: '', factor: '', activity: 'leve' } },
    cups: [{ id: 'copo', name: 'Copo', ml: 240 }, { id: 'garrafinha', name: 'Garrafinha', ml: 500 }, { id: 'garrafa', name: 'Garrafa', ml: 1000 }],
    species: [], plants: [], activeId: null, logs: [], dayGoals: {} };
}
export const allSpecies = s => [...SPECIES, ...s.species];
export const activePlant = s => s.plants.find(p => p.id === s.activeId);
export const totalForDay = (s, day) => s.logs.filter(l => l.day === day).reduce((a, l) => a + l.ml, 0);
export const goalForDay = (s, day) => s.dayGoals[day] ?? s.settings.goal;
// A whole daily goal earns one growth unit. Excess water never accelerates growth.
// The daily cap is shared by all plants, including a new plant started the same day.
export function growth(s, plantId) {
  const plant = s.plants.find(p => p.id === plantId);
  if (plant?.gardenAt) return 9;
  const used = new Map();
  let result = 0;
  // Stable sorting preserves recording order for entries in the same millisecond.
  const ordered = [...s.logs].sort((a, b) => a.at.localeCompare(b.at));
  for (const log of ordered) {
    const previous = used.get(log.day) ?? 0;
    const credited = Math.max(0, Math.min(log.ml, s.dayGoals[log.day] - previous));
    used.set(log.day, previous + log.ml);
    if (log.plantId === plantId) result += credited / s.dayGoals[log.day];
  }
  return Math.min(9, Math.round(result * 1e8) / 1e8);
}
export function level(s, plantId) {
  const units = growth(s, plantId);
  return STAGES.reduce((n, threshold, i) => units + 1e-7 >= threshold ? i + 1 : n, 1);
}
export function plantSeed(s, speciesId, name = '') {
  if (s.activeId) throw Error('Cuide da sua planta atual até o nível 4 e leve-a ao jardim primeiro.');
  if (!allSpecies(s).some(x => x.id === speciesId)) throw Error('Planta desconhecida.');
  const plant = { id: id(), speciesId, name: name.trim().slice(0, 40) || allSpecies(s).find(x => x.id === speciesId).name,
    pot: 'barro', scene: 'amanhecer', decor: 'nenhuma', createdAt: new Date().toISOString(), gardenAt: null };
  s.plants.push(plant); s.activeId = plant.id; return plant;
}
export function recordWater(s, ml, at = new Date()) {
  if (!Number.isInteger(ml) || ml < 1 || ml > 3000) throw Error('Informe uma quantidade entre 1 e 3.000 ml.');
  if (!Number.isFinite(at.getTime()) || at.getTime() > Date.now() + 60000) throw Error('Escolha um horário válido, até o momento atual.');
  const day = localDay(at);
  if (totalForDay(s, day) + ml > 20000) throw Error('Confira a quantidade: o total desse dia ultrapassaria 20 litros.');
  s.dayGoals[day] ??= s.settings.goal;
  const plant = activePlant(s);
  // Backdated hydration records are included in reports, but never farm a current plant.
  const plantId = plant && at.getTime() >= Date.parse(plant.createdAt) ? plant.id : null;
  const log = { id: id(), ml, at: at.toISOString(), day, plantId };
  s.logs.push(log); return log;
}
export function archivePlant(s) {
  const plant = activePlant(s);
  if (!plant || level(s, plant.id) < 4) throw Error('Sua planta precisa chegar ao nível 4.');
  plant.gardenAt = new Date().toISOString(); s.activeId = null;
}
export function report(s, count, end = new Date()) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(end.getFullYear(), end.getMonth(), end.getDate() - count + 1 + i, 12);
    const day = localDay(d); return { day, ml: totalForDay(s, day), goal: goalForDay(s, day) };
  });
}
const assert = (ok, message) => { if (!ok) throw Error(`Backup inválido: ${message}`); };
const text = (x, max = 100) => typeof x === 'string' && x.length > 0 && x.length <= max;
const int = (x, low, high) => Number.isInteger(x) && x >= low && x <= high;
const date = x => typeof x === 'string' && Number.isFinite(Date.parse(x)) && new Date(x).toISOString() === x && Date.parse(x) <= Date.now() + 300000;
const dayValid = x => {
  if (typeof x !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return false;
  const d = new Date(`${x}T12:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === x;
};
function unique(items) { return new Set(items.map(x => x.id)).size === items.length; }
export function validateState(s) {
  assert(s && s.app === APP && s.version === VERSION, 'formato ou versão incompatível.');
  assert(s.settings && int(s.settings.goal, 100, 10000), 'meta diária.');
  assert(s.settings.motionEnabled === undefined || typeof s.settings.motionEnabled === 'boolean', 'preferência de movimento.');
  assert(Array.isArray(s.cups) && s.cups.length > 0 && s.cups.length <= 30 && unique(s.cups), 'recipientes.');
  assert(s.cups.every(c => text(c.id) && text(c.name, 40) && int(c.ml, 1, 3000)), 'recipiente incompleto.');
  assert(s.cups.some(c => c.id === s.settings.defaultCup), 'recipiente padrão.');
  const profile = s.settings.profile;
  assert(profile && ['leve', 'moderada', 'intensa'].includes(profile.activity), 'perfil.');
  assert((profile.weight === '' || (typeof profile.weight === 'number' && profile.weight >= 20 && profile.weight <= 350)) &&
    (profile.factor === '' || (typeof profile.factor === 'number' && profile.factor >= 1 && profile.factor <= 100)), 'dados do perfil.');
  assert(Array.isArray(s.species) && s.species.length <= 100 && unique(s.species), 'espécies.');
  assert(s.species.every(p => text(p.id) && !SPECIES.some(x => x.id === p.id) && text(p.name, 40) && ['leaf', 'flower', 'cactus', 'tree', 'berry'].includes(p.shape) && /^#[0-9a-f]{6}$/i.test(p.color) && /^#[0-9a-f]{6}$/i.test(p.accent)), 'espécie incompleta.');
  assert(Array.isArray(s.plants) && s.plants.length <= 5000 && unique(s.plants), 'coleção.');
  assert(s.plants.every(p => text(p.id) && text(p.name, 40) && allSpecies(s).some(x => x.id === p.speciesId) && POTS.includes(p.pot) && SCENES.includes(p.scene) && DECOR.includes(p.decor) && date(p.createdAt) && (p.gardenAt === null || (date(p.gardenAt) && p.gardenAt >= p.createdAt))), 'planta incompleta.');
  const growing = s.plants.filter(p => !p.gardenAt);
  assert(growing.length <= 1 && (growing.length === 0 ? s.activeId === null : s.activeId === growing[0].id), 'é permitida apenas uma planta ativa.');
  assert(s.dayGoals && typeof s.dayGoals === 'object' && !Array.isArray(s.dayGoals) && Object.entries(s.dayGoals).every(([d, g]) => dayValid(d) && int(g, 100, 10000)), 'metas históricas.');
  assert(Array.isArray(s.logs) && s.logs.length <= 100000 && unique(s.logs), 'registros.');
  const dailyTotals = new Map();
  const plantsById = new Map(s.plants.map(p => [p.id, p]));
  for (const l of s.logs) {
    assert(text(l.id) && int(l.ml, 1, 3000) && date(l.at) && dayValid(l.day) && int(s.dayGoals[l.day], 100, 10000), 'registro incompleto.');
    const p = plantsById.get(l.plantId);
    assert(l.plantId === null || (p && l.at >= p.createdAt && (!p.gardenAt || l.at <= p.gardenAt)), 'vínculo do registro com a planta.');
    dailyTotals.set(l.day, (dailyTotals.get(l.day) ?? 0) + l.ml);
    assert(dailyTotals.get(l.day) <= 20000, 'total diário acima do limite de validação.');
  }
  // Return only our known JSON structure. Imported text is always rendered escaped.
  return JSON.parse(JSON.stringify(s));
}
export function parseBackup(raw) {
  if (typeof raw !== 'string' || new TextEncoder().encode(raw).length > 10 * 1024 * 1024) throw Error('O backup deve ter até 10 MB.');
  let data; try { data = JSON.parse(raw); } catch { throw Error('Este arquivo não contém um JSON válido.'); }
  return validateState(data);
}
export function exportBackup(s) { return JSON.stringify({ ...validateState(s), exportedAt: new Date().toISOString() }, null, 2); }
