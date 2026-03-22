import { Link, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Overview', path: '/app' },
  { label: 'Vaults', path: '/app/vaults' },
  { label: 'Agents', path: '/app/agents' },
  { label: 'Arena', path: '/app/arena' },
  { label: 'Leaderboard', path: '/app/leaderboard' },
  { label: 'Activity', path: '/app/activity' },
  { label: 'Portfolio', path: '/app/portfolio' },
  { label: 'Settings', path: '/app/settings' },
];

export default function AppLayout() {
  const location = useLocation();
  const isActive = (path: string) => {
    if (path === '/app') return location.pathname === '/app' || location.pathname === '/app/overview';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* App Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <span className="font-display text-xs font-bold text-primary-foreground">VA</span>
              </div>
              <span className="font-display text-base font-bold text-foreground">VaultArena</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map(item => (
                <Link key={item.path} to={item.path}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive(item.path) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <button className="rounded-xl border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground shadow-premium transition-all hover:shadow-premium-md">
            Connect Wallet
          </button>
        </div>
      </header>

      {/* Mobile nav */}
      <div className="border-b border-border bg-card md:hidden">
        <div className="flex gap-1 overflow-x-auto px-4 py-2">
          {navItems.map(item => (
            <Link key={item.path} to={item.path}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                isActive(item.path) ? "bg-primary/10 text-primary" : "text-muted-foreground"
              )}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-[1440px] px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
