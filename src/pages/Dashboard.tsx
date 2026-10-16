import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  CalendarClock,
  Car,
  MapPin,
  Navigation,
  Route,
  Search,
  Wallet,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CityMap } from '../components/map/CityMap';
import { Chip, EmptyState, SimulatedNotice, StatusDot } from '../components/ui';
import { AREAS } from '../data/mockData';
import { formatDate, formatDistance, formatINR, formatRelative, formatTime } from '../lib/format';
import {
  myBookings,
  stationStats,
  unreadNotificationCount,
  useApp,
  vehicleOf,
} from '../store/AppContext';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const STATUS_TONE = { available: 'ev', occupied: 'warn', faulty: 'danger' } as const;

export default function Dashboard() {
  const { state } = useApp();
  const vehicle = vehicleOf(state);
  const bookings = myBookings(state);
  const unread = unreadNotificationCount(state);
  const now = Date.now();

  const upcoming = bookings
    .filter((b) => b.status === 'upcoming')
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0];

  const upcomingStation = state.stations.find((s) => s.id === upcoming?.stationId);

  const nearby = [...state.stations].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 4);

  const recent = state.sessions
    .filter((s) => s.status === 'completed')
    .slice(0, 3)
    .map((s) => ({
      key: s.id,
      kind: 'session' as const,
      at: s.endedAt ?? s.startedAt,
      station: state.stations.find((st) => st.id === s.stationId),
      title: 'Charging session completed',
      detail: `${s.energyKwh ?? 0} kWh · ${formatINR(s.cost ?? 0)}`,
    }));

  const homeArea = AREAS.find((a) => a.id === state.profile.homeAreaId);

  const quickLinks = [
    { to: '/bookings', icon: CalendarCheck, label: 'My Bookings', sub: `${upcoming ? '1 upcoming' : 'No upcoming'}` },
    { to: '/planner', icon: Route, label: 'Plan a route', sub: 'Destination-first' },
    { to: '/wallet', icon: Wallet, label: 'Wallet', sub: formatINR(state.walletBalance) },
    { to: '/sessions', icon: Zap, label: 'Sessions', sub: 'Track & settle' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label-caps">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">
            {greeting()}, {state.profile.name.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-dim">
            {homeArea ? `Based near ${homeArea.name}` : 'Hyderabad'} ·{' '}
            {upcoming
              ? `Next slot ${formatDate(upcoming.date)} at ${formatTime(upcoming.time)}`
              : 'No slot booked yet — availability looks good today.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/explore"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-ev px-5 text-sm font-semibold text-void transition-all hover:bg-ev-hover active:translate-y-px"
          >
            <Search className="h-4 w-4" />
            Find a Charger
          </Link>
          <Link
            to="/planner"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-line-strong px-5 text-sm font-medium text-dim transition-colors hover:border-ev/50 hover:text-ink"
          >
            <Navigation className="h-4 w-4" />
            Plan a trip
          </Link>
        </div>
      </section>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickLinks.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="panel group flex items-center gap-3 px-4 py-3 transition-colors hover:border-ev/40"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-raised text-ev transition-colors group-hover:bg-ev-soft">
              <l.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{l.label}</p>
              <p className="truncate text-2xs text-faint">{l.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* Upcoming booking */}
          {upcoming && upcomingStation ? (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="panel overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <p className="label-caps">Upcoming booking</p>
                <Chip tone="ev">{upcoming.ref}</Chip>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <h2 className="text-base font-semibold text-ink">{upcomingStation.name}</h2>
                  <p className="mt-1 text-sm text-dim">
                    {upcomingStation.address} ·{' '}
                    {AREAS.find((a) => a.id === upcomingStation.areaId)?.name}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                    <span className="flex items-center gap-1.5 text-ink">
                      <CalendarClock className="h-4 w-4 text-ev" />
                      {formatDate(upcoming.date)} · {formatTime(upcoming.time)}
                    </span>
                    <span className="text-dim">
                      Est. {upcoming.estimatedKwh} kWh ·{' '}
                      <span className="text-ink">{formatINR(upcoming.estimatedCost)}</span>
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-col">
                  <Link
                    to="/bookings"
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-ev px-4 text-xs font-semibold text-void hover:bg-ev-hover"
                  >
                    View booking
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    to={`/explore?station=${upcomingStation.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-line-strong px-4 text-xs font-medium text-dim hover:border-ev/50 hover:text-ink"
                  >
                    Station details
                  </Link>
                </div>
              </div>
            </motion.section>
          ) : (
            <EmptyState
              icon={<CalendarCheck className="h-5 w-5" />}
              title="No upcoming reservations"
              description="Reserve a 90-minute slot and it will show up here with its booking reference, date and estimated cost."
              action={
                <Link
                  to="/explore"
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-ev px-4 text-xs font-semibold text-void hover:bg-ev-hover"
                >
                  Explore stations
                </Link>
              }
            />
          )}

          {/* Nearby stations */}
          <section className="panel">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <p className="label-caps">Nearby stations</p>
              <Link to="/explore" className="text-xs font-medium text-ev hover:underline">
                See all on map →
              </Link>
            </div>
            <ul className="divide-y divide-line">
              {nearby.map((s) => {
                const stats = stationStats(s);
                return (
                  <li key={s.id}>
                    <Link
                      to={`/explore?station=${s.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-raised"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-raised text-ev">
                        <MapPin className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{s.name}</p>
                        <p className="mt-0.5 text-xs text-faint">
                          {AREAS.find((a) => a.id === s.areaId)?.name} · {formatDistance(s.distanceKm)} ·{' '}
                          {formatINR(s.pricePerKwh)}/kWh
                        </p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <StatusDot
                          tone={stats.available > 0 ? 'ev' : 'warn'}
                          label={
                            stats.available > 0
                              ? `${stats.available} free of ${stats.total}`
                              : 'All busy'
                          }
                        />
                        <p className="mt-0.5 text-2xs text-faint">
                          {stats.faulty > 0 ? `${stats.faulty} faulty` : `${s.maxPowerKw} kW max`}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-faint" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Map snapshot + activity */}
          <div className="grid gap-5 md:grid-cols-2">
            <section className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <p className="label-caps">Live map snapshot</p>
                <span className="text-2xs text-faint">simulated</span>
              </div>
              <CityMap
                stations={state.stations}
                preview
                caption={false}
                homeAreaId={state.profile.homeAreaId}
                className="aspect-[1000/640] rounded-none border-0"
              />
            </section>

            <section className="panel">
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <p className="label-caps">Recent activity</p>
                <Link to="/sessions" className="text-xs font-medium text-ev hover:underline">
                  Sessions →
                </Link>
              </div>
              {recent.length === 0 ? (
                <p className="px-5 py-8 text-center text-xs text-faint">
                  Completed charging sessions will appear here.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {recent.map((r) => (
                    <li key={r.key} className="flex items-start gap-3 px-5 py-3.5">
                      <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ev-soft text-ev">
                        <Zap className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">
                          {r.station?.name ?? 'Station'}
                        </p>
                        <p className="text-xs text-dim">
                          {r.detail} · {formatRelative(r.at)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        {/* Side column */}
        <div className="flex flex-col gap-5">
          {/* Vehicle */}
          <section className="panel p-5">
            <div className="flex items-center justify-between">
              <p className="label-caps">Your vehicle</p>
              <Link to="/profile" className="text-xs text-ev hover:underline">
                Manage
              </Link>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ev-soft text-ev">
                <Car className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">
                  {vehicle.brand} {vehicle.model}
                </p>
                <p className="text-xs text-faint">
                  {vehicle.batteryKwh} kWh · {vehicle.connector} · {vehicle.rangeKm} km range
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg bg-raised px-3.5 py-2.5">
              <span className="text-xs text-dim">Charge target</span>
              <span className="text-sm font-semibold text-ev">{state.profile.chargeTargetPercent}%</span>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-lg bg-raised px-3.5 py-2.5">
              <span className="text-xs text-dim">Preferred connector</span>
              <span className="text-sm font-semibold text-ink">{state.profile.preferredConnector}</span>
            </div>
          </section>

          {/* Wallet */}
          <section className="panel p-5">
            <div className="flex items-center justify-between">
              <p className="label-caps">ChargeFlow wallet</p>
              <Link to="/wallet" className="text-xs text-ev hover:underline">
                History
              </Link>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
              {formatINR(state.walletBalance)}
            </p>
            <p className="mt-1 text-2xs text-faint">Demo balance · no real money</p>
            <Link
              to="/wallet"
              className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-line-strong text-xs font-medium text-dim transition-colors hover:border-ev/50 hover:text-ev"
            >
              <Wallet className="h-3.5 w-3.5" />
              Add money
            </Link>
          </section>

          {/* Notifications preview */}
          <section className="panel">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <p className="label-caps">Notifications</p>
              <Link to="/notifications" className="text-xs font-medium text-ev hover:underline">
                {unread > 0 ? `${unread} unread` : 'All read'} →
              </Link>
            </div>
            <ul className="divide-y divide-line">
              {state.notifications.slice(0, 3).map((n) => (
                <li key={n.id} className="flex items-start gap-3 px-5 py-3">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-line-strong' : 'bg-ev'}`}
                  />
                  <div className="min-w-0">
                    <p className={`truncate text-xs font-medium ${n.read ? 'text-dim' : 'text-ink'}`}>
                      {n.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-2xs leading-relaxed text-faint">{n.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-5 py-3">
              <Link
                to="/notifications"
                className="inline-flex items-center gap-1.5 text-xs text-dim hover:text-ev"
              >
                <Bell className="h-3.5 w-3.5" />
                Open notification centre
              </Link>
            </div>
          </section>

          <SimulatedNotice />
        </div>
      </div>
    </div>
  );
}
