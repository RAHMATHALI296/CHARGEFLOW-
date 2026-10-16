// ChargeFlow core-logic verification — run with esbuild + node (no browser needed).
import {
  AREAS,
  INITIAL_BALANCE,
  SLOT_TIMES,
  seedBookings,
  seedNotifications,
  seedSessions,
  seedStations,
  seedTransactions,
  SEED_VEHICLES,
} from '../src/data/mockData';
import { formatINR, formatDate, formatTime } from '../src/lib/format';
import { estimateBetweenAreas, stationsAlongCorridor, areaById } from '../src/lib/geo';
import {
  slotAvailability,
  slotDates,
  slotStart,
  SLOT_REASON_TEXT,
} from '../src/lib/slots';

let failures = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

console.log('\n1. Station dataset consistency');
const stations = seedStations();
check('has stations for the demo', stations.length >= 10, `${stations.length} stations`);
for (const s of stations) {
  const avail = s.points.filter((p) => p.status === 'available').length;
  const occ = s.points.filter((p) => p.status === 'occupied').length;
  const faulty = s.points.filter((p) => p.status === 'faulty').length;
  check(
    `${s.name}: counts sum to total`,
    avail + occ + faulty === s.points.length && s.points.length > 0,
    `${avail}+${occ}+${faulty} vs ${s.points.length}`,
  );
  check(`${s.name}: distance plausible`, s.distanceKm >= 0.5 && s.distanceKm <= 30, `${s.distanceKm} km`);
  check(`${s.name}: price plausible`, s.pricePerKwh >= 5 && s.pricePerKwh <= 25, `${s.pricePerKwh}`);
  check(`${s.name}: rating 0..5`, s.ratingSum / s.ratingCount > 0 && s.ratingSum / s.ratingCount <= 5);
  check(`${s.name}: points carry connector+power`, s.points.every((p) => p.powerKw > 0 && p.connector.length > 0));
}
check(
  'covered neighbourhoods include the brief list',
  ['khairatabad', 'banjara-hills', 'jubilee-hills', 'madhapur', 'gachibowli', 'hitech-city', 'secunderabad'].every(
    (id) => stations.some((s) => s.areaId === id),
  ),
);

console.log('\n2. Wallet consistency');
const txs = seedTransactions();
const sum = txs.filter((t) => t.status === 'successful').reduce((a, t) => a + t.amount, 0);
check(`seeded transactions sum to the initial balance (${formatINR(INITIAL_BALANCE)})`, sum === INITIAL_BALANCE, `sum=${sum}`);
check('transaction statuses valid', txs.every((t) => ['successful', 'failed', 'pending'].includes(t.status)));

console.log('\n3. Booking slots');
const dates = slotDates(3);
check('offers today + 2 days', dates.length === 3 && dates[0].isToday);
check('slot times defined', SLOT_TIMES.length >= 8);
const bookings = seedBookings();
const futureDate = dates[1].iso;
const reservedBooking = bookings.find((b) => b.status === 'upcoming' && b.date === futureDate);
if (reservedBooking) {
  const av = slotAvailability(reservedBooking.stationId, reservedBooking.date, reservedBooking.time, bookings, true);
  check('reserved slot is blocked with a reason', !av.available && av.reason === 'reserved', SLOT_REASON_TEXT.reserved);
}
const openSlot = slotAvailability('st-mehdipatnam', futureDate, '06:00', bookings, true);
check('free future slot is bookable', openSlot.available === true);
const past = slotAvailability('st-mehdipatnam', dates[0].iso, '06:00', bookings, true, Date.now() + 10 * 3600_000);
check('past slot blocked', !past.available && past.reason === 'past');
const offline = slotAvailability('st-mehdipatnam', futureDate, '07:30', bookings, false);
check('fully faulty station blocks slots', !offline.available && offline.reason === 'offline');
check(
  'seeded upcoming booking is in the future',
  bookings
    .filter((b) => b.status === 'upcoming')
    .every((b) => slotStart(b.date, b.time) + b.slotMinutes * 60_000 > Date.now()),
);
const myRefs = bookings.filter((b) => b.owner === 'me').map((b) => b.ref);
check('demo driver has bookings with unique refs', myRefs.length >= 3 && new Set(myRefs).size === myRefs.length);

console.log('\n4. Route estimation');
for (const a of AREAS) {
  for (const b of AREAS) {
    if (a.id === b.id) continue;
    const est = estimateBetweenAreas(a.id, b.id);
    if (!est || est.distanceKm < 1 || est.distanceKm > 60 || est.minutes < 6) {
      check(`${a.name} → ${b.name} sane estimate`, false, JSON.stringify(est));
    }
  }
}
check('all area pairs produce sane estimates', true);
const cor = stationsAlongCorridor(stations, areaById('ameerpet')!, areaById('gachibowli')!, 3);
check('corridor suggestions returned', cor.length > 0 && cor.length <= 3, `${cor.length} suggestions`);
check(
  'suggested corridor stations differ from destination cluster',
  cor.every((s) => s.mapX > 260 && s.mapX < 740),
);

console.log('\n5. Sessions & vehicle model');
const sessions = seedSessions();
check('seeded completed sessions exist', sessions.length >= 2 && sessions.every((s) => s.status === 'completed'));
check('session energy/cost positive', sessions.every((s) => (s.energyKwh ?? 0) > 0 && (s.cost ?? 0) > 0));
check('vehicle battery capacities sane', SEED_VEHICLES.every((v) => v.batteryKwh >= 4 && v.batteryKwh <= 100));

console.log('\n6. Notifications & formatting');
const notes = seedNotifications();
check('seeded notifications of mixed types', notes.length >= 4 && new Set(notes.map((n) => n.type)).size >= 4);
check('formatINR renders rupees', formatINR(1500) === '₹1,500', formatINR(1500));
check('formatTime renders clock time', /AM|PM/.test(formatTime('18:00')), formatTime('18:00'));
check('formatDate renders a readable date', formatDate(futureDate).length > 5, formatDate(futureDate));

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
