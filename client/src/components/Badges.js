import { AlertIcon } from './Icons';

// High is the only filled badge (with an alert icon) so it stands out from brand red buttons.
const RISK_STYLES = {
  Low: 'bg-risk-low-tint text-risk-low-ink ring-risk-low/40 dark:bg-risk-low/15 dark:text-emerald-300',
  Medium: 'bg-risk-medium-tint text-risk-medium-ink ring-risk-medium/50 dark:bg-risk-medium/15 dark:text-amber-300',
  High: 'bg-risk-high text-white ring-risk-high',
};

const STATUS_STYLES = {
  Pending: 'bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-white/10 dark:text-neutral-300 dark:ring-white/15',
  'In Progress': 'bg-sky-50 text-sky-800 ring-sky-600/30 dark:bg-sky-500/15 dark:text-sky-300',
  Complete: 'bg-risk-low-tint text-risk-low-ink ring-risk-low/40 dark:bg-risk-low/15 dark:text-emerald-300',
};

const BASE = 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset';

// Risk level with a text label (not colour alone). Shows "Not predicted" when missing.
export function RiskBadge({ level, confidence, size = 'sm' }) {
  if (!level) {
    return <span className={`${BASE} bg-white text-slate-500 ring-slate-300 dark:bg-white/5 dark:text-neutral-400 dark:ring-white/15`}>Not predicted</span>;
  }
  const large = size === 'lg' ? 'px-3 py-1 text-sm' : '';
  return (
    <span className={`${BASE} ${RISK_STYLES[level]} ${large}`}>
      {level === 'High' && <AlertIcon className="h-3.5 w-3.5" />}
      <span className="font-semibold">{level} risk</span>
      {confidence != null && <span>· {Math.round(Number(confidence) * 100)}%</span>}
    </span>
  );
}

export function StatusBadge({ status }) {
  return <span className={`${BASE} ${STATUS_STYLES[status] || STATUS_STYLES.Pending}`}>{status}</span>;
}

const HANDOVER_STYLES = {
  Draft: 'bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-white/10 dark:text-neutral-300 dark:ring-white/15',
  Submitted: 'bg-accent-50 text-accent-800 ring-accent-600/30 dark:bg-accent-600/20 dark:text-accent-300',
  Acknowledged: 'bg-risk-low-tint text-risk-low-ink ring-risk-low/40 dark:bg-risk-low/15 dark:text-emerald-300',
};

export function HandoverStatusBadge({ status }) {
  return <span className={`${BASE} ${HANDOVER_STYLES[status] || HANDOVER_STYLES.Draft}`}>{status}</span>;
}
