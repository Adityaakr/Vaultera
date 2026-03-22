import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Vaultera" className="h-8 w-8 rounded-full" />
          <span className="font-display text-lg font-bold text-foreground">Vaultera</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {['Vaults', 'Agents', 'Arena', 'Docs'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{item}</a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/app" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-verdant-hover">
            Launch App
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
