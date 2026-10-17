import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../dist/model.js';

function fixture() {
  const s=M.initialState();const p=M.plantSeed(s,'trevo','Bento');
  const start=new Date();start.setDate(start.getDate()-15);start.setHours(0,0,0,0);
  p.createdAt=start.toISOString();return {s,p,start};
}
function drinkOn(s,start,offset,ml=1800) {
  const at=new Date(start);at.setDate(at.getDate()+offset);at.setHours(12,0,0,0);
  M.recordWater(s,ml,at);return at;
}
test('a clean installation has no fictitious drinking history',()=>{
  const s=M.initialState();assert.equal(s.logs.length,0);assert.equal(s.activeId,null);assert.doesNotThrow(()=>M.validateState(s));
});
test('only one active plant is allowed',()=>{
  const {s}=fixture();assert.throws(()=>M.plantSeed(s,'flor'),/planta atual/);
});
test('four growth stages are reached at 0, 2, 5 and 9 daily goals',()=>{
  const {s,p,start}=fixture();assert.equal(M.level(s,p.id),1);
  for(let i=0;i<9;i++) {drinkOn(s,start,i);assert.equal(M.level(s,p.id),i<1?1:i<4?2:i<8?3:4);}
  assert.equal(M.growth(s,p.id),9);assert.doesNotThrow(()=>M.validateState(s));
});
test('excess intake cannot accelerate growth',()=>{
  const {s,p,start}=fixture();drinkOn(s,start,0,1800);drinkOn(s,start,0,3000);drinkOn(s,start,0,3000);
  assert.equal(M.growth(s,p.id),1);assert.equal(M.totalForDay(s,M.localDay(start)),7800);
});
test('partial daily goals add up across days',()=>{
  const {s,p,start}=fixture();drinkOn(s,start,0,900);drinkOn(s,start,1,900);assert.equal(M.growth(s,p.id),1);
});
test('moving into the garden requires level four',()=>{
  const {s}=fixture();assert.throws(()=>M.archivePlant(s),/nível 4/);
});
test('mature plants move to garden and unlock a new active plant',()=>{
  const {s,p,start}=fixture();for(let i=0;i<9;i++)drinkOn(s,start,i);
  M.archivePlant(s);assert.equal(s.activeId,null);assert.ok(p.gardenAt);
  const next=M.plantSeed(s,'limao');assert.equal(s.activeId,next.id);assert.equal(M.level(s,p.id),4);
  s.logs=[];assert.equal(M.level(s,p.id),4,'earned garden plants are preserved after history corrections');
});
test('the daily cap is shared when starting another plant on the same day',()=>{
  const {s,p,start}=fixture();for(let i=0;i<9;i++)drinkOn(s,start,i);
  const now=new Date();s.dayGoals[M.localDay(now)]=1800;M.recordWater(s,1800,now);M.archivePlant(s);
  s.logs.at(-1).id='z-first';
  const next=M.plantSeed(s,'flor');next.createdAt=now.toISOString();
  const log=M.recordWater(s,1800,now);log.id='a-second';
  assert.equal(M.growth(s,next.id),0,'identical timestamps must preserve recording order');
});
test('a change of goal preserves the day already logged',()=>{
  const {s,p,start}=fixture();const d=drinkOn(s,start,0,900);s.settings.goal=3000;drinkOn(s,start,0,900);
  assert.equal(M.goalForDay(s,M.localDay(d)),1800);assert.equal(M.growth(s,p.id),1);
  drinkOn(s,start,1,1500);assert.equal(M.growth(s,p.id),1.5);
});
test('deleting an active plant log recalculates its growth',()=>{
  const {s,p,start}=fixture();drinkOn(s,start,0);drinkOn(s,start,1);assert.equal(M.level(s,p.id),2);
  s.logs.pop();assert.equal(M.level(s,p.id),1);
});
test('backdated entries before planting count toward reports but not growth',()=>{
  const s=M.initialState();const p=M.plantSeed(s,'cacto');const d=new Date();d.setDate(d.getDate()-1);
  const log=M.recordWater(s,240,d);assert.equal(log.plantId,null);assert.equal(M.growth(s,p.id),0);
  assert.equal(M.totalForDay(s,M.localDay(d)),240);
});
test('invalid and future intake cannot be recorded',()=>{
  const s=M.initialState();for(const ml of [0,-1,1.5,NaN,Infinity,3001])assert.throws(()=>M.recordWater(s,ml));
  assert.throws(()=>M.recordWater(s,240,new Date(Date.now()+3600000)));assert.equal(s.logs.length,0);
});
test('backup roundtrip preserves custom species, profile, cups, plants and records',()=>{
  const {s,start}=fixture();s.settings.profile={weight:63.5,factor:30,activity:'moderada'};
  s.species.push({id:'custom',name:'Flor & Lua',shape:'flower',color:'#123456',accent:'#abcdef'});
  s.cups.push({id:'x',name:'Meu copo',ml:333});drinkOn(s,start,0,240);
  const restored=M.parseBackup(M.exportBackup(s));delete restored.exportedAt;assert.deepEqual(restored,s);
});
test('malformed, foreign, unsupported or oversized backups are rejected',()=>{
  for(const value of ['{','null','{}',JSON.stringify({...M.initialState(),version:99}),JSON.stringify({...M.initialState(),app:'other'})])assert.throws(()=>M.parseBackup(value));
  assert.throws(()=>M.parseBackup(' '.repeat(10*1024*1024+1)),/10 MB/);
});
test('duplicate records and dangling plant references are rejected',()=>{
  const {s,start}=fixture();drinkOn(s,start,0,240);s.logs.push({...s.logs[0]});assert.throws(()=>M.validateState(s));
  s.logs.pop();s.logs[0].plantId='missing';assert.throws(()=>M.validateState(s));
});
test('corrupt cup, species, active plant and profile fields are rejected',()=>{
  const variants=[s=>s.cups[0].ml=-1,s=>s.settings.defaultCup='missing',s=>s.settings.profile.weight='oops',s=>s.species.push({id:'x',name:'x',shape:'script',color:'red',accent:'url()'}),s=>s.activeId='missing'];
  for(const edit of variants){const s=M.initialState();edit(s);assert.throws(()=>M.validateState(s));}
});
test('calendar reports contain zero days and respect local calendar boundaries',()=>{
  const s=M.initialState(),end=new Date(2026,0,2,12),days=M.report(s,7,end);
  assert.equal(days[0].day,'2025-12-27');assert.equal(days.at(-1).day,'2026-01-02');assert.equal(days.length,7);assert.equal(days.reduce((a,d)=>a+d.ml,0),0);
});
test('SVG labels escape imported text instead of inserting markup',async()=>{
  const {plantArt}=await import('../dist/art.js');const svg=plantArt({name:'"><script>alert(1)</script>',shape:'leaf',color:'#123456',accent:'#abcdef'});
  assert.ok(!svg.includes('<script>'));assert.ok(svg.includes('&lt;script&gt;'));
});
