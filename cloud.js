/* Check-out docente 2026: sincronización privada y recuperación segura.
   Reemplazar SOLO cloud.js. Compatible con app.js (checkoutBridge) y cloud-config.js.
   No comparte respuestas con el mapa colectivo. */
(() => {
  'use strict';
  const node = document.getElementById('cloudArea');
  const bridge = window.checkoutBridge;
  const cfg = window.CHECKOUT_FIREBASE_CONFIG || {};
  if (!node) return;
  if (!bridge || typeof bridge.exportDraft !== 'function' || typeof bridge.importDraft !== 'function') {
    node.textContent = 'No se pudo iniciar la recuperación. Verificá que app.js se haya cargado correctamente.';
    return;
  }
  if (!['apiKey', 'authDomain', 'projectId', 'appId'].every(k => typeof cfg[k] === 'string' && cfg[k])) {
    node.textContent = 'Falta la configuración de Firebase. No borres las respuestas de este dispositivo.';
    return;
  }
  if (!window.firebase || !firebase.auth || !firebase.firestore) {
    node.textContent = 'No se pudo abrir Firebase. Tu recorrido local permanece guardado.';
    return;
  }
  const firebaseApp = firebase.apps.length ? firebase.app() : firebase.initializeApp(cfg);
  const auth = firebaseApp.auth();
  const db = firebaseApp.firestore();
  let currentUser = null;
  let remote = null;
  let remoteExists = false;
  let status = 'Iniciando…';
  let mode = 'signed-out';
  let syncEnabled = false;
  let writeInProgress = false;
  let debounce = null;
  let session = 0;
  let currentRemoteVersion = '';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[ch]));
  const count = draft => Array.isArray(draft?.choices) ? draft.choices.filter(v => typeof v === 'string' && v.length > 0).length : 0;
  const hasData = draft => count(draft) > 0 || Boolean(draft?.name) || Boolean(draft?.room) || (Array.isArray(draft?.reflections) && draft.reflections.some(v => String(v || '').trim()));
  const valid = draft => Boolean(draft && Array.isArray(draft.choices) && draft.choices.length === 8 && Array.isArray(draft.reflections) && draft.reflections.length === 8);
  const getRef = () => db.collection('borradores_docentes_2026').doc(currentUser.uid);
  const summary = (d) => `${count(d)} de 8 elecciones${d?.reflections?.some(v=>String(v||'').trim()) ? ' y reflexiones' : ''}`;
  const comparable = d => JSON.stringify({choices:d?.choices,reflections:d?.reflections,name:d?.name,room:d?.room});
  function render() {
    if (!currentUser) {
      node.innerHTML = `<strong>☁️ Recuperá tu recorrido desde cualquier dispositivo</strong><p>Ingresá con la misma cuenta de Google que usaste antes.</p><button id="loginCloud" class="btn secondary" type="button">Continuar con Google</button><p class="micro">${escape(status)}</p>`;
    } else {
      let body = `<strong>☁️ Tu recorrido en Google</strong><p class="micro">Cuenta: <b>${escape(currentUser.email || '')}</b></p>`;
      if (remoteExists) body += `<p><b>En Google encontramos ${escape(summary(remote))}.</b> Tus respuestas siguen en tu cuenta y no se borrarán sin tu autorización.</p>`;
      else if (mode !== 'loading' && mode !== 'error') body += `<p>Esta cuenta aún no tiene un recorrido válido guardado en Google.</p>`;
      body += `<p role="status" class="micro">${escape(status)}</p>`;
      if (remoteExists) body += `<button id="recoverCloud" class="btn secondary" type="button">Recuperar mi recorrido desde Google →</button> `;
      if (mode === 'conflict') body += `<button id="keepLocal" class="btn ghost" type="button">Usar mi borrador de este dispositivo</button> `;
      if (syncEnabled) body += `<button id="saveCloud" class="btn ghost" type="button">Guardar ahora</button> `;
      body += `<button id="reloadCloud" class="btn ghost" type="button">Consultar Google de nuevo</button> <button id="logoutCloud" class="btn ghost" type="button">Cambiar de cuenta</button>`;
      node.innerHTML = body;
    }
    const on = (id, fn) => {const b = document.getElementById(id); if (b) b.addEventListener('click', fn);};
    on('loginCloud', login);
    on('recoverCloud', recover);
    on('keepLocal', keepLocal);
    on('saveCloud', () => save(true));
    on('reloadCloud', load);
    on('logoutCloud', async () => { syncEnabled = false; await auth.signOut(); });
  }
  async function login() {
    status = 'Abriendo tu cuenta de Google…'; render();
    try { await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); }
    catch (e) { status = `No se pudo ingresar (${e.code || e.message}). Intentá desde Safari o Chrome fuera de la vista previa de otra aplicación.`; render(); }
  }
  async function load() {
    if (!currentUser) return;
    const mySession = session;
    clearTimeout(debounce); syncEnabled = false; mode = 'loading';
    status = 'Consultando el borrador guardado en Google…'; render();
    try {
      const snap = await getRef().get({ source: 'server' });
      if (!currentUser || mySession !== session) return;
      const data = snap.exists ? snap.data() : null;
      remote = valid(data?.draft) ? data.draft : null;
      remoteExists = Boolean(remote);
      currentRemoteVersion = data?.updatedAt || '';
      const local = bridge.exportDraft();
      if (remoteExists) {
        if (!hasData(local) || comparable(local) === comparable(remote)) {
          if (comparable(local) !== comparable(remote)) {
            if (!bridge.importDraft(remote)) throw new Error('No se pudo mostrar el borrador encontrado');
          }
          syncEnabled = true; mode = 'ready';
          status = `Recorrido recuperado: ${summary(remote)}. Tocá «Continuar donde lo dejé» en la página.`;
        } else {
          mode = 'conflict';
          status = `Este dispositivo también tiene respuestas (${summary(local)}). Para proteger ambas versiones no se sincronizará ninguna hasta que elijas cuál conservar. Presioná «Recuperar mi recorrido desde Google» para continuar el de la nube.`;
        }
      } else {
        mode = 'ready'; syncEnabled = true;
        status = hasData(local) ? 'Esta cuenta no tiene un recorrido previo. Tus respuestas locales están disponibles: tocá «Guardar ahora» para asociarlas a esta cuenta.' : 'Cuenta conectada. Las respuestas nuevas se guardarán automáticamente en Google.';
      }
      render();
    } catch (e) { syncEnabled = false; mode = 'error'; status = `No se pudieron leer las respuestas (${e.code || e.message}). No modificamos el borrador de Google.`; render(); }
  }
  function recover() {
    if (!remoteExists || !valid(remote)) return;
    if (hasData(bridge.exportDraft()) && comparable(bridge.exportDraft()) !== comparable(remote)) {
      if (!confirm('Este navegador tiene un recorrido diferente. Se mostrará aquí el que está guardado en Google. El borrador de Google NO se borrará. ¿Recuperarlo?')) return;
    }
    if (bridge.importDraft(remote)) {
      syncEnabled = true; mode = 'ready'; status = `¡Recuperado! ${summary(remote)}. Tocá «Continuar donde lo dejé» en la página para seguir.`; render();
    } else { status = 'No se pudo mostrar el borrador. Las respuestas de Google siguen guardadas.'; render(); }
  }
  async function keepLocal() {
    if (!currentUser || !hasData(bridge.exportDraft())) return;
    if (remoteExists && !confirm('Esto REEMPLAZARÁ el recorrido almacenado en Google por las respuestas de este dispositivo. ¿Estás segura?')) return;
    syncEnabled = true; mode = 'ready'; await save(true);
  }
  async function save(manual = false) {
    if (!currentUser || !syncEnabled || writeInProgress) return;
    const draft = bridge.exportDraft();
    if (!hasData(draft)) { if (manual) {status='Todavía no hay respuestas para guardar.';render();} return; }
    writeInProgress = true;
    try {
      const now = new Date().toISOString();
      await getRef().set({ draft, updatedAt: now });
      remote = draft; remoteExists = true; currentRemoteVersion = now;
      status = `Guardado en línea confirmado (${summary(draft)}).`; mode='ready'; render();
    } catch (e) { status = `Falló el guardado en línea (${e.code || e.message}). Tus respuestas locales siguen guardadas.`; render(); }
    finally { writeInProgress = false; }
  }
  window.addEventListener('checkout:draft-changed', () => {
    if (!currentUser || !syncEnabled) return;
    clearTimeout(debounce); debounce = setTimeout(() => save(), 1000);
  });
  auth.onAuthStateChanged(async u => {
    session++; clearTimeout(debounce); currentUser=u; remote=null;remoteExists=false;syncEnabled=false;
    mode=u?'loading':'signed-out';status=u?'Verificando tu cuenta y tus respuestas…':'Ingresá con Google para recuperar tu recorrido.';
    render();if (u) await load();
  });
  render();
})();
