import { h } from 'preact';
import { useState, useCallback, useMemo } from 'preact/hooks';
import { useSignal } from '../hooks/useSignal';
import { appData, currentAccountId, setAppData, navigate } from '../../store';
import { addTransaction, addTransfer } from '../../core/service';
import { SYSTEM_CATS } from '../../core/categories';
import { toast } from '../toast';
import { inputToCents } from '../format';
import type { IsoDate, AccountId } from '../../core/types';

type FormKind = 'income' | 'expense' | 'transfer';

const INCOME_GROUPS = ['Revenus pro', 'Revenus immo', 'Aides', 'Épargne', 'Divers'];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AddPage() {
  const data      = useSignal(appData)!;
  const accountId = useSignal(currentAccountId) as AccountId;

  const [kind,       setKind]       = useState<FormKind>('expense');
  const [desc,       setDesc]       = useState('');
  const [amount,     setAmount]     = useState('');
  const [date,       setDate]       = useState(todayIso);
  const [cat,        setCat]        = useState('autre_dep');
  const [planned,    setPlanned]    = useState(false);
  const [recurring,  setRecurring]  = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const [creditAcc,  setCreditAcc]  = useState('');

  const isTransfer = kind === 'transfer';

  const catOptions = useMemo(() => {
    const sys    = SYSTEM_CATS.filter(c => kind === 'income' ? INCOME_GROUPS.includes(c.group) : !INCOME_GROUPS.includes(c.group));
    const custom = (data.customCats || []).filter(c => c.type === kind);
    const groups = new Map<string, typeof sys>();
    for (const c of sys) {
      if (!groups.has(c.group)) groups.set(c.group, []);
      groups.get(c.group)!.push(c);
    }
    return { groups, custom };
  }, [kind, data.customCats]);

  const handleKind = useCallback((k: FormKind) => {
    setKind(k);
    setCat(k === 'income' ? 'salaire' : 'autre_dep');
  }, []);

  const reset = useCallback(() => {
    setKind('expense');
    setDesc('');
    setAmount('');
    setDate(todayIso());
    setCat('autre_dep');
    setPlanned(false);
    setRecurring(false);
    setTransferTo('');
    setCreditAcc('');
  }, []);

  const handleSubmit = useCallback(async (e: Event) => {
    e.preventDefault();
    const amountCents = inputToCents(amount);

    if (!desc.trim())     { toast('Ajoutez une description'); return; }
    if (amountCents <= 0) { toast('Montant invalide'); return; }
    if (!date)            { toast('Date requise'); return; }

    try {
      if (isTransfer) {
        const toId = transferTo as AccountId;
        if (!toId || toId === accountId) { toast('Compte destinataire invalide'); return; }
        await setAppData(addTransfer(data, {
          fromAccountId: accountId,
          toAccountId:   toId,
          amountCents,
          date:  date as IsoDate,
          desc:  desc.trim() || 'Virement',
          planned,
        }));
        toast('✓ Virement ajouté');
      } else {
        await setAppData(addTransaction(data, {
          accountId,
          date:    date as IsoDate,
          amountCents,
          kind:    kind as 'income' | 'expense',
          cat,
          desc:    desc.trim(),
          planned,
          recurring,
          ...(creditAcc ? { creditAccountId: creditAcc as AccountId } : {}),
        }));
        toast(`✓ ${kind === 'income' ? 'Revenu' : 'Dépense'} ajouté${kind === 'income' ? '' : 'e'}`);
      }
      reset();
      navigate('dash');
    } catch (err) {
      toast('Erreur lors de l\'enregistrement');
      console.error(err);
    }
  }, [desc, amount, date, cat, planned, recurring, kind, isTransfer, transferTo, creditAcc, accountId, data, reset]);

  const otherAccounts   = data.accounts.filter(a => a.id !== accountId);
  const savingsAccounts = data.accounts.filter(a => a.type === 'savings');
  const creditAccounts  = data.accounts.filter(a => a.type === 'credit');

  return (
    <div class="section active" id="sec-add">
      <form id="add-form" class="form-card" onSubmit={handleSubmit}>

        <div class="type-btns">
          <button type="button" class={`type-btn${kind === 'expense'  ? ' act-exp'      : ''}`} onClick={() => handleKind('expense')}>Dépense</button>
          <button type="button" class={`type-btn${kind === 'income'   ? ' act-inc'      : ''}`} onClick={() => handleKind('income')}>Revenu</button>
          <button type="button" class={`type-btn${kind === 'transfer' ? ' act-transfer' : ''}`} onClick={() => handleKind('transfer')}>Virement</button>
        </div>

        <div class="form-field">
          <label class="form-label">DESCRIPTION</label>
          <input type="text" class="form-input" placeholder="Ex : Loyer, EDF, Salaire…"
            value={desc} onInput={e => setDesc((e.target as HTMLInputElement).value)} required />
        </div>

        <div class="form-field">
          <label class="form-label">MONTANT (€)</label>
          <input type="text" class="form-input" placeholder="0,00" inputMode="decimal"
            value={amount} onInput={e => setAmount((e.target as HTMLInputElement).value)} required />
        </div>

        <div class="form-field">
          <label class="form-label">DATE</label>
          <input type="date" class="form-input"
            value={date} onChange={e => setDate((e.target as HTMLInputElement).value)} required />
        </div>

        {!isTransfer && (
          <div class="form-field">
            <label class="form-label">CATÉGORIE</label>
            <select class="form-select" value={cat} onChange={e => setCat((e.target as HTMLSelectElement).value)}>
              {[...catOptions.groups.entries()].map(([grp, cats]) => (
                <optgroup key={grp} label={`── ${grp}`}>
                  {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </optgroup>
              ))}
              {catOptions.custom.length > 0 && (
                <optgroup label="── Personnalisées">
                  {catOptions.custom.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </optgroup>
              )}
            </select>
          </div>
        )}

        {kind === 'expense' && (savingsAccounts.length > 0 || creditAccounts.length > 0) && (
          <div class="form-field">
            <label class="form-label">COMPTE LIÉ</label>
            <select class="form-select" value={creditAcc} onChange={e => setCreditAcc((e.target as HTMLSelectElement).value)}>
              <option value="">— Aucun —</option>
              {savingsAccounts.length > 0 && (
                <optgroup label="── Épargne (versement)">
                  {savingsAccounts.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
                </optgroup>
              )}
              {creditAccounts.length > 0 && (
                <optgroup label="── Crédit (remboursement)">
                  {creditAccounts.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
                </optgroup>
              )}
            </select>
          </div>
        )}

        {isTransfer && (
          <div class="form-field">
            <label class="form-label">VERS LE COMPTE</label>
            <select class="form-select" value={transferTo} onChange={e => setTransferTo((e.target as HTMLSelectElement).value)}>
              {otherAccounts.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
            </select>
          </div>
        )}

        {!isTransfer && (
          <>
            <label class="form-check">
              <input type="checkbox" checked={planned} onChange={e => setPlanned((e.target as HTMLInputElement).checked)} />
              <div>
                <div class="form-check-title">Transaction prévue</div>
                <div class="form-check-sub">À décocher quand elle est effectuée</div>
              </div>
            </label>
            <label class="form-check">
              <input type="checkbox" checked={recurring} onChange={e => setRecurring((e.target as HTMLInputElement).checked)} />
              <div>
                <div class="form-check-title">Dépense récurrente</div>
                <div class="form-check-sub">Se renouvelle automatiquement chaque mois</div>
              </div>
            </label>
          </>
        )}

        {isTransfer && (
          <label class="form-check">
            <input type="checkbox" checked={planned} onChange={e => setPlanned((e.target as HTMLInputElement).checked)} />
            <div>
              <div class="form-check-title">Virement prévu</div>
              <div class="form-check-sub">À décocher quand il est effectué</div>
            </div>
          </label>
        )}

        <button type="submit" class="btn-primary">Enregistrer</button>
      </form>
    </div>
  );
}
