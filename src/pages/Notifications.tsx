import { motion } from 'framer-motion';
import {
  Bell,
  CalendarCheck,
  CalendarX2,
  Info,
  PlugZap,
  Wallet,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Chip, EmptyState, PageHeader } from '../components/ui';
import { formatRelative } from '../lib/format';
import { useApp } from '../store/AppContext';
import type { NotificationType } from '../types';

const TYPE_META: Record<NotificationType, { icon: typeof Bell; tone: 'ev' | 'warn' | 'danger' | 'info' | 'neutral' }> = {
  booking: { icon: CalendarCheck, tone: 'ev' },
  reminder: { icon: Info, tone: 'info' },
  cancellation: { icon: CalendarX2, tone: 'danger' },
  session: { icon: Zap, tone: 'ev' },
  fault: { icon: PlugZap, tone: 'danger' },
  wallet: { icon: Wallet, tone: 'info' },
  system: { icon: Info, tone: 'neutral' },
};

const FILTERS = [
  ['all', 'All'],
  ['unread', 'Unread'],
] as const;

export default function Notifications() {
  const { state, markNotificationRead, markAllNotificationsRead } = useApp();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unread = state.notifications.filter((n) => !n.read).length;
  const visible = state.notifications.filter((n) => (filter === 'unread' ? !n.read : true));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Updates"
        title="Notification centre"
        subtitle="Booking confirmations, upcoming reservations, charger faults, session updates and wallet activity — all simulated and stored locally."
        actions={
          <>
            <div className="flex gap-1.5" role="group" aria-label="Filter notifications">
              {FILTERS.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  aria-pressed={filter === id}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    filter === id
                      ? 'border-ev bg-ev-soft text-ev'
                      : 'border-line bg-surface text-dim hover:text-ink'
                  }`}
                >
                  {label}
                  {id === 'unread' && unread > 0 && (
                    <span className="ml-1.5 rounded-full bg-ev px-1.5 text-2xs font-bold text-void">
                      {unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={markAllNotificationsRead}
              disabled={unread === 0}
            >
              Mark all read
            </Button>
          </>
        }
      />

      {visible.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-5 w-5" />}
          title={filter === 'unread' ? 'You are all caught up' : 'No notifications yet'}
          description={
            filter === 'unread'
              ? 'Every notification has been read. Book a slot or run a session to generate new activity.'
              : 'Booking, session, charger and wallet updates will show up here as you use the prototype.'
          }
          action={
            <Link to="/explore">
              <Button size="sm" variant="secondary">
                Explore stations
              </Button>
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {visible.map((n, idx) => {
            const meta = TYPE_META[n.type];
            const Icon = meta.icon;
            return (
              <motion.li
                key={n.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.3) }}
                className={`panel flex items-start gap-4 px-4 py-3.5 ${
                  n.read ? 'opacity-75' : 'border-l-2 border-l-ev'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    meta.tone === 'ev'
                      ? 'bg-ev-soft text-ev'
                      : meta.tone === 'danger'
                        ? 'bg-danger-soft text-danger'
                        : meta.tone === 'warn'
                          ? 'bg-warn-soft text-warn'
                          : meta.tone === 'info'
                            ? 'bg-info-soft text-info'
                            : 'bg-raised text-dim'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-sm font-semibold ${n.read ? 'text-dim' : 'text-ink'}`}>
                      {n.title}
                    </p>
                    {!n.read && <Chip tone="ev">New</Chip>}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-dim">{n.body}</p>
                  <p className="mt-1.5 text-2xs text-faint">{formatRelative(n.createdAt)}</p>
                </div>

                {!n.read && (
                  <Button size="sm" variant="ghost" onClick={() => markNotificationRead(n.id)}>
                    Mark read
                  </Button>
                )}
              </motion.li>
            );
          })}
        </ul>
      )}

      <p className="text-2xs text-faint">
        Notifications are in-app records only — this prototype never requests push-permission or
        contacts any external service.
      </p>
    </div>
  );
}
