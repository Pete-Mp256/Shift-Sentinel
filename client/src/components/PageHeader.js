import { PlaneIcon } from './Icons';

function todayLine() {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// Hero panel at the top of each signed-in page, in the landing page style: an eyebrow pill
// (today's date by default), a large bold title, an optional subtitle and actions, and a faint plane.
// back: optional link shown above the panel. badge: optional element beside the title.
export default function PageHeader({ eyebrow, title, subtitle, actions, back, badge }) {
  return (
    <div className="space-y-3">
      {back && <div className="px-1">{back}</div>}
      <section className="panel px-6 py-8 sm:px-10 sm:py-10">
        <PlaneIcon aria-hidden="true" strokeWidth="0.6"
          className="pointer-events-none absolute -right-16 -top-10 h-80 w-80 -rotate-12 text-black/[0.04] dark:text-white/[0.05]" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <span className="eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-600" /> {eyebrow ?? todayLine()}
            </span>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="page-title">{title}</h1>
              {badge}
            </div>
            {subtitle && (
              <div className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base dark:text-neutral-400">{subtitle}</div>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </section>
    </div>
  );
}
