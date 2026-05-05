import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, TrendingDown, TrendingUp, PiggyBank, AlertTriangle,
  ArrowUpRight, Plus, Receipt,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { incomeApi } from '../api/incomes';
import { budgetApi } from '../api/budgets';
import { reportApi } from '../api/reports';
import { expenseApi } from '../api/expenses';
import { formatMoney, formatDate } from '../utils/format';
import { PageLoader, EmptyState } from '../components/Feedback';

const PALETTE = ['#13935c', '#1fb573', '#46cf8e', '#7ce4b1', '#aff1cf',
  '#0ea5e9', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { user } = useAuth();
  const cur = user?.currency || 'INR';

  const [loading, setLoading] = useState(true);
  const [netBalance, setNetBalance] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [trend, setTrend] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [overBudgets, setOverBudgets] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);

  useEffect(() => {
    let active = true;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const startOfMonth = new Date(year, month - 1, 1).toISOString();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59).toISOString();

    const safe = (p) => p.then((r) => r).catch(() => null);

    Promise.all([
      safe(incomeApi.netBalance()),
      safe(reportApi.monthly(year, month)),
      safe(reportApi.trend(6)),
      safe(reportApi.categoryBreakdown(startOfMonth, endOfMonth)),
      safe(budgetApi.alerts()),
      safe(expenseApi.list()),
    ]).then(([nb, m, t, b, alerts, exps]) => {
      if (!active) return;
      if (nb?.data) setNetBalance(nb.data);
      if (m?.data) setMonthly(m.data);
      if (t?.data) setTrend(t.data || []);
      if (b?.data) setBreakdown((b.data || []).slice(0, 8));
      if (alerts?.data) setOverBudgets(alerts.data || []);
      if (exps?.data) {
        const sorted = [...(exps.data || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentExpenses(sorted.slice(0, 5));
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const kpis = useMemo(() => {
    const totalIncome = monthly?.totalIncome ?? netBalance?.totalIncome ?? 0;
    const totalExpense = monthly?.totalExpense ?? netBalance?.totalExpense ?? 0;
    const net = monthly?.netBalance ?? netBalance?.netBalance ?? (totalIncome - totalExpense);
    const savings = monthly?.savingsRate ?? 0;
    return { totalIncome, totalExpense, net, savings };
  }, [monthly, netBalance]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.fullName?.split(' ')[0]}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here&apos;s an overview of your spending this month.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/expenses?new=1" className="btn-primary">
            <Plus className="w-4 h-4" /> Add Expense
          </Link>
          <Link to="/incomes?new=1" className="btn-secondary">
            <Plus className="w-4 h-4" /> Add Income
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Income (this month)"
          value={formatMoney(kpis.totalIncome, cur)}
          icon={TrendingUp}
          tone="emerald"
        />
        <KpiCard
          label="Total Expense (this month)"
          value={formatMoney(kpis.totalExpense, cur)}
          icon={TrendingDown}
          tone="rose"
        />
        <KpiCard
          label="Net Balance"
          value={formatMoney(kpis.net, cur)}
          icon={Wallet}
          tone={kpis.net >= 0 ? 'emerald' : 'rose'}
        />
        <KpiCard
          label="Savings Rate"
          value={`${Number(kpis.savings || 0).toFixed(1)}%`}
          icon={PiggyBank}
          tone="brand"
        />
      </div>

      {/* Over-budget alerts banner */}
      {overBudgets.length > 0 && (
        <div className="card border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              {overBudgets.length} budget{overBudgets.length > 1 ? 's are' : ' is'} over limit
            </p>
            <p className="text-xs text-amber-800 mt-0.5">
              {overBudgets.slice(0, 3).map((b) => b.name).join(', ')}
              {overBudgets.length > 3 && ` +${overBudgets.length - 3} more`}
            </p>
          </div>
          <Link to="/budgets" className="text-sm font-semibold text-amber-900 hover:underline whitespace-nowrap">
            Review →
          </Link>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">Income vs Expense</h3>
              <p className="text-xs text-slate-500">Last 6 months</p>
            </div>
            <Link to="/reports" className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-1">
              View reports <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {trend.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No trend data yet"
              description="Add a few expenses and incomes to see your monthly trend."
            />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="monthYear" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                    formatter={(v) => formatMoney(v, cur)}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="totalIncome" stroke="#13935c" strokeWidth={2.5} dot={{ r: 3 }} name="Income" />
                  <Line type="monotone" dataKey="totalExpense" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} name="Expense" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Category breakdown pie */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">By Category</h3>
              <p className="text-xs text-slate-500">This month</p>
            </div>
          </div>
          {breakdown.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Nothing spent yet"
              description="Your category breakdown will appear here."
            />
          ) : (
            <>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdown}
                      dataKey="totalAmount"
                      nameKey="categoryName"
                      cx="50%" cy="50%"
                      innerRadius={42} outerRadius={70}
                      paddingAngle={2}
                    >
                      {breakdown.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatMoney(v, cur)} contentStyle={{ borderRadius: 8, fontSize: 12 }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-1.5">
                {breakdown.slice(0, 5).map((item, i) => (
                  <li key={item.categoryId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                      <span className="text-slate-700 truncate">{item.categoryName}</span>
                    </div>
                    <span className="font-semibold text-slate-900 shrink-0 ml-2">
                      {formatMoney(item.totalAmount, cur)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Recent expenses */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Recent Expenses</h3>
          <Link to="/expenses" className="text-xs font-semibold text-brand-700 hover:text-brand-800">
            View all →
          </Link>
        </div>
        {recentExpenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses yet"
            description="Track your first expense to see it here."
            action={<Link to="/expenses?new=1" className="btn-primary"><Plus className="w-4 h-4" /> Add expense</Link>}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {recentExpenses.map((e) => (
              <div key={e.expenseId} className="px-5 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {e.description || 'Untitled expense'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDate(e.date)} • {e.paymentMode}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-900 ml-3 shrink-0">
                  {formatMoney(e.amount, e.currency || cur)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, tone }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
    brand: 'bg-brand-50 text-brand-700',
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[tone] || tones.brand}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
