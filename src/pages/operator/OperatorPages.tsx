import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Edit3,
  Gauge,
  Plug,
  PlugZap,
  Save,
  Store,
  Wrench,
} from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Alert,
  Button,
  Chip,
  EmptyState,
  Field,
  Input,
  PageHeader,
  SimulatedNotice,
  StatTile,
  StatusDot,
} from '../../components/ui';
import { AREAS, CHARGER_STATUS_META } from '../../data/mockData';
import { formatDate, formatDateTime, formatINR, formatTime } from '../../lib/format';
import { stationRating, stationStats, useApp } from '../../store/AppContext';
import type { BookingStatus, ChargerStatus } from '../../types';

const COLORS = { ev: '#3DDC84', warn: '#FBBF24', danger: '#F05252', info: '#60A5FA', dim: '#6C7F77' };

function fleetTotals(state: ReturnType<typeof useApp>['state']) {
  let points = 0;
  let available = 0;
  let occupied = 0;
  let faulty = 0;
  for (const s of state.stations) {
    const st = stationStats(s);
    points += st.total;
    available += st.available;
    occupied += st.occupied;
    faulty += st.faulty;
  }
  const upcoming = state.bookings.filter((b) => b.status === 'upcoming').length;
  return { points, available, occupied, faulty, upcoming, stations: state.stations.length };
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 shadow-pop">
      <p className="text-xs font-semibold text-ink">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-2xs text-dim">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />{' '}
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export function OperatorOverview() {
  const { state } = useApp();
  const totals = fleetTotals(state);

  const chartData = state.stations.map((s) => {
    const st = stationStats(s);
    return {
      name: s.name.replace(/^ChargeFlow Hub · /, ''),
      area: AREAS.find((a) => a.id === s.areaId)?.name ?? '',
      Available: st.available,
      Occupied: st.occupied,
      Faulty: st.faulty,
      utilisation: st.utilisation,
    };
  });

  const faultyList = state.stations
    .flatMap((s) => s.points.filter((p) => p.status === 'faulty').map((p) => ({ station: s, point: p })))
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Operator console"
        title="Fleet overview"
        subtitle="Illustrative status of the demonstration charging network, computed directly from the shared local dataset."
        actions={<SimulatedNotice />}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Stations" value={totals.stations} sub="across Hyderabad" />
        <StatTile label="Charging points" value={totals.points} sub="network total" />
        <StatTile label="Available" value={totals.available} tone="ev" sub="free now" />
        <StatTile label="Occupied" value={totals.occupied} tone="warn" sub="in use" />
        <StatTile label="Faulty" value={totals.faulty} tone="danger" sub="needs attention" />
        <StatTile
          label="Reservations"
          value={totals.upcoming}
          sub="upcoming (all drivers)"
        />
      </div>

      <section className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label-caps">Charger status by station</p>
            <p className="mt-1 text-xs text-faint">
              Point counts derived from the same data drivers see · simulated
            </p>
          </div>
          <Chip tone="info" icon={<Gauge className="h-3 w-3" />}>
            Illustrative utilisation
          </Chip>
        </div>

        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2B26" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#6C7F77', fontSize: 10 }}
                interval={0}
                angle={-18}
                textAnchor="end"
                height={54}
              />
              <YAxis tick={{ fill: '#6C7F77', fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(234,242,238,0.04)' }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9DB0A7' }} />
              <Bar dataKey="Available" stackId="a" fill={COLORS.ev} radius={[0, 0, 0, 0]} />
              <Bar dataKey="Occupied" stackId="a" fill={COLORS.warn} />
              <Bar dataKey="Faulty" stackId="a" fill={COLORS.danger} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="panel p-5">
          <div className="flex items-center justify-between">
            <p className="label-caps">Points needing attention</p>
            <Chip tone={faultyList.length ? 'danger' : 'ev'}>
              {faultyList.length ? `${totals.faulty} faulty network-wide` : 'All healthy'}
            </Chip>
          </div>
          {faultyList.length === 0 ? (
            <p className="mt-4 text-sm text-dim">No faulty chargers in the dataset. Nice.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {faultyList.map(({ station, point }) => (
                <li
                  key={point.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-raised px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-ink">
                      {point.label} · {point.connector} {point.powerKw} kW
                    </p>
                    <p className="truncate text-2xs text-faint">{station.name}</p>
                  </div>
                  <StatusDot tone="danger" label="Faulty" />
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-2xs text-faint">
            Restore chargers from the Charger Status console — drivers see the change instantly.
          </p>
        </section>

        <section className="panel p-5">
          <p className="label-caps">Upcoming reservations</p>
          <ul className="mt-3 space-y-2">
            {state.bookings
              .filter((b) => b.status === 'upcoming')
              .slice(0, 5)
              .map((b) => {
                const s = state.stations.find((st) => st.id === b.stationId);
                return (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-raised px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-ink">{s?.name ?? 'Station'}</p>
                      <p className="text-2xs text-faint">
                        {b.ref} · {b.driverName} · {formatDate(b.date)} {formatTime(b.time)}
                      </p>
                    </div>
                    <Chip tone="ev">{b.owner === 'me' ? 'Demo driver' : 'Guest'}</Chip>
                  </li>
                );
              })}
            {state.bookings.filter((b) => b.status === 'upcoming').length === 0 && (
              <li className="rounded-lg bg-raised px-3.5 py-3 text-xs text-faint">
                No upcoming reservations.
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Station management
// ---------------------------------------------------------------------------

export function OperatorStations() {
  const { state, updateStation } = useApp();
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: string; address: string; price: string } | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const open = (id: string, name: string, address: string, price: number) => {
    setOpenId(id);
    setDraft({ name, address, price: String(price) });
    setSavedId(null);
  };

  const save = (id: string) => {
    if (!draft) return;
    const price = Number(draft.price);
    if (!draft.name.trim()) return;
    if (!Number.isFinite(price) || price < 1 || price > 50) return;
    updateStation(id, {
      name: draft.name.trim(),
      address: draft.address.trim(),
      pricePerKwh: Math.round(price * 100) / 100,
    });
    setSavedId(id);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Operations"
        title="Station management"
        subtitle="Inspect stations, review charger counts and edit illustrative pricing or labels. Changes flow straight into the driver app."
        actions={<SimulatedNotice />}
      />

      <ul className="flex flex-col gap-3">
        {state.stations.map((s) => {
          const st = stationStats(s);
          const rating = stationRating(s, state.reviews);
          const isOpen = openId === s.id;
          const area = AREAS.find((a) => a.id === s.areaId);

          return (
            <li key={s.id} className="panel overflow-hidden">
              <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-info-soft text-info">
                  <Store className="h-4.5 w-4.5" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{s.name}</p>
                    <Chip tone="neutral">{area?.name}</Chip>
                    <Chip tone="info">{s.speedTier} · {s.maxPowerKw} kW</Chip>
                  </div>
                  <p className="mt-0.5 text-xs text-faint">
                    {s.address} · {formatINR(s.pricePerKwh)}/kWh · rating {rating.value} (
                    {rating.count}) · {s.connectors.join(', ')}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3 text-xs">
                    <StatusDot tone="ev" label={`${st.available} free`} />
                    <StatusDot tone="warn" label={`${st.occupied} busy`} />
                    <StatusDot tone="danger" label={`${st.faulty} faulty`} />
                  </div>
                  <Button
                    size="sm"
                    variant={isOpen ? 'secondary' : 'outline'}
                    onClick={() =>
                      isOpen
                        ? (setOpenId(null), setDraft(null))
                        : open(s.id, s.name, s.address, s.pricePerKwh)
                    }
                    icon={<Edit3 className="h-3.5 w-3.5" />}
                  >
                    {isOpen ? 'Close' : 'Inspect / edit'}
                  </Button>
                </div>
              </div>

              {isOpen && draft && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="overflow-hidden border-t border-line bg-raised/40"
                >
                  <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="flex flex-col gap-3">
                      <Field label="Station name" htmlFor={`name-${s.id}`}>
                        <Input
                          id={`name-${s.id}`}
                          value={draft.name}
                          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        />
                      </Field>
                      <Field label="Address" htmlFor={`addr-${s.id}`}>
                        <Input
                          id={`addr-${s.id}`}
                          value={draft.address}
                          onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                        />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Price per kWh (₹)" htmlFor={`price-${s.id}`}>
                          <Input
                            id={`price-${s.id}`}
                            type="number"
                            min={1}
                            max={50}
                            step={0.1}
                            value={draft.price}
                            onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                          />
                        </Field>
                        <div className="flex items-end gap-2">
                          <Button
                            size="md"
                            onClick={() => save(s.id)}
                            icon={<Save className="h-4 w-4" />}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                      {savedId === s.id && (
                        <Alert tone="ev" title="Station updated">
                          Drivers now see the new label and pricing across the app.
                        </Alert>
                      )}
                    </div>

                    <div>
                      <p className="label-caps">Charging points ({st.total})</p>
                      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                        {s.points.map((p) => (
                          <li
                            key={p.id}
                            className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2"
                          >
                            <span className="text-2xs text-dim">
                              {p.label} · {p.connector} · {p.powerKw} kW
                            </span>
                            <Chip
                              tone={
                                CHARGER_STATUS_META[p.status].tone === 'ev'
                                  ? 'ev'
                                  : CHARGER_STATUS_META[p.status].tone === 'warn'
                                    ? 'warn'
                                    : 'danger'
                              }
                            >
                              {CHARGER_STATUS_META[p.status].label}
                            </Chip>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Charger status management
// ---------------------------------------------------------------------------

export function OperatorChargers() {
  const { state, setPointStatus } = useApp();
  const [busyPoint, setBusyPoint] = useState<string | null>(null);

  const change = (stationId: string, pointId: string, status: ChargerStatus) => {
    setBusyPoint(pointId);
    setPointStatus(stationId, pointId, status);
    window.setTimeout(() => setBusyPoint(null), 250);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Operations"
        title="Charger status"
        subtitle="Move individual charging points between available, occupied and faulty. Simulate a fault or restore one — counts stay consistent everywhere."
        actions={<SimulatedNotice />}
      />

      <Alert tone="info" title="How status changes propagate">
        Every point toggle writes to the shared local dataset, so the driver explorer, dashboard and
        maps immediately reflect the new availability. Fault simulations also generate a driver
        notification.
      </Alert>

      <div className="grid gap-4 xl:grid-cols-2">
        {state.stations.map((s) => {
          const st = stationStats(s);
          const area = AREAS.find((a) => a.id === s.areaId);
          return (
            <section key={s.id} className="panel overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{s.name}</p>
                  <p className="text-2xs text-faint">{area?.name}</p>
                </div>
                <div className="flex items-center gap-3 text-2xs">
                  <StatusDot tone="ev" label={`${st.available}`} />
                  <StatusDot tone="warn" label={`${st.occupied}`} />
                  <StatusDot tone="danger" label={`${st.faulty}`} />
                  <span className="text-faint">/ {st.total}</span>
                </div>
              </div>

              <ul className="grid gap-2 p-3 sm:grid-cols-2">
                {s.points.map((p) => {
                  const meta = CHARGER_STATUS_META[p.status];
                  const tone = meta.tone === 'ev' ? 'ev' : meta.tone === 'warn' ? 'warn' : 'danger';
                  return (
                    <li key={p.id} className="rounded-lg border border-line bg-raised px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-ink">
                          {p.label} · {p.connector}
                        </span>
                        <Chip tone={tone}>{meta.label}</Chip>
                      </div>
                      <p className="mt-0.5 text-2xs text-faint">{p.powerKw} kW</p>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {p.status !== 'available' && (
                          <button
                            type="button"
                            disabled={busyPoint === p.id}
                            onClick={() => change(s.id, p.id, 'available')}
                            className="rounded-md border border-ev/40 bg-ev-soft px-2 py-1 text-2xs font-medium text-ev transition-colors hover:bg-ev hover:text-void disabled:opacity-50"
                          >
                            {p.status === 'faulty' ? 'Restore' : 'Mark available'}
                          </button>
                        )}
                        {p.status === 'available' && (
                          <button
                            type="button"
                            disabled={busyPoint === p.id}
                            onClick={() => change(s.id, p.id, 'occupied')}
                            className="rounded-md border border-warn/40 bg-warn-soft px-2 py-1 text-2xs font-medium text-warn transition-colors hover:bg-warn hover:text-void disabled:opacity-50"
                          >
                            Mark occupied
                          </button>
                        )}
                        {p.status !== 'faulty' && (
                          <button
                            type="button"
                            disabled={busyPoint === p.id}
                            onClick={() => change(s.id, p.id, 'faulty')}
                            className="rounded-md border border-danger/40 bg-danger-soft px-2 py-1 text-2xs font-medium text-danger transition-colors hover:bg-danger hover:text-void disabled:opacity-50"
                          >
                            Simulate fault
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {st.faulty > 0 && (
                <div className="flex items-center gap-2 border-t border-line px-4 py-2.5 text-2xs text-warn">
                  <Wrench className="h-3.5 w-3.5" />
                  {st.faulty} charger{st.faulty > 1 ? 's' : ''} under maintenance at this station
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Booking management
// ---------------------------------------------------------------------------

const BOOKING_STATUS_META: Record<BookingStatus, { tone: 'ev' | 'info' | 'danger'; label: string }> = {
  upcoming: { tone: 'ev', label: 'Upcoming' },
  completed: { tone: 'info', label: 'Completed' },
  cancelled: { tone: 'danger', label: 'Cancelled' },
};

export function OperatorBookings() {
  const { state } = useApp();
  const [filter, setFilter] = useState<'all' | BookingStatus>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = state.bookings.filter((b) => filter === 'all' || b.status === filter);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Operations"
        title="Reservations"
        subtitle="All reservations in the demo dataset — across the demo driver and other simulated drivers."
        actions={<SimulatedNotice />}
      />

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter reservations">
        {(['all', 'upcoming', 'completed', 'cancelled'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors ${
              filter === f ? 'border-info bg-info-soft text-info' : 'border-line bg-surface text-dim hover:text-ink'
            }`}
          >
            {f}
            <span className="ml-1.5 text-2xs text-faint">
              {f === 'all' ? state.bookings.length : state.bookings.filter((b) => b.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="h-5 w-5" />}
          title="No reservations match"
          description="Change the filter to see other reservations in the demonstration dataset."
        />
      ) : (
        <section className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-2xs uppercase tracking-wider text-faint">
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 font-semibold">Station</th>
                  <th className="px-4 py-3 font-semibold">Driver</th>
                  <th className="px-4 py-3 font-semibold">Slot</th>
                  <th className="px-4 py-3 font-semibold">Est. cost</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((b) => {
                  const s = state.stations.find((st) => st.id === b.stationId);
                  const meta = BOOKING_STATUS_META[b.status];
                  const isOpen = openId === b.id;
                  return (
                    <Fragment key={b.id}>
                      <tr className="transition-colors hover:bg-raised/50">
                        <td className="px-4 py-3 font-mono text-xs text-ev">{b.ref}</td>
                        <td className="px-4 py-3 text-xs text-ink">{s?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-dim">{b.driverName}</td>
                        <td className="px-4 py-3 text-xs text-dim">
                          {formatDate(b.date)} · {formatTime(b.time)}
                        </td>
                        <td className="px-4 py-3 text-xs text-ink">{formatINR(b.estimatedCost)}</td>
                        <td className="px-4 py-3">
                          <Chip tone={meta.tone}>{meta.label}</Chip>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setOpenId(isOpen ? null : b.id)}
                          >
                            {isOpen ? 'Hide' : 'Inspect'}
                          </Button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-raised/40">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="grid gap-3 sm:grid-cols-4">
                              <div className="rounded-lg bg-surface px-3 py-2.5">
                                <p className="text-2xs uppercase tracking-wider text-faint">Created</p>
                                <p className="mt-0.5 text-xs text-ink">{formatDateTime(b.createdAt)}</p>
                              </div>
                              <div className="rounded-lg bg-surface px-3 py-2.5">
                                <p className="text-2xs uppercase tracking-wider text-faint">
                                  Estimated energy
                                </p>
                                <p className="mt-0.5 text-xs text-ink">{b.estimatedKwh} kWh</p>
                              </div>
                              <div className="rounded-lg bg-surface px-3 py-2.5">
                                <p className="text-2xs uppercase tracking-wider text-faint">Slot window</p>
                                <p className="mt-0.5 text-xs text-ink">
                                  {b.slotMinutes} min · {formatTime(b.time)} onwards
                                </p>
                              </div>
                              <div className="rounded-lg bg-surface px-3 py-2.5">
                                <p className="text-2xs uppercase tracking-wider text-faint">
                                  Lifecycle
                                </p>
                                <p className="mt-0.5 text-xs text-ink">
                                  {b.cancelledAt
                                    ? `Cancelled ${formatDateTime(b.cancelledAt)}`
                                    : b.completedAt
                                      ? `Completed ${formatDateTime(b.completedAt)}`
                                      : 'Active reservation'}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Performance
// ---------------------------------------------------------------------------

export function OperatorPerformance() {
  const { state } = useApp();
  const totals = fleetTotals(state);

  const revenue = state.transactions
    .filter((t) => t.status === 'successful' && t.amount < 0)
    .reduce((a, t) => a + Math.abs(t.amount), 0);

  const completedSessions = state.sessions.filter((s) => s.status === 'completed');
  const avgSessionKwh =
    completedSessions.length === 0
      ? 0
      : Math.round(
          (completedSessions.reduce((a, s) => a + (s.energyKwh ?? 0), 0) /
            completedSessions.length) *
            10,
        ) / 10;

  const ratings = state.stations
    .map((s) => {
      const r = stationRating(s, state.reviews);
      return { name: s.name.replace(/^ChargeFlow Hub · /, ''), rating: r.value, count: r.count };
    })
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);

  const connectorMix = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of state.stations) {
      for (const p of s.points) counts.set(p.connector, (counts.get(p.connector) ?? 0) + 1);
    }
    const palette = [COLORS.ev, COLORS.info, COLORS.warn, COLORS.danger, COLORS.dim];
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, fill: palette[i % palette.length] }));
  }, [state.stations]);

  const utilisation = state.stations
    .map((s) => {
      const st = stationStats(s);
      return {
        name: AREAS.find((a) => a.id === s.areaId)?.name ?? s.name,
        utilisation: st.utilisation,
        points: st.total,
      };
    })
    .sort((a, b) => b.utilisation - a.utilisation);

  const avgRating =
    state.stations.reduce((a, s) => a + stationRating(s, state.reviews).value, 0) /
    Math.max(1, state.stations.length);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Analytics"
        title="Performance"
        subtitle="Statistics calculated from the mock dataset — station ratings, utilisation, charger mix and simulated revenue."
        actions={<SimulatedNotice />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile
          label="Network utilisation"
          value={`${Math.round((totals.occupied / Math.max(1, totals.points)) * 100)}%`}
          sub="occupied points"
        />
        <StatTile label="Average rating" value={avgRating.toFixed(1)} sub="across all stations" />
        <StatTile label="Completed sessions" value={completedSessions.length} sub="demo dataset" />
        <StatTile label="Avg session size" value={`${avgSessionKwh} kWh`} sub="per completed session" />
        <StatTile
          label="Simulated revenue"
          value={formatINR(revenue)}
          tone="ev"
          sub="successful charging payments"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="panel p-5">
          <p className="label-caps">Station utilisation (occupied / total points)</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilisation} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2B26" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6C7F77', fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={92}
                  tick={{ fill: '#6C7F77', fontSize: 11 }}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(234,242,238,0.04)' }} />
                <Bar dataKey="utilisation" name="Utilisation %" fill={COLORS.ev} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="flex flex-col gap-5">
          <section className="panel p-5">
            <p className="label-caps">Charger mix by connector type</p>
            <div className="mt-3 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={connectorMix}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={82}
                    paddingAngle={3}
                  >
                    {connectorMix.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#9DB0A7' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="panel p-5">
            <p className="label-caps">Highest rated stations</p>
            <ul className="mt-3 space-y-2">
              {ratings.map((r, i) => (
                <li key={r.name} className="flex items-center gap-3">
                  <span className="w-5 text-2xs font-bold text-faint">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-xs text-ink">{r.name}</span>
                  <span className="text-xs font-semibold text-warn">{r.rating.toFixed(1)}</span>
                  <span className="text-2xs text-faint">({r.count})</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
