'use client';

import { motion } from 'framer-motion';
import { Hand, Cpu, MessageSquare } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { motionVariants, useReducedMotionVariants } from '@/lib/motion';
import { bodyClass, headingClass } from '@/lib/typography';

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

export function HowItWorks() {
  // Section-reveal entrance from the shared motion catalog, resolved for the
  // active reduced-motion preference. Under reduced motion the resolver yields
  // the final visible state instantly (Req 4.8, 5.1).
  const reveal = useReducedMotionVariants(motionVariants.sectionReveal);

  return (
    <section
      id="how-it-works"
      className="py-20 md:py-28 bg-[var(--bg-secondary)]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={reveal.initial}
          whileInView={reveal.animate}
          viewport={{ once: true, margin: '-80px' }}
          transition={reveal.transition}
        >
          <h2
            id="how-it-works-heading"
            className={headingClass('h2', 'font-semibold tracking-tight text-[var(--fg)]')}
          >
            How It Works
          </h2>
          <p
            className={bodyClass(
              'text-[var(--fg-secondary)] text-center max-w-2xl mx-auto mt-3'
            )}
          >
            Three simple steps from sign language to text — powered by
            state-of-the-art AI.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={reveal.initial}
                whileInView={reveal.animate}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ ...reveal.transition, delay: index * 0.08 }}
              >
                <Card className="h-full">
                  <CardContent className="flex flex-col items-center text-center pt-6">
                    {/* Number badge */}
                    <div className="w-12 h-12 rounded-full bg-[var(--bg)] border-2 border-brand-500 flex items-center justify-center text-brand-500 font-semibold text-sm mb-4">
                      {step.number}
                    </div>

                    {/* Icon */}
                    <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center mb-3 border border-brand-100">
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Text */}
                    <h3 className={headingClass('h3', 'text-[var(--fg)] mb-1')}>
                      {step.title}
                    </h3>
                    <p
                      className={bodyClass(
                        'text-sm text-[var(--fg-secondary)] max-w-60'
                      )}
                    >
                      {step.description}
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
