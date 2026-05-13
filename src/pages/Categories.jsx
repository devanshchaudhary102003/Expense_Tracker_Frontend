import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, FolderOpen, EyeOff, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { Spinner, PageLoader, EmptyState } from '../components/Feedback';
import { categoryApi } from '../api/categories';
import { errMsg } from '../api/client';

const TYPES = ['EXPENSE', 'INCOME'];
const PRESET_ICONS = ['🍔','🚕','🎬','🏥','🛍️','💡','📚','💼','🎯','🏠','💳','🎁','✈️','🧾','💰','🏦'];
const PRESET_COLORS = ['#13935c','#0ea5e9','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#6366f1','#f97316','#84cc16'];

export default function Categories() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState('ALL');           // ALL | EXPENSE | INCOME
  const [showInactive, setShowInactive] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await categoryApi.list();
      setList(data || []);
    } catch (err) { toast.error(errMsg(err, 'Could not load categories')); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    // Backend now returns BOTH active and inactive. The frontend decides what to show.
    let data = showInactive ? list : list.filter((c) => c.isActive);
    if (tab !== 'ALL') data = data.filter((c) => c.type === tab);
    return data.sort(
      (a, b) =>
        Number(b.isActive) - Number(a.isActive) ||
        Number(b.isDefault) - Number(a.isDefault) ||
        a.name.localeCompare(b.name)
    );
  }, [list, tab, showInactive]);

  const inactiveCount = useMemo(() => list.filter((c) => !c.isActive).length, [list]);

  const handleDeactivate = async (cat) => {
    if (cat.isDefault) {
      toast.error('Default categories cannot be deactivated');
      return;
    }
    if (!window.confirm(`Deactivate "${cat.name}"? Existing expenses will keep this category. You can reactivate it later.`)) return;
    try {
      await categoryApi.deactivate(cat.categoryId);
      toast.success('Category deactivated');
      setList((l) => l.map((c) => c.categoryId === cat.categoryId ? { ...c, isActive: false } : c));
    } catch (err) { toast.error(errMsg(err, 'Operation failed')); }
  };

  const handleActivate = async (cat) => {
    try {
      await categoryApi.activate(cat.categoryId);
      toast.success('Category reactivated');
      setList((l) => l.map((c) => c.categoryId === cat.categoryId ? { ...c, isActive: true } : c));
    } catch (err) { toast.error(errMsg(err, 'Operation failed')); }
  };

  const handleDelete = async (cat) => {
    if (cat.isDefault) {
      toast.error('Default categories cannot be deleted');
      return;
    }
    if (!window.confirm(`Delete "${cat.name}" permanently? This cannot be undone.`)) return;
    try {
      await categoryApi.remove(cat.categoryId);
      toast.success('Category deleted');
      setList((l) => l.filter((c) => c.categoryId !== cat.categoryId));
    } catch (err) { toast.error(errMsg(err, 'Delete failed')); }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Categories</h1>
          <p className="text-sm text-slate-500 mt-1">Organise spending and income with system defaults plus your own custom categories.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> New Category
        </button>
      </div>

      {/* Tabs + Show Inactive toggle */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-1">
          {[
            { v: 'ALL', l: 'All' },
            { v: 'EXPENSE', l: 'Expense' },
            { v: 'INCOME', l: 'Income' },
          ].map((t) => (
            <button
              key={t.v}
              onClick={() => setTab(t.v)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
                tab === t.v ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>
        {inactiveCount > 0 && (
          <label className="flex items-center gap-2 cursor-pointer pr-1 pb-1 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500"
            />
            Show inactive ({inactiveCount})
          </label>
        )}
      </div>

      {loading ? <PageLoader /> : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FolderOpen}
            title="No categories"
            description="Create your first custom category."
            action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Category</button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((c) => {
            const muted = !c.isActive;
            return (
              <div
                key={c.categoryId}
                className={`card p-4 group hover:shadow-md transition ${muted ? 'opacity-60 border-dashed' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: `${c.color || '#1fb573'}1a`, color: c.color || '#1fb573' }}
                  >
                    {c.icon || '🏷️'}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {c.isDefault && <span className="badge bg-slate-100 text-slate-600">Default</span>}
                    {muted && <span className="badge bg-amber-100 text-amber-700">Inactive</span>}
                    <span className={`badge ${c.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {c.type}
                    </span>
                  </div>
                </div>
                <p className="mt-3 font-semibold text-slate-900 truncate">{c.name}</p>
                {!c.isDefault && (
                  <div className="mt-3 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    {muted ? (
                      <button
                        onClick={() => handleActivate(c)}
                        className="flex-1 btn-secondary !py-1.5 !text-xs"
                        title="Reactivate"
                      >
                        <Eye className="w-3 h-3" /> Reactivate
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditing(c); setShowModal(true); }}
                          className="flex-1 btn-secondary !py-1.5 !text-xs"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeactivate(c)}
                          className="p-1.5 rounded-md text-slate-500 hover:bg-amber-100 hover:text-amber-700"
                          title="Deactivate"
                        >
                          <EyeOff className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(c)}
                      className="p-1.5 rounded-md text-slate-500 hover:bg-red-100 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <CategoryModal
          open={showModal}
          onClose={() => setShowModal(false)}
          editing={editing}
          onSaved={(saved, isUpdate) => {
            setList((l) => isUpdate
              ? l.map((c) => c.categoryId === saved.categoryId ? saved : c)
              : [saved, ...l]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

function CategoryModal({ open, onClose, editing, onSaved }) {
  const isUpdate = !!editing;
  const [form, setForm] = useState({
    name: editing?.name || '',
    icon: editing?.icon || PRESET_ICONS[0],
    color: editing?.color || PRESET_COLORS[0],
    type: editing?.type || 'EXPENSE',
  });
  const [saving, setSaving] = useState(false);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        icon: form.icon,
        color: form.color,
        type: form.type,
      };
      const { data } = isUpdate
        ? await categoryApi.update(editing.categoryId, payload)
        : await categoryApi.create(payload);
      toast.success(isUpdate ? 'Category updated' : 'Category created');
      onSaved(data, isUpdate);
    } catch (err) { toast.error(errMsg(err, 'Save failed')); }
    finally { setSaving(false); }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isUpdate ? 'Edit Category' : 'New Category'}
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
          <label className="label">Name</label>
          <input
            required maxLength={100}
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="input"
            placeholder="e.g. Groceries"
          />
        </div>
        <div>
          <label className="label">Type</label>
          <div className="flex gap-2">
            {TYPES.map((t) => (
              <button
                type="button" key={t}
                onClick={() => update('type', t)}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold border transition ${
                  form.type === t ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Icon</label>
          <div className="grid grid-cols-8 gap-1.5">
            {PRESET_ICONS.map((ic) => (
              <button
                type="button" key={ic}
                onClick={() => update('icon', ic)}
                className={`h-10 rounded-lg text-xl border transition ${
                  form.icon === ic ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Color</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((co) => (
              <button
                type="button" key={co}
                onClick={() => update('color', co)}
                className={`w-9 h-9 rounded-full transition border-2 ${
                  form.color === co ? 'border-slate-900 scale-110' : 'border-transparent'
                }`}
                style={{ background: co }}
                aria-label={co}
              />
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: `${form.color}22`, color: form.color }}
          >
            {form.icon}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{form.name || 'Category preview'}</p>
            <p className="text-xs text-slate-500">{form.type}</p>
          </div>
        </div>
      </form>
    </Modal>
  );
}
