# MedDevice Cold Call Simulator

A voice-powered AI cold call training tool for medical device sales reps. Practice realistic cold calls against AI-powered executive personas, get real-time exchange grading, and receive detailed AI scorecards after each call.

**Live demo:** [deansperduti23-laser.github.io/cold-call-simulator](https://deansperduti23-laser.github.io/cold-call-simulator/)

> This project was built with AI assistance using Claude Code by Anthropic.

## How It Works

1. Enter a free Groq API key (no credit card needed)
2. Choose an executive persona to cold call (CEOs and VPs of Sales at medical device companies)
3. Speak naturally through your microphone — the AI prospect responds with voice
4. Each exchange is graded in real-time (A-F) on sales technique
5. End the call to receive a detailed 8-dimension AI scorecard with coaching feedback

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **AI Conversation:** Groq API (Llama 3.3 70B) — free tier, no credit card
- **Speech-to-Text:** Groq Whisper (whisper-large-v3-turbo) for accurate transcription
- **Text-to-Speech:** Web Speech API (browser-native, gender-specific voices)
- **Speech Detection:** Web Speech API (SpeechRecognition) for real-time interim text
- **Routing:** Wouter with hash-based routing
- **Storage:** localStorage (fully client-side, no server needed)
- **Hosting:** GitHub Pages (static site)

## Prerequisites

- **Node.js** 18+ and npm
- **Chrome browser** (required for Web Speech API and microphone access)
- **Groq API key** — get one free at [console.groq.com/keys](https://console.groq.com/keys)

## Local Development

```bash
# Clone the repository
git clone https://github.com/deansperduti23-laser/cold-call-simulator.git
cd cold-call-simulator

# Install dependencies
npm install

# Start the dev server (with backend for local testing)
npm run dev

# Open http://localhost:5000 in Chrome
```

## Building for Production (Static Site)

The app is fully client-side and can be deployed as a static site to any hosting provider.

```bash
# Build the static site
npx vite build

# Output is in dist/public/
# Deploy the contents of dist/public/ to any static host
```

## Deploying to GitHub Pages

```bash
# Build
npx vite build

# Deploy to gh-pages branch
npx gh-pages -d dist/public
```

The site will be available at `https://<your-username>.github.io/cold-call-simulator/`

## Project Structure

```
client/src/
  App.tsx              # Router setup
  main.tsx             # Entry point
  index.css            # Tailwind styles
  lib/
    groq-client.ts     # Direct browser-to-Groq API calls
    personas.ts        # 7 executive personas with deep behavioral profiles
    prompts.ts         # System prompt and scoring rubric builders
    sessions.ts        # localStorage-based session management
  pages/
    Call.tsx            # Main CRM simulator with voice chat
    Scorecard.tsx       # Post-call 8-dimension AI scorecard
    History.tsx         # Call history with scores
```

## Personas

| Name | Title | Company |
|------|-------|---------|
| David Hartley | CEO | NovaPulse Medical (interventional cardiology) |
| Christine Park | CEO | LuminarX Surgical (minimally invasive surgical tools) |
| John Pork | CEO | Vertex MedTech (orthopedic implants, PE-backed) |
| Marcus Webb | VP of Sales | NovaPulse Medical |
| Jason Trevino | VP of Sales | LuminarX Surgical |
| Derek Mills | VP of Sales | Vertex MedTech |
| Angela Russo | VP of Sales | ClearVision Diagnostics (ophthalmic equipment) |

## Scoring Dimensions

Each call is scored 1-10 on 8 dimensions:

1. Opening & Pattern Interrupt
2. Rapport & Trust Building
3. Discovery & Questioning
4. Value Proposition Delivery
5. Objection Handling
6. Medical Device Knowledge
7. Call Control & Momentum
8. Close / Next Step

## License

MIT
