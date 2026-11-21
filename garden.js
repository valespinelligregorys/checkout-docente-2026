/* Jardín colectivo 2026: almacena solo aportes autorizados en Firestore.
   Requiere sesión Google. Cada cuenta puede escribir un documento propio.
   Las bitácoras personales continúan en otra colección privada. */
(() => {
  'use strict';
  const profiles=['exploradora','tejedora','arquitecta','observadora'];
  const collection='jardin_publico_2026';
  const getDB=()=>{
    if(!window.firebase?.apps?.length)throw Error('Firebase todavía está iniciando.');
    return firebase.app().firestore();
  };
  const currentUser=()=>{
    const u=window.firebase?.apps?.length ? firebase.app().auth().currentUser : null;
    if(!u)throw Error('Para sumar o ver el jardín, ingresá primero con «Continuar con Google».');
    return u;
  };
  const share=async fields=>{
    const u=currentUser();
    if(!profiles.includes(fields.profile)||!profiles.includes(fields.priority))throw Error('El perfil o la intención no son válidos.');
    const phrase=String(fields.phrase||'').trim().slice(0,160);
    const doc=getDB().collection(collection).doc(u.uid);
    // Un único aporte por cuenta, que podrá actualizarse si se comparte de nuevo.
    await doc.set({profile:fields.profile,priority:fields.priority,phrase,updatedAt:new Date().toISOString()});
    // Comprobación real en servidor antes de afirmar éxito.
    const checked=await doc.get({source:'server'});
    if(!checked.exists || checked.data()?.profile!==fields.profile)throw Error('Google no confirmó el registro.');
    return {ok:true};
  };
  const load=async()=>{
    currentUser();
    const snapshot=await getDB().collection(collection).get({source:'server'});
    const data={ok:true,total:0,profiles:{exploradora:0,tejedora:0,arquitecta:0,observadora:0},priorities:{exploradora:0,tejedora:0,arquitecta:0,observadora:0},phrases:[]};
    snapshot.forEach(doc=>{
      const v=doc.data();
      if(!profiles.includes(v.profile)||!profiles.includes(v.priority))return;
      data.total++;data.profiles[v.profile]++;data.priorities[v.priority]++;
      if(typeof v.phrase==='string'&&v.phrase.trim())data.phrases.push({text:v.phrase.slice(0,160),updatedAt:v.updatedAt||''});
    });
    data.phrases=data.phrases.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,40).map(x=>x.text);
    return data;
  };
  window.checkoutGarden={share,load};
})();
