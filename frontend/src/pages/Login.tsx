import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { School, Mail, Lock, User, ArrowLeft, Loader2 } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'verify' | 'forgot' | 'reset';

export default function Login() {
  const { login } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', code: '', token: '', newPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingCode, setPendingCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); setLoading(false); return; }
        setPendingEmail(form.email);
        setPendingCode(data.verificationCode || '');
        setMode('verify');
        setSuccess(data.message || 'Registration successful! Please verify your email.');
      }
      else if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); setLoading(false); return; }
        if (data.needsVerification) {
          setPendingEmail(form.email);
          setPendingCode(data.verificationCode || '');
          setMode('verify');
          setSuccess('Please verify your email before continuing.');
          setLoading(false);
          return;
        }
        // Add subscription info to user
        const userWithSub = {
          ...data.user,
          subscription: {
            tier: data.user.subscription_tier || 'free',
            status: data.user.subscription_status || 'trial',
            trial_end: data.user.trial_end,
            subscription_end: data.user.subscription_end,
            days_left: data.user.trial_end ? Math.ceil((new Date(data.user.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0,
            is_trial: data.user.subscription_status === 'trial',
            is_expired: data.user.subscription_status === 'expired',
          }
        };
        login(data.token, userWithSub);
      }
      else if (mode === 'verify') {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: pendingEmail, code: form.code }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); setLoading(false); return; }
        setSuccess('Email verified! You can now log in.');
        setMode('login');
        setForm({ ...form, code: '' });
      }
      else if (mode === 'forgot') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); setLoading(false); return; }
        setPendingEmail(form.email);
        setForm({ ...form, token: data.resetToken || '' });
        setMode('reset');
        setSuccess(data.message || 'Reset token generated. Enter your new password below.');
      }
      else if (mode === 'reset') {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: pendingEmail, token: form.token, newPassword: form.newPassword }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); setLoading(false); return; }
        setSuccess('Password reset successful! You can now log in.');
        setMode('login');
        setForm({ ...form, token: '', newPassword: '' });
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); }
      else {
        setPendingCode(data.verificationCode || '');
        setSuccess('New code sent!');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const title = {
    login: 'Welcome Back',
    register: 'Create Account',
    verify: 'Verify Email',
    forgot: 'Forgot Password',
    reset: 'Reset Password',
  }[mode];

  const submitLabel = {
    login: 'Sign In',
    register: 'Create Account',
    verify: 'Verify Code',
    forgot: 'Send Reset Token',
    reset: 'Set New Password',
  }[mode];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-teal-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-teal-900 rounded-xl flex items-center justify-center">
            <School className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">EduPlan SA</h1>
            <p className="text-sm text-gray-500">South African Education Management</p>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">{title}</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{success}</div>
        )}

        {mode === 'verify' && pendingCode && (
          <div className="mb-4 p-3 bg-amber-50 text-amber-800 rounded-lg text-sm">
            <p className="font-medium">Your verification code:</p>
            <p className="text-2xl font-bold tracking-widest mt-1">{pendingCode}</p>
            <p className="text-xs mt-1 text-amber-600">(In a real app, this would be sent to your email.)</p>
          </div>
        )}

        {mode === 'reset' && form.token && (
          <div className="mb-4 p-3 bg-amber-50 text-amber-800 rounded-lg text-sm">
            <p className="font-medium">Your reset token:</p>
            <p className="text-xs font-mono break-all mt-1">{form.token}</p>
            <p className="text-xs mt-1 text-amber-600">(In a real app, this would be sent to your email.)</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text" required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                  placeholder="Your name"
                />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="email" required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                  placeholder="you@school.com"
                />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="password" required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                  placeholder="••••••••"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>
          )}

          {mode === 'verify' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
              <input
                type="text" required maxLength={6}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, '') })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-center text-2xl tracking-widest"
                placeholder="000000"
              />
            </div>
          )}

          {mode === 'reset' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="password" required
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-teal-800 text-white rounded-lg hover:bg-teal-900 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitLabel}
          </button>
        </form>

        {mode === 'verify' && (
          <div className="mt-4 text-center">
            <button onClick={resendCode} disabled={loading} className="text-sm text-teal-700 hover:underline disabled:opacity-50">
              Resend code
            </button>
          </div>
        )}

        <div className="mt-6 text-center space-y-2">
          {mode === 'login' && (
            <>
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button onClick={() => { setMode('register'); setError(''); setSuccess(''); }} className="text-teal-800 font-medium hover:underline">
                  Register
                </button>
              </p>
              <p className="text-sm text-gray-600">
                <button onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }} className="text-teal-800 font-medium hover:underline">
                  Forgot password?
                </button>
              </p>
            </>
          )}
          {(mode === 'register' || mode === 'forgot' || mode === 'reset') && (
            <p className="text-sm text-gray-600">
              <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="text-teal-800 font-medium hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back to Sign In
              </button>
            </p>
          )}
          {mode === 'verify' && (
            <p className="text-sm text-gray-600">
              <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="text-teal-800 font-medium hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back to Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
