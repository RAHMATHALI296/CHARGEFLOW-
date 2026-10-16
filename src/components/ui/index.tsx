import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-ev text-void font-semibold hover:bg-ev-hover active:translate-y-px shadow-[0_10px_24px_-12px_rgba(61,220,132,0.55)]',
  secondary: 'bg-raised text-ink border border-line-strong hover:border-ev/50 hover:text-ev',
  outline: 'border border-line-strong text-dim hover:border-ev/50 hover:text-ink',
  ghost: 'text-dim hover:text-ink hover:bg-raised',
  danger: 'bg-danger-soft text-danger border border-danger/40 hover:bg-danger hover:text-void',
};

const BUTTON_SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-sm gap-2 rounded-xl',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, icon, className = '', children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-45 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

// ---------------------------------------------------------------------------
// Badges & status
// ---------------------------------------------------------------------------

export type Tone = 'ev' | 'warn' | 'danger' | 'info' | 'neutral';

const TONE_CHIP: Record<Tone, string> = {
  ev: 'bg-ev-soft text-ev border-ev/30',
  warn: 'bg-warn-soft text-warn border-warn/30',
  danger: 'bg-danger-soft text-danger border-danger/30',
  info: 'bg-info-soft text-info border-info/30',
  neutral: 'bg-raised text-dim border-line-strong',
};

const TONE_DOT: Record<Tone, string> = {
  ev: 'bg-ev',
  warn: 'bg-warn',
  danger: 'bg-danger',
  info: 'bg-info',
  neutral: 'bg-faint',
};

export function Chip({
  tone = 'neutral',
  children,
  className = '',
  icon,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-medium ${TONE_CHIP[tone]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}

/** Status indicator — always pairs colour with text (and a dot), never colour alone. */
export function StatusDot({
  tone,
  label,
  pulse = false,
  className = '',
}: {
  tone: Tone;
  label: string;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-medium text-ink ${className}`}>
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        {pulse && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-pulse-ring ${TONE_DOT[tone]}`}
          />
        )}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${TONE_DOT[tone]}`} />
      </span>
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Form controls
// ---------------------------------------------------------------------------

export function Field({
  label,
  error,
  hint,
  children,
  htmlFor,
  className = '',
}: {
  label: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-dim">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-faint">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = '', ...rest }, ref) {
    return <input ref={ref} className={`input-base ${className}`} {...rest} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = '', ...rest }, ref) {
    return <textarea ref={ref} className={`input-base min-h-[96px] resize-y ${className}`} {...rest} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = '', children, ...rest }, ref) {
    return (
      <select ref={ref} className={`input-base appearance-none pr-8 ${className}`} {...rest}>
        {children}
      </select>
    );
  },
);

export function Alert({
  tone = 'danger',
  title,
  children,
}: {
  tone?: 'danger' | 'ev' | 'warn' | 'info';
  title?: string;
  children: ReactNode;
}) {
  const styles = {
    danger: 'border-danger/40 bg-danger-soft text-danger',
    ev: 'border-ev/40 bg-ev-soft text-ev',
    warn: 'border-warn/40 bg-warn-soft text-warn',
    info: 'border-info/40 bg-info-soft text-info',
  }[tone];
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={`rounded-lg border px-3.5 py-3 text-sm ${styles}`}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? 'mt-0.5 text-xs leading-relaxed opacity-90' : 'text-xs leading-relaxed'}>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="label-caps mb-1.5">{eyebrow}</p>}
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-dim">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel flex flex-col items-center justify-center px-6 py-12 text-center">
      {icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-raised text-faint">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-dim">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatTile({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  tone?: Tone;
}) {
  return (
    <div className="panel px-4 py-3.5">
      <p className="label-caps">{label}</p>
      <p
        className={`mt-1.5 text-2xl font-semibold tracking-tight ${
          tone === 'ev' ? 'text-ev' : tone === 'warn' ? 'text-warn' : tone === 'danger' ? 'text-danger' : 'text-ink'
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-faint">{sub}</p>}
    </div>
  );
}

/** Small labelled simulated-data notice used across map / dashboards. */
export function SimulatedNotice({ className = '' }: { className?: string }) {
  return (
    <p
      className={`inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line-strong px-2.5 py-1.5 text-2xs text-faint ${className}`}
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warn" aria-hidden />
      Simulated data — illustrative prototype, not live charging infrastructure.
    </p>
  );
}

// ---------------------------------------------------------------------------
// Confirm dialog
// ---------------------------------------------------------------------------

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Keep as is',
  destructive = false,
  onConfirm,
  onCancel,
  busy = false,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="absolute inset-0 bg-void/80 backdrop-blur-sm"
            onClick={onCancel}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ scale: 0.97, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, y: 8 }}
            transition={{ duration: 0.18 }}
            className="panel-raised relative w-full max-w-md p-5 shadow-pop"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-base font-semibold text-ink">{title}</h2>
              <button
                onClick={onCancel}
                className="rounded-lg p-1 text-faint transition-colors hover:bg-raised hover:text-ink"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-dim">{description}</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={onCancel} disabled={busy}>
                {cancelLabel}
              </Button>
              <Button
                variant={destructive ? 'danger' : 'primary'}
                onClick={onConfirm}
                loading={busy}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
