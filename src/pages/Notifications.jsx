import { useEffect, useState } from 'react';
import { Bell, BellOff, Check, CheckCheck, Trash2, AlertTriangle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationApi } from '../api/notifications';
import { PageLoader, EmptyState } from '../components/Feedback';
import { relativeTime } from '../utils/format';
import { errMsg } from '../api/client';

export default function Notifications() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL'); // ALL | UNREAD

  const load = async () => {
    setLoading(true);
    try {
      const { data } = tab === 'UNREAD' ? await notificationApi.unread() : await notificationApi.list(100);
      setList(data || []);
    } catch (err) { toast.error(errMsg(err, 'Could not load notifications')); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tab]);

  const markRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setList((l) => l.map((n) => n.notificationId === id ? { ...n, isRead: true } : n));
    } catch (err) { toast.error(errMsg(err, 'Failed')); }
  };

  const markAll = async () => {
    try {
      await notificationApi.markAllRead();
      setList((l) => l.map((n) => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch (err) { toast.error(errMsg(err, 'Failed')); }
  };

  const remove = async (id) => {
    try {
      await notificationApi.remove(id);
      setList((l) => l.filter((n) => n.notificationId !== id));
    } catch (err) { toast.error(errMsg(err, 'Delete failed')); }
  };

  const visible = tab === 'UNREAD' ? list.filter((n) => !n.isRead) : list;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">Budget alerts, reminders, and platform announcements.</p>
        </div>
        {visible.some((n) => !n.isRead) && (
          <button onClick={markAll} className="btn-secondary">
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {[{ v: 'ALL', l: 'All' }, { v: 'UNREAD', l: 'Unread' }].map((t) => (
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

      {loading ? <PageLoader /> : visible.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={BellOff}
            title="You're all caught up"
            description="New budget alerts and announcements will appear here."
          />
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((n) => (
            <NotificationItem key={n.notificationId} n={n} onRead={markRead} onDelete={remove} />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationItem({ n, onRead, onDelete }) {
  const config = {
    BUDGET_WARNING: { icon: AlertTriangle, bg: 'bg-amber-50', color: 'text-amber-600' },
    BUDGET_EXCEEDED: { icon: AlertTriangle, bg: 'bg-red-50', color: 'text-red-600' },
    MONTHLY_SUMMARY: { icon: Info, bg: 'bg-blue-50', color: 'text-blue-600' },
    RECURRING_REMINDER: { icon: Bell, bg: 'bg-indigo-50', color: 'text-indigo-600' },
    PLATFORM: { icon: Info, bg: 'bg-slate-100', color: 'text-slate-600' },
  };
  const c = config[n.type] || config.PLATFORM;
  const Icon = c.icon;

  return (
    <div className={`card p-4 flex items-start gap-3 transition ${!n.isRead ? 'border-brand-200 bg-brand-50/30' : ''}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${c.bg} ${c.color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-900">{n.title}</p>
          {!n.isRead && <span className="w-2 h-2 rounded-full bg-brand-500" />}
          <span className="text-xs text-slate-500">{relativeTime(n.sentAt)}</span>
        </div>
        <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        {!n.isRead && (
          <button onClick={() => onRead(n.notificationId)} className="p-1.5 rounded-md text-slate-500 hover:bg-emerald-100 hover:text-emerald-700" title="Mark as read">
            <Check className="w-4 h-4" />
          </button>
        )}
        <button onClick={() => onDelete(n.notificationId)} className="p-1.5 rounded-md text-slate-500 hover:bg-red-100 hover:text-red-600" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
