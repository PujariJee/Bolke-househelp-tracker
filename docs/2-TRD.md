# TRD — Technical Requirements Document

## Frontend Stack

| Layer | Technology | Reason |
|---|---|---|
| Framework | None — vanilla HTML + CSS + JS | Single-file constraint is the portfolio story. Zero dependencies = zero build step = trivial deployment. |
| Language | JavaScript (ES2020+) | Browser-native, no transpilation needed. |
| Styling | Inline `<style>` block with CSS custom properties | Self-contained in `index.html`. CSS variables enable theming. |
| External font | Google Fonts — Inter (400, 500, 600, 700) | Clean, professional, legible on mobile. |
| External SDK | Supabase JS SDK via CDN (UMD) | `@supabase/supabase-js@2` loaded from jsDelivr. Only external script tag. |

## Backend Stack

| Layer | Technology | Reason |
|---|---|---|
| Runtime | Node.js 18 (Vercel Serverless Functions) | Zero-config, auto-deploys on git push, free hobby tier. |
| Module system | CommonJS (`module.exports`) | Vercel default for serverless. No `"type": "module"` in package.json. |
| Functions | 3 files in `api/` directory — `chat.js`, `voice.js`, `tts.js` | Each proxies one external API. Keeps API keys server-side. |
| Framework | None — raw request/response handlers | Vercel provides `(req, res)` natively. Express would be overhead. |

## Database

| | |
|---|---|
| **Engine** | PostgreSQL (Supabase managed) |
| **Why** | Relational data (workers → absences = one-to-many). Supabase provides free PostgreSQL with RLS, REST API, and JS SDK. Real SQL beats Google Sheets for upserts and joins. |
| **Tables** | `workers`, `absences` |
| **Access** | Supabase anon key (public, safe) from browser. RLS policies control row access. |
| **Client-side cache** | `localStorage` holds `workers` JSON as offline fallback. Supabase overwrites on load (authorized mode). |

## Authentication Method

| Mechanism | Detail |
|---|---|
| **Type** | Server-side token comparison (not OAuth, not JWT) |
| **Flow** | User visits `?token=SECRET` → `initAuth()` saves token to `localStorage` → cleans URL → subsequent visits use stored token |
| **Verification** | Every `/api/chat` request sends token as `x-demo-token` header → `chat.js` compares against `DEMO_TOKEN` env var → 403 if mismatch |
| **Demo mode** | No token = `isAuthorized = false` → frontend shows demo data, returns canned responses, blocks DB writes |
| **Session persistence** | `localStorage('bolke_token')` — no expiry, no refresh. Single-user household app, not a SaaS. |

> Assumption: Token rotation is manual (regenerate in Vercel env vars, share new URL with family). No automated rotation needed for a household of 1–2 users.

## APIs Needed

### Internal Endpoints (Vercel Serverless)

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/chat` | POST | `x-demo-token` header required | Proxies Groq LLaMA 3.3 70B. Receives `{ messages }`, returns chat completion JSON. |
| `/api/voice` | POST | None (transcription only) | Proxies Groq Whisper. Receives `{ audio, mimeType, ext }` as base64 JSON, returns `{ text }`. |
| `/api/tts` | POST | None | Proxies Fish Audio TTS. Receives `{ text }`, returns `{ audio }` as base64 MP3. |

### External APIs

| API | Provider | Model | Purpose |
|---|---|---|---|
| Chat completions | Groq | `llama-3.3-70b-versatile` | Intent parsing + response generation. System prompt enforces JSON output: `{ reply, action, data }`. |
| Audio transcription | Groq | `whisper-large-v3-turbo` | Hindi/English/Hinglish speech-to-text. Language hint: `hi`. |
| Text-to-speech | Fish Audio | Custom voice clone (Piyush's voice) | Converts response text to MP3 audio in cloned voice. Msgpack request format. |
| Database CRUD | Supabase | REST API via JS SDK | Workers and absences table read/write from browser (authorized mode only). |

## AI Models or Tools

| Model | Provider | Use | Config |
|---|---|---|---|
| LLaMA 3.3 70B | Groq (`llama-3.3-70b-versatile`) | Intent parsing: takes natural language → returns structured JSON `{ reply, action, data }` | `temperature: 0.3`, `max_tokens: 1000`. System prompt includes workers list, today's date, and strict JSON output contract. |
| Whisper Large v3 Turbo | Groq (`whisper-large-v3-turbo`) | Speech-to-text. Handles Hindi, English, Hinglish. | `language: 'hi'`. Prompt hint includes domain vocabulary: "absent, half day, salary, nahi aaya, aadha din". |
| Fish Audio Voice Clone | Fish Audio (custom `reference_id`) | Text-to-speech in Piyush's cloned voice. | `format: mp3`, `mp3_bitrate: 128`, `latency: normal`. Msgpack-encoded request body. |

## Cloud / Deployment Setup

| Component | Service | Config |
|---|---|---|
| Hosting | Vercel (Hobby plan, free) | GitHub integration — auto-deploys on every `git push` to `main`. |
| Serverless functions | Vercel Functions | 3 functions in `api/`, each with `maxDuration: 30s` (set in `vercel.json`). |
| Database | Supabase (free tier) | Project URL: `qmbjhfiyddsesrbignyy.supabase.co`. <500MB, <50k requests/month. |
| Domain | `bolke-househelp-tracker.vercel.app` (Vercel default) | HTTPS provided automatically (required for microphone access). |
| CI/CD | GitHub → Vercel auto-deploy | No manual CLI deployment needed. Push = deploy. |

### Environment Variables (Vercel Dashboard)

| Variable | Used by | Purpose |
|---|---|---|
| `GROQ_API_KEY` | `api/chat.js`, `api/voice.js` | Groq API authentication |
| `DEMO_TOKEN` | `api/chat.js` | Compared against `x-demo-token` header |
| `FISH_API_KEY` | `api/tts.js` | Fish Audio API authentication |
| `FISH_VOICE_ID` | `api/tts.js` | Fish Audio voice clone reference ID |

## Security Requirements

| Requirement | Implementation |
|---|---|
| API key protection | All API keys (Groq, Fish Audio) live in Vercel env vars. Never in HTML, never in browser, never in source code. |
| Token auth | `DEMO_TOKEN` checked server-side on every `/api/chat` request. 403 response on mismatch. |
| Supabase anon key | Designed to be public (Supabase docs confirm). RLS policies are the actual access control layer. |
| Input sanitization | LLM output is parsed as JSON before display. HTML content uses `innerHTML` with LLM-generated text (not user-generated). |
| CORS | All API functions set `Access-Control-Allow-Origin: *` (single-origin app, no sensitive cookies). |
| HTTPS | Enforced by Vercel. Required for `MediaRecorder` API (microphone access). |

> Assumption: XSS via LLM output is low-risk since the LLM system prompt constrains output to structured JSON. If adversarial prompting becomes a concern, HTML-escape `reply` before `innerHTML`.

## Performance Requirements

| Metric | Target | Current |
|---|---|---|
| Voice-to-response latency | <5 seconds end-to-end | ~3–4s (Whisper ~1s, LLaMA ~1.5s, Fish Audio TTS ~1s) |
| TTS playback start | <2 seconds after response | ~1.5s (base64 decode + Audio playback) |
| Page load | <2 seconds | <1s (single HTML file, one font, one CDN script) |
| Concurrent users | 1–2 (household) | No scaling needed |

## Third-Party Integrations

| Service | Purpose | Cost |
|---|---|---|
| Groq | STT + Chat AI | Free (rate-limited) |
| Fish Audio | Voice clone TTS | Free tier (10k chars/month) |
| Supabase | PostgreSQL database | Free tier |
| Vercel | Hosting + serverless | Free (Hobby plan) |
| Google Fonts | Inter font family | Free |

**Total running cost: ₹0/month**

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     USER (speaks Hindi)                       │
└───────────────┬──────────────────────┬───────────────────────┘
                │ MediaRecorder        │ Text input
                │ (base64 audio)       │
                ▼                      ▼
┌──────────────────────────────────────────────────────────────┐
│                   VERCEL SERVERLESS                           │
│                                                               │
│  /api/voice          /api/chat            /api/tts            │
│  (Whisper STT)       (LLaMA 3.3)         (Fish Audio)        │
│  No auth             Token required       No auth             │
│  → { text }          → { reply, action }  → { audio: b64 }   │
│                                                               │
│  Env: GROQ_API_KEY, DEMO_TOKEN, FISH_API_KEY, FISH_VOICE_ID │
└──────────────────────────────────────────────────────────────┘
                │                      │
                ▼                      ▼
┌──────────────────────┐  ┌────────────────────────────────────┐
│   index.html          │  │       SUPABASE POSTGRESQL          │
│   (Single file)       │  │                                    │
│                       │  │  workers: id, name, salary          │
│   - callAI()          │  │  absences: worker_id, date, type    │
│   - handleAction()    │  │  RLS enabled                        │
│   - speak() → TTS     │  │                                    │
│   - renderRecords()   │  └────────────────────────────────────┘
│   - localStorage      │
└──────────────────────┘
```

## Key Technical Decisions with Reasons

| Decision | Why | Tradeoff |
|---|---|---|
| **Single HTML file** | Zero-installation story for portfolio. Mother doesn't install anything — it's a URL. No build tooling to break. | Harder to refactor. No code splitting. But at ~900 lines it's manageable. |
| **Groq over OpenAI** | Free tier with fast inference. One provider for both Whisper STT and LLaMA chat. | Tied to Groq's rate limits and model availability. Fallback would be OpenAI. |
| **LLaMA 3.3 70B structured JSON** | System prompt enforces `{ reply, action, data }` contract. Deterministic parsing, no regex. | Occasional JSON parse failures on edge cases. Handled by try/catch fallback. |
| **Token auth over OAuth** | 1–2 household users. OAuth is massive overhead for a family app. URL token → localStorage is 5 lines of code. | No user management, no password reset, no multi-user. Perfect for this scope. |
| **Fish Audio over ElevenLabs** | Free tier for voice cloning. Supports Hindi. API accessible. | Requires msgpack encoding (added `msgpackr` dependency). Quality slightly below ElevenLabs. |
| **Web Speech API as TTS fallback** | Free, browser-native, no API call. If Fish Audio fails, mother still hears a response. | Hindi voice quality varies by device/browser. Android Chrome is best. |
| **Supabase over Google Sheets** | Real PostgreSQL with RLS, proper schema, upsert semantics. No Apps Script complexity. | Requires SQL setup. But one-time, and the anon key is safe to be public. |
| **base64 audio over multipart** | Simpler JSON body for Vercel serverless. No `multer` or form parsing dependency. | Larger payload (~33% overhead). Acceptable for short voice clips (<10s). |
| **No framework (React, Vue, etc.)** | The "no dependencies" constraint is the story. Proves AI can be shipped without complexity. | Manual DOM manipulation. State management via global variables. Acceptable at this scale. |
