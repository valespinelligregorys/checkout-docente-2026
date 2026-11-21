/* Sincronización privada opcional: Google Sign-In + Firestore.
   Las respuestas NO se incluyen en el mapa colectivo ni se envían a Apps Script. */
(()=>{
  'use strict';
  const node=document.getElementById('cloudArea');
  const bridge=window.checkoutBridge;
  const cfg=window.CHECKOUT_FIREBASE_CONFIG||{};
  const ready=['apiKey','authDomain','projectId','appId'].every(k=>typeof cfg[k]==='string'&&cfg[k].trim());
  if(!node||!bridge)return;
  if(!ready){node.innerHTML='<small>🌱 Tu recorrido se guarda automáticamente en este dispositivo. La opción de continuar en otros dispositivos estará disponible cuando la institución active el guardado privado en línea.</small>';return;}
  if(!window.firebase){node.textContent='No se pudo cargar el servicio de guardado en línea. Podés seguir con el guardado local.';return;}
  const fb=firebase.initializeApp(cfg);
  const auth=fb.auth();
  const db=fb.firestore();
  let user=null, enabled=false, busy=false, timer=null, lastCloudSaved=null;
  const timestamp=()=>new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
  const safeText=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ref=()=>db.collection('borradores_docentes_2026').doc(user.uid);
  function show(message=''){
    const status=message?`<small role="status">${safeText(message)}</small>`:'';
    node.innerHTML=user?`<div><strong>☁️ Guardado privado en línea</strong> · ${safeText(user.email||'Cuenta Google')}<div>${status||'<small>Tu recorrido puede recuperarse desde cualquier dispositivo iniciando sesión con esta misma cuenta.</small>'}</div><button class="btn secondary" id="cloudSaveNow" type="button">Guardar ahora</button> <button class="btn ghost" id="cloudSignOut" type="button">Cerrar sesión de Google</button></div>`:
      `<div><strong>Continuar en cualquier dispositivo</strong><p style="margin:.4em 0">Entrá con tu cuenta de Google para guardar y recuperar tus respuestas privadas sin códigos personales. El jardín colectivo sigue siendo opcional y anónimo.</p>${status}<div><button class="btn secondary" id="cloudLogin" type="button">Continuar con Google</button></div></div>`;
    const login=document.getElementById('cloudLogin');if(login)login.onclick=loginGoogle;
    const save=document.getElementById('cloudSaveNow');if(save)save.onclick=()=>push(true);
    const logout=document.getElementById('cloudSignOut');if(logout)logout.onclick=async()=>{enabled=false;await auth.signOut();};
  }
  async function loginGoogle(){
    show('Abriendo Google para iniciar sesión…');
    try{await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());}
    catch(err){show('No se pudo iniciar sesión: '+(err.code||err.message)+'. Revisá que GitHub Pages esté autorizado en Firebase.');}
  }
  async function load(){
    if(!user)return;
    show('Buscando tu recorrido guardado…');
    try{
      const doc=await ref().get();
      if(!user)return;
      const cloud=doc.exists?doc.data().draft:null;
      if(cloud && Array.isArray(cloud.choices)){
        if(bridge.hasProgress()){
          const cloudTime=Date.parse(doc.data().updatedAt||'')||0;
          const local=bridge.exportDraft();
          // Nunca sustituir un recorrido local sin consentimiento de la docente.
          const chooseCloud=confirm('Encontramos un recorrido en tu cuenta Google y otro en este dispositivo.\n\nAceptar: recuperar la versión guardada en Google.\nCancelar: mantener este dispositivo y subirlo a Google.');
          if(chooseCloud)bridge.importDraft(cloud);
          else await ref().set({draft:local,updatedAt:new Date().toISOString()});
        }else bridge.importDraft(cloud);
        enabled=true;show('Recorrido recuperado. Se guardarán automáticamente tus siguientes respuestas.');
      }else{
        enabled=true;
        if(bridge.hasProgress())await push(true);
        else show('Cuenta vinculada. Tu recorrido se guardará al empezar a responder.');
      }
    }catch(err){enabled=false;show('No se pudo acceder al guardado privado ('+(err.code||err.message)+'). Tus respuestas siguen en este dispositivo.');}
  }
  async function push(manual=false){
    if(!user||!enabled||busy)return;
    if(!bridge.hasProgress()){if(manual)show('Todavía no hay respuestas para guardar.');return;}
    busy=true;
    try{
      await ref().set({draft:bridge.exportDraft(),updatedAt:new Date().toISOString()});
      lastCloudSaved=Date.now();
      show('Guardado en línea confirmado a las '+timestamp()+'.');
    }catch(err){show('No se pudo guardar en línea ('+(err.code||err.message)+'). Las respuestas siguen guardadas en este navegador.');}
    finally{busy=false;}
  }
  window.addEventListener('checkout:draft-changed',()=>{
    if(!enabled||!user)return;
    clearTimeout(timer);
    timer=setTimeout(()=>push(),900);
  });
  auth.onAuthStateChanged(async next=>{
    user=next;enabled=false;clearTimeout(timer);
    if(user)await load();else show();
  });
  show();
})();
