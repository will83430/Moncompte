import { h } from 'preact';
import { useState, useCallback, useRef } from 'preact/hooks';
import { useSignal } from '../hooks/useSignal';
import { appData, setAppData, currentAccountId } from '../../store';
import { addAccount, updateAccount, deleteAccountData } from '../../core/service';
import { parseCSV, markDuplicates, importCsvRows } from '../../services/csv-import';
import { getCatDef } from '../../core/categories';
import { toast } from '../toast';
import type { Account, AccountId, AccountType } from '../../core/types';
import type { CsvRow } from '../../services/csv-import';

const TYPE_LABELS: Record<AccountType, string> = {
  checking: '🏦 Compte courant',
  savings:  '🏧 Épargne / Livret',
  credit:   '💳 Crédit',
};

const DEFAULT_ICONS: Record<AccountType, string> = {
  checking: '🏦',
  savings:  '🏧',
  credit:   '💳',
};

function genId(): AccountId {
  return ('acc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)) as AccountId;
}

export function SettingsPage() {
  const data = useSignal(appData)!;
  const [editing, setEditing] = useState<AccountId | 'new' | null>(null);

  const startNew  = () => setEditing('new');
  const startEdit = (id: AccountId) => setEditing(id);
  const close     = () => setEditing(null);

  const handleDelete = useCallback(async (id: AccountId) => {
    const acc = data.accounts.find(a => a.id === id);
    if (!acc) return;
    const checkings = data.accounts.filter(a => a.type === 'checking');
    if (acc.type === 'checking' && checkings.length <= 1) {
      toast('Impossible de supprimer le seul compte courant');
      return;
    }
    const txCount = data.txs.filter(t => t.accountId === id).length;
    const msg = txCount > 0
      ? `Supprimer "${acc.name}" et ses ${txCount} transactions ?`
      : `Supprimer "${acc.name}" ?`;
    if (!window.confirm(msg)) return;
    await setAppData(deleteAccountData(data, id));
    toast('✓ Compte supprimé');
  }, [data]);

  return (
    <div class="section active" id="sec-settings" style="padding:14px 14px 90px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <div class="card-title">Mes comptes</div>
        <button class="modal-btn-save" onClick={startNew} style="padding:8px 16px;font-size:13px;">+ Ajouter</button>
      </div>

      {data.accounts.map(acc => (
        <div key={acc.id} class="card" style="margin-bottom:10px;padding:14px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="font-size:28px;">{acc.icon}</div>
            <div style="flex:1;">
              <div style="font-weight:600;font-size:15px;">{acc.name}</div>
              <div style="font-size:12px;color:var(--text2);">{TYPE_LABELS[acc.type]}</div>
              {acc.type === 'credit' && acc.mensualite && (
                <div style="font-size:12px;color:var(--text2);">
                  Mensualité : {(acc.mensualite / 100).toFixed(2).replace('.', ',')} €
                </div>
              )}
            </div>
            <div style="display:flex;gap:6px;">
              <button class="rec-edit-btn" onClick={() => startEdit(acc.id)}>✏️</button>
              <button class="rec-del" onClick={() => handleDelete(acc.id)}>✕</button>
            </div>
          </div>
        </div>
      ))}

      {editing && (
        <AccountForm
          data={data}
          editId={editing === 'new' ? null : editing}
          onClose={close}
        />
      )}

      <div style="margin-top:20px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div class="card-title">Import relevé bancaire</div>
        </div>
        <CsvImport />
      </div>

    </div>
  );
}

function AccountForm({ data, editId, onClose }: {
  data: ReturnType<typeof useSignal<typeof appData>>,
  editId: AccountId | null,
  onClose: () => void,
}) {
  const existing = editId ? data.accounts.find(a => a.id === editId) : null;

  const [name,       setName]       = useState(existing?.name ?? '');
  const [type,       setType]       = useState<AccountType>(existing?.type ?? 'checking');
  const [icon,       setIcon]       = useState(existing?.icon ?? '🏦');
  const [mensualite, setMensualite] = useState(
    existing?.mensualite ? (existing.mensualite / 100).toFixed(2).replace('.', ',') : ''
  );

  const handleTypeChange = (t: AccountType) => {
    setType(t);
    if (!existing) setIcon(DEFAULT_ICONS[t]);
  };

  const handleSave = useCallback(async () => {
    if (!name.trim()) { toast('⚠ Nom requis'); return; }

    const mensualiteCents = mensualite
      ? Math.round(parseFloat(mensualite.replace(',', '.')) * 100)
      : undefined;

    if (editId) {
      await setAppData(updateAccount(data, editId, {
        name: name.trim(), type, icon,
        ...(type === 'credit' && mensualiteCents ? { mensualite: mensualiteCents } : { mensualite: undefined }),
      }));
      toast('✓ Compte modifié');
    } else {
      const newAcc: Account = {
        id:   genId(),
        name: name.trim(),
        type, icon,
        ...(type === 'credit' && mensualiteCents ? { mensualite: mensualiteCents } : {}),
      };
      await setAppData(addAccount(data, newAcc));
      toast('✓ Compte créé');
    }
    onClose();
  }, [name, type, icon, mensualite, editId, data, onClose]);

  return (
    <div class="card" style="margin-top:12px;">
      <div class="card-title" style="margin-bottom:12px;">
        {editId ? 'Modifier le compte' : 'Nouveau compte'}
      </div>

      <div class="modal-field">
        <label>Type</label>
        <div style="display:flex;flex-direction:column;gap:8px;">
          {(Object.entries(TYPE_LABELS) as [AccountType, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              style={`text-align:left;padding:10px 14px;border-radius:10px;font-family:'Inter',sans-serif;font-size:14px;font-weight:500;cursor:pointer;border:2px solid ${type === t ? 'var(--teal)' : 'var(--border)'};background:${type === t ? 'var(--teal-light)' : 'var(--bg)'};color:${type === t ? 'var(--teal)' : 'var(--text)'};`}
            >{label}</button>
          ))}
        </div>
      </div>

      <div class="modal-field">
        <label>Nom</label>
        <input type="text" placeholder="Ex: Compte courant, Livret A…"
          value={name} onInput={e => setName((e.target as HTMLInputElement).value)} />
      </div>

      <div class="modal-field">
        <label>Icône (emoji)</label>
        <input type="text" placeholder="🏦" maxLength={2}
          value={icon} onInput={e => setIcon((e.target as HTMLInputElement).value)} />
      </div>

      {type === 'credit' && (
        <div class="modal-field">
          <label>Mensualité (€)</label>
          <input type="text" inputMode="decimal" placeholder="ex: 113,38"
            value={mensualite} onInput={e => setMensualite((e.target as HTMLInputElement).value)} />
        </div>
      )}

      <div class="modal-btns">
        <button class="modal-btn-cancel" onClick={onClose}>Annuler</button>
        <button class="modal-btn-save" onClick={handleSave}>Enregistrer</button>
      </div>
    </div>
  );
}

function CsvImport() {
  const data                          = useSignal(appData)!;
  const accId                         = useSignal(currentAccountId) as AccountId;
  const [rows,       setRows]         = useState<CsvRow[] | null>(null);
  const [targetAcc,  setTargetAcc]    = useState<AccountId>(accId);
  const [busy,       setBusy]         = useState(false);
  const fileRef                       = useRef<HTMLInputElement>(null);

  const account   = data.accounts.find(a => a.id === targetAcc);
  const isCredit  = account?.type === 'credit';
  const newCount  = rows?.filter(r => r.status === 'new').length ?? 0;
  const dupCount  = rows?.filter(r => r.status === 'duplicate').length ?? 0;

  const handleFile = useCallback((e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    setBusy(true);
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const text    = ev.target?.result as string;
        const parsed  = parseCSV(text);
        if (!parsed) { toast('Format CSV non reconnu'); setBusy(false); return; }
        const marked  = markDuplicates(parsed, data, targetAcc);
        setRows(marked);
      } catch { toast('Erreur lecture fichier'); }
      setBusy(false);
    };
    reader.readAsText(file, 'ISO-8859-1');
  }, [data, targetAcc]);

  const handleAccChange = useCallback((id: AccountId) => {
    setTargetAcc(id);
    if (rows) setRows(markDuplicates(rows, data, id));
  }, [rows, data]);

  const handleImport = useCallback(async () => {
    if (!rows) return;
    const { data: next, count } = importCsvRows(data, rows, targetAcc, isCredit);
    await setAppData(next);
    setRows(null);
    if (fileRef.current) fileRef.current.value = '';
    toast(`✓ ${count} transaction${count > 1 ? 's' : ''} importée${count > 1 ? 's' : ''}`);
  }, [rows, data, targetAcc, isCredit]);

  const fmt = (c: number) => (Math.abs(c) / 100).toFixed(2).replace('.', ',') + ' €';

  return (
    <div class="card" style="padding:14px;">

      {/* Zone de drop / sélection fichier — visible tant que pas de preview */}
      {!rows && !busy && (
        <>
          <div class="modal-field">
            <label>Compte cible</label>
            <select value={targetAcc} onChange={e => handleAccChange((e.target as HTMLSelectElement).value as AccountId)}>
              {data.accounts.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
            </select>
          </div>
          <label style="display:block;cursor:pointer;">
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} style="display:none;" />
            <div style="border:2px dashed var(--teal);border-radius:14px;padding:28px 16px;text-align:center;background:var(--teal-light);">
              <div style="font-size:32px;margin-bottom:8px;">📂</div>
              <div style="font-weight:600;font-size:14px;color:var(--teal);">Sélectionner un relevé CSV</div>
              <div style="font-size:11px;color:var(--text3);margin-top:6px;">CIC · Boursorama · Crédit Agricole · BNP · Postale · SG · LCL</div>
            </div>
          </label>
        </>
      )}

      {busy && <div style="text-align:center;color:var(--text2);font-size:13px;padding:24px;">⏳ Analyse en cours…</div>}

      {rows && (
        <div>
          {/* Résumé + changement de compte */}
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:8px;">
            <div>
              <span style="color:var(--green);font-weight:700;font-size:15px;">{newCount} nouvelle{newCount > 1 ? 's' : ''}</span>
              {dupCount > 0 && <span style="color:var(--text3);font-size:12px;margin-left:8px;">{dupCount} doublon{dupCount > 1 ? 's' : ''}</span>}
            </div>
            <select value={targetAcc} onChange={e => handleAccChange((e.target as HTMLSelectElement).value as AccountId)}
              style="font-size:13px;padding:6px 10px;border-radius:8px;border:1.5px solid var(--border);background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;">
              {data.accounts.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
            </select>
          </div>

          <div style="max-height:300px;overflow-y:auto;border:1px solid var(--border);border-radius:10px;margin-bottom:12px;">
            {rows.filter(r => r.status === 'new').slice(0, 50).map((r, i) => (
              <div key={i} style={`display:flex;align-items:center;gap:8px;padding:10px 12px;font-size:12px;${i > 0 ? 'border-top:1px solid var(--border);' : ''}`}>
                <span style="font-size:18px;">{getCatDef(r.cat, data.customCats).icon}</span>
                <div style="flex:1;min-width:0;">
                  <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;">{r.label}</div>
                  <div style="font-size:11px;color:var(--text3);">{r.date} · {getCatDef(r.cat, data.customCats).label}</div>
                </div>
                <span style={`font-weight:700;white-space:nowrap;${r.amountCents >= 0 ? 'color:var(--green)' : 'color:#c8102e'}`}>
                  {r.amountCents >= 0 ? '+' : '-'}{fmt(r.amountCents)}
                </span>
              </div>
            ))}
            {newCount > 50 && (
              <div style="text-align:center;padding:10px;font-size:12px;color:var(--text3);border-top:1px solid var(--border);">… et {newCount - 50} autres</div>
            )}
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <button class="modal-btn-cancel" onClick={() => { setRows(null); if (fileRef.current) fileRef.current.value = ''; }}>Annuler</button>
            <button class="modal-btn-save" onClick={handleImport} disabled={newCount === 0}>
              Importer {newCount > 0 ? newCount : ''} transaction{newCount > 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
