import { useEffect, useState } from 'react';
import { getDashboardStats } from '../lib/api';

const PARTY_LABELS = {
  NONE: 'None',
  D: 'Democratic',
  R: 'Republican',
  L: 'Libertarian',
  G: 'Green',
  C: 'Constitution',
  S: 'Socialist',
};

const STATUS_LABELS = {
  ACTIVE: 'Active',
  CONFIRMATION: 'Confirmation',
};

function Card({ title, children, className = '' }) {
  return (
    <div className={`rounded-lg bg-gray-900 p-4 ${className}`}>
      <h2 className="text-xs uppercase tracking-wide text-gray-500">{title}</h2>
      {children}
    </div>
  );
}

function Tile({ value, label }) {
  return (
    <div className="rounded-lg bg-gray-900 p-4">
      <div className="text-2xl font-semibold tabular-nums text-gray-100">
        {value.toLocaleString()}
      </div>
      <div className="mt-0.5 text-xs text-gray-400">{label}</div>
    </div>
  );
}

// Horizontal bars are scaled against the largest row rather than the total, so the
// smaller categories stay visible instead of collapsing into invisible slivers.
function BarRow({ label, value, max }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 shrink-0 truncate text-gray-400">{label}</span>
      <span className="h-3.5 flex-1 overflow-hidden rounded-sm bg-gray-950">
        <span
          className="block h-full bg-sky-500/70"
          style={{ width: `${max ? (value / max) * 100 : 0}%` }}
        />
      </span>
      <span className="w-16 shrink-0 text-right tabular-nums text-gray-200">
        {value.toLocaleString()}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getDashboardStats()
      .then((data) => !cancelled && setStats(data))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold text-gray-100">Dashboard</h1>
        <p className="mt-4 text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold text-gray-100">Dashboard</h1>
        <p className="mt-4 text-sm text-gray-500">Loading Franklin County totals...</p>
      </div>
    );
  }

  const active = stats.byStatus.find((s) => s.key === 'ACTIVE');
  const confirmation = stats.byStatus.find((s) => s.key === 'CONFIRMATION');
  const pct = (n) => ((n / stats.totalVoters) * 100).toFixed(1);

  const maxParty = Math.max(...stats.byParty.map((p) => p.n));
  const maxDistrict = Math.max(...stats.byCongressional.map((d) => d.n));
  const maxCity = Math.max(...stats.topCities.map((c) => c.n));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-100">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">
        Franklin County voter file — {stats.totalVoters.toLocaleString()} registrants
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile value={stats.totalVoters} label="Registered voters" />
        {active && <Tile value={active.n} label={`Active · ${pct(active.n)}%`} />}
        {confirmation && (
          <Tile value={confirmation.n} label={`Confirmation · ${pct(confirmation.n)}%`} />
        )}
        <Tile value={stats.totalElections} label="Elections on file" />
      </div>

      <Card title="General election turnout" className="mt-4">
        <p className="mt-1 text-[11px] text-gray-500">
          Share of voters registered at the time who cast a ballot
        </p>
        {/* Bars are scaled on a fixed 0-100% axis, not against each other, so the
            height reads directly as the turnout rate. Sizing by raw ballots would
            draw 2018 and 2023 identically (~412k each) despite 73% vs 53% turnout. */}
        <div className="mt-3 flex h-44 items-end gap-2">
          {stats.generalTurnout.map((e) => (
            <div
              key={e.date}
              className="flex flex-1 flex-col items-center justify-end gap-1"
              title={`${e.date} — ${e.ballots.toLocaleString()} ballots from ${e.registeredByThen.toLocaleString()} registered by then`}
            >
              <span className="text-xs font-semibold tabular-nums text-gray-100">
                {e.turnoutPct === null ? '—' : `${e.turnoutPct.toFixed(0)}%`}
              </span>
              <div
                className="w-full rounded-t-sm bg-sky-500/70"
                style={{ height: `${e.turnoutPct ?? 0}%` }}
              />
              <span className="text-[10px] tabular-nums text-gray-400">
                {Math.round(e.ballots / 1000)}k
              </span>
              <span className="text-[10px] text-gray-500">{e.date.slice(0, 4)}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-gray-500">
          Countywide generals only — elections under{' '}
          {stats.countywideMinBallots.toLocaleString()} ballots are localized specials,
          including a 2024 race typed GENERAL with 47 ballots. Rates read higher than
          official turnout: this file holds only current registrants, so voters purged
          since an election are missing from both sides of the ratio, and purges fall
          hardest on people who don&apos;t vote.
        </p>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Party · last primary pulled">
          <div className="mt-3 space-y-1.5">
            {stats.byParty.map((p) => (
              <BarRow
                key={p.key}
                label={PARTY_LABELS[p.key] || p.key}
                value={p.n}
                max={maxParty}
              />
            ))}
          </div>
          <p className="mt-3 text-[11px] text-gray-500">
            Ohio has no party registration — this reflects the last primary ballot pulled.
          </p>
        </Card>

        <Card title="Congressional district">
          <div className="mt-3 space-y-1.5">
            {stats.byCongressional.map((d) => (
              <BarRow key={d.key} label={`OH-${d.key}`} value={d.n} max={maxDistrict} />
            ))}
          </div>
          <h2 className="mt-5 text-xs uppercase tracking-wide text-gray-500">Top cities</h2>
          <div className="mt-3 space-y-1.5">
            {stats.topCities.map((c) => (
              <BarRow key={c.key} label={c.key} value={c.n} max={maxCity} />
            ))}
          </div>
        </Card>
      </div>

      <Card title="Registration status" className="mt-4">
        <div className="mt-3 space-y-1.5">
          {stats.byStatus.map((s) => (
            <BarRow
              key={s.key}
              label={STATUS_LABELS[s.key] || s.key}
              value={s.n}
              max={stats.totalVoters}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
