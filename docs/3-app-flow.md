# App Flow Document — Bolke

## All Pages / Screens

Bolke is a **single-page application** (one HTML file). The "screens" are logical sections within the same page:

| Screen / Section | Purpose |
|---|---|
| **Chat Panel** (left/main) | Voice + text conversation with Bolke AI |
| **Records Panel** (right sidebar) | Visual display of all workers, their absences, and salary |
| **Header Bar** | App title, TTS toggle button, settings gear (authorized only) |
| **Settings Modal** | Supabase URL/key configuration (authorized mode only) |
| **Demo Banner** | In-chat welcome message explaining demo limitations (demo mode only) |

## User Journey

### Primary Use Case — Household Owner Logs an Absence

```
1. Mother opens bolke-househelp-tracker.vercel.app
   (token already in localStorage from first visit)

2. App loads → greeting spoken aloud:
   "Namaste! Aapka Piyush Pujari ke ghar ke household tracker application,
    Bolke, mein swagat hai."

3. Welcome message appears in chat:
   "Namaste! Main aapka ghar ka sahayak hoon."
   with example commands listed.

4. Mother taps 🎤 mic button.

5. Mic button turns red, pulsing animation. Mother speaks:
   "Raju aaj nahi aaya"

6. Recording stops (tap again or auto-stop).
   "Heard: Raju aaj nahi aaya" appears in chat.

7. Typing indicator ("...") shows while AI processes.

8. Bot responds in chat:
   "Noted! Raju ki aaj ki absence log ho gayi — 28 June 2026."
   Response is spoken aloud in Piyush's cloned voice.

9. Records panel updates: Raju's card shows new absence entry.

10. Data saved to Supabase + localStorage.
```

### Secondary Use Case — Portfolio Visitor Explores the Demo

```
1. Visitor opens bolke-househelp-tracker.vercel.app (no token).

2. App loads → greeting spoken aloud.

3. Demo welcome message appears explaining:
   - Voice works (tap the mic)
   - Voice replies enabled
   - Records panel shows sample data
   - Database access restricted to Piyush's family
   - Contact Piyush Pujari for write access

4. Records panel shows DEMO_WORKERS: Raju (₹8,000), Sunita (₹7,500), Geeta (₹9,000).

5. Visitor taps mic → speaks anything → Whisper transcribes (real AI).

6. Chat returns a contextual demo response (canned, not from LLaMA).
   Response is spoken aloud.

7. No data is written to the database.
```

## Navigation Flow

```
┌─────────────────────────────────────────────────┐
│                   HEADER                         │
│  [Bolke logo/title]    [🔊 TTS toggle] [⚙ gear] │
└─────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌──────────────────┐  ┌──────────────────────────┐
│   CHAT PANEL      │  │    RECORDS PANEL          │
│                   │  │                           │
│  Welcome message  │  │  Worker Card: Raju        │
│  ↕ Conversation   │  │    ₹8,000/month           │
│  ↕ Bot replies    │  │    Absences: 3 Jun, 10 Jun│
│                   │  │                           │
│  ┌─────────────┐  │  │  Worker Card: Sunita      │
│  │ Text input  │  │  │    ₹7,500/month           │
│  │ [Send] [🎤] │  │  │    Absences: 5 Jun        │
│  └─────────────┘  │  │                           │
└──────────────────┘  │  Worker Card: Geeta        │
                       │    ₹9,000/month           │
                       └──────────────────────────┘

Mobile: Records panel stacks below chat panel.
```

## Button Actions

| Button | Location | Action | Result |
|---|---|---|---|
| **Send (→)** | Chat input bar | Sends typed text to `sendMessage()` | AI processes, reply appears in chat + spoken aloud |
| **🎤 Mic** | Chat input bar | Toggles voice recording (`toggleMic()`) | Start: turns red, pulsing. Stop: sends audio to `/api/voice` → transcription → `sendMessage()` |
| **🔊 / 🔇 TTS** | Header | Toggles `ttsEnabled` (`toggleTTS()`) | ON: all bot replies spoken. OFF: silent. Saved to localStorage. |
| **⚙ Settings** | Header (authorized only) | Opens settings modal | Modal shows Supabase URL + key fields |
| **Save** (in modal) | Settings modal | Saves Supabase credentials → reconnects | `initSupa()` called, data reloaded from Supabase |
| **Close (×)** | Settings modal | Closes modal | No changes saved |

## Empty States

| Screen | Empty State |
|---|---|
| **Chat panel** | Welcome message with example commands. Never truly empty. |
| **Records panel (authorized, no workers)** | Empty panel with subtle "No workers yet — add one by voice" message. |
| **Records panel (demo)** | Always shows DEMO_WORKERS (Raju, Sunita, Geeta). Never empty. |

## Error States

| Error | What the User Sees | Recovery |
|---|---|---|
| **Mic not available** (no HTTPS or denied permission) | "⚠ Microphone access denied. Please allow mic in browser settings." in chat | User grants mic permission in browser |
| **Voice API error** (Whisper fails) | "⚠ Voice error: [error message]" in chat | Retry by tapping mic again. Can also type instead. |
| **Chat API 403** (invalid token) | App silently switches to demo mode. Demo response shown. | User needs correct token URL from Piyush. |
| **Chat API error** (Groq down) | "⚠ AI error — please try again" in chat | Retry. Falls back to demo response if persistent. |
| **TTS fails** (Fish Audio error) | Falls back silently to Web Speech API | Automatic — user hears browser voice instead of clone |
| **Supabase unreachable** | "⚠ Could not connect to database" in chat (non-spoken) | Data persists in localStorage. Supabase sync retries on next load. |
| **Network offline** | Voice and chat fail with error messages | User must wait for connectivity. localStorage data is safe. |

## Success States

| Action | Success Feedback |
|---|---|
| **Absence logged** | Bot reply: "Noted! [Name] ki aaj ki absence log ho gayi — [date]." Records panel updates. Response spoken. |
| **Worker added** | Bot reply: "Done! [Name] add ho gaya/gayi — monthly salary ₹[amount]." New worker card appears in records. |
| **Pay calculated** | Bot reply with full breakdown: salary, absences, half-days, deductions, net payable. Spoken aloud. |
| **Supabase connected** | Status message: "✅ Connected to Supabase — [N] workers loaded" (not spoken). |
| **Voice transcribed** | "Heard: [transcribed text]" shown in chat before AI processing. |

## Login / Signup Flow

There is no traditional login/signup. Auth is token-based:

```
Step 1: Piyush shares URL with family member:
        bolke-househelp-tracker.vercel.app?token=234uyjfhjvjudndhjnmbnhjkl

Step 2: initAuth() extracts ?token= from URL.

Step 3: Token saved to localStorage('bolke_token').

Step 4: URL cleaned to bolke-househelp-tracker.vercel.app (no token visible).

Step 5: isAuthorized = true. Full access enabled.

Step 6: All future visits → token loaded from localStorage → authorized automatically.

Token revocation: Piyush changes DEMO_TOKEN in Vercel env vars → old token returns 403 →
                  app falls back to demo mode → user needs new URL.
```

## Payment or Upgrade Flow

**N/A** — Bolke is a free, personal household tool. No paid tiers. No subscriptions. No in-app purchases. Total running cost: ₹0/month using free tiers of all services.
