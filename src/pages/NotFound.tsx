import { Compass, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Chip } from '../components/ui';
import { BrandMark } from '../components/layout/DriverShell';
import { useApp } from '../store/AppContext';

export default function NotFound() {
  const { state } = useApp();
  const signedIn = state.auth.signedIn;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-void px-4 py-16 text-center">
      <div className="panel max-w-md p-8 shadow-pop">
        <div className="mx-auto flex items-center justify-center gap-2.5">
          <BrandMark />
          <span className="text-base font-semibold text-ink">ChargeFlow</span>
        </div>

        <p className="mt-6 text-5xl font-bold tracking-tight text-line-strong">404</p>
        <h1 className="mt-3 text-xl font-semibold text-ink">This route does not exist</h1>
        <p className="mt-2 text-sm leading-relaxed text-dim">
          The page you were looking for is not part of the ChargeFlow prototype. Head back to the
          homepage or jump straight into the station explorer.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to="/">
            <Button variant="secondary" icon={<Compass className="h-4 w-4" />}>
              Go home
            </Button>
          </Link>
          <Link to={signedIn ? '/dashboard' : '/login'}>
            <Button>{signedIn ? 'Open dashboard' : 'Sign in'}</Button>
          </Link>
        </div>

        <Link
          to="/explore"
          className="mt-4 inline-flex items-center gap-1.5 text-xs text-ev hover:underline"
        >
          <MapPin className="h-3.5 w-3.5" />
          Explore simulated stations instead
        </Link>

        <div className="mt-6 flex justify-center">
          <Chip tone="warn">Prototype · simulated data</Chip>
        </div>
      </div>
    </div>
  );
}
