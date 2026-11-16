import { useEffect, useState } from 'react';
import api, { apiError } from '../api';
import DrillDownPanel from '../components/DrillDownPanel';
import PageHeader from '../components/PageHeader';
import {
  ChartCard, RISK_COLORS, RiskDonut, RiskTable, StackedRiskBars,
} from '../components/RiskCharts';
import Timeline from '../components/Timeline';
import { Skeleton } from 'components/ui/skeleton';
import { formatDate, formatDateTime, formatShortDate } from '../utils/format';

const RANGES = [7, 30, 90];

const RISK_LABELS = { Low: 'Low risk', Medium: 'Medium risk', High: 'High risk', not_predicted: 'Not predicted' };

// What the drill-down panel lists. risk: Low | Medium | High | not_predicted | null (all).
// row: optional chart row with shift_type, department_id + department, or day.
function incidentSelection(risk, row = {}) {
  const filters = {};
  const parts = [risk ? RISK_LABELS[risk] : 'All incidents'];
  if (risk) filters.risk_level = risk === 'not_predicted' ? 'none' : risk;
  if (row.shift_type) {
    filters.shift_type = row.shift_type;
    parts.push(`${row.shift_type} shift`);
  }
  if (row.department_id) {
    filters.department_id = row.department_id;
    parts.push(row.department);
  }
  if (row.day) {
    filters.day = row.day;
    parts.push(formatDate(row.day));
  }
  return { kind: 'incidents', id: `incidents:${JSON.stringify(filters)}`, filters, label: parts.join(' · ') };
}

const OPEN_TASKS = { kind: 'tasks', id: 'tasks', filters: {}, label: 'Open tasks' };

// A number in a bento card; clicking it lists what was counted. note: optional line under the number
// (it may hold its own button). dark: the black card with the crimson glow, used for the total.
function StatTile({ label, value, color, onSelect, selected, note, dark = false, className = '' }) {
  const clickable = onSelect && value > 0;
  return (
    <div className={`bento min-h-[8.5rem] p-5 transition-all duration-300
      ${dark ? 'bg-black text-white ring-0 dark:bg-[#0b0b0b] dark:ring-1' : ''}
      ${clickable ? 'hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-24px_rgba(0,0,0,0.35)]' : ''}
      ${selected ? (dark ? 'ring-2 ring-accent-500 dark:ring-2' : 'ring-2 ring-ink dark:ring-white') : ''} ${className}`}>
      {dark && (
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-10 h-40 w-48 rounded-full bg-accent-600/60 blur-[60px]" />
      )}
      {clickable && (
        <button type="button" onClick={onSelect} aria-pressed={selected}
          aria-label={`List ${value} ${label.toLowerCase()}`}
          className="absolute inset-0 z-10 rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-500" />
      )}
      <p className={`relative flex items-center gap-2 text-sm font-medium ${dark ? 'text-white/70' : 'text-slate-500 dark:text-neutral-400'}`}>
        {color && <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} aria-hidden="true" />}
        {label}
      </p>
      <p className={`relative mt-auto pt-4 text-5xl font-bold tabular-nums tracking-[-0.04em] ${dark ? 'text-white' : 'text-ink dark:text-white'}`}>
        {value}
      </p>
      {note && <div className={`relative mt-1 text-xs ${dark ? 'text-white/60' : 'text-slate-500 dark:text-neutral-400'}`}>{note}</div>}
    </div>
  );
}

// Share of predicted incidents, shown under each risk tile.
function share(count, totals) {
  const predicted = totals.Low + totals.Medium + totals.High;
  return predicted ? `${Math.round((count / predicted) * 100)}% of predicted` : 'None predicted';
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className={`h-[8.5rem] rounded-3xl dark:bg-white/10 ${i === 0 ? 'col-span-2 sm:col-span-1' : ''}`} />
        ))}
      </div>
      <Skeleton className="h-80 rounded-3xl dark:bg-white/10" />
    </div>
  );
}

// Incident risk across shifts: totals, charts by day, department and shift type, recent High risk.
// Every count can be clicked to list the incidents (or open tasks) behind it.
export default function DashboardPage() {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [selection, setSelection] = useState(null);

  useEffect(() => {
    // Ignore a slower response for a range that is no longer selected.
    let cancelled = false;
    setError('');
    api
      .get('/dashboard/summary', { params: { days } })
      .then((res) => !cancelled && setSummary(res.data))
      .catch((err) => !cancelled && setError(apiError(err).message));
    return () => { cancelled = true; };
  }, [days]);

  const totals = summary?.totals;
  const selectRow = (row, risk) => setSelection(incidentSelection(risk, row));

  function tileProps(choice) {
    return { onSelect: () => setSelection(choice), selected: selection?.id === choice.id };
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={`Risk overview · last ${days} days`}
        title="Dashboard"
        subtitle={summary
          ? `Incidents from ${formatDate(summary.from)} to ${formatDate(summary.to)}, counted by their latest risk prediction. Click any number to see what's behind it.`
          : 'Incidents counted by their latest risk prediction.'}
        actions={(
          <div className="segmented" role="tablist" aria-label="Time range">
            {RANGES.map((d) => (
              <button key={d} type="button" role="tab" aria-selected={days === d}
                className={days === d ? 'pill-active' : 'pill'} onClick={() => setDays(d)}>
                {d} days
              </button>
            ))}
          </div>
        )}
      />

      {error && <p className="alert-error" role="alert">{error}</p>}

      {!summary ? (
        !error && (
          <div role="status">
            <span className="sr-only">Loading dashboard…</span>
            <DashboardSkeleton />
          </div>
        )
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile label="Incidents" value={totals.incidents} dark className="col-span-2 sm:col-span-1"
              {...tileProps(incidentSelection(null))}
              note={totals.not_predicted > 0 ? (
                <button type="button" className="relative z-20 font-medium text-white underline-offset-2 hover:underline"
                  aria-pressed={selection?.id === incidentSelection('not_predicted').id}
                  onClick={() => setSelection(incidentSelection('not_predicted'))}>
                  {totals.not_predicted} not predicted
                </button>
              ) : `In the last ${days} days`} />
            <StatTile label="High risk" value={totals.High} color={RISK_COLORS.High}
              note={share(totals.High, totals)} {...tileProps(incidentSelection('High'))} />
            <StatTile label="Medium risk" value={totals.Medium} color={RISK_COLORS.Medium}
              note={share(totals.Medium, totals)} {...tileProps(incidentSelection('Medium'))} />
            <StatTile label="Low risk" value={totals.Low} color={RISK_COLORS.Low}
              note={share(totals.Low, totals)} {...tileProps(incidentSelection('Low'))} />
            <StatTile label="Open tasks" value={totals.open_tasks} note="Not yet complete"
              {...tileProps(OPEN_TASKS)} />
          </div>

          {selection && <DrillDownPanel selection={selection} days={days} onClose={() => setSelection(null)} />}

          {totals.incidents === 0 ? (
            <div className="bento p-10">
              <p className="text-center text-sm text-slate-500 dark:text-neutral-400">No incidents logged in the last {days} days.</p>
            </div>
          ) : (
            <>
              <ChartCard
                title="Incidents per day"
                table={<RiskTable rows={summary.by_day.filter((d) => d.total > 0)} categoryKey="day"
                  categoryLabel="Day" formatCategory={formatDate} onSelect={selectRow} />}
              >
                <StackedRiskBars rows={summary.by_day} categoryKey="day" formatCategory={formatShortDate}
                  onSelect={selectRow} />
              </ChartCard>

              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard title="Risk mix">
                  <RiskDonut byRisk={summary.by_risk} onSelect={(risk) => setSelection(incidentSelection(risk))} />
                </ChartCard>
                <ChartCard
                  title="By shift type"
                  table={<RiskTable rows={summary.by_shift_type} categoryKey="shift_type" categoryLabel="Shift"
                    onSelect={selectRow} />}
                >
                  <StackedRiskBars rows={summary.by_shift_type} categoryKey="shift_type" onSelect={selectRow} />
                </ChartCard>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <ChartCard
                  title="By department"
                  className="lg:col-span-2"
                  table={<RiskTable rows={summary.by_department} categoryKey="department" categoryLabel="Department"
                    onSelect={selectRow} />}
                >
                  <StackedRiskBars rows={summary.by_department} categoryKey="department" horizontal
                    onSelect={selectRow} />
                </ChartCard>
                <section className="bento min-w-0 self-start p-5 sm:p-6" aria-label="Recent High risk incidents">
                  <div className="mb-5 flex items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold tracking-tight text-ink dark:text-white">Recent High risk</h2>
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: RISK_COLORS.High }} aria-hidden="true" />
                  </div>
                  <Timeline
                    empty={`No High risk incidents in the last ${days} days.`}
                    items={summary.recent_high.map((i) => ({
                      id: i.incident_id,
                      when: formatDateTime(i.occurred_at),
                      title: i.incident_type,
                      detail: `${Math.round(Number(i.confidence) * 100)}% · ${i.shift_type} · ${i.department_name}`,
                      tone: 'High',
                      alert: true,
                      to: `/incidents/${i.incident_id}`,
                    }))}
                  />
                </section>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
