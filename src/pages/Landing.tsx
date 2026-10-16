import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarCheck,
  MapPin,
  Menu,
  Navigation,
  Route,
  ShieldCheck,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CityMap } from '../components/map/CityMap';
import { Chip, SimulatedNotice } from '../components/ui';
import { AREAS } from '../data/mockData';
import { useApp } from '../store/AppContext';
import { BrandMark } from '../components/layout/DriverShell';

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Explore Stations', to: '/explore' },
  { label: 'How It Works', to: '/#how' },
  { label: 'About', to: '/#about' },
];

const FEATURES = [
  {
    icon: MapPin,
    title: 'Charger discovery',
    body: 'Browse a simulated map of Hyderabad with live-looking availability: free, occupied and faulty charging points, connectors, speeds and prices at a glance.',
  },
  {
    icon: CalendarCheck,
    title: 'Slot reservations',
    body: 'Reserve a 90-minute window at any station, get a booking reference, and manage upcoming, past and cancelled reservations in one place.',
  },
  {
    icon: Route,
    title: 'Journey planning',
    body: 'Pick a destination and ChargeFlow suggests charging stops along the way with estimated distance and travel time for the corridor.',
  },
  {
    icon: Wallet,
    title: 'Unified wallet',
    body: 'One demo wallet for top-ups and charging payments, with a clear transaction history — UPI, card and wallet options are all simulated.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Find',
    body: 'Search stations by name or neighbourhood and filter by availability, connector type and charging speed.',
  },
  {
    n: '02',
    title: 'Reserve',
    body: 'Choose an open time slot, review the estimated charging cost and confirm to get an instant booking reference.',
  },
  {
    n: '03',
    title: 'Charge',
    body: 'Track a simulated charging session in real time, settle it from your wallet, and keep every receipt in history.',
  },
];

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: 'Uncertainty, removed',
    body: 'See how many points are free before you detour — never arrive at a charger that is already taken.',
  },
  {
    icon: Navigation,
    title: 'Plan the whole trip',
    body: 'Destination-first planning surfaces convenient charging stops instead of leaving range to chance.',
  },
  {
    icon: Zap,
    title: 'One connected flow',
    body: 'Discovery, booking, session tracking, payments and history share a single coherent interface.',
  },
];

function PublicHeader() {
  const { state } = useApp();
  const [open, setOpen] = useState(false);
  const signedIn = state.auth.signedIn;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-void/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label="ChargeFlow home">
          <BrandMark />
          <span className="text-base font-semibold tracking-tight text-ink">ChargeFlow</span>
          <Chip tone="ev" className="hidden sm:inline-flex">
            Prototype
          </Chip>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_LINKS.map((l) =>
            l.to.startsWith('/#') ? (
              <a
                key={l.label}
                href={l.to.slice(1)}
                className="rounded-lg px-3 py-2 text-sm text-dim transition-colors hover:bg-raised hover:text-ink"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.label}
                to={l.to}
                className="rounded-lg px-3 py-2 text-sm text-dim transition-colors hover:bg-raised hover:text-ink"
              >
                {l.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {signedIn ? (
            <>
              <Link to="/dashboard" className="rounded-lg px-3 py-2 text-sm text-dim hover:text-ink">
                Dashboard
              </Link>
              <Link
                to="/explore"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-ev px-4 text-sm font-semibold text-void transition-colors hover:bg-ev-hover"
              >
                Find a Charger
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-3 py-2 text-sm text-dim hover:text-ink">
                Login
              </Link>
              <Link
                to="/login?from=/dashboard"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-ev px-4 text-sm font-semibold text-void transition-colors hover:bg-ev-hover"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-dim hover:bg-raised hover:text-ink md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-surface px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV_LINKS.map((l) =>
              l.to.startsWith('/#') ? (
                <a
                  key={l.label}
                  href={l.to.slice(1)}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-dim hover:bg-raised hover:text-ink"
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.label}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-dim hover:bg-raised hover:text-ink"
                >
                  {l.label}
                </Link>
              ),
            )}
            <div className="mt-2 flex gap-2">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-line-strong px-3 py-2.5 text-center text-sm text-dim"
              >
                Login
              </Link>
              <Link
                to={signedIn ? '/dashboard' : '/login?from=/dashboard'}
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg bg-ev px-3 py-2.5 text-center text-sm font-semibold text-void"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default function Landing() {
  const { state } = useApp();
  const navigate = useNavigate();
  const totalPoints = state.stations.reduce((acc, s) => acc + s.points.length, 0);
  const freePoints = state.stations.reduce(
    (acc, s) => acc + s.points.filter((p) => p.status === 'available').length,
    0,
  );

  const findCharger = () => navigate(state.auth.signedIn ? '/explore' : '/login?from=/explore');

  return (
    <div className="min-h-screen bg-void">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(700px 320px at 20% -10%, rgba(61,220,132,0.10), transparent 70%)',
          }}
          aria-hidden
        />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <Chip tone="ev">Smart EV Charging Platform · Hyderabad</Chip>
            <h1 className="mt-4 text-3xl font-bold leading-[1.1] tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]">
              Know a charger is free
              <span className="text-ev"> before you drive there.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-dim sm:text-base">
              ChargeFlow helps EV drivers discover charging stations, check simulated availability,
              reserve time slots, plan journeys and manage charging activity — in one calm,
              professional interface.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={findCharger}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-ev px-6 text-sm font-semibold text-void shadow-[0_16px_36px_-16px_rgba(61,220,132,0.6)] transition-all hover:bg-ev-hover active:translate-y-px"
              >
                <MapPin className="h-4 w-4" />
                Find a Charger
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#how"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-line-strong px-6 text-sm font-medium text-dim transition-colors hover:border-ev/50 hover:text-ink"
              >
                Explore How It Works
              </a>
            </div>

            <dl className="mt-9 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-5">
              {[
                { k: 'Simulated stations', v: state.stations.length },
                { k: 'Charging points', v: totalPoints },
                { k: 'Free right now', v: freePoints, tone: true },
              ].map((s) => (
                <div key={s.k}>
                  <dt className="text-2xs uppercase tracking-wider text-faint">{s.k}</dt>
                  <dd className={`mt-1 text-2xl font-semibold ${s.tone ? 'text-ev' : 'text-ink'}`}>
                    {s.v}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>

          {/* Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="panel overflow-hidden shadow-pop">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-medium text-ink">
                  <span className="h-2 w-2 rounded-full bg-ev" />
                  Availability map · Hyderabad
                </div>
                <span className="text-2xs text-faint">simulated feed</span>
              </div>
              <CityMap
                stations={state.stations}
                preview
                caption={false}
                className="aspect-[1000/640] rounded-none border-0"
              />
            </div>

            <div className="absolute -bottom-5 -left-3 hidden rounded-xl border border-line bg-surface px-4 py-3 shadow-pop sm:block">
              <p className="label-caps">Next open slot</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                Jubilee Hills · Today 16:30
              </p>
            </div>
            <div className="absolute -right-3 top-8 hidden rounded-xl border border-line bg-surface px-4 py-3 shadow-pop sm:block">
              <p className="label-caps">Wallet balance</p>
              <p className="mt-1 text-sm font-semibold text-ev">
                ₹{state.walletBalance.toLocaleString('en-IN')}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="label-caps">What you can do</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              Everything a driver needs, one platform
            </h2>
            <p className="mt-2 text-sm text-dim">
              ChargeFlow connects discovery, reservations, planning and payments so charging stops
              feeling fragmented.
            </p>
          </motion.div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <motion.article
                key={f.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.05 }}
                className="group panel p-5 transition-colors hover:border-ev/40"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ev-soft text-ev">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-dim">{f.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="label-caps">How it works</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              Three steps from low battery to fully charged
            </h2>
          </motion.div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <motion.div
                key={s.n}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: Number(s.n) * 0.05 }}
                className="panel relative overflow-hidden p-6"
              >
                <span className="text-4xl font-bold text-line-strong">{s.n}</span>
                <h3 className="mt-3 text-base font-semibold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-dim">{s.body}</p>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp} className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={findCharger}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-ev px-5 text-sm font-semibold text-void transition-colors hover:bg-ev-hover"
            >
              Try it now — Find a Charger
              <ArrowRight className="h-4 w-4" />
            </button>
            <SimulatedNotice />
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
          <motion.div {...fadeUp}>
            <p className="label-caps">Why ChargeFlow</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              Built around the driver's real questions
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-dim">
              Is a charger free? Will it fit my car? What will it cost? How long is the wait?
              ChargeFlow answers these before you leave, then carries you through booking, charging
              and payment without switching apps.
            </p>
          </motion.div>
          <div className="grid gap-3">
            {BENEFITS.map((b) => (
              <motion.div key={b.title} {...fadeUp} className="flex gap-4 panel p-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-raised text-ev">
                  <b.icon className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">{b.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-dim">{b.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="scroll-mt-20 border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2">
          <motion.div {...fadeUp}>
            <p className="label-caps">About</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              A smart charging platform for Hyderabad
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-dim">
              ChargeFlow is designed for electric vehicle drivers in Hyderabad, with a secondary
              console for station operators to manage charger statuses and reservations. It
              addresses range anxiety and charger uncertainty with availability insight, slot
              reservations and journey planning in a single experience.
            </p>
          </motion.div>
          <motion.div {...fadeUp} className="panel p-5">
            <p className="label-caps">Prototype disclosure</p>
            <p className="mt-2 text-sm leading-relaxed text-dim">
              This is a frontend prototype for demonstration. Station locations, availability,
              pricing, bookings, sessions and wallet balances are illustrative data stored locally
              in your browser. No real chargers, accounts or payments are involved, and no server
              receives your data.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Chip tone="info">Frontend only</Chip>
              <Chip tone="info">Local storage</Chip>
              <Chip tone="warn">Simulated data</Chip>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA + Footer */}
      <footer className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-ink">
                Ready to find your next charger?
              </h2>
              <p className="mt-1 text-sm text-dim">
                Open the explorer and see simulated availability across {AREAS.length} Hyderabad
                areas.
              </p>
            </div>
            <button
              type="button"
              onClick={findCharger}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-ev px-5 text-sm font-semibold text-void transition-colors hover:bg-ev-hover"
            >
              Find a Charger
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-8 py-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <BrandMark size="sm" />
                <span className="text-sm font-semibold text-ink">ChargeFlow</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-faint">
                Smart EV Charging Platform — a frontend prototype for driver discovery, reservations,
                journey planning and charging management.
              </p>
            </div>
            <div>
              <p className="label-caps">Product</p>
              <ul className="mt-3 space-y-2 text-sm text-dim">
                <li>
                  <Link to="/explore" className="hover:text-ev">
                    Explore Stations
                  </Link>
                </li>
                <li>
                  <Link to="/planner" className="hover:text-ev">
                    Route Planner
                  </Link>
                </li>
                <li>
                  <Link to="/bookings" className="hover:text-ev">
                    My Bookings
                  </Link>
                </li>
                <li>
                  <Link to="/wallet" className="hover:text-ev">
                    Wallet
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="label-caps">Account</p>
              <ul className="mt-3 space-y-2 text-sm text-dim">
                <li>
                  <Link to="/login" className="hover:text-ev">
                    Driver login
                  </Link>
                </li>
                <li>
                  <Link to="/login?mode=operator" className="hover:text-ev">
                    Operator demo
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="hover:text-ev">
                    Profile & vehicle
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="label-caps">Note</p>
              <p className="mt-3 text-xs leading-relaxed text-faint">
                Demonstration only. Availability, pricing, bookings and payments are simulated —
                never presented as verified live information.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-line pt-6 text-2xs text-faint sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} ChargeFlow · Ideathon prototype</p>
            <p>Hyderabad, Telangana · Frontend-only demo</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
