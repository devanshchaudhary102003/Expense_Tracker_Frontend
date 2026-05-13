import { useEffect, useMemo, useState } from 'react';
import {
  Search, Trash2, Megaphone, Shield, Users, UserCheck, UserX,
  ShieldCheck, ShieldOff, Pause, Play,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { Spinner, PageLoader, EmptyState } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { notificationApi } from '../api/notifications';
import { formatDate, relativeTime } from '../utils/format';
import { errMsg } from '../api/client';

export default function Admin() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL | ACTIVE | INACTIVE | ADMIN
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await authApi.getAllUsers();
      setUsers(data || []);
    } catch (err) { toast.error(errMsg(err, 'Could not load users')); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let data = users;
    if (filter === 'ACTIVE') data = data.filter((u) => u.isActive);
    if (filter === 'INACTIVE') data = data.filter((u) => !u.isActive);
    if (filter === 'ADMIN') data = data.filter((u) => u.role === 'Admin');
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return data;
  }, [users, search, filter]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
    admins: users.filter((u) => u.role === 'Admin').length,
  }), [users]);

  // Replace a user in the local list after a server-side update.
  const replaceUser = (updated) => {
    setUsers((list) => list.map((u) => (u.userId === updated.userId ? updated : u)));
  };

  const handleDelete = async (user) => {
    if (currentUser && user.userId === currentUser.userId) {
      toast.error("You can't delete your own admin account from here. Use Profile → Deactivate instead.");
      return;
    }
    if (!window.confirm(`Permanently delete user "${user.fullName}" (${user.email})? This cannot be undone.`)) return;
    setBusyUserId(user.userId);
    try {
      await authApi.deleteUser(user.userId);
      toast.success('User deleted');
      setUsers((l) => l.filter((u) => u.userId !== user.userId));
    } catch (err) { toast.error(errMsg(err, 'Delete failed')); }
    finally { setBusyUserId(null); }
  };

  const handleToggleRole = async (user) => {
    if (currentUser && user.userId === currentUser.userId) {
      toast.error("You can't change your own role.");
      return;
    }
    const nextRole = user.role === 'Admin' ? 'User' : 'Admin';
    const verb = nextRole === 'Admin' ? 'Promote' : 'Demote';
    if (!window.confirm(`${verb} ${user.fullName} to ${nextRole}?`)) return;
    setBusyUserId(user.userId);
    try {
      const { data } = await authApi.updateUserRole(user.userId, nextRole);
      replaceUser(data);
      toast.success(`${user.fullName} is now ${nextRole}`);
    } catch (err) { toast.error(errMsg(err, 'Role change failed')); }
    finally { setBusyUserId(null); }
  };

  const handleToggleStatus = async (user) => {
    if (currentUser && user.userId === currentUser.userId) {
      toast.error("You can't suspend your own account from here.");
      return;
    }
    const nextActive = !user.isActive;
    const verb = nextActive ? 'Reactivate' : 'Suspend';
    if (!window.confirm(`${verb} ${user.fullName}?`)) return;
    setBusyUserId(user.userId);
    try {
      const { data } = await authApi.updateUserStatus(user.userId, nextActive);
      replaceUser(data);
      toast.success(`${user.fullName} ${nextActive ? 'reactivated' : 'suspended'}`);
    } catch (err) { toast.error(errMsg(err, 'Status change failed')); }
    finally { setBusyUserId(null); }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Panel</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage users, roles, and broadcast platform notifications.</p>
          </div>
        </div>
        <button onClick={() => setShowBroadcast(true)} className="btn-primary">
          <Megaphone className="w-4 h-4" /> Broadcast
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total Users" value={stats.total} tone="brand" />
        <StatCard icon={UserCheck} label="Active" value={stats.active} tone="emerald" />
        <StatCard icon={UserX} label="Suspended" value={stats.inactive} tone="rose" />
        <StatCard icon={Shield} label="Admins" value={stats.admins} tone="amber" />
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input md:w-44">
          <option value="ALL">All users</option>
          <option value="ACTIVE">Active only</option>
          <option value="INACTIVE">Suspended</option>
          <option value="ADMIN">Admins only</option>
        </select>
      </div>

      {/* Users table */}
      {loading ? <PageLoader /> : filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={Users} title="No users found" description="Try adjusting your search."/>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Auth</th>
                  <th className="px-5 py-3 font-medium">Currency</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium">Last Login</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => {
                  const isSelf = currentUser && u.userId === currentUser.userId;
                  const busy = busyUserId === u.userId;
                  return (
                    <tr key={u.userId} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                            {(u.fullName || 'U').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {u.fullName}
                              {isSelf && <span className="ml-2 text-[10px] font-medium text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">YOU</span>}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`badge ${u.role === 'Admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{u.authProvider}</td>
                      <td className="px-5 py-3 text-slate-600 font-mono text-xs">{u.currency}</td>
                      <td className="px-5 py-3 text-slate-600 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                      <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                        {u.lastLoginAt ? relativeTime(u.lastLoginAt) : <span className="text-slate-400">Never</span>}
                      </td>
                      <td className="px-5 py-3">
                        {u.isActive
                          ? <span className="badge bg-emerald-100 text-emerald-700">Active</span>
                          : <span className="badge bg-rose-100 text-rose-700">Suspended</span>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {busy && <Spinner size={14} />}
                          {/* Promote / Demote */}
                          <button
                            onClick={() => handleToggleRole(u)}
                            disabled={isSelf || busy}
                            className="p-1.5 rounded-md text-slate-500 hover:bg-amber-100 hover:text-amber-700 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-500"
                            title={isSelf ? "You can't change your own role" : (u.role === 'Admin' ? 'Demote to User' : 'Promote to Admin')}
                          >
                            {u.role === 'Admin'
                              ? <ShieldOff className="w-4 h-4" />
                              : <ShieldCheck className="w-4 h-4" />}
                          </button>
                          {/* Suspend / Reactivate */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isSelf || busy}
                            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            title={isSelf ? "You can't suspend yourself" : (u.isActive ? 'Suspend account' : 'Reactivate account')}
                          >
                            {u.isActive
                              ? <Pause className="w-4 h-4" />
                              : <Play className="w-4 h-4" />}
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(u)}
                            disabled={isSelf || busy}
                            className="p-1.5 rounded-md text-slate-500 hover:bg-red-100 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-500"
                            title={isSelf ? "You can't delete yourself" : 'Delete user'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showBroadcast && (
        <BroadcastModal
          users={users.filter((u) => u.isActive)}
          open={showBroadcast}
          onClose={() => setShowBroadcast(false)}
        />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-700',
    brand: 'bg-brand-50 text-brand-700',
  };
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[tone] || tones.brand}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums">{value}</p>
        </div>
      </div>
    </div>
  );
}

function BroadcastModal({ users, open, onClose }) {
  const [form, setForm] = useState({ title: '', message: '', target: 'ALL' });
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    setSending(true);
    try {
      const userIds = form.target === 'ALL' ? users.map((u) => u.userId) : null;
      await notificationApi.broadcast({
        title: form.title.trim(),
        message: form.message.trim(),
        userIds,
      });
      toast.success(`Notification sent to ${userIds?.length || 0} users`);
      onClose();
    } catch (err) { toast.error(errMsg(err, 'Broadcast failed')); }
    finally { setSending(false); }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Broadcast Notification"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" type="button">Cancel</button>
          <button onClick={submit} disabled={sending} className="btn-primary" type="button">
            {sending ? <Spinner size={16} /> : <><Megaphone className="w-4 h-4"/> Send broadcast</>}
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2.5">
          <Megaphone className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">
            This sends an in-app notification to <strong>{users.length}</strong> active users. Use it for maintenance windows or feature announcements.
          </p>
        </div>
        <div>
          <label className="label">Title</label>
          <input
            required
            maxLength={150}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="input"
            placeholder="e.g. Scheduled maintenance Sunday 2 AM"
          />
        </div>
        <div>
          <label className="label">Message</label>
          <textarea
            required
            rows={4}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            className="input resize-none"
            placeholder="Detailed message for users…"
          />
        </div>
        <div>
          <label className="label">Recipients</label>
          <select value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))} className="input">
            <option value="ALL">All active users ({users.length})</option>
          </select>
        </div>
      </form>
    </Modal>
  );
}
