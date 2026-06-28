# Implementation Plan — Bolke

## Phase 0 — Project Setup

### What gets built
- Project directory with single `index.html`
- `package.json` with metadata (no runtime dependencies except `msgpackr`)
- `vercel.json` with function config
- `.env.example` documenting required environment variables
- `CLAUDE.md` with AI assistant instructions
- Git repo initialized, connected to GitHub

### Deliverable
- `git push` to GitHub triggers Vercel deployment
- Empty `index.html` loads on `bolke-househelp-tracker.vercel.app`

### Dependencies
- None (first phase)

---

## Phase 1 — Authentication (Token System)

### What gets built
- `initAuth()` function: reads `?token=` from URL → saves to `localStorage` → cleans URL
- `isAuthorized` and `authToken` state variables
- `updateUI()` function that toggles demo vs authorized mode rendering
- Header with app title and TTS toggle button
- Settings gear button (visible only when authorized)

### Deliverable
- Visiting `?token=SECRET` → token stored → URL cleaned → `isAuthorized = true`
- Visiting without token → `isAuthorized = false` → demo mode
- Refreshing after token visit → stays authorized (from localStorage)

### Dependencies
- Phase 0

---

## Phase 2 — Database (Supabase Schema)

### What gets built
- Run SQL setup script in Supabase dashboard (create `workers` + `absences` tables with RLS)
- `initSupa()` function: creates Supabase client from URL + anon key
- `loadFromSupa()`: fetches workers and absences, merges into `workers` state
- `saveWorkerSupa()`: upserts worker by name
- `saveAbsenceSupa()`: upserts absence by (worker_id, date)
- `persist()`: saves `workers` to localStorage as backup cache

### Deliverable
- On authorized page load: "✅ Connected to Supabase — N workers loaded"
- Workers + absences round-trip: write from app → visible in Supabase dashboard → reload app → data appears

### Dependencies
- Phase 1 (needs `isAuthorized` to decide whether to connect)

---

## Phase 3 — Core UI

### What gets built
- Full HTML structure: header, chat panel, records panel, input bar
- All CSS in `<style>` block with CSS custom properties
- `appendMsg(role, html, autoSpeak)` function to add chat bubbles
- `renderRecords()` function to display worker cards in sidebar
- `showWelcome()` function with demo vs authorized welcome messages
- `DEMO_WORKERS` constant with sample data (Raju, Sunita, Geeta)
- Responsive layout: two-column desktop, stacked mobile
- Demo banner with contact info for unauthorized visitors

### Deliverable
- Page loads with welcome message + worker cards in sidebar
- Demo mode shows DEMO_WORKERS; authorized mode shows real data
- Chat bubbles render correctly (user = purple, bot = white)
- Responsive: works on mobile Chrome (mother's primary device)

### Dependencies
- Phase 2 (records panel displays data from `workers` state)

---

## Phase 4 — Main Features

### 4A — Voice Input (STT)

**What gets built:**
- `api/voice.js` Vercel serverless function (proxies Groq Whisper)
- `toggleMic()` function: MediaRecorder → Blob → base64 → POST `/api/voice`
- `blobToBase64()` utility: chunked ArrayBuffer → btoa conversion
- Mic button with recording animation (red pulse)
- "Heard: [text]" confirmation in chat after transcription

**Deliverable:**
- Tap mic → speak Hindi → "Heard: Raju aaj nahi aaya" appears in chat
- Works for both demo and authorized visitors

**Dependencies:** Phase 3 (needs UI + appendMsg)

### 4B — AI Chat (Intent Parsing)

**What gets built:**
- `api/chat.js` Vercel serverless function (proxies Groq LLaMA 3.3, token-gated)
- `callAI(userMessage)` function: builds system prompt with workers data + today's date, sends to `/api/chat`
- System prompt enforcing JSON output: `{ reply, action, data }`
- `getDemoResponse(userMessage)` for contextual canned responses in demo mode
- `handleAction(action, data)` function: routes actions to worker state mutations
- `sendMessage(text)` orchestrator: callAI → handleAction → appendMsg → speak

**Deliverable:**
- Authorized: "Raju aaj nahi aaya" → LLaMA returns `{ reply: "Noted!...", action: "log_absence", data: {...} }` → absence logged
- Demo: same input → canned Hindi/English response, no DB write
- Supported actions: `log_absence`, `add_worker`, `calculate_pay`, `null` (greeting/chitchat)

**Dependencies:** Phase 4A (voice feeds into sendMessage), Phase 2 (handleAction writes to Supabase)

### 4C — Voice Output (TTS)

**What gets built:**
- `api/tts.js` Vercel serverless function (proxies Fish Audio with msgpack encoding)
- `speak(text)` async function: calls `/api/tts` → base64 MP3 → Audio playback
- `speakFallback(text)` function: Web Speech API with `hi-IN` voice as fallback
- `cleanTextForSpeech(text)` utility: strips HTML, emoji, markdown
- `toggleTTS()` function + TTS button in header
- Welcome greeting spoken on page load

**Deliverable:**
- Every bot reply is spoken in Piyush's cloned voice
- If Fish Audio fails, browser Hindi voice speaks instead
- TTS toggle saves preference to localStorage
- Page load greeting: "Namaste! Aapka Piyush Pujari ke ghar ke..."

**Dependencies:** Phase 4B (speak is called after AI response)

---

## Phase 5 — Integrations

All third-party integrations are built into the main features:

| Integration | Built in Phase | Status |
|---|---|---|
| Groq Whisper (STT) | Phase 4A | Core feature |
| Groq LLaMA 3.3 (Chat) | Phase 4B | Core feature |
| Fish Audio (TTS) | Phase 4C | Core feature |
| Supabase (Database) | Phase 2 | Core infrastructure |
| Vercel (Hosting) | Phase 0 | Core infrastructure |

No additional integrations needed for v1.

> Assumption: WhatsApp integration, PDF generation, and push notifications are explicitly out of v1 scope (per PRD).

---

## Phase 6 — Testing

### Manual Testing Checklist

**Demo mode (no token in localStorage):**
- [ ] Demo banner visible in chat panel
- [ ] Settings gear button hidden
- [ ] DEMO_WORKERS loaded in records panel
- [ ] Typing a message returns a contextual demo response + TTS speaks it
- [ ] Mic records, Whisper transcribes (real AI), sends to sendMessage()
- [ ] No Supabase writes attempted

**Authorized mode (token in localStorage):**
- [ ] Demo banner hidden, settings gear visible
- [ ] Typing a message calls /api/chat and gets real LLaMA response
- [ ] Absence logging updates sidebar records + Supabase
- [ ] Pay calculation returns correct figures (verify against manual ÷26 math)
- [ ] TTS speaks bot replies in cloned voice when enabled
- [ ] TTS toggle switches between 🔊 and 🔇

**Voice flow (both modes):**
- [ ] Mic button shows recording animation (red pulse)
- [ ] "Heard: ..." text appears after stopping
- [ ] Response appears and is spoken
- [ ] Long utterances (10+ seconds) don't fail

**Edge cases:**
- [ ] Unknown worker name → LLM asks for clarification
- [ ] Ambiguous date ("kal") → LLM interprets relative to today
- [ ] Empty voice input → handled gracefully
- [ ] Network disconnect → error shown, localStorage data safe
- [ ] Token revoked mid-session → graceful fallback to demo mode

### Deliverable
- All checklist items pass on Chrome Android (mother's device) and Chrome Desktop

### Dependencies
- All previous phases

---

## Phase 7 — Deployment

### What gets built
- Vercel environment variables configured:
  - `GROQ_API_KEY`
  - `DEMO_TOKEN`
  - `FISH_API_KEY`
  - `FISH_VOICE_ID`
- GitHub integration verified: push → auto-deploy
- Production URL confirmed: `bolke-househelp-tracker.vercel.app`
- Private URL shared with family: `...?token=SECRET`

### Deliverable
- Public demo works at production URL (voice input + demo responses)
- Private access works with token URL (full AI + database)
- HTTPS active (required for microphone)

### Dependencies
- Phase 6 (testing passes before going live)

---

## Phase 8 — Final Polish

### What gets built
- Welcome greeting spoken on page load (Fish Audio)
- Error messages in both Hindi and English
- Demo welcome message with portfolio context + contact info
- `README.md` with architecture diagram, setup guide, demo examples
- `CLAUDE.md` with AI assistant instructions for future development
- `.env.example` with variable documentation

### Deliverable
- Complete, polished app that a paralysed mother can use by voice
- Complete, impressive demo that a recruiter can explore in 30 seconds
- Complete documentation for any developer (or AI) to extend

### Dependencies
- Phase 7 (deployed and working)

---

## Build Order Summary

```
Phase 0: Setup          → repo, vercel.json, package.json
Phase 1: Auth           → token system, demo vs authorized mode
Phase 2: Database       → Supabase schema, CRUD functions
Phase 3: Core UI        → chat panel, records panel, responsive layout
Phase 4A: Voice Input   → mic → Whisper STT → transcription
Phase 4B: AI Chat       → LLaMA intent parsing → handleAction
Phase 4C: Voice Output  → Fish Audio TTS → spoken responses
Phase 5: Integrations   → (all built into phases above)
Phase 6: Testing        → manual checklist on Chrome Android + Desktop
Phase 7: Deployment     → Vercel env vars, production URL
Phase 8: Polish         → README, error messages, welcome flow
```

**Build one phase at a time. Verify it works before starting the next.**

---

## Handoff Prompt

When giving these docs to an AI coding agent, paste this:

> "Read all the documents carefully. Do not start coding yet. First summarize what you understood, identify any missing details, and create a build plan. After that, we'll build the app phase by phase, following the Implementation Plan."
