import { h } from 'preact';
import { useState, useCallback, useMemo } from 'preact/hooks';
import { useSignal } from '../hooks/useSignal';
import { appData, currentAccountId, setAppData } from '../../store';
import { addRecurring, updateRecurring, deleteRecurring, generatePlannedFromRecs, addTransaction } from '../../core/service';
import { SYSTEM_CATS, getCatDef } from '../../core/categories';
import { nextMonth, currentMonthKey } from '../../core/balance';
import { toast } from '../toast';
import { fmt, inputToCents, centsToInput } from '../format';
import type { AccountId, RecId, RecurringTemplate, IsoDate } from '../../core/types';

const INCOME_GROUPS = ['Revenus pro', 'Revenus immo', 'Aides', 'Épargne', 'Divers'];

export function RecsPage() {
  const data      = useSignal(appData)!;
  const accountId = useSignal(currentAccountId) as AccountId;

  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState<RecId | null>(null);

  const targetMonth = nextMonth(currentMonthKey());
  const nextLabel   = new Date(targetMonth + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const recs    = data.recs.filter(r => r.accountId === accountId);
  const pending = recs.filter(r =>
    r.active && !data.txs.some(t => t.recId === r.id && t.date.startsWith(targetMonth))
  );

  const openForm = (id?: RecId) => {
    setEditId(id ?? null);
    setShowForm(true);
    setTimeout(() => document.getElementById('rec-form-wrap')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const generateAll = useCallback(async () => {
    const next  = generatePlannedFromRecs(data, targetMonth, accountId);
    const added = next.txs.length - data.txs.length;
    await setAppData(next);
    toast(added > 0 ? `✓ ${added} transaction${added > 1 ? 's' : ''} planifiée${added > 1 ? 's' : ''}` : 'Déjà à jour');
  }, [data, targetMonth, accountId]);

  const applyOne = useCallback(async (id: RecId) => {
    const rec = data.recs.find(r => r.id === id);
    if (!rec) return;
    if (data.txs.some(t => t.recId === id && t.date.startsWith(targetMonth))) { toast('Déjà importée pour ce mois'); return; }
    const [year, monthNum] = targetMonth.split('-').map(Number) as [number, number];
    const day  = Math.min(rec.dayOfMonth, new Date(year, monthNum, 0).getDate());
    const date = `${targetMonth}-${String(day).padStart(2, '0')}` as IsoDate;
    await setAppData(addTransaction(data, {
      accountId, date, amountCents: rec.amountCents, kind: rec.kind, cat: rec.cat,
      desc: rec.desc, planned: true, recurring: true, recId: rec.id,
      ...(rec.creditAccountId ? { creditAccountId: rec.creditAccountId } : {}),
    }));
    toast('✓ Importée pour ce mois');
  }, [data, targetMonth, accountId]);

  const deleteOne = useCallback(async (id: RecId) => {
    await setAppData(deleteRecurring(data, id));
    toast('✓ Récurrente supprimée');
  }, [data]);

  return (
    <div class="section active" id="sec-rec">
      {pending.length > 0 && (
        <div class="card" style="background:var(--accent-light,#fff8e6);border:1.5px solid var(--yellow,#f59e0b);margin-bottom:8px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <div>
              <div style="font-weight:600;font-size:14px;">⏳ {pending.length} récurrente{pending.length > 1 ? 's' : ''} à importer</div>
              <div style="font-size:12px;color:var(--text2);">Pour {nextLabel}</div>
            </div>
            <button class="modal-btn-save" onClick={generateAll} style="white-space:nowrap;padding:8px 14px;font-size:13px;">Tout importer</button>
          </div>
        </div>
      )}

      <div style="padding:0 14px 80px;">
        {recs.length === 0 ? (
          <p class="tx-empty">Aucune récurrente — appuyez sur + pour en créer une</p>
        ) : recs.map(r => (
          <RecItem key={r.id} rec={r} data={data} targetMonth={targetMonth}
            onEdit={openForm} onDelete={deleteOne} onApply={applyOne} />
        ))}
      </div>

      {showForm && (
        <div id="rec-form-wrap">
          <RecForm data={data} accountId={accountId} editId={editId} onClose={() => { setShowForm(false); setEditId(null); }} />
        </div>
      )}

      {!showForm && (
        <button onClick={() => openForm()}
          style="display:flex;position:fixed;bottom:80px;right:20px;width:52px;height:52px;border-radius:50%;background:var(--teal);color:#fff;border:none;font-size:28px;cursor:pointer;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,133,122,.35);z-index:10;">+</button>
      )}
    </div>
  );
}

function RecItem({ rec, data, targetMonth, onEdit, onDelete, onApply }: {
  rec: RecurringTemplate,
  data: any, targetMonth: string,
  onEdit: (id: RecId) => void, onDelete: (id: RecId) => void, onApply: (id: RecId) => void,
}) {
  const cat            = getCatDef(rec.cat, data.customCats);
  const alreadyApplied = data.txs.some((t: any) => t.recId === rec.id && t.date.startsWith(targetMonth));
  const isPending      = rec.active && !alreadyApplied;
  return (
    <div class="rec-item" style={rec.active ? '' : 'opacity:0.5;'}>
      <div class="tx-ico" style={`background:${cat.color}22;font-size:18px;`}>{cat.icon}</div>
      <div class="rec-body">
        <div class="rec-desc">{rec.desc}</div>
        <div class="rec-meta">
          Le {rec.dayOfMonth} du mois
          {alreadyApplied && <span class="badge-planned" style="background:#d1fae5;color:#065f46;">✓ importée</span>}
          {!rec.active && <span class="badge-planned">inactif</span>}
        </div>
      </div>
      <div class="rec-right">
        <div class={`rec-amt ${rec.kind === 'income' ? 'inc' : 'exp'}`}>{rec.kind === 'income' ? '+' : '-'}{fmt(rec.amountCents)}</div>
        <div style="display:flex;gap:4px;margin-top:6px;justify-content:flex-end;">
          {isPending && <button class="rec-apply-btn" onClick={() => onApply(rec.id)}>↓ Ce mois</button>}
          <button class="rec-edit-btn" onClick={() => onEdit(rec.id)}>✏️</button>
          <button class="rec-del" onClick={() => onDelete(rec.id)}>✕</button>
        </div>
      </div>
    </div>
  );
}

function RecForm({ data, accountId, editId, onClose }: { data: any, accountId: AccountId, editId: RecId | null, onClose: () => void }) {
  const existing = editId ? data.recs.find((r: any) => r.id === editId) : null;
  const [kind,      setKind]      = useState<'income'|'expense'>(existing?.kind ?? 'expense');
  const [desc,      setDesc]      = useState(existing?.desc ?? '');
  const [amount,    setAmount]    = useState(existing ? centsToInput(existing.amountCents) : '');
  const [cat,       setCat]       = useState(existing?.cat ?? 'autre_dep');
  const [day,       setDay]       = useState(existing?.dayOfMonth ?? 1);
  const [active,    setActive]    = useState(existing?.active ?? true);
  const [creditAcc, setCreditAcc] = useState(existing?.creditAccountId ?? '');

  const catOptions = useMemo(() => {
    const sys    = SYSTEM_CATS.filter(c => kind === 'income' ? INCOME_GROUPS.includes(c.group) : !INCOME_GROUPS.includes(c.group));
    const custom = (data.customCats || []).filter((c: any) => c.type === kind);
    const groups = new Map<string, typeof sys>();
    for (const c of sys) { if (!groups.has(c.group)) groups.set(c.group, []); groups.get(c.group)!.push(c); }
    return { groups, custom };
  }, [kind, data.customCats]);

  const savingsAccounts = data.accounts.filter((a: any) => a.type === 'savings');
  const creditAccounts  = data.accounts.filter((a: any) => a.type === 'credit');

  const handleSave = async () => {
    const amountCents = inputToCents(amount);
    if (!desc.trim() || amountCents <= 0 || !cat || !day || day < 1 || day > 31) { toast('⚠ Champs invalides'); return; }
    const params = { kind, desc: desc.trim(), amountCents, cat, dayOfMonth: day, ...(creditAcc ? { creditAccountId: creditAcc as AccountId } : {}) };
    if (editId) {
      await setAppData(updateRecurring(data, editId, { ...params, active }));
      toast('✓ Récurrente modifiée');
    } else {
      await setAppData(addRecurring(data, { accountId, ...params, active: true }));
      toast('✓ Récurrente ajoutée');
    }
    onClose();
  };

  return (
    <div class="card" style="margin-top:8px;">
      <div class="card-title" style="margin-bottom:12px;">{editId ? 'Modifier' : 'Nouvelle'} récurrente</div>
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <button onClick={() => setKind('expense')} style={`flex:1;padding:10px;border-radius:8px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;cursor:pointer;border:2px solid ${kind==='expense'?'#c8102e':'var(--border)'};background:${kind==='expense'?'#fff0f0':'var(--bg)'};color:${kind==='expense'?'#c8102e':'var(--text2)'};`}>Dépense</button>
        <button onClick={() => setKind('income')} style={`flex:1;padding:10px;border-radius:8px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;cursor:pointer;border:2px solid ${kind==='income'?'var(--green)':'var(--border)'};background:${kind==='income'?'#f0fff4':'var(--bg)'};color:${kind==='income'?'var(--green)':'var(--text2)'};`}>Revenu</button>
      </div>
      <div class="modal-field"><label>Description</label><input type="text" placeholder="Ex: Loyer, Salaire…" value={desc} onInput={e => setDesc((e.target as HTMLInputElement).value)} /></div>
      <div class="modal-field"><label>Montant (€)</label><input type="text" inputMode="decimal" value={amount} onInput={e => setAmount((e.target as HTMLInputElement).value)} /></div>
      <div class="modal-field">
        <label>Catégorie</label>
        <select value={cat} onChange={e => setCat((e.target as HTMLSelectElement).value)}>
          {[...catOptions.groups.entries()].map(([grp, cats]) => (<optgroup key={grp} label={`── ${grp}`}>{cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</optgroup>))}
          {catOptions.custom.length > 0 && <optgroup label="── Personnalisées">{catOptions.custom.map((c: any) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</optgroup>}
        </select>
      </div>
      <div class="modal-field"><label>Jour du mois</label><input type="number" min="1" max="31" value={day} onChange={e => setDay(parseInt((e.target as HTMLInputElement).value, 10))} /></div>
      {(savingsAccounts.length > 0 || creditAccounts.length > 0) && (
        <div class="modal-field">
          <label>Compte lié</label>
          <select value={creditAcc} onChange={e => setCreditAcc((e.target as HTMLSelectElement).value)}>
            <option value="">— Aucun —</option>
            {savingsAccounts.length > 0 && <optgroup label="── Épargne (versement)">{savingsAccounts.map((a: any) => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}</optgroup>}
            {creditAccounts.length > 0 && <optgroup label="── Crédit (remboursement)">{creditAccounts.map((a: any) => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}</optgroup>}
          </select>
        </div>
      )}
      {editId && <div class="modal-field"><label class="field-check"><input type="checkbox" checked={active} onChange={e => setActive((e.target as HTMLInputElement).checked)} /><div><div>Active</div><small>Décocher pour suspendre sans supprimer</small></div></label></div>}
      <div class="modal-btns" style="margin-top:12px;">
        <button class="modal-btn-cancel" onClick={onClose}>Annuler</button>
        <button class="modal-btn-save" onClick={handleSave}>Enregistrer</button>
      </div>
    </div>
  );
}
