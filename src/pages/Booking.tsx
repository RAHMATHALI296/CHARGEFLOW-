import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Info,
  MapPin,
  Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Chip,
  Field,
  SimulatedNotice,
  StatusDot,
} from '../components/ui';
import { SLOT_TIMES, SLOT_MINUTES, SPEED_TIER_META, AREAS } from '../data/mockData';
import { formatDate, formatDistance, formatINR, formatTime } from '../lib/format';
import { slotAvailability, slotDates, SLOT_REASON_TEXT, slotStart } from '../lib/slots';
import {
  estimateCharge,
  findStation,
  stationStats,
  useApp,
  vehicleOf,
  type CreateBookingResult,
} from '../store/AppContext';
import type { Booking as BookingModel } from '../types';

type Step = 'select' | 'review' | 'done';

export default function BookingPage() {
  const { stationId } = useParams<{ stationId: string }>();
  const navigate = useNavigate();
  const { state, createBooking } = useApp();

  const station = findStation(state, stationId);
  const dates = useMemo(() => slotDates(3), []);

  const [date, setDate] = useState(dates[0]?.iso ?? '');
  const [time, setTime] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('select');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState<BookingModel | null>(null);

  if (!station) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="panel p-8">
          <MapPin className="mx-auto h-8 w-8 text-faint" />
          <h1 className="mt-4 text-lg font-semibold text-ink">Station not found</h1>
          <p className="mt-2 text-sm text-dim">
            This booking link refers to a station that no longer exists in the demo dataset.
          </p>
          <Link to="/explore" className="mt-5 inline-block">
            <Button variant="secondary">Back to Explore</Button>
          </Link>
        </div>
      </div>
    );
  }

  const stats = stationStats(station);
  const vehicle = vehicleOf(state);
  const estimate = estimateCharge(state, station);
  const area = AREAS.find((a) => a.id === station.areaId);
  const areaName = area?.name ?? '';

  const stationUsable = stats.available > 0 || stats.occupied > 0;

  const selectedDateMeta = dates.find((d) => d.iso === date);
  const costAtStation = estimate.kwh * station.pricePerKwh;

  const goReview = () => {
    if (!time) {
      setError('Select an available time slot to continue.');
      return;
    }
    const av = slotAvailability(station.id, date, time, state.bookings, stationUsable);
    if (!av.available) {
      setError(
        `That slot is no longer available: ${SLOT_REASON_TEXT[av.reason].toLowerCase()}. Pick another.`,
      );
      setStep('select');
      return;
    }
    setError(null);
    setStep('review');
  };

  const confirm = () => {
    if (!time || busy) return;
    setBusy(true);
    const res: CreateBookingResult = createBooking({ stationId: station.id, date, time });
    setBusy(false);
    if (res.ok) {
      setConfirmed(res.booking);
      setError(null);
      setStep('done');
    } else {
      setError(res.error);
      setStep('select');
      setTime(null);
    }
  };

  // ---- Step 3: confirmation --------------------------------------------
  if (step === 'done' && confirmed) {
    return (
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel overflow-hidden"
        >
          <div className="border-b border-line bg-ev-soft px-6 py-5 text-center">
            <CheckCircle2 className="mx-auto h-9 w-9 text-ev" />
            <h1 className="mt-3 text-xl font-semibold text-ink">Booking confirmed</h1>
            <p className="mt-1 text-sm text-dim">
              Your slot is reserved and no one else can book it while it is active.
            </p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between rounded-xl border border-line bg-raised px-4 py-3.5">
              <span className="text-xs uppercase tracking-wider text-faint">Booking reference</span>
              <span className="font-mono text-base font-semibold text-ev">{confirmed.ref}</span>
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { k: 'Station', v: station.name },
                { k: 'Neighbourhood', v: areaName },
                { k: 'Date', v: formatDate(confirmed.date) },
                { k: 'Time', v: `${formatTime(confirmed.time)} · ${SLOT_MINUTES} min` },
                {
                  k: 'Estimated energy',
                  v: `${confirmed.estimatedKwh} kWh (${estimate.from}% → ${estimate.target}%)`,
                },
                { k: 'Estimated cost', v: formatINR(confirmed.estimatedCost) },
              ].map((row) => (
                <div key={row.k} className="rounded-lg bg-raised px-3.5 py-2.5">
                  <dt className="text-2xs uppercase tracking-wider text-faint">{row.k}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-ink">{row.v}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-4 rounded-lg border border-dashed border-line-strong px-3.5 py-3 text-2xs leading-relaxed text-faint">
              Reservation only — no payment is taken now. Settle after charging from your demo
              wallet. This prototype does not contact any real charging network.
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1"
                onClick={() => navigate('/bookings')}
                icon={<CalendarCheck className="h-4 w-4" />}
              >
                View my bookings
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setStep('select');
                  setConfirmed(null);
                  setTime(null);
                }}
              >
                Book another slot
              </Button>
            </div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Link to={`/explore?station=${station.id}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  Back to station
                </Button>
              </Link>
              <Link to="/dashboard" className="flex-1">
                <Button variant="ghost" className="w-full">
                  Go to dashboard
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ---- Step 2: review ----------------------------------------------------
  if (step === 'review' && time) {
    return (
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() => setStep('select')}
          className="mb-4 inline-flex items-center gap-2 text-sm text-dim hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Change slot
        </button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="panel">
          <div className="border-b border-line px-6 py-4">
            <p className="label-caps">Step 2 of 2 · Review</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">
              Confirm your reservation
            </h1>
          </div>

          <div className="space-y-4 p-6">
            <div className="rounded-xl border border-line bg-raised p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{station.name}</p>
                  <p className="mt-0.5 text-xs text-faint">{station.address}</p>
                </div>
                <Chip tone="neutral">{SPEED_TIER_META[station.speedTier].label}</Chip>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <span className="flex items-center gap-1.5 text-ink">
                  <CalendarDays className="h-4 w-4 text-ev" />
                  {formatDate(date)}
                </span>
                <span className="flex items-center gap-1.5 text-ink">
                  <Clock className="h-4 w-4 text-ev" />
                  {formatTime(time)} –{' '}
                  {formatTime(
                    (() => {
                      const [h, m] = time.split(':').map(Number);
                      const d = new Date();
                      d.setHours(h, m + SLOT_MINUTES, 0, 0);
                      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                    })(),
                  )}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-line px-4 py-3">
                <p className="text-2xs uppercase tracking-wider text-faint">Vehicle</p>
                <p className="mt-1 text-sm font-medium text-ink">
                  {vehicle.brand} {vehicle.model}
                </p>
                <p className="text-2xs text-faint">
                  {vehicle.batteryKwh} kWh battery · target {estimate.target}%
                </p>
              </div>
              <div className="rounded-lg border border-line px-4 py-3">
                <p className="text-2xs uppercase tracking-wider text-faint">Availability now</p>
                <div className="mt-1.5">
                  <StatusDot
                    tone={stats.available > 0 ? 'ev' : 'warn'}
                    label={`${stats.available} free · ${stats.occupied} busy · ${stats.faulty} faulty`}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-ev/30 bg-ev-soft px-4 py-3.5">
              <p className="label-caps text-ev/80">Estimated charging cost</p>
              <div className="mt-1 flex items-end justify-between">
                <p className="text-2xl font-semibold text-ev">{formatINR(estimate.cost)}</p>
                <p className="text-right text-2xs text-dim">
                  {estimate.kwh} kWh × {formatINR(station.pricePerKwh)}/kWh
                  <br />
                  {estimate.from}% → {estimate.target}% of {vehicle.batteryKwh} kWh
                </p>
              </div>
              <p className="mt-2 text-2xs text-faint">
                Estimate only — actual consumption varies with speed, temperature and charger
                behaviour. Nothing is charged now.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-raised px-4 py-3 text-sm">
              <span className="flex items-center gap-2 text-dim">
                <Wallet className="h-4 w-4" />
                Wallet balance after charging (if paid from wallet)
              </span>
              <span className="font-semibold text-ink">
                {formatINR(Math.max(0, state.walletBalance - estimate.cost))}
              </span>
            </div>

            {error && <Alert tone="danger">{error}</Alert>}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button size="lg" className="flex-1" onClick={confirm} loading={busy}>
                Confirm reservation
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => setStep('select')}
                disabled={busy}
              >
                Back
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ---- Step 1: slot selection -------------------------------------------
  return (
    <div className="mx-auto max-w-3xl">
      <button
        type="button"
        onClick={() => navigate(`/explore?station=${station.id}`)}
        className="mb-4 inline-flex items-center gap-2 text-sm text-dim hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to station details
      </button>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label-caps">Step 1 of 2 · Choose a slot</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">
            Book a slot at {station.name}
          </h1>
          <p className="mt-1 text-sm text-dim">
            {station.address} · {formatDistance(station.distanceKm)} away ·{' '}
            {formatINR(station.pricePerKwh)}/kWh
          </p>
        </div>
        <SimulatedNotice />
      </div>

      {/* Station summary strip */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            ['Free points', `${stats.available}/${stats.total}`, 'text-ev'],
            ['Occupied', String(stats.occupied), 'text-warn'],
            ['Faulty', String(stats.faulty), 'text-danger'],
            ['Est. wait', stats.waitMinutes === 0 ? 'None' : `${stats.waitMinutes} min`, 'text-ink'],
          ] as const
        ).map(([k, v, cls]) => (
          <div key={k} className="panel px-3.5 py-2.5">
            <p className="text-2xs uppercase tracking-wider text-faint">{k}</p>
            <p className={`mt-0.5 text-lg font-semibold ${cls}`}>{v}</p>
          </div>
        ))}
      </div>

      {/* Date tabs */}
      <div className="mt-5 flex gap-2" role="tablist" aria-label="Booking date">
        {dates.map((d) => (
          <button
            key={d.iso}
            type="button"
            role="tab"
            aria-selected={date === d.iso}
            onClick={() => {
              setDate(d.iso);
              setTime(null);
              setError(null);
            }}
            className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
              date === d.iso
                ? 'border-ev bg-ev-soft text-ev'
                : 'border-line bg-surface text-dim hover:border-line-strong hover:text-ink'
            }`}
          >
            {d.label}
            <span className="block text-2xs font-normal text-faint">{formatDate(d.iso)}</span>
          </button>
        ))}
      </div>

      {/* Slot grid */}
      <section className="panel mt-4 p-5" aria-label="Available time slots">
        <div className="flex items-center justify-between">
          <p className="label-caps">Time slots · {SLOT_MINUTES} minutes each</p>
          <span className="text-2xs text-faint">tap an open slot</span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {SLOT_TIMES.map((t) => {
            const av = slotAvailability(station.id, date, t, state.bookings, stationUsable);
            const isChosen = time === t;
            const startLabel = formatTime(t);

            if (!av.available) {
              return (
                <div
                  key={t}
                  className="cursor-not-allowed rounded-lg border border-dashed border-line bg-raised/60 px-3 py-2.5 opacity-70"
                  title={SLOT_REASON_TEXT[av.reason]}
                >
                  <p className="text-sm font-medium text-faint line-through">{startLabel}</p>
                  <p className="mt-0.5 text-2xs text-faint">{SLOT_REASON_TEXT[av.reason]}</p>
                </div>
              );
            }

            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTime(t);
                  setError(null);
                }}
                aria-pressed={isChosen}
                className={`rounded-lg border px-3 py-2.5 text-left transition-all ${
                  isChosen
                    ? 'border-ev bg-ev-soft ring-2 ring-ev/30'
                    : 'border-line bg-raised hover:border-ev/50 hover:bg-surface'
                }`}
              >
                <p className={`text-sm font-medium ${isChosen ? 'text-ev' : 'text-ink'}`}>
                  {startLabel}
                </p>
                <p className="mt-0.5 text-2xs text-faint">Available</p>
              </button>
            );
          })}
        </div>

        <p className="mt-4 flex items-start gap-2 text-2xs leading-relaxed text-faint">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Slots marked reserved belong to other demo bookings, passed slots can no longer be
          started, and stations with every charger faulty cannot accept reservations.
        </p>
      </section>

      {error && (
        <div className="mt-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      {/* Selected summary + CTA */}
      <div className="panel mt-4 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="label-caps">Your selection</p>
          <p className="mt-1 text-sm font-medium text-ink">
            {selectedDateMeta?.label ?? formatDate(date)}
            {time ? ` · ${formatTime(time)}` : ' · no slot chosen'}
          </p>
          <p className="mt-0.5 text-xs text-faint">
            Est. {estimate.kwh} kWh · {formatINR(Math.round(costAtStation))} · free to reserve
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="lg" onClick={goReview} disabled={!time} icon={<ArrowRight className="h-4 w-4" />}>
            Review booking
          </Button>
        </div>
      </div>

      {/* Quick jump back to explorer */}
      <div className="mt-4">
        <Link
          to={`/explore?station=${station.id}`}
          className="text-xs text-dim hover:text-ev"
        >
          ← Compare with other stations in the explorer
        </Link>
      </div>
    </div>
  );
}
