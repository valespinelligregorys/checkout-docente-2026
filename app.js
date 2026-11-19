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
const ONLINE=/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(API_URL);
const PRIORITIES={exploradora:'Explorar nuevas preguntas y formatos',tejedora:'Profundizar la colaboración y el cuidado mutuo',observadora:'Documentar los procesos de aprendizaje',arquitecta:'Afinar la planificación y la evaluación'};
let autoRefresh=null;

const dateLabel=()=>new Intl.DateTimeFormat('es-AR',{day:'numeric',month:'long',year:'numeric'}).format(new Date());
function toast(s){const t=$('#toast');t.textContent=s;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400)}
function scrollTop(){window.scrollTo({top:0,behavior:'smooth'})}
function view(html){if(autoRefresh){clearInterval(autoRefresh);autoRefresh=null;}app.innerHTML=html;scrollTop()}
function home(){state.screen='home';view(`<section class="hero"><div><span class="eyebrow">Un recorrido para cerrar el ciclo</span><h1>Lo que<br><em>hicimos crecer.</em></h1><p class="lead">Cada año deja huellas: preguntas, hallazgos, vínculos y desafíos. Este es un espacio para mirar el camino recorrido y elegir qué queremos llevarnos.</p><div class="buttons"><button class="btn" id="start">Comenzar mi check-out ↗</button><button class="btn secondary" id="gotoMap">Nuestro jardín colectivo</button></div><p class="micro">15–20 minutos · 8 elecciones + reflexiones · un perfil pedagógico y su banda sonora</p></div><div class="illustration" aria-hidden="true"><div class="orbit"></div><span class="flower">🌼</span><span class="tiny top">mirar lo vivido ✳</span><span class="tiny bottom">sembrar lo que viene</span></div></section><section class="features"><div class="feature"><span class="icon">🌱</span><strong>Un recorrido propio</strong><p>Cuatro estaciones con preguntas para recuperar la experiencia cotidiana.</p></div><div class="feature"><span class="icon">🎧</span><strong>Un perfil y una playlist</strong><p>Un retrato lúdico de las fortalezas que aportás al equipo, acompañado de canciones.</p></div><div class="feature"><span class="icon">🪴</span><strong>Una lectura compartida</strong><p>El mapa se actualiza con los aportes anónimos que cada docente decida compartir.</p></div></section><p class="micro">Las reflexiones personales quedan en tu dispositivo. Solo si lo autorizás, se compartirán tu perfil, la intención elegida y una frase voluntaria para el mapa público.</p>`);$('#start').onclick=()=>intro();$('#gotoMap').onclick=()=>mapView()}
function intro(){state.screen='intro';view(`<section class="session"><span class="eyebrow">Antes de comenzar</span><h2>Una mirada situada, sin respuestas correctas.</h2><p>Este check-out no es una evaluación de desempeño ni un diagnóstico. Es una invitación a reconocer decisiones, tensiones y aprendizajes de la práctica docente.</p><label class="field-label" for="name">Tu nombre (opcional)</label><input type="text" id="name" maxlength="80" placeholder="¿Cómo querés firmar tu bitácora?" value="${escapeHTML(state.name)}"><label class="field-label" for="room">Sala / rol (opcional)</label><input type="text" id="room" maxlength="80" placeholder="Por ejemplo: Kinder 4 / docente de Música" value="${escapeHTML(state.room)}"><div class="callout">Los perfiles son metáforas pedagógicas: todas las personas podemos reconocer algo de cada uno. No se usarán para calificar ni comparar docentes.</div><div class="buttons"><button class="btn" id="next">Entrar al recorrido →</button><button class="btn secondary" id="back">Volver</button></div></section>`);$('#next').onclick=()=>{state.name=$('#name').value.trim();state.room=$('#room').value.trim();state.index=0;question()};$('#back').onclick=home}
function question(){state.screen='question';const i=state.index,q=questions[i];const options=q.options.map(([key,label],j)=>`<button class="option ${state.choices[i]===key?'selected':''}" data-value="${key}" aria-pressed="${state.choices[i]===key}"><span class="number">${String(j+1).padStart(2,'0')}</span><span>${escapeHTML(label)}</span></button>`).join('');view(`<section class="session"><div class="progress" aria-label="Progreso: ${i+1} de 8">${questions.map((_,j)=>`<span class="${j<=i?'active':''}"></span>`).join('')}</div><span class="station-tag">${escapeHTML(q.station)}</span><p class="question-count">Estación ${Math.floor(i/2)+1} de 4 · pregunta ${i+1} de 8</p><h2>${escapeHTML(q.title)}</h2><p class="muted">${escapeHTML(q.subtitle||'Elegí la respuesta con la que más te identificás hoy.')}</p><div class="options">${options}</div><label class="field-label" for="reflection">${escapeHTML(q.reflection)}</label><p class="field-hint">Respuesta libre. Podés escribir una frase o desarrollar una reflexión.</p><textarea id="reflection" maxlength="1500" placeholder="Escribí acá…">${escapeHTML(state.reflections[i])}</textarea><div class="step-footer"><button class="btn secondary" id="back">← Anterior</button><button class="btn" id="next" ${!state.choices[i]?'disabled':''}>${i===7?'Descubrir mi perfil ✳':'Continuar →'}</button></div></section>`);document.querySelectorAll('.option').forEach(b=>b.onclick=()=>{state.choices[i]=b.dataset.value;document.querySelectorAll('.option').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b))});$('#next').disabled=false});$('#reflection').oninput=e=>state.reflections[i]=e.target.value;$('#back').onclick=()=>{if(i===0)intro();else{state.index--;question()}};$('#next').onclick=()=>{state.reflections[i]=$('#reflection').value;if(i<7){state.index++;question()}else result()}}
function calculate(choices){const counts=Object.fromEntries(Object.keys(profiles).map(k=>[k,0]));choices.forEach(c=>{if(counts[c]!==undefined)counts[c]++});const priority=['exploradora','tejedora','arquitecta','observadora'];const sorted=priority.sort((a,b)=>counts[b]-counts[a]);return{key:sorted[0],counts,secondary:sorted[1]}}
function payload(){const r=calculate(state.choices);return{type:'checkout_docente_2026',version:1,createdAt:new Date().toISOString(),name:state.name,room:state.room,profile:r.key,counts:r.counts,answers:questions.map((q,i)=>({station:q.station,question:q.title,choice:state.choices[i],reflection:state.reflections[i]}))}}
function download(){const name=(state.name||'docente').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9-]+/g,'-').toLowerCase().slice(0,40);const blob=new Blob([JSON.stringify(payload(),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`checkout-2026-${name}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);toast('Bitácora descargada')}
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
  const response=await fetch(API_URL,{method:'POST',mode:'no-cors',body:new URLSearchParams(fields)});
  // La respuesta del POST es opaca. No la tomamos como prueba de envío.
  return response;
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function confirmContribution(id){
  for(let attempt=0;attempt<4;attempt++){
    if(attempt)await sleep(1200*attempt);
    try{const data=await jsonp({check:id});if(data.ok && data.confirmed)return true;}catch(error){if(attempt===3)throw error;}
  }
  return false;
}
function shareUI(){
  if(!ONLINE)return `<div class="panel share-panel no-print"><span class="eyebrow">Nuestro jardín colectivo</span><h3>El mapa todavía no está conectado</h3><p>Tu recorrido funciona y podés guardar tu bitácora. Para reunir las participaciones en línea, la dirección debe completar la conexión con Google Sheets antes de compartir el sitio con el equipo.</p></div>`;
  return `<div class="panel share-panel no-print" id="sharePanel">
    <span class="eyebrow">Tercer momento · Nuestro jardín colectivo</span>
    <h3>¿Querés sumar tu huella al mapa?</h3>
    <p>Compartir es opcional. El mapa público muestra tu <strong>perfil pedagógico</strong> y tu <strong>intención elegida para 2027</strong>, pero nunca tu nombre, sala, ni tus reflexiones privadas.</p>
    <label class="check-line"><input id="consentProfile" type="checkbox"><span><b>Sí, quiero sumar mi perfil y mi intención al mapa colectivo.</b><small>El mapa será visible para cualquier persona que tenga el enlace de la página.</small></span></label>
    <label class="field-label" for="groupCode">Código del equipo</label>
    <input type="password" id="groupCode" maxlength="80" autocomplete="off" placeholder="El código que compartió la dirección">
    <label class="field-label" for="shareQuote">Una frase para sembrar en 2027 (opcional)</label>
    <textarea id="shareQuote" maxlength="160" placeholder="Podés escribir algo nuevo, breve y anónimo. No incluyas nombres ni detalles identificatorios.">${escapeHTML(state.sharedPhrase)}</textarea>
    <label class="check-line"><input id="consentPhrase" type="checkbox" ${state.sharePhrase?'checked':''}><span><b>Autorizo también a publicar esta frase en el mapa.</b><small>Si no marcás esta opción, la frase no se envía.</small></span></label>
    <div class="buttons"><button class="btn" id="sendMap" type="button">Sumar mi aporte al mapa ↗</button><button class="btn secondary" id="skipMap" type="button">Prefiero no compartir</button></div>
    <p class="micro" id="shareStatus" role="status">Podés seguir al mapa sin enviar ningún dato.</p>
  </div>`;
}
function bindShare(){
  if(!ONLINE)return;
  $('#skipMap').onclick=mapView;
  $('#sendMap').onclick=async()=>{
    const consent=$('#consentProfile').checked;
    const code=$('#groupCode').value.trim();
    state.sharedPhrase=$('#shareQuote').value.trim();
    state.sharePhrase=$('#consentPhrase').checked;
    const phrase=state.sharePhrase?state.sharedPhrase:'';
    const status=$('#shareStatus'),button=$('#sendMap');
    if(!consent){status.textContent='Para sumar tu perfil, primero elegí voluntariamente compartirlo.';return;}
    if(!code){status.textContent='Ingresá el código del equipo para enviar el aporte.';return;}
    if(state.sharePhrase&&!phrase){status.textContent='Escribí una frase o desmarcá la autorización para publicarla.';return;}
    if(!state.submissionId)state.submissionId=newSubmissionId();
    button.disabled=true;status.textContent='Enviando tu aporte y verificando que se haya registrado…';
    try{
      await postContribution({id:state.submissionId,code,profile:calculate(state.choices).key,priority:state.choices[6],phrase});
      const confirmed=await confirmContribution(state.submissionId);
      if(!confirmed)throw Error('No pudimos confirmar el registro. Revisá el código del equipo y volvé a intentarlo.');
      state.confirmed=true;
      status.textContent='¡Tu aporte anónimo quedó registrado!';
      $('#sharePanel').innerHTML=`<span class="eyebrow">¡Una huella más!</span><h3>Tu aporte ya forma parte de nuestro jardín 🌱</h3><p>No se enviaron tu nombre, tu sala ni las respuestas abiertas. Gracias por compartir.</p><div class="buttons"><button class="btn" type="button" id="seeShared">Ver nuestro jardín colectivo →</button></div>`;
      $('#seeShared').onclick=mapView;
    }catch(error){status.textContent=error.message||'No se pudo completar el envío.';button.disabled=false;}
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
    <div class="callout no-print">Tu bitácora completa es privada: guardala como PDF en tu dispositivo. Si autorizás participar en el mapa, se compartirán únicamente tu perfil, tu intención y, si lo elegís, una frase breve.</div>
    <div class="buttons no-print"><button class="btn" id="print">Guardar como PDF / imprimir</button><button class="btn secondary" id="download">Descargar también mi bitácora (.json)</button><button class="btn ghost" id="edit">Revisar mis respuestas</button></div>
    ${state.confirmed?`<div class="panel no-print"><h3>¡Tu huella ya está en el mapa! 🌿</h3><button class="btn" id="viewAfterShare">Ver jardín colectivo →</button></div>`:shareUI()}
    <div class="buttons no-print"><button class="btn secondary" id="map">Ver jardín colectivo →</button></div>
  </section>`);
  $('#download').onclick=download;$('#print').onclick=()=>window.print();$('#map').onclick=mapView;$('#edit').onclick=()=>{state.index=0;question()};
  if(state.confirmed)$('#viewAfterShare').onclick=mapView;else bindShare();
}
function mapView(){
  state.screen='map';
  view(`<section class="session map-page"><span class="eyebrow">Nuestro jardín colectivo · 2026</span><h2>Distintas maneras de hacer crecer lo común.</h2>
    <p>Un mapa que se construye con las huellas anónimas de quienes eligen participar. No hay perfiles mejores: la diversidad es parte de la riqueza del equipo.</p>
    <div class="map-masthead"><div class="garden-illustration" aria-hidden="true">✿ <span>❀</span> ✳ <small>❃</small></div><div><span class="eyebrow">Mapa compartido</span><p class="map-intro">Cada participación suma una nueva mirada. Las cifras se actualizan cuando se envían respuestas y mientras el mapa está abierto.</p><b id="mapTotal" class="map-total">—</b><span class="muted"> aportes voluntarios</span></div></div>
    <div id="mapStatus" class="micro" role="status">${ONLINE?'Conectando con el mapa…':'Aún falta conectar el mapa con Google Sheets.'}</div>
    <div id="collective"></div>
    <div class="callout"><strong>Una mirada responsable:</strong> el mapa se comparte sin nombres ni salas. Las frases son públicas solo si cada docente autorizó publicarlas. Las reflexiones personales permanecen en su bitácora.</div>
    <div class="buttons no-print"><button class="btn" id="refreshMap" type="button">↻ Actualizar mapa</button><button class="btn secondary" id="back" type="button">Volver al inicio</button></div>
  </section>`);
  $('#back').onclick=home;$('#refreshMap').onclick=loadMap;
  if(ONLINE){loadMap();autoRefresh=setInterval(()=>{if(state.screen==='map')loadMap(true)},30000);}
  else $('#collective').innerHTML=`<div class="panel"><h3>Este mapa está listo para conectarse</h3><p>La dirección debe publicar el servicio de Google Apps Script y pegar su dirección en <code>config.js</code>. Hasta entonces no hay respuestas colectivas que mostrar.</p></div>`;
}
async function loadMap(silent=false){
  if(!ONLINE)return;
  const status=$('#mapStatus');
  if(!status)return;
  if(!silent)status.textContent='Buscando los últimos aportes del equipo…';
  try{
    const data=await jsonp();
    if(state.screen!=='map')return;
    if(!data||!data.ok)throw Error('El servicio no devolvió un mapa válido.');
    state.mapData=data;renderMap(data);
    status.textContent='Mapa en línea · última actualización: '+new Intl.DateTimeFormat('es-AR',{hour:'2-digit',minute:'2-digit'}).format(new Date());
  }catch(error){status.textContent='No fue posible actualizar el mapa: '+error.message;if(!state.mapData)$('#collective').innerHTML='<div class="panel"><h3>No se pudo cargar el mapa</h3><p>Revisá que Apps Script esté publicado y que hayas completado la dirección de conexión.</p></div>';}
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
  $('#collective').innerHTML=total===0?`<div class="panel empty-map"><span>🌱</span><h3>El jardín está esperando sus primeras huellas.</h3><p>Cuando alguna docente termine su recorrido y autorice compartir su perfil, aparecerá acá.</p></div>`:
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
home();
