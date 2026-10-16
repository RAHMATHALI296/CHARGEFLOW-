import { STORAGE_KEY, STATE_VERSION } from '../data/mockData';
import type { AppState, ChargerStatus } from '../types';

const VALID_STATUS: ChargerStatus[] = ['available', 'occupied', 'faulty'];

/**
 * Safe localStorage access. ChargeFlow only ever reads/writes its own key, so
 * resetting demo data cannot affect unrelated browser storage.
 */
export function loadState(): AppState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const state = parsed as Partial<AppState>;

    // Basic shape validation — recover gracefully instead of crashing.
    if (state.version !== STATE_VERSION) return null;
    if (!Array.isArray(state.stations) || state.stations.length === 0) return null;
    if (!Array.isArray(state.bookings)) return null;
    if (typeof state.walletBalance !== 'number' || Number.isNaN(state.walletBalance)) return null;
    if (!state.auth || typeof state.auth !== 'object') return null;
    if (!state.profile || typeof state.profile !== 'object') return null;

    // Repair point statuses so counts always stay internally consistent.
    for (const station of state.stations) {
      if (!Array.isArray(station.points)) {
        station.points = [];
        continue;
      }
      for (const point of station.points) {
        if (!VALID_STATUS.includes(point.status)) point.status = 'available';
        if (typeof point.powerKw !== 'number') point.powerKw = 7.4;
      }
    }

    return state as AppState;
  } catch {
    return null;
  }
}

export function saveState(state: AppState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — the app keeps working in memory.
  }
}

export function clearState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
