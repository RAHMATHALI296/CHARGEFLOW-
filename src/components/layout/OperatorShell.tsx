import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  CalendarClock,
  LayoutDashboard,
  LogOut,
  Menu,
  PlugZap,
  RotateCcw,
  Store,
  X,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { unreadNotificationCount, useApp } from '../../store/AppContext';
import { Button, Chip, ConfirmDialog } from '../ui';
import { BrandMark } from './DriverShell';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const OPERATOR_NAV: NavItem[] = [
  { to: '/operator', label: 'Overview', icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
  { to: '/operator/stations', label: 'Stations', icon: <Store className="h-4.5 w-4.5" /> },
  { to: '/operator/chargers', label: 'Charger Status', icon: <PlugZap className="h-4.5 w-4.5" /> },
  { to: '/operator/bookings', label: 'Reservations', icon: <CalendarClock className="h-4.5 w-4.5" /> },
  { to: '/operator/performance', label: 'Performance', icon: <BarChart3 className="h-4.5 w-4.5" /> },
];

function operatorLinkClass({ isActive }: { isActive: boolean }): string {
  return `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
    isActive ? 'bg-info-soft text-info font-medium' : 'text-dim hover:bg-raised hover:text-ink'
  }`;
}

export function OperatorShell() {
  const { state, signOut, resetDemo } = useApp();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const unread = unreadNotificationCount(state);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const current = OPERATOR_NAV.find(
    (n) => (n.to === '/operator' ? location.pathname === '/operator' : location.pathname.startsWith(n.to)),
  );

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Operator navigation">
      {OPERATOR_NAV.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.to === '/operator'} className={operatorLinkClass}>
          <span className="shrink-0">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <BrandMark />
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-ink">ChargeFlow</p>
            <p className="text-2xs text-faint">Operator console</p>
          </div>
        </div>

        <div className="mx-3 mb-3">
          <Chip tone="info">Operator demo · simulated</Chip>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <p className="label-caps px-3 pb-2">Operations</p>
          {nav}
        </div>

        <div className="border-t border-line p-3">
          <NavLink
            to="/dashboard"
            className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-dim transition-colors hover:bg-raised hover:text-ev"
          >
            Back to driver app
          </NavLink>
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-dim transition-colors hover:bg-raised hover:text-ink"
          >
            <RotateCcw className="h-4.5 w-4.5 shrink-0" />
            Reset demo data
          </button>
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
              <span className="text-sm font-semibold text-ink">Operator</span>
            </div>
            <p className="hidden text-sm text-faint lg:block">
              {current?.label ?? 'Operator'}{' '}
              <span className="text-line-strong">/</span>{' '}
              <span className="text-2xs uppercase tracking-wider text-faint">
                all operator data is simulated
              </span>
            </p>
            <div className="ml-auto flex items-center gap-2">
              {unread > 0 && (
                <NavLink
                  to="/notifications"
                  className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-dim hover:border-ev/50 hover:text-ev"
                >
                  {unread} unread updates
                </NavLink>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setResetOpen(true)}
                className="hidden sm:inline-flex"
                icon={<RotateCcw className="h-3.5 w-3.5" />}
              >
                Reset
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        <footer className="border-t border-line px-4 py-4 text-center text-2xs text-faint sm:px-6 lg:px-8">
          ChargeFlow operator console — demonstration interface only. Status changes are simulated
          and shared with the driver experience through local storage.
        </footer>
      </div>

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
              aria-label="Operator navigation menu"
            >
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <BrandMark />
                  <span className="text-sm font-semibold text-ink">Operator console</span>
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
              <div className="flex-1 overflow-y-auto px-3 pb-4">{nav}</div>
              <div className="border-t border-line p-3">
                <NavLink
                  to="/dashboard"
                  className="block rounded-lg px-3 py-2 text-sm text-dim hover:bg-raised hover:text-ev"
                >
                  Back to driver app
                </NavLink>
                <button
                  type="button"
                  onClick={signOut}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-dim hover:bg-raised hover:text-danger"
                >
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
        description="Stations, charger statuses, bookings, wallet, transactions, notifications, reviews and sessions all return to their original demo state. Only ChargeFlow's stored data is affected."
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
