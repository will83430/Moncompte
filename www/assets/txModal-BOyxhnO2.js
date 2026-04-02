import{t as e}from"./rolldown-runtime-lhHHWwHU.js";import{d as t,f as n,n as r,p as i,r as a}from"./app-QBsFJik2.js";import{a as o,c as s,h as c,m as l,y as u}from"./service-D8kZS9E4.js";import{t as d}from"./toast-CJZpEd7x.js";var f=e({closeTxModal:()=>g,openTxModal:()=>h,txModalConfirm:()=>w,txModalDelete:()=>E,txModalRevert:()=>T,txModalSave:()=>S,txModalSaveTransfer:()=>C,txModalSetKind:()=>y}),p=null,m=`expense`;function h(e){p=e;let t=r(),n=t.txs.find(t=>t.id===e);n&&(n.kind===`transfer_out`||n.kind===`transfer_in`?_(n):(m=n.kind===`income`?`income`:`expense`,v(n,t)),document.getElementById(`tx-modal`).classList.add(`open`))}function g(){document.getElementById(`tx-modal`).classList.remove(`open`),p=null}function _(e){let t=document.getElementById(`tx-modal-inner`);t.innerHTML=`
    <div class="modal-handle"></div>
    <div class="modal-title">Modifier la transaction</div>

    <div class="modal-field" style="text-align:center;padding:6px 0 2px;">
      <span class="badge-transfer">↔ Virement</span>
      ${e.planned?`<span class="badge-planned">Prévu</span>`:``}
    </div>

    <div class="modal-field" style="display:flex;gap:10px;align-items:flex-end;">
      <div style="flex:0 0 64px;">
        <label>Icône</label>
        <input type="text" id="tx-edit-icon" value="${/^[\w_-]+$/.test(e.cat)?`↔️`:e.cat}" maxlength="4"
               style="font-size:22px;text-align:center;padding:10px 4px;width:64px;">
      </div>
      <div style="flex:1;">
        <label>Description</label>
        <input type="text" id="tx-edit-desc" value="${D(e.desc)}" placeholder="Description">
      </div>
    </div>

    <div class="modal-field">
      <label>Montant (€)</label>
      <input type="text" id="tx-edit-amt" inputmode="decimal" value="${n(e.amountCents)}">
    </div>

    <div class="modal-field">
      <label>Date</label>
      <input type="date" id="tx-edit-date" value="${e.date}">
    </div>

    <div class="modal-field">
      <label class="field-check" for="tx-edit-planned">
        <input type="checkbox" id="tx-edit-planned" ${e.planned?`checked`:``}>
        <div><div>Transaction prévue</div><small>Décocher quand elle est effectuée</small></div>
      </label>
    </div>

    <div class="modal-btns" style="margin-top:8px;">
      <button class="modal-btn-cancel" onclick="closeTxModal()">Annuler</button>
      ${e.planned?`<button class="modal-btn-save" onclick="txModalConfirm()">✓ Valider</button>`:`<button class="modal-btn-save" onclick="txModalSaveTransfer()">Enregistrer</button>`}
    </div>
  `}function v(e,t){let r=document.getElementById(`tx-modal-inner`);r.innerHTML=`
    <div class="modal-handle"></div>
    <div class="modal-title">Modifier la transaction</div>

    <div class="modal-field">
      <div style="display:flex;gap:8px;margin-bottom:4px;">
        <button id="tx-edit-btn-exp" onclick="txModalSetKind('expense')"
          style="flex:1;padding:10px;border-radius:8px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;cursor:pointer;
                 border:2px solid ${e.kind===`expense`?`#c8102e`:`var(--border)`};
                 background:${e.kind===`expense`?`#fff0f0`:`var(--bg)`};
                 color:${e.kind===`expense`?`#c8102e`:`var(--text2)`};">Dépense</button>
        <button id="tx-edit-btn-inc" onclick="txModalSetKind('income')"
          style="flex:1;padding:10px;border-radius:8px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;cursor:pointer;
                 border:2px solid ${e.kind===`income`?`var(--green)`:`var(--border)`};
                 background:${e.kind===`income`?`#f0fff4`:`var(--bg)`};
                 color:${e.kind===`income`?`var(--green)`:`var(--text2)`};">Revenu</button>
      </div>
    </div>

    <div class="modal-field">
      <label>Description</label>
      <input type="text" id="tx-edit-desc" value="${D(e.desc)}" placeholder="Description">
    </div>

    <div class="modal-field">
      <label>Montant (€)</label>
      <input type="text" id="tx-edit-amt" inputmode="decimal"
             value="${n(e.amountCents)}">
    </div>

    <div class="modal-field">
      <label>Date</label>
      <input type="date" id="tx-edit-date" value="${e.date}">
    </div>

    <div class="modal-field">
      <label>Catégorie</label>
      <select id="tx-edit-cat">${x(e.kind===`income`?`income`:`expense`,e.cat,t)}</select>
    </div>

    <div class="modal-field">
      <label class="field-check" for="tx-edit-planned">
        <input type="checkbox" id="tx-edit-planned" ${e.planned?`checked`:``}>
        <div><div>Transaction prévue</div><small>Décocher quand elle est effectuée</small></div>
      </label>
    </div>

    <div class="modal-field">
      <label class="field-check" for="tx-edit-neutral">
        <input type="checkbox" id="tx-edit-neutral" ${e.kind===`transfer_out`||e._neutral?`checked`:``}>
        <div><div>Virement neutre</div><small>Exclu des stats et du bilan</small></div>
      </label>
    </div>

    <div class="modal-field">
      <label class="field-check" for="tx-edit-rec">
        <input type="checkbox" id="tx-edit-rec" ${e.recurring?`checked`:``}>
        <div><div>Récurrente</div><small>Sera proposée automatiquement chaque mois</small></div>
      </label>
    </div>

    ${b(e,t)}

    <div class="modal-btns" style="margin-top:8px;">
      <button class="modal-btn-cancel" onclick="closeTxModal()">Annuler</button>
      <button class="modal-btn-save" onclick="txModalSave()">Enregistrer</button>
    </div>
  `}function y(e){m=e;let t=document.getElementById(`tx-edit-btn-exp`),n=document.getElementById(`tx-edit-btn-inc`);if(!t||!n)return;e===`expense`?(t.style.cssText=`flex:1;padding:10px;border-radius:8px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;cursor:pointer;border:2px solid #c8102e;background:#fff0f0;color:#c8102e;`,n.style.cssText=`flex:1;padding:10px;border-radius:8px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;cursor:pointer;border:2px solid var(--border);background:var(--bg);color:var(--text2);`):(n.style.cssText=`flex:1;padding:10px;border-radius:8px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;cursor:pointer;border:2px solid var(--green);background:#f0fff4;color:var(--green);`,t.style.cssText=`flex:1;padding:10px;border-radius:8px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;cursor:pointer;border:2px solid var(--border);background:var(--bg);color:var(--text2);`);let i=document.getElementById(`tx-edit-cat`);if(i){let t=r();i.innerHTML=x(e,i.value,t)}}function b(e,t){if(e.kind===`income`)return``;let n=t.accounts.filter(e=>e.type===`savings`),r=t.accounts.filter(e=>e.type===`credit`);if(n.length===0&&r.length===0)return``;let i=e.creditAccountId??``;return`
    <div class="modal-field">
      <label>Compte lié</label>
      <select id="tx-edit-credit">
        <option value="">— Aucun —</option>
        ${n.length?`<optgroup label="── Épargne (versement)">
        ${n.map(e=>`<option value="${e.id}" ${e.id===i?`selected`:``}>${e.icon} ${e.name}</option>`).join(``)}
       </optgroup>`:``}${r.length?`<optgroup label="── Crédit (remboursement)">
        ${r.map(e=>`<option value="${e.id}" ${e.id===i?`selected`:``}>${e.icon} ${e.name}</option>`).join(``)}
       </optgroup>`:``}
      </select>
      <small style="color:var(--text2);font-size:11px;">À la validation, injecte aussi une transaction dans ce compte</small>
    </div>
  `}function x(e,n,r){let i=e===`income`,a=[`Revenus pro`,`Revenus immo`,`Aides`,`Épargne`,`Divers`],o=t.filter(e=>i?a.includes(e.group):!a.includes(e.group)),s=(r.customCats||[]).filter(t=>t.type===e),c=new Map;for(let e of o)c.has(e.group)||c.set(e.group,[]),c.get(e.group).push(e);let l=``;for(let[e,t]of c){l+=`<optgroup label="── ${e}">`;for(let e of t)l+=`<option value="${e.id}" ${e.id===n?`selected`:``}>${e.icon} ${e.label}</option>`;l+=`</optgroup>`}if(s.length){l+=`<optgroup label="── Personnalisées">`;for(let e of s)l+=`<option value="${e.id}" ${e.id===n?`selected`:``}>${e.icon} ${e.label}</option>`;l+=`</optgroup>`}return l}async function S(){if(!p)return;let e=document.getElementById(`tx-edit-desc`).value.trim(),t=i(document.getElementById(`tx-edit-amt`).value),n=document.getElementById(`tx-edit-date`).value,o=document.getElementById(`tx-edit-cat`).value,s=document.getElementById(`tx-edit-planned`).checked,c=document.getElementById(`tx-edit-rec`).checked;if(t<0||!n){d(`⚠ Montant ou date invalide`);return}let l=document.getElementById(`tx-edit-neutral`).checked?`transfer_out`:m,f=document.getElementById(`tx-edit-credit`)?.value||void 0;await a(u(r(),p,{desc:e,amountCents:t,date:n,cat:o,planned:s,recurring:c,kind:l,...f?{creditAccountId:f}:{}})),g(),d(`✓ Transaction modifiée`)}async function C(){if(!p)return;let e=document.getElementById(`tx-edit-desc`).value.trim(),t=i(document.getElementById(`tx-edit-amt`).value),n=document.getElementById(`tx-edit-date`).value,o=document.getElementById(`tx-edit-planned`).checked,s=document.getElementById(`tx-edit-icon`).value.trim()||`↔️`;if(t<=0||!n){d(`⚠ Montant ou date invalide`);return}let c=r(),l=c.txs.find(e=>e.id===p);if(!l)return;let f={desc:e,amountCents:t,date:n,planned:o,cat:s},m=u(c,p,f);if(l.transferId){let e=c.txs.find(e=>e.transferId===l.transferId&&e.id!==p);e&&(m=u(m,e.id,f))}await a(m),g(),d(`✓ Virement modifié`)}async function w(){p&&(await a(o(r(),p)),g(),d(`✓ Transaction validée`))}async function T(){p&&(await a(c(r(),p)),g(),d(`↩ Transaction remise en prévu`))}async function E(){if(!p)return;let e=r(),t=e.txs.find(e=>e.id===p);if(t){if(t.transferId){if(!confirm(`Ce virement a deux jambes. Supprimer les deux ?`))return;await a(l(e,t.transferId))}else{if(!confirm(`Supprimer cette transaction ?`))return;await a(s(e,p))}g(),d(`✓ Transaction supprimée`)}}function D(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}window.openTxModal=h,window.closeTxModal=g,window.txModalSetKind=y,window.txModalSave=S,window.txModalSaveTransfer=C,window.txModalConfirm=w,window.txModalRevert=T,window.txModalDelete=E;export{f as t};