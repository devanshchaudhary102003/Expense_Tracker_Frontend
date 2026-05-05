import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Wallet, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { Spinner, PageLoader, EmptyState } from '../components/Feedback';
import { budgetApi } from '../api/budgets';
import { categoryApi } from '../api/categories';
import { useAuth } from '../context/AuthContext';
import { formatMoney, formatDate } from '../utils/format';
import { errMsg } from '../api/client';

const PERIODS = ['MONTHLY', 'WEEKLY', 'CUSTOM'];

export default function Budgets() {
  const { user } = useAuth();
  const cur = user?.currency || 'INR';
  const [list, setList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  // Tracks which budget is currently being recomputed so we can spin its icon.
  // null = none; -1 = the global "Sync all" action; otherwise the budgetId.
  const [syncingId, setSyncingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [b, c] = await Promise.all([budgetApi.list(), categoryApi.list()]);
      setList(b.data || []);
      setCategories((c.data || []).filter((cat) => cat.isActive && cat.type === 'EXPENSE'));
    } catch (err) { toast.error(errMsg(err, 'Could not load budgets')); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    try {
      await budgetApi.remove(id);
      toast.success('Budget deleted');
      setList((l) => l.filter((b) => b.budgetId !== id));
    } catch (err) { toast.error(errMsg(err, 'Delete failed')); }
  };

  // Per-budget sync — asks BudgetService to re-pull SpentAmount from ExpenseService
  // for THIS budget. Useful if the user just added expenses elsewhere and wants the
  // card to reflect reality without waiting for the message bus.
  const handleRecompute = async (id) => {
    setSyncingId(id);
    try {
      const { data } = await budgetApi.recompute(id);
      setList((l) => l.map((b) => b.budgetId === data.budgetId ? data : b));
      toast.success('Budget synced with expenses');
    } catch (err) { toast.error(errMsg(err, 'Sync failed')); }
    finally { setSyncingId(null); }
  };

  // Global sync — recomputes every budget for the user in a single call,
  // then reloads the list to pick up the fresh SpentAmounts.
  const handleRecomputeAll = async () => {
    setSyncingId(-1);
    try {
      const { data } = await budgetApi.recomputeAll();
      await load();
      toast.success(`Synced ${data?.updated ?? 0} budget(s)`);
    } catch (err) { toast.error(errMsg(err, 'Sync failed')); }
    finally { setSyncingId(null); }
  };

  const catName = (id) => id ? (categories.find((c) => c.categoryId === id)?.name || `#${id}`) : 'Overall';

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Budgets</h1>
          <p className="text-sm text-slate-500 mt-1">Set spending limits and get alerts at 80% and 100%.</p>
        </div>
        <div className="flex gap-2">
          {list.length > 0 && (
            <button
              onClick={handleRecomputeAll}
              disabled={syncingId !== null}
              className="btn-secondary"
              title="Re-pull SpentAmount from your expenses for every budget"
            >
              <RefreshCw className={`w-4 h-4 ${syncingId === -1 ? 'animate-spin' : ''}`} />
              Sync all
            </button>
          )}
          <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> New Budget
          </button>
        </div>
      </div>

      {loading ? <PageLoader /> : list.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Wallet}
            title="No budgets yet"
            description="Create a monthly limit per category — we'll alert you at 80% and 100% utilisation."
            action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Create budget</button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((b) => {
            const pct = Math.min(100, Number(b.utilizationPercent || 0));
            const isOver = b.spentAmount >= b.limitAmount;
            const warning = !isOver && pct >= 80;
            const barColor = isOver ? 'bg-red-500' : warning ? 'bg-amber-500' : 'bg-brand-500';
            return (
              <div key={b.budgetId} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 truncate">{b.name}</h3>
                      {isOver && (
                        <span className="badge bg-red-100 text-red-700">
                          <AlertTriangle className="w-3 h-3" /> Over
                        </span>
                      )}
                      {warning && (
                        <span className="badge bg-amber-100 text-amber-700">
                          <AlertTriangle className="w-3 h-3" /> Warning
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {catName(b.categoryId)} • {b.period} • {formatDate(b.startDate)} → {formatDate(b.endDate)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleRecompute(b.budgetId)}
                      disabled={syncingId !== null}
                      className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                      title="Sync this budget with your expenses"
                    >
                      <RefreshCw className={`w-4 h-4 ${syncingId === b.budgetId ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={() => { setEditing(b); setShowModal(true); }} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-800">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(b.budgetId)} className="p-1.5 rounded-md text-slate-500 hover:bg-red-100 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">{formatMoney(b.spentAmount, b.currency || cur)}</span>
                      <span className="text-slate-400"> / {formatMoney(b.limitAmount, b.currency || cur)}</span>
                    </span>
                    <span className={`text-sm font-semibold ${isOver ? 'text-red-600' : warning ? 'text-amber-600' : 'text-brand-700'}`}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full transition-all ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Remaining: <span className="font-semibold text-slate-700">{formatMoney(b.remainingAmount, b.currency || cur)}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <BudgetModal
          open={showModal}
          onClose={() => setShowModal(false)}
          editing={editing}
          categories={categories}
          defaultCurrency={cur}
          onSaved={(saved, isUpdate) => {
            setList((l) => isUpdate
              ? l.map((b) => b.budgetId === saved.budgetId ? saved : b)
              : [saved, ...l]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

function BudgetModal({ open, onClose, editing, categories, onSaved, defaultCurrency }) {
  const isUpdate = !!editing;
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [form, setForm] = useState({
    name: editing?.name || '',
    categoryId: editing?.categoryId || '',
    limitAmount: editing?.limitAmount || '',
    currency: editing?.currency || defaultCurrency,
    period: editing?.period || 'MONTHLY',
    startDate: (editing?.startDate ? new Date(editing.startDate) : new Date(firstOfMonth)).toISOString().slice(0, 10),
    endDate: (editing?.endDate ? new Date(editing.endDate) : new Date(lastOfMonth)).toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        limitAmount: Number(form.limitAmount),
        currency: form.currency,
        period: form.period,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      };
      const { data } = isUpdate
        ? await budgetApi.update(editing.budgetId, { ...payload, isActive: true })
        : await budgetApi.create(payload);
      toast.success(isUpdate ? 'Budget updated' : 'Budget created');
      onSaved(data, isUpdate);
    } catch (err) { toast.error(errMsg(err, 'Save failed')); }
    finally { setSaving(false); }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isUpdate ? 'Edit Budget' : 'New Budget'}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" type="button">Cancel</button>
          <button onClick={submit} disabled={saving} className="btn-primary" type="button">
            {saving ? <Spinner size={16} /> : isUpdate ? 'Save changes' : 'Create'}
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Budget name</label>
          <input required maxLength={150} value={form.name} onChange={update('name')} className="input" placeholder="e.g. Monthly groceries"/>
        </div>
        <div>
          <label className="label">Category <span className="text-slate-400 font-normal">(optional — leave blank for overall)</span></label>
          <select value={form.categoryId} onChange={update('categoryId')} className="input">
            <option value="">Overall budget</option>
            {categories.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Limit amount</label>
            <input type="number" step="0.01" min="0.01" required value={form.limitAmount} onChange={update('limitAmount')} className="input" placeholder="0.00"/>
          </div>
          <div>
            <label className="label">Currency</label>
            <input value={form.currency} onChange={update('currency')} className="input" maxLength={8}/>
          </div>
        </div>
        <div>
          <label className="label">Period</label>
          <select value={form.period} onChange={update('period')} className="input">
            {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Start date</label>
            <input type="date" required value={form.startDate} onChange={update('startDate')} className="input"/>
          </div>
          <div>
            <label className="label">End date</label>
            <input type="date" required value={form.endDate} onChange={update('endDate')} className="input"/>
          </div>
        </div>
      </form>
    </Modal>
  );
}
