import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  DEMO_USER,
  INITIAL_BALANCE,
  STATE_VERSION,
  SLOT_MINUTES,
  seedBookings,
  seedNotifications,
  seedReviews,
  seedSessions,
  seedStations,
  seedTransactions,
  SEED_VEHICLES,
} from '../data/mockData';
import { slotStart } from '../lib/slots';
import { clearState, loadState, saveState } from '../lib/storage';
import { mapDistanceKm, AREAS } from '../data/mockData';
import type {
  AppNotification,
  AppState,
  Booking,
  ChargerStatus,
  ChargingSession,
  ChargingStation,
  PaymentMethod,
  Review,
  Transaction,
  UserRole,
  UserProfile,
} from '../types';

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function makeRef(): string {
  const raw = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CF-${raw.padEnd(6, 'X').slice(0, 6)}`;
}

export function createInitialState(): AppState {
  return {
    version: STATE_VERSION,
    auth: {
      signedIn: false,
      role: null,
      name: DEMO_USER.name,
      email: DEMO_USER.email,
    },
    profile: {
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      homeAreaId: 'jubilee-hills',
      vehicleId: 'veh-nexon',
      preferredConnector: 'CCS2',
      chargeTargetPercent: 80,
      fareAlerts: true,
    },
    vehicles: SEED_VEHICLES,
    stations: seedStations(),
    bookings: seedBookings(),
    walletBalance: INITIAL_BALANCE,
    transactions: seedTransactions(),
    sessions: seedSessions(),
    notifications: seedNotifications(),
    reviews: seedReviews(),
  };
}

/** Move bookings whose slot already passed out of "upcoming". */
function reconcileBookings(state: AppState): AppState {
  const now = Date.now();
  let changed = false;
  const bookings = state.bookings.map((b) => {
    if (b.status === 'upcoming' && slotStart(b.date, b.time) + b.slotMinutes * 60_000 < now) {
      changed = true;
      return { ...b, status: 'completed' as const, completedAt: slotStart(b.date, b.time) + 60 * 60_000 };
    }
    return b;
  });
  return changed ? { ...state, bookings } : state;
}

/** Repair station distances if the demo home area changed between sessions. */
function reconcileDistances(state: AppState): AppState {
  const home = AREAS.find((a) => a.id === state.profile.homeAreaId);
  if (!home) return state;
  return {
    ...state,
    stations: state.stations.map((s) => {
      const dist = Math.round(mapDistanceKm(s.mapX, s.mapY, home.x, home.y) * 10) / 10;
      return dist === s.distanceKm ? s : { ...s, distanceKm: dist };
    }),
  };
}

export function hydrateState(): AppState {
  const stored = loadState();
  if (!stored) return createInitialState();
  return reconcileDistances(reconcileBookings(stored));
}

// ---------------------------------------------------------------------------
// Derived helpers (pure — usable anywhere)
// ---------------------------------------------------------------------------

export function stationStats(station: ChargingStation) {
  const total = station.points.length;
  const available = station.points.filter((p) => p.status === 'available').length;
  const occupied = station.points.filter((p) => p.status === 'occupied').length;
  const faulty = station.points.filter((p) => p.status === 'faulty').length;
  const utilisation = total === 0 ? 0 : Math.round((occupied / total) * 100);
  const waitMinutes = available > 0 ? 0 : Math.min(90, Math.max(15, occupied * 15));
  return { total, available, occupied, faulty, utilisation, waitMinutes };
}

export function stationRating(station: ChargingStation, reviews: Review[]) {
  const mine = reviews.filter((r) => r.stationId === station.id && r.mine);
  const sum = station.ratingSum + mine.reduce((acc, r) => acc + r.rating, 0);
  const count = station.ratingCount + mine.length;
  return {
    value: count === 0 ? 0 : Math.round((sum / count) * 10) / 10,
    count,
  };
}

export function findStation(state: AppState, stationId: string | undefined): ChargingStation | null {
  if (!stationId) return null;
  return state.stations.find((s) => s.id === stationId) ?? null;
}

export function unreadNotificationCount(state: AppState): number {
  return state.notifications.filter((n) => !n.read).length;
}

export function activeSession(state: AppState): ChargingSession | null {
  return state.sessions.find((s) => s.status === 'active') ?? null;
}

export function myBookings(state: AppState): Booking[] {
  return state.bookings.filter((b) => b.owner === 'me');
}

export function vehicleOf(state: AppState) {
  return state.vehicles.find((v) => v.id === state.profile.vehicleId) ?? state.vehicles[0];
}

/** Estimated energy/cost for charging the demo vehicle from ~30% to target %. */
export function estimateCharge(state: AppState, station: ChargingStation) {
  const vehicle = vehicleOf(state);
  const target = Math.min(95, Math.max(20, state.profile.chargeTargetPercent));
  const from = Math.min(target, 30);
  const kwh = Math.round(vehicle.batteryKwh * ((target - from) / 100) * 10) / 10;
  return { kwh, cost: Math.round(kwh * station.pricePerKwh), target, from, vehicle };
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export interface PaymentRequest {
  amount: number;
  description: string;
  type: Transaction['type'];
  method: PaymentMethod;
  /** Deterministic demo outcome — clearly a simulation control, not a real charge. */
  outcome: 'success' | 'failure';
}

export type PaymentResult =
  | { ok: true; transaction: Transaction }
  | { ok: false; error: string };

export interface CreateBookingInput {
  stationId: string;
  date: string;
  time: string;
}

export type CreateBookingResult =
  | { ok: true; booking: Booking }
  | { ok: false; error: string };

interface AppContextValue {
  state: AppState;
  update: (mutator: (draft: AppState) => AppState) => void;
  // auth
  signIn: (role: UserRole, opts?: { name?: string; email?: string }) => void;
  signOut: () => void;
  resetDemo: () => void;
  // bookings
  createBooking: (input: CreateBookingInput) => CreateBookingResult;
  cancelBooking: (bookingId: string) => void;
  // operator
  setPointStatus: (stationId: string, pointId: string, status: ChargerStatus) => void;
  updateStation: (
    stationId: string,
    patch: Partial<Pick<ChargingStation, 'pricePerKwh' | 'name' | 'address'>>,
  ) => void;
  // wallet
  processPayment: (req: PaymentRequest) => PaymentResult;
  // sessions
  startSession: (stationId: string, bookingId?: string) => ChargingSession | null;
  endSession: (sessionId: string, payment: PaymentRequest) => PaymentResult;
  // notifications
  pushNotification: (n: Pick<AppNotification, 'type' | 'title' | 'body'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  // reviews & profile
  saveReview: (stationId: string, rating: number, text: string) => void;
  saveProfile: (patch: Partial<UserProfile>) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => hydrateState());
  const stateRef = useRef(state);
  stateRef.current = state;

  /**
   * Synchronously derive + apply the next state, keeping a fresh ref so
   * result-returning actions (booking, payments) can never race a double click.
   */
  const apply = useCallback((mutator: (prev: AppState) => AppState) => {
    const next = mutator(stateRef.current);
    if (next !== stateRef.current) {
      stateRef.current = next;
      setState(next);
    }
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const update = useCallback(
    (mutator: (draft: AppState) => AppState) => apply(mutator),
    [apply],
  );

  const signIn = useCallback<AppContextValue['signIn']>((role, opts) => {
    apply((prev) => ({
      ...prev,
      auth: {
        signedIn: true,
        role,
        name: opts?.name ?? (role === 'operator' ? 'Priya Nair' : prev.profile.name),
        email: opts?.email ?? (role === 'operator' ? 'ops@chargeflow.demo' : prev.profile.email),
      },      }));
    }, [apply]);

  const signOut = useCallback(() => {
    apply((prev) => ({
      ...prev,
      auth: { ...prev.auth, signedIn: false, role: null },      }));
    }, [apply]);

  const resetDemo = useCallback(() => {
    clearState();
    apply((prev) => {
      const fresh = createInitialState();
      // Keep the session signed in so repeated demos stay smooth.
      return { ...fresh, auth: prev.auth };
    });
  }, []);

  const pushNotification = useCallback<AppContextValue['pushNotification']>((n) => {
    apply((prev) => ({
      ...prev,
      notifications: [
        { ...n, id: uid('nt'), createdAt: Date.now(), read: false },
        ...prev.notifications,
      ].slice(0, 60),      }));
    }, [apply]);

  const createBooking = useCallback<AppContextValue['createBooking']>((input) => {
    let result: CreateBookingResult = { ok: false, error: 'Unable to create booking.' };

    apply((prev) => {
      const station = prev.stations.find((s) => s.id === input.stationId);
      if (!station) {
        result = { ok: false, error: 'That station no longer exists.' };
        return prev;
      }
      const conflict = prev.bookings.some(
        (b) =>
          b.status === 'upcoming' &&
          b.stationId === input.stationId &&
          b.date === input.date &&
          b.time === input.time,
      );
      if (conflict) {
        result = {
          ok: false,
          error: 'That slot was just reserved by someone else. Pick another time.',
        };
        return prev;
      }
      if (slotStart(input.date, input.time) < Date.now()) {
        result = { ok: false, error: 'That time slot has already passed.' };
        return prev;
      }

      const estimate = estimateCharge(prev, station);
      const booking: Booking = {
        id: uid('bk'),
        ref: makeRef(),
        stationId: station.id,
        date: input.date,
        time: input.time,
        slotMinutes: SLOT_MINUTES,
        status: 'upcoming',
        owner: 'me',
        driverName: prev.profile.name,
        estimatedKwh: estimate.kwh,
        estimatedCost: estimate.cost,
        createdAt: Date.now(),
      };

      result = { ok: true, booking };

      return {
        ...prev,
        bookings: [booking, ...prev.bookings],
        notifications: [
          {
            id: uid('nt'),
            type: 'booking' as const,
            title: 'Booking confirmed',
            body: `Slot reserved at ${station.name} on ${input.date} at ${input.time} (${booking.ref}).`,
            createdAt: Date.now(),
            read: false,
          },
          ...prev.notifications,
        ].slice(0, 60),
      };
    });

    return result;
  }, []);

  const cancelBooking = useCallback<AppContextValue['cancelBooking']>((bookingId) => {
    apply((prev) => {
      const booking = prev.bookings.find((b) => b.id === bookingId);
      if (!booking || booking.status !== 'upcoming') return prev;
      const station = prev.stations.find((s) => s.id === booking.stationId);
      const updated: Booking = { ...booking, status: 'cancelled', cancelledAt: Date.now() };
      return {
        ...prev,
        bookings: prev.bookings.map((b) => (b.id === bookingId ? updated : b)),
        notifications: [
          {
            id: uid('nt'),
            type: 'cancellation' as const,
            title: 'Booking cancelled',
            body: `Reservation ${booking.ref} at ${station?.name ?? 'station'} was cancelled and the slot released.`,
            createdAt: Date.now(),
            read: false,
          },
          ...prev.notifications,
        ].slice(0, 60),
      };
    });
  }, []);

  const setPointStatus = useCallback<AppContextValue['setPointStatus']>(
    (stationId, pointId, status) => {
      apply((prev) => {
        const station = prev.stations.find((s) => s.id === stationId);
        const point = station?.points.find((p) => p.id === pointId);
        if (!station || !point || point.status === status) return prev;

        const stations = prev.stations.map((s) =>
          s.id !== stationId
            ? s
            : {
                ...s,
                points: s.points.map((p) =>
                  p.id === pointId ? { ...p, status, statusSince: Date.now() } : p,
                ),
              },
        );

        const notifications =
          status === 'faulty'
            ? [
                {
                  id: uid('nt'),
                  type: 'fault' as const,
                  title: 'Charger fault simulated',
                  body: `${point.label} (${point.connector} ${point.powerKw} kW) at ${station.name} is marked faulty by the operator demo.`,
                  createdAt: Date.now(),
                  read: false,
                },
                ...prev.notifications,
              ].slice(0, 60)
            : prev.notifications;

        return { ...prev, stations, notifications };
      });
    },
    [],
  );

  const updateStation = useCallback<AppContextValue['updateStation']>((stationId, patch) => {
    apply((prev) => ({
      ...prev,
      stations: prev.stations.map((s) => (s.id === stationId ? { ...s, ...patch } : s)),      }));
    }, [apply]);

  const processPayment = useCallback<AppContextValue['processPayment']>((req) => {
    if (!Number.isFinite(req.amount) || req.amount <= 0) {
      return { ok: false, error: 'Enter a valid amount.' };
    }

    let result: PaymentResult = { ok: false, error: 'Payment could not be processed.' };

    apply((prev) => {
      const walletPayment = req.method === 'wallet';
      const insufficient = walletPayment && prev.walletBalance < req.amount;

      if (req.outcome === 'failure' || insufficient) {
        const failed: Transaction = {
          id: uid('tx'),
          type: req.type,
          description: req.description,
          amount: walletPayment ? -req.amount : 0,
          status: 'failed',
          method: req.method,
          createdAt: Date.now(),
        };
        result = {
          ok: false,
          error: insufficient
            ? 'Insufficient ChargeFlow wallet balance. Top up or choose another method.'
            : 'Simulated payment failed. No money was moved — please try again.',
        };
        return {
          ...prev,
          transactions: [failed, ...prev.transactions].slice(0, 80),
          notifications: [
            {
              id: uid('nt'),
              type: 'wallet' as const,
              title: 'Payment failed',
              body: `${req.description} could not be completed (simulated failure).`,
              createdAt: Date.now(),
              read: false,
            },
            ...prev.notifications,
          ].slice(0, 60),
        };
      }

      const signed = req.type === 'topup' ? Math.abs(req.amount) : -Math.abs(req.amount);
      const tx: Transaction = {
        id: uid('tx'),
        type: req.type,
        description: req.description,
        amount: signed,
        status: 'successful',
        method: walletPayment ? 'wallet' : req.method,
        createdAt: Date.now(),
      };

      result = { ok: true, transaction: tx };

      return {
        ...prev,
        walletBalance: Math.round((prev.walletBalance + signed) * 100) / 100,
        transactions: [tx, ...prev.transactions].slice(0, 80),
        notifications: [
          {
            id: uid('nt'),
            type: 'wallet' as const,
            title: req.type === 'topup' ? 'Wallet topped up' : 'Payment successful',
            body: `${req.description} · ${signed > 0 ? '+' : '−'}₹${Math.abs(signed).toLocaleString('en-IN')}.`,
            createdAt: Date.now(),
            read: false,
          },
          ...prev.notifications,
        ].slice(0, 60),
      };
    });

    return result;
  }, []);

  const startSession = useCallback<AppContextValue['startSession']>((stationId, bookingId) => {
    let created: ChargingSession | null = null;

    apply((prev) => {
      const existing = prev.sessions.find((s) => s.status === 'active');
      if (existing) {
        created = null;
        return prev;
      }

      const station = prev.stations.find((s) => s.id === stationId);
      if (!station) {
        created = null;
        return prev;
      }

      const preferred = vehicleOf(prev).connector;
      const point =
        station.points.find((p) => p.status === 'available' && p.connector === preferred) ??
        station.points.find((p) => p.status === 'available');

      if (!point) {
        created = null;
        return prev;
      }

      const session: ChargingSession = {
        id: uid('ss'),
        stationId: station.id,
        pointId: point.id,
        connector: point.connector,
        powerKw: point.powerKw,
        bookingId,
        status: 'active',
        startedAt: Date.now(),
        startPercent: 32,
        targetPercent: prev.profile.chargeTargetPercent,
      };

      created = session;

      return {
        ...prev,
        sessions: [session, ...prev.sessions],
        stations: prev.stations.map((s) =>
          s.id !== station.id
            ? s
            : {
                ...s,
                points: s.points.map((p) =>
                  p.id === point.id ? { ...p, status: 'occupied' as const, statusSince: Date.now() } : p,
                ),
              },
        ),
        notifications: [
          {
            id: uid('nt'),
            type: 'session' as const,
            title: 'Charging session started (simulated)',
            body: `${station.name} · ${point.connector} ${point.powerKw} kW on ${point.label}.`,
            createdAt: Date.now(),
            read: false,
          },
          ...prev.notifications,
        ].slice(0, 60),
      };
    });

    return created;
  }, []);

  const endSession = useCallback<AppContextValue['endSession']>((sessionId, payment) => {
    let result: PaymentResult = { ok: false, error: 'Session could not be ended.' };

    apply((prev) => {
      const session = prev.sessions.find((s) => s.id === sessionId && s.status === 'active');
      if (!session) {
        result = { ok: false, error: 'No active session found.' };
        return prev;
      }
      const station = prev.stations.find((s) => s.id === session.stationId);
      if (!station) {
        result = { ok: false, error: 'Station not found.' };
        return prev;
      }

      const endedAt = Date.now();
      const hours = Math.max(1 / 60, (endedAt - session.startedAt) / 3_600_000);
      const energyKwh = Math.round(session.powerKw * hours * 0.85 * 10) / 10;
      const cost = Math.max(5, Math.round(energyKwh * station.pricePerKwh));

      const walletPayment = payment.method === 'wallet';
      const insufficient = walletPayment && prev.walletBalance < cost;
      const failed = payment.outcome === 'failure' || insufficient;

      const tx: Transaction = {
        id: uid('tx'),
        type: 'payment',
        description: `Charging session · ${station.name}`,
        amount: failed ? 0 : -cost,
        status: failed ? 'failed' : 'successful',
        method: walletPayment ? 'wallet' : payment.method,
        createdAt: endedAt,
      };

      result = failed
        ? {
            ok: false,
            error: insufficient
              ? 'Insufficient wallet balance for this session. Top up or choose another method.'
              : 'Simulated payment failed. The session was saved — retry payment from the wallet.',
          }
        : { ok: true, transaction: tx };

      const completedSession: ChargingSession = {
        ...session,
        status: 'completed',
        endedAt,
        energyKwh,
        cost,
        paymentMethod: payment.method,
      };

      const bookings = session.bookingId
        ? prev.bookings.map((b) =>
            b.id === session.bookingId ? { ...b, status: 'completed' as const, completedAt: endedAt } : b,
          )
        : prev.bookings;

      return {
        ...prev,
        sessions: prev.sessions.map((s) => (s.id === sessionId ? completedSession : s)),
        stations: prev.stations.map((s) =>
          s.id !== station.id
            ? s
            : {
                ...s,
                points: s.points.map((p) =>
                  p.id === session.pointId
                    ? { ...p, status: 'available' as const, statusSince: endedAt }
                    : p,
                ),
              },
        ),
        bookings,
        walletBalance: failed
          ? prev.walletBalance
          : Math.round((prev.walletBalance - cost) * 100) / 100,
        transactions: [tx, ...prev.transactions].slice(0, 80),
        notifications: [
          {
            id: uid('nt'),
            type: 'session' as const,
            title: failed ? 'Session ended · payment pending' : 'Charging session completed',
            body: `${station.name} · ${energyKwh} kWh delivered · ₹${cost} ${failed ? 'awaiting payment' : 'charged'}.`,
            createdAt: endedAt,
            read: false,
          },
          ...prev.notifications,
        ].slice(0, 60),
      };
    });

    return result;
  }, []);

  const markNotificationRead = useCallback<AppContextValue['markNotificationRead']>((id) => {
    apply((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),      }));
    }, [apply]);

  const markAllNotificationsRead = useCallback(() => {
    apply((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.read ? n : { ...n, read: true })),      }));
    }, [apply]);

  const saveReview = useCallback<AppContextValue['saveReview']>((stationId, rating, text) => {
    apply((prev) => {
      const station = prev.stations.find((s) => s.id === stationId);
      const review: Review = {
        id: uid('rv'),
        stationId,
        author: prev.profile.name,
        rating,
        text: text.trim(),
        createdAt: Date.now(),
        mine: true,
      };
      return {
        ...prev,
        reviews: [review, ...prev.reviews],
        notifications: [
          {
            id: uid('nt'),
            type: 'system' as const,
            title: 'Review submitted',
            body: `Your ${rating}-star review for ${station?.name ?? 'the station'} was saved to this device.`,
            createdAt: Date.now(),
            read: false,
          },
          ...prev.notifications,
        ].slice(0, 60),
      };
    });
  }, []);

  const saveProfile = useCallback<AppContextValue['saveProfile']>((patch) => {
    apply((prev) => {
      const profile = { ...prev.profile, ...patch };
      const home = AREAS.find((a) => a.id === profile.homeAreaId);
      const stations = home
        ? prev.stations.map((s) => ({
            ...s,
            distanceKm: Math.round(mapDistanceKm(s.mapX, s.mapY, home.x, home.y) * 10) / 10,
          }))
        : prev.stations;
      return {
        ...prev,
        profile,
        stations,
        auth: prev.auth.signedIn && prev.auth.role === 'driver'
          ? { ...prev.auth, name: profile.name, email: profile.email }
          : prev.auth,
      };
    });
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      update,
      signIn,
      signOut,
      resetDemo,
      createBooking,
      cancelBooking,
      setPointStatus,
      updateStation,
      processPayment,
      startSession,
      endSession,
      pushNotification,
      markNotificationRead,
      markAllNotificationsRead,
      saveReview,
      saveProfile,
    }),
    [
      state,
      update,
      signIn,
      signOut,
      resetDemo,
      createBooking,
      cancelBooking,
      setPointStatus,
      updateStation,
      processPayment,
      startSession,
      endSession,
      pushNotification,
      markNotificationRead,
      markAllNotificationsRead,
      saveReview,
      saveProfile,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
