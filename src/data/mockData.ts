import type {
  AppNotification,
  Area,
  Booking,
  ChargingPoint,
  ChargingSession,
  ChargingStation,
  ConnectorType,
  Review,
  Transaction,
  Vehicle,
} from '../types';

/** Initial ChargeFlow wallet balance (₹) — equals the sum of seeded transactions. */
export const INITIAL_BALANCE = 1352;

/** Reserved storage key — reset only touches this key. */
export const STORAGE_KEY = 'chargeflow.state.v1';

export const STATE_VERSION = 1;

// ---------------------------------------------------------------------------
// Simulated city map — Hyderabad
// Positions are approximate illustrative placements, not verified coordinates.
// ---------------------------------------------------------------------------

export const MAP_WIDTH = 1000;
export const MAP_HEIGHT = 640;

export const AREAS: Area[] = [
  { id: 'secunderabad', name: 'Secunderabad', x: 560, y: 140 },
  { id: 'kukatpally', name: 'Kukatpally', x: 375, y: 165 },
  { id: 'ameerpet', name: 'Ameerpet', x: 470, y: 255 },
  { id: 'mehdipatnam', name: 'Mehdipatnam', x: 295, y: 305 },
  { id: 'khairatabad', name: 'Khairatabad', x: 425, y: 335 },
  { id: 'banjara-hills', name: 'Banjara Hills', x: 455, y: 415 },
  { id: 'jubilee-hills', name: 'Jubilee Hills', x: 515, y: 465 },
  { id: 'madhapur', name: 'Madhapur', x: 630, y: 415 },
  { id: 'hitech-city', name: 'Hitech City', x: 695, y: 375 },
  { id: 'gachibowli', name: 'Gachibowli', x: 655, y: 525 },
  { id: 'lb-nagar', name: 'LB Nagar', x: 480, y: 575 },
];

export interface Road {
  id: string;
  name: string;
  d: string;
  kind: 'highway' | 'arterial' | 'ring' | 'river';
}

export const ROADS: Road[] = [
  {
    id: 'orr',
    name: 'Outer Ring Road',
    d: 'M 262 352 C 268 250, 318 178, 375 165 C 452 146, 528 112, 566 138',
    kind: 'ring',
  },
  {
    id: 'nh44',
    name: 'NH-44 Corridor',
    d: 'M 566 138 C 528 190, 500 226, 470 255 C 412 278, 348 292, 295 305',
    kind: 'highway',
  },
  {
    id: 'city-centre-road',
    name: 'Secunderabad Link Road',
    d: 'M 566 138 C 606 224, 630 322, 630 415',
    kind: 'arterial',
  },
  {
    id: 'hitec-corridor',
    name: 'Hitec City Corridor',
    d: 'M 470 255 C 545 300, 620 336, 695 375',
    kind: 'highway',
  },
  {
    id: 'madhapur-branch',
    name: 'Mindspace Link',
    d: 'M 625 343 C 630 370, 631 392, 630 415',
    kind: 'arterial',
  },
  {
    id: 'madhapur-gachibowli',
    name: 'Madhapur–Gachibowli Road',
    d: 'M 630 415 C 641 452, 651 490, 655 525',
    kind: 'arterial',
  },
  {
    id: 'hitec-gachibowli',
    name: 'West Block Road',
    d: 'M 695 375 C 702 432, 686 482, 655 525',
    kind: 'arterial',
  },
  {
    id: 'inner-loop',
    name: 'Khairatabad–Jubilee Link',
    d: 'M 425 335 C 435 370, 445 396, 455 415 C 476 435, 496 451, 515 465',
    kind: 'arterial',
  },
  {
    id: 'lb-road',
    name: 'LB Nagar Road',
    d: 'M 455 415 C 470 470, 476 526, 480 575',
    kind: 'arterial',
  },
  {
    id: 'jubilee-gachibowli',
    name: 'Jubilee–Gachibowli Road',
    d: 'M 515 465 C 561 491, 610 511, 655 525',
    kind: 'arterial',
  },
  {
    id: 'kukatpally-link',
    name: 'Kukatpally–Ameerpet Road',
    d: 'M 375 165 C 402 201, 441 231, 470 255',
    kind: 'arterial',
  },
  {
    id: 'musi',
    name: 'Musi River',
    d: 'M 110 236 C 250 268, 380 214, 520 246 C 646 274, 764 236, 906 262',
    kind: 'river',
  },
];

// ---------------------------------------------------------------------------
// Demo identity
// ---------------------------------------------------------------------------

export const DEMO_USER = {
  name: 'Arjun Verma',
  email: 'arjun@chargeflow.demo',
  password: 'demo1234',
};

export const DEMO_OPERATOR = {
  name: 'Priya Nair',
  email: 'ops@chargeflow.demo',
  role: 'operator' as const,
};

export const SEED_VEHICLES: Vehicle[] = [
  {
    id: 'veh-nexon',
    brand: 'Tata',
    model: 'Nexon EV 45',
    batteryKwh: 45,
    connector: 'CCS2',
    rangeKm: 325,
  },
  {
    id: 'veh-zs',
    brand: 'MG',
    model: 'ZS EV',
    batteryKwh: 44.5,
    connector: 'CCS2',
    rangeKm: 340,
  },
  {
    id: 'veh-ioniq',
    brand: 'Hyundai',
    model: 'IONIQ 5',
    batteryKwh: 72.6,
    connector: 'CCS2',
    rangeKm: 490,
  },
  {
    id: 'veh-xuv400',
    brand: 'Mahindra',
    model: 'XUV400 EL',
    batteryKwh: 39.4,
    connector: 'CCS2',
    rangeKm: 375,
  },
];

// ---------------------------------------------------------------------------
// Charging stations
// ---------------------------------------------------------------------------

interface PointSpec {
  connector: ConnectorType;
  powerKw: number;
  status: ChargingPoint['status'];
}

function makePoints(stationId: string, specs: PointSpec[]): ChargingPoint[] {
  const now = Date.now();
  return specs.map((spec, i) => ({
    id: `${stationId}-p${i + 1}`,
    stationId,
    label: `P${i + 1}`,
    connector: spec.connector,
    powerKw: spec.powerKw,
    status: spec.status,
    statusSince: now - (i + 1) * 11 * 60 * 1000,
  }));
}

interface StationSeed {
  id: string;
  name: string;
  areaId: string;
  address: string;
  connectors: ConnectorType[];
  speedTier: ChargingStation['speedTier'];
  maxPowerKw: number;
  pricePerKwh: number;
  ratingSum: number;
  ratingCount: number;
  amenities: string[];
  mapX: number;
  mapY: number;
  specs: PointSpec[];
}

const STATION_SEEDS: StationSeed[] = [
  {
    id: 'st-jubilee-hub',
    name: 'ChargeFlow Hub · Jubilee Hills',
    areaId: 'jubilee-hills',
    address: 'Road No. 36, near Peddamma Temple',
    connectors: ['CCS2', 'Type 2', 'CHAdeMO'],
    speedTier: 'rapid',
    maxPowerKw: 120,
    pricePerKwh: 15.5,
    ratingSum: 122,
    ratingCount: 26,
    amenities: ['Café', 'Restrooms', 'Covered parking', '24×7'],
    mapX: 528,
    mapY: 452,
    specs: [
      { connector: 'CCS2', powerKw: 120, status: 'available' },
      { connector: 'CCS2', powerKw: 120, status: 'occupied' },
      { connector: 'CCS2', powerKw: 60, status: 'available' },
      { connector: 'Type 2', powerKw: 7.4, status: 'available' },
      { connector: 'Type 2', powerKw: 7.4, status: 'occupied' },
      { connector: 'Type 2', powerKw: 7.4, status: 'available' },
      { connector: 'CHAdeMO', powerKw: 50, status: 'faulty' },
      { connector: 'CHAdeMO', powerKw: 50, status: 'available' },
    ],
  },
  {
    id: 'st-gachibowli-dc',
    name: 'Gachibowli Circle DC Station',
    areaId: 'gachibowli',
    address: 'Financial District approach road, Gachibowli',
    connectors: ['CCS2', 'Type 2', 'CHAdeMO', 'Bharat DC'],
    speedTier: 'rapid',
    maxPowerKw: 150,
    pricePerKwh: 16.8,
    ratingSum: 179,
    ratingCount: 39,
    amenities: ['24×7', 'Convenience store', 'CCTV', 'Parking'],
    mapX: 668,
    mapY: 512,
    specs: [
      { connector: 'CCS2', powerKw: 150, status: 'occupied' },
      { connector: 'CCS2', powerKw: 120, status: 'occupied' },
      { connector: 'CCS2', powerKw: 120, status: 'occupied' },
      { connector: 'Type 2', powerKw: 22, status: 'available' },
      { connector: 'Type 2', powerKw: 22, status: 'available' },
      { connector: 'Type 2', powerKw: 22, status: 'occupied' },
      { connector: 'Type 2', powerKw: 22, status: 'available' },
      { connector: 'CHAdeMO', powerKw: 50, status: 'available' },
      { connector: 'CHAdeMO', powerKw: 50, status: 'faulty' },
      { connector: 'Bharat DC', powerKw: 10, status: 'available' },
    ],
  },
  {
    id: 'st-hitec-express',
    name: 'Hitec City Express Chargers',
    areaId: 'hitech-city',
    address: 'Cyber Towers lane, Hitech City',
    connectors: ['CCS2', 'Type 2'],
    speedTier: 'rapid',
    maxPowerKw: 100,
    pricePerKwh: 16,
    ratingSum: 108,
    ratingCount: 24,
    amenities: ['Covered parking', 'Restrooms', 'CCTV'],
    mapX: 700,
    mapY: 366,
    specs: [
      { connector: 'CCS2', powerKw: 100, status: 'available' },
      { connector: 'CCS2', powerKw: 100, status: 'occupied' },
      { connector: 'CCS2', powerKw: 100, status: 'available' },
      { connector: 'Type 2', powerKw: 22, status: 'occupied' },
      { connector: 'Type 2', powerKw: 22, status: 'available' },
      { connector: 'Type 2', powerKw: 22, status: 'occupied' },
    ],
  },
  {
    id: 'st-madhapur-plaza',
    name: 'Mindspace Madhapur Charging Plaza',
    areaId: 'madhapur',
    address: 'Mindspace Boulevard, Madhapur',
    connectors: ['CCS2', 'Type 2'],
    speedTier: 'fast',
    maxPowerKw: 60,
    pricePerKwh: 14.5,
    ratingSum: 146,
    ratingCount: 31,
    amenities: ['Café', 'Parking', 'CCTV', 'Shelter'],
    mapX: 622,
    mapY: 424,
    specs: [
      { connector: 'CCS2', powerKw: 60, status: 'available' },
      { connector: 'CCS2', powerKw: 60, status: 'available' },
      { connector: 'CCS2', powerKw: 60, status: 'occupied' },
      { connector: 'CCS2', powerKw: 60, status: 'occupied' },
      { connector: 'Type 2', powerKw: 7.4, status: 'available' },
      { connector: 'Type 2', powerKw: 7.4, status: 'available' },
      { connector: 'Type 2', powerKw: 7.4, status: 'occupied' },
      { connector: 'Type 2', powerKw: 7.4, status: 'faulty' },
    ],
  },
  {
    id: 'st-banjara-12th',
    name: 'Banjara Hills 12th Road Chargers',
    areaId: 'banjara-hills',
    address: '12th Road, Banjara Hills',
    connectors: ['Type 2', 'Bharat DC'],
    speedTier: 'slow',
    maxPowerKw: 22,
    pricePerKwh: 11.2,
    ratingSum: 84,
    ratingCount: 19,
    amenities: ['Parking', 'Restrooms'],
    mapX: 447,
    mapY: 406,
    specs: [
      { connector: 'Type 2', powerKw: 22, status: 'available' },
      { connector: 'Type 2', powerKw: 22, status: 'occupied' },
      { connector: 'Type 2', powerKw: 22, status: 'available' },
      { connector: 'Type 2', powerKw: 22, status: 'occupied' },
      { connector: 'Bharat DC', powerKw: 10, status: 'occupied' },
      { connector: 'Bharat DC', powerKw: 10, status: 'faulty' },
    ],
  },
  {
    id: 'st-khairatabad',
    name: 'Khairatabad Central Point',
    areaId: 'khairatabad',
    address: 'Khairatabad circle, opposite Gandhi Bhavan',
    connectors: ['CCS2', 'Type 2'],
    speedTier: 'fast',
    maxPowerKw: 60,
    pricePerKwh: 14.9,
    ratingSum: 69,
    ratingCount: 16,
    amenities: ['24×7', 'CCTV', 'Parking'],
    mapX: 417,
    mapY: 344,
    specs: [
      { connector: 'CCS2', powerKw: 60, status: 'available' },
      { connector: 'CCS2', powerKw: 60, status: 'available' },
      { connector: 'Type 2', powerKw: 7.4, status: 'occupied' },
      { connector: 'Type 2', powerKw: 7.4, status: 'faulty' },
    ],
  },
  {
    id: 'st-secunderabad-parade',
    name: 'Parade Grounds Fast Chargers',
    areaId: 'secunderabad',
    address: 'Parade Grounds road, Secunderabad',
    connectors: ['CCS2', 'CHAdeMO', 'Type 2'],
    speedTier: 'rapid',
    maxPowerKw: 120,
    pricePerKwh: 15.9,
    ratingSum: 129,
    ratingCount: 28,
    amenities: ['24×7', 'Convenience store', 'Parking'],
    mapX: 552,
    mapY: 130,
    specs: [
      { connector: 'CCS2', powerKw: 120, status: 'available' },
      { connector: 'CCS2', powerKw: 120, status: 'available' },
      { connector: 'CCS2', powerKw: 120, status: 'occupied' },
      { connector: 'CHAdeMO', powerKw: 50, status: 'available' },
      { connector: 'CHAdeMO', powerKw: 50, status: 'occupied' },
      { connector: 'Type 2', powerKw: 22, status: 'available' },
      { connector: 'Type 2', powerKw: 22, status: 'occupied' },
      { connector: 'Type 2', powerKw: 22, status: 'faulty' },
    ],
  },
  {
    id: 'st-ameerpet-metro',
    name: 'Ameerpet Metro Plaza AC Bay',
    areaId: 'ameerpet',
    address: 'Metro pillar 76, Ameerpet',
    connectors: ['Type 2', 'Bharat DC'],
    speedTier: 'slow',
    maxPowerKw: 22,
    pricePerKwh: 10.8,
    ratingSum: 95,
    ratingCount: 21,
    amenities: ['Covered parking', 'Café', 'Restrooms'],
    mapX: 462,
    mapY: 264,
    specs: [
      { connector: 'Type 2', powerKw: 22, status: 'available' },
      { connector: 'Type 2', powerKw: 22, status: 'available' },
      { connector: 'Type 2', powerKw: 22, status: 'occupied' },
      { connector: 'Type 2', powerKw: 22, status: 'available' },
      { connector: 'Bharat DC', powerKw: 10, status: 'occupied' },
      { connector: 'Bharat DC', powerKw: 10, status: 'faulty' },
    ],
  },
  {
    id: 'st-kukatpally-forum',
    name: 'Forum Mall Kukatpally Chargers',
    areaId: 'kukatpally',
    address: 'Forum Sujana Mall basement, Kukatpally',
    connectors: ['CCS2', 'Type 2'],
    speedTier: 'fast',
    maxPowerKw: 60,
    pricePerKwh: 13.9,
    ratingSum: 103,
    ratingCount: 22,
    amenities: ['Parking', 'Café', 'CCTV', 'Restrooms'],
    mapX: 383,
    mapY: 174,
    specs: [
      { connector: 'CCS2', powerKw: 60, status: 'available' },
      { connector: 'CCS2', powerKw: 60, status: 'available' },
      { connector: 'CCS2', powerKw: 60, status: 'occupied' },
      { connector: 'Type 2', powerKw: 7.4, status: 'occupied' },
      { connector: 'Type 2', powerKw: 7.4, status: 'occupied' },
      { connector: 'Type 2', powerKw: 7.4, status: 'occupied' },
    ],
  },
  {
    id: 'st-mehdipatnam',
    name: 'Mehdipatnam Cross Road Chargers',
    areaId: 'mehdipatnam',
    address: 'Cross road, Mehdipatnam',
    connectors: ['CCS2', 'Type 2'],
    speedTier: 'fast',
    maxPowerKw: 60,
    pricePerKwh: 14.2,
    ratingSum: 57,
    ratingCount: 13,
    amenities: ['Parking', '24×7'],
    mapX: 287,
    mapY: 314,
    specs: [
      { connector: 'CCS2', powerKw: 60, status: 'available' },
      { connector: 'CCS2', powerKw: 60, status: 'available' },
      { connector: 'Type 2', powerKw: 22, status: 'available' },
      { connector: 'Type 2', powerKw: 22, status: 'faulty' },
    ],
  },
  {
    id: 'st-lb-nagar-hub',
    name: 'LB Nagar Charging Hub',
    areaId: 'lb-nagar',
    address: 'LB Nagar cross road, near MMTS station',
    connectors: ['CCS2', 'CHAdeMO', 'Type 2'],
    speedTier: 'rapid',
    maxPowerKw: 100,
    pricePerKwh: 15.4,
    ratingSum: 77,
    ratingCount: 17,
    amenities: ['24×7', 'Parking', 'Convenience store'],
    mapX: 472,
    mapY: 566,
    specs: [
      { connector: 'CCS2', powerKw: 100, status: 'available' },
      { connector: 'CCS2', powerKw: 100, status: 'available' },
      { connector: 'CCS2', powerKw: 100, status: 'occupied' },
      { connector: 'CHAdeMO', powerKw: 50, status: 'available' },
      { connector: 'Type 2', powerKw: 22, status: 'occupied' },
      { connector: 'Type 2', powerKw: 22, status: 'faulty' },
    ],
  },
];

/** Approximate straight-line distance factor from simulated map pixels to km. */
const PIXEL_TO_KM = 1.2 * 0.042;

export function mapDistanceKm(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy) * PIXEL_TO_KM;
}

export function seedStations(homeAreaId = 'jubilee-hills'): ChargingStation[] {
  const home = AREAS.find((a) => a.id === homeAreaId) ?? AREAS[6];
  return STATION_SEEDS.map((seed) => ({
    id: seed.id,
    name: seed.name,
    areaId: seed.areaId,
    address: seed.address,
    connectors: seed.connectors,
    speedTier: seed.speedTier,
    maxPowerKw: seed.maxPowerKw,
    pricePerKwh: seed.pricePerKwh,
    ratingSum: seed.ratingSum,
    ratingCount: seed.ratingCount,
    amenities: seed.amenities,
    distanceKm: Math.round(mapDistanceKm(seed.mapX, seed.mapY, home.x, home.y) * 10) / 10,
    mapX: seed.mapX,
    mapY: seed.mapY,
    points: makePoints(seed.id, seed.specs),
  }));
}

// ---------------------------------------------------------------------------
// Booking slots
// ---------------------------------------------------------------------------

/** Predefined slot start times for the demonstration (90-minute blocks). */
export const SLOT_TIMES = [
  '06:00',
  '07:30',
  '09:00',
  '10:30',
  '12:00',
  '13:30',
  '15:00',
  '16:30',
  '18:00',
  '19:30',
  '21:00',
] as const;

export const SLOT_MINUTES = 90;

// ---------------------------------------------------------------------------
// Seed bookings / transactions / notifications / reviews
// ---------------------------------------------------------------------------

function dayOffset(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function estimate(session: {
  station: ChargingStation;
  batteryKwh: number;
  fromPercent: number;
  toPercent: number;
}): { kwh: number; cost: number } {
  const kwh =
    Math.round(session.batteryKwh * ((session.toPercent - session.fromPercent) / 100) * 10) / 10;
  return { kwh, cost: Math.round(kwh * session.station.pricePerKwh) };
}

export function seedBookings(): Booking[] {
  const stations = seedStations();
  const jubilee = stations.find((s) => s.id === 'st-jubilee-hub')!;
  const gachi = stations.find((s) => s.id === 'st-gachibowli-dc')!;
  const khair = stations.find((s) => s.id === 'st-khairatabad')!;
  const kukat = stations.find((s) => s.id === 'st-kukatpally-forum')!;
  const nexon = SEED_VEHICLES[0];

  const gachiCost = estimate({ station: gachi, batteryKwh: nexon.batteryKwh, fromPercent: 40, toPercent: 75 });
  const kukatEst = estimate({ station: kukat, batteryKwh: nexon.batteryKwh, fromPercent: 40, toPercent: 80 });

  const now = Date.now();

  return [
    {
      id: 'bk-1001',
      ref: 'CF-8K2M41',
      stationId: kukat.id,
      date: toISODate(dayOffset(1)),
      time: '09:00',
      slotMinutes: SLOT_MINUTES,
      status: 'upcoming',
      owner: 'me',
      driverName: DEMO_USER.name,
      estimatedKwh: kukatEst.kwh,
      estimatedCost: kukatEst.cost,
      createdAt: now - 18 * 60 * 60 * 1000,
    },
    {
      id: 'bk-1002',
      ref: 'CF-3T9QD7',
      stationId: gachi.id,
      date: toISODate(dayOffset(-5)),
      time: '18:00',
      slotMinutes: SLOT_MINUTES,
      status: 'completed',
      owner: 'me',
      driverName: DEMO_USER.name,
      estimatedKwh: gachiCost.kwh,
      estimatedCost: gachiCost.cost,
      createdAt: now - 6 * 24 * 60 * 60 * 1000,
      completedAt: now - 5 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000,
    },
    {
      id: 'bk-1003',
      ref: 'CF-6H4LP2',
      stationId: khair.id,
      date: toISODate(dayOffset(-3)),
      time: '12:00',
      slotMinutes: SLOT_MINUTES,
      status: 'cancelled',
      owner: 'me',
      driverName: DEMO_USER.name,
      estimatedKwh: 13.5,
      estimatedCost: 201,
      createdAt: now - 4 * 24 * 60 * 60 * 1000,
      cancelledAt: now - 3 * 24 * 60 * 60 * 1000,
    },
    // Other demo drivers' reservations (block slots in the explorer).
    {
      id: 'bk-2001',
      ref: 'CF-5R1WX8',
      stationId: jubilee.id,
      date: toISODate(dayOffset(1)),
      time: '18:00',
      slotMinutes: SLOT_MINUTES,
      status: 'upcoming',
      owner: 'other',
      driverName: 'Sneha R.',
      estimatedKwh: 20,
      estimatedCost: 310,
      createdAt: now - 5 * 60 * 60 * 1000,
    },
    {
      id: 'bk-2002',
      ref: 'CF-2Z7VC5',
      stationId: gachi.id,
      date: toISODate(dayOffset(0)),
      time: '19:30',
      slotMinutes: SLOT_MINUTES,
      status: 'upcoming',
      owner: 'other',
      driverName: 'Karthik M.',
      estimatedKwh: 24,
      estimatedCost: 403,
      createdAt: now - 2 * 60 * 60 * 1000,
    },
    {
      id: 'bk-2003',
      ref: 'CF-9J3BE6',
      stationId: khair.id,
      date: toISODate(dayOffset(2)),
      time: '15:00',
      slotMinutes: SLOT_MINUTES,
      status: 'upcoming',
      owner: 'other',
      driverName: 'Ananya S.',
      estimatedKwh: 16,
      estimatedCost: 238,
      createdAt: now - 40 * 60 * 60 * 1000,
    },
  ];
}

export function seedTransactions(): Transaction[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return [
    {
      id: 'tx-501',
      type: 'topup',
      description: 'Wallet top-up via UPI',
      amount: 1000,
      status: 'successful',
      method: 'upi',
      createdAt: now - 9 * day,
    },
    {
      id: 'tx-502',
      type: 'payment',
      description: 'Charging session · Gachibowli Circle DC',
      amount: -210,
      status: 'successful',
      method: 'wallet',
      createdAt: now - 5 * day + 2 * 60 * 60 * 1000,
    },
    {
      id: 'tx-503',
      type: 'topup',
      description: 'Wallet top-up via card',
      amount: 800,
      status: 'successful',
      method: 'card',
      createdAt: now - 4 * day,
    },
    {
      id: 'tx-504',
      type: 'payment',
      description: 'Charging session · Mindspace Madhapur',
      amount: -186,
      status: 'successful',
      method: 'wallet',
      createdAt: now - 2 * day,
    },
    {
      id: 'tx-505',
      type: 'payment',
      description: 'Quick top-up · Khairatabad Central',
      amount: -52,
      status: 'successful',
      method: 'upi',
      createdAt: now - 1 * day,
    },
  ];
}

export function seedNotifications(): AppNotification[] {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  return [
    {
      id: 'nt-0',
      type: 'reminder',
      title: 'Upcoming reservation',
      body: 'Your slot at Forum Mall Kukatpally starts tomorrow at 09:00 (CF-8K2M41). Arrive a few minutes early to plug in.',
      createdAt: now - 6 * hour,
      read: false,
    },
    {
      id: 'nt-1',
      type: 'booking',
      title: 'Booking confirmed',
      body: 'Your slot at Forum Mall Kukatpally is reserved for tomorrow, 09:00 (CF-8K2M41).',
      createdAt: now - 17 * hour,
      read: false,
    },
    {
      id: 'nt-2',
      type: 'fault',
      title: 'Charger fault reported',
      body: 'P7 (CHAdeMO 50 kW) at ChargeFlow Hub · Jubilee Hills is marked faulty in the simulated feed.',
      createdAt: now - 12 * hour,
      read: false,
    },
    {
      id: 'nt-3',
      type: 'wallet',
      title: 'Wallet topped up',
      body: '₹800 added to your ChargeFlow wallet via card.',
      createdAt: now - 4 * 24 * hour,
      read: true,
    },
    {
      id: 'nt-4',
      type: 'session',
      title: 'Charging session completed',
      body: 'Session at Mindspace Madhapur ended · 12.8 kWh delivered · ₹186 charged to wallet.',
      createdAt: now - 2 * 24 * hour,
      read: true,
    },
    {
      id: 'nt-5',
      type: 'cancellation',
      title: 'Booking cancelled',
      body: 'Reservation CF-6H4LP2 at Khairatabad Central was cancelled and the slot released.',
      createdAt: now - 3 * 24 * hour,
      read: true,
    },
  ];
}

/** Completed demo charging sessions (values follow the same formula as live sessions). */
export function seedSessions(): ChargingSession[] {
  const stations = seedStations();
  const gachi = stations.find((s) => s.id === 'st-gachibowli-dc')!;
  const madhapur = stations.find((s) => s.id === 'st-madhapur-plaza')!;
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const gachiPoint = gachi.points.find((p) => p.connector === 'Type 2') ?? gachi.points[0];
  const madhaPoint = madhapur.points[0];

  return [
    {
      id: 'ss-101',
      stationId: gachi.id,
      pointId: gachiPoint.id,
      connector: gachiPoint.connector,
      powerKw: gachiPoint.powerKw,
      bookingId: 'bk-1002',
      status: 'completed',
      startedAt: now - 5 * day,
      endedAt: now - 5 * day + 40 * 60 * 1000,
      energyKwh: 12.5,
      cost: 210,
      paymentMethod: 'wallet',
      startPercent: 45,
      targetPercent: 75,
    },
    {
      id: 'ss-102',
      stationId: madhapur.id,
      pointId: madhaPoint.id,
      connector: madhaPoint.connector,
      powerKw: madhaPoint.powerKw,
      status: 'completed',
      startedAt: now - 2 * day + 10 * 60 * 60 * 1000,
      endedAt: now - 2 * day + 10 * 60 * 60 * 1000 + 15 * 60 * 1000,
      energyKwh: 12.8,
      cost: 186,
      paymentMethod: 'wallet',
      startPercent: 50,
      targetPercent: 78,
    },
  ];
}

export function seedReviews(): Review[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return [
    {
      id: 'rv-1',
      stationId: 'st-jubilee-hub',
      author: 'Sneha R.',
      rating: 5,
      text: 'Two CCS2 bays free on a weekday evening. Café upstairs is a bonus while the car charges.',
      createdAt: now - 6 * day,
      mine: false,
    },
    {
      id: 'rv-2',
      stationId: 'st-jubilee-hub',
      author: 'Devansh K.',
      rating: 4,
      text: 'Chargers work fine, parking gets tight after 7 pm.',
      createdAt: now - 14 * day,
      mine: false,
    },
    {
      id: 'rv-3',
      stationId: 'st-gachibowli-dc',
      author: 'Karthik M.',
      rating: 5,
      text: 'Fastest simulated top-up near the Financial District. One CHAdeMO unit was down though.',
      createdAt: now - 3 * day,
      mine: false,
    },
    {
      id: 'rv-4',
      stationId: 'st-madhapur-plaza',
      author: 'Ananya S.',
      rating: 4,
      text: 'Quiet spot behind Mindspace. Type 2 points are usually available in the morning.',
      createdAt: now - 9 * day,
      mine: false,
    },
    {
      id: 'rv-5',
      stationId: 'st-hitec-express',
      author: 'Rohit P.',
      rating: 4,
      text: 'Good for a quick top-up before heading to Gachibowli.',
      createdAt: now - 11 * day,
      mine: false,
    },
    {
      id: 'rv-6',
      stationId: 'st-kukatpally-forum',
      author: 'Meera J.',
      rating: 5,
      text: 'Basement parking, easy access, and the mall means there is always something to do.',
      createdAt: now - 5 * day,
      mine: false,
    },
  ];
}

export interface PaymentMethodOption {
  id: 'upi' | 'card' | 'wallet';
  label: string;
  detail: string;
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  { id: 'upi', label: 'UPI', detail: 'arjun@upi (demo)' },
  { id: 'card', label: 'Credit / Debit Card', detail: 'Demo card •••• 4242' },
  { id: 'wallet', label: 'ChargeFlow Wallet', detail: 'Instant, no extra steps' },
];

export const CHARGER_STATUS_META: Record<
  ChargingPoint['status'],
  { label: string; tone: 'ev' | 'warn' | 'danger' }
> = {
  available: { label: 'Available', tone: 'ev' },
  occupied: { label: 'Occupied', tone: 'warn' },
  faulty: { label: 'Faulty', tone: 'danger' },
};

export const SPEED_TIER_META: Record<ChargingStation['speedTier'], { label: string; hint: string }> = {
  slow: { label: 'AC slow', hint: 'Up to 22 kW' },
  fast: { label: 'DC fast', hint: '40 – 60 kW' },
  rapid: { label: 'DC rapid', hint: '100 kW and above' },
};
