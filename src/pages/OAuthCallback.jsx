import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/Feedback';
import Logo from '../components/Logo';

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { acceptToken } = useAuth();

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      toast.error('Google sign-in failed.');
      nav('/login', { replace: true });
      return;
    }
    (async () => {
      try {
        await acceptToken(token);
        toast.success('Signed in with Google');
        nav('/dashboard', { replace: true });
      } catch {
        toast.error('Could not complete sign-in.');
        nav('/login', { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <Logo size={40} className="justify-center" />
        <div className="mt-6 flex items-center justify-center gap-2 text-slate-600">
          <Spinner size={18} className="text-brand-600" />
          <span className="text-sm">Completing sign-in…</span>
        </div>
      </div>
    </div>
  );
}
