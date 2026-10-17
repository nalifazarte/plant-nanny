import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../dist/sw.js',import.meta.url),'utf8');
function worker() {
  const handlers={},cached=new Map(),deleted=[],added=[];let claimed=false,fetches=0;
  const context={
    URL,
    self:{location:{origin:'https://garden.example'},clients:{claim:async()=>{claimed=true;}},addEventListener:(event,handler)=>handlers[event]=handler},
    caches:{open:async()=>({addAll:async paths=>{added.push(...paths);}}),keys:async()=>['brota-shell-obsolete','another-app-cache','brota-shell-v2'],delete:async name=>deleted.push(name),match:async(request)=>cached.get(typeof request==='string'?request:request.url)},
    fetch:async()=>{fetches++;throw Error('offline');}
  };
  vm.runInNewContext(source,context);
  return {handlers,cached,deleted,added,get claimed(){return claimed;},get fetches(){return fetches;}};
}
async function fetchEvent(w,request) {
  let response;w.handlers.fetch({request,respondWith:p=>response=p});return response;
}
test('all offline shell assets exist in the release without remote dependencies',async()=>{
  const w=worker();let install;w.handlers.install({waitUntil:p=>install=p});await install;
  assert.ok(w.added.includes('./app.js'));assert.ok(w.added.includes('./apple-touch-icon.png'));
  for(const path of w.added)await access(new URL('../dist/'+(path==='./'?'index.html':path),import.meta.url));
});
test('cached application files are served without contacting a server',async()=>{
  const w=worker();w.cached.set('https://garden.example/app.js','cached-script');
  assert.equal(await fetchEvent(w,{method:'GET',url:'https://garden.example/app.js'}),'cached-script');assert.equal(w.fetches,0);
});
test('offline navigation falls back to the cached app shell',async()=>{
  const w=worker();w.cached.set('./index.html','offline-home');
  assert.equal(await fetchEvent(w,{method:'GET',url:'https://garden.example/unknown',mode:'navigate'}),'offline-home');
});
test('the worker ignores non-GET requests and other origins',async()=>{
  const w=worker();assert.equal(await fetchEvent(w,{method:'POST',url:'https://garden.example/data'}),undefined);
  assert.equal(await fetchEvent(w,{method:'GET',url:'https://elsewhere.example/app.js'}),undefined);
});
test('activation preserves unrelated caches',async()=>{
  const w=worker();let activation;w.handlers.activate({waitUntil:p=>activation=p});await activation;
  assert.deepEqual(w.deleted,['brota-shell-obsolete']);assert.equal(w.claimed,true);
});
