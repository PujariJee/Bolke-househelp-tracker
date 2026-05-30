# CLAUDE.md — Instructions for AI Assistants Working on This Codebase

This file tells Claude (or any AI assistant) how to work effectively on the Househelp Tracker project.

---

## Project Overview

Househelp Tracker is a **single-file web application** — the entire codebase lives in `househelp-tracker.html`. There is no build system, no package manager, no separate JS/CSS files. Everything is inline.

---

## Architecture at a Glance

```
househelp-tracker.html
├── <style>          → All CSS, inline
├── <body>           → HTML structure
└── <script>         → All JavaScript, inline
    ├── State        → workers{}, chatHistory[], scriptUrl, openaiKey, ttsEnabled
    ├── UI helpers   → appendMsg(), renderRecords(), showTyping()
    ├── Sheets sync  → syncToSheets(), loadFromSheets(), saveData()
    ├── Modal        → openModal(), closeModal(), saveSettings()
    ├── callAI()     → Groq LLaMA 3.3 chat completion
    ├── handleAction()→ Mutates workers{} based on LLM intent
    ├── sendMessage() → Orchestrates full user message → AI reply flow
    ├── toggleMic()  → MediaRecorder + Groq Whisper STT
    ├── TTS          → speak(), toggleTTS(), loadVoices()
    └── Init         → Runs on page load
```

---

## Key Conventions

### State Management
- All application state lives in the `workers` object: `{ "Name": { monthlySalary, absences: [{date, type}] } }`
- `saveData()` must be called after every mutation — it writes to both localStorage AND Google Sheets
- Never mutate `workers` directly without calling `saveData()` and `renderRecords()` after

### LLM Output Contract
The LLM (Groq LLaMA) is always instructed to return **raw JSON only** — no markdown, no code fences:
```json
{ "reply": "...", "action": "log_absence|add_worker|calculate_pay|null", "data": {} }
```
The parser in `callAI()` strips markdown fences as a fallback but the prompt enforces raw JSON.

### API Calls
- **Chat:** `POST https://api.groq.com/openai/v1/chat/completions` — model `llama-3.3-70b-versatile`
- **Voice STT:** `POST https://api.groq.com/openai/v1/audio/transcriptions` — model `whisper-large-v3-turbo`
- **Storage:** `POST [user-configured Apps Script URL]` — actions `save` and `load`
- All API keys are stored in localStorage and passed at runtime — **never hardcoded**

### Payroll Calculation
- Base: 26 working days/month (Indian standard — do not change this constant without discussion)
- Half day = deduct 0.5 × daily rate
- Full absent = deduct 1 × daily rate

---

## What to Watch Out For

### Do NOT
- Add external `<script src="...">` dependencies — the app must remain self-contained
- Use `innerHTML` with user-provided content without sanitisation
- Hardcode any API keys, URLs, or credentials
- Change the `sendMessage(text)` signature — it accepts both direct text (from voice) and reads the input field when called without arguments
- Break the JSON output contract in the system prompt — `handleAction()` depends on exact field names

### Always
- Call `saveData()` after any mutation to `workers`
- Call `renderRecords()` after any mutation to `workers`
- Keep the single-file constraint — do not split into multiple files
- Test voice flow end-to-end after any changes to `toggleMic()` or `sendMessage()`
- Preserve the `language: 'hi'` parameter in the Whisper API call

---

## Common Tasks

### Adding a new intent/action
1. Add the intent name to the system prompt's action enum
2. Add data shape to the system prompt's action data shapes section
3. Add a handler block in `handleAction()`
4. Test with both typed and voice input

### Changing the LLM model
- Only change the `model` field in `callAI()`
- Must be a Groq-hosted model with OpenAI-compatible API
- Keep temperature at 0.3 or lower for consistent JSON output

### Changing the STT model
- Only change the `model` field in the Whisper `formData.append` call inside `toggleMic()`
- Must support `language: 'hi'` parameter

### Adding a new settings field
1. Add input to the modal HTML
2. Add a `let varName = localStorage.getItem('hht_key') || ''` state variable
3. Populate field in `openModal()`
4. Save in `saveSettings()`
5. Use in relevant function

### Modifying Google Sheets sync
- The Apps Script code is embedded in the `GAS_CODE` constant in the HTML
- If you change the Sheets schema (add columns), update both the Apps Script code AND the `loadFromSheets()` parser

---

## Environment

- **Runtime:** Browser (Chrome on Android primarily, Chrome desktop secondary)
- **No Node.js, no build step, no compilation**
- **HTTPS required** for microphone access (`getUserMedia` is blocked on HTTP)
- **localStorage** is the source of truth on load; Google Sheets overwrites it asynchronously

---

## Testing Checklist

Before committing any change, verify:

- [ ] Typing a message works and gets a reply
- [ ] Voice input records, transcribes, and sends correctly
- [ ] Absence logging updates the sidebar records panel
- [ ] Pay calculation returns correct figures
- [ ] Settings modal saves and restores all fields on re-open
- [ ] Google Sheets sync fires after a data mutation (check network tab)
- [ ] TTS speaks the reply when Voice Reply is enabled
- [ ] App loads correctly on mobile Chrome
