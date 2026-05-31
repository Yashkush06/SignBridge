<div align="center">
  <img src="https://raw.githubusercontent.com/Yashkush06/SignBridge/main/public/SignBridgelogo.png" alt="SignBridge" width="180" />
  <h1>SignBridge</h1>
  <p><strong>Real-time ASL translation — fully in the browser, no account required.</strong></p>
  <p>🚀 <strong><a href="https://sign-bridge-topaz.vercel.app/">Try the Live Application on Vercel</a></strong></p>

  <p>
    <a href="https://sign-bridge-topaz.vercel.app/"><img src="https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=flat&logo=vercel&logoColor=white" alt="Live Demo" /></a>
    <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16.2-black?logo=nextdotjs&logoColor=white" alt="Next.js" /></a>
    <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /></a>
    <a href="https://www.framer.com/motion"><img src="https://img.shields.io/badge/Framer_Motion-12-black?logo=framer&logoColor=white" alt="Framer Motion" /></a>
    <a href="https://vitest.dev"><img src="https://img.shields.io/badge/Tested_with-Vitest-6E9F18?logo=vitest&logoColor=white" alt="Vitest" /></a>
    <img src="https://img.shields.io/badge/License-MIT-22c55e" alt="MIT License" />
  </p>
</div>

---

## What is SignBridge?

SignBridge is an accessibility platform that translates American Sign Language (ASL) in real time — directly in the browser, with no backend, no account, and no data leaving your device.

A trained neural network runs on top of Google MediaPipe hand landmarks to classify ASL letters from your webcam feed. The reverse direction (text or voice → ASL) plays back pre-recorded letter videos in sequence. Everything — inference, history, analytics — runs client-side.

---

## Features

### ASL → Text
Webcam feed with a MediaPipe 21-point hand landmark overlay. A TensorFlow.js neural network classifies each frame and shows a real-time confidence meter. Transcripts can be exported at any time.

### Text → ASL
Type any phrase and watch it spelled out letter-by-letter via ASL video clips. An interactive A–Z glossary sidebar uses a spring-animated active key indicator (Framer Motion `layoutId`) that slides between letters as playback progresses.

### Voice → ASL
Web Speech API transcription with a live waveform visualizer. Spoken words are auto-converted to ASL letter sequences with resilient error handling and automatic retry on silence.

### History & Analytics
Session logs are stored in browser local storage — nothing is sent to a server. A Recharts dashboard surfaces speed, accuracy, and vocabulary metrics over time.

### Design system
- Token-based design: no glassmorphism, no colored shadows, no hardcoded hex values
- Full dark / light theme via CSS custom properties
- `prefers-reduced-motion` safe — all animations respect the OS preference
- WCAG-compliant focus indicators and accessible component names

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion 12 |
| Hand tracking | Google MediaPipe Tasks Vision |
| ML inference | TensorFlow.js |
| Components | Radix UI primitives |
| State | Zustand |
| Charts | Recharts |
| Testing | Vitest + fast-check + Testing Library |
| Deployment | Vercel |

---

## Project structure

```
src/
├── app/
│   ├── (app)/
│   │   ├── translator/       # Live ASL → Text
│   │   ├── text-to-sign/     # Text → ASL
│   │   ├── voice-to-sign/    # Voice → ASL
│   │   ├── history/          # Session history
│   │   └── analytics/        # Usage analytics
│   └── (marketing)/          # Landing page
├── components/
│   ├── landing/              # Marketing page sections
│   ├── layout/               # App shell, sidebar, top nav
│   └── ui/                   # Design system primitives
├── hooks/                    # Webcam, speech recognition, sign detection
├── lib/
│   ├── ml/                   # MediaPipe + TensorFlow.js model providers
│   ├── motion.ts             # Motion variant catalog + reduced-motion resolver
│   ├── variant.ts            # Variant resolver with dev-time fallback warning
│   ├── async-state.ts        # Loading / loaded / error reducer
│   ├── navigation.ts         # Active nav item selector (longest-prefix match)
│   └── typography.ts         # Heading scale constants + font-token helpers
└── store/                    # Zustand stores
```

---

## Getting started

**Prerequisites:** Node.js 18+, a browser with webcam access (Chrome or Edge recommended for Web Speech API).

```bash
git clone https://github.com/Yashkush06/SignBridge.git
cd SignBridge
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Running tests

```bash
npm test
```

The test suite includes:

- **Property-based tests** (`fast-check`, ≥100 iterations each) for the pure utility functions: `resolveMotionVariant`, `resolveVariant`, `asyncReducer`, `selectActiveNavItem`, `HEADING_SCALE`, and `STATUS_PRESENTATION`
- **Unit tests** for motion duration bounds, theme rendering, and keyboard/focus behavior
- **Snapshot tests** for all UI primitives in both light and dark themes

---

## ML model

The ASL classifier is a neural network trained on the [ASL Alphabet dataset](https://www.kaggle.com/datasets/grassknoted/asl-alphabet). It runs entirely in the browser:

1. MediaPipe extracts 21 hand landmarks (x, y, z) per frame — 63 features total
2. The feature vector is fed to a TensorFlow.js model (`tfjs_model/`)
3. The top prediction and confidence score are displayed in real time

Training scripts live in `scripts/train-model/` if you want to retrain.

---

## Design principles

The interface is built to feel like production software, not a demo. A few rules that guide every decision:

- **One brand color.** A single blue (`#1F6FEB`) with neutral grays. No rainbow gradients, no neon.
- **Opaque surfaces.** No `backdrop-blur`, no translucent chrome. Every surface uses a solid token.
- **Purposeful motion.** Durations are bounded by requirement: hover 180ms, activate 160ms, overlay 200ms, section reveal 320ms. All animations respect `prefers-reduced-motion`.
- **Token-only styling.** Components reference CSS custom properties — never hardcoded hex or arbitrary pixel values.

---

## Deployment

The app is deployed on Vercel. No environment variables are required for the core features — everything runs client-side.

To enable Firebase (cloud history sync), add these to your Vercel project settings:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

---

## License

MIT — see [LICENSE](LICENSE) for details.
