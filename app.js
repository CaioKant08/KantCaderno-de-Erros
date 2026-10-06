const LEGACY_STORAGE_KEY = 'cadernoErrosENEM_v1';
const USER_STORAGE_PREFIX = 'kantCadernoErros_v4_';
const CLOUD_TABLE = 'error_notebook_state';
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
let calendarCursor = new Date();
let activeScoreFilter = '';
let activeReviewFilter = 'due';
let activeContentArea = 'Matemática';
let activeContentTopicId = null;

const SUBJECTS = {
  'Ciências da Natureza':['Biologia','Física','Química'],
  'Ciências Humanas':['História','Geografia','Filosofia','Sociologia']
};
const EXAM_DATES = {
  first:'2026-11-08',
  second:'2026-11-15'
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

// Incidência histórica sintetizada dos dois dossiês enviados pelo usuário.
// O valor é um peso relativo por disciplina, usado apenas no cálculo do score.
const INCIDENCE_CATALOG = {
  'Matemática':[
    ['Matemática básica',33],['Geometria',23],['Funções e equações',14],['Estatística',12],['Combinatória e probabilidade',10],['Progressões e sequências',8],['Trigonometria',7],['Geometria analítica',6],['Exponencial e logaritmo',5],['Matrizes e sistemas',4]
  ],
  'Biologia':[
    ['Ecologia',31.4],['Fisiologia humana / animal',7.7],['Zoologia',8.3],['Botânica',7.1],['Bioenergética',7.1],['Evolução',6.5],['Microbiologia',6.5],['Citologia',5.3],['Histologia',5.3],['Biotecnologia / engenharia genética',4.7],['Genética',3.6],['Bioquímica',3.6],['Citogenética / divisão celular',3.6],['Reprodução e embriologia',3.2],['Classificação dos seres vivos',3.0]
  ],
  'Física':[
    ['Eletrodinâmica',24],['Dinâmica / trabalho e energia',18],['Termologia / termodinâmica',15],['Ondulatória',14],['Cinemática',10],['Óptica',6],['Quantidade de movimento e impulso',5],['Fluidos / hidrostática',4],['Eletrostática',3],['Magnetismo',3],['Estática',2],['Gravitação',2]
  ],
  'Química':[
    ['Moléculas e propriedades',8.6],['Estequiometria',7.9],['Eletroquímica',6.6],['Funções inorgânicas / ácidos e bases',6.6],['Separação de misturas',6.6],['Propriedades dos compostos orgânicos',6.6],['Hidrocarbonetos',5.9],['Átomos',5.9],['Soluções',5.3],['Reações químicas',5.3],['Cinética química',5.3],['Reações orgânicas',5.3],['Equilíbrio químico',4.6],['Química ambiental',3.9],['Termoquímica',3.3],['Isomeria',3.3],['Funções orgânicas',2.6],['Polímeros',1.3],['Gases e propriedades coligativas',1.0]
  ],
  'História':[
    ['Brasil: Colônia',11.8],['Brasil: República / Era Vargas / Ditadura',11.0],['Idade Média',10.3],['Século XX / conflitos mundiais',9.6],['Idade Moderna',9.6],['Brasil Império',8.5],['Tempo presente / Nova República',7.4],['Idade Contemporânea',7.0],['História da Arte',5.1],['Antiguidade',4.8],['Povos indígenas e escravidão',4.5],['Historiografia / Introdução à História',3.0]
  ],
  'Geografia':[
    ['Espaço urbano',12.4],['Espaço agrário',11.8],['Geopolítica',11.2],['Domínios morfoclimáticos / biomas',6.5],['Questões ambientais',6.0],['Clima',5.5],['Demografia e migrações',5.2],['Transportes, comércio e serviços',4.7],['Indústria e fontes de energia',4.7],['Geologia e solos',4.1],['Cartografia e geoprocessamento',3.5],['Hidrografia',3.5],['Blocos econômicos / globalização',3.5],['Espaço brasileiro / regionalização',3.0]
  ],
  'Filosofia':[
    ['Filosofia Antiga',28.1],['Filosofia Moderna',18.8],['Áreas da Filosofia',14.1],['Mal e Justiça',12.5],['Filosofia Política',6.3],['Psicanálise e Teoria Crítica',6.3],['Filosofia Medieval',4.7],['Filosofia Alemã',4.7],['Questões filosóficas contemporâneas',3.1]
  ],
  'Sociologia':[
    ['Cultura e sociedade',19.0],['Movimentos sociais',18.1],['Estado e cidadania',15.2],['Sociologia brasileira',13.3],['Sociologia contemporânea',10.5],['Sociologia do trabalho',6.7],['Sociologia política',5.7],['Teoria sociológica',5.7],['Meio ambiente, sociedade e comunicação',5.1]
  ],
  'Linguagens':[
    ['Gêneros textuais',44.1],['Interpretação e língua portuguesa',22.1],['Linguagem culta, coloquial e variação linguística',10.7],['Texto e contexto / coesão e coerência',7.0],['Funções da linguagem',5.9],['Português no ENEM / progressão temática',4.4],['Estratégias de interpretação',2.9],['Literatura contemporânea',2.7],['Artes e modernismo',2.3],['Língua estrangeira / interpretação',2.0]
  ],
  'Redação':[
    ['Competência 1 — norma padrão e sintaxe',20],['Competência 2 — tema, repertório e tipo textual',20],['Competência 3 — projeto de texto e argumentação',20],['Competência 4 — coesão',20],['Competência 5 — proposta de intervenção',20]
  ]
};

function defaultContentFolders(){
  const now=Date.now();
  return Object.entries(DEFAULT_CONTENT_TOPICS).flatMap(([area,titles],ai)=>titles.map((title,i)=>({id:`seed-${ai}-${i}`,area,title,notes:[],createdAt:now+i})));
}
let currentUser = null;
let db = null;
let cloudHydrated = false;
let cloudSaveTimer = null;
let loadingUserId = null;
let data = {errors:[],contentFolders:defaultContentFolders()};

function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
function parseLocal(s){ if(!s) return new Date(); const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
function isoLocal(d=new Date()){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function addDays(s,n){ const d=parseLocal(s); d.setDate(d.getDate()+n); return isoLocal(d); }
function fmtDate(s,long=false){ if(!s)return '—'; return parseLocal(s).toLocaleDateString('pt-BR',long?{day:'2-digit',month:'long',year:'numeric'}:{}); }
function esc(s=''){ return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function toast(msg){ const el=$('#toast'); el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),1800); }
function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
function normalizedSubject(e){
  if(e.area==='Matemática') return 'Matemática';
  if(e.area==='Linguagens') return 'Linguagens';
  if(e.area==='Redação') return 'Redação';
  return e.subject||'';
}
function displaySubject(e){ return normalizedSubject(e)||e.area||'—'; }
function areaMeta(e){ return e.area + ((SUBJECTS[e.area]&&e.subject)?` · ${e.subject}`:''); }
function examDateFor(area){ return ['Linguagens','Redação','Ciências Humanas'].includes(area)?EXAM_DATES.first:EXAM_DATES.second; }
function scoreBand(score){ return score<=35?'critical':score<=65?'attention':'stable'; }
function scoreBandLabel(score){ return score<=35?'Crítico':score<=65?'Atenção':'Mais estável'; }
function scoreColor(score){ return score<=35?'#d93a3a':score<=65?'#e3a008':'#15945b'; }
function difficultyNorm(v){ return v==='dificil'?1:v==='facil'?0.25:0.60; }
function difficultyLabel(v){ return v==='dificil'?'Difícil':v==='facil'?'Fácil':'Média'; }
function catalogKey(area,subject){ return SUBJECTS[area]?subject:area; }
function topicList(area,subject=''){ return INCIDENCE_CATALOG[catalogKey(area,subject)]||[]; }
function topicInfo(area,subject,topic){
  const list=topicList(area,subject); const row=list.find(x=>x[0]===topic); if(!row)return null;
  const max=Math.max(...list.map(x=>x[1]),1); return {raw:row[1],relative:row[1]/max};
}
function calculateScore(area,subject,topic,difficulty){
  const info=topicInfo(area,subject,topic); if(!info)return null;
  const urgency=.65*info.relative + .35*difficultyNorm(difficulty);
  return clamp(Math.round(100-100*urgency),5,95);
}
function baseInterval(score){ return clamp(1+Math.round(5*Math.pow((score||50)/100,1.6)),1,6); }
function nextIntervalDays(e){
  const base=baseInterval(e.score); const done=(e.reviews||[]).length; const growth=[1,2,3.5,5.5,8][Math.min(done,4)];
  const last=(e.reviews||[]).at(-1); const modifier=last?.result==='nao'?0.55:last?.result==='parcial'?0.85:last?.result==='dominei'?1.2:1;
  return clamp(Math.round(base*growth*modifier),1,30);
}
function nextReview(e){
  const exam=examDateFor(e.area); const today=isoLocal(new Date()); if(today>exam)return null;
  const reviews=e.reviews||[]; const baseDate=reviews.length?reviews.at(-1).date:(e.createdDate||today); let next=addDays(baseDate,nextIntervalDays(e));
  if(next>exam) next=exam;
  if(baseDate>=exam) return null;
  return next;
}
function isDue(e){ const n=nextReview(e); return !!n&&n<=isoLocal(new Date()); }

function loadLocalDataForUser(userId){ try{ const parsed=JSON.parse(localStorage.getItem(USER_STORAGE_PREFIX+userId)); if(parsed&&Array.isArray(parsed.errors))return normalizeData(parsed); }catch{} return null; }
function loadLegacyData(){ try{ const parsed=JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY)); if(parsed&&Array.isArray(parsed.errors))return normalizeData(parsed); }catch{} return null; }
function freshData(){ return {errors:[],contentFolders:defaultContentFolders()}; }
function normalizeData(obj){
  obj=obj||{};
  obj.errors=(obj.errors||[]).map(old=>{
    const area=old.area||'Matemática'; const subject=normalizedSubject(old)||old.subject||'';
    const topic=old.topic||old.content||'';
    const difficulty=['facil','media','dificil'].includes(old.difficulty)?old.difficulty:(String(old.difficulty||'').toLowerCase().startsWith('dif')?'dificil':String(old.difficulty||'').toLowerCase().startsWith('fá')?'facil':'media');
    const note=old.errorNote||[old.why,old.lesson,old.flashNote].filter(Boolean).join('\n');
    const microcontent=old.microcontent||(!old.topic?old.content:'')||'';
    const score=Number.isFinite(Number(old.score))?Number(old.score):(calculateScore(area,subject,topic,difficulty)??50);
    return {...old,id:old.id||uid(),createdAt:old.createdAt||Date.now(),createdDate:old.createdDate||isoLocal(new Date(old.createdAt||Date.now())),reviews:Array.isArray(old.reviews)?old.reviews:[],area,subject,topic,microcontent,difficulty,errorNote:note,score};
  });
  if(!Array.isArray(obj.contentFolders))obj.contentFolders=defaultContentFolders();
  obj.contentFolders=obj.contentFolders.map(f=>({id:f.id||uid(),area:f.area||'Matemática',title:f.title||'Sem título',createdAt:f.createdAt||Date.now(),notes:(f.notes||[]).map(n=>({id:n.id||uid(),title:n.title||'',text:n.text||'',createdAt:n.createdAt||Date.now(),updatedAt:n.updatedAt||n.createdAt||Date.now()}))}));
  return obj;
}
function setSyncState(state,message){ const status=$('#syncStatus'); if(status)status.textContent=message; const dot=$('#accountSyncDot'),text=$('#accountSyncText'); if(dot)dot.className='sync-dot'+(state==='busy'?' busy':state==='error'?' error':''); if(text)text.textContent=message; }
function saveData(){ if(currentUser){try{localStorage.setItem(USER_STORAGE_PREFIX+currentUser.id,JSON.stringify(data));}catch{}} renderAll(); if(currentUser&&db&&cloudHydrated)queueCloudSave(); }
function queueCloudSave(){ clearTimeout(cloudSaveTimer); setSyncState('busy','Salvando alterações...'); cloudSaveTimer=setTimeout(saveCloudState,500); }
async function saveCloudState(){ if(!currentUser||!db||!cloudHydrated)return; try{ const {error}=await db.from(CLOUD_TABLE).upsert({user_id:currentUser.id,payload:data,updated_at:new Date().toISOString()},{onConflict:'user_id'}); if(error)throw error; setSyncState('ok','Sincronizado com Supabase'); }catch(err){console.error(err);setSyncState('error','Falha ao sincronizar — dados mantidos neste navegador');} }

function renderAll(){ renderStats(); renderDue(); renderRecent(); renderScoreSnapshot(); renderScoreTabs(); renderErrors(); renderContents(); renderReviews(); renderHistory(); renderCalendar(); }
function renderStats(){
  const errors=data.errors; const due=errors.filter(isDue).length; const reviews=errors.reduce((n,e)=>n+(e.reviews?.length||0),0); const avg=errors.length?Math.round(errors.reduce((n,e)=>n+Number(e.score||50),0)/errors.length):100;
  $('#headerDue').textContent=due; $('#headerMastery').textContent=avg+'%';
  $('#statActive').textContent=errors.length; $('#statHigh').textContent=errors.filter(e=>e.score<=35).length; $('#statRepeat').textContent=due; $('#statDominated').textContent=reviews;
  $('#reviewPending').textContent=errors.filter(e=>nextReview(e)).length; $('#historyCount').textContent=reviews; $('#contentNotesCount').textContent=(data.contentFolders||[]).reduce((n,f)=>n+(f.notes?.length||0),0);
}
function errorTitle(e){ return e.microcontent?`${e.topic} — ${e.microcontent}`:(e.topic||e.content||'Sem conteúdo'); }
function renderDue(){ const arr=data.errors.filter(isDue).sort((a,b)=>a.score-b.score).slice(0,5); const box=$('#dueList'); if(!arr.length){box.className='stack empty-state';box.textContent='Nenhuma revisão pendente.';return;} box.className='stack'; box.innerHTML=arr.map(e=>`<div class="review-row"><div class="review-row-main"><strong>${esc(errorTitle(e))}</strong><small>${esc(areaMeta(e))} · score ${e.score}</small></div><button class="mini-action" onclick="openReview('${e.id}')">Revisar</button></div>`).join(''); }
function renderRecent(){ const arr=[...data.errors].sort((a,b)=>b.createdAt-a.createdAt).slice(0,6); const box=$('#recentErrors'); if(!arr.length){box.className='empty-state';box.textContent='Nenhum erro registrado.';return;} box.className='recent-list'; box.innerHTML=arr.map(e=>`<div class="recent-item" onclick="openEdit('${e.id}')"><div class="recent-main"><strong>${esc(errorTitle(e))}</strong><small>${esc(e.sourceName||e.source)}${e.questionNumber?' · Q'+esc(e.questionNumber):''}</small></div><span class="hide-tablet">${esc(areaMeta(e))}</span><span class="score-pill ${scoreBand(e.score)}">${e.score}</span><span class="hide-tablet">${fmtDate(nextReview(e))}</span><span class="recent-edit">›</span></div>`).join(''); }
function renderScoreSnapshot(){ const counts={critical:0,attention:0,stable:0}; data.errors.forEach(e=>counts[scoreBand(e.score)]++); const box=$('#typeSnapshot'); if(!data.errors.length){box.className='type-snapshot empty-state';box.textContent='Ainda não há dados.';return;} const entries=[['critical','Crítico · 0–35'],['attention','Atenção · 36–65'],['stable','Mais estável · 66–100']]; const max=Math.max(...Object.values(counts),1); box.className='type-snapshot'; box.innerHTML=entries.map(([k,label])=>`<div class="snapshot-row"><span>${label}</span><div class="snapshot-track score-track ${k}"><i style="width:${Math.max(5,counts[k]/max*100)}%"></i></div><strong>${counts[k]}</strong></div>`).join(''); }
function renderScoreTabs(){ const counts={critical:0,attention:0,stable:0}; data.errors.forEach(e=>counts[scoreBand(e.score)]++); const box=$('#typeTabs'); const tabs=[['','Todos',data.errors.length],['critical','Crítico',counts.critical],['attention','Atenção',counts.attention],['stable','Mais estável',counts.stable]]; box.innerHTML=tabs.map(([k,l,n])=>`<button class="type-tab ${activeScoreFilter===k?'active':''}" data-score="${k}">${l} <span>${n}</span></button>`).join(''); $$('.type-tab').forEach(b=>b.addEventListener('click',()=>{activeScoreFilter=b.dataset.score;renderScoreTabs();renderErrors();})); }
function filteredErrors(){ let arr=[...data.errors]; const q=$('#searchInput').value.trim().toLowerCase(); const area=$('#filterArea').value; const sf=$('#filterScore').value; if(q)arr=arr.filter(e=>[e.topic,e.microcontent,e.area,e.subject,e.sourceName,e.source,e.errorNote].join(' ').toLowerCase().includes(q)); if(area)arr=arr.filter(e=>e.area===area); const band=sf||activeScoreFilter; if(band)arr=arr.filter(e=>scoreBand(e.score)===band); return arr.sort((a,b)=>a.score-b.score||b.createdAt-a.createdAt); }
function renderErrors(){
  const arr=filteredErrors(); $('#errorCount').textContent=`${arr.length} registro${arr.length===1?'':'s'}`; const box=$('#errorsGroups'); if(!arr.length){box.className='error-groups empty-state';box.textContent='Nenhum erro encontrado com esses filtros.';return;}
  const groups=[['critical','Crítico · revisar primeiro'],['attention','Atenção'],['stable','Mais estável']].map(([k,l])=>[k,l,arr.filter(e=>scoreBand(e.score)===k)]).filter(([, ,items])=>items.length);
  box.className='error-groups'; box.innerHTML=groups.map(([band,label,items])=>`<section class="error-group"><div class="error-group-head"><h2>${label}</h2><span>${items.length} registro${items.length===1?'':'s'}</span></div><table class="error-table"><thead><tr><th>Conteúdo</th><th>Área</th><th>Score</th><th>Dificuldade</th><th>Próxima revisão</th><th></th></tr></thead><tbody>${items.map(e=>`<tr onclick="openEdit('${e.id}')"><td class="cell-title"><strong>${esc(errorTitle(e))}</strong><small>${esc(e.sourceName||e.source)}${e.questionNumber?' · Q'+esc(e.questionNumber):''}</small></td><td>${esc(areaMeta(e))}</td><td><span class="score-pill ${band}">${e.score}</span></td><td>${difficultyLabel(e.difficulty)}</td><td>${nextReview(e)?fmtDate(nextReview(e)):'—'}</td><td class="row-actions"><button class="delete-row-btn" type="button" title="Excluir erro" onclick="event.stopPropagation();deleteErrorById('${e.id}')"><svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14M9 7V4.8h6V7M8 10v7M12 10v7M16 10v7M7 7l1 13h8l1-13"/></svg><span>Excluir</span></button></td></tr>`).join('')}</tbody></table></section>`).join('');
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
    workspace.innerHTML=`<div class="content-breadcrumb"><button type="button" onclick="backToContentFolders()">${esc(activeContentArea)}</button><span>›</span><strong>${esc(topic.title)}</strong></div><div class="content-topic-head"><div><span class="panel-kicker">SUBTEMA</span><h2>${esc(topic.title)}</h2><p>${notes.length} nota${notes.length===1?'':'s'} salva${notes.length===1?'':'s'}</p></div><div class="content-head-actions"><button class="btn secondary compact-btn" type="button" onclick="editTopic('${topic.id}')">Renomear</button><button class="btn primary compact-btn" type="button" onclick="openNote('${topic.id}')">+ Nova nota</button></div></div>${notes.length?`<div class="notes-grid">${notes.map(n=>`<article class="note-card" onclick="openNote('${topic.id}','${n.id}')"><div class="note-card-top"><strong>${esc(n.title||'Nota')}</strong><div class="note-card-top-actions"><span>${new Date(n.updatedAt||n.createdAt).toLocaleDateString('pt-BR')}</span><button class="note-delete-btn" type="button" title="Excluir nota" onclick="event.stopPropagation();deleteNoteById('${topic.id}','${n.id}')"><svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14M9 7V5h6v2M8 10v7M12 10v7M16 10v7M7 7l1 13h8l1-13"/></svg></button></div></div><p>${esc(n.text).replace(/\n/g,'<br>')}</p><div class="note-card-foot"><span>Editar nota</span><span>›</span></div></article>`).join('')}</div>`:`<div class="content-empty"><div class="empty-folder-icon">✎</div><h3>Nenhuma nota ainda.</h3><p>Adicione uma regra, fórmula, associação ou lembrete curto que você queira reencontrar depois.</p><button class="btn primary" type="button" onclick="openNote('${topic.id}')">+ Adicionar primeira nota</button></div>`}<div class="topic-danger-zone"><button class="btn danger danger-solid" type="button" onclick="deleteTopic('${topic.id}')">Excluir esta subpasta</button></div>`;
    return;
  }
  activeContentTopicId=null;
  const folders=(data.contentFolders||[]).filter(f=>f.area===activeContentArea).sort((a,b)=>a.title.localeCompare(b.title,'pt-BR'));
  workspace.innerHTML=`<div class="content-topic-head"><div><span class="panel-kicker">PASTA</span><h2>${esc(activeContentArea)}</h2><p>Abra um subtema para consultar ou acrescentar notas.</p></div><div class="content-head-actions">${folders.length?`<button class="btn danger compact-btn" type="button" onclick="clearContentArea('${activeContentArea.replace(/'/g,"\'")}')">Limpar esta área</button>`:''}<button class="btn primary compact-btn" type="button" onclick="openTopicDialog()">+ Nova subpasta</button></div></div>${folders.length?`<div class="topic-folder-grid">${folders.map(f=>`<div class="topic-folder-card"><button class="topic-folder" type="button" onclick="openContentTopic('${f.id}')"><span class="topic-folder-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M4 7h6l1.5 2H20v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 10h16"/></svg></span><span class="topic-folder-copy"><strong>${esc(f.title)}</strong><small>${f.notes?.length||0} nota${(f.notes?.length||0)===1?'':'s'}</small></span><span class="topic-arrow">›</span></button><button class="folder-delete-btn" type="button" title="Excluir subpasta" onclick="deleteTopic('${f.id}')"><svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14M9 7V5h6v2M8 10v7M12 10v7M16 10v7M7 7l1 13h8l1-13"/></svg></button></div>`).join('')}</div>`:`<div class="content-empty"><div class="empty-folder-icon">＋</div><h3>Nenhuma subpasta nesta área.</h3><p>Crie apenas os subtemas que realmente quiser usar.</p><button class="btn primary" type="button" onclick="openTopicDialog()">+ Nova subpasta</button></div>`}`;
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
window.clearContentArea=function(area){ const folders=data.contentFolders.filter(f=>f.area===area); if(!folders.length)return; const notes=folders.reduce((n,f)=>n+(f.notes?.length||0),0); if(confirm(`Excluir todas as ${folders.length} subpasta(s) de ${area}${notes?` e suas ${notes} nota(s)`:''}?`)){ data.contentFolders=data.contentFolders.filter(f=>f.area!==area); activeContentTopicId=null; saveData(); toast('Área esvaziada.'); } };
function clearAllContentFolders(){ const folders=data.contentFolders.length; const notes=data.contentFolders.reduce((n,f)=>n+(f.notes?.length||0),0); if(!folders){toast('O fichário já está vazio.');return;} if(confirm(`Excluir TODAS as ${folders} subpastas${notes?` e ${notes} nota(s)`:''}? As cinco áreas principais continuarão disponíveis, mas vazias.`)){ data.contentFolders=[]; activeContentTopicId=null; saveData(); toast('Fichário zerado.'); } }
window.openNote=function(topicId,noteId=''){ const f=data.contentFolders.find(x=>x.id===topicId); if(!f)return; const n=noteId?f.notes?.find(x=>x.id===noteId):null; $('#noteTopicId').value=topicId; $('#noteEditId').value=n?.id||''; $('#noteTitle').value=n?.title||''; $('#noteText').value=n?.text||''; $('#noteDialogTitle').textContent=n?'Editar nota':'Nova nota'; $('#deleteNoteBtn').classList.toggle('hidden',!n); $('#noteDialog').showModal(); };
function saveNote(ev){ ev.preventDefault(); const f=data.contentFolders.find(x=>x.id===$('#noteTopicId').value); if(!f)return; const id=$('#noteEditId').value; const existing=id?f.notes.find(n=>n.id===id):null; const now=Date.now(); const note={id:id||uid(),title:$('#noteTitle').value.trim(),text:$('#noteText').value.trim(),createdAt:existing?.createdAt||now,updatedAt:now}; if(existing)Object.assign(existing,note);else f.notes.push(note); saveData(); $('#noteDialog').close(); toast(existing?'Nota atualizada.':'Nota adicionada.'); }
function deleteCurrentNote(){ const f=data.contentFolders.find(x=>x.id===$('#noteTopicId').value); const id=$('#noteEditId').value; const n=f?.notes?.find(x=>x.id===id); if(!f||!n)return; if(confirm('Excluir esta nota?')){ f.notes=f.notes.filter(x=>x.id!==id); saveData(); $('#noteDialog').close(); toast('Nota excluída.'); } }
window.deleteNoteById=function(topicId,noteId){ const f=data.contentFolders.find(x=>x.id===topicId); const n=f?.notes?.find(x=>x.id===noteId); if(!f||!n)return; if(confirm(`Excluir a nota “${n.title||'Nota'}”?`)){ f.notes=f.notes.filter(x=>x.id!==noteId); saveData(); toast('Nota excluída.'); } };

function renderReviews(){
  let arr=data.errors.filter(e=>nextReview(e)); const today=isoLocal(new Date());
  if(activeReviewFilter==='due')arr=arr.filter(e=>nextReview(e)<=today); else if(activeReviewFilter==='upcoming')arr=arr.filter(e=>nextReview(e)>today);
  arr.sort((a,b)=>nextReview(a).localeCompare(nextReview(b))||a.score-b.score); const box=$('#reviewList');
  if(!arr.length){box.className='review-grid empty-state';box.textContent=activeReviewFilter==='due'?'Nenhuma revisão para hoje.':'Nenhuma revisão programada.';return;}
  box.className='review-grid'; box.innerHTML=arr.map(e=>`<article class="review-card"><div class="review-card-top"><span class="score-pill ${scoreBand(e.score)}">${e.score}</span><span>${fmtDate(nextReview(e))}</span></div><h3>${esc(errorTitle(e))}</h3><p>${esc(areaMeta(e))}</p><small>Intervalo atual: ${nextIntervalDays(e)} dia${nextIntervalDays(e)===1?'':'s'} · limite ${fmtDate(examDateFor(e.area))}</small><button class="btn primary" type="button" onclick="openReview('${e.id}')">Revisar agora</button></article>`).join('');
}
function getHistoryEntries(){ const out=[]; data.errors.forEach(error=>(error.reviews||[]).forEach((review,index)=>out.push({error,review,index}))); const q=$('#historySearch').value.trim().toLowerCase(); const area=$('#historyArea').value; return out.filter(x=>(!area||x.error.area===area)&&(!q||[x.error.topic,x.error.microcontent,x.error.subject,x.error.area,x.error.sourceName,x.review.recall,x.error.errorNote].join(' ').toLowerCase().includes(q))).sort((a,b)=>b.review.date.localeCompare(a.review.date)||b.index-a.index); }
function resultLabel(v){ return v==='dominei'?'Consegui sozinho':v==='parcial'?'Parcialmente':'Ainda erraria'; }
function renderHistory(){ const entries=getHistoryEntries(); const box=$('#historyList'); if(!entries.length){box.className='history-list empty-state';box.textContent='Nenhuma revisão realizada ainda.';return;} const days={}; entries.forEach(x=>(days[x.review.date]||=[]).push(x)); box.className='history-list'; box.innerHTML=Object.entries(days).map(([date,items])=>`<section class="history-day"><div class="history-day-head">${fmtDate(date,true)}</div>${items.map(x=>`<div class="history-entry"><div><strong>${esc(errorTitle(x.error))}</strong><small>${esc(areaMeta(x.error))} · score ${x.error.score}</small></div><div class="hide-tablet"><small>LEMBROU / REFEZ</small><span>${esc(x.review.recall||'Sem anotação')}</span></div><div class="history-result ${x.review.result}">${resultLabel(x.review.result)}</div><div class="history-actions"><button class="tiny-btn primaryish" onclick="openReview('${x.error.id}')">Refazer</button><button class="tiny-btn" onclick="editPastReview('${x.error.id}',${x.index})">Corrigir</button><button class="history-delete-btn" type="button" title="Excluir esta revisão" onclick="deletePastReview('${x.error.id}',${x.index})"><svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14M9 7V5h6v2M8 10v7M12 10v7M16 10v7M7 7l1 13h8l1-13"/></svg><span>Excluir</span></button></div></div>`).join('')}</section>`).join(''); }
function renderCalendar(){
  const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth(); $('#calendarTitle').textContent=new Date(y,m,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'}); const first=new Date(y,m,1),start=new Date(y,m,1-first.getDay()),today=isoLocal(new Date()); let html='';
  for(let i=0;i<42;i++){ const d=new Date(start); d.setDate(start.getDate()+i); const ds=isoLocal(d); const items=data.errors.filter(e=>nextReview(e)===ds); const exam=ds===EXAM_DATES.first?'1º DIA · ENEM':ds===EXAM_DATES.second?'2º DIA · ENEM':''; html+=`<div class="calendar-day ${d.getMonth()!==m?'other':''} ${ds===today?'today':''} ${exam?'exam-day':''}"><strong>${d.getDate()}</strong>${exam?`<span class="exam-marker">${exam}</span>`:''}${items.slice(0,3).map(e=>`<span class="calendar-item ${scoreBand(e.score)} ${ds<=today?'due':''}" title="${esc(errorTitle(e))}">${esc(e.topic||errorTitle(e))}</span>`).join('')}${items.length>3?`<span class="calendar-item">+${items.length-3}</span>`:''}</div>`; }
  $('#calendarGrid').innerHTML=html;
}

function updateSubjectField(area,selected=''){
  const field=$('#subjectField'),select=$('#subject');
  if(SUBJECTS[area]){ field.classList.remove('hidden'); select.innerHTML='<option value="">Selecione</option>'+SUBJECTS[area].map(s=>`<option ${s===selected?'selected':''}>${s}</option>`).join(''); select.required=true; }
  else { field.classList.add('hidden'); select.required=false; select.innerHTML='<option value=""></option>'; select.value=''; }
  updateTopicField();
}
function updateTopicField(selected=''){
  const area=$('#area').value,subject=SUBJECTS[area]?$('#subject').value:area,list=topicList(area,subject),sel=$('#topic');
  if(!area){ sel.innerHTML='<option value="">Selecione a área primeiro</option>'; sel.disabled=true; }
  else if(SUBJECTS[area]&&!subject){ sel.innerHTML='<option value="">Selecione a disciplina primeiro</option>'; sel.disabled=true; }
  else { sel.disabled=false; sel.innerHTML='<option value="">Selecione o conteúdo</option>'+list.map(([name,inc])=>`<option value="${esc(name)}" ${name===selected?'selected':''}>${esc(name)} · ${String(inc).replace('.',',')}%</option>`).join(''); }
  updateScorePreview();
}
function updateScorePreview(){
  const area=$('#area').value,subject=SUBJECTS[area]?$('#subject').value:area,topic=$('#topic').value,difficulty=$('#difficulty').value,score=calculateScore(area,subject,topic,difficulty),gauge=$('#scoreGauge');
  if(score==null){ $('#scoreValue').textContent='—'; $('#scoreWord').textContent='Aguardando'; $('#scoreIncidence').textContent='Selecione o conteúdo'; gauge.style.setProperty('--score',50); gauge.style.setProperty('--gauge-color','#e3a008'); return; }
  const info=topicInfo(area,subject,topic); $('#scoreValue').textContent=score; $('#scoreWord').textContent=scoreBandLabel(score); $('#scoreIncidence').textContent=`Incidência histórica: ${String(info.raw).replace('.',',')}% · dificuldade ${difficultyLabel(difficulty).toLowerCase()}`; gauge.style.setProperty('--score',score); gauge.style.setProperty('--gauge-color',scoreColor(score)); $('#scoreHint').textContent=`1ª revisão em ${baseInterval(score)} dia${baseInterval(score)===1?'':'s'}. Revisões limitadas até ${fmtDate(examDateFor(area))}.`;
}
function openNew(){ $('#errorForm').reset(); $('#editId').value=''; $('#formTitle').textContent='Novo erro'; $('#deleteBtn').classList.add('hidden'); $('#difficulty').value='media'; updateSubjectField(''); updateScorePreview(); $('#errorDialog').showModal(); }
window.openEdit=function(id){ const e=data.errors.find(x=>x.id===id); if(!e)return; $('#editId').value=e.id; $('#formTitle').textContent='Editar erro'; $('#deleteBtn').classList.remove('hidden'); $('#source').value=e.source||'Simulado'; $('#sourceName').value=e.sourceName||''; $('#area').value=e.area||''; $('#questionNumber').value=e.questionNumber||''; $('#difficulty').value=e.difficulty||'media'; $('#microcontent').value=e.microcontent||''; $('#errorNote').value=e.errorNote||''; updateSubjectField(e.area,e.subject); updateTopicField(e.topic); updateScorePreview(); $('#errorDialog').showModal(); };
function saveForm(ev){ ev.preventDefault(); const id=$('#editId').value,existing=data.errors.find(e=>e.id===id),area=$('#area').value,subject=SUBJECTS[area]?$('#subject').value:area,topic=$('#topic').value,difficulty=$('#difficulty').value,score=calculateScore(area,subject,topic,difficulty); if(score==null)return; const e={id:id||uid(),createdAt:existing?.createdAt||Date.now(),createdDate:existing?.createdDate||isoLocal(new Date()),reviews:existing?.reviews||[],source:$('#source').value,sourceName:$('#sourceName').value.trim(),area,subject,questionNumber:$('#questionNumber').value.trim(),topic,microcontent:$('#microcontent').value.trim(),difficulty,errorNote:$('#errorNote').value.trim(),score}; if(existing)Object.assign(existing,e); else data.errors.push(e); saveData(); $('#errorDialog').close(); toast(existing?'Erro atualizado.':'Erro registrado.'); }
function deleteCurrent(){ const id=$('#editId').value; if(id&&confirm('Excluir este registro e todo o histórico de revisões dele?')){data.errors=data.errors.filter(e=>e.id!==id);saveData();$('#errorDialog').close();toast('Registro excluído.');} }
window.deleteErrorById=function(id){ const e=data.errors.find(x=>x.id===id); if(!e)return; if(confirm(`Excluir o erro “${errorTitle(e)}” e todo o histórico de revisões dele?`)){data.errors=data.errors.filter(x=>x.id!==id);saveData();toast('Registro excluído.');} };
window.openReview=function(id){ const e=data.errors.find(x=>x.id===id); if(!e)return; $('#reviewId').value=id; $('#reviewTitle').textContent=errorTitle(e); $('#reviewRecall').value=''; $('#reviewResult').value='dominei'; $('#lessonReveal').classList.add('hidden'); $('#reviewSummary').innerHTML=`<h3>${esc(errorTitle(e))}</h3><p>${esc(areaMeta(e))} · <strong>score ${e.score}</strong></p><p><strong>Questão:</strong> ${esc(e.sourceName||e.source)}${e.questionNumber?' · Q'+esc(e.questionNumber):''}</p><p><strong>Próxima lógica:</strong> intervalo calculado pelo score e pelo resultado desta revisão.</p>`; $('#reviewDialog').showModal(); };
function completeReview(ev){ ev.preventDefault(); const e=data.errors.find(x=>x.id===$('#reviewId').value); if(!e)return; const result=$('#reviewResult').value; e.reviews=e.reviews||[]; e.reviews.push({date:isoLocal(new Date()),result,recall:$('#reviewRecall').value.trim()}); saveData(); $('#reviewDialog').close(); toast('Revisão registrada.'); }
function revealLesson(){ const e=data.errors.find(x=>x.id===$('#reviewId').value); if(!e)return; const box=$('#lessonReveal'); box.innerHTML=`<strong>Anotação do erro</strong><br>${esc(e.errorNote||'Sem anotação.').replace(/\n/g,'<br>')}`; box.classList.remove('hidden'); }
window.editPastReview=function(errorId,index){ const e=data.errors.find(x=>x.id===errorId),r=e?.reviews?.[index]; if(!e||!r)return; $('#historyErrorId').value=errorId; $('#historyReviewIndex').value=index; $('#historyReviewDate').value=r.date; $('#historyReviewResult').value=r.result; $('#historyReviewRecall').value=r.recall||''; $('#historyEditDialog').showModal(); };
function savePastReview(ev){ ev.preventDefault(); const e=data.errors.find(x=>x.id===$('#historyErrorId').value),index=Number($('#historyReviewIndex').value); if(!e||!e.reviews?.[index])return; e.reviews[index]={...e.reviews[index],date:$('#historyReviewDate').value,result:$('#historyReviewResult').value,recall:$('#historyReviewRecall').value.trim()}; e.reviews.sort((a,b)=>a.date.localeCompare(b.date)); saveData(); $('#historyEditDialog').close(); toast('Revisão passada atualizada.'); }
window.deletePastReview=function(errorId,index){ const e=data.errors.find(x=>x.id===errorId),r=e?.reviews?.[index]; if(!e||!r)return; if(confirm(`Excluir a revisão de ${fmtDate(r.date)}? O erro continuará no caderno.`)){e.reviews.splice(index,1);saveData();toast('Revisão excluída do histórico.');} };
function clearAllHistory(){ const total=data.errors.reduce((n,e)=>n+(e.reviews?.length||0),0); if(!total){toast('O histórico já está vazio.');return;} if(confirm(`Excluir as ${total} revisões do histórico? Os erros não serão apagados.`)){data.errors.forEach(e=>e.reviews=[]);saveData();toast('Histórico excluído.');} }
function friendlyAuthError(message=''){
  const m=message.toLowerCase();
  if(m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if(m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if(m.includes('user already registered')) return 'Já existe uma conta com este e-mail.';
  if(m.includes('password')) return 'A senha precisa ter pelo menos 8 caracteres.';
  return message || 'Não foi possível concluir a autenticação.';
}
function showAuthMessage(message,type='error'){
  const el=$('#authMessage'); el.textContent=message; el.className='auth-message show '+type;
}
function clearAuthMessage(){ const el=$('#authMessage'); el.textContent=''; el.className='auth-message'; }
function setAuthTab(mode){
  $('#tabLogin').classList.toggle('active',mode==='login'); $('#tabSignup').classList.toggle('active',mode==='signup');
  $('#loginForm').hidden=mode!=='login'; $('#signupForm').hidden=mode!=='signup'; clearAuthMessage();
}
function hasMeaningfulLegacy(obj){
  if(!obj) return false;
  if((obj.errors||[]).length) return true;
  if((obj.contentFolders||[]).some(f=>(f.notes||[]).length)) return true;
  const defaults=defaultContentFolders().map(f=>`${f.area}|${f.title}`).sort().join('::');
  const current=(obj.contentFolders||[]).map(f=>`${f.area}|${f.title}`).sort().join('::');
  return current!==defaults;
}
function updateProfileUI(user){
  const name=(user.user_metadata?.display_name||user.email?.split('@')[0]||'Usuário').trim();
  const initial=(name[0]||'K').toUpperCase();
  $('#profileName').textContent=name; $('#profileAvatar').textContent=initial; $('#accountAvatar').textContent=initial; $('#accountName').textContent=name; $('#accountEmail').textContent=user.email||'—';
}
async function loadUserState(user){
  cloudHydrated=false; setSyncState('busy','Carregando seu caderno...');
  const local=loadLocalDataForUser(user.id);
  try{
    const {data:row,error}=await db.from(CLOUD_TABLE).select('payload,updated_at').eq('user_id',user.id).maybeSingle();
    if(error) throw error;
    if(row?.payload){
      data=normalizeData(row.payload);
    }else{
      let initial=local;
      const migrationKey=LEGACY_STORAGE_KEY+'_migration_done';
      if(!initial && !localStorage.getItem(migrationKey)){
        const legacy=loadLegacyData();
        if(hasMeaningfulLegacy(legacy)){
          const importOld=confirm('Encontrei dados da versão anterior neste navegador. Deseja importar esses erros, pastas e notas para esta conta?');
          if(importOld) initial=legacy;
        }
        localStorage.setItem(migrationKey,user.id);
      }
      data=normalizeData(initial||freshData());
      const {error:insertError}=await db.from(CLOUD_TABLE).upsert({user_id:user.id,payload:data,updated_at:new Date().toISOString()},{onConflict:'user_id'});
      if(insertError) throw insertError;
    }
    try{localStorage.setItem(USER_STORAGE_PREFIX+user.id,JSON.stringify(data));}catch{}
    cloudHydrated=true; setSyncState('ok','Sincronizado com Supabase'); renderAll();
  }catch(err){
    console.error(err); data=normalizeData(local||freshData()); cloudHydrated=true; renderAll();
    setSyncState('error','Supabase ainda não preparado — usando cópia local');
  }
}
async function enterApp(user){
  if(loadingUserId===user.id) return;
  loadingUserId=user.id;
  try{ currentUser=user; updateProfileUI(user); $('#authGate').hidden=true; $('#appWrap').hidden=false; $('#authLoading').hidden=true; await loadUserState(user); }
  finally{ loadingUserId=null; }
}
function showAuthGate(){
  currentUser=null; cloudHydrated=false; $('#appWrap').hidden=true; $('#authLoading').hidden=true; $('#authGate').hidden=false; setAuthTab('login');
}
async function initAuth(){
  const cfg=window.KANT_CONFIG||{};
  if(!window.supabase?.createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY){
    $('#authLoading').hidden=true; $('#authGate').hidden=false; showAuthMessage('A conexão com o Supabase não foi configurada.','error'); return;
  }
  db=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  db.auth.onAuthStateChange((event,session)=>{
    if(event==='SIGNED_OUT'){ showAuthGate(); return; }
    if(session?.user && (!currentUser || currentUser.id!==session.user.id)) setTimeout(()=>enterApp(session.user),0);
  });
  try{
    const {data:{session},error}=await db.auth.getSession(); if(error) throw error;
    if(session?.user) await enterApp(session.user); else showAuthGate();
  }catch(err){ console.error(err); showAuthGate(); showAuthMessage('Não foi possível conectar ao Supabase agora.','error'); }
}

function switchView(v){ $$('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.view===v)); $$('.view').forEach(x=>x.classList.remove('active')); $('#view-'+v).classList.add('active'); window.scrollTo({top:0,behavior:'smooth'}); }

$$('.nav-link').forEach(btn=>btn.addEventListener('click',()=>switchView(btn.dataset.view))); $$('[data-go]').forEach(btn=>btn.addEventListener('click',()=>switchView(btn.dataset.go)));
$('#newErrorBtn').addEventListener('click',openNew); $('#newErrorBtn2').addEventListener('click',openNew); $('#closeDialog').addEventListener('click',()=>$('#errorDialog').close()); $('#cancelBtn').addEventListener('click',()=>$('#errorDialog').close()); $('#errorForm').addEventListener('submit',saveForm); $('#deleteBtn').addEventListener('click',deleteCurrent);
$('#area').addEventListener('change',e=>updateSubjectField(e.target.value)); $('#subject').addEventListener('change',()=>updateTopicField()); $('#topic').addEventListener('change',updateScorePreview); $('#difficulty').addEventListener('change',updateScorePreview);
$('#closeReview').addEventListener('click',()=>$('#reviewDialog').close()); $('#cancelReview').addEventListener('click',()=>$('#reviewDialog').close()); $('#reviewForm').addEventListener('submit',completeReview); $('#showLessonBtn').addEventListener('click',revealLesson);
$('#closeHistoryEdit').addEventListener('click',()=>$('#historyEditDialog').close()); $('#cancelHistoryEdit').addEventListener('click',()=>$('#historyEditDialog').close()); $('#historyEditForm').addEventListener('submit',savePastReview);
$('#closeTopicDialog').addEventListener('click',()=>$('#topicDialog').close()); $('#cancelTopic').addEventListener('click',()=>$('#topicDialog').close()); $('#topicForm').addEventListener('submit',saveTopic);
$('#closeNoteDialog').addEventListener('click',()=>$('#noteDialog').close()); $('#cancelNote').addEventListener('click',()=>$('#noteDialog').close()); $('#noteForm').addEventListener('submit',saveNote); $('#deleteNoteBtn').addEventListener('click',deleteCurrentNote);
$('#clearContentBtn').addEventListener('click',clearAllContentFolders); $('#clearHistoryBtn').addEventListener('click',clearAllHistory);
$('#profileBtn').addEventListener('click',()=>$('#accountDialog').showModal()); $('#closeAccountDialog').addEventListener('click',()=>$('#accountDialog').close()); $('#closeAccountBtn').addEventListener('click',()=>$('#accountDialog').close()); $('#logoutBtn').addEventListener('click',async()=>{ $('#accountDialog').close(); if(db)await db.auth.signOut(); });
$('#tabLogin').addEventListener('click',()=>setAuthTab('login')); $('#tabSignup').addEventListener('click',()=>setAuthTab('signup'));
$('#loginForm').addEventListener('submit',async ev=>{ev.preventDefault();clearAuthMessage();const btn=$('#loginSubmit');btn.disabled=true;btn.textContent='Entrando...';try{const {data:authData,error}=await db.auth.signInWithPassword({email:$('#loginEmail').value.trim(),password:$('#loginPassword').value});if(error)throw error;if(authData.user)await enterApp(authData.user);}catch(err){showAuthMessage(friendlyAuthError(err.message));}finally{btn.disabled=false;btn.textContent='Entrar no KANT';}});
$('#signupForm').addEventListener('submit',async ev=>{ev.preventDefault();clearAuthMessage();const btn=$('#signupSubmit');btn.disabled=true;btn.textContent='Criando conta...';try{const redirect=location.protocol.startsWith('http')?location.origin+location.pathname:undefined;const options={data:{display_name:$('#signupName').value.trim()}};if(redirect)options.emailRedirectTo=redirect;const {data:authData,error}=await db.auth.signUp({email:$('#signupEmail').value.trim(),password:$('#signupPassword').value,options});if(error)throw error;if(authData.session&&authData.user)await enterApp(authData.user);else{showAuthMessage('Conta criada. Se a confirmação de e-mail estiver desativada no Supabase, faça login agora.','success');$('#signupForm').reset();}}catch(err){showAuthMessage(friendlyAuthError(err.message));}finally{btn.disabled=false;btn.textContent='Criar minha conta';}});
['searchInput','filterArea','filterScore'].forEach(id=>$('#'+id).addEventListener('input',renderErrors)); $('#clearTypeFilter').addEventListener('click',()=>{activeScoreFilter='';$('#filterScore').value='';renderScoreTabs();renderErrors();});
['historySearch','historyArea'].forEach(id=>$('#'+id).addEventListener('input',renderHistory));
$$('[data-review-filter]').forEach(btn=>btn.addEventListener('click',()=>{activeReviewFilter=btn.dataset.reviewFilter;$$('[data-review-filter]').forEach(b=>b.classList.toggle('active',b===btn));renderReviews();}));
$('#prevMonth').addEventListener('click',()=>{calendarCursor.setMonth(calendarCursor.getMonth()-1);renderCalendar();}); $('#nextMonth').addEventListener('click',()=>{calendarCursor.setMonth(calendarCursor.getMonth()+1);renderCalendar();});
$('#exportBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='kant-caderno-erros-backup.json';a.click();URL.revokeObjectURL(a.href);});
$('#importInput').addEventListener('change',ev=>{const f=ev.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const obj=JSON.parse(r.result);if(!Array.isArray(obj.errors))throw new Error();data=normalizeData(obj);saveData();toast('Backup importado.');}catch{alert('Arquivo de backup inválido.');}};r.readAsText(f);});
$('#todayLabel').textContent=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'});
initAuth();
