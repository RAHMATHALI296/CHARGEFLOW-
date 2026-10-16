import { motion } from 'framer-motion';
import {
  Banknote,
  CalendarPlus,
  CheckCircle2,
  Filter,
  MapPin,
  Navigation,
  Search,
  Star,
  Timer,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CityMap, markerStateFor } from '../components/map/CityMap';
import {
  Alert,
  Button,
  Chip,
  EmptyState,
  Field,
  Input,
  Select,
  SimulatedNotice,
  StatusDot,
  Textarea,
} from '../components/ui';
import { AREAS, SPEED_TIER_META } from '../data/mockData';
import {
  formatDistance,
  formatDateShort,
  formatINR,
  formatTime,
  formatRelative,
} from '../lib/format';
import { slotAvailability, slotDates, SLOT_REASON_TEXT, slotStart } from '../lib/slots';
import { stationRating, stationStats, useApp } from '../store/AppContext';
import type { ConnectorType } from '../types';

type StatusFilter = 'any' | 'available' | 'busy' | 'faulty';
type SortKey = 'distance' | 'price' | 'availability';

const CONNECTORS: ConnectorType[] = ['CCS2', 'Type 2', 'CHAdeMO', 'Bharat DC'];

const STATUS_TONE = { ev: 'ev', warn: 'warn', danger: 'danger' } as const;

function Stars({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${cls} ${i <= Math.round(value) ? 'fill-warn text-warn' : 'text-line-strong'}`}
          aria-hidden
        />
      ))}
    </span>
  );
}

export default function Explore() {
  const { state, saveReview } = useApp();
  const [params, setParams] = useSearchParams();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('any');
  const [connector, setConnector] = useState<'any' | ConnectorType>('any');
  const [speed, setSpeed] = useState<'any' | 'slow' | 'fast' | 'rapid'>('any');
  const [sort, setSort] = useState<SortKey>('distance');
  const [selectedId, setSelectedId] = useState<string | null>(params.get('station'));

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSent, setReviewSent] = useState(false);

  // Keep selection in sync when arriving from dashboard/planner links.
  useEffect(() => {
    const incoming = params.get('station');
    if (incoming && incoming !== selectedId) setSelectedId(incoming);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const selectStation = (id: string) => {
    setSelectedId(id);
    setReviewSent(false);
    setReviewError(null);
    const next = new URLSearchParams(params);
    next.set('station', id);
    setParams(next, { replace: true });
  };

  const clearFilters = () => {
    setQuery('');
    setStatus('any');
    setConnector('any');
    setSpeed('any');
    setSort('distance');
  };

  const filtersActive =
    query !== '' || status !== 'any' || connector !== 'any' || speed !== 'any' || sort !== 'distance';

  const enriched = useMemo(
    () =>
      state.stations.map((s) => ({
        station: s,
        stats: stationStats(s),
        rating: stationRating(s, state.reviews),
        area: AREAS.find((a) => a.id === s.areaId),
      })),
    [state.stations, state.reviews],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = enriched.filter(({ station, stats, area }) => {
      if (
        q &&
        !station.name.toLowerCase().includes(q) &&
        !station.address.toLowerCase().includes(q) &&
        !area?.name.toLowerCase().includes(q)
      )
        return false;
      if (status === 'available' && stats.available === 0) return false;
      if (status === 'busy' && stats.available > 0) return false;
      if (status === 'faulty' && stats.faulty === 0) return false;
      if (connector !== 'any' && !station.connectors.includes(connector)) return false;
      if (speed !== 'any' && station.speedTier !== speed) return false;
      return true;
    });

    list.sort((a, b) => {
      if (sort === 'price') return a.station.pricePerKwh - b.station.pricePerKwh;
      if (sort === 'availability')
        return b.stats.available - a.stats.available || a.stats.waitMinutes - b.stats.waitMinutes;
      return a.station.distanceKm - b.station.distanceKm;
    });

    return list;
  }, [enriched, query, status, connector, speed, sort]);

  const visibleIds = results.map((r) => r.station.id);
  const selected = enriched.find((e) => e.station.id === selectedId) ?? null;
  const selectedVisible = selected ? visibleIds.includes(selected.station.id) : false;

  // Reviews for the selected station
  const selectedReviews = selected
    ? state.reviews
        .filter((r) => r.stationId === selected.station.id)
        .sort((a, b) => b.createdAt - a.createdAt)
    : [];

  const submitReview = () => {
    if (!selected) return;
    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError('Choose a star rating before submitting.');
      return;
    }
    if (reviewText.length > 500) {
      setReviewError('Reviews are limited to 500 characters.');
      return;
    }
    setReviewError(null);
    saveReview(selected.station.id, reviewRating, reviewText.trim());
    setReviewRating(0);
    setReviewText('');
    setReviewSent(true);
  };

  // Next available slots preview for the selected station
  const nextSlots = useMemo(() => {
    if (!selected) return [];
    const dates = slotDates(3);
    const out: { date: string; label: string; time: string }[] = [];
    for (const d of dates) {
      for (const time of ['06:00', '07:30', '09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00', '19:30', '21:00']) {
        const av = slotAvailability(
          selected.station.id,
          d.iso,
          time,
          state.bookings,
          selected.stats.available > 0 || selected.stats.occupied > 0,
        );
        if (av.available && slotStart(d.iso, time) > Date.now()) {
          out.push({ date: d.iso, label: d.label, time });
          if (out.length >= 3) return out;
        }
      }
    }
    return out;
  }, [selected, state.bookings]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label-caps">Explore</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            Charging stations across Hyderabad
          </h1>
          <p className="mt-1 text-sm text-dim">
            {results.length} of {state.stations.length} simulated stations shown
            {filtersActive ? ' · filters applied' : ''}
          </p>
        </div>
        <SimulatedNotice />
      </div>

      {/* Filters */}
      <section className="panel p-4" aria-label="Station search and filters">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))_auto]">
          <Field label="Search" htmlFor="station-search" className="xl:col-span-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <Input
                id="station-search"
                placeholder="Station or neighbourhood…"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </Field>

          <Field label="Availability" htmlFor="filter-status">
            <Select
              id="filter-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
            >
              <option value="any">Any status</option>
              <option value="available">Has free points</option>
              <option value="busy">All points busy</option>
              <option value="faulty">Has faulty points</option>
            </Select>
          </Field>

          <Field label="Connector" htmlFor="filter-connector">
            <Select
              id="filter-connector"
              value={connector}
              onChange={(e) => setConnector(e.target.value as 'any' | ConnectorType)}
            >
              <option value="any">Any connector</option>
              {CONNECTORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Charging speed" htmlFor="filter-speed">
            <Select
              id="filter-speed"
              value={speed}
              onChange={(e) => setSpeed(e.target.value as 'any' | 'slow' | 'fast' | 'rapid')}
            >
              <option value="any">Any speed</option>
              <option value="slow">AC slow (≤ 22 kW)</option>
              <option value="fast">DC fast (40–60 kW)</option>
              <option value="rapid">DC rapid (100 kW+)</option>
            </Select>
          </Field>

          <Field label="Sort by" htmlFor="filter-sort">
            <Select id="filter-sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="distance">Distance</option>
              <option value="price">Price (low → high)</option>
              <option value="availability">Availability</option>
            </Select>
          </Field>

          <div className="flex items-end">
            <Button
              variant="outline"
              size="md"
              onClick={clearFilters}
              disabled={!filtersActive}
              className="w-full xl:w-auto"
              icon={<Filter className="h-4 w-4" />}
            >
              Clear
            </Button>
          </div>
        </div>
      </section>

      {/* Split layout */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)_minmax(0,370px)]">
        {/* Station list */}
        <section
          className="panel order-2 flex max-h-[520px] flex-col overflow-hidden lg:order-1 lg:max-h-[calc(100vh-17rem)] xl:max-h-[calc(100vh-15rem)]"
          aria-label="Station results"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="label-caps">Stations</p>
            <span className="text-2xs text-faint">{results.length} results</span>
          </div>

          {results.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={<Search className="h-5 w-5" />}
                title="No stations match"
                description="Try a different neighbourhood or clear the filters to see every simulated station."
                action={
                  <Button size="sm" variant="secondary" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            </div>
          ) : (
            <ul className="scrollbar-thin divide-y divide-line overflow-y-auto">
              {results.map(({ station, stats, rating, area }) => {
                const isActive = station.id === selectedId;
                const marker = markerStateFor(station);
                return (
                  <li key={station.id}>
                    <button
                      type="button"
                      onClick={() => selectStation(station.id)}
                      aria-pressed={isActive}
                      className={`w-full px-4 py-3.5 text-left transition-colors ${
                        isActive ? 'bg-ev-soft' : 'hover:bg-raised'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm font-medium leading-snug ${
                            isActive ? 'text-ev' : 'text-ink'
                          }`}
                        >
                          {station.name}
                        </p>
                        <span className="shrink-0 text-2xs text-faint">
                          {formatDistance(station.distanceKm)}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-faint">
                        {area?.name} · {station.maxPowerKw} kW · {formatINR(station.pricePerKwh)}/kWh
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusDot
                          tone={marker === 'available' ? 'ev' : marker === 'busy' ? 'warn' : 'danger'}
                          label={
                            marker === 'available'
                              ? `${stats.available}/${stats.total} free`
                              : marker === 'busy'
                                ? 'All busy'
                                : 'All faulty'
                          }
                        />
                        <span className="inline-flex items-center gap-1 text-2xs text-faint">
                          <Star className="h-3 w-3 fill-warn text-warn" />
                          {rating.value} ({rating.count})
                        </span>
                        {stats.faulty > 0 && (
                          <span className="text-2xs text-danger">{stats.faulty} faulty</span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Map */}
        <section className="order-1 lg:order-2" aria-label="Station map">
          <CityMap
            stations={state.stations}
            selectedId={selectedId}
            onSelect={selectStation}
            visibleIds={visibleIds}
            homeAreaId={state.profile.homeAreaId}
            className="h-72 sm:h-96 lg:h-[calc(100vh-17rem)] xl:h-[calc(100vh-15rem)]"
          />
        </section>

        {/* Details panel */}
        <section
          className="panel order-3 flex flex-col overflow-hidden lg:col-span-2 xl:col-span-1 xl:h-[calc(100vh-15rem)]"
          aria-label="Selected station details"
        >
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-raised text-faint">
                <MapPin className="h-5 w-5" />
              </span>
              <h3 className="text-sm font-semibold text-ink">No station selected</h3>
              <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-dim">
                Pick a marker on the map or a result in the list to see charging points, prices,
                slots and reviews.
              </p>
            </div>
          ) : (
            <div className="scrollbar-thin flex-1 overflow-y-auto">
              <div className="border-b border-line px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold leading-snug text-ink">
                      {selected.station.name}
                    </h2>
                    <p className="mt-1 text-xs text-faint">
                      {selected.area?.name} · {selected.station.address}
                    </p>
                  </div>
                  <Chip
                    tone={
                      markerStateFor(selected.station) === 'available'
                        ? 'ev'
                        : markerStateFor(selected.station) === 'busy'
                          ? 'warn'
                          : 'danger'
                    }
                  >
                    {!selectedVisible ? 'Filtered out' : markerStateFor(selected.station) === 'available' ? 'Available' : markerStateFor(selected.station) === 'busy' ? 'Busy' : 'Offline'}
                  </Chip>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Stars value={selected.rating.value} />
                  <span className="text-xs text-dim">
                    {selected.rating.value} · {selected.rating.count} ratings
                  </span>
                </div>
              </div>

              {/* Point status */}
              <div className="border-b border-line px-5 py-4">
                <p className="label-caps">Charging points</p>
                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  {(
                    [
                      ['Available', selected.stats.available, 'ev'],
                      ['Occupied', selected.stats.occupied, 'warn'],
                      ['Faulty', selected.stats.faulty, 'danger'],
                    ] as const
                  ).map(([label, count, tone]) => (
                    <div key={label} className="rounded-lg bg-raised px-3 py-2.5 text-center">
                      <p
                        className={`text-lg font-semibold ${
                          tone === 'ev' ? 'text-ev' : tone === 'warn' ? 'text-warn' : 'text-danger'
                        }`}
                      >
                        {count}
                      </p>
                      <p className="text-2xs text-faint">{label}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-2xs text-faint">
                  {selected.stats.total} points total ·{' '}
                  {selected.stats.waitMinutes === 0
                    ? 'no wait expected'
                    : `est. wait ~${selected.stats.waitMinutes} min`}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selected.station.connectors.map((c) => (
                    <Chip key={c} tone="neutral">
                      {c}
                    </Chip>
                  ))}
                  <Chip tone="info">
                    {SPEED_TIER_META[selected.station.speedTier].label} · up to{' '}
                    {selected.station.maxPowerKw} kW
                  </Chip>
                </div>
              </div>

              {/* Key numbers */}
              <div className="grid grid-cols-2 gap-2 border-b border-line px-5 py-4">
                <div className="flex items-center gap-2 rounded-lg bg-raised px-3 py-2.5">
                  <Banknote className="h-4 w-4 shrink-0 text-ev" />
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {formatINR(selected.station.pricePerKwh, true)}
                    </p>
                    <p className="text-2xs text-faint">per kWh (est.)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-raised px-3 py-2.5">
                  <Timer className="h-4 w-4 shrink-0 text-warn" />
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {selected.stats.waitMinutes === 0 ? 'No wait' : `~${selected.stats.waitMinutes} min`}
                    </p>
                    <p className="text-2xs text-faint">estimated wait</p>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="border-b border-line px-5 py-4">
                <p className="label-caps">Amenities</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selected.station.amenities.map((a) => (
                    <Chip key={a} tone="neutral">
                      {a}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Slots */}
              <div className="border-b border-line px-5 py-4">
                <div className="flex items-center justify-between">
                  <p className="label-caps">Next open slots</p>
                  <span className="text-2xs text-faint">90-minute reservations</span>
                </div>
                {nextSlots.length === 0 ? (
                  <p className="mt-2 text-xs text-warn">
                    No bookable slots in the next three days.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {nextSlots.map((s) => (
                      <li
                        key={`${s.date}-${s.time}`}
                        className="flex items-center justify-between rounded-lg bg-raised px-3 py-2 text-xs"
                      >
                        <span className="text-ink">
                          {s.label} · {formatTime(s.time)}
                        </span>
                        <span className="text-faint">{formatDateShort(s.date)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Actions */}
              <div className="border-b border-line px-5 py-4">
                <div className="flex flex-col gap-2">
                  <Link to={`/book/${selected.station.id}`} className="block">
                    <Button size="md" className="w-full" icon={<CalendarPlus className="h-4 w-4" />}>
                      Book a Slot
                    </Button>
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                    <Link to={`/planner?to=${selected.station.areaId}`} className="block">
                      <Button variant="secondary" size="md" className="w-full" icon={<Navigation className="h-4 w-4" />}>
                        Directions
                      </Button>
                    </Link>
                    <Link to="/sessions" className="block">
                      <Button variant="outline" size="md" className="w-full" icon={<Zap className="h-4 w-4" />}>
                        Charge here
                      </Button>
                    </Link>
                  </div>
                </div>
                <p className="mt-2 text-2xs leading-relaxed text-faint">
                  Directions open the route planner with this area preselected — distances are
                  estimates, not verified navigation data.
                </p>
              </div>

              {/* Reviews */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <p className="label-caps">Ratings & reviews</p>
                  <span className="text-2xs text-faint">prototype data</span>
                </div>

                <div className="mt-3 rounded-lg border border-line bg-raised p-3.5">
                  <p className="text-xs font-medium text-ink">Rate this station</p>
                  <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label="Star rating">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        type="button"
                        role="radio"
                        aria-checked={reviewRating === i}
                        aria-label={`${i} star${i > 1 ? 's' : ''}`}
                        onClick={() => {
                          setReviewRating(i);
                          setReviewSent(false);
                          setReviewError(null);
                        }}
                        className="rounded p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            i <= reviewRating ? 'fill-warn text-warn' : 'text-line-strong'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    className="mt-2"
                    placeholder="What was your experience? (optional)"
                    value={reviewText}
                    maxLength={500}
                    onChange={(e) => setReviewText(e.target.value)}
                    aria-label="Review text"
                  />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-2xs text-faint">{reviewText.length}/500</span>
                    <Button size="sm" onClick={submitReview} disabled={reviewSent}>
                      {reviewSent ? 'Submitted' : 'Submit review'}
                    </Button>
                  </div>
                  {reviewError && (
                    <div className="mt-2">
                      <Alert tone="danger">{reviewError}</Alert>
                    </div>
                  )}
                  {reviewSent && (
                    <div className="mt-2">
                      <Alert tone="ev" title="Review saved">
                        Your rating is now reflected in this station's average — stored locally on
                        this device.
                      </Alert>
                    </div>
                  )}
                </div>

                <ul className="mt-3 space-y-2.5">
                  {selectedReviews.length === 0 && (
                    <li className="rounded-lg bg-raised px-3 py-3 text-xs text-faint">
                      No reviews yet. Be the first to rate this station.
                    </li>
                  )}
                  {selectedReviews.map((r) => (
                    <li key={r.id} className="rounded-lg border border-line px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-ink">{r.author}</span>
                        <Stars value={r.rating} />
                      </div>
                      {r.text && <p className="mt-1 text-xs leading-relaxed text-dim">{r.text}</p>}
                      <p className="mt-1.5 text-2xs text-faint">
                        {formatRelative(r.createdAt)}
                        {r.mine ? ' · your review' : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Slot unavailability legend */}
      <p className="text-2xs text-faint">
        Slots can be unavailable because they are{' '}
        <span className="text-dim">{SLOT_REASON_TEXT.reserved.toLowerCase()}</span>,{' '}
        <span className="text-dim">{SLOT_REASON_TEXT.past.toLowerCase()}</span> or{' '}
        <span className="text-dim">{SLOT_REASON_TEXT.offline.toLowerCase()}</span> — every disabled
        slot explains its reason during booking.
      </p>
    </div>
  );
}
