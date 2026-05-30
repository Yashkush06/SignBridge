'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Tier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
  badge?: string;
}

const tiers: Tier[] = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Get started with basic sign language translation.',
    features: [
      '50 translations per day',
      'ASL alphabet detection',
      'Basic translation history',
      '1 device',
    ],
    cta: 'Get Started',
    href: '/signup',
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For professionals who need unlimited, accurate translations.',
    features: [
      'Unlimited translations',
      'Full ASL vocabulary',
      'Voice to sign conversion',
      'Priority support',
      'Export translations',
      'Analytics dashboard',
    ],
    cta: 'Start Free Trial',
    href: '/signup?plan=pro',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Tailored solutions for organizations at scale.',
    features: [
      'Everything in Pro',
      'Custom model training',
      'SSO & team management',
      'Dedicated support',
      'SLA guarantee',
      'API access',
    ],
    cta: 'Contact Sales',
    href: '/signup?plan=enterprise',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45,  },
  },
};

export function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-[var(--bg-secondary)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <h2
            id="pricing-heading"
            className="text-3xl font-semibold tracking-tight text-[var(--fg)]"
          >
            Simple, Transparent Pricing
          </h2>
          <p className="text-[var(--fg-secondary)] text-center max-w-2xl mx-auto mt-3">
            Start free and scale as your needs grow. No hidden fees.
          </p>
        </motion.div>

        {/* Tier cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {tiers.map((tier) => (
            <motion.div
              key={tier.name}
              variants={itemVariants}
              className={cn(
                'relative bg-[var(--bg)] border rounded-lg p-6 flex flex-col',
                tier.highlighted &&
                  'border-brand-500 shadow-md md:scale-[1.02]'
              )}
            >
              {/* Badge */}
              {tier.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center px-3 py-0.5 rounded-full bg-brand-500 text-white text-xs font-medium">
                  {tier.badge}
                </span>
              )}

              {/* Header */}
              <div className="mb-5">
                <h3 className="text-base font-semibold text-[var(--fg)]">
                  {tier.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-0.5">
                  <span className="text-3xl font-bold text-[var(--fg)] tracking-tight">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-sm text-[var(--fg-tertiary)]">
                      {tier.period}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-[var(--fg-secondary)]">
                  {tier.description}
                </p>
              </div>

              {/* Features */}
              <ul className="flex flex-col gap-2.5 mb-6 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-[var(--fg-secondary)]">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                id={`pricing-cta-${tier.name.toLowerCase()}`}
                href={tier.href}
                className={cn(
                  'inline-flex items-center justify-center h-10 px-4 rounded-md text-sm font-medium transition-colors w-full',
                  tier.highlighted
                    ? 'bg-brand-500 text-white hover:bg-brand-600'
                    : 'border text-[var(--fg-secondary)] hover:text-[var(--fg)] hover:border-[var(--fg-tertiary)]'
                )}
              >
                {tier.cta}
              </a>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
