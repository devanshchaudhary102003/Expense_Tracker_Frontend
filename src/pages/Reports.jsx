import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line,
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { reportApi } from '../api/reports';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../utils/format';
import { PageLoader, EmptyState } from '../components/Feedback';
import { errMsg } from '../api/client';

const PALETTE = ['#13935c', '#1fb573', '#46cf8e', '#7ce4b1', '#aff1cf',
  '#0ea5e9', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Reports() {
  const { user } = useAuth();
  const cur = user?.currency || 'INR';
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [trendMonths, setTrendMonths] = useState(6);

  const [monthly, setMonthly] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [trend, setTrend] = useState([]);
  const [topCats, setTopCats] = useState([]);
  const [yearly, setYearly] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const start = new Date(year, month - 1, 1).toISOString();
    const end = new Date(year, month, 0, 23, 59, 59).toISOString();
    setLoading(true);
    const safe = (p) => p.then((r) => r.data).catch(() => null);
    Promise.all([
      safe(reportApi.monthly(year, month)),
      safe(reportApi.categoryBreakdown(start, end)),
      safe(reportApi.trend(trendMonths)),
      safe(reportApi.topCategories(5)),
      safe(reportApi.yearly(year)),
    ]).then(([m, b, t, tc, y]) => {
      setMonthly(m);
      setBreakdown(b || []);
      setTrend(t || []);
      setTopCats(tc || []);
      setYearly(y);
      setLoading(false);
    }).catch((err) => {
      toast.error(errMsg(err, 'Could not load reports'));
      setLoading(false);
    });
  }, [year, month, trendMonths]);

  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];
  const yearOpts = Array.from({ length: 5 }, (_, i) => today.getFullYear() - i);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reports &amp; Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Understand where your money is going.</p>
        </div>
        <div className="flex gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="input md:w-40">
            {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input md:w-28">
            {yearOpts.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Monthly KPIs */}
      {monthly && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label="Total Income" value={formatMoney(monthly.totalIncome, cur)} icon={TrendingUp} tone="emerald" />
          <Kpi label="Total Expense" value={formatMoney(monthly.totalExpense, cur)} icon={TrendingDown} tone="rose" />
          <Kpi label="Net Balance" value={formatMoney(monthly.netBalance, cur)} icon={Wallet} tone={monthly.netBalance >= 0 ? 'emerald' : 'rose'} />
          <Kpi label="Savings Rate" value={`${Number(monthly.savingsRate || 0).toFixed(1)}%`} icon={PiggyBank} tone="brand" sub={monthly.topCategory ? `Top: ${monthly.topCategory}` : null}/>
        </div>
      )}

      {/* Trend chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900">Income vs Expense Trend</h3>
            <p className="text-xs text-slate-500">Compare monthly inflows and outflows.</p>
          </div>
          <select value={trendMonths} onChange={(e) => setTrendMonths(Number(e.target.value))} className="input !w-auto !py-1.5 !text-xs">
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
        </div>
        {trend.length === 0 ? (
          <EmptyState icon={Calendar} title="Not enough data" description="Add expenses and income to see your trend." />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="monthYear" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(v) => formatMoney(v, cur)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="totalIncome" stroke="#13935c" strokeWidth={2.5} dot={{ r: 3 }} name="Income" />
                <Line type="monotone" dataKey="totalExpense" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} name="Expense" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie breakdown */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-1">Category Breakdown</h3>
          <p className="text-xs text-slate-500 mb-4">{months[month - 1]} {year}</p>
          {breakdown.length === 0 ? (
            <EmptyState title="No spending in this month" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={breakdown} dataKey="totalAmount" nameKey="categoryName" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={2}>
                      {breakdown.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatMoney(v, cur)} contentStyle={{ borderRadius: 8, fontSize: 12 }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-1.5">
                {breakdown.slice(0, 8).map((b, i) => (
                  <li key={b.categoryId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }}/>
                      <span className="text-slate-700 truncate">{b.categoryName}</span>
                    </div>
                    <span className="font-semibold text-slate-900 ml-2 shrink-0 tabular-nums">{formatMoney(b.totalAmount, cur)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Top categories bar */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-1">Top 5 Spending Categories</h3>
          <p className="text-xs text-slate-500 mb-4">All time</p>
          {topCats.length === 0 ? (
            <EmptyState title="No data yet" />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCats} layout="vertical" margin={{ top: 10, right: 10, left: 70, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12}/>
                  <YAxis type="category" dataKey="categoryName" stroke="#94a3b8" fontSize={12} width={70}/>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => formatMoney(v, cur)} />
                  <Bar dataKey="totalAmount" fill="#13935c" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Yearly summary */}
      {yearly && (
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-1">Yearly Summary — {year}</h3>
          <p className="text-xs text-slate-500 mb-4">Month-by-month aggregate</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <SummaryStat label="Total Income" value={formatMoney(yearly.totalIncome, cur)} positive/>
            <SummaryStat label="Total Expense" value={formatMoney(yearly.totalExpense, cur)} />
            <SummaryStat label="Net" value={formatMoney(yearly.netBalance, cur)} positive={yearly.netBalance >= 0}/>
          </div>
          {yearly.monthly?.length > 0 && (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearly.monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                  <XAxis dataKey="monthYear" stroke="#94a3b8" fontSize={12}/>
                  <YAxis stroke="#94a3b8" fontSize={12}/>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => formatMoney(v, cur)}/>
                  <Legend wrapperStyle={{ fontSize: 12 }}/>
                  <Bar dataKey="totalIncome" fill="#13935c" name="Income" radius={[4, 4, 0, 0]}/>
                  <Bar dataKey="totalExpense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, icon: Icon, tone, sub }) {
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
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[tone] || tones.brand}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, positive }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-bold mt-1 tabular-nums ${positive ? 'text-emerald-700' : 'text-rose-700'}`}>{value}</p>
    </div>
  );
}
