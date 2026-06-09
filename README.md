# Bolke — Voice AI for Home

> **A voice-first AI assistant for Indian households. Speak in Hindi, English, or Hinglish — it understands, responds, and remembers.**

**🔗 [Live Demo](https://bolke-househelp-tracker.vercel.app)** — voice input works, no sign-up needed

![Status](https://img.shields.io/badge/status-live-brightgreen)
![Cost](https://img.shields.io/badge/running%20cost-₹0%2Fmonth-blue)
![Stack](https://img.shields.io/badge/stack-Groq%20%7C%20Whisper%20%7C%20LLaMA%203.3%20%7C%20Supabase-purple)
![License](https://img.shields.io/badge/license-MIT-orange)

---

## The Problem

My mother is paralysed. She manages 3 domestic workers and used to track their attendance in her head — leading to disputes and errors every pay cycle.

She cannot type. She doesn't use apps. She speaks Hindi.

Every existing solution — spreadsheets, HR apps, attendance trackers — assumed digital literacy and English fluency she doesn't have. So I built one that didn't.

**What if the interface was just her voice?**

---

## What It Does

Bolke is a voice-first AI assistant that a non-technical user can speak to naturally — in **Hindi, English, or Hinglish** — to:

- 📝 Log when a worker was absent or came half-day
- ➕ Add new workers with their monthly salary
- 💰 Calculate exact pay at month-end with full deduction breakdown
- 🔊 Hear every response spoken back in Hindi (browser TTS)
- ☁️ Sync all data to Supabase PostgreSQL — permanently, across devices

**Portfolio visitors** get the full experience — voice input works, TTS speaks back, sample data shown — but database writes are restricted to the household owner via server-side token auth.

---

## Demo

```
Mother: "Raju aaj nahi aaya"
Bolke:  "Noted! Raju ki aaj ki absence log ho gayi — 9 June 2026."

Mother: "Sunita half day thi kal"
Bolke:  "Done! Sunita ka kal ka half day record ho gaya."

Mother: "Raju ka is mahine kitna dena hai?"
Bolke:  "Raju ki salary ₹8,000 hai. 2 absences aur 1 half day ke
         baad net payable ₹7,077 hai."
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         END USER                              │
│               Speaks Hindi / Hinglish / English               │
└────────────────────────────┬─────────────────────────────────┘
                             │  MediaRecorder → base64 audio
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                    VERCEL SERVERLESS                          │
│                                                               │
│   ┌─────────────────────┐    ┌──────────────────────────┐    │
│   │    /api/voice        │    │       /api/chat           │    │
│   │  No token required   │    │  x-demo-token required    │    │
│   │  Groq Whisper STT    │    │  Groq LLaMA 3.3 70B       │    │
│   │  Returns transcript  │    │  Returns JSON action       │    │
│   └─────────────────────┘    └──────────────────────────┘    │
│                                                               │
│   GROQ_API_KEY + DEMO_TOKEN live here — never in browser     │
└────────────────────────────┬─────────────────────────────────┘
                             │  Structured JSON response
                             ▼
┌──────────────────────────────────────────────────────────────┐
│               SINGLE HTML FILE (index.html)                   │
│                   Hosted on Vercel                            │
│                                                               │
│   handleAction() → Supabase write (if authorized)             │
│   Web Speech API → speaks reply aloud in Hindi                │
│   localStorage  → offline cache                               │
└────────────────────────────┬─────────────────────────────────┘
                             │  upsert workers / absences
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                   SUPABASE POSTGRESQL                         │
│                                                               │
│     workers table          absences table                     │
│   (id, name, salary)    (worker_id, date, type)               │
│        RLS enabled — anon key controls row access             │
└──────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| Single HTML file | Zero installation, zero build step, trivial deployment. The constraint is the story. |
| API keys server-side only | Groq key lives in Vercel env vars, proxied through serverless functions. Never in source code or browser. |
| Token auth via URL param | `?token=SECRET` on first visit → saved to localStorage → sent as header. Clean URLs after. |
| Demo mode for portfolio | Voice recognition (Whisper) works for all visitors. Chat + DB writes require token. Full showcase without data risk. |
| Groq for STT + chat | One provider, one free account, two models. Whisper for Hindi voice, LLaMA 3.3 for intent parsing. |
| Structured JSON from LLM | LLM always returns `{ reply, action, data }`. Deterministic parsing, no ambiguity. |
| Web Speech API for TTS | Free, browser-native, Hindi voice support. No API calls, no latency. |
| Supabase over Google Sheets | Real PostgreSQL with RLS, proper schema, upsert semantics. No Apps Script complexity. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Voice Input (STT) | [Groq Whisper](https://console.groq.com) — `whisper-large-v3-turbo` |
| Chat Intelligence | [Groq LLaMA](https://console.groq.com) — `llama-3.3-70b-versatile` |
| Voice Output (TTS) | Web Speech Synthesis API — browser-native, Hindi (`hi-IN`) |
| Backend / API proxy | Vercel Serverless Functions — Node.js 18, CommonJS |
| Database | [Supabase](https://supabase.com) PostgreSQL with Row Level Security |
| Auth | Server-side token — `DEMO_TOKEN` env var, never in client code |
| Frontend | Vanilla HTML + CSS + JavaScript — zero dependencies, zero build step |
| Hosting | [Vercel](https://vercel.com) — auto-deploys on every GitHub push |

---

## Running Cost

| Service | Usage | Cost |
|---|---|---|
| Groq (LLaMA 3.3 chat) | ~50 messages/day | **Free** |
| Groq (Whisper STT) | ~10 voice inputs/day | **Free** |
| Web Speech TTS | Unlimited | **Free** |
| Supabase | <500MB, <50k requests/month | **Free** |
| Vercel | Hobby plan, serverless functions | **Free** |
| **Total** | | **₹0 / month** |

---

## Project Structure

```
bolke/
├── index.html        ← Entire frontend (HTML + CSS + JS, ~800 lines)
├── api/
│   ├── chat.js       ← Vercel function: LLaMA proxy, token-gated
│   └── voice.js      ← Vercel function: Whisper proxy, open to all
├── vercel.json       ← maxDuration: 30s for both functions
├── package.json      ← Metadata only, no runtime dependencies
├── .env.example      ← Documents required Vercel env vars
├── CLAUDE.md         ← Instructions for AI assistants on this codebase
└── README.md
```

The entire application logic — UI, voice pipeline, AI integration, payroll engine — lives in `index.html`. The `api/` folder exists only to proxy API keys server-side. No build tools. No package manager. No framework.

---

## Setup Guide

### Prerequisites
- A [Groq account](https://console.groq.com) (free) — for voice + chat
- A [Supabase account](https://supabase.com) (free) — for database
- A [Vercel account](https://vercel.com) (free) — for hosting + serverless functions

### Step 1 — Fork and deploy to Vercel
1. Fork this repo on GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → import your fork
3. Framework preset: **Other** → Deploy

### Step 2 — Set environment variables
In Vercel → Project → Settings → Environment Variables, add:

| Variable | Value |
|---|---|
| `GROQ_API_KEY` | Your key from [console.groq.com](https://console.groq.com) → API Keys |
| `DEMO_TOKEN` | Any strong random string (e.g. `openssl rand -hex 24`) |

Redeploy after saving.

### Step 3 — Set up Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run:

```sql
CREATE TABLE IF NOT EXISTS workers (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name           TEXT UNIQUE NOT NULL,
  monthly_salary INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS absences (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id  UUID REFERENCES workers(id) ON DELETE CASCADE,
  date       TEXT NOT NULL,
  type       TEXT CHECK (type IN ('absent','half')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, date)
);

ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow all" ON workers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON absences FOR ALL USING (true) WITH CHECK (true);
```

3. In `index.html`, replace the default Supabase URL and anon key with yours (lines ~450):
```javascript
let supaUrl = localStorage.getItem('bolke_supa_url') || 'https://YOUR-PROJECT.supabase.co';
let supaKey = localStorage.getItem('bolke_supa_key') || 'YOUR-ANON-KEY';
```

### Step 4 — Access your app

| Who | URL |
|---|---|
| Portfolio visitors | `https://your-app.vercel.app` — demo mode, read-only |
| Household owner | `https://your-app.vercel.app?token=YOUR_DEMO_TOKEN` — full access |

The token is saved to localStorage on first visit. Subsequent visits via the plain URL work automatically.

> **Note:** Microphone requires HTTPS. Vercel provides this automatically.

---

## Supported Voice Commands

| What you say | Language | What happens |
|---|---|---|
| "Raju aaj nahi aaya" | Hindi | Logs Raju absent today |
| "Sunita absent today" | English | Logs Sunita absent today |
| "Geeta half day thi kal" | Hinglish | Logs Geeta half day yesterday |
| "Add Raju, 8000 per month" | English | Creates Raju with ₹8,000 salary |
| "Kitna dena hai Raju ko?" | Hindi | Calculates Raju's net pay |
| "Sabka pay batao" | Hindi | Calculates pay for all workers |
| "Hello" / "Namaste" | Any | Friendly greeting |

---

## Payroll Formula

```
Daily Rate      = Monthly Salary ÷ 26    (Indian standard: 26 working days/month)
Full Deduction  = Absent Days × Daily Rate
Half Deduction  = Half Days × (Daily Rate ÷ 2)
Net Payable     = Monthly Salary − Full Deduction − Half Deduction
```

---

## Responsible AI Considerations

| Risk | How it's handled |
|---|---|
| Mishearing a name | LLM confirms back in the reply — user can correct before trusting the output |
| Wrong date interpretation | Today's date is injected into the system prompt — LLM uses it as anchor |
| Hallucinated worker names | Workers list is passed in context — LLM can only reference workers that exist |
| API key exposure | Keys live in Vercel env vars, proxied server-side — never in HTML or browser |
| Unauthorized database writes | Every write requires a valid token header — verified server-side before any Groq call |
| Demo visitor confusion | Clear banner explains demo mode — visitors know they're not seeing real data |

---

## Limitations

- Voice requires Chrome (Safari/Firefox MediaRecorder support is inconsistent)
- TTS quality depends on Hindi voice packages installed on the device — Android Chrome has the best support
- Single-user design — last write wins if two devices write simultaneously
- LLM can misparse ambiguous dates ("kal" could mean yesterday or tomorrow depending on context)
- No offline support — voice and chat require internet connection

---

## Roadmap

- [ ] Demo video — 60 seconds of real use
- [ ] WhatsApp integration — log absences without opening the app
- [ ] Monthly PDF payslip generation
- [ ] PWA with offline service workers
- [ ] Multi-language support (Marathi, Bengali)
- [ ] Advance and loan tracking
- [ ] Festival bonus management
- [ ] Multi-worker logging in one utterance ("Raju aur Sunita dono nahi aaye")

---

## Research Notes

Built to validate three hypotheses:

1. **Conversational UI beats forms for low-literacy users** — A user who cannot navigate a spreadsheet can speak naturally to log an absence. The LLM handles intent parsing, date interpretation, and language switching in one step.

2. **Structured JSON output makes LLMs production-reliable** — LLaMA 3.3 70B with a tight system prompt always returns `{ reply, action, data }`. The JSON contract eliminates ambiguity and makes the system deterministic enough for real use.

3. **Zero-cost AI stacks are production-viable** — Every component (Groq, Supabase, Vercel, Web Speech API) is free at this usage scale. Total running cost: ₹0/month.

---

## License

MIT — free to use, modify, and distribute.

---

## Acknowledgements

- [Groq](https://groq.com) for making Whisper and LLaMA accessible at zero cost
- [Meta AI](https://ai.meta.com) for open-sourcing the LLaMA model family
- [Supabase](https://supabase.com) for making PostgreSQL accessible to indie developers
- [Vercel](https://vercel.com) for serverless functions that just work

---

*Built for my mother — and for every person that technology forgot to consider.*
