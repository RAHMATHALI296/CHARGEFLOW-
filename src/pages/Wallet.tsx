import { motion } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  CheckCircle2,
  Smartphone,
  Wallet as WalletIcon,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  Field,
  Input,
  PageHeader,
  SimulatedNotice,
} from '../components/ui';
import { PAYMENT_METHODS } from '../data/mockData';
import { formatDateTime, formatINR } from '../lib/format';
import { useApp, type PaymentResult } from '../store/AppContext';
import type { PaymentMethod, Transaction } from '../types';

type Stage = 'idle' | 'review' | 'done';
type Filter = 'all' | 'topup' | 'payment' | 'failed';

const PRESETS = [500, 1000, 2000];

const METHOD_ICON: Record<PaymentMethod, typeof Smartphone> = {
  upi: Smartphone,
  card: CreditCard,
  wallet: WalletIcon,
};

const STATUS_TONE: Record<Transaction['status'], 'ev' | 'danger' | 'warn'> = {
  successful: 'ev',
  failed: 'danger',
  pending: 'warn',
};

export default function Wallet() {
  const { state, processPayment } = useApp();

  const [amount, setAmount] = useState('1000');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [outcome, setOutcome] = useState<'success' | 'failure'>('success');
  const [stage, setStage] = useState<Stage>('idle');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  const numericAmount = Number(amount);

  const validate = (): boolean => {
    if (!Number.isFinite(numericAmount) || numericAmount < 100) {
      setAmountError('Enter at least ₹100.');
      return false;
    }
    if (numericAmount > 5000) {
      setAmountError('Demo top-ups are capped at ₹5,000.');
      return false;
    }
    if (!Number.isInteger(numericAmount)) {
      setAmountError('Use a whole rupee amount.');
      return false;
    }
    setAmountError(null);
    return true;
  };

  const startReview = () => {
    if (!validate()) return;
    setResult(null);
    setStage('review');
  };

  const confirmPayment = () => {
    if (busy || stage !== 'review') return; // duplicate-click guard
    setBusy(true);
    // Small simulated processing delay so the UI shows a real pending state.
    window.setTimeout(() => {
      const res = processPayment({
        amount: numericAmount,
        description: `Wallet top-up via ${method === 'upi' ? 'UPI' : method === 'card' ? 'card' : 'wallet'}`,
        type: 'topup',
        method,
        outcome,
      });
      setResult(res);
      setBusy(false);
      setStage('done');
    }, 600);
  };

  const reset = () => {
    setStage('idle');
    setResult(null);
    setAmount('1000');
    setOutcome('success');
  };

  const visibleTx = state.transactions.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'failed') return t.status === 'failed';
    if (filter === 'topup') return t.type === 'topup';
    return t.type === 'payment';
  });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Payments"
        title="ChargeFlow Wallet"
        subtitle="A demonstration wallet for top-ups and charging payments. Every method here is mocked — no real money ever moves."
        actions={<SimulatedNotice />}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        {/* Balance + add money */}
        <div className="flex flex-col gap-4">
          <section className="panel overflow-hidden">
            <div className="relative px-5 py-5">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(240px 120px at 15% 0%, rgba(61,220,132,0.10), transparent 70%)',
                }}
                aria-hidden
              />
              <p className="label-caps relative">Current balance</p>
              <motion.p
                key={state.walletBalance}
                initial={{ opacity: 0.4, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative mt-1 text-4xl font-semibold tracking-tight text-ink"
              >
                {formatINR(state.walletBalance)}
              </motion.p>
              <p className="relative mt-1 text-2xs text-faint">
                Simulated balance stored in this browser
              </p>
            </div>

            <div className="border-t border-line px-5 py-4">
              <div className="flex items-center justify-between text-xs text-dim">
                <span>Total topped up</span>
                <span className="font-medium text-ev">
                  {formatINR(
                    state.transactions
                      .filter((t) => t.status === 'successful' && t.amount > 0)
                      .reduce((a, t) => a + t.amount, 0),
                  )}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-dim">
                <span>Total spent on charging</span>
                <span className="font-medium text-warn">
                  {formatINR(
                    Math.abs(
                      state.transactions
                        .filter((t) => t.status === 'successful' && t.amount < 0)
                        .reduce((a, t) => a + t.amount, 0),
                    ),
                  )}
                </span>
              </div>
            </div>
          </section>

          {/* Add money flow */}
          <section className="panel p-5" aria-label="Add money to wallet">
            <div className="flex items-center justify-between">
              <p className="label-caps">Add money</p>
              <Chip tone="info">Demo payment</Chip>
            </div>

            {stage === 'idle' && (
              <div className="mt-3 flex flex-col gap-4">
                <div className="flex gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setAmount(String(p));
                        setAmountError(null);
                      }}
                      className={`flex-1 rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
                        numericAmount === p
                          ? 'border-ev bg-ev-soft text-ev'
                          : 'border-line bg-raised text-dim hover:border-line-strong hover:text-ink'
                      }`}
                    >
                      ₹{p}
                    </button>
                  ))}
                </div>

                <Field label="Amount (₹)" htmlFor="topup-amount" error={amountError}>
                  <Input
                    id="topup-amount"
                    type="number"
                    min={100}
                    max={5000}
                    step={50}
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setAmountError(null);
                    }}
                  />
                </Field>

                <Field label="Payment method" htmlFor="topup-method" hint="Demonstration options only">
                  <div className="flex flex-col gap-2">
                    {PAYMENT_METHODS.filter((m) => m.id !== 'wallet').map((m) => {
                      const Icon = METHOD_ICON[m.id];
                      const active = method === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          id={m.id === 'upi' ? 'topup-method' : undefined}
                          onClick={() => setMethod(m.id)}
                          aria-pressed={active}
                          className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors ${
                            active
                              ? 'border-ev bg-ev-soft'
                              : 'border-line bg-raised hover:border-line-strong'
                          }`}
                        >
                          <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-ev' : 'text-faint'}`} />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-ink">{m.label}</span>
                            <span className="block text-2xs text-faint">{m.detail}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Button size="lg" onClick={startReview}>
                  Review top-up
                </Button>
              </div>
            )}

            {stage === 'review' && (
              <div className="mt-3 flex flex-col gap-4">
                <div className="rounded-xl border border-line bg-raised p-4">
                  <p className="label-caps">Review transaction</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-dim">Amount</span>
                    <span className="text-lg font-semibold text-ink">{formatINR(numericAmount)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-sm text-dim">Method</span>
                    <span className="text-sm font-medium text-ink">
                      {PAYMENT_METHODS.find((m) => m.id === method)?.label}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-sm text-dim">New balance</span>
                    <span className="text-sm font-medium text-ev">
                      {formatINR(state.walletBalance + numericAmount)}
                    </span>
                  </div>
                </div>

                {/* Clearly labelled simulation control */}
                <fieldset className="rounded-lg border border-dashed border-line-strong px-3.5 py-3">
                  <legend className="px-1 text-2xs font-semibold uppercase tracking-wider text-faint">
                    Simulation control
                  </legend>
                  <div className="flex gap-2">
                    {(['success', 'failure'] as const).map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setOutcome(o)}
                        aria-pressed={outcome === o}
                        className={`flex-1 rounded-md border px-2.5 py-1.5 text-2xs font-medium transition-colors ${
                          outcome === o
                            ? o === 'success'
                              ? 'border-ev bg-ev-soft text-ev'
                              : 'border-danger bg-danger-soft text-danger'
                            : 'border-line text-dim hover:text-ink'
                        }`}
                      >
                        Simulate {o}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-2xs text-faint">
                    Choose the outcome of this demo payment. Nothing is sent to any payment gateway.
                  </p>
                </fieldset>

                <div className="flex gap-2">
                  <Button
                    size="lg"
                    className="flex-1"
                    loading={busy}
                    onClick={confirmPayment}
                    icon={!busy ? <CheckCircle2 className="h-4 w-4" /> : undefined}
                  >
                    Confirm payment
                  </Button>
                  <Button size="lg" variant="ghost" onClick={() => setStage('idle')} disabled={busy}>
                    Back
                  </Button>
                </div>
              </div>
            )}

            {stage === 'done' && result && (
              <div className="mt-3 flex flex-col gap-3">
                {result.ok ? (
                  <Alert tone="ev" title="Payment successful (simulated)">
                    {formatINR(numericAmount)} was added to your ChargeFlow wallet. The transaction
                    is recorded in your history below.
                  </Alert>
                ) : (
                  <Alert tone="danger" title="Payment failed (simulated)">
                    {result.error}
                  </Alert>
                )}
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={reset}>
                    Add more money
                  </Button>
                </div>
              </div>
            )}
          </section>

          <p className="text-2xs leading-relaxed text-faint">
            Never enter real card numbers, UPI PINs or banking passwords anywhere in this prototype
            — it never asks for them.
          </p>
        </div>

        {/* Transactions */}
        <section className="panel overflow-hidden" aria-label="Transaction history">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
            <div>
              <p className="label-caps">Transactions</p>
              <p className="mt-0.5 text-2xs text-faint">{state.transactions.length} records</p>
            </div>
            <div className="flex gap-1.5" role="group" aria-label="Filter transactions">
              {(
                [
                  ['all', 'All'],
                  ['topup', 'Top-ups'],
                  ['payment', 'Payments'],
                  ['failed', 'Failed'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  aria-pressed={filter === id}
                  className={`rounded-lg border px-2.5 py-1.5 text-2xs font-medium transition-colors ${
                    filter === id
                      ? 'border-ev bg-ev-soft text-ev'
                      : 'border-line text-dim hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {visibleTx.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-faint">
              No transactions match this filter yet.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {visibleTx.map((t) => {
                const isCredit = t.amount > 0;
                const Icon = isCredit ? ArrowDownLeft : ArrowUpRight;
                const MethodIcon = METHOD_ICON[t.method as PaymentMethod] ?? WalletIcon;
                return (
                  <li key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        t.status === 'failed'
                          ? 'bg-danger-soft text-danger'
                          : isCredit
                            ? 'bg-ev-soft text-ev'
                            : 'bg-raised text-dim'
                      }`}
                    >
                      {t.status === 'failed' ? <XCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{t.description}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-2xs text-faint">
                        <span>{formatDateTime(t.createdAt)}</span>
                        <span className="inline-flex items-center gap-1">
                          <MethodIcon className="h-3 w-3" />
                          {PAYMENT_METHODS.find((m) => m.id === t.method)?.label ?? 'ChargeFlow wallet'}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-sm font-semibold ${
                          t.status === 'failed'
                            ? 'text-faint'
                            : isCredit
                              ? 'text-ev'
                              : 'text-ink'
                        }`}
                      >
                        {isCredit ? '+' : '−'}
                        {formatINR(Math.abs(t.amount))}
                      </span>
                      <Chip tone={STATUS_TONE[t.status]}>
                        {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                      </Chip>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
