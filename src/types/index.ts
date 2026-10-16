// ChargeFlow shared data model.
// Everything here is illustrative prototype data — never presented as live telemetry.

export type ConnectorType = 'CCS2' | 'Type 2' | 'CHAdeMO' | 'Bharat DC';

export type ChargeSpeedTier = 'slow' | 'fast' | 'rapid';

export type ChargerStatus = 'available' | 'occupied' | 'faulty';

export type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

export type TransactionStatus = 'successful' | 'failed' | 'pending';

export type TransactionType = 'topup' | 'payment' | 'refund';

export type PaymentMethod = 'upi' | 'card' | 'wallet';

export type SessionStatus = 'active' | 'completed';

export type NotificationType =
  | 'booking'
  | 'reminder'
  | 'cancellation'
  | 'session'
  | 'fault'
  | 'wallet'
  | 'system';

export type UserRole = 'driver' | 'operator';

export interface Area {
  id: string;
  name: string;
  /** Approximate illustrative position on the simulated city map (SVG units). */
  x: number;
  y: number;
}

export interface ChargingPoint {
  id: string;
  stationId: string;
  label: string;
  connector: ConnectorType;
  powerKw: number;
  status: ChargerStatus;
  /** When the point entered its current status (epoch ms) — used for demo timestamps. */
  statusSince: number;
}

export interface ChargingStation {
  id: string;
  name: string;
  areaId: string;
  address: string;
  connectors: ConnectorType[];
  speedTier: ChargeSpeedTier;
  maxPowerKw: number;
  pricePerKwh: number;
  ratingSum: number;
  ratingCount: number;
  amenities: string[];
  /** Approximate illustrative distance from the demo user's home area (km). */
  distanceKm: number;
  /** Approximate position on the simulated map (SVG units). */
  mapX: number;
  mapY: number;
  points: ChargingPoint[];
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  batteryKwh: number;
  connector: ConnectorType;
  rangeKm: number;
}

export interface UserProfile {
  name: string;
  email: string;
  homeAreaId: string;
  vehicleId: string;
  preferredConnector: ConnectorType;
  chargeTargetPercent: number;
  fareAlerts: boolean;
}

export interface Booking {
  id: string;
  ref: string;
  stationId: string;
  /** 'YYYY-MM-DD' local date of the reserved slot. */
  date: string;
  /** 'HH:MM' start of the reserved slot. */
  time: string;
  slotMinutes: number;
  status: BookingStatus;
  /** 'me' for the signed-in demo driver, otherwise another demo driver. */
  owner: 'me' | 'other';
  driverName: string;
  estimatedKwh: number;
  estimatedCost: number;
  createdAt: number;
  cancelledAt?: number;
  completedAt?: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  /** Positive credits the wallet, negative debits it. */
  amount: number;
  status: TransactionStatus;
  method: PaymentMethod | 'wallet';
  createdAt: number;
}

export interface ChargingSession {
  id: string;
  stationId: string;
  pointId: string;
  connector: ConnectorType;
  powerKw: number;
  bookingId?: string;
  status: SessionStatus;
  startedAt: number;
  endedAt?: number;
  energyKwh?: number;
  cost?: number;
  paymentMethod?: PaymentMethod;
  targetPercent?: number;
  startPercent?: number;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
}

export interface Review {
  id: string;
  stationId: string;
  author: string;
  rating: number;
  text: string;
  createdAt: number;
  /** Prototype data written by the demo user (as opposed to seeded sample reviews). */
  mine: boolean;
}

export interface AuthState {
  signedIn: boolean;
  role: UserRole | null;
  name: string;
  email: string;
}

export interface AppState {
  version: number;
  auth: AuthState;
  profile: UserProfile;
  vehicles: Vehicle[];
  stations: ChargingStation[];
  bookings: Booking[];
  walletBalance: number;
  transactions: Transaction[];
  sessions: ChargingSession[];
  notifications: AppNotification[];
  reviews: Review[];
}

export interface StationStats {
  total: number;
  available: number;
  occupied: number;
  faulty: number;
  utilisation: number;
  waitMinutes: number;
  rating: number;
  ratingCount: number;
}

export type StationFilterStatus = 'any' | 'available' | 'busy' | 'faulty';
