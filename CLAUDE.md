# CLAUDE.md — Instructions for AI Assistants Working on This Codebase

This file tells Claude (or any AI assistant) how to work effectively on the Bolke project.

---

## Project Overview

Bolke is a **voice-first AI assistant** for Indian households — tracks househelp attendance and computes payroll via natural conversation in Hindi, English, or Hinglish. Built for real use by a non-technical user (paralysed mother).

**Architecture:** Single HTML file (`index.html`) + two Vercel serverless functions (`api/chat.js`, `api/voice.js`). No build step, no bundler.

---

## File Structure

```
bolke/
├── index.html       ← Entire frontend (HTML + CSS + JS, ~850 lines)
├── api/
│   ├── chat.js      ← Vercel function: proxies LLaMA 3.3 chat, token-gated
│   └── voice.js     ← Vercel function: proxies Whisper STT, open to all
├── vercel.json      ← Vercel config (maxDuration: 30s for both functions)
├── package.json     ← Metadata only — no runtime dependencies
├── .env.example     ← Documents required Vercel env vars
├── README.md
└── CLAUDE.md        ← This file
```

---

## Architecture at a Glance

```
index.html
├── <style>          → All CSS, inline
├── <body>           → HTML structure + demo banner + TTS toggle
└── <script>         → All JavaScript, inline
    ├── State        → workers{}, chatHistory[], authToken, isAuthorized, ttsEnabled
    ├── DEMO_WORKERS → Hardcoded sample data shown to unauthenticated visitors
    ├── initAuth()   → Reads ?token= from URL → localStorage; sets isAuthorized
    ├── speak()      → Web Speech API TTS (hi-IN, toggleable)
    ├── toggleTTS()  → Toggles ttsEnabled + persists to localStorage
    ├── Supabase     → initSupa(), loadFromSupa(), saveWorkerSupa(), saveAbsenceSupa()
    ├── UI helpers   → appendMsg(), renderRecords(), showTyping(), showWelcome()
    ├── Settings     → openModal(), closeModal(), saveSettings() [Supabase only]
    ├── updateUI()   → Demo mode vs authorized mode rendering
    ├── getDemoResponse() → Context-aware canned responses for demo visitors
    ├── callAI()     → Calls /api/chat (authorized) or returns demo response
    ├── handleAction()→ Mutates workers{} — skipped in demo mode
    ├── sendMessage() → Orchestrates full message → AI reply → TTS flow
    ├── toggleMic()  → MediaRecorder → base64 → /api/voice → Whisper → sendMessage
    └── Init         → initAuth(), initSupa(), updateUI(), showWelcome()

api/chat.js
└── POST /api/chat   → Checks x-demo-token header vs DEMO_TOKEN env var
                       → 403 if mismatch (frontend falls back to demo response)
                       → Proxies to Groq LLaMA 3.3 70B if authorized

api/voice.js
└── POST /api/voice  → No token required (transcription only, no data risk)
                       → Receives base64 audio in JSON body
                       → Reconstructs blob → FormData → Groq Whisper
                       → Returns { text: "transcribed text" }
```

---

## Security Model

| Layer | How it works |
|---|---|
| Groq API key | Lives in Vercel env vars (`GROQ_API_KEY`). Never in HTML. Never in browser. |
| DEMO_TOKEN | Lives in Vercel env vars. Visitor gets it once via `?token=SECRET` URL. Saved to localStorage. Sent as `x-demo-token` header on every `/api/chat` request. |
| Supabase | Anon key in localStorage (safe — designed to be public). RLS policies control row access. |
| Demo mode | No token → frontend returns canned response, no LLaMA call, no DB write. Whisper still works (voice showcase). |

---

## Key State Variables

```javascript
let workers      = {};          // { "Name": { _id, monthlySalary, absences: [{date, type}] } }
let chatHistory  = [];          // OpenAI-format messages for multi-turn context
let authToken    = '';          // From localStorage('bolke_token')
let isAuthorized = false;       // !!authToken
let ttsEnabled   = true;        // Persisted to localStorage('bolke_tts')
let supaUrl      = '';          // Persisted to localStorage('bolke_supa_url')
let supaKey      = '';          // Persisted to localStorage('bolke_supa_key')
let supa         = null;        // Supabase client instance (null if not configured)
```

---

## Key Conventions

### Token flow
```
User visits bolke.vercel.app?token=SECRET
→ initAuth() saves to localStorage, cleans URL
→ isAuthorized = true
→ subsequent visits to bolke.vercel.app use stored token

Portfolio visitor visits bolke.vercel.app (no token)
→ isAuthorized = false → demo mode
→ demo banner shown, DEMO_WORKERS loaded, settings button hidden
```

### LLM Output Contract (authorized mode only)
The LLM always returns **raw JSON** — no markdown, no code fences:
```json
{ "reply": "...", "action": "log_absence|add_worker|calculate_pay|null", "data": {} }
```
`handleAction()` parses this. Always keep these exact field names.

### appendMsg signature
```javascript
appendMsg(role, htmlText, autoSpeak = true)
// autoSpeak = false for system/status messages (Supabase loaded, errors etc.)
// autoSpeak = true for real conversation replies (default)
```

### Voice flow
```
toggleMic() → MediaRecorder → Blob → blobToBase64() → POST /api/voice
→ { text: "heard text" } → sendMessage(text) → callAI() → appendMsg() → speak()
```

### Audio encoding
Audio is sent as **base64 JSON** (not multipart FormData) from browser to `/api/voice`.
`api/voice.js` reconstructs `Buffer.from(audio, 'base64')` → `new Blob([buffer])` → FormData for Groq.

---

## What to Watch Out For

### Do NOT
- Add external `<script src="...">` dependencies — single-file constraint
- Use `innerHTML` with user-provided content without sanitisation
- Hardcode `GROQ_API_KEY` or `DEMO_TOKEN` in HTML or JS
- Change `sendMessage(text)` signature — used by both keyboard input and voice
- Break the JSON output contract in the system prompt — `handleAction()` depends on exact field names
- Call Supabase write functions when `isAuthorized === false`
- Add `node_modules` or `"type": "module"` to package.json (breaks Vercel CommonJS functions)

### Always
- Call `persist()` after any mutation to `workers`
- Call `renderRecords()` after any mutation to `workers`
- Use `autoSpeak = false` for status/system messages in `appendMsg()`
- Keep `module.exports = async function handler(req, res)` in both api files (Vercel CommonJS)
- Test both demo mode (no token) and authorized mode after changes

---

## Vercel Environment Variables Required

| Variable | Where used |
|---|---|
| `GROQ_API_KEY` | `api/chat.js` and `api/voice.js` |
| `DEMO_TOKEN` | `api/chat.js` (checked against `x-demo-token` header) |

Set them at: vercel.com → Project → Settings → Environment Variables

---

## Payroll Formula

```
Daily Rate      = Monthly Salary ÷ 26    (Indian standard: 26 working days/month)
Full Deduction  = Absent Days × Daily Rate
Half Deduction  = Half Days × (Daily Rate ÷ 2)
Net Payable     = Monthly Salary − Full Deduction − Half Deduction
```

**Do not change the ÷26 constant without discussion** — it's Indian payroll standard.

---

## Testing Checklist

Before committing any change, verify:

**Demo mode (no token in localStorage):**
- [ ] Demo banner visible in chat panel
- [ ] Settings gear button hidden
- [ ] DEMO_WORKERS loaded in records panel with "demo" badge
- [ ] Typing a message returns a contextual demo response + TTS speaks it
- [ ] Mic records, /api/voice transcribes (real Whisper), sends to sendMessage()
- [ ] No Supabase writes attempted

**Authorized mode (token in localStorage):**
- [ ] Demo banner hidden, settings gear visible
- [ ] Typing a message calls /api/chat and gets real LLaMA response
- [ ] Absence logging updates sidebar records
- [ ] Pay calculation returns correct figures
- [ ] Settings modal opens, saves Supabase URL+key, triggers loadFromSupa()
- [ ] TTS speaks bot replies when enabled
- [ ] TTS toggle button switches between 🔊 and 🔇

**Voice flow (both modes):**
- [ ] Mic button shows recording animation
- [ ] "Heard: ..." text appears after stopping
- [ ] Response appears and is spoken

---

## Common Tasks

### Adding a new intent/action
1. Add intent name to system prompt's action enum in `callAI()`
2. Add data shape to system prompt's action shapes section
3. Add a handler block in `handleAction()`
4. Add a case in `getDemoResponse()` for demo mode
5. Test with both typed and voice input

### Changing TTS language/voice
- Change `utt.lang` in `speak()` — currently `'hi-IN'`
- Rate and pitch are tuned for Hindi: rate=0.88, pitch=1.0
- Voice selection tries to find `hi-IN` or `hi` voices first

### Rotating the DEMO_TOKEN
- Generate a new token: `openssl rand -hex 24`
- Update in Vercel env vars
- Share new URL with household owner: `https://your-app.vercel.app?token=NEW_TOKEN`
- Old token stops working immediately after Vercel redeploy

### Adding a new worker field
1. Add column to the Supabase SQL (update `SETUP_SQL` constant in index.html)
2. Update `saveWorkerSupa()` upsert
3. Update `loadFromSupa()` parser
4. Update `workers` state shape
5. Update `renderRecords()` worker card
6. Update system prompt worker data format

---

## Environment

- **Runtime:** Browser (Chrome on Android primarily) + Vercel Node.js 18
- **No build step, no compilation, no bundler**
- **HTTPS required** for microphone access
- **localStorage** is source of truth on load; Supabase overwrites asynchronously (authorized mode only)
