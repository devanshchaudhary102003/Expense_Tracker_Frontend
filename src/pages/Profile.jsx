import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Lock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Spinner } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { errMsg } from '../api/client';

const CURRENCIES = ['INR', 'USD', 'GBP', 'EUR', 'JPY', 'AUD', 'CAD', 'AED', 'SGD'];

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') || 'info');

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Profile &amp; Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account, password, and preferences.</p>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {[
          { v: 'info', l: 'Profile', icon: User },
          { v: 'security', l: 'Security', icon: Lock },
          { v: 'danger', l: 'Danger Zone', icon: AlertTriangle },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.v}
              onClick={() => setTab(t.v)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
                tab === t.v ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.l}
            </button>
          );
        })}
      </div>

      {tab === 'info' && <ProfileTab user={user} setUser={setUser} />}
      {tab === 'security' && <SecurityTab />}
      {tab === 'danger' && <DangerTab onDeactivated={() => { logout(); nav('/login'); }} />}
    </div>
  );
}

function ProfileTab({ user, setUser }) {
  const [form, setForm] = useState({ fullName: user?.fullName || '', currency: user?.currency || 'INR' });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await authApi.updateProfile({ fullName: form.fullName.trim(), currency: form.currency });
      const u = { ...user, fullName: data.fullName, currency: data.currency };
      localStorage.setItem('ss_user', JSON.stringify(u));
      setUser(u);
      toast.success('Profile updated');
    } catch (err) { toast.error(errMsg(err, 'Update failed')); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="card p-6 space-y-4">
      <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white text-lg font-bold flex items-center justify-center">
          {(user?.fullName || 'U').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-slate-900">{user?.fullName}</p>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <span className="badge bg-slate-100 text-slate-700 mt-1">{user?.role}</span>
        </div>
      </div>
      <div>
        <label className="label">Full name</label>
        <input
          required maxLength={150}
          value={form.fullName}
          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          className="input"
        />
      </div>
      <div>
        <label className="label">Email</label>
        <input value={user?.email || ''} disabled className="input bg-slate-50 text-slate-500"/>
        <p className="text-xs text-slate-500 mt-1">Email cannot be changed.</p>
      </div>
      <div>
        <label className="label">Preferred currency</label>
        <select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} className="input">
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <Spinner size={16}/> : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

function SecurityTab() {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await authApi.changePassword({ oldPassword: form.oldPassword, newPassword: form.newPassword });
      toast.success('Password changed');
      setForm({ oldPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(errMsg(err, 'Change failed')); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="card p-6 space-y-4">
      <h3 className="font-semibold text-slate-900">Change password</h3>
      <p className="text-xs text-slate-500 -mt-2">Note: Google sign-in accounts cannot use password login.</p>
      <div>
        <label className="label">Current password</label>
        <input type="password" required value={form.oldPassword} onChange={(e) => setForm((f) => ({ ...f, oldPassword: e.target.value }))} className="input"/>
      </div>
      <div>
        <label className="label">New password</label>
        <input type="password" required minLength={6} value={form.newPassword} onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))} className="input"/>
      </div>
      <div>
        <label className="label">Confirm new password</label>
        <input type="password" required minLength={6} value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} className="input"/>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <Spinner size={16}/> : 'Update password'}
        </button>
      </div>
    </form>
  );
}

function DangerTab({ onDeactivated }) {
  const [busy, setBusy] = useState(false);
  const handleDeactivate = async () => {
    if (!window.confirm('Deactivate your account? You will be signed out and your data will be inaccessible.')) return;
    setBusy(true);
    try {
      await authApi.deactivate();
      toast.success('Account deactivated');
      onDeactivated();
    } catch (err) { toast.error(errMsg(err, 'Failed')); }
    finally { setBusy(false); }
  };

  return (
    <div className="card p-6 border-red-200">
      <h3 className="font-semibold text-red-700">Deactivate account</h3>
      <p className="text-sm text-slate-600 mt-1.5">
        This will disable your account and sign you out. Contact an administrator to permanently delete your data.
      </p>
      <button onClick={handleDeactivate} disabled={busy} className="btn-danger mt-4">
        {busy ? <Spinner size={16}/> : 'Deactivate my account'}
      </button>
    </div>
  );
}
