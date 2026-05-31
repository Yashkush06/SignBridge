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

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motionVariants, useReducedMotionVariants } from '@/lib/motion';
import { bodyClass, headingClass } from '@/lib/typography';

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

export function Features() {
  // Section-reveal entrance from the shared motion catalog, resolved for the
  // active reduced-motion preference. Under reduced motion the resolver yields
  // the final visible state instantly (Req 4.8, 5.1).
  const reveal = useReducedMotionVariants(motionVariants.sectionReveal);

  return (
    <section id="features" className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <motion.div
          className="text-center mb-14"
          initial={reveal.initial}
          whileInView={reveal.animate}
          viewport={{ once: true, margin: '-80px' }}
          transition={reveal.transition}
        >
          <h2
            id="features-heading"
            className={headingClass('h2', 'font-semibold tracking-tight text-[var(--fg)]')}
          >
            Built for Real Communication
          </h2>
          <p
            className={bodyClass(
              'text-[var(--fg-secondary)] text-center max-w-2xl mx-auto mt-3'
            )}
          >
            Everything you need to bridge the gap between sign language and
            spoken language — fast, accurate, and accessible.
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={reveal.initial}
                whileInView={reveal.animate}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ ...reveal.transition, delay: index * 0.06 }}
              >
                <Card className="group h-full transition-colors hover:border-brand-200">
                  <CardHeader>
                    <div className="w-9 h-9 rounded-md bg-brand-50 text-brand-500 flex items-center justify-center border border-brand-100 transition-colors group-hover:bg-brand-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className={headingClass('h3', 'text-[var(--fg)]')}>
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p
                      className={bodyClass(
                        'text-sm text-[var(--fg-secondary)] leading-relaxed'
                      )}
                    >
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
