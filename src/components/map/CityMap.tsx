import { useMemo, useState } from 'react';
import { LocateFixed, Minus, Plus } from 'lucide-react';
import { AREAS, MAP_HEIGHT, MAP_WIDTH, ROADS } from '../../data/mockData';
import { stationStats } from '../../store/AppContext';
import type { ChargingStation } from '../../types';

export type MarkerState = 'available' | 'busy' | 'offline';

const MARKER_STYLE: Record<MarkerState, { fill: string; ring: string; label: string }> = {
  available: { fill: '#0E2A1C', ring: '#3DDC84', label: 'Available' },
  busy: { fill: '#2B2107', ring: '#FBBF24', label: 'All points busy' },
  offline: { fill: '#2C1414', ring: '#F05252', label: 'All chargers faulty' },
};

export function markerStateFor(station: ChargingStation): MarkerState {
  const stats = stationStats(station);
  if (stats.available > 0) return 'available';
  if (stats.total > 0 && stats.faulty === stats.total) return 'offline';
  return 'busy';
}

export interface CityMapProps {
  stations: ChargingStation[];
  selectedId?: string | null;
  onSelect?: (stationId: string) => void;
  /** When provided, stations outside this list are dimmed (filter feedback). */
  visibleIds?: string[] | null;
  homeAreaId?: string;
  /** Decorative, non-interactive mode for marketing previews. */
  preview?: boolean;
  className?: string;
  /** Show the "simulated map" caption. Defaults to true. */
  caption?: boolean;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function CityMap({
  stations,
  selectedId = null,
  onSelect,
  visibleIds = null,
  homeAreaId = 'jubilee-hills',
  preview = false,
  className = '',
  caption = true,
}: CityMapProps) {
  const [zoom, setZoom] = useState(1);
  const [focus, setFocus] = useState({ x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 });
  const [hovered, setHovered] = useState<string | null>(null);

  const selected = stations.find((s) => s.id === selectedId) ?? null;
  const home = AREAS.find((a) => a.id === homeAreaId) ?? AREAS.find((a) => a.id === 'jubilee-hills')!;

  const view = useMemo(() => {
    const w = MAP_WIDTH / zoom;
    const h = MAP_HEIGHT / zoom;
    const x = clamp(focus.x - w / 2, 0, MAP_WIDTH - w);
    const y = clamp(focus.y - h / 2, 0, MAP_HEIGHT - h);
    return { x, y, w, h };
  }, [zoom, focus]);

  const focusOn = (s: ChargingStation, nextZoom: number) => {
    setZoom(nextZoom);
    setFocus({ x: s.mapX, y: s.mapY });
  };

  const zoomBy = (factor: number) => {
    setZoom((z) => {
      const next = clamp(z * factor, 1, 2.5);
      if (next > 1 && selected) setFocus({ x: selected.mapX, y: selected.mapY });
      return next;
    });
  };

  const reset = () => {
    setZoom(1);
    setFocus({ x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 });
  };

  const handleSelect = (s: ChargingStation) => {
    if (preview || !onSelect) return;
    onSelect(s.id);
    if (zoom === 1) focusOn(s, 1.6);
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border border-line bg-[#0B1210] ${className}`}>
      <svg
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        className="h-full w-full"
        role="group"
        aria-label="Simulated map of Hyderabad charging stations"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id="cf-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="rgba(234,242,238,0.035)" strokeWidth="1" />
          </pattern>
          <radialGradient id="cf-area-glow">
            <stop offset="0%" stopColor="rgba(61,220,132,0.10)" />
            <stop offset="100%" stopColor="rgba(61,220,132,0)" />
          </radialGradient>
        </defs>

        <rect x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} fill="#0B1210" />
        <rect x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#cf-grid)" />

        {/* Soft neighbourhood glows */}
        {AREAS.map((a) => (
          <circle key={`glow-${a.id}`} cx={a.x} cy={a.y} r={92} fill="url(#cf-area-glow)" />
        ))}

        {/* Musi river */}
        {ROADS.filter((r) => r.kind === 'river').map((r) => (
          <path
            key={r.id}
            d={r.d}
            fill="none"
            stroke="rgba(96,165,250,0.16)"
            strokeWidth="10"
            strokeLinecap="round"
          />
        ))}

        {/* Road network */}
        {ROADS.filter((r) => r.kind !== 'river').map((r) => (
          <path
            key={r.id}
            d={r.d}
            fill="none"
            stroke={r.kind === 'highway' ? '#31423B' : r.kind === 'ring' ? '#2A3A34' : '#243129'}
            strokeWidth={r.kind === 'highway' ? 7 : r.kind === 'ring' ? 6 : 4.5}
            strokeLinecap="round"
            strokeDasharray={r.kind === 'ring' ? '16 11' : undefined}
          />
        ))}

        {/* Neighbourhood labels */}
        {AREAS.map((a) => (
          <g key={`label-${a.id}`} aria-hidden>
            <text
              x={a.x}
              y={a.y - 54}
              textAnchor="middle"
              fontSize="15"
              fontWeight="600"
              fill="#8CA096"
              stroke="#0B1210"
              strokeWidth="4"
              paintOrder="stroke"
              letterSpacing="0.4"
            >
              {a.name}
            </text>
          </g>
        ))}

        {/* Home marker */}
        <g transform={`translate(${home.x} ${home.y})`} aria-hidden>
          <circle r={7} fill="#EAF2EE" />
          <circle r={13} fill="none" stroke="rgba(234,242,238,0.4)" strokeWidth="1.5" />
          <text
            y={30}
            textAnchor="middle"
            fontSize="12"
            fontWeight="600"
            fill="#EAF2EE"
            stroke="#0B1210"
            strokeWidth="4"
            paintOrder="stroke"
          >
            You
          </text>
        </g>

        {/* Station markers */}
        {stations.map((s) => {
          const visible = !visibleIds || visibleIds.includes(s.id);
          const state = markerStateFor(s);
          const meta = MARKER_STYLE[state];
          const isSelected = s.id === selectedId;
          const isHovered = s.id === hovered;
          const stats = stationStats(s);
          const label = `${s.name}, ${MARKER_STYLE[state].label}, ${stats.available} of ${stats.total} points available`;

          return (
            <g
              key={s.id}
              transform={`translate(${s.mapX} ${s.mapY})`}
              opacity={visible ? 1 : 0.16}
              style={{ pointerEvents: visible && !preview ? 'auto' : 'none' }}
              tabIndex={preview ? -1 : 0}
              role="button"
              aria-label={label}
              className="cursor-pointer outline-none"
              onClick={() => handleSelect(s)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(s);
                }
              }}
              onMouseEnter={() => setHovered(s.id)}
              onMouseLeave={() => setHovered((h) => (h === s.id ? null : h))}
              onFocus={() => setHovered(s.id)}
              onBlur={() => setHovered((h) => (h === s.id ? null : h))}
            >
              {(isSelected || isHovered) && (
                <circle
                  r={isSelected ? 24 : 20}
                  fill="none"
                  stroke={isSelected ? meta.ring : 'rgba(234,242,238,0.35)'}
                  strokeWidth="1.5"
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                  className={isSelected ? 'animate-pulse-ring' : ''}
                />
              )}
              <circle
                r={isSelected ? 14 : 11}
                fill={meta.fill}
                stroke={meta.ring}
                strokeWidth={isSelected ? 3.5 : 2.5}
              />
              {state === 'available' && <circle r={4} fill={meta.ring} />}
              {state === 'busy' && <rect x={-4} y={-4} width={8} height={8} rx={1.5} fill={meta.ring} />}
              {state === 'offline' && (
                <g stroke={meta.ring} strokeWidth={2.4} strokeLinecap="round">
                  <line x1={-4} y1={-4} x2={4} y2={4} />
                  <line x1={4} y1={-4} x2={-4} y2={4} />
                </g>
              )}

              {(isHovered || isSelected) && visible && !preview && (
                <g transform="translate(0 -34)" style={{ pointerEvents: 'none' }}>
                  <rect
                    x={-(s.name.length * 3.9 + 14)}
                    y={-14}
                    width={s.name.length * 7.8 + 28}
                    height={26}
                    rx={7}
                    fill="#141C19"
                    stroke="#2B3A34"
                  />
                  <text
                    textAnchor="middle"
                    y={4}
                    fontSize="13"
                    fontWeight="600"
                    fill="#EAF2EE"
                  >
                    {s.name}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Zoom / recenter controls */}
      {!preview && (
        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          {[
            { icon: Plus, label: 'Zoom in', action: () => zoomBy(1.4) },
            { icon: Minus, label: 'Zoom out', action: () => zoomBy(1 / 1.4) },
            { icon: LocateFixed, label: 'Reset map view', action: reset },
          ].map(({ icon: Icon, label, action }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              aria-label={label}
              title={label}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface/95 text-dim shadow-panel transition-colors hover:border-ev/50 hover:text-ev"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      )}

      {/* Legend */}
      {!preview && (
        <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface/95 px-3 py-2 shadow-panel">
          {(
            [
              ['available', 'Available'],
              ['busy', 'Occupied'],
              ['offline', 'Faulty'],
            ] as const
          ).map(([state, text]) => (
            <span key={state} className="flex items-center gap-1.5 text-2xs text-dim">
              <span
                className="h-2.5 w-2.5 rounded-full border-2"
                style={{
                  borderColor: MARKER_STYLE[state].ring,
                  background: MARKER_STYLE[state].fill,
                }}
              />
              {text}
            </span>
          ))}
        </div>
      )}

      {caption && (
        <p className="absolute bottom-3 right-3 rounded-lg border border-dashed border-line-strong bg-surface/90 px-2.5 py-1.5 text-2xs text-faint shadow-panel">
          Simulated map · approximate illustrative placements
        </p>
      )}
    </div>
  );
}
