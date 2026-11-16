import { Fragment, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { CalendarClock, ChevronRight, ClipboardCheck, LayoutDashboard, Menu } from 'lucide-react';
import api from '../api';
import { cn } from 'lib/utils';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from 'components/ui/sheet';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import ProfileMenu from './ProfileMenu';
import ThemeToggle from './ThemeToggle';

const NAV = [
  { to: '/shifts', label: 'Shifts', icon: CalendarClock, hint: 'Tasks, incidents and handover' },
  { to: '/handovers', label: 'Handovers', icon: ClipboardCheck, hint: 'Incoming and sent' },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, hint: 'Risk trends and summaries' },
];

// Breadcrumb trail for the top bar, from the current path.
function crumbsFor(pathname) {
  if (pathname.startsWith('/shifts/')) return [{ to: '/shifts', label: 'Shifts' }, { label: 'Shift handover' }];
  if (pathname.startsWith('/handovers/')) return [{ to: '/handovers', label: 'Handovers' }, { label: 'Handover' }];
  if (pathname.startsWith('/incidents/')) return [{ to: '/shifts', label: 'Shifts' }, { label: 'Incident' }];
  const item = NAV.find((n) => pathname.startsWith(n.to));
  return [{ label: item ? item.label : 'Page not found' }];
}

// counts: { [path]: number } shown as a badge, e.g. handovers waiting for acknowledgement.
// Pill links in the Rare UI style: the active page is a raised white pill with a crimson icon.
function NavItems({ counts = {} }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-neutral-500">Workspace</p>
      {NAV.map(({ to, label, icon: Icon, hint }) => {
        return (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-3 text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
                isActive
                  ? 'bg-white font-semibold text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.1)] ring-1 ring-black/5 dark:bg-white/10 dark:text-white dark:shadow-none dark:ring-white/10'
                  : 'text-slate-600 hover:bg-white/60 hover:text-ink dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors',
                  isActive
                    ? 'bg-accent-600 text-white'
                    : 'bg-white/70 text-slate-500 ring-1 ring-black/5 group-hover:text-ink dark:bg-white/5 dark:text-neutral-400 dark:ring-white/10 dark:group-hover:text-white'
                )}>
                  <Icon className="h-[17px] w-[17px]" />
                </span>
                <span className="flex min-w-0 flex-col leading-tight">
                  {label}
                  <span className="truncate text-[11px] font-normal text-slate-400 dark:text-neutral-500">{hint}</span>
                </span>
                {counts[to] > 0 && (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-600 px-1.5 text-[11px] font-semibold text-white"
                    aria-label={`${counts[to]} waiting`}>
                    {counts[to] > 9 ? '9+' : counts[to]}
                  </span>
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

function SidebarBody({ counts }) {
  return (
    <>
      <div className="px-5 pb-6 pt-5">
        <Link to="/shifts" aria-label="Incident Risk home"
          className="inline-flex rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500">
          <Logo />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <NavItems counts={counts} />
      </div>
      <div className="p-3">
        <div className="rounded-2xl bg-white p-1 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
          <ProfileMenu variant="full" />
        </div>
      </div>
    </>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  const crumbs = crumbsFor(pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  const [waiting, setWaiting] = useState(0);

  // Close the mobile menu after navigating.
  useEffect(() => setMenuOpen(false), [pathname]);

  // Submitted handovers waiting for me (or my department) to acknowledge. Refreshed on navigation
  // and when a page fires "handovers:refresh".
  useEffect(() => {
    const load = () => api
      .get('/handovers', { params: { box: 'incoming' } })
      .then((res) => setWaiting(res.data.handovers.filter((h) => h.status === 'Submitted').length))
      .catch(() => {});
    load();
    window.addEventListener('handovers:refresh', load);
    return () => window.removeEventListener('handovers:refresh', load);
  }, [pathname]);
  const counts = { '/handovers': waiting };

  return (
    <div className="min-h-screen bg-white p-2 sm:p-3 lg:grid lg:grid-cols-[272px_1fr] lg:gap-3 dark:bg-black">
      {/* Sidebar: a framed grey panel, like the landing page hero. */}
      <aside className="panel sticky top-3 hidden h-[calc(100vh-1.5rem)] flex-col lg:flex">
        <SidebarBody counts={counts} />
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Floating pills, like the public navbar. */}
        <header className="sticky top-2 z-30 flex items-center gap-2 sm:top-3">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button type="button" aria-label="Open menu"
                className="nav-pill w-11 justify-center px-0 text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 lg:hidden dark:text-neutral-300">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-[#f4f4f6] p-0 dark:bg-[#141414]">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SheetDescription className="sr-only">Main navigation</SheetDescription>
              <SidebarBody counts={counts} />
            </SheetContent>
          </Sheet>

          <Link to="/shifts" className="nav-pill pl-1.5 pr-4 lg:hidden" aria-label="Incident Risk home"><Logo /></Link>

          <ol className="nav-pill hidden gap-1.5 px-4 text-sm lg:flex" aria-label="Breadcrumb">
            {crumbs.map((c, i) => (
              <Fragment key={c.label}>
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-neutral-600" aria-hidden="true" />}
                <li>
                  {c.to ? (
                    <Link to={c.to} className="text-slate-500 transition-colors hover:text-ink dark:text-neutral-400 dark:hover:text-white">{c.label}</Link>
                  ) : (
                    <span className="font-medium text-ink dark:text-white" aria-current="page">{c.label}</span>
                  )}
                </li>
              </Fragment>
            ))}
          </ol>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <div className="nav-pill gap-1 px-1">
              <NotificationBell />
              <div className="lg:hidden">
                <ProfileMenu />
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-1 pb-10 pt-6 sm:px-3 lg:px-5 lg:pt-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
