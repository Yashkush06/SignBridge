'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  organization: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      'SignBridge has transformed how we communicate with deaf patients. What used to require a scheduled interpreter now happens in real time, right at the bedside.',
    name: 'Dr. Sarah Chen',
    role: 'Head of Patient Services',
    organization: 'Metro General Hospital',
  },
  {
    quote:
      'As an ASL instructor, I use SignBridge to give students instant feedback on their signing. The accuracy of the hand tracking is genuinely impressive.',
    name: 'James Rodriguez',
    role: 'ASL Instructor',
    organization: 'State University',
  },
  {
    quote:
      'We integrated SignBridge into our customer support workflow and saw a measurable increase in satisfaction from our deaf and hard-of-hearing users.',
    name: 'Priya Patel',
    role: 'Accessibility Director',
    organization: 'TechCorp',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
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

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 md:py-28">
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
            id="testimonials-heading"
            className="text-3xl font-semibold tracking-tight text-[var(--fg)]"
          >
            Trusted by Professionals
          </h2>
          <p className="text-[var(--fg-secondary)] text-center max-w-2xl mx-auto mt-3">
            Healthcare workers, educators, and enterprise teams rely on
            SignBridge every day.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={itemVariants}
              className="bg-[var(--bg-secondary)] border rounded-lg p-6 flex flex-col"
            >
              <Quote className="h-5 w-5 text-brand-300 mb-4 shrink-0" />
              <blockquote className="text-sm text-[var(--fg-secondary)] leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-5 pt-4 border-t">
                <p className="text-sm font-semibold text-[var(--fg)]">
                  {t.name}
                </p>
                <p className="text-xs text-[var(--fg-tertiary)] mt-0.5">
                  {t.role}, {t.organization}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
