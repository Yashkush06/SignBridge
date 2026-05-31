'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'FAQ', href: '#faq' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      id="navbar"
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color] duration-300',
        scrolled
          ? 'bg-[var(--bg)] border-b'
          : 'bg-transparent border-b border-transparent'
      )}
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <a href="/" id="navbar-logo" className="flex items-center">
          <Logo size="md" />
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                id={`nav-link-${link.label.toLowerCase()}`}
                href={link.href}
                className="text-sm text-[var(--fg-secondary)] hover:text-[var(--fg)] transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-6">
          <Button asChild size="sm">
            <a id="nav-launch-app" href="/translator">
              Launch App
            </a>
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          id="navbar-mobile-toggle"
          type="button"
          className="md:hidden p-2 -mr-2 text-[var(--fg-secondary)] hover:text-[var(--fg)]"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="navbar-mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-b bg-[var(--bg)]"
          >
            <div className="px-4 sm:px-6 py-4 flex flex-col gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-[var(--fg-secondary)] hover:text-[var(--fg)] transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <hr className="border-[var(--border)]" />
              <Button asChild size="sm" className="w-full">
                <a href="/translator">
                  Launch App
                </a>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
