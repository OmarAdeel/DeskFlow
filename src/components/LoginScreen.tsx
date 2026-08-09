import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Globe2, KeyRound, LockKeyhole, Send } from 'lucide-react';
import { useWorkspace } from '../context';
import deskflowLogo from '../assets/deskflow-logo.png';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z" />
  </svg>
);

type AuthMode = 'email' | 'password' | 'forgot' | 'reset';

export function LoginScreen() {
  const { login, loginWithGoogle, requestPasswordReset, resetPasswordWithToken, isPasswordRecovery } = useWorkspace();
  const [mode, setMode] = useState<AuthMode>(isPasswordRecovery ? 'reset' : 'email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const continueWithEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    setMode('password');
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
    setMessage('Check your inbox for a secure password-reset link.');
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
    setMode('email');
  };

  const switchMode = (nextMode: AuthMode) => {
    clearFeedback();
    setMode(nextMode);
  };

  const heading = mode === 'email'
    ? 'Enter your email to sign in'
    : mode === 'password'
      ? 'Enter your password'
      : mode === 'forgot'
        ? 'Reset your password'
        : 'Set a new password';

  const description = mode === 'email'
    ? 'Sign in to your DeskFlow workspace.'
    : mode === 'password'
      ? 'Use the password connected to your DeskFlow account.'
      : mode === 'forgot'
        ? 'We’ll email you a secure link to get back into your account.'
        : 'Choose a secure password with at least 8 characters.';

  return (
    <main className="min-h-screen bg-white px-5 font-sans text-[#1d1c1d]">
      <header className="mx-auto flex h-24 w-full max-w-[1280px] items-center justify-center sm:h-[128px] sm:justify-between">
        <img src={deskflowLogo} alt="DeskFlow" className="h-14 w-40 object-contain sm:h-16 sm:w-44" />
        <div className="hidden text-right text-[13px] leading-5 text-[#616061] sm:block">
          <p>New to DeskFlow?</p>
          <p className="font-semibold text-[#1264a3]">Ask your workspace administrator</p>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-[400px] flex-col items-center pb-28 pt-5 text-center sm:pt-8">
        <h1 className="max-w-[520px] text-[32px] font-bold leading-[1.15] tracking-[-0.8px] sm:text-[48px] sm:tracking-[-1.2px]">
          {heading}
        </h1>
        <p className="mt-3 text-[17px] leading-6 text-[#454245]">{description}</p>

        <div className="mt-8 w-full">
          {message && (
            <div role="status" className="mb-5 flex items-start gap-3 rounded-md border border-[#2bac76] bg-[#f4fbf8] p-3 text-left text-sm text-[#1d1c1d]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#007a5a]" />
              <span>{message}</span>
            </div>
          )}
          {error && (
            <div role="alert" className="mb-5 rounded-md border border-[#e01e5a] bg-[#fff5f7] p-3 text-left text-sm text-[#1d1c1d]">
              {error}
            </div>
          )}

          {mode === 'email' && (
            <>
              <form onSubmit={continueWithEmail} className="space-y-5">
                <label htmlFor="signin-email" className="sr-only">Email address</label>
                <input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  autoComplete="email"
                  autoFocus
                  placeholder="name@work-email.com"
                  className="h-[57px] w-full rounded-[4px] border border-[#868686] bg-white px-3 text-[18px] text-[#1d1c1d] shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] outline-none transition placeholder:text-[#696969] hover:border-[#1d1c1d] focus:border-[#1264a3] focus:ring-4 focus:ring-[#1d9bd1]/30"
                  required
                />
                <button type="submit" className="h-[57px] w-full rounded-[4px] bg-[#611f69] px-4 text-[18px] font-bold text-white transition hover:bg-[#4a154b] focus:outline-none focus:ring-4 focus:ring-[#611f69]/25">
                  Sign In With Email
                </button>
              </form>

              <div className="my-6 flex items-center gap-5" aria-hidden="true">
                <span className="h-px flex-1 bg-[#dddddd]" />
                <span className="text-xs font-bold tracking-[0.4px] text-[#696969]">OR SIGN IN WITH</span>
                <span className="h-px flex-1 bg-[#dddddd]" />
              </div>

              <button
                type="button"
                onClick={() => void handleGoogleLogin()}
                disabled={isSubmitting}
                className="flex h-[57px] w-full items-center justify-center gap-3 rounded-[4px] border-2 border-[#4285f4] bg-white px-4 text-[18px] font-bold text-[#1d1c1d] transition hover:bg-[#f8faff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <GoogleIcon />
                <span>{isSubmitting ? 'Connecting…' : 'Google'}</span>
              </button>
            </>
          )}

          {mode === 'password' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <button type="button" onClick={() => switchMode('email')} className="mx-auto flex items-center gap-2 rounded-full border border-[#dddddd] bg-white px-4 py-2 text-sm font-semibold text-[#454245] transition hover:bg-[#f8f8f8]" aria-label="Change email address">
                <span className="max-w-[300px] truncate">{email}</span>
                <span className="font-normal text-[#1264a3]">Change</span>
              </button>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#696969]" />
                <label htmlFor="signin-password" className="sr-only">Password</label>
                <input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  autoComplete="current-password"
                  autoFocus
                  placeholder="Password"
                  className="h-[57px] w-full rounded-[4px] border border-[#868686] bg-white py-2 pl-12 pr-12 text-[18px] text-[#1d1c1d] outline-none transition placeholder:text-[#696969] hover:border-[#1d1c1d] focus:border-[#1264a3] focus:ring-4 focus:ring-[#1d9bd1]/30"
                  required
                />
                <button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1.5 text-[#616061] hover:bg-[#f1f1f1]" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <button type="submit" disabled={isSubmitting} className="h-[57px] w-full rounded-[4px] bg-[#611f69] px-4 text-[18px] font-bold text-white transition hover:bg-[#4a154b] disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
              <button type="button" onClick={() => switchMode('forgot')} className="text-[15px] font-semibold text-[#1264a3] hover:underline">
                Forgot your password?
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <label htmlFor="reset-email" className="sr-only">Account email</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                autoComplete="email"
                autoFocus
                placeholder="name@work-email.com"
                className="h-[57px] w-full rounded-[4px] border border-[#868686] bg-white px-3 text-[18px] text-[#1d1c1d] outline-none focus:border-[#1264a3] focus:ring-4 focus:ring-[#1d9bd1]/30"
                required
              />
              <button type="submit" disabled={isSubmitting} className="flex h-[57px] w-full items-center justify-center gap-2 rounded-[4px] bg-[#611f69] px-4 text-[18px] font-bold text-white transition hover:bg-[#4a154b] disabled:opacity-60">
                <Send className="h-5 w-5" />
                <span>{isSubmitting ? 'Sending…' : 'Send reset link'}</span>
              </button>
              <button type="button" onClick={() => switchMode(email ? 'password' : 'email')} className="mx-auto flex items-center gap-1 text-[15px] font-semibold text-[#1264a3] hover:underline">
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </button>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <label htmlFor="new-password" className="sr-only">New password</label>
              <input id="new-password" type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} autoComplete="new-password" autoFocus placeholder="New password" className="h-[57px] w-full rounded-[4px] border border-[#868686] bg-white px-3 text-[18px] text-[#1d1c1d] outline-none focus:border-[#1264a3] focus:ring-4 focus:ring-[#1d9bd1]/30" required minLength={8} />
              <label htmlFor="confirm-password" className="sr-only">Confirm new password</label>
              <input id="confirm-password" type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} autoComplete="new-password" placeholder="Confirm new password" className="h-[57px] w-full rounded-[4px] border border-[#868686] bg-white px-3 text-[18px] text-[#1d1c1d] outline-none focus:border-[#1264a3] focus:ring-4 focus:ring-[#1d9bd1]/30" required minLength={8} />
              <button type="submit" disabled={isSubmitting} className="flex h-[57px] w-full items-center justify-center gap-2 rounded-[4px] bg-[#611f69] px-4 text-[18px] font-bold text-white transition hover:bg-[#4a154b] disabled:opacity-60">
                <KeyRound className="h-5 w-5" />
                <span>{isSubmitting ? 'Saving…' : 'Reset password'}</span>
              </button>
            </form>
          )}
        </div>

        {mode === 'email' && (
          <p className="mt-8 text-[15px] leading-6 text-[#616061]">
            Having trouble? Contact your workspace administrator for access.
          </p>
        )}
      </section>

      <footer className="fixed inset-x-0 bottom-0 hidden h-20 items-center justify-center gap-8 bg-white text-sm text-[#616061] sm:flex">
        <span>Privacy & Terms</span>
        <span>Contact Us</span>
        <span className="flex items-center gap-1.5"><Globe2 className="h-4 w-4" /> English</span>
      </footer>
    </main>
  );
}
