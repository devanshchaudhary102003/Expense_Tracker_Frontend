import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Receipt, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { Spinner, PageLoader, EmptyState } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';
import { expenseApi } from '../api/expenses';
import { categoryApi } from '../api/categories';
import { formatMoney, formatDate } from '../utils/format';
import { errMsg } from '../api/client';

const PAYMENT_MODES = ['CASH', 'CARD', 'UPI', 'NET_BANKING', 'WALLET'];

export default function Expenses() {
  const { user } = useAuth();
  const cur = user?.currency || 'INR';
  const [params, setParams] = useSearchParams();

  const [list, setList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [search, setSearch] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [exp, cats] = await Promise.all([expenseApi.list(), categoryApi.list()]);
      setList(exp.data || []);
      setCategories((cats.data || []).filter((c) => c.isActive && (c.type === 'EXPENSE' || !c.type)));
    } catch (err) {
      toast.error(errMsg(err, 'Could not load expenses'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // Open new-expense modal if URL says ?new=1
  useEffect(() => {
    if (params.get('new') === '1') {
      setEditing(null);
      setShowModal(true);
      params.delete('new');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const filtered = useMemo(() => {
    let data = list;
    if (filterCategory) data = data.filter((e) => e.categoryId === Number(filterCategory));
    if (filterPayment) data = data.filter((e) => e.paymentMode === filterPayment);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (e) => (e.description || '').toLowerCase().includes(q) ||
               (e.tags || '').toLowerCase().includes(q)
      );
    }
    return [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [list, filterCategory, filterPayment, search]);

  const total = useMemo(
    () => filtered.reduce((s, e) => s + Number(e.amount || 0), 0),
    [filtered]
  );

  const openNew = () => { setEditing(null); setShowModal(true); };
  const openEdit = (exp) => { setEditing(exp); setShowModal(true); };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense? This cannot be undone.')) return;
    try {
      await expenseApi.remove(id);
      toast.success('Expense deleted');
      setList((l) => l.filter((e) => e.expenseId !== id));
    } catch (err) {
      toast.error(errMsg(err, 'Delete failed'));
    }
  };

  const catName = (id) => categories.find((c) => c.categoryId === id)?.name || `Category #${id}`;
  const catIcon = (id) => categories.find((c) => c.categoryId === id)?.icon || '💳';
  const catColor = (id) => categories.find((c) => c.categoryId === id)?.color || '#1fb573';

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Expenses</h1>
          <p className="text-sm text-slate-500 mt-1">Track every rupee. Filter, search, and edit on the fly.</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatPill label="Showing" value={filtered.length} />
        <StatPill label="Total amount" value={formatMoney(total, cur)} />
        <StatPill label="Recurring" value={list.filter((e) => e.isRecurring).length} />
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search description or tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input md:w-52">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
          ))}
        </select>
        <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} className="input md:w-44">
          <option value="">All payment modes</option>
          {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
        </select>
        {(filterCategory || filterPayment || search) && (
          <button
            onClick={() => { setFilterCategory(''); setFilterPayment(''); setSearch(''); }}
            className="btn-ghost"
          >
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Receipt}
            title={list.length === 0 ? 'No expenses yet' : 'No expenses match your filters'}
            description={list.length === 0 ? 'Track your first expense to start seeing insights.' : 'Try widening your filters.'}
            action={list.length === 0 && (
              <button onClick={openNew} className="btn-primary"><Plus className="w-4 h-4" /> Add expense</button>
            )}
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Mode</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((e) => (
                  <tr key={e.expenseId} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{e.description || 'Untitled'}</span>
                        {e.isRecurring && <span className="badge bg-blue-100 text-blue-700">Recurring</span>}
                      </div>
                      {e.tags && <p className="text-xs text-slate-500 mt-0.5">{e.tags}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
                          style={{ background: `${catColor(e.categoryId)}22`, color: catColor(e.categoryId) }}
                        >
                          {catIcon(e.categoryId)}
                        </span>
                        <span className="text-slate-700">{catName(e.categoryId)}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-700 whitespace-nowrap">{formatDate(e.date)}</td>
                    <td className="px-5 py-3">
                      <span className="badge bg-slate-100 text-slate-700">{e.paymentMode}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900 tabular-nums">
                      {formatMoney(e.amount, e.currency || cur)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => openEdit(e)}
                          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                          aria-label="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(e.expenseId)}
                          className="p-1.5 rounded-md text-slate-500 hover:bg-red-100 hover:text-red-600"
                          aria-label="Delete"
                        >
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
        <ExpenseModal
          open={showModal}
          onClose={() => setShowModal(false)}
          editing={editing}
          categories={categories}
          onSaved={(saved, isUpdate) => {
            setList((l) => isUpdate
              ? l.map((e) => (e.expenseId === saved.expenseId ? saved : e))
              : [saved, ...l]);
            setShowModal(false);
          }}
          defaultCurrency={cur}
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

function ExpenseModal({ open, onClose, editing, categories, onSaved, defaultCurrency }) {
  const isUpdate = !!editing;
  const [form, setForm] = useState({
    categoryId: editing?.categoryId || categories[0]?.categoryId || '',
    amount: editing?.amount || '',
    currency: editing?.currency || defaultCurrency,
    description: editing?.description || '',
    date: (editing?.date ? new Date(editing.date) : new Date()).toISOString().slice(0, 10),
    paymentMode: editing?.paymentMode || 'UPI',
    tags: editing?.tags || '',
    isRecurring: editing?.isRecurring || false,
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
        categoryId: Number(form.categoryId),
        amount: Number(form.amount),
        currency: form.currency,
        description: form.description || null,
        date: new Date(form.date).toISOString(),
        paymentMode: form.paymentMode,
        tags: form.tags || null,
        isRecurring: form.isRecurring,
      };
      const { data } = isUpdate
        ? await expenseApi.update(editing.expenseId, payload)
        : await expenseApi.create(payload);
      toast.success(isUpdate ? 'Expense updated' : 'Expense added');
      onSaved(data, isUpdate);
    } catch (err) {
      toast.error(errMsg(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isUpdate ? 'Edit Expense' : 'Add Expense'}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" type="button">Cancel</button>
          <button onClick={submit} disabled={saving} className="btn-primary" type="button">
            {saving ? <Spinner size={16} /> : isUpdate ? 'Save changes' : 'Add expense'}
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Amount</label>
            <input
              type="number" step="0.01" min="0.01" required
              value={form.amount} onChange={update('amount')}
              className="input" placeholder="0.00"
            />
          </div>
          <div>
            <label className="label">Currency</label>
            <input value={form.currency} onChange={update('currency')} className="input" maxLength={8}/>
          </div>
        </div>
        <div>
          <label className="label">Category</label>
          <select required value={form.categoryId} onChange={update('categoryId')} className="input">
            <option value="" disabled>Select a category</option>
            {categories.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>
                {c.icon ? `${c.icon} ` : ''}{c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Description</label>
          <input
            value={form.description} onChange={update('description')}
            className="input" placeholder="e.g. Lunch at canteen"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date</label>
            <input type="date" required value={form.date} onChange={update('date')} className="input"/>
          </div>
          <div>
            <label className="label">Payment Mode</label>
            <select value={form.paymentMode} onChange={update('paymentMode')} className="input">
              {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Tags <span className="text-slate-400 font-normal">(comma-separated)</span></label>
          <input value={form.tags} onChange={update('tags')} className="input" placeholder="work, urgent" />
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox" checked={form.isRecurring} onChange={update('isRecurring')}
            className="w-4 h-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500"
          />
          <span className="text-sm text-slate-700">This is a recurring expense</span>
        </label>
      </form>
    </Modal>
  );
}
