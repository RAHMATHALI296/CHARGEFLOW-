import { Car, CheckCircle2, MapPin, ShieldQuestion, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  Field,
  Input,
  PageHeader,
  Select,
  SimulatedNotice,
} from '../components/ui';
import { AREAS } from '../data/mockData';
import { useApp, vehicleOf } from '../store/AppContext';
import type { ConnectorType } from '../types';

const CONNECTORS: ConnectorType[] = ['CCS2', 'Type 2', 'CHAdeMO', 'Bharat DC'];

export default function Profile() {
  const { state, saveProfile, update } = useApp();
  const vehicle = vehicleOf(state);

  const [name, setName] = useState(state.profile.name);
  const [email, setEmail] = useState(state.profile.email);
  const [homeArea, setHomeArea] = useState(state.profile.homeAreaId);
  const [vehicleId, setVehicleId] = useState(state.profile.vehicleId);
  const [preferredConnector, setPreferredConnector] = useState(state.profile.preferredConnector);
  const [chargeTarget, setChargeTarget] = useState(state.profile.chargeTargetPercent);
  const [fareAlerts, setFareAlerts] = useState(state.profile.fareAlerts);

  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Editable fields for the selected vehicle
  const [vBrand, setVBrand] = useState(vehicle.brand);
  const [vModel, setVModel] = useState(vehicle.model);
  const [vBattery, setVBattery] = useState(String(vehicle.batteryKwh));
  const [vRange, setVRange] = useState(String(vehicle.rangeKm));
  const [vConnector, setVConnector] = useState<ConnectorType>(vehicle.connector);

  useEffect(() => {
    const v = state.vehicles.find((x) => x.id === vehicleId) ?? state.vehicles[0];
    if (!v) return;
    setVBrand(v.brand);
    setVModel(v.model);
    setVBattery(String(v.batteryKwh));
    setVRange(String(v.rangeKm));
    setVConnector(v.connector);
  }, [vehicleId, state.vehicles]);

  const selectedVehicle = state.vehicles.find((v) => v.id === vehicleId) ?? vehicle;

  const saveAll = () => {
    const nextErrors: { name?: string; email?: string } = {};
    if (!name.trim()) nextErrors.name = 'Display name cannot be empty.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
      nextErrors.email = 'Enter a valid email address for the demo account.';
    const battery = Number(vBattery);
    const range = Number(vRange);
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.email) return;

    const batteryOk = Number.isFinite(battery) && battery >= 1 && battery <= 200;
    const rangeOk = Number.isFinite(range) && range >= 10 && range <= 1000;
    if (!batteryOk || !rangeOk) {
      setVehicleError(
        !batteryOk
          ? 'Battery capacity must be between 1 and 200 kWh.'
          : 'Estimated range must be between 10 and 1,000 km.',
      );
      return;
    }
    setVehicleError(null);

    // Persist vehicle edits (prototype-local)
    update((s) => ({
      ...s,
      vehicles: s.vehicles.map((v) =>
        v.id === selectedVehicle.id
          ? {
              ...v,
              brand: vBrand.trim() || v.brand,
              model: vModel.trim() || v.model,
              batteryKwh: battery,
              rangeKm: range,
              connector: vConnector,
            }
          : v,
      ),
    }));

    saveProfile({
      name: name.trim(),
      email: email.trim(),
      homeAreaId: homeArea,
      vehicleId,
      preferredConnector,
      chargeTargetPercent: chargeTarget,
      fareAlerts,
    });

    setSaved(true);
    window.setTimeout(() => setSaved(false), 3200);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Account"
        title="Profile & Vehicle"
        subtitle="Your demo identity, vehicle details and charging preferences — everything here is stored only in this browser."
        actions={<SimulatedNotice />}
      />

      {saved && (
        <Alert tone="ev" title="Saved">
          Your profile and vehicle preferences were updated locally and now personalise the
          dashboard, estimates and bookings.
        </Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <div className="flex flex-col gap-5">
          {/* Identity */}
          <section className="panel p-5">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ev-soft text-xl font-bold text-ev">
                {(name.trim() || 'D').slice(0, 1).toUpperCase()}
              </span>
              <div>
                <h2 className="text-base font-semibold text-ink">{name || 'Demo driver'}</h2>
                <p className="text-xs text-faint">{email}</p>
                <div className="mt-1.5 flex gap-2">
                  <Chip tone="ev">Demo driver</Chip>
                  <Chip tone="neutral" icon={<ShieldQuestion className="h-3 w-3" />}>
                    No identity verification
                  </Chip>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Display name" htmlFor="p-name" error={errors.name}>
                <Input
                  id="p-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </Field>
              <Field
                label="Email (demo account)"
                htmlFor="p-email"
                error={errors.email}
                hint="Shown for demonstration only"
              >
                <Input
                  id="p-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label="Home area" htmlFor="p-home" hint="Used for nearby distances">
                <Select
                  id="p-home"
                  value={homeArea}
                  onChange={(e) => setHomeArea(e.target.value)}
                >
                  {AREAS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Preferred connector" htmlFor="p-connector">
                <Select
                  id="p-connector"
                  value={preferredConnector}
                  onChange={(e) => setPreferredConnector(e.target.value as ConnectorType)}
                >
                  {CONNECTORS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </section>

          {/* Vehicle */}
          <section className="panel p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-ev" />
                <p className="label-caps">Demonstration vehicle</p>
              </div>
              <span className="text-2xs text-faint">affects cost estimates</span>
            </div>

            <Field label="Select vehicle" htmlFor="v-select" className="mt-3">
              <Select
                id="v-select"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
              >
                {state.vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.model}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Brand" htmlFor="v-brand">
                <Input id="v-brand" value={vBrand} onChange={(e) => setVBrand(e.target.value)} />
              </Field>
              <Field label="Model" htmlFor="v-model">
                <Input id="v-model" value={vModel} onChange={(e) => setVModel(e.target.value)} />
              </Field>
              <Field label="Battery capacity (kWh)" htmlFor="v-battery" error={vehicleError}>
                <Input
                  id="v-battery"
                  type="number"
                  min={1}
                  max={200}
                  step={0.5}
                  value={vBattery}
                  onChange={(e) => {
                    setVBattery(e.target.value);
                    setVehicleError(null);
                  }}
                />
              </Field>
              <Field label="Estimated range (km)" htmlFor="v-range">
                <Input
                  id="v-range"
                  type="number"
                  min={10}
                  max={1000}
                  value={vRange}
                  onChange={(e) => {
                    setVRange(e.target.value);
                    setVehicleError(null);
                  }}
                />
              </Field>
              <Field label="Connector" htmlFor="v-connector">
                <Select
                  id="v-connector"
                  value={vConnector}
                  onChange={(e) => setVConnector(e.target.value as ConnectorType)}
                >
                  {CONNECTORS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </section>
        </div>

        {/* Preferences */}
        <section className="panel h-fit p-5">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-ev" />
            <p className="label-caps">Charging preferences</p>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="p-target" className="text-dim">
                Default charge target
              </label>
              <span className="font-semibold text-ev">{chargeTarget}%</span>
            </div>
            <input
              id="p-target"
              type="range"
              min={40}
              max={95}
              step={5}
              value={chargeTarget}
              onChange={(e) => setChargeTarget(Number(e.target.value))}
              className="mt-3 w-full accent-[#3DDC84]"
            />
            <p className="mt-1.5 text-2xs text-faint">
              Used to estimate kWh and ₹ for bookings and sessions.
            </p>
          </div>

          <label
            className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-raised px-3.5 py-3"
            htmlFor="p-alerts"
          >
            <input
              id="p-alerts"
              type="checkbox"
              checked={fareAlerts}
              onChange={(e) => setFareAlerts(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#3DDC84]"
            />
            <span>
              <span className="block text-sm font-medium text-ink">Reservation reminders</span>
              <span className="block text-2xs leading-relaxed text-faint">
                Show an in-app reminder ahead of your next booked slot. No push notifications are
                sent.
              </span>
            </span>
          </label>

          <div className="mt-5 rounded-lg border border-dashed border-line-strong px-3.5 py-3">
            <p className="text-2xs font-semibold uppercase tracking-wider text-faint">
              Prototype note
            </p>
            <p className="mt-1 text-2xs leading-relaxed text-faint">
              ChargeFlow does not verify identities or documents. Profile edits are demonstration
              data kept in local storage and can be wiped any time with Reset demo data.
            </p>
          </div>

          <Button className="mt-5 w-full" size="lg" onClick={saveAll} icon={<CheckCircle2 className="h-4 w-4" />}>
            Save changes
          </Button>
        </section>
      </div>
    </div>
  );
}
