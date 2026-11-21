/* Check-out docente 2026 | Recuperación de borradores privados desde Firestore.
   No publica respuestas en el mapa. No sobrescribe automáticamente un borrador existente. */
(()=>{
 'use strict';
 const node=document.getElementById('cloudArea');
 const bridge=window.checkoutBridge;
 const cfg=window.CHECKOUT_FIREBASE_CONFIG||{};
 if(!node||!bridge)return;
 const ready=['apiKey','authDomain','projectId','appId'].every(k=>typeof cfg[k]==='string'&&cfg[k].trim());
 if(!ready){node.textContent='El guardado en línea todavía no está configurado. Tus respuestas se conservan en este dispositivo.';return;}
 if(!window.firebase){node.textContent='No se pudo cargar Firebase. Conservá tu recorrido en este dispositivo e intentá más tarde.';return;}
 const fb=firebase.apps.length?firebase.app():firebase.initializeApp(cfg);
 const auth=fb.auth(),db=fb.firestore();
 let user=null,active=false,saving=false,timer=null,remoteExists=false,remoteDraft=null,remoteUpdated='';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const ref=()=>db.collection('borradores_docentes_2026').doc(user.uid);
 const count=d=>(Array.isArray(d?.choices)?d.choices.filter(Boolean).length:0);
 const valid=d=>d&&Array.isArray(d.choices)&&d.choices.length===8&&Array.isArray(d.reflections)&&d.reflections.length===8;
 const time=()=>new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
 function ui(msg='',mode='ready'){
  let inner='';
  if(!user){inner='<strong>☁️ Continuar en cualquier dispositivo</strong><p>Ingresá con la misma cuenta de Google para recuperar tu recorrido privado.</p><button id="cloudLogin" type="button" class="btn secondary">Continuar con Google</button>';}
  else{
   inner='<strong>☁️ Mi recorrido en Google</strong><p style="overflow-wrap:anywhere">Cuenta: <b>'+esc(user.email||'')+'</b></p>';
   if(mode==='choose'){
    inner+='<p>Encontramos <b>'+count(remoteDraft)+' de 8 respuestas</b> guardadas en Google'+(remoteUpdated?' ('+esc(remoteUpdated)+')':'')+'. Este navegador también contiene un recorrido ('+count(bridge.exportDraft())+' de 8).</p><p><b>No se reemplazó ninguna versión.</b> Elegí cuál querés conservar.</p><button id="cloudRecover" type="button" class="btn secondary">Recuperar desde Google</button> <button id="cloudKeepLocal" type="button" class="btn ghost">Conservar este dispositivo y subirlo a Google</button>';
   }else{
    inner+='<p>'+esc(msg)+'</p>';
    if(remoteExists)inner+='<button id="cloudRecover" type="button" class="btn secondary">Recuperar desde Google</button> ';
    if(active)inner+='<button id="cloudSaveNow" type="button" class="btn secondary">Guardar ahora</button> ';
   }
   inner+='<button id="cloudSignOut" type="button" class="btn ghost">Salir de Google</button>';
  }
  node.innerHTML=inner;
  const bind=(id,fn)=>{const el=document.getElementById(id);if(el)el.addEventListener('click',fn);};
  bind('cloudLogin',login);
  bind('cloudRecover',recover);
  bind('cloudKeepLocal',keepLocal);
  bind('cloudSaveNow',()=>save(true));
  bind('cloudSignOut',()=>auth.signOut());
 }
 async function login(){ui('Abriendo Google…');try{await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());}catch(e){ui('No se pudo abrir Google: '+(e.code||e.message));}}
 async function load(){
  active=false;clearTimeout(timer);ui('Buscando respuestas guardadas en Google…');
  try{
   const snap=await ref().get({source:'server'});
   if(!user)return;
   const data=snap.exists?snap.data():null;
   remoteDraft=valid(data?.draft)?data.draft:null;
   remoteExists=!!remoteDraft;
   remoteUpdated=data?.updatedAt||'';
   if(remoteExists){
    if(bridge.hasProgress()){
     const local=bridge.exportDraft();
     // Si las respuestas coinciden, no hay conflicto. Si divergen, NO subimos nada sin permiso.
     const a=JSON.stringify([local.choices,local.reflections,local.name,local.room]);
     const b=JSON.stringify([remoteDraft.choices,remoteDraft.reflections,remoteDraft.name,remoteDraft.room]);
     if(a===b){active=true;ui('Tu recorrido ya está sincronizado con Google ('+count(remoteDraft)+' de 8 respuestas).');}
     else ui('', 'choose');
    }else{
     if(bridge.importDraft(remoteDraft)){active=true;ui('Recuperamos '+count(remoteDraft)+' de 8 respuestas desde Google. Tocá «Continuar donde lo dejé» para retomarlas.');}
     else ui('Google tiene un borrador, pero no se pudo interpretar. No se sobrescribió.');
    }
   }else{
    // No subir un borrador automáticamente hasta que la docente confirme la cuenta.
    active=true;
    if(bridge.hasProgress())ui('No hay respuestas previas para esta cuenta de Google. Tus '+count(bridge.exportDraft())+' respuestas de este dispositivo están disponibles. Tocá «Guardar ahora» para vincularlas.');
    else ui('Cuenta vinculada. Las próximas respuestas se guardarán en Google.');
   }
  }catch(e){active=false;ui('No se pudo consultar Google ('+(e.code||e.message)+'). No se modificaron las respuestas locales ni las de la nube.');}
 }
 function recover(){
  if(!remoteExists||!valid(remoteDraft))return;
  // Siempre exigir confirmación si existe progreso local diferente.
  if(bridge.hasProgress() && !confirm('Se mostrará el recorrido que está guardado en Google. El de este navegador quedará reemplazado aquí. ¿Continuar?'))return;
  if(bridge.importDraft(remoteDraft)){active=true;ui('Recuperamos '+count(remoteDraft)+' de 8 respuestas desde Google. Ya podés continuar tu recorrido.');}
  else ui('No se pudo recuperar el documento. No se reemplazó tu trabajo.');
 }
 async function keepLocal(){
  if(!user||!bridge.hasProgress())return;
  if(remoteExists&&!confirm('Esto reemplazará el borrador de Google por el que hay en este dispositivo. ¿Confirmás?'))return;
  active=true;await save(true);
 }
 async function save(manual=false){
  if(!user||!active||saving)return;
  if(!bridge.hasProgress()){if(manual)ui('Todavía no hay respuestas para guardar.');return;}
  saving=true;
  try{
   const draft=bridge.exportDraft();
   await ref().set({draft,updatedAt:new Date().toISOString()});
   remoteDraft=draft;remoteExists=true;remoteUpdated=new Date().toISOString();
   ui('Guardado en línea confirmado a las '+time()+'. ('+count(draft)+' de 8 respuestas)');
  }catch(e){ui('No se pudo confirmar el guardado en línea: '+(e.code||e.message)+'. Tus respuestas siguen guardadas en este dispositivo.');}
  finally{saving=false;}
 }
 window.addEventListener('checkout:draft-changed',()=>{
  if(!active||!user)return;
  clearTimeout(timer);timer=setTimeout(()=>save(),1100);
 });
 auth.onAuthStateChanged(async next=>{
  user=next;active=false;clearTimeout(timer);remoteExists=false;remoteDraft=null;remoteUpdated='';
  if(user)await load();else ui();
 });
 ui();
})();
