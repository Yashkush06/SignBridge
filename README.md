# SignBridge

<div align="center">
  <img src="public/SignBridgelogo.png" alt="SignBridge Logo" width="200" />
  <br />
  <strong>Real-time ASL translation — no account, no server, no compromise.</strong>
  <br /><br />

  [![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)
  [![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-F00F3E?logo=framer)](https://www.framer.com/motion/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)
</div>

---

## What is SignBridge?

SignBridge is an accessibility platform that translates American Sign Language (ASL) in real time — directly in the browser, with no backend, no account required, and no data leaving your device.

It runs a trained neural network on top of Google MediaPipe hand landmarks to classify ASL letters from your webcam feed. The reverse direction (text/voice → ASL) plays back pre-recorded letter videos in sequence.

---

## Features

### ASL → Text (Live Translator)
- Webcam feed with MediaPipe 21-point hand landmark overlay
- Neural network classifier running fully client-side via TensorFlow.js
- Real-time confidence meter per prediction
- Transcript export

### Text → ASL
- Type any phrase and watch it spelled out letter-by-letter via ASL video clips
- Interactive A–Z glossary sidebar with spring-animated active key indicator
- Adjustable playback speed

### Voice → ASL
- Web Speech API transcription with waveform visualizer
- Spoken words auto-converted to ASL letter sequences

### History & Analytics
- Session logs stored in browser local storage — nothing sent to a server
- Recharts-powered analytics: speed, accuracy, and vocabulary metrics over time

### Design
- Opaque token-based design system (no glassmorphism, no colored shadows)
- Full dark/light theme support via CSS custom properties
- Reduced-motion safe — all animations respect `prefers-reduced-motion`
- WCAG-compliant focus indicators and accessible component names

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion 12 |
| Hand Tracking | Google MediaPipe Tasks Vision |
| ML Inference | TensorFlow.js |
| Components | Radix UI primitives |
| State | Zustand |
| Charts | Recharts |
| Testing | Vitest + fast-check + Testing Library |
| Deployment | Vercel |

---

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Authenticated app routes
│   │   ├── translator/     # Live ASL → Text
│   │   ├── text-to-sign/   # Text → ASL
│   │   ├── voice-to-sign/  # Voice → ASL
│   │   ├── history/        # Session history
│   │   └── analytics/      # Usage analytics
│   └── (marketing)/        # Landing page
├── components/
│   ├── landing/            # Marketing page sections
│   ├── layout/             # App shell, sidebar, top nav
│   └── ui/                 # Design system primitives (Button, Card, Badge, etc.)
├── hooks/                  # Webcam, speech recognition, sign detection
├── lib/
│   ├── ml/                 # MediaPipe + TensorFlow.js model providers
│   ├── motion.ts           # Motion variant catalog
│   ├── variant.ts          # Variant resolver
│   ├── async-state.ts      # Async surface state reducer
│   ├── navigation.ts       # Active nav item selector
│   └── typography.ts       # Heading scale constants
└── store/                  # Zustand stores
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A browser with webcam access (Chrome or Edge recommended for Web Speech API)

### Install & Run

```bash
git clone https://github.com/Yashkush06/SignBridge.git
cd SignBridge
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run Tests

```bash
npm test
```

Tests include property-based tests (via `fast-check`) for the pure utility functions, unit tests for components, and snapshot tests for the design system primitives.

---

## ML Model

The ASL classifier is a neural network trained on the [ASL Alphabet dataset](https://www.kaggle.com/datasets/grassknoted/asl-alphabet). It runs entirely in the browser:

1. MediaPipe extracts 21 hand landmarks (x, y, z) per frame
2. The 63-feature vector is fed to a TensorFlow.js model (`tfjs_model/`)
3. The top prediction and confidence score are displayed in real time

Training scripts are in `scripts/train-model/` if you want to retrain.

---

## Deployment

The app is deployed on Vercel. No environment variables are required for the core features — everything runs client-side.

If you want to enable Firebase (for cloud history sync), add these to your Vercel project settings:

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
