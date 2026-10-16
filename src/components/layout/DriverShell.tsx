import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  CalendarCheck,
  Compass,
  Gauge,
  LogOut,
  MapPin,
  Menu,
  RotateCcw,
  Route,
  User,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { formatINR } from '../../lib/format';
import { unreadNotificationCount, useApp } from '../../store/AppContext';
import { Button, ConfirmDialog } from '../ui';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <Gauge className="h-4.5 w-4.5" /> },
  { to: '/explore', label: 'Explore Stations', icon: <MapPin className="h-4.5 w-4.5" /> },
  { to: '/planner', label: 'Route Planner', icon: <Route className="h-4.5 w-4.5" /> },
  { to: '/bookings', label: 'My Bookings', icon: <CalendarCheck className="h-4.5 w-4.5" /> },
  { to: '/sessions', label: 'Charging Sessions', icon: <Zap className="h-4.5 w-4.5" /> },
  { to: '/wallet', label: 'Wallet', icon: <Wallet className="h-4.5 w-4.5" /> },
  { to: '/notifications', label: 'Notifications', icon: <Bell className="h-4.5 w-4.5" /> },
  { to: '/profile', label: 'Profile & Vehicle', icon: <User className="h-4.5 w-4.5" /> },
];

export function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'h-7 w-7 rounded-lg' : 'h-9 w-9 rounded-xl';
  return (
    <span className={`${box} inline-flex shrink-0 items-center justify-center bg-ev text-void`}>
      <Zap className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} fill="currentColor" />
    </span>
  );
}

function navLinkClass(active: boolean): string {
  return `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
    active
      ? 'bg-ev-soft text-ev font-medium'
      : 'text-dim hover:bg-raised hover:text-ink'
  }`;
}

function NavList({ unread, onNavigate }: { unread: number; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Driver navigation">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) => navLinkClass(isActive)}
        >
          <span className="shrink-0 opacity-90">{item.icon}</span>
          <span className="flex-1">{item.label}</span>
          {item.to === '/notifications' && unread > 0 && (
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-ev px-1.5 text-2xs font-bold text-void">
              {unread}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function ResetAction({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-dim transition-colors hover:bg-raised hover:text-ink"
    >
      <RotateCcw className="h-4.5 w-4.5 shrink-0" />
      Reset demo data
    </button>
  );
}

export function DriverShell() {
  const { state, signOut, resetDemo } = useApp();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const unread = unreadNotificationCount(state);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const current = NAV_ITEMS.find((n) => location.pathname.startsWith(n.to));

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <BrandMark />
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-ink">ChargeFlow</p>
            <p className="text-2xs text-faint">Smart EV Charging</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <p className="label-caps px-3 pb-2">Driver</p>
          <NavList unread={unread} />
        </div>

        <div className="border-t border-line p-3">
          <div className="mb-2 flex items-center gap-3 rounded-lg bg-raised px-3 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ev-soft text-xs font-bold text-ev">
              {state.profile.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-xs font-medium text-ink">{state.profile.name}</p>
              <p className="truncate text-2xs text-faint">Demo driver account</p>
            </div>
          </div>
          <ResetAction onOpen={() => setResetOpen(true)} />
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-dim transition-colors hover:bg-raised hover:text-danger"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-line bg-void/85 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="rounded-lg p-2 text-dim transition-colors hover:bg-raised hover:text-ink lg:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 lg:hidden">
              <BrandMark size="sm" />
              <span className="text-sm font-semibold text-ink">ChargeFlow</span>
            </div>

            <p className="hidden text-sm text-faint lg:block">
              {current?.label ?? 'Driver app'}{' '}
              <span className="text-line-strong">/</span>{' '}
              <span className="text-2xs uppercase tracking-wider text-faint">Simulated data</span>
            </p>

            <div className="ml-auto flex items-center gap-2">
              <NavLink
                to="/wallet"
                className="hidden items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-dim transition-colors hover:border-ev/50 hover:text-ev sm:flex"
                title="ChargeFlow wallet balance"
              >
                <Wallet className="h-3.5 w-3.5" />
                {formatINR(state.walletBalance)}
              </NavLink>
              <NavLink
                to="/notifications"
                className="relative rounded-lg border border-line bg-surface p-2 text-dim transition-colors hover:border-ev/50 hover:text-ev"
                aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ev px-1 text-[10px] font-bold text-void">
                    {unread}
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/profile"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-raised text-xs font-bold text-ink transition-colors hover:ring-2 hover:ring-ev/40"
                aria-label="Open profile"
              >
                {state.profile.name.slice(0, 1).toUpperCase()}
              </NavLink>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        <footer className="border-t border-line px-4 py-4 text-center text-2xs text-faint sm:px-6 lg:px-8">
          ChargeFlow frontend prototype · All station, availability, pricing and payment data is
          simulated for demonstration.
        </footer>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="absolute inset-0 bg-void/80" onClick={() => setDrawerOpen(false)} />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-line bg-surface shadow-pop"
              role="dialog"
              aria-label="Navigation menu"
            >
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <BrandMark />
                  <span className="text-sm font-semibold text-ink">ChargeFlow</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation menu"
                  className="rounded-lg p-1.5 text-faint hover:bg-raised hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 pb-4">
                <NavList unread={unread} onNavigate={() => setDrawerOpen(false)} />
              </div>
              <div className="border-t border-line p-3">
                <ResetAction
                  onOpen={() => {
                    setDrawerOpen(false);
                    setResetOpen(true);
                  }}
                />
                <button
                  type="button"
                  onClick={signOut}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-dim hover:bg-raised hover:text-danger"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={resetOpen}
        title="Reset demonstration data?"
        description="This restores the original stations, charger statuses, bookings, wallet balance, transactions, notifications, reviews and sessions. Only ChargeFlow's stored demo data is affected — other browser data is untouched."
        confirmLabel="Reset demo data"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {
          resetDemo();
          setResetOpen(false);
        }}
        onCancel={() => setResetOpen(false)}
      />
    </div>
  );
}

export function CompassGlyph() {
  return <Compass className="h-4 w-4" />;
}
