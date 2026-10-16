import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Compass,
  Info,
  MapPin,
  Navigation,
  Plus,
  Star,
  Target,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Chip,
  EmptyState,
  Field,
  Input,
  PageHeader,
  SimulatedNotice,
  StatusDot,
} from '../components/ui';
import { AREAS } from '../data/mockData';
import { formatDistance, formatDuration, formatINR } from '../lib/format';
import { areaById, estimateBetweenAreas, stationsAlongCorridor } from '../lib/geo';
import { stationRating, stationStats, useApp } from '../store/AppContext';
import type { ChargingStation } from '../types';

const STOP_DWELL_MINUTES = 90;

export default function RoutePlanner() {
  const { state } = useApp();
  const [params, setParams] = useSearchParams();

  const [originId, setOriginId] = useState(state.profile.homeAreaId);
  const [destination, setDestination] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [planned, setPlanned] = useState<{ originId: string; destId: string } | null>(null);
  const [stopIds, setStopIds] = useState<string[]>([]);
  const [inspected, setInspected] = useState<string | null>(null);

  // Deep link: /planner?to=<areaId> (used by the explorer's "Directions" action)
  useEffect(() => {
    const to = params.get('to');
    if (!to) return;
    const area = areaById(to);
    if (!area) return;
    setDestination(area.name);
    setOriginId((o) => (o === area.id ? o : o));
    setPlanned({ originId: state.profile.homeAreaId, destId: area.id });
    const next = new URLSearchParams(params);
    next.delete('to');
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const origin = areaById(originId);
  const destinationArea = planned ? areaById(planned.destId) : null;

  const plan = () => {
    const q = destination.trim();
    if (!q) {
      setError('Enter a destination to plan your journey.');
      return;
    }
    const match = AREAS.find(
      (a) => a.name.toLowerCase() === q.toLowerCase() || a.name.toLowerCase().startsWith(q.toLowerCase()),
    );
    if (!match) {
      setError(
        `"${q}" is not part of this prototype's supported location set. Pick one of the listed Hyderabad areas.`,
      );
      return;
    }
    if (match.id === originId) {
      setError('Origin and destination are the same area — pick a different destination.');
      return;
    }
    setError(null);
    setStopIds([]);
    setPlanned({ originId, destId: match.id });
  };

  const clearPlan = () => {
    setPlanned(null);
    setStopIds([]);
    setDestination('');
    setError(null);
  };

  const suggestions = useMemo(() => {
    if (!planned || !origin) return [];
    const dest = areaById(planned.destId);
    if (!dest) return [];
    return stationsAlongCorridor(state.stations, origin, dest, 3);
  }, [planned, origin, state.stations]);

  const stopStations = stopIds
    .map((id) => state.stations.find((s) => s.id === id))
    .filter((s): s is ChargingStation => Boolean(s));

  const route = useMemo(() => {
    if (!planned || !origin || !destinationArea) return null;
    const nodes: { areaId: string; label: string; kind: 'origin' | 'stop' | 'dest'; station?: ChargingStation }[] = [
      { areaId: origin.id, label: origin.name, kind: 'origin' },
      ...stopStations.map((s) => ({
        areaId: s.areaId,
        label: s.name,
        kind: 'stop' as const,
        station: s,
      })),
      { areaId: destinationArea.id, label: destinationArea.name, kind: 'dest' as const },
    ];

    const legs: { from: string; to: string; distanceKm: number; minutes: number }[] = [];
    for (let i = 0; i < nodes.length - 1; i += 1) {
      const a = areaById(nodes[i].areaId);
      const b = areaById(nodes[i + 1].areaId);
      if (!a || !b) continue;
      const est = estimateBetweenAreas(a.id, b.id);
      if (!est) continue;
      legs.push({ from: nodes[i].label, to: nodes[i + 1].label, ...est });
    }

    const distanceKm = Math.round(legs.reduce((acc, l) => acc + l.distanceKm, 0) * 10) / 10;
    const travelMinutes = legs.reduce((acc, l) => acc + l.minutes, 0);
    const stopMinutes = stopStations.length * STOP_DWELL_MINUTES;

    return { nodes, legs, distanceKm, travelMinutes, stopMinutes };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planned, origin, destinationArea, stopIds, state.stations]);

  const toggleStop = (id: string) => {
    setStopIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Journey planning"
        title="Route Planner"
        subtitle="Pick a destination and ChargeFlow suggests charging stops with estimated distance and travel time for the corridor."
        actions={<SimulatedNotice />}
      />

      {/* Inputs */}
      <section className="panel p-5" aria-label="Route inputs">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
          <Field label="Starting area" htmlFor="origin">
            <select
              id="origin"
              className="input-base appearance-none pr-8"
              value={originId}
              onChange={(e) => setOriginId(e.target.value)}
            >
              {AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Destination"
            htmlFor="destination"
            error={error && error.includes('destination') ? error : null}
            hint="Supported Hyderabad areas only"
          >
            <div className="relative">
              <Target className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <Input
                id="destination"
                list="hyd-destinations"
                className="pl-9"
                placeholder="e.g. Gachibowli"
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') plan();
                }}
              />
              <datalist id="hyd-destinations">
                {AREAS.map((a) => (
                  <option key={a.id} value={a.name} />
                ))}
              </datalist>
            </div>
          </Field>

          <div className="flex gap-2">
            <Button size="md" onClick={plan} icon={<Navigation className="h-4 w-4" />}>
              Plan route
            </Button>
            {planned && (
              <Button size="md" variant="ghost" onClick={clearPlan}>
                Clear
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-3">
            <Alert tone="warn" title="We could not plan that route">
              {error}
              <span className="mt-2 flex flex-wrap gap-1.5">
                {AREAS.slice(0, 6).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setDestination(a.name);
                      setError(null);
                    }}
                    className="rounded-full border border-warn/40 px-2.5 py-0.5 text-2xs font-medium text-warn transition-colors hover:bg-warn hover:text-void"
                  >
                    {a.name}
                  </button>
                ))}
              </span>
            </Alert>
          </div>
        )}
      </section>

      {!planned ? (
        <EmptyState
          icon={<Compass className="h-5 w-5" />}
          title="Plan a journey across Hyderabad"
          description="Enter a destination to see the estimated route, distance, travel time and the best charging stops along the way."
        />
      ) : (
        <>
          {/* Route summary */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="panel p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="label-caps">Estimated journey</p>
                <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold text-ink">
                  {origin?.name} <ArrowRight className="h-4 w-4 text-faint" />{' '}
                  {destinationArea?.name}
                </h2>
              </div>
              <Chip tone="warn" icon={<Info className="h-3 w-3" />}>
                Estimate — not verified navigation data
              </Chip>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { k: 'Driving distance', v: formatDistance(route?.distanceKm ?? 0) },
                {
                  k: 'Travel time (est.)',
                  v: route ? formatDuration(route.travelMinutes) : '—',
                },
                {
                  k: 'Charging stops',
                  v: `${stopStations.length}`,
                  sub: stopStations.length
                    ? `+${formatDuration(route?.stopMinutes ?? 0)} stop time`
                    : 'none added',
                },
                {
                  k: 'Total with stops',
                  v: route ? formatDuration(route.travelMinutes + route.stopMinutes) : '—',
                  sub: 'if you charge at each stop',
                },
              ].map((s) => (
                <div key={s.k} className="rounded-lg bg-raised px-3.5 py-2.5">
                  <p className="text-2xs uppercase tracking-wider text-faint">{s.k}</p>
                  <p className="mt-0.5 text-base font-semibold text-ink">{s.v}</p>
                  {s.sub && <p className="text-2xs text-faint">{s.sub}</p>}
                </div>
              ))}
            </div>

            {/* Route strip */}
            <div className="mt-5 overflow-x-auto">
              <ol className="flex min-w-max items-center gap-0">
                {route?.nodes.map((n, i) => (
                  <li key={`${n.label}-${i}`} className="flex items-center">
                    <div
                      className={`flex flex-col items-center gap-1.5 rounded-xl border px-3.5 py-2.5 ${
                        n.kind === 'stop'
                          ? 'border-ev/40 bg-ev-soft'
                          : 'border-line bg-raised'
                      }`}
                      style={{ minWidth: 132 }}
                    >
                      {n.kind === 'origin' ? (
                        <Circle className="h-4 w-4 text-info" fill="currentColor" />
                      ) : n.kind === 'dest' ? (
                        <Target className="h-4 w-4 text-warn" />
                      ) : (
                        <MapPin className="h-4 w-4 text-ev" />
                      )}
                      <span className="text-center text-2xs font-medium leading-tight text-ink">
                        {n.label}
                      </span>
                      {n.kind === 'stop' && n.station && (
                        <button
                          type="button"
                          onClick={() => toggleStop(n.station!.id)}
                          className="inline-flex items-center gap-1 text-2xs text-danger hover:underline"
                          aria-label={`Remove ${n.label} from route`}
                        >
                          <X className="h-3 w-3" />
                          remove stop
                        </button>
                      )}
                    </div>
                    {i < (route.nodes.length - 1) && (
                      <div className="relative mx-1 h-px w-10 bg-line-strong">
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-2xs text-faint">
                          {route.legs[i] ? formatDistance(route.legs[i].distanceKm) : ''}
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </div>

            <p className="mt-4 text-2xs leading-relaxed text-faint">
              Distances use a simplified illustrative road factor between simulated map positions;
              times assume average city speeds. No external routing service or live traffic feed is
              used.
            </p>
          </motion.section>

          {/* Suggested stops */}
          <section aria-label="Suggested charging stops">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="label-caps">Suggested charging stops</p>
                <p className="mt-1 text-sm text-dim">
                  Stations near your corridor, ranked by how conveniently they sit on the way.
                </p>
              </div>
              <Link to="/explore" className="text-xs font-medium text-ev hover:underline">
                Open full map →
              </Link>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              {suggestions.map((s) => {
                const stats = stationStats(s);
                const rating = stationRating(s, state.reviews);
                const added = stopIds.includes(s.id);
                const isInspected = inspected === s.id;
                const area = areaById(s.areaId);

                return (
                  <article
                    key={s.id}
                    className={`panel p-4 transition-colors ${added ? 'border-ev/50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-ink">{s.name}</h3>
                        <p className="mt-0.5 text-xs text-faint">{area?.name}</p>
                      </div>
                      <Chip tone={stats.available > 0 ? 'ev' : 'warn'}>
                        {stats.available > 0 ? `${stats.available} free` : 'busy'}
                      </Chip>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-faint">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3 fill-warn text-warn" />
                        {rating.value}
                      </span>
                      <span>{s.maxPowerKw} kW max</span>
                      <span>{formatINR(s.pricePerKwh)}/kWh</span>
                      <span>{formatDistance(s.distanceKm)} from home</span>
                    </div>

                    <div className="mt-2">
                      <StatusDot
                        tone={stats.available > 0 ? 'ev' : stats.faulty === stats.total ? 'danger' : 'warn'}
                        label={`${stats.available}/${stats.total} points · ${stats.occupied} busy · ${stats.faulty} faulty`}
                      />
                    </div>

                    {isInspected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 overflow-hidden rounded-lg border border-line bg-raised px-3 py-2.5"
                      >
                        <p className="text-2xs uppercase tracking-wider text-faint">Details</p>
                        <p className="mt-1 text-xs text-dim">{s.address}</p>
                        <p className="mt-1 text-xs text-dim">
                          Connectors: {s.connectors.join(', ')} · est. wait{' '}
                          {stats.waitMinutes === 0 ? 'none' : `${stats.waitMinutes} min`}
                        </p>
                        <p className="mt-1 text-2xs text-faint">Amenities: {s.amenities.join(' · ')}</p>
                      </motion.div>
                    )}

                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant={added ? 'secondary' : 'primary'}
                        onClick={() => toggleStop(s.id)}
                        icon={added ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      >
                        {added ? 'Stop added' : 'Add stop'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setInspected(isInspected ? null : s.id)}
                      >
                        {isInspected ? 'Hide' : 'Inspect'}
                      </Button>
                      <Link to={`/explore?station=${s.id}`} className="ml-auto self-center text-2xs text-ev hover:underline">
                        Map →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            {suggestions.length === 0 && (
              <p className="text-sm text-faint">No suggestions until a route is planned.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
