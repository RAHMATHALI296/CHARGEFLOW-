import { AREAS, mapDistanceKm } from '../data/mockData';
import type { Area } from '../types';

export interface RouteEstimate {
  distanceKm: number;
  minutes: number;
}

export function areaById(id: string | null | undefined): Area | null {
  if (!id) return null;
  return AREAS.find((a) => a.id === id) ?? null;
}

export function areaByName(name: string): Area | null {
  const q = name.trim().toLowerCase();
  if (!q) return null;
  return (
    AREAS.find((a) => a.name.toLowerCase() === q) ??
    AREAS.find((a) => a.name.toLowerCase().includes(q)) ??
    null
  );
}

/** Suggested destinations offered by the route planner. */
export const SUPPORTED_DESTINATIONS = AREAS.filter((a) => a.id !== 'jubilee-hills');

/**
 * Approximate road distance/time between two simulated map points.
 * Straight-line distance × detour factor, then an average city speed band.
 * Clearly an estimate — never presented as verified navigation data.
 */
export function estimateRoute(
  from: { x: number; y: number },
  to: { x: number; y: number },
): RouteEstimate {
  const straight = mapDistanceKm(from.x, from.y, to.x, to.y);
  const distanceKm = Math.max(1.2, Math.round(straight * 10) / 10);
  const avgSpeed = distanceKm < 10 ? 24 : distanceKm < 30 ? 32 : 38;
  const minutes = Math.max(6, Math.round((distanceKm / avgSpeed) * 60 + 4));
  return { distanceKm, minutes };
}

export function estimateBetweenAreas(fromId: string, toId: string): RouteEstimate | null {
  const a = areaById(fromId);
  const b = areaById(toId);
  if (!a || !b) return null;
  return estimateRoute(a, b);
}

/**
 * Choose up to `limit` charging stations that sit near the straight corridor
 * between origin and destination (illustrative "suggested stop" logic).
 */
export function stationsAlongCorridor<T extends { mapX: number; mapY: number; areaId: string }>(
  stations: T[],
  from: Area,
  to: Area,
  limit = 3,
): T[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lenSq = dx * dx + dy * dy || 1;

  const scored = stations.map((s) => {
    // Perpendicular distance from the station to the origin→destination line.
    const t = ((s.mapX - from.x) * dx + (s.mapY - from.y) * dy) / lenSq;
    const clampedT = Math.max(0, Math.min(1, t));
    const projX = from.x + clampedT * dx;
    const projY = from.y + clampedT * dy;
    const off = Math.hypot(s.mapX - projX, s.mapY - projY);
    const along = Math.hypot(s.mapX - from.x, s.mapY - from.y) / Math.sqrt(lenSq);
    // Prefer stations reasonably along the way, not clustered at either end.
    const alongPenalty = clampedT < 0.15 || clampedT > 0.9 ? 120 : 0;
    return { station: s, score: off + alongPenalty + along * 20 };
  });

  return scored
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((s) => s.station);
}
