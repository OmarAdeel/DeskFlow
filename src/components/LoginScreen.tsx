import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, KeyRound, LockKeyhole, Send } from 'lucide-react';
import { useWorkspace } from '../context';
import deskflowLogo from '../assets/deskflow-logo.png';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z" />
  </svg>
);

export function LoginScreen() {
  const { login, loginWithGoogle, requestPasswordReset, resetPasswordWithToken, isPasswordRecovery } = useWorkspace();
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>(isPasswordRecovery ? 'reset' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isPasswordRecovery) setMode('reset');
  }, [isPasswordRecovery]);

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

  const handleGoogleLogin = async () => {
    clearFeedback();
    setIsSubmitting(true);
    const result = await loginWithGoogle();
    setIsSubmitting(false);
    if (result) setError(result);
  };

  const handleForgotPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    setIsSubmitting(true);
    const result = await requestPasswordReset(email);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error || 'Unable to create a password reset link.');
      return;
    }
    setMessage('Check your email for a secure Supabase password-reset link.');
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    const result = await resetPasswordWithToken('', newPassword);
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


  const switchMode = (nextMode: 'login' | 'forgot') => {
    clearFeedback();
    setMode(nextMode);
  };

  const title = mode === 'login' ? 'Sign in to DeskFlow' : mode === 'forgot' ? 'Forgot your password?' : 'Set a new password';
  const description = mode === 'login'
    ? 'Sign in with your Supabase-backed DeskFlow account.'
    : mode === 'forgot'
      ? 'Enter your account email and Supabase will send a secure reset link.'
      : 'Choose a new password with at least 8 characters.';

  return (
    <main className="min-h-screen bg-[#121317] flex items-center justify-center px-4 text-gray-200">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#1A1D21] shadow-2xl overflow-hidden">
        <div className="p-8 text-center border-b border-gray-800">
          <div className="mx-auto mb-5 flex h-24 w-56 items-center justify-center px-4">
            <img src={deskflowLogo} alt="DeskFlow" className="max-h-full w-full object-contain" />
          </div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-xs text-gray-500">{description}</p>
        </div>

        {message && <div className="mx-8 mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">{message}</div>}
        {error && <div className="mx-8 mt-5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">{error}</div>}

        {mode === 'login' && (
          <div className="p-8 space-y-4">
            <button type="button" onClick={() => void handleGoogleLogin()} disabled={isSubmitting} className="w-full rounded-lg border border-gray-700 bg-[#121317] px-4 py-2.5 text-sm font-semibold text-gray-100 transition hover:bg-gray-800 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"><GoogleIcon /><span>Continue with Google</span></button>
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-gray-800" />
              <span className="text-[11px] uppercase tracking-wider text-gray-600">or</span>
              <span className="h-px flex-1 bg-gray-800" />
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
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
              <p className="text-center text-[10px] text-gray-600">Use the account credentials provided by your workspace administrator.</p>
            </form>
          </div>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="p-8 space-y-4">
            <label className="block text-xs font-semibold text-gray-400">Account email
              <input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" className="mt-1.5 w-full rounded-lg border border-gray-700 bg-[#121317] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500" required />
            </label>
            <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"><Send className="h-4 w-4" /><span>{isSubmitting ? 'Creating link…' : 'Create reset link'}</span></button>

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
