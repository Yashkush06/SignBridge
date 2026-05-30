'use client';

import { motion } from 'framer-motion';
import { Hand, Cpu, MessageSquare } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Step {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: 1,
    icon: Hand,
    title: 'Sign',
    description: 'Show signs to your webcam — no special equipment needed.',
  },
  {
    number: 2,
    icon: Cpu,
    title: 'AI Processes',
    description: 'AI detects and classifies hand gestures with high accuracy.',
  },
  {
    number: 3,
    icon: MessageSquare,
    title: 'Read & Listen',
    description: 'Read translations or listen via built-in text-to-speech.',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5,  },
  },
};

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-[var(--bg-secondary)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <h2
            id="how-it-works-heading"
            className="text-3xl font-semibold tracking-tight text-[var(--fg)]"
          >
            How It Works
          </h2>
          <p className="text-[var(--fg-secondary)] text-center max-w-2xl mx-auto mt-3">
            Three simple steps from sign language to text — powered by
            state-of-the-art AI.
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 relative"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {/* Connecting lines (desktop only) */}
          <div className="hidden md:block absolute top-12 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px border-t-2 border-dashed border-[var(--border)]" />

          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                variants={itemVariants}
                className="flex flex-col items-center text-center relative"
              >
                {/* Number badge */}
                <div className="relative mb-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--bg)] border-2 border-brand-500 flex items-center justify-center text-brand-500 font-semibold text-sm z-10 relative">
                    {step.number}
                  </div>
                </div>

                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center mb-3 border border-brand-100">
                  <Icon className="h-5 w-5" />
                </div>

                {/* Text */}
                <h3 className="text-base font-semibold text-[var(--fg)] mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--fg-secondary)] max-w-[240px]">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
