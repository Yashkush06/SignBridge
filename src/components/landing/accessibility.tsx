'use client';

import { motion } from 'framer-motion';
import {
  Check,
  Keyboard,
  Eye,
  Monitor,
  SunMoon,
} from 'lucide-react';

const accessibilityItems = [
  {
    title: 'WCAG 2.1 AA Compliant',
    description: 'Meets international accessibility standards for web content.',
  },
  {
    title: 'Full Keyboard Navigation',
    description: 'Every feature is reachable and usable without a mouse.',
  },
  {
    title: 'Screen Reader Optimized',
    description: 'Semantic HTML and ARIA labels for complete assistive tech support.',
  },
  {
    title: 'High Contrast Support',
    description: 'Carefully tested color ratios that work in any lighting condition.',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4 },
  },
};

export function AccessibilitySection() {
  return (
    <section id="accessibility" className="py-20 md:py-28 bg-[var(--bg-secondary)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
          >
            <h2
              id="accessibility-heading"
              className="text-3xl font-semibold tracking-tight text-[var(--fg)] mb-4"
            >
              Accessibility at Every Level
            </h2>
            <p className="text-[var(--fg-secondary)] mb-8 max-w-lg">
              SignBridge is built with accessibility as a core principle — not an
              afterthought. Every interaction is designed to be inclusive.
            </p>

            <motion.div
              className="flex flex-col gap-4"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
            >
              {accessibilityItems.map((item) => (
                <motion.div
                  key={item.title}
                  variants={itemVariants}
                  className="flex gap-3"
                >
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--fg)]">
                      {item.title}
                    </p>
                    <p className="text-sm text-[var(--fg-secondary)] mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Visual illustration */}
          <motion.div
            className="flex items-center justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="relative w-full max-w-sm">
              {/* Card grid illustration */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--bg)] border rounded-lg p-5 flex flex-col items-center gap-2.5">
                  <Keyboard className="h-7 w-7 text-brand-500" />
                  <span className="text-xs font-medium text-[var(--fg-secondary)]">
                    Keyboard
                  </span>
                </div>
                <div className="bg-[var(--bg)] border rounded-lg p-5 flex flex-col items-center gap-2.5">
                  <Eye className="h-7 w-7 text-brand-500" />
                  <span className="text-xs font-medium text-[var(--fg-secondary)]">
                    Vision
                  </span>
                </div>
                <div className="bg-[var(--bg)] border rounded-lg p-5 flex flex-col items-center gap-2.5">
                  <Monitor className="h-7 w-7 text-brand-500" />
                  <span className="text-xs font-medium text-[var(--fg-secondary)]">
                    Screen Reader
                  </span>
                </div>
                <div className="bg-[var(--bg)] border rounded-lg p-5 flex flex-col items-center gap-2.5">
                  <SunMoon className="h-7 w-7 text-brand-500" />
                  <span className="text-xs font-medium text-[var(--fg-secondary)]">
                    Contrast
                  </span>
                </div>
              </div>

              {/* Decorative focus ring */}
              <div className="absolute -inset-3 rounded-2xl border-2 border-dashed border-brand-200/50 pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
