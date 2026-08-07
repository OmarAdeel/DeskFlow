import { useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Copy, KeyRound, LockKeyhole, Mail, MessageSquare, Send } from 'lucide-react';
import { useWorkspace } from '../context';
import deskflowLogo from '../assets/deskflow-logo.png';

export function LoginScreen() {
  const { login, requestPasswordReset, resetPasswordWithToken } = useWorkspace();
  const resetToken = useMemo(() => new URLSearchParams(window.location.hash.replace(/^#/, '')).get('resetToken') || '', []);
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>(resetToken ? 'reset' : 'login');
  const [email, setEmail] = useState('abdallah@democompany.com');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFeedback = () => {
    setMessage(null);
    setError(null);
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);
    if (result) setError(result);
  };

  const handleForgotPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    setResetLink(null);
    setIsSubmitting(true);
    const result = await requestPasswordReset(email);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error || 'Unable to create a password reset link.');
      return;
    }
    setResetLink(result.link || null);
    setMessage('Reset link created. This demo has no mail server, so use Copy link or Open email draft to send it.');
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    const result = await resetPasswordWithToken(resetToken, newPassword);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error || 'Unable to reset password.');
      return;
    }
    window.history.replaceState({}, document.title, window.location.pathname);
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage('Password reset successfully. You can now sign in.');
    setMode('login');
  };

  const copyResetLink = async () => {
    if (!resetLink) return;
    await navigator.clipboard?.writeText(resetLink);
    setMessage('Reset link copied to your clipboard.');
  };

  const openEmailDraft = () => {
    if (!resetLink) return;
    const subject = encodeURIComponent('Reset your workspace password');
    const body = encodeURIComponent(`Use this link to reset your workspace password:\n\n${resetLink}\n\nThis link expires in 30 minutes and can only be used once.`);
    window.location.href = `mailto:${encodeURIComponent(email.trim())}?subject=${subject}&body=${body}`;
  };

  const switchMode = (nextMode: 'login' | 'forgot') => {
    clearFeedback();
    setResetLink(null);
    setMode(nextMode);
  };

  const title = mode === 'login' ? 'Sign in to DeskFlow' : mode === 'forgot' ? 'Forgot your password?' : 'Set a new password';
  const description = mode === 'login'
    ? 'Local demo account. Your workspace data is preserved.'
    : mode === 'forgot'
      ? 'Enter your account email to create a secure, time-limited reset link.'
      : 'Choose a new password with at least 8 characters.';

  return (
    <main className="min-h-screen bg-[#121317] flex items-center justify-center px-4 text-gray-200">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#1A1D21] shadow-2xl overflow-hidden">
        <div className="p-8 text-center border-b border-gray-800">
          <div className="mx-auto mb-5 flex h-24 w-56 items-center justify-center rounded-xl bg-black px-4 shadow-lg shadow-blue-900/20">
            <img src={deskflowLogo} alt="DeskFlow" className="max-h-full w-full object-contain" />
          </div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-xs text-gray-500">{description}</p>
        </div>

        {message && <div className="mx-8 mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">{message}</div>}
        {error && <div className="mx-8 mt-5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">{error}</div>}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="p-8 space-y-4">
            <label className="block text-xs font-semibold text-gray-400">Email
              <input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" className="mt-1.5 w-full rounded-lg border border-gray-700 bg-[#121317] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500" required />
            </label>
            <label className="block text-xs font-semibold text-gray-400">Password
              <div className="relative mt-1.5">
                <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                <input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter your password" className="w-full rounded-lg border border-gray-700 bg-[#121317] py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-blue-500" required />
              </div>
            </label>
            <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"><span>{isSubmitting ? 'Signing in…' : 'Sign in'}</span><ArrowRight className="h-4 w-4" /></button>
            <button type="button" onClick={() => switchMode('forgot')} className="w-full text-xs text-blue-400 hover:text-blue-300">Forgot password?</button>
            <p className="text-center text-[10px] text-gray-600">Default demo accounts use <span className="font-mono text-gray-500">demo123</span> until a password is changed.</p>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="p-8 space-y-4">
            <label className="block text-xs font-semibold text-gray-400">Account email
              <input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" className="mt-1.5 w-full rounded-lg border border-gray-700 bg-[#121317] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500" required />
            </label>
            <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"><Send className="h-4 w-4" /><span>{isSubmitting ? 'Creating link…' : 'Create reset link'}</span></button>
            {resetLink && <div className="space-y-2 rounded-lg border border-gray-700 bg-[#121317] p-3"><p className="text-[10px] text-gray-500">Reset link</p><p className="break-all text-[11px] text-blue-300">{resetLink}</p><div className="flex gap-2"><button type="button" onClick={copyResetLink} className="flex-1 rounded-lg bg-gray-800 px-2 py-2 text-[11px] text-gray-200 hover:bg-gray-700 flex items-center justify-center gap-1"><Copy className="h-3.5 w-3.5" /> Copy link</button><button type="button" onClick={openEmailDraft} className="flex-1 rounded-lg bg-emerald-600 px-2 py-2 text-[11px] text-white hover:bg-emerald-500 flex items-center justify-center gap-1"><Mail className="h-3.5 w-3.5" /> Open email draft</button></div></div>}
            <button type="button" onClick={() => switchMode('login')} className="w-full text-xs text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1"><ArrowLeft className="h-3.5 w-3.5" /> Back to sign in</button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="p-8 space-y-4">
            <label className="block text-xs font-semibold text-gray-400">New password
              <input type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} autoComplete="new-password" className="mt-1.5 w-full rounded-lg border border-gray-700 bg-[#121317] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500" required minLength={8} />
            </label>
            <label className="block text-xs font-semibold text-gray-400">Confirm new password
              <input type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} autoComplete="new-password" className="mt-1.5 w-full rounded-lg border border-gray-700 bg-[#121317] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500" required minLength={8} />
            </label>
            <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"><KeyRound className="h-4 w-4" /><span>{isSubmitting ? 'Saving…' : 'Reset password'}</span></button>
          </form>
        )}
      </div>
    </main>
  );
}
