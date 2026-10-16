import { MotionConfig } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { DriverShell } from './components/layout/DriverShell';
import { OperatorShell } from './components/layout/OperatorShell';
import BookingPage from './pages/Booking';
import Bookings from './pages/Bookings';
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import Landing from './pages/Landing';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import RoutePlanner from './pages/RoutePlanner';
import Sessions from './pages/Sessions';
import Wallet from './pages/Wallet';
import {
  OperatorBookings,
  OperatorChargers,
  OperatorOverview,
  OperatorPerformance,
  OperatorStations,
} from './pages/operator/OperatorPages';
import { AppProvider, useApp } from './store/AppContext';
import type { ReactNode } from 'react';

function RequireDriver({ children }: { children: ReactNode }) {
  const { state } = useApp();
  const location = useLocation();
  if (!state.auth.signedIn || state.auth.role !== 'driver') {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }
  return <>{children}</>;
}

function RequireOperator({ children }: { children: ReactNode }) {
  const { state } = useApp();
  const location = useLocation();
  if (!state.auth.signedIn || state.auth.role !== 'operator') {
    return <Navigate to="/login?mode=operator" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* Driver app */}
      <Route
        element={
          <RequireDriver>
            <DriverShell />
          </RequireDriver>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/planner" element={<RoutePlanner />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/book/:stationId" element={<BookingPage />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Operator console */}
      <Route
        path="/operator"
        element={
          <RequireOperator>
            <OperatorShell />
          </RequireOperator>
        }
      >
        <Route index element={<OperatorOverview />} />
        <Route path="stations" element={<OperatorStations />} />
        <Route path="chargers" element={<OperatorChargers />} />
        <Route path="bookings" element={<OperatorBookings />} />
        <Route path="performance" element={<OperatorPerformance />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </MotionConfig>
  );
}
