import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';
import { Spinner } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { errMsg } from '../api/client';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back!');
      nav(from, { replace: true });
    } catch (err) {
      toast.error(errMsg(err, 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = () => {
    // Backend redirects back to /oauth-callback?token=...
    window.location.href = authApi.googleLoginUrl();
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Centered form (full width on mobile, half on desktop) */}
      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Logo size={40} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Sign in to track expenses, set budgets, and analyse your savings.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input pl-9"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label !mb-0">Password</label>
                <span className="text-xs text-slate-400">Min. 6 characters</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Spinner size={16} /> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
            <div className="flex-1 h-px bg-slate-200" />
            <span>OR CONTINUE WITH</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <button
            onClick={googleLogin}
            className="btn-secondary w-full"
            type="button"
          >
            <GoogleIcon /> Continue with Google
          </button>

          <p className="mt-8 text-sm text-center text-slate-500">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-brand-700 font-semibold hover:text-brand-800">
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* Decorative right panel */}
      <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-brand-300 blur-3xl" />
        </div>
        <div className="relative max-w-md text-white">
          <h2 className="text-3xl font-bold leading-tight">
            Track. Budget.
            <br /> Save smarter.
          </h2>
          <p className="mt-4 text-brand-50 text-sm leading-relaxed">
            SpendSmart helps you understand exactly where your money goes — with
            real-time budgets, automated 80% &amp; 100% breach alerts, and beautifully
            simple reports.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <Stat label="Avg. monthly savings" value="22%" />
            <Stat label="Budget breaches caught" value="98%" />
            <Stat label="Currencies supported" value="9+" />
            <Stat label="Reports exported" value="PDF" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-white/10 backdrop-blur px-4 py-3 border border-white/10">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-brand-100 mt-0.5">{label}</p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
