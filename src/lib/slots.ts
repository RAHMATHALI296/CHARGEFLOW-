import { SLOT_TIMES, toISODate } from '../data/mockData';
import type { Booking } from '../types';

/** Slots offered on the demo calendar: today + next two days. */
export function slotDates(count = 3): { iso: string; label: string; isToday: boolean }[] {
  const out: { iso: string; label: string; isToday: boolean }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    out.push({
      iso: toISODate(d),
      label:
        i === 0
          ? 'Today'
          : i === 1
            ? 'Tomorrow'
            : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      isToday: i === 0,
    });
  }
  return out;
}

export function slotKey(stationId: string, date: string, time: string): string {
  return `${stationId}|${date}|${time}`;
}

export function slotStart(date: string, time: string): number {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
}

export function isSlotPast(date: string, time: string, now = Date.now()): boolean {
  return slotStart(date, time) <= now;
}

export type SlotAvailability =
  | { available: true; reason: null }
  | { available: false; reason: 'reserved' | 'past' | 'offline' };

/**
 * Decide whether a predefined slot can be booked.
 * Reasons are surfaced in the UI so disabled slots are always explained.
 */
export function slotAvailability(
  stationId: string,
  date: string,
  time: string,
  bookings: Booking[],
  stationUsable: boolean,
  now = Date.now(),
): SlotAvailability {
  if (isSlotPast(date, time, now)) return { available: false, reason: 'past' };
  const taken = bookings.some(
    (b) =>
      b.status === 'upcoming' &&
      b.stationId === stationId &&
      b.date === date &&
      b.time === time,
  );
  if (taken) return { available: false, reason: 'reserved' };
  if (!stationUsable) return { available: false, reason: 'offline' };
  return { available: true, reason: null };
}

export const SLOT_REASON_TEXT: Record<'reserved' | 'past' | 'offline', string> = {
  reserved: 'Reserved by another booking',
  past: 'Time slot has passed',
  offline: 'All chargers at this station are faulty',
};

export function upcomingSlotCount(
  stationId: string,
  bookings: Booking[],
  now = Date.now(),
): number {
  return bookings.filter(
    (b) =>
      b.status === 'upcoming' &&
      b.stationId === stationId &&
      slotStart(b.date, b.time) > now,
  ).length;
}
