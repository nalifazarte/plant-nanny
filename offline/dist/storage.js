import { initialState, validateState } from './model.js';
let db;
export async function openStorage() {
  db = await new Promise((resolve, reject) => {
    const r = indexedDB.open('brota-offline', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('data');
    r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
    r.onblocked = () => reject(Error('Feche outras abas do Brota e tente novamente.'));
  });
  db.onversionchange = () => db.close();
  return db;
}
export async function read(key = 'current') {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('data', 'readonly'); const r = tx.objectStore('data').get(key);
    tx.oncomplete = () => resolve(r.result); tx.onerror = () => reject(tx.error);
  });
}
export async function load() { const s = await read(); return s ? validateState(s) : initialState(); }
// Mutations read the latest state inside a single read/write transaction: two tabs
// cannot silently overwrite one another's drink logs.
export async function change(mutator) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('data', 'readwrite'); const store = tx.objectStore('data');
    const request = store.get('current'); let next, failure;
    request.onsuccess = () => {
      try { next = request.result ?? initialState(); mutator(next); validateState(next); store.put(next, 'current'); }
      catch (e) { failure = e; tx.abort(); }
    };
    tx.oncomplete = () => resolve(next);
    tx.onabort = tx.onerror = () => reject(failure ?? tx.error ?? Error('Não foi possível salvar os dados.'));
  });
}
export async function replace(incoming) {
  const clean = validateState(incoming);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('data', 'readwrite'); const store = tx.objectStore('data');
    const r = store.get('current');
    r.onsuccess = () => { store.put(r.result ?? initialState(), 'before-import'); store.put(clean, 'current'); };
    tx.oncomplete = () => resolve(clean); tx.onabort = tx.onerror = () => reject(tx.error);
  });
}
