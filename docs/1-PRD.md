# PRD — Bolke: Voice AI for Home

## App Name
**Bolke** (Hindi slang for "speak" / "said")

## One-Line App Idea
A voice-first AI assistant that lets a non-technical Indian household member track domestic worker attendance and calculate payroll by simply speaking in Hindi, English, or Hinglish.

## Target Users
- **Primary:** Non-technical household members in India who manage domestic workers (cooks, cleaners, drivers) — specifically people who cannot type, don't use apps, and speak Hindi as their primary language. The original user is a paralysed mother.
- **Secondary:** Portfolio visitors (recruiters, hiring managers, developers) who want to see the app in action without database access.

## Problem You Are Solving
Managing domestic worker attendance in Indian households is done mentally or on paper. This leads to:
- **Disputes at pay time** — "Raju says he missed 2 days, you remember 4."
- **Calculation errors** — deducting absences and half-days from monthly salary manually is error-prone.
- **Exclusion by design** — every existing tool (spreadsheets, HR apps, attendance trackers) assumes digital literacy and English fluency. A paralysed person who speaks only Hindi has zero options.

The user's mother tracks 3 domestic workers. She cannot type. She cannot navigate apps. She can speak. That's the entire interface.

## Main Features
1. **Voice input (STT)** — Tap mic, speak in Hindi/English/Hinglish. Groq Whisper transcribes.
2. **AI intent parsing** — LLaMA 3.3 70B understands natural language commands: log absence, add worker, calculate pay.
3. **Voice output (TTS)** — Every response is spoken back using Fish Audio voice clone (Piyush's voice) with Web Speech API fallback.
4. **Absence logging** — Mark workers absent or half-day for today, yesterday, or a specific date.
5. **Worker management** — Add new workers with their monthly salary.
6. **Payroll calculation** — Calculate net payable for one or all workers with full deduction breakdown (₹26-day Indian standard).
7. **Persistent storage** — All data synced to Supabase PostgreSQL across devices.
8. **Records panel** — Visual sidebar showing all workers, their absences, and salary info.
9. **Demo mode** — Portfolio visitors see sample data, hear voice replies, but cannot write to the database.

## User Roles

| Role | What they can do |
|---|---|
| **Household owner** (authorized) | Full access: voice input, AI chat, log absences, add workers, calculate pay, read/write database. Accessed via `?token=SECRET` URL. |
| **Portfolio visitor** (demo) | Voice input works (Whisper transcription). Chat returns canned demo responses. Sample data (Raju, Sunita, Geeta) shown in records panel. No database writes. |

## User Stories

### Household Owner
- As the household owner, I want to **say "Raju aaj nahi aaya"** and have Bolke log that Raju was absent today, so I don't have to remember or write it down.
- As the household owner, I want to **say "Sunita half day thi kal"** and have Bolke log a half-day for yesterday, so I can correct records after the fact.
- As the household owner, I want to **say "Raju ka is mahine kitna dena hai?"** and hear the exact net payable with deductions explained, so I pay fairly without manual math.
- As the household owner, I want to **say "Geeta ko add karo, 9000 per month"** and have a new worker created, so I can onboard workers by voice.
- As the household owner, I want to **hear every response spoken back in my son's voice**, so I can use the app without looking at the screen.
- As the household owner, I want my data to **persist across devices and sessions**, so I never lose records.

### Portfolio Visitor
- As a portfolio visitor, I want to **tap the mic and speak** and see real Whisper transcription, so I can verify the voice AI actually works.
- As a portfolio visitor, I want to **see sample worker data and hear voice replies**, so I understand what the app does without needing database access.
- As a portfolio visitor, I want to **clearly know this is a demo** and how to contact the builder for full access.

## Success Metrics
- **Primary:** Mother uses the app daily without assistance (zero support calls to Piyush).
- **Activation:** Portfolio visitor taps mic at least once during visit.
- **Reliability:** <1% error rate on voice-to-action pipeline (transcription → intent → DB write).
- **Payroll accuracy:** 100% match with manual calculation on salary, deductions, and net payable.
- **Cost:** ₹0/month running cost on free-tier services.

## MVP Scope (v1 — shipped)
- Voice input via Groq Whisper (Hindi/English/Hinglish)
- AI chat via Groq LLaMA 3.3 70B with structured JSON output
- TTS voice output via Fish Audio (voice clone) with Web Speech API fallback
- Absence logging (absent, half-day) with date parsing
- Worker management (add with salary)
- Payroll calculation (₹26-day standard)
- Supabase PostgreSQL storage with RLS
- Demo mode with sample data for portfolio
- Token-based authorization via URL parameter
- Single HTML file, no build step, Vercel deployment

## Features NOT in Version 1
- WhatsApp integration (log absences via message)
- Monthly PDF payslip generation
- PWA / offline mode with service workers
- Multi-language support (Marathi, Bengali, Tamil)
- Advance and loan tracking
- Festival bonus management
- Multi-worker logging in one utterance ("Raju aur Sunita dono nahi aaye")
- Worker photos or biometric attendance
- Multi-household / multi-user support
- Push notifications / reminders
