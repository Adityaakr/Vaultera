import { Link } from 'react-router-dom';

const footerLinks = {
  Product: ['Vaults', 'Agents', 'Arena', 'Leaderboard'],
  Resources: ['Docs', 'API', 'Status', 'Changelog'],
  Company: ['About', 'Careers', 'Contact', 'Press'],
  Legal: ['Terms', 'Privacy', 'Security', 'Compliance'],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="font-display text-sm font-bold text-primary-foreground">VT</span>
              </div>
              <span className="font-display text-lg font-bold text-foreground">Vaultera</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">The tokenized capital market for the agent economy.</p>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{category}</p>
              <ul className="mt-3 space-y-2">
                {links.map(link => (
                  <li key={link}>
                    <Link to="#" className="text-sm text-foreground/70 transition-colors hover:text-foreground">{link}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-border pt-6 text-center">
          <p className="text-xs text-muted-foreground">© 2026 Vaultera. All rights reserved. Built on Hedera.</p>
        </div>
      </div>
    </footer>
  );
}
