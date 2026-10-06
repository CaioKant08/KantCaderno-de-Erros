const STORAGE_KEY = 'cadernoErrosENEM_v1';
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
let calendarCursor = new Date();
let activeTypeFilter = '';
let activeReviewFilter = 'due';
let activeContentArea = 'Matemática';
let activeContentTopicId = null;

const TYPE_LABELS = {
  conteudo:'Conteúdo', aplicacao:'Aplicação', interpretacao:'Interpretação', calculo:'Cálculo',
  estrategia:'Estratégia', desatencao:'Desatenção', chute:'Chute / dúvida'
};
const SUBJECTS = {
  'Ciências da Natureza':['Biologia','Física','Química'],
  'Ciências Humanas':['História','Geografia','Filosofia','Sociologia']
};
const CONTENT_AREAS = [
  {name:'Matemática', short:'Matemática'},
  {name:'Ciências da Natureza', short:'Natureza'},
  {name:'Linguagens', short:'Linguagens'},
  {name:'Redação', short:'Redação'},
  {name:'Ciências Humanas', short:'Humanas'}
];
const DEFAULT_CONTENT_TOPICS = {
  'Matemática':['Razão e proporção','Porcentagem e juros','Funções','Geometria plana','Geometria espacial','Estatística e probabilidade','Análise combinatória','Geometria analítica'],
  'Ciências da Natureza':['Eletroquímica','Estequiometria','Soluções','Química orgânica','Mecânica','Eletrodinâmica','Ondulatória','Termologia','Ecologia','Genética','Fisiologia','Citologia'],
  'Linguagens':['Interpretação de texto','Gêneros textuais','Funções da linguagem','Literatura','Gramática em contexto','Artes','Língua estrangeira'],
  'Redação':['Repertório','Argumentação','Competência 1','Competência 2','Competência 3','Competência 4','Competência 5','Proposta de intervenção'],
  'Ciências Humanas':['História do Brasil','História Geral','Geografia física','Geografia humana','Geopolítica','Filosofia','Sociologia']
};
function defaultContentFolders(){
  const now=Date.now();
  return Object.entries(DEFAULT_CONTENT_TOPICS).flatMap(([area,titles],ai)=>titles.map((title,i)=>({id:`seed-${ai}-${i}`,area,title,notes:[],createdAt:now+i})));
}
let data = loadData();

function loadData(){
  try{
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(parsed && Array.isArray(parsed.errors)) return normalizeData(parsed);
  }catch{}
  return {errors:[],contentFolders:defaultContentFolders()};
}
function normalizeData(obj){
  obj.errors = (obj.errors || []).map(e => ({
    reviews:[], createdDate: isoLocal(new Date(e.createdAt || Date.now())), createdAt:Date.now(), repeatCount:0,
    status:'novo', wouldMissTomorrow:true, ...e,
    subject: normalizedSubject(e)
  }));
  if(!Array.isArray(obj.contentFolders)) obj.contentFolders=defaultContentFolders();
  obj.contentFolders=obj.contentFolders.map(f=>({id:f.id||uid(),area:f.area||'Matemática',title:f.title||'Sem título',createdAt:f.createdAt||Date.now(),notes:(f.notes||[]).map(n=>({id:n.id||uid(),title:n.title||'',text:n.text||'',createdAt:n.createdAt||Date.now(),updatedAt:n.updatedAt||n.createdAt||Date.now()}))}));
  return obj;
}
function normalizedSubject(e){
  if(e.area === 'Matemática') return 'Matemática';
  if(e.area === 'Linguagens') return 'Linguagens';
  return e.subject || '';
}
function saveData(){ try{localStorage.setItem(STORAGE_KEY, JSON.stringify(data));}catch{} renderAll(); }
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
function parseLocal(s){ if(!s) return new Date(); const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
function isoLocal(d=new Date()){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function addDays(s,n){ const d=parseLocal(s); d.setDate(d.getDate()+n); return isoLocal(d); }
function fmtDate(s, long=false){ if(!s) return '—'; return parseLocal(s).toLocaleDateString('pt-BR', long?{day:'2-digit',month:'long',year:'numeric'}:{}); }
function esc(s=''){ return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function labelType(t){ return TYPE_LABELS[t] || t || 'Não informado'; }
function displaySubject(e){ return normalizedSubject(e) || e.area || '—'; }
function toast(msg){ const el=$('#toast'); el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),1800); }

function nextReview(error){
  if(error.status === 'dominado') return null;
  const reviews = error.reviews || [];
  const intervals = [1,7,14,21];
  const done = reviews.length;
  const interval = intervals[Math.min(done, intervals.length-1)];
  const base = done ? reviews[done-1].date : (error.createdDate || isoLocal(new Date()));
  return addDays(base, interval);
}
function isDue(e){ const d=nextReview(e); return d && d <= isoLocal(new Date()); }
function typeCounts(arr=data.errors){
  const counts={}; Object.keys(TYPE_LABELS).forEach(k=>counts[k]=0);
  arr.forEach(e=>{ if(e.errorType in counts) counts[e.errorType]++; }); return counts;
}
function areaMeta(e){ return e.area + ((e.area==='Ciências da Natureza'||e.area==='Ciências Humanas') && e.subject ? ` · ${e.subject}`:''); }

function renderAll(){ renderStats(); renderDue(); renderRecent(); renderTypeSnapshot(); renderTypeTabs(); renderErrors(); renderContents(); renderReviews(); renderHistory(); renderCalendar(); }
function renderStats(){
  const errors=data.errors;
  const dominated=errors.filter(e=>e.status==='dominado').length;
  const active=errors.length-dominated;
  const due=errors.filter(isDue).length;
  const mastery=errors.length?Math.round(dominated/errors.length*100):0;
  $('#headerDue').textContent=due; $('#headerMastery').textContent=mastery+'%';
  $('#statActive').textContent=active; $('#statHigh').textContent=errors.filter(e=>e.priority==='alta'&&e.status!=='dominado').length;
  $('#statRepeat').textContent=errors.filter(e=>Number(e.repeatCount)>0&&e.status!=='dominado').length; $('#statDominated').textContent=dominated;
  $('#reviewPending').textContent=errors.filter(e=>nextReview(e)).length;
  $('#historyCount').textContent=errors.reduce((n,e)=>n+(e.reviews?.length||0),0);
  $('#contentNotesCount').textContent=(data.contentFolders||[]).reduce((n,f)=>n+(f.notes?.length||0),0);
}
function renderDue(){
  const arr=data.errors.filter(isDue).sort((a,b)=>nextReview(a).localeCompare(nextReview(b))).slice(0,5);
  const box=$('#dueList');
  if(!arr.length){ box.className='stack empty-state'; box.textContent='Nenhuma revisão pendente.'; return; }
  box.className='stack';
  box.innerHTML=arr.map(e=>`<div class="review-row"><div class="review-row-main"><strong>${esc(e.content)}</strong><small>${esc(areaMeta(e))} · ${labelType(e.errorType)}</small></div><button class="mini-action" onclick="openReview('${e.id}')">Revisar</button></div>`).join('');
}
function renderRecent(){
  const arr=[...data.errors].sort((a,b)=>b.createdAt-a.createdAt).slice(0,6); const box=$('#recentErrors');
  if(!arr.length){ box.className='empty-state'; box.textContent='Nenhum erro registrado.'; return; }
  box.className='recent-list'; box.innerHTML=arr.map(e=>`<div class="recent-item" onclick="openEdit('${e.id}')"><div class="recent-main"><strong>${esc(e.content)}</strong><small>${esc(e.sourceName||e.source)}${e.questionNumber?' · Q'+esc(e.questionNumber):''}</small></div><span class="hide-tablet">${esc(areaMeta(e))}</span><span class="hide-tablet">${labelType(e.errorType)}</span><span class="badge ${e.priority}">${e.priority}</span><span class="recent-edit">›</span></div>`).join('');
}
function renderTypeSnapshot(){
  const active=data.errors.filter(e=>e.status!=='dominado'); const counts=typeCounts(active); const entries=Object.entries(counts).filter(([,v])=>v).sort((a,b)=>b[1]-a[1]); const box=$('#typeSnapshot');
  if(!entries.length){ box.className='type-snapshot empty-state'; box.textContent='Ainda não há dados.'; return; }
  const max=entries[0][1]; box.className='type-snapshot'; box.innerHTML=entries.slice(0,5).map(([k,v])=>`<div class="snapshot-row"><span>${labelType(k)}</span><div class="snapshot-track"><i style="width:${Math.max(8,v/max*100)}%"></i></div><strong>${v}</strong></div>`).join('');
}
function renderTypeTabs(){
  const counts=typeCounts(); const all=data.errors.length; const box=$('#typeTabs');
  box.innerHTML=`<button class="type-tab ${activeTypeFilter===''?'active':''}" data-type="">Todos <span>${all}</span></button>` + Object.keys(TYPE_LABELS).map(k=>`<button class="type-tab ${activeTypeFilter===k?'active':''}" data-type="${k}">${labelType(k)} <span>${counts[k]}</span></button>`).join('');
  $$('.type-tab').forEach(b=>b.addEventListener('click',()=>{activeTypeFilter=b.dataset.type; renderTypeTabs(); renderErrors();}));
}
function filteredErrors(){
  let arr=[...data.errors]; const q=$('#searchInput').value.trim().toLowerCase(); const area=$('#filterArea').value; const p=$('#filterPriority').value; const st=$('#filterStatus').value;
  if(q) arr=arr.filter(e=>[e.content,e.subject,e.area,e.sourceName,e.source,e.why,e.lesson,e.flashNote].join(' ').toLowerCase().includes(q));
  if(area) arr=arr.filter(e=>e.area===area); if(p) arr=arr.filter(e=>e.priority===p); if(st) arr=arr.filter(e=>e.status===st); if(activeTypeFilter) arr=arr.filter(e=>e.errorType===activeTypeFilter);
  return arr.sort((a,b)=>b.createdAt-a.createdAt);
}
function renderErrors(){
  const arr=filteredErrors(); $('#errorCount').textContent=`${arr.length} registro${arr.length===1?'':'s'}`; const box=$('#errorsGroups');
  if(!arr.length){ box.className='error-groups empty-state'; box.textContent='Nenhum erro encontrado com esses filtros.'; return; }
  box.className='error-groups'; const order=Object.keys(TYPE_LABELS);
  const groups=order.map(type=>[type,arr.filter(e=>e.errorType===type)]).filter(([,items])=>items.length);
  box.innerHTML=groups.map(([type,items])=>`<section class="error-group"><div class="error-group-head"><h2>${labelType(type)}</h2><span>${items.length} registro${items.length===1?'':'s'}</span></div><table class="error-table"><thead><tr><th>Conteúdo</th><th>Área</th><th>Prioridade</th><th>Status</th><th>Próxima revisão</th><th></th></tr></thead><tbody>${items.map(e=>`<tr onclick="openEdit('${e.id}')"><td class="cell-title"><strong>${esc(e.content)}</strong><small>${esc(e.sourceName||e.source)}${e.questionNumber?' · Q'+esc(e.questionNumber):''}</small></td><td>${esc(areaMeta(e))}</td><td><span class="badge ${e.priority}">${e.priority}</span></td><td><span class="status-pill ${e.status}">${e.status}</span></td><td>${nextReview(e)?fmtDate(nextReview(e)):'—'}</td><td class="row-actions"><button class="trash-btn" type="button" title="Excluir erro" aria-label="Excluir erro" onclick="event.stopPropagation();deleteErrorById('${e.id}')"><svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14M9 7V4.8h6V7M8 10v7M12 10v7M16 10v7M7 7l1 13h8l1-13"/></svg></button></td></tr>`).join('')}</tbody></table></section>`).join('');
}

function renderContents(){
  const areaBox=$('#contentAreaFolders');
  const counts=Object.fromEntries(CONTENT_AREAS.map(a=>[a.name,0]));
  (data.contentFolders||[]).forEach(f=>{counts[f.area]=(counts[f.area]||0)+(f.notes?.length||0)});
  areaBox.innerHTML=CONTENT_AREAS.map(a=>`<button type="button" class="content-area-card ${activeContentArea===a.name?'active':''}" onclick="selectContentArea('${a.name.replace(/'/g,"\'")}')"><span class="folder-shape"><svg viewBox="0 0 24 24" fill="none"><path d="M3.8 7h6l1.6 2h8.8v9.2a2 2 0 0 1-2 2H5.8a2 2 0 0 1-2-2z"/><path d="M3.8 10h16.4"/></svg></span><span><strong>${esc(a.short)}</strong><small>${counts[a.name]||0} nota${counts[a.name]===1?'':'s'}</small></span></button>`).join('');

  const workspace=$('#contentWorkspace');
  const topic=activeContentTopicId ? data.contentFolders.find(f=>f.id===activeContentTopicId&&f.area===activeContentArea) : null;
  if(topic){
    const notes=[...(topic.notes||[])].sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
    workspace.innerHTML=`<div class="content-breadcrumb"><button type="button" onclick="backToContentFolders()">${esc(activeContentArea)}</button><span>›</span><strong>${esc(topic.title)}</strong></div><div class="content-topic-head"><div><span class="panel-kicker">SUBTEMA</span><h2>${esc(topic.title)}</h2><p>${notes.length} nota${notes.length===1?'':'s'} salva${notes.length===1?'':'s'}</p></div><div class="content-head-actions"><button class="btn secondary compact-btn" type="button" onclick="editTopic('${topic.id}')">Renomear</button><button class="btn primary compact-btn" type="button" onclick="openNote('${topic.id}')">+ Nova nota</button></div></div>${notes.length?`<div class="notes-grid">${notes.map(n=>`<article class="note-card" onclick="openNote('${topic.id}','${n.id}')"><div class="note-card-top"><strong>${esc(n.title||'Nota')}</strong><span>${new Date(n.updatedAt||n.createdAt).toLocaleDateString('pt-BR')}</span></div><p>${esc(n.text).replace(/\n/g,'<br>')}</p><div class="note-card-foot"><span>Editar nota</span><span>›</span></div></article>`).join('')}</div>`:`<div class="content-empty"><div class="empty-folder-icon">✎</div><h3>Nenhuma nota ainda.</h3><p>Adicione uma regra, fórmula, associação ou lembrete curto que você queira reencontrar depois.</p><button class="btn primary" type="button" onclick="openNote('${topic.id}')">+ Adicionar primeira nota</button></div>`}<div class="topic-danger-zone"><button class="text-link danger-link" type="button" onclick="deleteTopic('${topic.id}')">Excluir esta subpasta</button></div>`;
    return;
  }
  activeContentTopicId=null;
  const folders=(data.contentFolders||[]).filter(f=>f.area===activeContentArea).sort((a,b)=>a.title.localeCompare(b.title,'pt-BR'));
  workspace.innerHTML=`<div class="content-topic-head"><div><span class="panel-kicker">PASTA</span><h2>${esc(activeContentArea)}</h2><p>Abra um subtema para consultar ou acrescentar notas.</p></div><button class="btn primary compact-btn" type="button" onclick="openTopicDialog()">+ Nova subpasta</button></div>${folders.length?`<div class="topic-folder-grid">${folders.map(f=>`<button class="topic-folder" type="button" onclick="openContentTopic('${f.id}')"><span class="topic-folder-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M4 7h6l1.5 2H20v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 10h16"/></svg></span><span class="topic-folder-copy"><strong>${esc(f.title)}</strong><small>${f.notes?.length||0} nota${(f.notes?.length||0)===1?'':'s'}</small></span><span class="topic-arrow">›</span></button>`).join('')}</div>`:`<div class="content-empty"><div class="empty-folder-icon">＋</div><h3>Crie sua primeira subpasta.</h3><p>Use subtemas específicos, como Eletroquímica, Probabilidade ou Repertório.</p><button class="btn primary" type="button" onclick="openTopicDialog()">+ Nova subpasta</button></div>`}`;
}

window.selectContentArea=function(area){ activeContentArea=area; activeContentTopicId=null; renderContents(); };
window.openContentTopic=function(id){ activeContentTopicId=id; renderContents(); };
window.backToContentFolders=function(){ activeContentTopicId=null; renderContents(); };
window.openTopicDialog=function(id=''){
  const topic=id?data.contentFolders.find(f=>f.id===id):null;
  $('#topicEditId').value=topic?.id||''; $('#topicAreaLabel').value=activeContentArea; $('#topicTitle').value=topic?.title||''; $('#topicDialogTitle').textContent=topic?'Renomear subpasta':'Nova subpasta'; $('#topicDialog').showModal();
};
window.editTopic=function(id){ openTopicDialog(id); };
function saveTopic(ev){ ev.preventDefault(); const id=$('#topicEditId').value; const title=$('#topicTitle').value.trim(); if(!title)return; const existing=id?data.contentFolders.find(f=>f.id===id):null; if(existing) existing.title=title; else data.contentFolders.push({id:uid(),area:activeContentArea,title,notes:[],createdAt:Date.now()}); saveData(); $('#topicDialog').close(); toast(existing?'Subpasta renomeada.':'Subpasta criada.'); }
window.deleteTopic=function(id){ const f=data.contentFolders.find(x=>x.id===id); if(!f)return; const n=f.notes?.length||0; if(confirm(`Excluir a subpasta “${f.title}”${n?` e suas ${n} nota${n===1?'':'s'}`:''}?`)){ data.contentFolders=data.contentFolders.filter(x=>x.id!==id); activeContentTopicId=null; saveData(); toast('Subpasta excluída.'); } };
window.openNote=function(topicId,noteId=''){ const f=data.contentFolders.find(x=>x.id===topicId); if(!f)return; const n=noteId?f.notes?.find(x=>x.id===noteId):null; $('#noteTopicId').value=topicId; $('#noteEditId').value=n?.id||''; $('#noteTitle').value=n?.title||''; $('#noteText').value=n?.text||''; $('#noteDialogTitle').textContent=n?'Editar nota':'Nova nota'; $('#deleteNoteBtn').classList.toggle('hidden',!n); $('#noteDialog').showModal(); };
function saveNote(ev){ ev.preventDefault(); const f=data.contentFolders.find(x=>x.id===$('#noteTopicId').value); if(!f)return; const id=$('#noteEditId').value; const existing=id?f.notes.find(n=>n.id===id):null; const now=Date.now(); const note={id:id||uid(),title:$('#noteTitle').value.trim(),text:$('#noteText').value.trim(),createdAt:existing?.createdAt||now,updatedAt:now}; if(existing)Object.assign(existing,note);else f.notes.push(note); saveData(); $('#noteDialog').close(); toast(existing?'Nota atualizada.':'Nota adicionada.'); }
function deleteCurrentNote(){ const f=data.contentFolders.find(x=>x.id===$('#noteTopicId').value); const id=$('#noteEditId').value; const n=f?.notes?.find(x=>x.id===id); if(!f||!n)return; if(confirm('Excluir esta nota?')){ f.notes=f.notes.filter(x=>x.id!==id); saveData(); $('#noteDialog').close(); toast('Nota excluída.'); } }

function renderReviews(){
  let arr=data.errors.filter(e=>nextReview(e)); const today=isoLocal(new Date());
  if(activeReviewFilter==='due') arr=arr.filter(isDue); else if(activeReviewFilter==='upcoming') arr=arr.filter(e=>nextReview(e)>today);
  arr.sort((a,b)=>nextReview(a).localeCompare(nextReview(b))); const box=$('#reviewList');
  if(!arr.length){ box.className='review-grid empty-state'; box.textContent=activeReviewFilter==='due'?'Nada para revisar hoje.':'Nenhuma revisão nesta faixa.'; return; }
  box.className='review-grid'; box.innerHTML=arr.map(e=>`<article class="review-card ${isDue(e)?'due':''}"><div class="review-top"><span class="badge ${e.priority}">${e.priority}</span><span class="review-date">${isDue(e)?'Hoje / atrasada':'Próxima: '+fmtDate(nextReview(e))}</span></div><h3>${esc(e.content)}</h3><p>${esc(areaMeta(e))}<br>${labelType(e.errorType)}${e.repeatCount>0?' · '+e.repeatCount+' reincidência(s)':''}</p><div class="review-actions"><small>${(e.reviews||[]).length} revisão(ões)</small><button class="mini-action" onclick="openReview('${e.id}')">Revisar</button></div></article>`).join('');
}
function getHistoryEntries(){
  const out=[]; data.errors.forEach(e=>(e.reviews||[]).forEach((r,index)=>out.push({error:e,review:r,index})));
  const q=$('#historySearch').value.trim().toLowerCase(); const area=$('#historyArea').value;
  return out.filter(x=>(!area||x.error.area===area)&&(!q||[x.error.content,x.error.subject,x.error.area,x.error.sourceName,x.review.recall,labelType(x.error.errorType)].join(' ').toLowerCase().includes(q))).sort((a,b)=>b.review.date.localeCompare(a.review.date)||b.index-a.index);
}
function resultLabel(v){ return v==='dominei'?'Consegui sozinho':v==='parcial'?'Parcialmente':'Ainda erraria'; }
function renderHistory(){
  const entries=getHistoryEntries(); const box=$('#historyList');
  if(!entries.length){ box.className='history-list empty-state'; box.textContent='Nenhuma revisão realizada ainda.'; return; }
  const days={}; entries.forEach(x=>{(days[x.review.date] ||= []).push(x)}); box.className='history-list';
  box.innerHTML=Object.entries(days).map(([date,items])=>`<section class="history-day"><div class="history-day-head">${fmtDate(date,true)}</div>${items.map(x=>`<div class="history-entry"><div><strong>${esc(x.error.content)}</strong><small>${esc(areaMeta(x.error))} · ${labelType(x.error.errorType)}</small></div><div class="hide-tablet"><small>LEMBROU / REFEZ</small><span>${esc(x.review.recall||'Sem anotação')}</span></div><div class="history-result ${x.review.result}">${resultLabel(x.review.result)}</div><div class="history-actions"><button class="tiny-btn primaryish" onclick="openReview('${x.error.id}')">Refazer</button><button class="tiny-btn" onclick="editPastReview('${x.error.id}',${x.index})">Corrigir</button></div></div>`).join('')}</section>`).join('');
}
function renderCalendar(){
  const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth(); $('#calendarTitle').textContent=new Date(y,m,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'}); const first=new Date(y,m,1); const start=new Date(y,m,1-first.getDay()); const today=isoLocal(new Date()); let html='';
  for(let i=0;i<42;i++){ const d=new Date(start); d.setDate(start.getDate()+i); const ds=isoLocal(d); const items=data.errors.filter(e=>nextReview(e)===ds); html+=`<div class="calendar-day ${d.getMonth()!==m?'other':''} ${ds===today?'today':''}"><strong>${d.getDate()}</strong>${items.slice(0,3).map(e=>`<span class="calendar-item ${ds<=today?'due':''}" title="${esc(e.content)}">${esc(e.content)}</span>`).join('')}${items.length>3?`<span class="calendar-item">+${items.length-3}</span>`:''}</div>`; }
  $('#calendarGrid').innerHTML=html;
}

function updateSubjectField(area, selected=''){
  const field=$('#subjectField'), select=$('#subject');
  if(SUBJECTS[area]){ field.classList.remove('hidden'); select.innerHTML='<option value="">Selecione</option>'+SUBJECTS[area].map(s=>`<option ${s===selected?'selected':''}>${s}</option>`).join(''); select.required=true; $('#areaHint').textContent='Selecione o componente dentro da área.'; }
  else { field.classList.add('hidden'); select.required=false; select.innerHTML='<option value=""></option>'; select.value=''; $('#areaHint').textContent='Em Matemática e Linguagens, a própria área já identifica o componente.'; }
}
function openNew(){
  $('#errorForm').reset(); $('#editId').value=''; $('#formTitle').textContent='Novo erro'; $('#deleteBtn').classList.add('hidden'); $('#wouldMissTomorrow').checked=true; $('#repeatCount').value=0; $('#status').value='novo'; updateSubjectField(''); $('#errorDialog').showModal();
}
window.openEdit=function(id){
  const e=data.errors.find(x=>x.id===id); if(!e)return; $('#editId').value=e.id; $('#formTitle').textContent='Editar erro'; $('#deleteBtn').classList.remove('hidden');
  ['source','sourceName','area','questionNumber','content','errorType','priority','difficulty','myAnswer','correctAnswer','why','lesson','flashNote','timeSpent','repeatCount','status'].forEach(k=>$('#'+k).value=e[k]??''); updateSubjectField(e.area,e.subject); $('#wouldMissTomorrow').checked=!!e.wouldMissTomorrow; $('#errorDialog').showModal();
}
function saveForm(ev){
  ev.preventDefault(); const id=$('#editId').value; const existing=data.errors.find(e=>e.id===id); const area=$('#area').value; const subject=SUBJECTS[area]?$('#subject').value:area;
  const e={id:id||uid(),createdAt:existing?.createdAt||Date.now(),createdDate:existing?.createdDate||isoLocal(new Date()),reviews:existing?.reviews||[],source:$('#source').value,sourceName:$('#sourceName').value.trim(),area,subject,questionNumber:$('#questionNumber').value.trim(),content:$('#content').value.trim(),errorType:$('#errorType').value,priority:$('#priority').value,difficulty:$('#difficulty').value,myAnswer:$('#myAnswer').value.trim(),correctAnswer:$('#correctAnswer').value.trim(),why:$('#why').value.trim(),lesson:$('#lesson').value.trim(),flashNote:$('#flashNote').value.trim(),timeSpent:Number($('#timeSpent').value||0),repeatCount:Number($('#repeatCount').value||0),status:$('#status').value,wouldMissTomorrow:$('#wouldMissTomorrow').checked};
  if(existing) Object.assign(existing,e); else data.errors.push(e); saveData(); $('#errorDialog').close(); toast(existing?'Erro atualizado.':'Erro registrado.');
}
function deleteCurrent(){ const id=$('#editId').value; if(id&&confirm('Excluir este registro e todo o histórico de revisões dele?')){ data.errors=data.errors.filter(e=>e.id!==id); saveData(); $('#errorDialog').close(); toast('Registro excluído.'); } }
window.deleteErrorById=function(id){ const e=data.errors.find(x=>x.id===id); if(!e)return; if(confirm(`Excluir o erro “${e.content}” e todo o histórico de revisões dele?`)){ data.errors=data.errors.filter(x=>x.id!==id); saveData(); toast('Registro excluído.'); } };

window.openReview=function(id){
  const e=data.errors.find(x=>x.id===id); if(!e)return; $('#reviewId').value=id; $('#reviewTitle').textContent=e.content; $('#reviewRecall').value=''; $('#reviewResult').value='dominei'; $('#lessonReveal').classList.add('hidden');
  $('#reviewSummary').innerHTML=`<h3>${esc(e.content)}</h3><p>${esc(areaMeta(e))} · ${labelType(e.errorType)}</p><p><strong>Questão:</strong> ${esc(e.sourceName||e.source)}${e.questionNumber?' · Q'+esc(e.questionNumber):''}</p>`; $('#reviewDialog').showModal();
}
function completeReview(ev){
  ev.preventDefault(); const e=data.errors.find(x=>x.id===$('#reviewId').value); if(!e)return; const result=$('#reviewResult').value; e.reviews=e.reviews||[]; e.reviews.push({date:isoLocal(new Date()),result,recall:$('#reviewRecall').value.trim()});
  if(result==='dominei'){e.wouldMissTomorrow=false; e.status=e.reviews.filter(r=>r.result==='dominei').length>=2?'dominado':'revisando';}
  else if(result==='parcial'){e.status='revisando';e.wouldMissTomorrow=true;}
  else {e.status='revisando';e.wouldMissTomorrow=true;e.repeatCount=Number(e.repeatCount||0)+1;}
  saveData(); $('#reviewDialog').close(); toast('Revisão registrada.');
}
function revealLesson(){ const e=data.errors.find(x=>x.id===$('#reviewId').value); if(!e)return; const box=$('#lessonReveal'); box.innerHTML=`<strong>O que eu precisava saber ou fazer</strong><br>${esc(e.lesson||'Sem anotação.')}<br><br><strong>Resumo de bolso</strong><br>${esc(e.flashNote||'Sem resumo.')}`; box.classList.remove('hidden'); }

window.editPastReview=function(errorId,index){ const e=data.errors.find(x=>x.id===errorId); const r=e?.reviews?.[index]; if(!e||!r)return; $('#historyErrorId').value=errorId; $('#historyReviewIndex').value=index; $('#historyReviewDate').value=r.date; $('#historyReviewResult').value=r.result; $('#historyReviewRecall').value=r.recall||''; $('#historyEditDialog').showModal(); }
function savePastReview(ev){ ev.preventDefault(); const e=data.errors.find(x=>x.id===$('#historyErrorId').value); const index=Number($('#historyReviewIndex').value); if(!e||!e.reviews?.[index])return; e.reviews[index]={...e.reviews[index],date:$('#historyReviewDate').value,result:$('#historyReviewResult').value,recall:$('#historyReviewRecall').value.trim()}; e.reviews.sort((a,b)=>a.date.localeCompare(b.date)); const latest=e.reviews[e.reviews.length-1]; if(latest?.result==='dominei'&&e.reviews.filter(r=>r.result==='dominei').length>=2){e.status='dominado';e.wouldMissTomorrow=false;} else {e.status='revisando';e.wouldMissTomorrow=latest?.result!=='dominei';} saveData(); $('#historyEditDialog').close(); toast('Revisão passada atualizada.'); }

function switchView(v){ $$('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.view===v)); $$('.view').forEach(x=>x.classList.remove('active')); $('#view-'+v).classList.add('active'); window.scrollTo({top:0,behavior:'smooth'}); }
$$('.nav-link').forEach(btn=>btn.addEventListener('click',()=>switchView(btn.dataset.view))); $$('[data-go]').forEach(btn=>btn.addEventListener('click',()=>switchView(btn.dataset.go)));
$('#newErrorBtn').addEventListener('click',openNew); $('#newErrorBtn2').addEventListener('click',openNew); $('#closeDialog').addEventListener('click',()=>$('#errorDialog').close()); $('#cancelBtn').addEventListener('click',()=>$('#errorDialog').close()); $('#errorForm').addEventListener('submit',saveForm); $('#deleteBtn').addEventListener('click',deleteCurrent); $('#area').addEventListener('change',e=>updateSubjectField(e.target.value));
$('#closeReview').addEventListener('click',()=>$('#reviewDialog').close()); $('#cancelReview').addEventListener('click',()=>$('#reviewDialog').close()); $('#reviewForm').addEventListener('submit',completeReview); $('#showLessonBtn').addEventListener('click',revealLesson);
$('#closeHistoryEdit').addEventListener('click',()=>$('#historyEditDialog').close()); $('#cancelHistoryEdit').addEventListener('click',()=>$('#historyEditDialog').close()); $('#historyEditForm').addEventListener('submit',savePastReview);
$('#closeTopicDialog').addEventListener('click',()=>$('#topicDialog').close()); $('#cancelTopic').addEventListener('click',()=>$('#topicDialog').close()); $('#topicForm').addEventListener('submit',saveTopic);
$('#closeNoteDialog').addEventListener('click',()=>$('#noteDialog').close()); $('#cancelNote').addEventListener('click',()=>$('#noteDialog').close()); $('#noteForm').addEventListener('submit',saveNote); $('#deleteNoteBtn').addEventListener('click',deleteCurrentNote);
['searchInput','filterArea','filterPriority','filterStatus'].forEach(id=>$('#'+id).addEventListener('input',renderErrors)); $('#clearTypeFilter').addEventListener('click',()=>{activeTypeFilter='';renderTypeTabs();renderErrors();});
['historySearch','historyArea'].forEach(id=>$('#'+id).addEventListener('input',renderHistory));
$$('[data-review-filter]').forEach(btn=>btn.addEventListener('click',()=>{activeReviewFilter=btn.dataset.reviewFilter; $$('[data-review-filter]').forEach(b=>b.classList.toggle('active',b===btn)); renderReviews();}));
$('#prevMonth').addEventListener('click',()=>{calendarCursor.setMonth(calendarCursor.getMonth()-1);renderCalendar();}); $('#nextMonth').addEventListener('click',()=>{calendarCursor.setMonth(calendarCursor.getMonth()+1);renderCalendar();});
$('#exportBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='kant-caderno-erros-backup.json';a.click();URL.revokeObjectURL(a.href);});
$('#importInput').addEventListener('change',ev=>{const f=ev.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const obj=JSON.parse(r.result);if(!Array.isArray(obj.errors))throw new Error();data=normalizeData(obj);saveData();toast('Backup importado.');}catch{alert('Arquivo de backup inválido.');}};r.readAsText(f);});
$('#todayLabel').textContent=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'});
renderAll();
