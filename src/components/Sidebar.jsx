import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, TrendingUp, FolderOpen, Wallet,
  BarChart3, Bell, User, Shield, X,
} from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

const baseNav = [
  { to: '/dashboard',     label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/expenses',      label: 'Expenses',       icon: Receipt },
  { to: '/incomes',       label: 'Income',         icon: TrendingUp },
  { to: '/categories',    label: 'Categories',     icon: FolderOpen },
  { to: '/budgets',       label: 'Budgets',        icon: Wallet },
  { to: '/reports',       label: 'Reports',        icon: BarChart3 },
  { to: '/notifications', label: 'Notifications',  icon: Bell },
  { to: '/profile',       label: 'Profile',        icon: User },
];

const adminNav = [
  { to: '/admin', label: 'Admin Panel', icon: Shield },
];

export default function Sidebar({ open, onClose }) {
  const { isAdmin } = useAuth();
  const items = isAdmin ? [...baseNav, ...adminNav] : baseNav;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 border-r border-slate-200 bg-white transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100">
          <Logo />
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-0.5 overflow-y-auto h-[calc(100vh-4rem)]">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
              end={to === '/dashboard'}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span>{label}</span>
              {label === 'Admin Panel' && (
                <span className="ml-auto badge bg-amber-100 text-amber-700">Admin</span>
              )}
            </NavLink>
          ))}

          <div className="pt-6 px-3 mt-4 border-t border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Tip
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Set monthly budgets per category to get 80% &amp; 100% breach alerts automatically.
            </p>
          </div>
        </nav>
      </aside>
    </>
  );
}
