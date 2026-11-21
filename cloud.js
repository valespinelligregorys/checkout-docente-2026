/* Check-out docente 2026 — recuperación verificable desde Firestore.
   Requiere checkoutBridge en app.js y cloud-config.js.
   Nunca reemplaza un borrador remoto al iniciar sesión; todas las escrituras
   exigen haber recuperado el documento existente o confirmado que no existe. */
(() => {
  'use strict';
  const node = document.getElementById('cloudArea');
  const bridge = window.checkoutBridge;
  const cfg = window.CHECKOUT_FIREBASE_CONFIG || {};
  if (!node) return;
  if (!bridge || typeof bridge.importDraft !== 'function' || typeof bridge.exportDraft !== 'function') {
    node.textContent = 'No se pudo conectar el recorrido con Google. Conservá tus respuestas en este dispositivo.';
    return;
  }
  if (!['apiKey','authDomain','projectId','appId'].every(k => typeof cfg[k] === 'string' && cfg[k].trim())) {
    node.textContent = 'Falta configurar Firebase. Las respuestas locales no se borraron.';
    return;
  }
  if (!window.firebase?.auth || !window.firebase?.firestore) {
    node.textContent = 'No se cargó Google. Abrí este sitio directamente en Safari o Chrome.';
    return;
  }
  const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(cfg);
  const auth = app.auth();
  const db = app.firestore();
  let user = null, cloudDraft = null, cloudKnown = false, syncEnabled = false;
  let busy = false, timer = null, generation = 0, mode = 'signed-out';
  let status = 'Ingresá con Google para continuar el recorrido guardado.';
  const safe = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const valid = d => d && Array.isArray(d.choices) && d.choices.length === 8 && Array.isArray(d.reflections) && d.reflections.length === 8;
  const count = d => valid(d) ? d.choices.filter(Boolean).length : 0;
  const present = d => valid(d) && (d.choices.some(Boolean) || d.reflections.some(v => String(v || '').trim()) || Boolean(d.name) || Boolean(d.room));
  const ref = () => db.collection('borradores_docentes_2026').doc(user.uid);
  function display() {
    if (!user) {
      node.innerHTML = `<strong>☁️ Continuar desde cualquier dispositivo</strong><p>Ingresá con tu cuenta de Google para recuperar tu recorrido.</p><button class="btn secondary" id="cloudLogin" type="button">Continuar con Google</button><p class="micro" role="status">${safe(status)}</p>`;
    } else {
      let html = `<strong>☁️ Mi recorrido guardado en Google</strong><p class="micro">Cuenta: <b>${safe(user.email || '')}</b></p>`;
      if (cloudKnown && cloudDraft) html += `<p><b>Google encontró ${count(cloudDraft)} de 8 elecciones.</b> Podés recuperar también las reflexiones escritas.</p>`;
      if (cloudKnown && !cloudDraft) html += `<p><b>No encontramos un recorrido en esta cuenta.</b> Verificá que sea la misma cuenta usada en el otro dispositivo.</p>`;
      html += `<p role="status" class="micro">${safe(status)}</p>`;
      if (cloudDraft) html += `<button class="btn secondary" id="cloudRecover" type="button">Recuperar y continuar mi recorrido →</button> `;
      if (syncEnabled) html += `<button class="btn ghost" id="cloudSave" type="button">Guardar ahora</button> `;
      if (cloudKnown && !cloudDraft && present(bridge.exportDraft())) html += `<button class="btn secondary" id="cloudInitialize" type="button">Guardar este recorrido en mi cuenta Google</button> `;
      html += `<button class="btn ghost" id="cloudReload" type="button">Consultar Google de nuevo</button> <button class="btn ghost" id="cloudLogout" type="button">Cambiar de cuenta</button>`;
      node.innerHTML = html;
    }
    const on = (id, fn) => { const btn = document.getElementById(id); if (btn) btn.addEventListener('click', fn); };
    on('cloudLogin', logIn); on('cloudRecover', recover); on('cloudSave', () => save(true));
    on('cloudInitialize', initialize); on('cloudReload', load);
    on('cloudLogout', async () => {syncEnabled = false; clearTimeout(timer); await auth.signOut();});
  }
  async function logIn() {
    status = 'Abriendo Google…'; display();
    try { await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); }
    catch (e) { status = `No se pudo ingresar: ${e.code || e.message}. Abrí la página directamente en Safari o Chrome.`; display(); }
  }
  async function load() {
    if (!user) return;
    const myGeneration = generation;
    syncEnabled = false; clearTimeout(timer); cloudKnown = false; cloudDraft = null;
    mode = 'loading'; status = 'Leyendo el recorrido desde los servidores de Google…'; display();
    try {
      const snapshot = await ref().get({source:'server'});
      if (!user || generation !== myGeneration) return;
      cloudKnown = true;
      const candidate = snapshot.exists ? snapshot.data()?.draft : null;
      cloudDraft = valid(candidate) ? candidate : null;
      mode = 'ready';
      if (cloudDraft) {
        status = 'Tu recorrido está disponible. Elegí «Recuperar y continuar mi recorrido» para abrirlo. No se ha sobrescrito ninguna respuesta.';
      } else if (snapshot.exists) {
        status = 'Hay un documento en Google, pero no tiene el formato de este Check-out. No se modificó.';
        mode = 'invalid';
      } else {
        // Sin documento remoto: se puede iniciar un borrador nuevo, pero no escribir
        // inmediatamente sobre otra cuenta si el dispositivo tiene datos locales.
        if (!present(bridge.exportDraft())) syncEnabled = true;
        status = 'Esta cuenta todavía no tiene borrador en Google. Podés empezar; las respuestas nuevas se guardarán en línea.';
      }
    } catch (e) {
      mode = 'error'; status = `No se pudo consultar Google (${e.code || e.message}). No se modificó tu recorrido.`;
    }
    display();
  }
  function showNextQuestion() {
    if (typeof bridge.resume === 'function') bridge.resume();
    else {
      const b = document.getElementById('resume') || document.getElementById('start');
      if (b) b.click();
    }
  }
  function recover() {
    if (!cloudDraft || !valid(cloudDraft)) return;
    const local = bridge.exportDraft();
    if (present(local) && JSON.stringify(local.choices) !== JSON.stringify(cloudDraft.choices)) {
      if (!confirm('Este dispositivo tiene respuestas diferentes. ¿Mostrar las respuestas guardadas en Google? El documento de Google no se borrará.')) return;
    }
    if (!bridge.importDraft(cloudDraft)) {
      status = 'No se pudieron aplicar las respuestas; siguen guardadas en Google.'; display(); return;
    }
    syncEnabled = true; mode = 'ready'; status = `Recuperadas ${count(cloudDraft)} de 8 elecciones. Podés continuar desde la primera pendiente.`;
    display(); showNextQuestion();
  }
  async function initialize() {
    if (!cloudKnown || cloudDraft || mode === 'invalid') return;
    if (!confirm('¿Guardar en tu cuenta de Google las respuestas que tenés en este dispositivo?')) return;
    syncEnabled = true; await save(true);
  }
  async function save(manual = false) {
    if (!user || !syncEnabled || busy) return;
    const d = bridge.exportDraft();
    if (!present(d)) { if (manual) { status = 'Todavía no hay respuestas para guardar.'; display(); } return; }
    busy = true;
    try {
      const now = new Date().toISOString();
      await ref().set({draft:d,updatedAt:now});
      cloudDraft = d; cloudKnown = true; mode = 'ready';
      status = `Guardado en línea confirmado: ${count(d)} de 8 elecciones.`;
    } catch (e) { status = `No se pudo guardar en Google (${e.code || e.message}). Las respuestas locales siguen disponibles.`; }
    finally { busy = false; display(); }
  }
  window.addEventListener('checkout:draft-changed', () => {
    if (!user || !syncEnabled || busy) return;
    clearTimeout(timer); timer = setTimeout(() => save(), 1000);
  });
  auth.onAuthStateChanged(async u => {
    generation++; clearTimeout(timer); syncEnabled = false;
    user = u; cloudDraft = null; cloudKnown = false;
    status = u ? 'Verificando tus respuestas en Google…' : 'Ingresá con Google para recuperar tu recorrido.';
    display(); if (u) await load();
  });
  display();
})();
