import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as DB from '../dist/storage.js';
import * as M from '../dist/model.js';
await DB.openStorage();
test('a fresh database starts empty and commits persist',async()=>{
  assert.equal((await DB.load()).logs.length,0);
  await DB.change(s=>M.recordWater(s,240));assert.equal((await DB.load()).logs.length,1);
});
test('parallel writers read the latest committed state instead of losing entries',async()=>{
  await DB.replace(M.initialState());
  await Promise.all(Array.from({length:12},()=>DB.change(s=>M.recordWater(s,100))));
  const s=await DB.load();assert.equal(s.logs.length,12);assert.equal(M.totalForDay(s,M.localDay()),1200);
});
test('invalid mutation aborts without altering persisted data',async()=>{
  const before=await DB.load();await assert.rejects(()=>DB.change(s=>{s.settings.goal=-1;}));
  assert.deepEqual(await DB.load(),before);
});
test('import replaces atomically and preserves the previous garden for recovery',async()=>{
  const before=await DB.load(), incoming=M.initialState();M.plantSeed(incoming,'flor','Margarida');
  await DB.replace(incoming);assert.deepEqual(await DB.load(),incoming);assert.deepEqual(await DB.read('before-import'),before);
  await DB.replace(await DB.read('before-import'));assert.deepEqual(await DB.load(),before);
});
test('invalid imported data cannot overwrite the current or recovery data',async()=>{
  const before=await DB.load(), recovery=await DB.read('before-import');
  await assert.rejects(()=>DB.replace({...before,version:100}));assert.deepEqual(await DB.load(),before);assert.deepEqual(await DB.read('before-import'),recovery);
});
