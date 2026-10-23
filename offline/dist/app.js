import * as M from './model.js';
import * as DB from './storage.js';
import { icon, esc, plantArt, landscape } from './art.js';
import { syncMotion, celebrateWater } from './motion.js';

const $ = s => document.querySelector(s);
let state, page = 'today', period = 7, historyDay = M.localDay(), busy = false, pendingImport, selectedSpecies = 'trevo', toastTimer;
let offlineReady = false;
const channel = 'BroadcastChannel' in window ? new BroadcastChannel('brota-changes') : null;
const number = n => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(n);
const volume = n => n >= 1000 ? `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(n / 1000)} L` : `${number(n)} ml`;
const shortDate = day => new Date(`${day}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
const labelFor = id => M.allSpecies(state).find(p => p.id === id);
const action = (name, text, cls = 'button', extra = '') => `<button class="${cls}" data-action="${name}" ${extra}>${text}</button>`;
const option = (value, current, label = value) => `<option value="${esc(value)}" ${current === value ? 'selected' : ''}>${esc(label)}</option>`;
function notify(message) {
  $('#toast').textContent = message; $('#toast').classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 4500);
}
async function mutate(fn, message) {
  if (busy) return;
  busy = true;
  document.body.classList.add('saving');
  try { state = await DB.change(fn); channel?.postMessage('changed'); render(); if (message) notify(message); return true; }
  catch (error) { notify(`Não foi salvo. ${error.message}`); return false; }
  finally { busy = false; document.body.classList.remove('saving'); }
}
function modal(title, body, cls = '') {
  const dialog = $('#modal');
  dialog.className = cls;
  dialog.innerHTML = `<header class="modal-head"><h2 id="modal-title">${title}</h2>${action('close', icon('close'), 'icon-button', 'aria-label="Fechar"')}</header>${body}`;
  if (!dialog.open) dialog.showModal();
  syncMotion();
}
function close() { $('#modal').close(); }
function render() {
  const tabs = [['today', 'drop', 'Hoje'], ['garden', 'garden', 'Jardim'], ['reports', 'chart', 'Relatórios'], ['settings', 'settings', 'Ajustes']];
  $('#app').innerHTML = `<div class="app-shell"><header class="topbar"><a class="brand" href="#today" aria-label="Brota, início">${icon('leaf')}brota<span>.</span></a><span class="offline-badge"><i></i>${offlineReady ? 'Pronto para offline' : 'Só neste aparelho'}</span></header><main id="main">${({ today: today, garden, reports, settings })[page]()}</main><nav class="bottom-nav" aria-label="Navegação principal">${tabs.map(([key, symbol, name]) => `<button data-page="${key}" class="${page === key ? 'active' : ''}" ${page === key ? 'aria-current="page"' : ''}>${icon(symbol)}<span>${name}</span></button>`).join('')}</nav><p class="local-note">Feito para florescer no seu ritmo.</p></div>`;
  syncMotion({ enabled: state.settings.motionEnabled !== false });
}
function today() {
  const day = M.localDay(), total = M.totalForDay(state, day), goal = M.goalForDay(state, day), percent = Math.round(total / goal * 100);
  const p = M.activePlant(state), species = p ? labelFor(p.speciesId) : M.SPECIES[0], lv = p ? M.level(state, p.id) : 1;
  const units = p ? M.growth(state, p.id) : 0;
  const fraction = lv === 4 ? 100 : (units - M.STAGES[lv - 1]) / (M.STAGES[lv] - M.STAGES[lv - 1]) * 100;
  const cup = state.cups.find(c => c.id === state.settings.defaultCup);
  return `<section class="intro"><div><p class="eyebrow">UM GOLE, UMA FOLHA</p><h1>Seu pequeno ritual<span>.</span></h1><p>Cuide de você. Veja seu jardim crescer.</p></div><span class="date-badge">${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</span></section>
    <section class="hydration" aria-label="Consumo de água de hoje"><div class="water-icon">${icon('drop')}</div><div class="hydration-copy"><div class="between"><span>Água de hoje</span>${action('goal', `${icon('edit')} Meta`, 'text-button')}</div><div class="water-total">${volume(total)} <small>/ ${volume(goal)}</small><span class="percent">${percent}%</span></div><div class="progress" role="progressbar" aria-label="Meta diária" aria-valuenow="${Math.min(percent, 100)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${Math.min(percent, 100)}%"></span></div></div></section>
    <section class="plant-scene ${p?.scene === 'noite' ? 'night' : ''}" aria-label="Sua planta atual">${landscape(p?.scene, p?.decor)}<div class="scene-top"><span class="scene-label">${p ? 'SEU CANTINHO' : 'UM NOVO COMEÇO'}</span>${p ? action('customize', `${icon('settings')} Personalizar`, 'scene-button') : ''}</div><div class="character ${p ? '' : 'waiting'}">${plantArt(species, lv, p?.pot)}</div><div class="plant-caption"><span class="level-badge">${icon('leaf')} Nível ${lv}</span><h2>${esc(p?.name ?? 'Seu primeiro broto')}</h2><p>${!p ? 'Qual vai ser sua primeira companhia?' : lv === 4 ? 'Prontinha para morar no seu jardim.' : ['Uma pequena semente, um grande começo.', 'Olha só quem está criando folhas!', 'Falta pouco para florescer.'][lv - 1]}</p></div></section>
    <div class="growth-strip"><div class="growth-levels" aria-label="Evolução da planta">${[1, 2, 3, 4].map(n => `<span class="${n <= lv && p ? 'reached' : ''}">${n === 4 ? icon('sparkle') : n}</span>`).join('<i></i>')}</div>${p ? `<div class="mini-progress"><span style="width:${fraction}%"></span></div><p>${lv === 4 ? 'Nível máximo. Uma nova história pode começar.' : `${units.toFixed(1).replace('.', ',')} de ${M.STAGES[lv]} metas para o próximo nível`}</p>` : '<p>Quatro fases. Um hábito que floresce.</p>'}${!p ? action('nursery', `Escolher minha planta ${icon('arrow')}`, 'button primary') : lv === 4 ? action('archive', `Levar para o jardim ${icon('garden')}`, 'button primary') : ''}</div>
    <section class="drink-card"><div class="section-title"><h2>Uma pausa para água?</h2>${action('drink-form', `${icon('plus')} Outro volume`, 'text-button')}</div><div class="cups" role="group" aria-label="Recipiente">${state.cups.map(c => action('cup', `${icon('cup')}<span>${esc(c.name)}<small>${volume(c.ml)}</small></span>`, `cup ${cup.id === c.id ? 'selected' : ''}`, `data-id="${esc(c.id)}" aria-pressed="${cup.id === c.id}"`)).join('')}</div>${action('drink', `${icon('drop')} ${p ? 'Beber e regar' : 'Registrar água'} <span>${volume(cup.ml)}</span>`, 'button primary drink-button')}<p class="gentle">${percent >= 100 ? 'Meta registrada. Seu broto já recebeu todo o crescimento de hoje.' : 'Cada registro é um carinho em você e no seu broto.'}</p></section>
    <section class="recent"><div class="section-title"><h2>Seus goles de hoje</h2>${action('history', 'Ver histórico '+icon('arrow'), 'text-button')}</div>${logList(day, 3)}</section>`;
}
function logList(day, limit = Infinity) {
  const logs = state.logs.filter(l => l.day === day).sort((a,b) => b.at.localeCompare(a.at));
  return logs.length ? `<ul class="log-list">${logs.slice(0, limit).map(l => `<li><span class="log-drop">${icon('drop')}</span><div><strong>${volume(l.ml)}</strong><small>${new Date(l.at).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}${l.plantId ? ' · '+esc(state.plants.find(p => p.id === l.plantId)?.name ?? '') : ''}</small></div>${action('delete-log', icon('undo'), 'icon-button', `data-id="${esc(l.id)}" aria-label="Excluir registro de ${l.ml} ml"`)}</li>`).join('')}</ul>` : '<div class="empty-inline">Nenhum gole registrado por aqui ainda.</div>';
}
function garden() {
  const collection = state.plants.filter(p => p.gardenAt).sort((a,b) => b.gardenAt.localeCompare(a.gardenAt));
  return `<section class="intro"><p class="eyebrow">PEQUENOS CUIDADOS, GRANDES RAÍZES</p><h1>Seu jardim<span>.</span></h1><p>Cada planta guarda um pedacinho da sua história.</p></section><div class="garden-banner">${icon('garden')}<strong>${collection.length}</strong><span>${collection.length === 1 ? 'planta floresceu com você' : 'plantas floresceram com você'}</span></div>${!collection.length ? `<div class="empty-garden">${plantArt(M.SPECIES[1], 4, 'creme')}<h2>Este cantinho vai florescer.</h2><p>Leve sua primeira planta ao nível 4 e traga-a para cá. Depois, escolha uma nova companhia.</p>${action('go-today', 'Cuidar da minha planta '+icon('arrow'), 'button primary')}</div>` : `<div class="garden-grid">${collection.map(p => `<button class="garden-plant" data-action="garden-detail" data-id="${esc(p.id)}"><div class="garden-thumb">${landscape(p.scene, p.decor)}${plantArt(labelFor(p.speciesId), 4, p.pot)}</div><strong>${esc(p.name)}</strong><small>Floresceu em ${shortDate(M.localDay(new Date(p.gardenAt)))}</small></button>`).join('')}</div>`}<div class="note-card">${icon('leaf')}<p>Sem pressa e sem plantas perdidas. Seu jardim acompanha o seu ritmo.</p></div>`;
}
function reports() {
  const days = M.report(state, period), total = days.reduce((a,d) => a + d.ml, 0), completed = days.filter(d => d.ml >= d.goal).length;
  const max = Math.max(...days.map(d => Math.max(d.ml, d.goal)), 1) * 1.1;
  return `<section class="intro"><p class="eyebrow">OLHE O QUANTO VOCÊ JÁ CULTIVOU</p><h1>Gole por gole<span>.</span></h1><p>Um registro do seu cuidado, sem cobranças.</p></section><div class="segmented">${[7,30].map(n => action('period', `${n} dias`, period === n ? 'selected' : '', `data-days="${n}" aria-pressed="${period===n}"`)).join('')}</div><div class="stats-grid"><div class="stat aqua"><span>${icon('drop')} Água registrada</span><strong>${volume(total)}</strong><small>nos últimos ${period} dias</small></div><div class="stat sage"><span>${icon('leaf')} Metas alcançadas</span><strong>${completed}<small> / ${period}</small></strong><small>cada dia conta uma história</small></div></div><section class="panel"><div class="section-title"><h2>Seu ritmo</h2><span class="legend"><i></i>consumo · linha: meta</span></div><div class="bar-chart ${period===30?'monthly':''}" role="group" aria-label="Consumo diário nos últimos ${period} dias">${days.map(d => `<button data-action="report-day" data-day="${d.day}" class="chart-col ${d.day===M.localDay()?'current':''}" aria-label="${d.day}: ${d.ml} ml, meta ${d.goal} ml"><div class="bar-track"><i class="goal-line" style="bottom:${d.goal/max*100}%"></i><span style="height:${d.ml/max*100}%" class="${d.ml>=d.goal?'complete':''}"></span></div><small>${period===7?new Date(d.day+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'short'}).replace('.',''):d.day.slice(-2)}</small></button>`).join('')}</div><p class="muted">Toque em um dia para ver os registros.</p></section><div class="report-detail"><div class="section-title"><h2>${shortDate(historyDay)}</h2><strong>${volume(M.totalForDay(state,historyDay))}</strong></div>${logList(historyDay)}</div><div class="note-card">${icon('sparkle')}<p>Média de ${volume(Math.round(total/period))} por dia neste período, incluindo dias sem registros.</p></div>${action('history', 'Abrir histórico completo '+icon('arrow'), 'button secondary full')}`;
}
function settings() {
  return `<section class="intro"><p class="eyebrow">DO SEU JEITO</p><h1>Seu cuidado, suas escolhas<span>.</span></h1><p>Um cantinho que combina com você.</p></section><div class="settings-list"><button data-action="goal">${icon('drop')}<span><strong>Meta e perfil</strong><small>${volume(state.settings.goal)} por dia · ajuste quando precisar</small></span>${icon('arrow')}</button><button data-action="cups">${icon('cup')}<span><strong>Meus recipientes</strong><small>Copos, garrafas e volumes favoritos</small></span>${icon('arrow')}</button><button data-action="nursery">${icon('leaf')}<span><strong>Viveiro de plantas</strong><small>${M.allSpecies(state).length} espécies · crie novas companhias</small></span>${icon('arrow')}</button><button data-action="motion" aria-pressed="${state.settings.motionEnabled !== false}">${icon('sparkle')}<span><strong>Animações suaves</strong><small>${state.settings.motionEnabled !== false ? 'Ativadas · toque para pausar' : 'Pausadas · toque para ativar'}</small></span>${icon(state.settings.motionEnabled !== false ? 'check' : 'plus')}</button><button data-action="backup">${icon('download')}<span><strong>Backup dos meus dados</strong><small>Exportar, importar e recuperar</small></span>${icon('arrow')}</button><button data-action="install">${icon('plus')}<span><strong>Instalar no iPhone</strong><small>Seu jardim sempre por perto</small></span>${icon('arrow')}</button></div><section class="privacy-card">${icon('leaf')}<h2>O seu jardim é só seu.</h2><p>Seu perfil, suas plantas e seus registros ficam neste navegador, neste aparelho. Sem conta, anúncios ou envio de dados.</p><p>Exporte um backup de vez em quando. Limpar os dados do navegador ou remover o app pode apagar o jardim.</p></section><p class="about">Brota · versão 0.1<br>Um jogo de hidratação independente, inspirado no hábito de cuidar.<br>Sem vínculo com o aplicativo Plant Nanny.</p>`;
}
function nursery() {
  const active = M.activePlant(state);
  modal('Um novo broto', `<p class="modal-intro">${active ? 'Conheça as companhias do seu jardim. Termine de cuidar da planta atual para começar outra.' : 'Escolha quem vai crescer com você. Cada espécie tem quatro fases.'}</p><div class="species-grid">${M.allSpecies(state).map(s => `<button data-action="species" data-id="${esc(s.id)}" class="species-tile">${plantArt(s, 3, 'creme', {small:true})}<strong>${esc(s.name)}</strong><span>Ver as 4 fases ${icon('arrow')}</span></button>`).join('')}</div>${action('new-species', `${icon('plus')} Criar uma nova espécie`, 'button secondary full')}`, 'wide');
}
function speciesDetail(speciesId) {
  selectedSpecies = speciesId; const s = labelFor(speciesId), active = M.activePlant(state);
  modal(esc(s.name), `<div class="evolutions">${[1,2,3,4].map(n => `<div>${plantArt(s,n,'creme',{small:true})}<strong>Nível ${n}</strong><small>${M.STAGES[n-1]} metas</small></div>`).join('')}</div><p class="modal-intro">O crescimento soma seus registros ao longo dos dias. No máximo uma meta por dia conta para evoluir.</p>${active ? `<p class="notice">Você está cuidando de ${esc(active.name)}. Leve-a ao nível 4 e ao jardim para plantar outra.</p>` : `<form id="seed-form"><label>Como vamos chamar sua planta?<input name="name" maxlength="40" value="${esc(s.name)}" required></label><button class="button primary full" type="submit">Plantar e começar ${icon('leaf')}</button></form>`}${action('nursery','Voltar ao viveiro','text-button full')}`, 'wide');
}
function customize() {
  const p = M.activePlant(state); if (!p) return nursery();
  modal('Seu cantinho, do seu jeito', `<div class="custom-preview" id="custom-preview">${landscape(p.scene,p.decor)}${plantArt(labelFor(p.speciesId),M.level(state,p.id),p.pot)}</div><form id="custom-form"><label>Nome da planta<input name="name" value="${esc(p.name)}" maxlength="40" required></label><fieldset><legend>Vasinho</legend><div class="swatches">${M.POTS.map((v,i) => `<label class="swatch"><input type="radio" name="pot" value="${v}" ${p.pot===v?'checked':''}><span class="pot-swatch ${v}"></span>${['Barro','Creme','Rosé','Azul'][i]}</label>`).join('')}</div></fieldset><div class="form-row"><label>Cenário<select name="scene">${M.SCENES.map((v,i)=>option(v,p.scene,['Amanhecer','À beira do lago','Noite tranquila'][i])).join('')}</select></label><label>Decoração<select name="decor">${M.DECOR.map((v,i)=>option(v,p.decor,['Sem decoração','Pedrinhas','Cogumelos','Estrelinhas'][i])).join('')}</select></label></div><button class="button primary full" type="submit">Salvar meu cantinho ${icon('check')}</button></form>`);
}
function goalForm() {
  const profile = state.settings.profile, todayGoal = M.goalForDay(state,M.localDay());
  modal('Uma meta que cabe em você', `<p class="modal-intro">Defina uma meta pessoal ou informe um cálculo orientado por um profissional. Você pode ajustar quando precisar.</p><form id="goal-form"><label>Meta diária de água (ml)<input type="number" name="goal" min="100" max="10000" step="1" value="${state.settings.goal}" required></label><fieldset><legend>Meu perfil · opcional</legend><div class="form-row"><label>Peso (kg)<input type="number" name="weight" min="20" max="350" step="0.1" value="${profile.weight}"></label><label>Fator orientado (ml/kg)<input type="number" name="factor" min="1" max="100" step="0.1" placeholder="Se tiver orientação" value="${profile.factor}"></label></div><label>Minha rotina<select name="activity">${['leve','moderada','intensa'].map(v=>option(v,profile.activity)).join('')}</select></label><p class="muted">O fator deve vir da sua orientação de saúde. O app faz peso × fator; a rotina é uma anotação e não altera a conta.</p>${action('calculate-goal','Calcular com os dados acima','button secondary full')}</fieldset><p class="notice">A meta é uma referência pessoal, não uma prescrição. Se houver restrição de líquidos, siga sua orientação de saúde.</p>${Object.hasOwn(state.dayGoals,M.localDay())?`<p class="muted">A meta de hoje continua em ${volume(todayGoal)} para preservar seus registros. A nova meta vale a partir do próximo dia.</p>`:''}<button class="button primary full" type="submit">Salvar minha meta ${icon('check')}</button></form>`);
}
function cupsForm() {
  modal('Meus recipientes', `<div class="cup-list">${state.cups.map(c=>`<div>${icon('cup')}<span><strong>${esc(c.name)}</strong><small>${volume(c.ml)}${c.id===state.settings.defaultCup?' · padrão':''}</small></span>${action('edit-cup',icon('edit'),'icon-button',`data-id="${esc(c.id)}" aria-label="Editar ${esc(c.name)}"`)}${state.cups.length>1?action('delete-cup',icon('close'),'icon-button',`data-id="${esc(c.id)}" aria-label="Remover ${esc(c.name)}"`):''}</div>`).join('')}</div>${action('add-cup',`${icon('plus')} Adicionar recipiente`,'button secondary full')}`);
}
function editCup(cupId) {
  const c = state.cups.find(c=>c.id===cupId);
  modal(c?'Editar recipiente':'Um novo recipiente',`<form id="cup-form" data-id="${esc(c?.id??'')}"><label>Nome<input name="name" maxlength="40" value="${esc(c?.name??'')}" placeholder="Minha garrafa" required></label><label>Volume em ml<input name="ml" type="number" min="1" max="3000" step="1" value="${c?.ml??240}" required></label><button class="button primary full" type="submit">Salvar recipiente ${icon('check')}</button></form>`);
}
function drinkForm() {
  const date = new Date(); date.setMinutes(date.getMinutes()-date.getTimezoneOffset());
  modal('Registrar um gole',`<form id="drink-form"><label>Quanto você bebeu? (ml)<input name="ml" type="number" min="1" max="3000" step="1" value="${state.cups.find(c=>c.id===state.settings.defaultCup).ml}" required></label><label>Quando?<input name="at" type="datetime-local" value="${date.toISOString().slice(0,16)}" max="${date.toISOString().slice(0,16)}" required></label><p class="muted">Registros anteriores ao início da planta entram no histórico, sem gerar crescimento retroativo.</p><button class="button primary full" type="submit">Registrar ${icon('drop')}</button></form>`);
}
function history() {
  modal('Gole por gole',`<label>Escolha o dia<input id="history-date" type="date" value="${historyDay}" max="${M.localDay()}"></label><div id="history-records"><div class="history-total">${volume(M.totalForDay(state,historyDay))}<small> registrados neste dia</small></div>${logList(historyDay)}</div>${action('drink-form',`${icon('plus')} Registrar consumo`,'button secondary full')}`);
}
function newSpecies() {
  modal('Crie uma nova companhia',`<p class="modal-intro">Escolha a forma e as cores. Seu personagem terá quatro evoluções desenhadas a partir dessas escolhas.</p><form id="species-form"><label>Nome da espécie<input name="name" maxlength="40" placeholder="Ex.: Flor de outono" required></label><label>Família<select name="shape">${[['leaf','Broto de folhas'],['flower','Flor'],['cactus','Cacto'],['tree','Árvore'],['berry','Frutinha']].map(([v,n])=>option(v,'leaf',n)).join('')}</select></label><div class="form-row"><label>Cor das folhas<input name="color" type="color" value="#78a880"></label><label>Cor de destaque<input name="accent" type="color" value="#e6b67a"></label></div><div id="species-preview" class="evolutions">${[1,2,3,4].map(n=>`<div>${plantArt({name:'Nova espécie',shape:'leaf',color:'#78a880',accent:'#e6b67a'},n,'creme',{small:true})}<small>Nível ${n}</small></div>`).join('')}</div><button class="button primary full" type="submit">Adicionar ao viveiro ${icon('plus')}</button></form>`, 'wide');
}
async function backup() {
  const previous = await DB.read('before-import');
  modal('Seu jardim, bem guardado',`<p class="modal-intro">Leve tudo com você: plantas, espécies criadas, personalizações, perfil, recipientes e histórico.</p><div class="backup-summary"><strong>${state.plants.length}</strong> plantas <strong>${state.logs.length}</strong> registros</div>${action('export',`${icon('download')} Exportar backup em JSON`,'button primary full')}<label class="button secondary full file-button">${icon('upload')} Importar um backup<input type="file" id="import-file" accept=".json,application/json"></label><p class="muted">No iPhone, exporte e escolha “Salvar em Arquivos”. Guarde a cópia em um lugar seu: ela também contém os dados do perfil.</p>${previous?action('restore-import',`${icon('undo')} Desfazer a última importação`,'button secondary full'):''}<div class="notice">A importação substitui os dados deste aparelho. Você verá um resumo antes de confirmar, e guardaremos a versão anterior para recuperação.</div>`);
}
async function exportFile() {
  const file = new File([M.exportBackup(state)],`brota-backup-${M.localDay()}.json`,{type:'application/json'});
  if (navigator.canShare?.({files:[file]})) {
    try { await navigator.share({files:[file],title:'Backup do meu jardim Brota'}); notify('Backup entregue ao compartilhamento. Salve uma cópia em Arquivos.'); return; }
    catch(e) { if(e.name==='AbortError') return; }
  }
  const url = URL.createObjectURL(file), a=document.createElement('a');
  a.href=url; a.download=file.name; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),60000); notify('Backup preparado para download.');
}
function install() {
  modal('Seu jardim na Tela de Início',`<div class="install-icon"><img src="./icon-192.png" alt="Ícone do Brota"></div><ol class="install-steps"><li>Abra o endereço do Brota no <strong>Safari do iPhone</strong>, com internet.</li><li>Toque em <strong>Compartilhar</strong> e em <strong>Adicionar à Tela de Início</strong>. Se aparecer, ative “Abrir como App da Web”.</li><li>Abra pelo novo ícone e espere aparecer <strong>“Pronto para offline”</strong>.</li><li>Ative o modo avião e reabra para conferir.</li></ol><p class="notice">A instalação precisa de um endereço HTTPS. Um link localhost do computador não abre no iPhone. Depois que o app estiver preparado, os registros e o jogo funcionam sem internet.</p><p class="muted">Use sempre o mesmo endereço e exporte um backup antes de mudar de navegador ou aparelho.</p><a class="text-button" href="https://support.apple.com/pt-br/guide/iphone/iphea86e5236/ios" target="_blank" rel="noopener">Instruções da Apple ${icon('arrow')}</a>`);
}
const handlers = {
  close, nursery, customize, goal:goalForm, cups:cupsForm, 'add-cup':()=>editCup(), 'new-species':newSpecies, 'drink-form':drinkForm, history, backup, export:exportFile, install,
  'go-today':()=>{ page='today';render(); },
  species:el=>speciesDetail(el.dataset.id),
  cup:el=>mutate(s=>{s.settings.defaultCup=el.dataset.id;}),
  motion:()=>mutate(s=>{s.settings.motionEnabled=s.settings.motionEnabled===false;}),
  drink:async()=>{
    const p=M.activePlant(state), before=p?M.level(state,p.id):0;
    if(!await mutate(s=>M.recordWater(s,s.cups.find(c=>c.id===s.settings.defaultCup).ml), 'Gole registrado. Um carinho em você!'))return;
    celebrateWater();
    if(p && M.level(state,p.id)>before) notify(`Que alegria! ${p.name} chegou ao nível ${M.level(state,p.id)}!`);
  },
  archive:async()=>{if(!await mutate(M.archivePlant,'Uma nova moradora no seu jardim!'))return; page='garden';render();window.scrollTo({top:0});},
  period:el=>{period=Number(el.dataset.days);render();},
  'report-day':el=>{historyDay=el.dataset.day;render();},
  'edit-cup':el=>editCup(el.dataset.id),
  'delete-cup':async el=>{await mutate(s=>{if(s.cups.length<2)throw Error('Mantenha pelo menos um recipiente.');s.cups=s.cups.filter(c=>c.id!==el.dataset.id);if(s.settings.defaultCup===el.dataset.id)s.settings.defaultCup=s.cups[0].id;});cupsForm();},
  'delete-log':el=>{
    const log=state.logs.find(l=>l.id===el.dataset.id); if(!log)return;
    modal('Remover este registro?',`<p class="modal-intro">${volume(log.ml)} em ${shortDate(log.day)}, às ${new Date(log.at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}.</p><p class="muted">O consumo e o crescimento da planta atual serão recalculados. Plantas já conquistadas no jardim ficam preservadas.</p>${action('confirm-delete','Remover registro','button primary full',`data-id="${esc(log.id)}"`)}${action('close','Manter registro','button secondary full')}`);
  },
  'confirm-delete':async el=>{if(!await mutate(s=>{s.logs=s.logs.filter(l=>l.id!==el.dataset.id);},'Registro removido.'))return;close();},
  'garden-detail':el=>{
    const p=state.plants.find(p=>p.id===el.dataset.id); if(!p)return;
    modal(esc(p.name),`<div class="custom-preview">${landscape(p.scene,p.decor)}${plantArt(labelFor(p.speciesId),4,p.pot)}</div><p class="modal-intro">${esc(labelFor(p.speciesId).name)} · nível 4<br>Plantada em ${shortDate(M.localDay(new Date(p.createdAt)))}<br>Chegou ao jardim em ${shortDate(M.localDay(new Date(p.gardenAt)))}</p>`);
  },
  'calculate-goal':()=>{
    const form=$('#goal-form'), weight=Number(form.elements.weight.value), factor=Number(form.elements.factor.value);
    if(!weight||!factor||weight<20||weight>350||factor<1||factor>100) return notify('Preencha um peso válido e o fator da sua orientação de saúde.');
    const goal=Math.round(weight*factor); if(goal<100||goal>10000)return notify('Confira o cálculo e a orientação. A meta deve estar entre 100 e 10.000 ml.');
    form.elements.goal.value=goal;notify(`Cálculo: ${weight} kg × ${factor} ml/kg = ${volume(goal)}. Confira antes de salvar.`);
  },
  'confirm-import':async()=>{
    if(!pendingImport||busy)return;busy=true;
    try{state=await DB.replace(pendingImport);pendingImport=undefined;channel?.postMessage('changed');close();render();notify('Backup importado. Sua versão anterior ficou guardada.');}
    catch(e){notify(`Importação não concluída. ${e.message}`);}finally{busy=false;}
  },
  'restore-import':async()=>{
    const previous=await DB.read('before-import');if(!previous)return;pendingImport=M.validateState(previous);
    modal('Recuperar o jardim anterior?',`<p class="modal-intro">Restaurar ${previous.plants.length} plantas e ${previous.logs.length} registros da versão anterior à última importação? O jardim atual ficará como cópia de recuperação.</p>${action('confirm-import','Restaurar cópia anterior','button primary full')}${action('close','Cancelar','button secondary full')}`);
  }
};
document.addEventListener('click',async event=>{
  const tab=event.target.closest('[data-page]');
  if(tab){page=tab.dataset.page;render();window.scrollTo({top:0});return;}
  const el=event.target.closest('[data-action]');if(!el)return;
  try{await handlers[el.dataset.action]?.(el);}catch(error){notify(error.message);}
});
document.addEventListener('submit',async event=>{
  event.preventDefault();const form=event.target, f=new FormData(form);
  try{
    if(form.id==='seed-form'){if (!await mutate(s=>M.plantSeed(s,selectedSpecies,f.get('name')),'Seu novo broto chegou!')) return;close();page='today';render();}
    if(form.id==='custom-form'){if (!await mutate(s=>{const p=M.activePlant(s);if(!p)throw Error('Não há planta ativa.');Object.assign(p,{name:f.get('name').trim(),pot:f.get('pot'),scene:f.get('scene'),decor:f.get('decor')});},'Seu cantinho foi salvo.')) return;close();}
    if(form.id==='goal-form'){if (!await mutate(s=>{s.settings.goal=Number(f.get('goal'));s.settings.profile={weight:f.get('weight')===''?'':Number(f.get('weight')),factor:f.get('factor')===''?'':Number(f.get('factor')),activity:f.get('activity')};},'Meta e perfil salvos neste aparelho.')) return;close();}
    if(form.id==='cup-form'){if (!await mutate(s=>{const c=s.cups.find(c=>c.id===form.dataset.id);const values={name:f.get('name').trim(),ml:Number(f.get('ml'))};if(c)Object.assign(c,values);else{if(s.cups.length>=30)throw Error('Limite de 30 recipientes.');s.cups.push({id:M.id(),...values});}},'Recipiente salvo.')) return;cupsForm();}
    if(form.id==='drink-form'){const at=new Date(f.get('at'));if (!await mutate(s=>M.recordWater(s,Number(f.get('ml')),at),'Consumo registrado.')) return;close();}
    if(form.id==='species-form'){if (!await mutate(s=>{if(s.species.length>=100)throw Error('Limite de 100 espécies próprias.');s.species.push({id:M.id(),name:f.get('name').trim(),shape:f.get('shape'),color:f.get('color'),accent:f.get('accent')});},'Nova espécie no viveiro, com quatro fases!')) return;nursery();}
  }catch(error){notify(error.message);}
});
document.addEventListener('change',async event=>{
  const el=event.target;
  if(el.id==='history-date') {historyDay=el.value;history();}
  if(el.closest('#custom-form')) {
    const f=new FormData($('#custom-form')), p=M.activePlant(state);
    $('#custom-preview').innerHTML=landscape(f.get('scene'),f.get('decor'))+plantArt(labelFor(p.speciesId),M.level(state,p.id),f.get('pot'));
  }
  if(el.closest('#species-form')) {
    const f=new FormData($('#species-form')), s={name:f.get('name')||'Nova espécie',shape:f.get('shape'),color:f.get('color'),accent:f.get('accent')};
    $('#species-preview').innerHTML=[1,2,3,4].map(n=>`<div>${plantArt(s,n,'creme',{small:true})}<small>Nível ${n}</small></div>`).join('');
  }
  if(el.id==='import-file'&&el.files[0]){
    const file=el.files[0];try{
      if(file.size>10*1024*1024)throw Error('O backup deve ter até 10 MB.');
      pendingImport=M.parseBackup(await file.text());
      modal('Conferir antes de importar',`<p class="modal-intro">${esc(file.name)}</p><div class="backup-summary"><strong>${pendingImport.plants.length}</strong> plantas <strong>${pendingImport.logs.length}</strong> registros</div><p>Também inclui ${pendingImport.species.length} espécies próprias e ${pendingImport.cups.length} recipientes.</p><p class="notice">Este arquivo substituirá seu jardim atual (${state.plants.length} plantas, ${state.logs.length} registros). A versão atual ficará guardada para recuperação.</p>${action('confirm-import','Importar e substituir','button primary full')}${action('close','Cancelar','button secondary full')}`);
    }catch(error){pendingImport=undefined;notify(error.message);}finally{el.value='';}
  }
});
document.addEventListener('visibilitychange',async()=>{if(!document.hidden&&state){try{state=await DB.load();render();}catch(e){notify(e.message);}}});
channel?.addEventListener('message',async()=>{try{state=await DB.load();render();}catch(e){notify(e.message);}});
window.addEventListener('hashchange',()=>{if(location.hash==='#today'){page='today';render();}});
// Recalculate the displayed day after midnight even if the app stays open.
setInterval(()=>{if(state&&!document.hidden&&M.localDay()!==$('#app').dataset.day){$('#app').dataset.day=M.localDay();render();}},30000);
try {
  await DB.openStorage();state=await DB.load();$('#app').dataset.day=M.localDay();render();
  if('serviceWorker' in navigator && window.isSecureContext){
    navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{offlineReady=true;render();}).catch(()=>notify('Não foi possível preparar o modo offline. Abra por HTTPS e tente novamente.'));
  }
  navigator.storage?.persist?.().catch(()=>{});
} catch(error){
  $('#app').innerHTML=`<main class="loading"><h1>Não conseguimos abrir seu jardim.</h1><p>${esc(error.message)}</p><p>Confira se o armazenamento do navegador está disponível. Se já usava o Brota, preserve os dados deste navegador e seu último backup.</p><button class="button primary" data-action="reload">Tentar novamente</button></main>`;
  handlers.reload=()=>location.reload();
}
