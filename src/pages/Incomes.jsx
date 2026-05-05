import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, TrendingUp, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { Spinner, PageLoader, EmptyState } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';
import { incomeApi } from '../api/incomes';
import { formatMoney, formatDate } from '../utils/format';
import { errMsg } from '../api/client';

const SOURCES = ['SALARY', 'FREELANCE', 'INVESTMENT', 'RENTAL', 'OTHER'];
const RECURRENCE = ['MONTHLY', 'WEEKLY', 'YEARLY'];

export default function Incomes() {
  const { user } = useAuth();
  const cur = user?.currency || 'INR';
  const [params, setParams] = useSearchParams();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterSource, setFilterSource] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await incomeApi.list();
      setList(data || []);
    } catch (err) {
      toast.error(errMsg(err, 'Could not load income'));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (params.get('new') === '1') {
      setEditing(null); setShowModal(true);
      params.delete('new'); setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const filtered = useMemo(() => {
    let data = list;
    if (filterSource) data = data.filter((i) => i.source === filterSource);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((i) => (i.description || '').toLowerCase().includes(q));
    }
    return [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [list, filterSource, search]);

  const total = useMemo(() => filtered.reduce((s, i) => s + Number(i.amount || 0), 0), [filtered]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this income entry?')) return;
    try {
      await incomeApi.remove(id);
      toast.success('Income deleted');
      setList((l) => l.filter((i) => i.incomeId !== id));
    } catch (err) { toast.error(errMsg(err, 'Delete failed')); }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Income</h1>
          <p className="text-sm text-slate-500 mt-1">Record salary, freelance, investments, and other earnings.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Income
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatPill label="Showing" value={filtered.length} />
        <StatPill label="Total" value={formatMoney(total, cur)} />
        <StatPill label="Recurring" value={list.filter((i) => i.isRecurring).length} />
      </div>

      <div className="card p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="input md:w-52">
          <option value="">All sources</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {(filterSource || search) && (
          <button onClick={() => { setFilterSource(''); setSearch(''); }} className="btn-ghost">
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {loading ? <PageLoader /> : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={TrendingUp}
            title={list.length === 0 ? 'No income recorded yet' : 'No matches'}
            description={list.length === 0 ? 'Add your first income source to track your net balance.' : 'Try widening your filters.'}
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Recurrence</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((i) => (
                  <tr key={i.incomeId} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-medium text-slate-900">{i.description || '—'}</td>
                    <td className="px-5 py-3"><span className="badge bg-emerald-100 text-emerald-700">{i.source}</span></td>
                    <td className="px-5 py-3 text-slate-700">{formatDate(i.date)}</td>
                    <td className="px-5 py-3">
                      {i.isRecurring
                        ? <span className="badge bg-blue-100 text-blue-700">{i.recurrenceType || 'MONTHLY'}</span>
                        : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900 tabular-nums">
                      {formatMoney(i.amount, i.currency || cur)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => { setEditing(i); setShowModal(true); }} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-800">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(i.incomeId)} className="p-1.5 rounded-md text-slate-500 hover:bg-red-100 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <IncomeModal
          open={showModal}
          onClose={() => setShowModal(false)}
          editing={editing}
          defaultCurrency={cur}
          onSaved={(saved, isUpdate) => {
            setList((l) => isUpdate
              ? l.map((i) => (i.incomeId === saved.incomeId ? saved : i))
              : [saved, ...l]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="card p-3.5">
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-lg font-semibold text-slate-900 mt-0.5 tabular-nums">{value}</p>
    </div>
  );
}

function IncomeModal({ open, onClose, editing, onSaved, defaultCurrency }) {
  const isUpdate = !!editing;
  const [form, setForm] = useState({
    source: editing?.source || 'SALARY',
    amount: editing?.amount || '',
    currency: editing?.currency || defaultCurrency,
    description: editing?.description || '',
    date: (editing?.date ? new Date(editing.date) : new Date()).toISOString().slice(0, 10),
    isRecurring: editing?.isRecurring || false,
    recurrenceType: editing?.recurrenceType || 'MONTHLY',
  });
  const [saving, setSaving] = useState(false);

  const update = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        source: form.source,
        amount: Number(form.amount),
        currency: form.currency,
        description: form.description || null,
        date: new Date(form.date).toISOString(),
        isRecurring: form.isRecurring,
        recurrenceType: form.isRecurring ? form.recurrenceType : null,
      };
      const { data } = isUpdate
        ? await incomeApi.update(editing.incomeId, payload)
        : await incomeApi.create(payload);
      toast.success(isUpdate ? 'Income updated' : 'Income added');
      onSaved(data, isUpdate);
    } catch (err) { toast.error(errMsg(err, 'Save failed')); }
    finally { setSaving(false); }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isUpdate ? 'Edit Income' : 'Add Income'}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" type="button">Cancel</button>
          <button onClick={submit} disabled={saving} className="btn-primary" type="button">
            {saving ? <Spinner size={16} /> : isUpdate ? 'Save changes' : 'Add income'}
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Amount</label>
            <input type="number" step="0.01" min="0.01" required value={form.amount} onChange={update('amount')} className="input" placeholder="0.00"/>
          </div>
          <div>
            <label className="label">Currency</label>
            <input value={form.currency} onChange={update('currency')} className="input" maxLength={8}/>
          </div>
        </div>
        <div>
          <label className="label">Source</label>
          <select value={form.source} onChange={update('source')} className="input">
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Description</label>
          <input value={form.description} onChange={update('description')} className="input" placeholder="e.g. April salary"/>
        </div>
        <div>
          <label className="label">Date</label>
          <input type="date" required value={form.date} onChange={update('date')} className="input"/>
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={form.isRecurring} onChange={update('isRecurring')} className="w-4 h-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500"/>
          <span className="text-sm text-slate-700">This income recurs</span>
        </label>
        {form.isRecurring && (
          <div>
            <label className="label">Recurrence type</label>
            <select value={form.recurrenceType} onChange={update('recurrenceType')} className="input">
              {RECURRENCE.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        )}
      </form>
    </Modal>
  );
}
