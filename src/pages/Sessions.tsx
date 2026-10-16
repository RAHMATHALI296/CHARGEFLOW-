import { motion } from 'framer-motion';
import {
  BatteryCharging,
  CircleStop,
  Info,
  Plug,
  Play,
  Timer,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Button,
  Chip,
  Field,
  PageHeader,
  SimulatedNotice,
  StatusDot,
} from '../components/ui';
import { PAYMENT_METHODS } from '../data/mockData';
import {
  formatDateTime,
  formatElapsed,
  formatINR,
} from '../lib/format';
import { activeSession, estimateCharge, findStation, useApp, vehicleOf } from '../store/AppContext';
import type { ChargingSession, PaymentMethod } from '../types';

const LOAD_FACTOR = 0.85;

function sessionProjection(session: ChargingSession, powerPrice: number, batteryKwh: number, now: number) {
  const hours = Math.max(0, (now - session.startedAt) / 3_600_000);
  const energyKwh = Math.round(session.powerKw * hours * LOAD_FACTOR * 10) / 10;
  const cost = Math.round(energyKwh * powerPrice);
  const soc = Math.min(
    100,
    Math.round((session.startPercent ?? 30) + (energyKwh / batteryKwh) * 100),
  );
  return { hours, energyKwh, cost, soc };
}

export default function Sessions() {
  const { state, startSession, endSession, processPayment } = useApp();
  const [now, setNow] = useState(() => Date.now());
  const [stationChoice, setStationChoice] = useState<string>('');
  const [endStage, setEndStage] = useState<'idle' | 'pay' | 'settled'>('idle');
  const [method, setMethod] = useState<PaymentMethod>('wallet');
  const [outcome, setOutcome] = useState<'success' | 'failure'>('success');
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [retry, setRetry] = useState<{ amount: number; description: string } | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  const session = activeSession(state);
  const vehicle = vehicleOf(state);

  // Tick only while a session is running; cleans up on unmount/state change.
  useEffect(() => {
    if (!session) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [session?.id]);

  const activeStation = findStation(state, session?.stationId);

  const projected = useMemo(() => {
    if (!session || !activeStation) return null;
    return sessionProjection(session, activeStation.pricePerKwh, vehicle.batteryKwh, now);
  }, [session, activeStation, vehicle.batteryKwh, now]);

  // Stations that can host a new simulated session
  const startable = state.stations.filter((s) => s.points.some((p) => p.status === 'available'));
  const upcomingToday = state.bookings.find(
    (b) =>
      b.status === 'upcoming' &&
      b.owner === 'me' &&
      new Date(b.date).toDateString() === new Date().toDateString(),
  );

  const defaultStation =
    (upcomingToday && startable.find((s) => s.id === upcomingToday.stationId)?.id) ||
    startable[0]?.id ||
    '';

  const chosenId = stationChoice || defaultStation;
  const chosenStation = findStation(state, chosenId);
  const chosenStats = chosenStation
    ? {
        available: chosenStation.points.filter((p) => p.status === 'available').length,
        faulty: chosenStation.points.filter((p) => p.status === 'faulty').length,
        total: chosenStation.points.length,
      }
    : null;

  const handleStart = () => {
    if (!chosenStation) {
      setStartError('Choose a station first.');
      return;
    }
    if (!chosenStats || chosenStats.available === 0) {
      setStartError('That station has no free charging points right now.');
      return;
    }
    setStartError(null);
    setEndStage('idle');
    setPayError(null);
    setRetry(null);
    const created = startSession(chosenStation.id, upcomingToday?.stationId === chosenStation.id ? upcomingToday.id : undefined);
    if (!created) {
      setStartError('Could not start a session — an active session may already exist.');
    }
  };

  const handleEnd = () => {
    if (!session || busy) return;
    setBusy(true);
    const cost = projected?.cost ?? 0;
    const res = endSession(session.id, {
      amount: cost,
      description: `Charging session · ${activeStation?.name ?? 'station'}`,
      type: 'payment',
      method,
      outcome,
    });
    setBusy(false);
    if (res.ok) {
      setPayError(null);
      setRetry(null);
      setEndStage('settled');
    } else {
      setPayError(res.error);
      setRetry({
        amount: cost,
        description: `Charging session · ${activeStation?.name ?? 'station'}`,
      });
      setEndStage('settled');
    }
  };

  const settleRetry = () => {
    if (!retry || busy) return;
    setBusy(true);
    const res = processPayment({
      amount: retry.amount,
      description: retry.description,
      type: 'payment',
      method,
      outcome,
    });
    setBusy(false);
    if (res.ok) {
      setRetry(null);
      setPayError(null);
    } else {
      setPayError(res.error);
    }
  };

  const completed = state.sessions.filter((s) => s.status === 'completed');

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Live view"
        title="Charging Sessions"
        subtitle="Start a simulated charging session, watch energy and cost accrue, then settle it from your demo wallet."
        actions={<SimulatedNotice />}
      />

      {/* Active session */}
      {session && activeStation && projected ? (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel overflow-hidden"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <StatusDot tone="ev" label="Session active" pulse />
              <Chip tone="warn">Simulated — no real equipment</Chip>
            </div>
            <span className="font-mono text-xs text-faint">{session.id.slice(-8).toUpperCase()}</span>
          </div>

          <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
            <div>
              <p className="label-caps">Charging at</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">{activeStation.name}</h2>
              <p className="mt-1 text-sm text-dim">
                {activeStation.address} · point{' '}
                {activeStation.points.find((p) => p.id === session.pointId)?.label ?? '—'}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { k: 'Elapsed', v: formatElapsed((now - session.startedAt) / 1000), icon: Timer },
                  {
                    k: 'Energy (est.)',
                    v: `${projected.energyKwh} kWh`,
                    icon: Zap,
                  },
                  { k: 'Cost (est.)', v: formatINR(projected.cost), icon: BatteryCharging },
                  {
                    k: 'Connector',
                    v: `${session.connector} · ${session.powerKw} kW`,
                    icon: Plug,
                  },
                ].map((s) => (
                  <div key={s.k} className="rounded-lg bg-raised px-3.5 py-2.5">
                    <p className="flex items-center gap-1.5 text-2xs uppercase tracking-wider text-faint">
                      <s.icon className="h-3 w-3" />
                      {s.k}
                    </p>
                    <p className="mt-1 text-base font-semibold text-ink">{s.v}</p>
                  </div>
                ))}
              </div>

              {/* Battery progress */}
              <div className="mt-5">
                <div className="flex items-end justify-between text-xs">
                  <span className="text-dim">
                    State of charge (estimated):{' '}
                    <span className="font-semibold text-ink">{projected.soc}%</span>
                  </span>
                  <span className="text-faint">Target {state.profile.chargeTargetPercent}%</span>
                </div>
                <div
                  className="mt-2 h-3 w-full overflow-hidden rounded-full bg-raised"
                  role="progressbar"
                  aria-valuenow={projected.soc}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Estimated battery charge"
                >
                  <motion.div
                    className="h-full rounded-full bg-ev"
                    animate={{ width: `${projected.soc}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <div
                  className="relative h-0"
                  style={{ left: `${state.profile.chargeTargetPercent}%` }}
                  aria-hidden
                >
                  <span className="absolute -top-[13px] -translate-x-1/2 text-2xs text-warn">▲</span>
                </div>
              </div>

              <p className="mt-3 flex items-start gap-2 text-2xs leading-relaxed text-faint">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Energy and cost are estimated from the charger's rated power × elapsed time ×{' '}
                {LOAD_FACTOR} efficiency factor, at {formatINR(activeStation.pricePerKwh)}/kWh.
                These controls do not operate real charging equipment.
              </p>
            </div>

            {/* End / pay panel */}
            <div className="rounded-xl border border-line bg-raised p-4">
              {endStage === 'idle' && (
                <>
                  <p className="label-caps">Finish session</p>
                  <p className="mt-1.5 text-xs text-dim">
                    Ending settles an estimated {formatINR(projected.cost)} for{' '}
                    {projected.energyKwh} kWh from your chosen demo payment method.
                  </p>

                  <div className="mt-3 flex flex-col gap-2">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMethod(m.id)}
                        aria-pressed={method === m.id}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${
                          method === m.id
                            ? 'border-ev bg-ev-soft'
                            : 'border-line bg-surface hover:border-line-strong'
                        }`}
                      >
                        <span className="text-xs font-medium text-ink">{m.label}</span>
                        <span className="text-2xs text-faint">{m.detail}</span>
                      </button>
                    ))}
                  </div>

                  <fieldset className="mt-3 rounded-lg border border-dashed border-line-strong px-3 py-2.5">
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
                          className={`flex-1 rounded-md border px-2 py-1 text-2xs font-medium transition-colors ${
                            outcome === o
                              ? o === 'success'
                                ? 'border-ev bg-ev-soft text-ev'
                                : 'border-danger bg-danger-soft text-danger'
                              : 'border-line text-dim'
                          }`}
                        >
                          Simulate {o}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <Button
                    className="mt-3 w-full"
                    size="md"
                    loading={busy}
                    onClick={handleEnd}
                    icon={<CircleStop className="h-4 w-4" />}
                  >
                    End session & settle
                  </Button>
                </>
              )}

              {endStage === 'settled' && (
                <>
                  {payError ? (
                    <Alert tone="danger" title="Session ended · payment unsettled">
                      {payError} The session itself was saved with its energy and cost.
                    </Alert>
                  ) : (
                    <Alert tone="ev" title="Session completed">
                      Energy delivered and payment were recorded. The charging point is available
                      again for other drivers.
                    </Alert>
                  )}

                  {payError && (
                    <div className="mt-3 flex flex-col gap-2">
                      <Button variant="primary" loading={busy} onClick={settleRetry}>
                        Retry payment ({formatINR(retry?.amount ?? 0)})
                      </Button>
                      <p className="text-2xs text-faint">
                        Choose UPI or card if your wallet balance is short — top up any time from
                        the Wallet page.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.section>
      ) : (
        /* ---------- Start a session ---------- */
        <section className="panel p-5" aria-label="Start a simulated session">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="label-caps">No active session</p>
              <h2 className="mt-1 text-base font-semibold text-ink">Start a simulated charge</h2>
              <p className="mt-1 text-sm text-dim">
                Pick a station with a free point. The timer, energy and cost accrue locally in your
                browser.
              </p>
            </div>
            <Chip tone="warn" icon={<Plug className="h-3 w-3" />}>
              Simulation only
            </Chip>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <Field
              label="Station"
              htmlFor="session-station"
              hint={
                chosenStats
                  ? `${chosenStats.available}/${chosenStats.total} points free${
                      chosenStats.faulty > 0 ? ` · ${chosenStats.faulty} faulty` : ''
                    }`
                  : 'Stations with at least one free point'
              }
            >
              <select
                id="session-station"
                className="input-base appearance-none pr-8"
                value={chosenId}
                onChange={(e) => {
                  setStationChoice(e.target.value);
                  setStartError(null);
                }}
              >
                {startable.length === 0 && <option value="">No station has a free point</option>}
                {startable.map((s) => {
                  const free = s.points.filter((p) => p.status === 'available').length;
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name} — {free} free
                    </option>
                  );
                })}
              </select>
            </Field>

            <Button
              size="lg"
              onClick={handleStart}
              disabled={startable.length === 0}
              icon={<Play className="h-4 w-4" />}
            >
              Start simulated session
            </Button>
          </div>

          {startError && (
            <div className="mt-3">
              <Alert tone="danger">{startError}</Alert>
            </div>
          )}

          {startable.length === 0 && (
            <div className="mt-3">
              <Alert tone="warn" title="All chargers are busy or faulty">
                No station currently has a free charging point. Change a charger's status from the
                operator demo, or reset demonstration data.
              </Alert>
            </div>
          )}

          <p className="mt-4 text-2xs text-faint">
            Est. session cost for your {vehicle.brand} {vehicle.model} ({vehicle.batteryKwh} kWh →{' '}
            {state.profile.chargeTargetPercent}%):{' '}
            {formatINR(estimateCharge(state, activeStation ?? state.stations[0]).cost)} at typical
            rates.
          </p>
        </section>
      )}

      {/* History */}
      <section className="panel overflow-hidden" aria-label="Session history">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="label-caps">Session history</p>
          <span className="text-2xs text-faint">{completed.length} completed</span>
        </div>

        {completed.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-medium text-ink">No sessions yet</p>
            <p className="mt-1 text-xs text-dim">
              Start a simulated charge above — completed sessions land here with their summary.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {completed.map((s) => {
              const station = state.stations.find((st) => st.id === s.stationId);
              const duration = s.endedAt ? (s.endedAt - s.startedAt) / 60000 : 0;
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ev-soft text-ev">
                    <Zap className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {station?.name ?? 'Station'}
                    </p>
                    <p className="text-2xs text-faint">
                      {formatDateTime(s.startedAt)} · {Math.round(duration)} min · {s.connector}{' '}
                      {s.powerKw} kW
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink">{s.energyKwh} kWh</p>
                    <p className="text-2xs text-faint">delivered</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ev">{formatINR(s.cost ?? 0)}</p>
                    <p className="text-2xs text-faint">
                      {s.paymentMethod
                        ? `paid · ${PAYMENT_METHODS.find((m) => m.id === s.paymentMethod)?.label ?? s.paymentMethod}`
                        : 'payment pending'}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <Link to="/explore">
          <Button variant="secondary" size="sm">
            Find another station
          </Button>
        </Link>
        <Link to="/wallet">
          <Button variant="ghost" size="sm">
            Open wallet
          </Button>
        </Link>
      </div>
    </div>
  );
}
