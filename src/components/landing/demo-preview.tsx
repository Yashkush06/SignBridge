'use client';

import { motion } from 'framer-motion';
import { Play, Pause, Trash2 } from 'lucide-react';

/* Hand landmark positions for the demo hand skeleton */
const landmarks = [
  { x: 100, y: 235 },
  { x: 72, y: 205 }, { x: 52, y: 175 }, { x: 38, y: 148 }, { x: 28, y: 122 },
  { x: 68, y: 128 }, { x: 62, y: 92 },  { x: 58, y: 68 },  { x: 55, y: 46 },
  { x: 92, y: 118 }, { x: 92, y: 78 },  { x: 92, y: 52 },  { x: 92, y: 32 },
  { x: 116, y: 122 },{ x: 120, y: 85 }, { x: 122, y: 62 }, { x: 124, y: 42 },
  { x: 140, y: 132 },{ x: 148, y: 102 },{ x: 153, y: 80 }, { x: 158, y: 60 },
];

const connections = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
];

const translationResults = [
  { letter: 'T', confidence: 0.96, time: '0.12s' },
  { letter: 'H', confidence: 0.93, time: '0.14s' },
  { letter: 'A', confidence: 0.98, time: '0.11s' },
  { letter: 'N', confidence: 0.91, time: '0.15s' },
  { letter: 'K', confidence: 0.94, time: '0.13s' },
  { letter: 'S', confidence: 0.97, time: '0.10s' },
];

export function DemoPreview() {
  return (
    <section id="demo" className="py-20 md:py-28">
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
            id="demo-heading"
            className="text-3xl font-semibold tracking-tight text-[var(--fg)]"
          >
            See It In Action
          </h2>
          <p className="text-[var(--fg-secondary)] text-center max-w-2xl mx-auto mt-3">
            A real-time look at how SignBridge translates hand gestures into
            readable text.
          </p>
        </motion.div>

        {/* Demo mockup */}
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
        >
          <div
            id="demo-mockup"
            className="rounded-xl border shadow-lg overflow-hidden bg-[var(--bg)]"
          >
            {/* Window chrome */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                </div>
                <span className="text-xs text-[var(--fg-tertiary)] ml-2 font-mono">
                  translator — SignBridge
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="recording-dot" />
                <span className="text-xs text-[var(--fg-tertiary)] font-mono">
                  Recording
                </span>
              </div>
            </div>

            {/* Main content */}
            <div className="grid md:grid-cols-5">
              {/* Camera feed */}
              <div className="md:col-span-3 bg-neutral-950 relative flex items-center justify-center min-h-[300px] md:min-h-[360px]">
                {/* Grid overlay */}
                <div
                  className="absolute inset-0 opacity-[0.07]"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />

                {/* Hand skeleton */}
                <svg
                  viewBox="0 0 200 260"
                  className="relative w-44 md:w-52 h-auto"
                  aria-hidden="true"
                >
                  {connections.map(([a, b], i) => (
                    <line
                      key={`c-${i}`}
                      x1={landmarks[a].x}
                      y1={landmarks[a].y}
                      x2={landmarks[b].x}
                      y2={landmarks[b].y}
                      stroke="#10B981"
                      strokeWidth="1.5"
                      strokeOpacity="0.5"
                    />
                  ))}
                  {landmarks.map((p, i) => (
                    <circle
                      key={`l-${i}`}
                      cx={p.x}
                      cy={p.y}
                      r={i === 0 ? 4 : 3}
                      fill="#10B981"
                      opacity={0.85}
                    />
                  ))}
                </svg>

                {/* FPS / model info */}
                <div className="absolute bottom-3 left-3 flex items-center gap-3">
                  <span className="text-[10px] text-white/40 font-mono">
                    30 FPS
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">
                    MediaPipe v0.10
                  </span>
                </div>
              </div>

              {/* Translation panel */}
              <div className="md:col-span-2 border-l flex flex-col">
                <div className="px-4 py-3 border-b">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider">
                      Results
                    </span>
                    <span className="text-xs text-success font-medium">
                      6 detected
                    </span>
                  </div>
                </div>

                <div className="flex-1 p-4">
                  <div className="flex flex-col gap-2">
                    {translationResults.map((result, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 py-1"
                      >
                        <span className="w-7 h-7 rounded bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-semibold border border-brand-100">
                          {result.letter}
                        </span>
                        <div className="flex-1">
                          <div className="h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-brand-500"
                              style={{
                                width: `${result.confidence * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-[11px] text-[var(--fg-tertiary)] font-mono w-8 text-right">
                          {(result.confidence * 100).toFixed(0)}%
                        </span>
                        <span className="text-[10px] text-[var(--fg-muted)] font-mono w-8 text-right">
                          {result.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Translation output */}
                <div className="px-4 py-3 border-t">
                  <p className="text-[11px] text-[var(--fg-tertiary)] mb-0.5">
                    Output
                  </p>
                  <p className="text-base font-semibold text-[var(--fg)] tracking-wide">
                    THANKS
                  </p>
                </div>
              </div>
            </div>

            {/* Controls bar */}
            <div className="flex items-center justify-center gap-3 px-4 py-3 border-t bg-[var(--bg-secondary)]">
              <button
                id="demo-btn-start"
                type="button"
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-md bg-brand-500 text-white text-xs font-medium cursor-default"
              >
                <Play className="h-3.5 w-3.5" />
                Start
              </button>
              <button
                id="demo-btn-pause"
                type="button"
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-md border text-xs font-medium text-[var(--fg-secondary)] cursor-default"
              >
                <Pause className="h-3.5 w-3.5" />
                Pause
              </button>
              <button
                id="demo-btn-clear"
                type="button"
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-md border text-xs font-medium text-[var(--fg-secondary)] cursor-default"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
