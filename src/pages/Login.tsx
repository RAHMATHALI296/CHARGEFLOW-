import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, MonitorCog, ShieldAlert, Zap } from 'lucide-react';
import { useState, useEffect, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Chip, Field, Input } from '../components/ui';
import { DEMO_USER } from '../data/mockData';
import { useApp } from '../store/AppContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Login() {
  const { signIn, state } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ??
    new URLSearchParams(location.search).get('from') ??
    '/dashboard';

  const operatorMode = new URLSearchParams(location.search).get('mode') === 'operator';

  // Already signed in as a driver → skip the login screen.
  useEffect(() => {
    if (state.auth.signedIn && state.auth.role === 'driver') {
      navigate(from, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const finishDriver = (usedEmail: string) => {
    signIn('driver', { email: usedEmail || DEMO_USER.email });
    navigate(from, { replace: true });
  };

  const finishOperator = () => {
    signIn('operator');
    navigate('/operator', { replace: true });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = 'Enter the email for your demo account.';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'That does not look like a valid email address.';
    if (!password) next.password = 'Enter a password to continue.';
    else if (password.length < 6) next.password = 'Passwords are at least 6 characters.';
    setErrors(next);
    setAuthError(null);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      if (password === DEMO_USER.password) {
        finishDriver(email.trim());
      } else {
        setAuthError(
          `This is a simulated sign-in — no server is contacted. The demo password is "${DEMO_USER.password}".`,
        );
      }
    }, 450);
  };

  const useDemoAccount = () => {
    setErrors({});
    setAuthError(null);
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      finishDriver(DEMO_USER.email);
    }, 350);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-void">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(620px 300px at 50% -5%, rgba(61,220,132,0.10), transparent 70%)',
        }}
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 self-start text-sm text-dim transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to homepage
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="panel p-6 shadow-pop sm:p-8"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ev text-void">
              <Zap className="h-5 w-5" fill="currentColor" />
            </span>
            <div>
              <p className="text-base font-semibold tracking-tight text-ink">ChargeFlow</p>
              <p className="text-2xs uppercase tracking-widest text-faint">
                {operatorMode ? 'Operator demo entry' : 'Driver sign in'}
              </p>
            </div>
            <Chip tone="warn" className="ml-auto">
              Simulated auth
            </Chip>
          </div>

          <h1 className="mt-6 text-xl font-semibold tracking-tight text-ink">
            Welcome back{state.auth.signedIn ? `, ${state.auth.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1.5 text-sm text-dim">
            Sign in to explore stations, reserve slots and track charging. Credentials never leave
            your browser.
          </p>

          <div className="mt-5 rounded-lg border border-dashed border-line-strong bg-raised px-3.5 py-3">
            <p className="text-2xs font-semibold uppercase tracking-wider text-faint">
              Demonstration account
            </p>
            <p className="mt-1 font-mono text-xs text-dim">
              {DEMO_USER.email} · {DEMO_USER.password}
            </p>
          </div>

          <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-4">
            {authError && <Alert tone="warn" title="Sign-in did not complete">{authError}</Alert>}

            <Field label="Email" htmlFor="email" error={errors.email}>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                />
              </div>
            </Field>

            <Field label="Password" htmlFor="password" error={errors.password}>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-9 pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(errors.password)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-faint transition-colors hover:text-ink"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <Button type="submit" size="lg" loading={busy} className="w-full">
              Sign in to ChargeFlow
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={useDemoAccount}
              loading={busy}
              className="w-full"
              icon={<ShieldAlert className="h-4 w-4" />}
            >
              Use demo driver account
            </Button>
          </form>

          <p className="mt-4 flex items-start gap-2 rounded-lg bg-info-soft px-3 py-2.5 text-2xs leading-relaxed text-info">
            <MonitorCog className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Authentication is simulated for this prototype. No credentials are transmitted or
            stored on any server — only your session flag lives in browser local storage.
          </p>

          <div className="mt-5 rounded-lg border border-line bg-raised p-4">
            <p className="text-xs font-semibold text-ink">Presenting the operator side?</p>
            <p className="mt-1 text-xs leading-relaxed text-dim">
              The operator console is a separate demonstration interface for managing charger
              statuses and reservations.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={finishOperator}
            >
              Open operator dashboard
            </Button>
          </div>
        </motion.div>

        <p className="mt-6 text-center text-2xs text-faint">
          ChargeFlow · Smart EV Charging Platform prototype
        </p>
      </div>
    </div>
  );
}
