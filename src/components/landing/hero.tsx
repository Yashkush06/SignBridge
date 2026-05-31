'use client';

import { motion, type Transition } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { motionVariants, useReducedMotionVariants } from '@/lib/motion';
import { headingClass } from '@/lib/typography';

/* 
  MediaPipe 21 Hand Landmarks absolute coordinates mapped 
  exactly over the hands in the 1600x900 aspect-video mockup frame.
*/
const rightHandLandmarks = [
  { x: 650, y: 720 }, // 0: Wrist
  { x: 700, y: 650 }, { x: 740, y: 590 }, { x: 760, y: 540 }, { x: 770, y: 508 }, // 1-4: Thumb
  { x: 700, y: 580 }, { x: 730, y: 540 }, { x: 755, y: 515 }, { x: 770, y: 508 }, // 5-8: Index
  { x: 720, y: 575 }, { x: 740, y: 535 }, { x: 760, y: 510 }, { x: 770, y: 500 }, // 9-12: Middle
  { x: 740, y: 580 }, { x: 760, y: 545 }, { x: 770, y: 520 }, { x: 775, y: 510 }, // 13-16: Ring
  { x: 755, y: 590 }, { x: 775, y: 560 }, { x: 785, y: 540 }, { x: 790, y: 530 }, // 17-20: Pinky
];

const leftHandLandmarks = [
  { x: 955, y: 730 }, // 0: Wrist
  { x: 915, y: 660 }, { x: 880, y: 610 }, { x: 850, y: 560 }, { x: 825, y: 525 }, // 1-4: Thumb
  { x: 900, y: 590 }, { x: 870, y: 560 }, { x: 845, y: 540 }, { x: 825, y: 525 }, // 5-8: Index
  { x: 935, y: 550 }, { x: 940, y: 470 }, { x: 945, y: 410 }, { x: 950, y: 350 }, // 9-12: Middle
  { x: 960, y: 560 }, { x: 970, y: 480 }, { x: 975, y: 420 }, { x: 980, y: 360 }, // 13-16: Ring
  { x: 985, y: 580 }, { x: 1005, y: 515 }, { x: 1015, y: 465 }, { x: 1025, y: 415 }, // 17-20: Pinky
];

const handConnections = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
];

export function Hero() {
  // Single entrance reveal sourced from the motion catalog. Under reduced
  // motion the resolver collapses initial === animate with duration 0, so the
  // content renders in its final visible state immediately (Req 4.8, 5.1).
  const reveal = useReducedMotionVariants(motionVariants.sectionReveal);
  const reduced = reveal.transition.duration === 0;

  // Staggered entrance delay per item, matching the sibling landing sections.
  // Collapses to 0 under reduced motion so everything appears at once. The
  // catalog `ease` is a cubic-bezier tuple; it is narrowed to Framer Motion's
  // `Transition["ease"]` so each motion element accepts it cleanly.
  const itemTransition = (index: number): Transition => ({
    duration: reveal.transition.duration,
    ease: reveal.transition.ease as Transition['ease'],
    delay: reduced ? 0 : index * 0.08,
  });

  return (
    <section
      id="hero"
      className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden bg-[var(--bg)]"
    >
      {/* Decorative single-hue brand gradient (varies only in opacity; no blur, no glow). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-500/5 to-transparent"
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          {/* Elegant brand logo above the badge */}
          <motion.div
            initial={reveal.initial}
            whileInView={reveal.animate}
            viewport={{ once: true, amount: 0.2 }}
            transition={itemTransition(0)}
            className="mb-6 flex justify-center"
          >
            <Logo size="lg" />
          </motion.div>

          {/* Subtle announcement badge */}
          <motion.div
            initial={reveal.initial}
            whileInView={reveal.animate}
            viewport={{ once: true, amount: 0.2 }}
            transition={itemTransition(1)}
          >
            <span
              id="hero-badge"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-50/50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 text-xs font-medium border border-brand-100 dark:border-brand-900/50"
            >
              <Sparkles className="w-3 h-3" />
              ASL alphabet detection is now live
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            id="hero-heading"
            initial={reveal.initial}
            whileInView={reveal.animate}
            viewport={{ once: true, amount: 0.2 }}
            transition={itemTransition(2)}
            className={headingClass(
              'h1',
              'mt-6 md:text-6xl lg:text-7xl font-bold tracking-tight text-[var(--fg)] text-balance max-w-4xl leading-[1.1]'
            )}
          >
            Sign Language. <span className="text-brand-500 font-medium">Translated.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            id="hero-subtitle"
            initial={reveal.initial}
            whileInView={reveal.animate}
            viewport={{ once: true, amount: 0.2 }}
            transition={itemTransition(3)}
            className="mt-6 text-base md:text-lg text-[var(--fg-secondary)] max-w-xl text-pretty font-light leading-relaxed"
          >
            A minimal, browser-native sign language translator. Powered by on-device computer vision for complete privacy. Zero setup required.
          </motion.p>

          {/* Call-to-action: primary + secondary on one alignment axis, single gap token */}
          <motion.div
            initial={reveal.initial}
            whileInView={reveal.animate}
            viewport={{ once: true, amount: 0.2 }}
            transition={itemTransition(4)}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Button asChild variant="primary" size="lg">
              <Link id="hero-cta-primary" href="/translator">
                Start Translating
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link id="hero-cta-secondary" href="#how-it-works">
                See how it works
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
