'use client';

import { motion } from 'framer-motion';
import {
  Camera,
  Type,
  Mic,
  Clock,
  BarChart3,
  Accessibility,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Camera,
    title: 'Real-time Translation',
    description:
      'Point your webcam and get instant translations from sign language to text. Powered by MediaPipe hand tracking.',
  },
  {
    icon: Type,
    title: 'Text to Sign',
    description:
      'Type any word or sentence and see the corresponding sign language representation displayed visually.',
  },
  {
    icon: Mic,
    title: 'Voice to Sign',
    description:
      'Speak naturally and watch your words convert to sign language in real time using speech recognition.',
  },
  {
    icon: Clock,
    title: 'Translation History',
    description:
      'Keep a searchable log of every translation. Review, export, and track your communication sessions.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description:
      'Understand usage patterns with detailed charts on translation volume, accuracy, and session duration.',
  },
  {
    icon: Accessibility,
    title: 'Accessibility First',
    description:
      'Built from the ground up with WCAG compliance, keyboard navigation, and screen reader support.',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4,  },
  },
};

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28">
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
            id="features-heading"
            className="text-3xl font-semibold tracking-tight text-[var(--fg)]"
          >
            Built for Real Communication
          </h2>
          <p className="text-[var(--fg-secondary)] text-center max-w-2xl mx-auto mt-3">
            Everything you need to bridge the gap between sign language and
            spoken language — fast, accurate, and accessible.
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="bg-[var(--bg-secondary)] border rounded-lg p-5 hover:border-brand-200 transition-colors group"
              >
                <div className="w-9 h-9 rounded-md bg-brand-50 text-brand-500 flex items-center justify-center mb-3 border border-brand-100 group-hover:bg-brand-100 transition-colors">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--fg)] mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--fg-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
