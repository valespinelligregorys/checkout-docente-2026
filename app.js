/* Check-out docente: la bitácora es local. El mapa anónimo usa Apps Script al configurarse. */
const $=s=>document.querySelector(s),app=$('#app');
const profiles={
 exploradora:{name:'La Exploradora',symbol:'🧭',short:'Abrís caminos y habilitás descubrimientos.',description:'Tu impulso pedagógico está en probar, preguntar y animarte a lo inesperado. Ves oportunidades de aprendizaje donde otras miradas encuentran obstáculos.',gift:'Llevá tu curiosidad al próximo ciclo sin sentir que cada propuesta debe ser una novedad.',playlist:[['Here Comes the Sun','The Beatles'],['Color esperanza','Diego Torres'],['Unwritten','Natasha Bedingfield']]},
 tejedora:{name:'La Tejedora',symbol:'🧶',short:'Hacés lugar para que los vínculos crezcan.',description:'Escuchás, conectás y sostenés la trama del equipo y de la sala. Tu aporte está en construir confianza y transformar lo compartido en posibilidad.',gift:'También podés dejarte acompañar: una red se construye en ambas direcciones.',playlist:[['Lean on Me','Bill Withers'],['Todo se transforma','Jorge Drexler'],['Count on Me','Bruno Mars']]},
 arquitecta:{name:'La Arquitecta',symbol:'📐',short:'Convertís ideas en experiencias con sentido.',description:'Tu manera de enseñar combina intención, organización y sensibilidad. Te gusta encontrar estructuras que sostengan la libertad de explorar.',gift:'Reservá un espacio para lo que no estaba en los planes: allí también ocurre la enseñanza.',playlist:[['A Sky Full of Stars','Coldplay'],['Beautiful Day','U2'],['Celebra la vida','Axel']]},
 observadora:{name:'La Observadora',symbol:'🔎',short:'Descubrís sentidos en los pequeños detalles.',description:'Tu mirada atenta registra procesos, escucha preguntas y vuelve sobre lo vivido. Reconocés avances que a menudo pasan inadvertidos.',gift:'Confiá en tu lectura de la experiencia y compartí lo que descubrís.',playlist:[['Vienna','Billy Joel'],['Al otro lado del río','Jorge Drexler'],['What a Wonderful World','Louis Armstrong']]}
};
const questions=[
 {station:'Lo que floreció',title:'Cuando pensás en este año, ¿qué escena vuelve primero?',subtitle:'Elegí la que más se acerca a tu experiencia.',options:[['exploradora','Una propuesta que tomó un rumbo inesperado y nos sorprendió.'],['tejedora','Un momento en el que el grupo se encontró de verdad.'],['arquitecta','Una idea que pudimos transformar en un proyecto valioso.'],['observadora','Un pequeño avance que reveló un gran recorrido.']],reflection:'Contá esa escena: ¿qué pasó y por qué fue significativa?'},
 {station:'Lo que floreció',title:'¿En qué sentís que creció más tu práctica?',options:[['observadora','En mirar y escuchar más profundamente a las infancias.'],['arquitecta','En diseñar experiencias con mayor intencionalidad.'],['exploradora','En animarme a cambiar lo previsto.'],['tejedora','En construir vínculos y acuerdos.']],reflection:'¿Qué decisión pedagógica tuya refleja ese crecimiento?'},
 {station:'Lo que nos desafió',title:'Frente a una situación compleja, ¿qué recurso te ayudó más?',options:[['tejedora','Conversar y construir respuestas con otras personas.'],['observadora','Observar antes de intervenir.'],['exploradora','Ensayar otra manera de hacer las cosas.'],['arquitecta','Reorganizar tiempos, espacios o propuestas.']],reflection:'¿Qué desafío persiste y merece ser pensado colectivamente?'},
 {station:'Lo que nos desafió',title:'¿Qué aprendiste de aquello que no salió como esperabas?',options:[['exploradora','Que cambiar de camino también enseña.'],['observadora','Que es importante leer el proceso y no solo el resultado.'],['arquitecta','Que planificar también implica revisar.'],['tejedora','Que pedir ayuda puede abrir posibilidades.']],reflection:'¿Qué pregunta te llevás abierta para seguir investigando en la práctica?'},
 {station:'Lo que construimos juntas',title:'¿Qué aporte reconocés en tu manera de estar en el equipo?',options:[['tejedora','Generar escucha, confianza y encuentro.'],['arquitecta','Organizar ideas y hacerlas posibles.'],['observadora','Aportar una mirada reflexiva sobre lo cotidiano.'],['exploradora','Invitar a ensayar nuevas posibilidades.']],reflection:'Reconocé un gesto concreto de una compañera que te haya acompañado este año.'},
 {station:'Lo que construimos juntas',title:'¿Qué condición institucional favoreció más tu trabajo?',options:[['arquitecta','Contar con acuerdos claros y tiempos para planificar.'],['tejedora','Sentirme acompañada por mis compañeras y referentes.'],['exploradora','Tener margen para proponer y experimentar.'],['observadora','Disponer de espacios para observar y reflexionar.']],reflection:'¿Qué aspecto del trabajo institucional sería importante revisar o fortalecer?'},
 {station:'Lo que sembramos',title:'Si pudieras llevar una intención al próximo año, ¿cuál sería?',options:[['exploradora','Explorar nuevas preguntas y formatos.'],['tejedora','Profundizar la colaboración y el cuidado mutuo.'],['observadora','Documentar mejor los procesos de aprendizaje.'],['arquitecta','Afinar la planificación y la evaluación.']],reflection:'Escribí un deseo pedagógico concreto para 2027.'},
 {station:'Lo que sembramos',title:'¿Qué necesitás para que esa intención pueda crecer?',options:[['observadora','Tiempo para detenerme y leer lo que sucede.'],['tejedora','Más espacios de intercambio genuino.'],['arquitecta','Organización, recursos y prioridades compartidas.'],['exploradora','Confianza para intentar y equivocarme.']],reflection:'¿Qué apoyo concreto te gustaría pedir al equipo directivo?'}
];
const state={screen:'home',index:0,choices:Array(8).fill(null),reflections:Array(8).fill(''),name:'',room:'',submissionId:null,confirmed:false,sharedPhrase:'',sharePhrase:false,mapData:null};
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CONFIG=window.CHECKOUT_CONFIG||{};
const API_URL=(CONFIG.appsScriptUrl||'').trim();
const ONLINE=true; // El jardín usa Firebase; Google Sheets deja de ser necesario.
const TEST_MODE=new URLSearchParams(location.search).get('modo')==='prueba';
const PRIORITIES={exploradora:'Explorar nuevas preguntas y formatos',tejedora:'Profundizar la colaboración y el cuidado mutuo',observadora:'Documentar los procesos de aprendizaje',arquitecta:'Afinar la planificación y la evaluación'};
let autoRefresh=null;
// v2: guardado local de cada decisión y texto, sin enviar datos personales.
const SAVE_KEY='checkout_docente_2026_borrador_v2';
let saveAvailable=true;
function persist(){
  try{localStorage.setItem(SAVE_KEY,JSON.stringify({version:2,updatedAt:new Date().toISOString(),index:state.index,choices:state.choices,reflections:state.reflections,name:state.name,room:state.room,submissionId:state.submissionId,confirmed:state.confirmed,sharedPhrase:state.sharedPhrase,sharePhrase:state.sharePhrase}));}
  catch(err){saveAvailable=false;}
  window.dispatchEvent(new CustomEvent('checkout:draft-changed'));
}
function restoreLocal(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);if(!raw)return false;
    const v=JSON.parse(raw);
    if(!v||!Array.isArray(v.choices)||v.choices.length!==8||!Array.isArray(v.reflections)||v.reflections.length!==8)return false;
    state.choices=v.choices.map(x=>Object.hasOwn(profiles,x)?x:null);
    state.reflections=v.reflections.map(x=>String(x||'').slice(0,1500));
    state.index=Math.max(0,Math.min(7,Number(v.index)||0));
    state.name=String(v.name||'').slice(0,80);state.room=String(v.room||'').slice(0,80);
    state.submissionId=v.submissionId||null;state.confirmed=!!v.confirmed;
    state.sharedPhrase=String(v.sharedPhrase||'').slice(0,160);state.sharePhrase=!!v.sharePhrase;
    return true;
  }catch(err){return false;}
}
function hasProgress(){return state.choices.some(Boolean)||state.reflections.some(Boolean)||state.name||state.room;}
function resume(){state.index=state.choices.findIndex(v=>!v);if(state.index<0)result();else question();}
function importBackup(file){
  if(!file)return;
  const reader=new FileReader();reader.onload=()=>{
    try{
      const v=JSON.parse(reader.result);
      if(v.type!=='checkout_docente_2026'||!Array.isArray(v.answers)||v.answers.length!==8)throw Error('Formato de bitácora no reconocido');
      state.choices=v.answers.map(a=>Object.hasOwn(profiles,a.choice)?a.choice:null);
      state.reflections=v.answers.map(a=>String(a.reflection||'').slice(0,1500));
      state.name=String(v.name||'').slice(0,80);state.room=String(v.room||'').slice(0,80);
      state.submissionId=null;state.confirmed=false;state.index=0;persist();resume();
      toast('Bitácora recuperada');
    }catch(err){alert('No se pudo importar. Elegí el archivo .json de la bitácora descargada.');}
  };reader.readAsText(file);
}
function bindRecovery(){
  const inp=$('#restoreBackup');if(inp)inp.onchange=e=>importBackup(e.target.files[0]);
  const b=$('#resume');if(b)b.onclick=resume;
  const reset=$('#startNew');if(reset)reset.onclick=()=>{
    if(!confirm('¿Empezar otro recorrido? Se reemplazará el borrador guardado en este dispositivo. Antes podés descargar tu bitácora si completaste las preguntas.'))return;
    Object.assign(state,{index:0,choices:Array(8).fill(null),reflections:Array(8).fill(''),name:'',room:'',submissionId:null,confirmed:false,sharedPhrase:'',sharePhrase:false});persist();intro();
  };
}
window.addEventListener('pagehide',persist);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')persist()});


const dateLabel=()=>new Intl.DateTimeFormat('es-AR',{day:'numeric',month:'long',year:'numeric'}).format(new Date());
function toast(s){const t=$('#toast');t.textContent=s;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400)}
function scrollTop(){window.scrollTo({top:0,behavior:'smooth'})}
function view(html){if(autoRefresh){clearInterval(autoRefresh);autoRefresh=null;}app.innerHTML=html;scrollTop()}
function home(){
  state.screen='home';
  const saved=hasProgress();
  const finished=state.choices.every(Boolean);
  const action=saved?(finished?'Volver a mi perfil y mis respuestas ↗':'Continuar donde lo dejé ↗'):'Comenzar mi check-out ↗';
  const recovery=saved?`<section class="panel no-print" id="recoveryPanel"><span class="eyebrow">✓ Tu recorrido está guardado</span><h3>${finished?'Tu recorrido está completo':'Podés continuar sin empezar de nuevo'}</h3><p>Encontramos tus respuestas guardadas en este navegador. No necesitás descargar ni buscar ningún archivo.</p><div class="buttons"><button class="btn" id="resume" type="button">${finished?'Ver mi perfil y bitácora →':'Continuar mi recorrido →'}</button><button class="btn secondary" id="startNew" type="button">Empezar uno nuevo</button></div><details><summary>¿Usás otro dispositivo o tenés una copia de respaldo?</summary><p class="micro">Si tenés una bitácora .json, podés importarla aquí. El guardado automático en este sitio funciona en este dispositivo y navegador; no se sincroniza todavía entre dispositivos.</p><label class="field-label" for="restoreBackup">Elegir una bitácora .json (opcional)</label><input type="file" id="restoreBackup" accept="application/json,.json"></details></section>`:
    `<section class="panel no-print" id="recoveryPanel"><span class="eyebrow">Tu recorrido</span><h3>Empezá a tu ritmo</h3><p>Las respuestas se guardarán automáticamente mientras avances. Si volvés desde este mismo navegador, vas a poder continuar sin archivos.</p><details><summary>¿Tenés una bitácora anterior para recuperar?</summary><label class="field-label" for="restoreBackup">Elegir archivo .json (opcional)</label><input type="file" id="restoreBackup" accept="application/json,.json"></details></section>`;
  view(`<section class="hero"><div><span class="eyebrow">Un recorrido para cerrar el ciclo</span><h1>Lo que<br><em>hicimos crecer.</em></h1><p class="lead">Cada año deja huellas: preguntas, hallazgos, vínculos y desafíos. Este es un espacio para mirar el camino recorrido y elegir qué queremos llevarnos.</p><div class="buttons"><button class="btn" id="start">${action}</button><button class="btn secondary" id="gotoMap">Nuestro jardín colectivo</button></div><p class="micro">15–20 minutos · 8 elecciones + reflexiones · un perfil pedagógico y su banda sonora</p></div><div class="illustration" aria-hidden="true"><div class="orbit"></div><span class="flower">🌼</span><span class="tiny top">mirar lo vivido ✳</span><span class="tiny bottom">sembrar lo que viene</span></div></section>${recovery}<section class="features"><div class="feature"><span class="icon">🌱</span><strong>Un recorrido propio</strong><p>Cuatro estaciones con preguntas para recuperar la experiencia cotidiana.</p></div><div class="feature"><span class="icon">🎧</span><strong>Un perfil y una playlist</strong><p>Un retrato lúdico de las fortalezas que aportás al equipo, acompañado de canciones.</p></div><div class="feature"><span class="icon">🪴</span><strong>Una lectura compartida</strong><p>El mapa se actualiza con los aportes anónimos que cada docente decida compartir.</p></div></section><p class="micro">Las reflexiones quedan en tu dispositivo y, si activás la sincronización con Google, también en un espacio privado en la nube. Solo si lo autorizás se compartirán tu perfil, la intención elegida y una frase voluntaria para el mapa público.</p>`);
  $('#start').onclick=()=>saved?resume():intro();
  $('#gotoMap').onclick=mapView;
  bindRecovery();
  if(!saveAvailable)$('#recoveryPanel').insertAdjacentHTML('beforeend','<p class="micro">Este navegador bloquea el guardado automático. Descargá tu bitácora como respaldo.</p>');
}
function intro(){state.screen='intro';view(`<section class="session"><span class="eyebrow">Antes de comenzar</span><h2>Una mirada situada, sin respuestas correctas.</h2><p>Este check-out no es una evaluación de desempeño ni un diagnóstico. Es una invitación a reconocer decisiones, tensiones y aprendizajes de la práctica docente.</p><label class="field-label" for="name">Tu nombre (opcional)</label><input type="text" id="name" maxlength="80" placeholder="¿Cómo querés firmar tu bitácora?" value="${escapeHTML(state.name)}"><label class="field-label" for="room">Sala / rol (opcional)</label><input type="text" id="room" maxlength="80" placeholder="Por ejemplo: Kinder 4 / docente de Música" value="${escapeHTML(state.room)}"><div class="callout">Los perfiles son metáforas pedagógicas: todas las personas podemos reconocer algo de cada uno. No se usarán para calificar ni comparar docentes.</div><div class="buttons"><button class="btn" id="next">Entrar al recorrido →</button><button class="btn secondary" id="back">Volver</button></div></section>`);$('#next').onclick=()=>{state.name=$('#name').value.trim();state.room=$('#room').value.trim();state.index=0;persist();question()};$('#name').oninput=e=>{state.name=e.target.value;persist()};$('#room').oninput=e=>{state.room=e.target.value;persist()};$('#back').onclick=home}
function question(){state.screen='question';const i=state.index,q=questions[i];const options=q.options.map(([key,label],j)=>`<button class="option ${state.choices[i]===key?'selected':''}" data-value="${key}" aria-pressed="${state.choices[i]===key}"><span class="number">${String(j+1).padStart(2,'0')}</span><span>${escapeHTML(label)}</span></button>`).join('');view(`<section class="session"><div class="progress" aria-label="Progreso: ${i+1} de 8">${questions.map((_,j)=>`<span class="${j<=i?'active':''}"></span>`).join('')}</div><span class="station-tag">${escapeHTML(q.station)}</span><p class="question-count">Estación ${Math.floor(i/2)+1} de 4 · pregunta ${i+1} de 8</p><h2>${escapeHTML(q.title)}</h2><p class="muted">${escapeHTML(q.subtitle||'Elegí la respuesta con la que más te identificás hoy.')}</p><div class="options">${options}</div><label class="field-label" for="reflection">${escapeHTML(q.reflection)}</label><p class="field-hint">Respuesta libre. Podés escribir una frase o desarrollar una reflexión.</p><textarea id="reflection" maxlength="1500" placeholder="Escribí acá…">${escapeHTML(state.reflections[i])}</textarea><div class="step-footer"><button class="btn secondary" id="back">← Anterior</button><button class="btn" id="next" ${!state.choices[i]?'disabled':''}>${i===7?'Descubrir mi perfil ✳':'Continuar →'}</button></div></section>`);document.querySelectorAll('.option').forEach(b=>b.onclick=()=>{state.choices[i]=b.dataset.value;persist();document.querySelectorAll('.option').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b))});$('#next').disabled=false});$('#reflection').oninput=e=>{state.reflections[i]=e.target.value;persist()};$('#back').onclick=()=>{if(i===0)intro();else{state.index--;persist();question()}};$('#next').onclick=()=>{state.reflections[i]=$('#reflection').value;persist();if(i<7){state.index++;persist();question()}else result()}}
function calculate(choices){const counts=Object.fromEntries(Object.keys(profiles).map(k=>[k,0]));choices.forEach(c=>{if(counts[c]!==undefined)counts[c]++});const priority=['exploradora','tejedora','arquitecta','observadora'];const sorted=priority.sort((a,b)=>counts[b]-counts[a]);return{key:sorted[0],counts,secondary:sorted[1]}}
function payload(){const r=calculate(state.choices);return{type:'checkout_docente_2026',version:1,createdAt:new Date().toISOString(),name:state.name,room:state.room,profile:r.key,counts:r.counts,answers:questions.map((q,i)=>({station:q.station,question:q.title,choice:state.choices[i],reflection:state.reflections[i]}))}}
function download(){const name=(state.name||'docente').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9-]+/g,'-').toLowerCase().slice(0,40);const blob=new Blob([JSON.stringify(payload(),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`checkout-2026-${name}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);toast('Bitácora descargada')}
// PDF autónomo: no necesita cargar bibliotecas externas ni enviar respuestas a terceros.
function pdfLatin1(s){
  const replacements={'\u2018':"'",'\u2019':"'",'\u201c':'"','\u201d':'"','\u2013':'-','\u2014':'-',
    '\u2022':'-','\u2026':'...','\u00a0':' ','\u20ac':'EUR','\u2014':'-'};
  return String(s??'').replace(/[\u2018-\u2022\u2026\u00a0\u20ac]/g,c=>replacements[c]||'')
    .replace(/[\u{10000}-\u{10FFFF}]/gu,'').replace(/[^\u0020-\u00ff\n]/g,' ');
}
function makePDFBlob(){
  // Bitácora editorial V3, creada enteramente en el navegador.
  // Mantiene las respuestas locales: este generador no las envía a ningún servidor.
  const W=595,H=842,L=48,R=48,U=W-L-R;
  const C={forest:[.141,.278,.212],moss:[.325,.451,.365],ink:[.137,.231,.188],paper:[.98,.969,.941],sage:[.898,.922,.867],clay:[.784,.459,.353],gold:[.851,.706,.420],muted:[.431,.475,.431],line:[.847,.875,.827],white:[1,1,1]};
  const rgb=k=>(C[k]||C.ink).map(n=>n.toFixed(3)).join(' ');
  const esc=s=>'('+pdfLatin1(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)')+')';
  const pages=[];let commands=[];
  const put=s=>commands.push(s);
  const rectangle=(x,y,w,h,col)=>put(rgb(col)+' rg '+x.toFixed(2)+' '+y.toFixed(2)+' '+w.toFixed(2)+' '+h.toFixed(2)+' re f');
  const circle=(x,y,r,col)=>{const k=.55228475*r;put(rgb(col)+' rg '+(x+r)+' '+y+' m '+(x+r)+' '+(y+k)+' '+(x+k)+' '+(y+r)+' '+x+' '+(y+r)+' c '+(x-k)+' '+(y+r)+' '+(x-r)+' '+(y+k)+' '+(x-r)+' '+y+' c '+(x-r)+' '+(y-k)+' '+(x-k)+' '+(y-r)+' '+x+' '+(y-r)+' c '+(x+k)+' '+(y-r)+' '+(x+r)+' '+(y-k)+' '+(x+r)+' '+y+' c f');};
  const line=(x1,y1,x2,y2,col='line',width=.8)=>put(rgb(col)+' RG '+width+' w '+x1+' '+y1+' m '+x2+' '+y2+' l S');
  const bezier=(x1,y1,x2,y2,x3,y3,x4,y4,col='moss',weight=1.8)=>put(rgb(col)+' RG '+weight+' w '+x1+' '+y1+' m '+x2+' '+y2+' '+x3+' '+y3+' '+x4+' '+y4+' c S');
  const txt=(s,x,y,size=10,color='ink',font='F1')=>put(rgb(color)+' rg BT /'+font+' '+size+' Tf 1 0 0 1 '+x.toFixed(2)+' '+y.toFixed(2)+' Tm '+esc(s)+' Tj ET');
  const wrap=(s,size,maxWidth,font='F1')=>{
    // Conservative metrics prevent long words and paragraphs from running past the margin.
    const factor=font==='F3'?.54:(font==='F2'?.54:.52);
    const out=[];for(const para of pdfLatin1(s).replace(/\r/g,'').split('\n')){
      if(!para.trim()){out.push('');continue;}
      let str='';for(let word of para.split(/\s+/)){
        if(!word)continue;
        if(str && (str+' '+word).length*size*factor>maxWidth){out.push(str);str='';}
        while(word.length*size*factor>maxWidth){const n=Math.max(1,Math.floor(maxWidth/(size*factor)));if(str){out.push(str);str='';}out.push(word.slice(0,n));word=word.slice(n);}
        str+=(str?' ':'')+word;
      }out.push(str);
    }return out;
  };
  const multi=(s,x,y,maxWidth,size=11,leading=17,col='ink',font='F1')=>{
    const ls=wrap(s,size,maxWidth,font);for(const t of ls){if(t)txt(t,x,y,size,col,font);y-=leading;}return y;
  };
  const motif=(n,x,y,scale=1)=>{
    // Four distinct vector signatures: sprout, detour, network, seeds.
    circle(x,y,54*scale,'sage');
    if(n===1){bezier(x-8*scale,y-30*scale,x+8*scale,y-6*scale,x-10*scale,y+14*scale,x+3*scale,y+36*scale,'moss',2);circle(x-13*scale,y+12*scale,12*scale,'moss');circle(x+12*scale,y+27*scale,10*scale,'moss');circle(x+3*scale,y+43*scale,4*scale,'gold');}
    else if(n===2){bezier(x-34*scale,y-24*scale,x-8*scale,y-45*scale,x+16*scale,y+11*scale,x-6*scale,y+9*scale,'clay',2.8);bezier(x-6*scale,y+9*scale,x-25*scale,y+23*scale,x+15*scale,y+43*scale,x+32*scale,y+26*scale,'clay',2.8);circle(x-34*scale,y-24*scale,5*scale,'forest');circle(x-6*scale,y+9*scale,5*scale,'forest');circle(x+32*scale,y+26*scale,5*scale,'forest');}
    else if(n===3){const p=[[-31,5],[-8,30],[25,14],[11,-25],[-24,-25]].map(a=>[x+a[0]*scale,y+a[1]*scale]);for(const [a,b] of [[0,1],[1,2],[2,3],[3,4],[4,0],[1,3],[0,2]])line(...p[a],...p[b],'moss',1.7);p.forEach((q,i)=>circle(q[0],q[1],6*scale,i%2?'clay':'forest'));}
    else {for(const [dx,dy,r,k] of [[-22,-7,7,'clay'],[-2,22,6,'gold'],[22,-15,8,'forest']])circle(x+dx*scale,y+dy*scale,r*scale,k);bezier(x+1*scale,y-35*scale,x-8*scale,y-8*scale,x+9*scale,y+12*scale,x+6*scale,y+41*scale,'moss',1.8);}
  };
  const bottom=()=>{if(commands.length){pages.push(commands);commands=[];}};
  const header=(label='BITÁCORA DOCENTE  ·  2026')=>{
    rectangle(0,0,W,H,'paper');rectangle(0,H-10,W,10,'forest');
    txt('LO QUE HICIMOS CRECER',L,H-52,9,'forest','F2');txt(label,W-235,H-52,8.5,'muted');line(L,H-63,W-R,H-63);
  };
  const profile=profiles[calculate(state.choices).key];
  const secondary=profiles[calculate(state.choices).secondary];
  const stationNames=['Lo que floreció','Lo que nos desafió','Lo que construimos juntas','Lo que sembramos'];
  const stationSubs=['Volver a las escenas que nos transformaron.','Escuchar lo incierto también es aprender.','Un año también se escribe en plural.','Lo que hoy dejamos abierto puede crecer mañana.'];
  const stationAccents=['gold','clay','moss','gold'];
  const choices=questions.map((q,i)=>q.options.find(pair=>pair[0]===state.choices[i])?.[1]||'Sin elección registrada');
  const answers=questions.map((q,i)=>String(state.reflections[i]||'').trim()||'(Sin reflexión escrita)');
  // Solo frases completas y literales: nunca cortar una idea con puntos suspensivos.
  // Si ninguna unidad de sentido cabe en el destacado, se omite la cita.
  const excerpt=(s,max=67)=>{const clean=String(s||'').replace(/\s+/g,' ').trim();if(!clean)return '';
    if(clean.length<=max)return clean;let cut=clean.slice(0,max);const pos=cut.lastIndexOf(' ');if(pos>=max*.6)cut=cut.slice(0,pos);return cut+'...';};
  const editorialQuote=(source,width=U-40,font=13.3)=>{
    const clean=String(source||'').replace(/\s+/g,' ').trim();
    if(!clean || clean==='(Sin reflexión escrita)')return '';
    const candidates=[];
    const add=(value,priority)=>{
      const v=String(value||'').trim().replace(/^[«“\s]+|[»”\s]+$/g,'');
      if(!v||v.endsWith('...')||v.endsWith('…'))return;
      const words=v.match(/[\p{L}\p{N}]+/gu)||[];
      if(words.length<3||words.length>23)return;
      if(wrap('«'+v+'»',font,width,'F4').length>2)return;
      if(!candidates.some(x=>x.text===v))candidates.push({text:v,priority});
    };
    // Una conclusión autónoma introducida por estos conectores conserva
    // palabras originales, sin atribuir a la docente una reformulación ajena.
    for(const match of clean.matchAll(/(?:entendiendo|comprendiendo|reconociendo)\s+que\s+([^,;.!?]+[.!?]?)/gi))add(match[1],0);
    for(const sentence of clean.split(/(?<=[.!?])\s+/)){
      add(sentence,1);
      for(const clause of sentence.split(/;\s*|:\s*/))add(clause,2);
    }
    candidates.sort((a,b)=>a.priority-b.priority||a.text.length-b.text.length);
    return candidates.length?candidates[0].text:'';
  };
  // Portada: esta página tiene composición propia, como la vista previa V3.
  rectangle(0,0,W,H,'paper');rectangle(0,H-363,W,363,'forest');
  circle(476,H-107,90,'moss');circle(517,H-215,45,'gold');circle(391,H-268,25,'clay');
  bezier(483,H-326,466,H-275,486,H-265,484,H-238,'sage',2);
  txt('CHECK-OUT DOCENTE   /   2026',L,H-61,10,'sage','F2');
  txt('Lo que',L,H-144,42,'white','F3');txt('hicimos crecer',L,H-198,36,'white','F3');
  rectangle(L,H-225,92,4,'gold');txt('Una bitácora para volver sobre lo vivido',L,H-270,12,'white');txt('y reconocer aquello que todavía puede crecer.',L,H-289,12,'white');
  let yy=H-406;txt('BITÁCORA PERSONAL DE CIERRE',L,yy,9,'moss','F2');
  yy-=37;yy=multi(state.name||'Mi bitácora personal',L,yy,U,24,29,'forest','F3')-5;
  if(state.room)yy=multi(state.room,L,yy,U,11,15,'muted')-5;
  line(L,yy-10,W-R,yy-10);yy-=41;
  txt('MI PERFIL PEDAGÓGICO',L,yy,9,'moss','F2');yy-=32;
  txt(profile.name,L,yy,22,'forest','F3');yy-=29;
  yy=multi(profile.short,L,yy,U,10.5,15,'forest','F2')-3;
  yy=multi(profile.description,L,yy,U,9.5,14,'ink')-7;
  const sensibil='También reconozco una sensibilidad '+secondary.name.toLowerCase().replace('la ','')+'.';
  yy=multi(sensibil,L,yy,U,9.3,14,'muted','F4');
  // Playlist placed in the lower part of the cover, without losing the profile section.
  const playlistTop=174;
  const coverPlaylist=yy>=playlistTop+1;
  if(coverPlaylist){
    line(L,playlistTop,W-R,playlistTop);txt('MI BANDA SONORA',L,155,9,'moss','F2');
    for(let i=0;i<profile.playlist.length;i++){
      const x=L+i*174;rectangle(x,76,164,63,i%2?'sage':'white');txt(('0'+(i+1)).slice(-2),x+12,119,8,'clay','F2');
      const song=profile.playlist[i];const title=wrap(song[0],9.3,146,'F2');
      txt(title[0]||'',x+12,103,9.3,'forest','F2');txt(excerpt(song[1],25),x+12,87,8,'muted');
    }
  }
  bottom();
  if(!coverPlaylist){
    // Optional playlist page protects long names and roles from overlapping the cover.
    header();motif(1,W-117,H-175,1);
    txt('MI BANDA SONORA',L,H-124,10,'moss','F2');
    txt('Tres canciones para seguir creciendo',L,H-167,23,'forest','F3');
    profile.playlist.forEach((song,i)=>{const cy=H-240-i*100;rectangle(L,cy-58,U,74,i%2?'sage':'white');
      txt(('0'+(i+1)).slice(-2),L+14,cy-6,11,'clay','F2');
      txt(song[0],L+55,cy-4,13,'forest','F2');txt(song[1],L+55,cy-26,10,'muted');});
    bottom();
  }
  // Each station occupies at least a full page. Longer responses get true continuation pages.
  const stationPage=(k,continuation=false)=>{
    header(continuation?'ESTACIÓN '+k+'  ·  CONTINUACIÓN':'BITÁCORA DOCENTE  ·  2026');
    rectangle(0,136,9,H-325,stationAccents[k-1]);
    if(!continuation){
      motif(k,W-123,H-145,1);
      circle(L+19,H-105,18,'sage');txt('0'+k,L+8,H-110,10,'forest','F2');
      txt('ESTACIÓN '+('0'+k).slice(-2),L+45,H-102,9,'clay','F2');
      txt(stationNames[k-1],L+45,H-137,25,'forest','F3');
      txt(stationSubs[k-1],L+46,H-162,10,'muted','F4');
      line(L,H-184,W-R,H-184);
      return H-219;
    }
    txt(stationNames[k-1]+'  /  continuación',L,H-111,18,'forest','F3');line(L,H-128,W-R,H-128);
    return H-165;
  };
  // Text cards split at safe line boundaries; header/question/choice stay together.
  let activeK=1,py=0;
  const stationNewPage=(k,cont)=>{bottom();activeK=k;py=stationPage(k,cont);};
  const ensure=(min,k)=>{if(py-min<87)stationNewPage(k,true);};
  const responseBlock=(k,qIndex)=>{
    const q=questions[qIndex],n=qIndex+1;
    const title=wrap(q.title,13.2,U-43,'F2');
    const opt=wrap(choices[qIndex],10.4,U-35);
    const questionPrompt=wrap(q.reflection,10.5,U,'F2');
    const overhead=title.length*18+19+(27+opt.length*15)+16+questionPrompt.length*16+12;
    ensure(overhead+62,k);
    txt(('0'+n).slice(-2),L,py,14,'clay','F2');
    let cursor=py;for(const t of title){txt(t,L+38,cursor,13.2,'forest','F2');cursor-=18;}
    py=cursor-16;
    const badgeH=27+opt.length*15;
    rectangle(L,py-badgeH+13,U,badgeH,'sage');rectangle(L,py-badgeH+13,4,badgeH,'moss');
    txt('MI ELECCIÓN',L+16,py,8,'forest','F2');
    opt.forEach((t,j)=>txt(t,L+16,py-17-j*15,10.4,'ink'));
    py-=badgeH+16;
    for(const t of questionPrompt){txt(t,L,py,10.5,'moss','F2');py-=16;}py-=10;
    const ls=wrap(answers[qIndex],11,U-42,'F3');
    let cursorIndex=0;
    while(cursorIndex<ls.length){
      if(py<130)stationNewPage(k,true);
      const canFit=Math.floor((py-105-25)/17);
      if(canFit<1){stationNewPage(k,true);continue;}
      const slice=ls.slice(cursorIndex,cursorIndex+canFit);
      const bh=slice.length*17+25;
      rectangle(L,py-bh+9,U,bh,'white');rectangle(L,py-bh+9,4,bh,'gold');
      slice.forEach((t,j)=>{if(t)txt(t,L+18,py-16-j*17,11,'ink','F3');});
      py-=bh+16;cursorIndex+=slice.length;
    }
    py-=15;
  };
  for(let k=1;k<=4;k++){
    stationNewPage(k,false);
    for(let j=(k-1)*2;j<k*2;j++){
      responseBlock(k,j);
      if(j%2===0 && py>100)line(L,py+5,W-R,py+5,'line');
    }
    // Cita fiel y autosuficiente, tomada de cualquiera de las dos reflexiones.
    // Omitirla si no hay fragmento apropiado o si la página no tiene aire.
    const phrase=editorialQuote(answers[k*2-2])||editorialQuote(answers[k*2-1]);
    if(phrase && py>185){
      rectangle(L,94,U,75,'sage');rectangle(L,94,5,75,stationAccents[k-1]);
      txt('UNA HUELLA DE ESTA ESTACIÓN',L+18,145,8,'moss','F2');
      const quoteLines=wrap('«'+phrase+'»',13.3,U-40,'F4');
      let qy=122;for(const q of quoteLines.slice(0,2)){txt(q,L+18,qy,13.3,'forest','F4');qy-=18;}
    }
  }
  bottom();
  // Autonomous final page: a composed ending, not leftover space below Question 8.
  rectangle(0,0,W,H,'paper');rectangle(0,H-12,W,12,'forest');
  circle(W-75,H-111,89,'sage');circle(W-150,H-115,21,'gold');circle(W-50,H-231,22,'clay');
  bezier(W-97,H-241,W-115,H-178,W-74,H-176,W-91,H-135,'moss',2.1);
  txt('CHECK-OUT DOCENTE  /  2026',L,H-58,9.5,'moss','F2');
  txt('Una huella',L,H-152,35,'forest','F3');
  txt('para seguir creciendo',L,H-197,29,'forest','F3');
  rectangle(L,H-220,91,3,'gold');
  multi('Cerrar un ciclo no es dejarlo atrás: es reconocer qué permanece y qué deseamos seguir cultivando.',L,H-254,380,12,19,'ink');
  rectangle(L,216,U,282,'white');
  txt('DE ESTA BITÁCORA ME LLEVO',L+20,464,9,'moss','F2');
  txt(profile.name,L+20,424,24,'forest','F3');
  multi(profile.short,L+20,399,U-40,10.3,15,'muted');
  line(L+20,379,W-R-20,379);
  txt('UNA INTENCIÓN PARA 2027',L+20,352,9,'clay','F2');
  const intent=wrap(choices[6],14.7,U-40,'F4').slice(0,2);
  intent.forEach((t,i)=>txt(t,L+20,326-i*18,14.7,'forest','F4'));
  // El cierre elige una idea completa del recorrido. Si ninguna es adecuada,
  // ofrece una invitación editorial sin fingir que es una cita de la docente.
  const closing=editorialQuote(answers[2],U-40,13.5)
    ||[0,1,3,4,5,6,7].map(i=>editorialQuote(answers[i],U-40,13.5)).find(Boolean)||'';
  txt(closing?'UNA FRASE QUE DEJA HUELLA':'PARA SEGUIR CULTIVANDO',L+20,279,9,'moss','F2');
  const closingLines=wrap(closing?'«'+closing+'»':'Volver sobre lo vivido también nos permite imaginar lo que viene.',13.5,U-40,'F4');
  closingLines.forEach((t,i)=>txt(t,L+20,255-i*16,13.5,'forest','F4'));
  for(let k=1;k<=4;k++)motif(k,91+(k-1)*136,153,.48);
  line(L,82,W-R,82);txt('Estas reflexiones son personales; no se publican en el jardín colectivo.',L,63,8.8,'muted','F4');
  bottom();
  // Foliation and fully self-contained PDF (base-14 PDF fonts; no external JS libraries).
  pages.forEach((page,i)=>{
    page.push(rgb('line')+' RG .7 w '+L+' 46 m '+(W-R)+' 46 l S');
    page.push(rgb('muted')+' rg BT /F1 7.7 Tf 1 0 0 1 '+L+' 28 Tm '+esc('LO QUE HICIMOS CRECER  /  BITÁCORA PERSONAL')+' Tj ET');
    page.push(rgb('forest')+' rg BT /F2 9 Tf 1 0 0 1 '+(W-R-36)+' 28 Tm '+esc(String(i+1).padStart(2,'0')+' / '+String(pages.length).padStart(2,'0'))+' Tj ET');
  });
  const objs=[];const obj=s=>{objs.push(s);return objs.length;};
  const catalog=obj(''),root=obj('');
  const f1=obj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const f2=obj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const f3=obj('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>');
  const f4=obj('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic /Encoding /WinAnsiEncoding >>');
  const kids=[];
  for(const p of pages){const stream=p.join('\n')+'\n';const sid=obj('<< /Length '+stream.length+' >>\nstream\n'+stream+'endstream');
    const id=obj('<< /Type /Page /Parent '+root+' 0 R /MediaBox [0 0 '+W+' '+H+'] /Resources << /Font << /F1 '+f1+' 0 R /F2 '+f2+' 0 R /F3 '+f3+' 0 R /F4 '+f4+' 0 R >> >> /Contents '+sid+' 0 R >>');kids.push(id+' 0 R');}
  objs[catalog-1]='<< /Type /Catalog /Pages '+root+' 0 R >>';
  objs[root-1]='<< /Type /Pages /Count '+kids.length+' /Kids ['+kids.join(' ')+'] >>';
  const chunks=['%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'];let size=chunks[0].length;const offset=[0];
  for(let i=0;i<objs.length;i++){offset.push(size);const part=(i+1)+' 0 obj\n'+objs[i]+'\nendobj\n';chunks.push(part);size+=part.length;}
  let xref='xref\n0 '+(objs.length+1)+'\n0000000000 65535 f \n';
  for(const n of offset.slice(1))xref+=String(n).padStart(10,'0')+' 00000 n \n';
  xref+='trailer\n<< /Size '+(objs.length+1)+' /Root '+catalog+' 0 R >>\nstartxref\n'+size+'\n%%EOF';
  chunks.push(xref);
  return new Blob([Uint8Array.from(chunks.join(''),c=>c.charCodeAt(0)&255)],{type:'application/pdf'});
}
async function downloadPDF(){
  const button=$('#print');if(button)button.disabled=true;
  try{
    const blob=makePDFBlob();
    const slug=(state.name||'docente').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9-]+/g,'-').toLowerCase().slice(0,40);
    const filename='bitacora-checkout-2026-'+slug+'.pdf';
    // Solo el iPhone/iPad usa Compartir; en Mac Safari no debe invocar navigator.share().
    const isIOS=/iPad|iPhone|iPod/i.test(navigator.userAgent) ||
      (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
    if(isIOS && navigator.share && navigator.canShare){
      const file=new File([blob],filename,{type:'application/pdf'});
      if(navigator.canShare({files:[file]})){
        await navigator.share({files:[file],title:'Mi bitácora docente 2026'});
        toast('En iPhone, elegí Guardar en Archivos.');
        return;
      }
    }
    // Safari de macOS / Chrome / Firefox: descarga real, sin menú Compartir ni Imprimir.
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement('a');
    anchor.href=url;anchor.download=filename;anchor.style.display='none';
    document.body.appendChild(anchor);anchor.click();anchor.remove();
    // Alternativa manual para Safari si no respeta la descarga automática.
    // Se mantiene mientras siga visible la pantalla; no modifica las respuestas.
    const existing=document.getElementById('pdfFallback');
    if(existing)existing.remove();
    const fallback=document.createElement('div');
    fallback.id='pdfFallback';fallback.className='no-print';
    fallback.style.cssText='margin-top:12px;padding:12px;border:1px solid #cad3c6;border-radius:12px';
    const note=document.createElement('p');
    note.textContent='Si el PDF no apareció en Descargas, abrilo con este enlace y luego usá Archivo → Guardar (⌘S) en Safari:';
    const link=document.createElement('a');
    link.href=url;link.target='_blank';link.rel='noopener';
    link.textContent='Abrir mi bitácora PDF para guardarla ↗';
    link.style.cssText='display:inline-block;font-weight:700;margin-top:4px';
    fallback.append(note,link);
    button?.closest('.buttons')?.insertAdjacentElement('afterend',fallback);
    setTimeout(()=>{URL.revokeObjectURL(url);fallback.remove()},10*60*1000);
    toast('PDF generado: revisá Descargas.');
  }catch(error){
    if(error?.name!=='AbortError')alert('No se pudo guardar el PDF: '+(error.message||'Error desconocido'));
  }finally{if(button)button.disabled=false;}
}

// Conexión: las respuestas largas, los nombres y la sala NUNCA se envían.
function newSubmissionId(){
  if(globalThis.crypto && typeof crypto.randomUUID==='function')return crypto.randomUUID();
  return 'doc-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
}
function saveText(filename,content,type='text/plain;charset=utf-8'){
  const url=URL.createObjectURL(new Blob([content],{type}));
  const a=document.createElement('a');a.href=url;a.download=filename;
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
}
function jsonp(params={}){
  // Google Apps Script sirve las lecturas como JavaScript: evita bloqueos CORS de GitHub Pages.
  if(!ONLINE)return Promise.reject(Error('El mapa todavía no está conectado.'));
  return new Promise((resolve,reject)=>{
    const cb='__checkoutCb'+Date.now().toString(36)+Math.random().toString(36).slice(2);
    const url=new URL(API_URL),script=document.createElement('script');
    let done=false;
    const finish=(error,data)=>{
      if(done)return;done=true;clearTimeout(timer);script.remove();delete window[cb];
      error?reject(error):resolve(data);
    };
    window[cb]=data=>finish(null,data);
    url.searchParams.set('callback',cb);
    for(const [k,v] of Object.entries(params))url.searchParams.set(k,v);
    script.src=url.toString();script.async=true;
    script.onerror=()=>finish(Error('No se pudo contactar el mapa. Revisá la conexión.'));
    const timer=setTimeout(()=>finish(Error('La consulta tardó demasiado.')),13000);
    document.head.append(script);
  });
}
async function postContribution(fields){
  if(!window.checkoutGarden)throw Error('El jardín no está disponible. Actualizá la página.');
  if(TEST_MODE)throw Error('Modo de prueba: tu aporte no se envía al jardín.');
  return window.checkoutGarden.share(fields);
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function confirmContribution(id){
  for(let attempt=0;attempt<7;attempt++){
    if(attempt)await sleep(1000+550*attempt);
    try{const data=await jsonp({check:id});if(data.ok && data.confirmed)return true;}catch(error){if(attempt===6)throw error;}
  }
  return false;
}
function shareUI(){
  if(TEST_MODE)return `<div class="panel share-panel no-print"><h3>Modo de prueba</h3><p>Este recorrido de ensayo no se envía al jardín colectivo.</p></div>`;
  if(!ONLINE)return `<div class="panel share-panel no-print"><span class="eyebrow">Nuestro jardín colectivo</span><h3>El mapa todavía no está conectado</h3><p>Tu recorrido funciona y podés guardar tu bitácora. Para reunir las participaciones, necesitás ingresar con Google y tener habilitado el jardín en Firebase.</p></div>`;
  return `<div class="panel share-panel no-print" id="sharePanel">
    <span class="eyebrow">Tercer momento · Nuestro jardín colectivo</span>
    <h3>¿Querés sumar tu huella al mapa?</h3>
    <p><strong>Tu participación todavía no se sumó al jardín.</strong> Compartir es opcional y requiere ingresar con Google, marcar la autorización y pulsar «Sumar mi aporte al mapa». El mapa compartido muestra tu <strong>perfil pedagógico</strong> y tu <strong>intención elegida para 2027</strong>, pero nunca tu nombre, sala, ni tus reflexiones privadas.</p>
    <label class="check-line"><input id="consentProfile" type="checkbox"><span><b>Sí, quiero sumar mi perfil y mi intención al mapa colectivo.</b><small>El jardín se mostrará a quienes ingresen con Google. No se publica tu nombre ni tu sala.</small></span></label>
    <label class="field-label" for="shareQuote">Una frase para sembrar en 2027 (opcional)</label>
    <textarea id="shareQuote" maxlength="160" placeholder="Podés escribir algo nuevo, breve y anónimo. No incluyas nombres ni detalles identificatorios.">${escapeHTML(state.sharedPhrase)}</textarea>
    <label class="check-line"><input id="consentPhrase" type="checkbox" ${state.sharePhrase?'checked':''}><span><b>Autorizo también a publicar esta frase en el mapa.</b><small>Si no marcás esta opción, la frase no se envía.</small></span></label>
    <div class="buttons"><button class="btn" id="sendMap" type="button">Sumar mi aporte al mapa ↗</button><button class="btn secondary" id="skipMap" type="button">Prefiero no compartir</button></div>
    <p class="micro" id="shareStatus" role="status" aria-live="assertive">Al tocar «Sumar mi aporte», esperá la confirmación verde. Si aparece un error, no se registró.</p>
  </div>`;
}
function bindShare(){
  if(!ONLINE)return;
  $('#skipMap').onclick=mapView;
  $('#sendMap').onclick=async()=>{
    const consent=$('#consentProfile').checked;
    state.sharedPhrase=$('#shareQuote').value.trim();
    state.sharePhrase=$('#consentPhrase').checked;persist();
    const phrase=state.sharePhrase?state.sharedPhrase:'';
    const status=$('#shareStatus'),button=$('#sendMap');
    if(!consent){status.textContent='Para sumar tu perfil, primero elegí voluntariamente compartirlo.';return;}
    if(state.sharePhrase&&!phrase){status.textContent='Escribí una frase o desmarcá la autorización para publicarla.';return;}
    if(!state.submissionId)state.submissionId=newSubmissionId();persist();
    button.disabled=true;status.textContent='Enviando tu aporte al jardín privado del equipo…';status.style.fontWeight='700';status.style.color='#315b43';status.scrollIntoView({block:'nearest',behavior:'smooth'});
    try{
      await postContribution({profile:calculate(state.choices).key,priority:state.choices[6],phrase});
      status.textContent='Firebase confirmó el registro de tu huella en el jardín.';
      state.confirmed=true;persist();
      status.textContent='¡Tu aporte anónimo quedó registrado!';
      $('#sharePanel').innerHTML=`<span class="eyebrow">¡Una huella más!</span><h3>Tu aporte ya forma parte de nuestro jardín 🌱</h3><p>No se enviaron tu nombre, tu sala ni las respuestas abiertas. Gracias por compartir.</p><div class="buttons"><button class="btn" type="button" id="seeShared">Ver nuestro jardín colectivo →</button></div>`;
      $('#seeShared').onclick=mapView;
    }catch(error){status.textContent='⚠ '+(error.message||'No se pudo completar el envío.');status.style.color='#9e352b';button.disabled=false;}
  };
}
function result(){
  if(state.choices.some(v=>!v)){state.index=state.choices.findIndex(v=>!v);question();return}
  state.screen='result';
  const r=calculate(state.choices),p=profiles[r.key],sec=profiles[r.secondary];
  const response=questions.map((q,i)=>`<div class="response"><b>${escapeHTML(q.station)} · ${escapeHTML(q.reflection)}</b>${escapeHTML(state.reflections[i].trim()||'Sin respuesta escrita')}</div>`).join('');
  const track=p.playlist.map(([song,artist])=>`<a class="track" href="https://open.spotify.com/search/${encodeURIComponent(song+' '+artist)}" target="_blank" rel="noopener noreferrer"><b>♫ ${escapeHTML(song)}</b><small>${escapeHTML(artist)} · buscar en Spotify ↗</small></a>`).join('');
  view(`<section class="session"><span class="eyebrow">Tu check-out está listo · ${escapeHTML(dateLabel())}</span><h2>${state.name?`Gracias, ${escapeHTML(state.name)}.`:'Gracias por recorrer este año.'}</h2>
    <div class="summary-hero"><div><span class="eyebrow">Tu perfil pedagógico</span><h2>${escapeHTML(p.name)}</h2><p><strong>${escapeHTML(p.short)}</strong></p><p>${escapeHTML(p.description)}</p><p><em>${escapeHTML(p.gift)}</em></p></div><div class="symbol" aria-hidden="true">${p.symbol}</div></div>
    <div class="panel"><h3>No somos un solo perfil</h3><p>También aparece en tus respuestas una sensibilidad <strong>${escapeHTML(sec.name.toLowerCase().replace('la ',''))}</strong>. Estos perfiles reflejan tus elecciones de hoy, no una identidad permanente.</p><div class="profile-grid">${Object.entries(profiles).map(([k,v])=>`<div class="profile-chip"><b>${escapeHTML(v.name)}</b><span>${r.counts[k]} / 8</span></div>`).join('')}</div></div>
    <div class="panel"><span class="eyebrow">Tu banda sonora</span><h3>Una playlist para seguir creciendo 🎧</h3><p>Estas tres canciones acompañan simbólicamente tu perfil. Abrilas para buscarlas en Spotify; no se reproduce música desde esta página.</p><div class="playlist">${track}</div></div>
    <div class="panel"><span class="eyebrow">Tu bitácora del año</span><h3>Las huellas que elegís guardar</h3>${response}</div>
    <div class="callout no-print">Tu bitácora es privada. Podés descargarla en PDF. Para aparecer en el jardín colectivo debés autorizar y enviar tu aporte al final: completar las preguntas no lo envía automáticamente.</div>
    <div class="buttons no-print"><button class="btn" id="print" type="button">Descargar mi bitácora en PDF</button><button class="btn ghost" id="edit">Revisar mis respuestas</button></div>
    ${state.confirmed?`<div class="panel no-print"><h3>¡Tu huella ya está en el mapa! 🌿</h3><button class="btn" id="viewAfterShare">Ver jardín colectivo →</button></div>`:shareUI()}
    <div class="buttons no-print"><button class="btn secondary" id="map">Ver jardín colectivo →</button></div>
  </section>`);
  $('#print').onclick=downloadPDF;$('#map').onclick=mapView;$('#edit').onclick=()=>{state.index=0;persist();question()};persist();
  if(state.confirmed)$('#viewAfterShare').onclick=mapView;else bindShare();
}
function mapView(){
  state.screen='map';
  view(`<section class="session map-page"><span class="eyebrow">Nuestro jardín colectivo · 2026</span><h2>Distintas maneras de hacer crecer lo común.</h2>
    <p>Un mapa que se construye con las huellas anónimas de quienes eligen participar. No hay perfiles mejores: la diversidad es parte de la riqueza del equipo.</p>
    <div class="map-masthead"><div class="garden-illustration" aria-hidden="true">✿ <span>❀</span> ✳ <small>❃</small></div><div><span class="eyebrow">Mapa compartido</span><p class="map-intro">Cada participación suma una nueva mirada. Las cifras se actualizan cuando se envían respuestas y mientras el mapa está abierto.</p><b id="mapTotal" class="map-total">—</b><span class="muted"> aportes voluntarios</span></div></div>
    <div id="mapStatus" class="micro" role="status">${ONLINE?'Consultando el jardín en Firebase…':'Aún falta conectar el mapa con Google Sheets.'}</div>
    <div id="collective"></div>
    <div class="callout"><strong>Una mirada responsable:</strong> el mapa se comparte sin nombres ni salas. Las frases son públicas solo si cada docente autorizó publicarlas. Las reflexiones personales permanecen en su bitácora.</div>
    <div class="buttons no-print"><button class="btn" id="refreshMap" type="button">↻ Actualizar mapa</button><button class="btn secondary" id="back" type="button">Volver al inicio</button></div>
  </section>`);
  $('#back').onclick=home;$('#refreshMap').onclick=loadMap;
  if(ONLINE){loadMap();autoRefresh=setInterval(()=>{if(state.screen==='map')loadMap(true)},30000);}
  else $('#collective').innerHTML=`<div class="panel"><h3>Este mapa está listo para conectarse</h3><p>La dirección debe publicar el servicio de Google Apps Script y pegar su dirección en <code>config.js</code>. Hasta entonces no hay respuestas colectivas que mostrar.</p></div>`;
}
async function loadMap(silent=false){
  const status=$('#mapStatus');if(!status)return;
  if(!silent)status.textContent='Buscando los últimos aportes del equipo…';
  try{
    if(!window.checkoutGarden)throw Error('La conexión al jardín todavía no se cargó.');
    const data=await window.checkoutGarden.load();
    if(state.screen!=='map')return;
    if(!data?.ok)throw Error('No pudimos leer los aportes.');
    state.mapData=data;renderMap(data);
    status.textContent='Mapa actualizado · '+new Intl.DateTimeFormat('es-AR',{hour:'2-digit',minute:'2-digit'}).format(new Date());
  }catch(error){
    status.textContent='No fue posible actualizar el mapa: '+(error.message||'Error desconocido');
    if(!state.mapData)$('#collective').innerHTML='<div class="panel"><h3>No se pudo cargar el mapa</h3><p>Verificá que hayas iniciado sesión con Google y que estén publicadas las reglas del jardín en Firestore.</p></div>';
  }
}
function renderMap(data){
  const total=Math.max(0,Number(data.total)||0),counts=data.profiles||{},priorities=data.priorities||{};
  const flowers=Object.entries(profiles).map(([key,p])=>{
    const n=Math.max(0,Number(counts[key])||0),percent=total?Math.round(n*100/total):0;
    return `<div class="flower-card"><div class="flower-top"><div class="flower-icon">${p.symbol}</div><div><strong>${escapeHTML(p.name)}</strong><p class="micro">${escapeHTML(p.short)}</p></div></div><div class="bar-track"><div class="bar-fill" style="width:${percent}%"></div></div><b>${n} ${n===1?'aporte':'aportes'}</b><small>${percent}% de las participaciones</small></div>`;
  }).join('');
  const intentions=Object.entries(PRIORITIES).map(([key,label])=>{
    const n=Math.max(0,Number(priorities[key])||0),pct=total?Math.round(100*n/total):0;
    return `<div class="priority-row"><div><b>${escapeHTML(label)}</b><small>${n} ${n===1?'elección':'elecciones'}</small></div><div class="priority-track"><span style="width:${pct}%"></span></div><strong>${pct}%</strong></div>`;
  }).join('');
  const phrases=(Array.isArray(data.phrases)?data.phrases:[]).slice(0,40).map(x=>`<div class="phrase">“${escapeHTML(String(x).slice(0,160))}”</div>`).join('');
  $('#mapTotal').textContent=total;
  $('#collective').innerHTML=total===0?`<div class="panel empty-map"><span>🌱</span><h3>El jardín está esperando sus primeras huellas.</h3><p>El mapa solo cuenta participaciones que hayan sido enviadas y confirmadas, no recorridos terminados. Al finalizar, autorizá compartir tu perfil e ingresá el código del equipo para enviar.</p></div>`:
    `<div class="panel"><span class="eyebrow">La diversidad de nuestro equipo</span><h3>Cuatro maneras de florecer</h3><div class="flower-grid">${flowers}</div></div>
     <div class="panel"><span class="eyebrow">Mirando hacia 2027</span><h3>Lo que queremos seguir cultivando</h3><p class="muted">Prioridades construidas a partir de las elecciones del recorrido.</p><div class="priorities">${intentions}</div></div>
     <div class="panel"><span class="eyebrow">Palabras que compartimos</span><h3>Semillas para el próximo ciclo</h3><p class="muted">Frases breves compartidas de manera voluntaria. No incluyen respuestas completas de las bitácoras.</p><div class="phrases">${phrases||'<p class="muted">Todavía no hay frases compartidas.</p>'}</div></div>`;
  const exp=$('#exportSummary');if(exp)exp.onclick=exportSummary;
  if(total>0){const div=document.createElement('div');div.className='buttons no-print';div.innerHTML='<button class="btn secondary" id="exportSummary" type="button">↓ Descargar síntesis del mapa</button>';
  $('#collective').append(div);$('#exportSummary').onclick=exportSummary;}
}
function exportSummary(){
  const data=state.mapData;if(!data)return;
  const lines=['NUESTRO JARDÍN COLECTIVO — CHECK-OUT DOCENTE 2026','Aportes anónimos: '+data.total,'','Perfiles:',...Object.keys(profiles).map(k=>profiles[k].name+': '+(data.profiles[k]||0)),'','Prioridades 2027:',...Object.entries(PRIORITIES).map(([k,v])=>v+': '+(data.priorities[k]||0)),'','Frases compartidas voluntariamente:',...(data.phrases||[]).map(s=>'- '+s)];
  saveText('mapa-colectivo-docente-2026.txt',lines.join('\n'));
}
$('#logoButton').onclick=home;
$('#navMap').onclick=mapView;
window.checkoutBridge={
  exportDraft:()=>({version:2,updatedAt:new Date().toISOString(),index:state.index,choices:[...state.choices],reflections:[...state.reflections],name:state.name,room:state.room,submissionId:state.submissionId,confirmed:state.confirmed,sharedPhrase:state.sharedPhrase,sharePhrase:state.sharePhrase}),
  hasProgress,
  resume,
  importDraft:(v)=>{
    if(!v||!Array.isArray(v.choices)||v.choices.length!==8||!Array.isArray(v.reflections)||v.reflections.length!==8)return false;
    state.choices=v.choices.map(x=>Object.hasOwn(profiles,x)?x:null);
    state.reflections=v.reflections.map(x=>String(x||'').slice(0,1500));
    state.name=String(v.name||'').slice(0,80);state.room=String(v.room||'').slice(0,80);
    state.index=Math.max(0,Math.min(7,Number(v.index)||0));
    state.submissionId=typeof v.submissionId==='string'?v.submissionId:null;
    state.confirmed=!!v.confirmed;state.sharedPhrase=String(v.sharedPhrase||'').slice(0,160);state.sharePhrase=!!v.sharePhrase;
    persist();home();return true;
  }
};
restoreLocal();
home();
