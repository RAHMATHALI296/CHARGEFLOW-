import { CalendarCheck, CalendarX2, CheckCircle2, ChevronDown, MapPin, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Chip,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  SimulatedNotice,
} from '../components/ui';
import { SLOT_MINUTES } from '../data/mockData';
import { formatDate, formatDateTime, formatINR, formatTime } from '../lib/format';
import { myBookings, stationStats, useApp } from '../store/AppContext';
import type { Booking, BookingStatus } from '../types';

const TABS: { id: BookingStatus; label: string; icon: typeof CheckCircle2 }[] = [
  { id: 'upcoming', label: 'Upcoming', icon: CalendarCheck },
  { id: 'completed', label: 'Past', icon: CheckCircle2 },
  { id: 'cancelled', label: 'Cancelled', icon: CalendarX2 },
];

const STATUS_CHIP: Record<BookingStatus, { tone: 'ev' | 'info' | 'danger'; label: string }> = {
  upcoming: { tone: 'ev', label: 'Upcoming' },
  completed: { tone: 'info', label: 'Completed' },
  cancelled: { tone: 'danger', label: 'Cancelled' },
};

export default function Bookings() {
  const { state, cancelBooking } = useApp();
  const bookings = useMemo(
    () =>
      myBookings(state).sort((a, b) =>
        `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`),
      ),
    [state],
  );

  const [tab, setTab] = useState<BookingStatus>('upcoming');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<Booking | null>(null);

  const counts: Record<BookingStatus, number> = {
    upcoming: bookings.filter((b) => b.status === 'upcoming').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  };

  const visible = bookings.filter((b) => b.status === tab);

  const stationOf = (b: Booking) => state.stations.find((s) => s.id === b.stationId) ?? null;

  const emptyCopy: Record<BookingStatus, { title: string; body: string }> = {
    upcoming: {
      title: 'No upcoming reservations',
      body: 'Reserve an open slot at any station and it will appear here with its reference, date and estimated cost.',
    },
    completed: {
      title: 'No past sessions yet',
      body: 'Reservations you complete after a charging session are archived here for reference.',
    },
    cancelled: {
      title: 'Nothing cancelled',
      body: 'Cancelled reservations stay here as a record — released slots return to the explorer immediately.',
    },
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Reservations"
        title="My Bookings"
        subtitle="Every reservation you make in this prototype — with its status, reference and estimated cost."
        actions={<SimulatedNotice />}
      />

      {/* Tabs */}
      <div className="flex gap-2" role="tablist" aria-label="Booking status">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'border-ev bg-ev-soft text-ev'
                  : 'border-line bg-surface text-dim hover:border-line-strong hover:text-ink'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              <span
                className={`rounded-full px-1.5 text-2xs font-bold ${
                  active ? 'bg-ev text-void' : 'bg-raised text-faint'
                }`}
              >
                {counts[t.id]}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="h-5 w-5" />}
          title={emptyCopy[tab].title}
          description={emptyCopy[tab].body}
          action={
            <Link to="/explore">
              <Button size="sm" variant="secondary">
                Explore stations
              </Button>
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((b) => {
            const station = stationOf(b);
            const status = STATUS_CHIP[b.status];
            const isExpanded = expanded === b.id;
            const stats = station ? stationStats(station) : null;

            return (
              <li key={b.id} className="panel overflow-hidden">
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3.5">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        b.status === 'upcoming'
                          ? 'bg-ev-soft text-ev'
                          : b.status === 'completed'
                            ? 'bg-info-soft text-info'
                            : 'bg-danger-soft text-danger'
                      }`}
                    >
                      {b.status === 'upcoming' ? (
                        <CalendarCheck className="h-5 w-5" />
                      ) : b.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <CalendarX2 className="h-5 w-5" />
                      )}
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-ink">
                          {station?.name ?? 'Station unavailable'}
                        </p>
                        <Chip tone={status.tone}>{status.label}</Chip>
                        <span className="font-mono text-2xs text-faint">{b.ref}</span>
                      </div>
                      <p className="mt-1 text-sm text-dim">
                        {formatDate(b.date)} · {formatTime(b.time)} · {SLOT_MINUTES} min
                      </p>
                      <p className="mt-0.5 text-xs text-faint">
                        Est. {b.estimatedKwh} kWh · {formatINR(b.estimatedCost)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setExpanded(isExpanded ? null : b.id)}
                      aria-expanded={isExpanded}
                    >
                      Details
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </Button>

                    {b.status === 'upcoming' && (
                      <Button size="sm" variant="danger" onClick={() => setCancelling(b)}>
                        Cancel
                      </Button>
                    )}
                    {b.status === 'completed' && (
                      <Link to={`/explore?station=${b.stationId}`}>
                        <Button size="sm" variant="secondary" icon={<Star className="h-3.5 w-3.5" />}>
                          Rate station
                        </Button>
                      </Link>
                    )}
                    {b.status === 'cancelled' && station && (
                      <Link to={`/book/${station.id}`}>
                        <Button size="sm" variant="secondary">
                          Book again
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-line bg-raised/50 px-4 py-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-lg bg-surface px-3 py-2.5">
                        <p className="text-2xs uppercase tracking-wider text-faint">Station</p>
                        <p className="mt-0.5 truncate text-xs font-medium text-ink">
                          {station?.name ?? '—'}
                        </p>
                        <p className="text-2xs text-faint">{station?.address}</p>
                      </div>
                      <div className="rounded-lg bg-surface px-3 py-2.5">
                        <p className="text-2xs uppercase tracking-wider text-faint">Booked for</p>
                        <p className="mt-0.5 text-xs font-medium text-ink">
                          {formatDate(b.date)}
                        </p>
                        <p className="text-2xs text-faint">
                          {formatTime(b.time)} · {b.driverName}
                        </p>
                      </div>
                      <div className="rounded-lg bg-surface px-3 py-2.5">
                        <p className="text-2xs uppercase tracking-wider text-faint">Created</p>
                        <p className="mt-0.5 text-xs font-medium text-ink">
                          {formatDateTime(b.createdAt)}
                        </p>
                        <p className="text-2xs text-faint">
                          {b.cancelledAt
                            ? `Cancelled ${formatDateTime(b.cancelledAt)}`
                            : b.completedAt
                              ? `Completed ${formatDateTime(b.completedAt)}`
                              : 'Slot held until cancelled'}
                        </p>
                      </div>
                      <div className="rounded-lg bg-surface px-3 py-2.5">
                        <p className="text-2xs uppercase tracking-wider text-faint">Station now</p>
                        {stats ? (
                          <p className="mt-0.5 text-xs font-medium text-ink">
                            {stats.available}/{stats.total} points free
                          </p>
                        ) : null}
                        <p className="text-2xs text-faint">
                          {station ? `Live price ${formatINR(station.pricePerKwh)}/kWh` : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link to={`/explore?station=${b.stationId}`}>
                        <Button size="sm" variant="secondary" icon={<MapPin className="h-3.5 w-3.5" />}>
                          Open station
                        </Button>
                      </Link>
                      {b.status === 'upcoming' && station && (
                        <Link to={`/book/${station.id}`}>
                          <Button size="sm" variant="outline">
                            Book another slot
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(cancelling)}
        title="Cancel this reservation?"
        description={
          cancelling
            ? `Reservation ${cancelling.ref} at ${
                state.stations.find((s) => s.id === cancelling.stationId)?.name ?? 'the station'
              } will be cancelled and the ${formatTime(cancelling.time)} slot released for other drivers. The record stays in your Cancelled tab.`
            : ''
        }
        confirmLabel="Cancel reservation"
        cancelLabel="Keep reservation"
        destructive
        onConfirm={() => {
          if (cancelling) cancelBooking(cancelling.id);
          setCancelling(null);
          setTab((t) => (t === 'upcoming' ? 'cancelled' : t));
        }}
        onCancel={() => setCancelling(null)}
      />
    </div>
  );
}
