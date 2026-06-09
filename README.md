# 🏠 Househelp Tracker

> **A voice-first, AI-powered conversational assistant for domestic workforce attendance and payroll management — built for real-world use in Indian households.**

![Status](https://img.shields.io/badge/status-live-brightgreen)
![Cost](https://img.shields.io/badge/running%20cost-₹0%2Fmonth-blue)
![Stack](https://img.shields.io/badge/stack-Groq%20%7C%20Whisper%20%7C%20LLaMA%203.3-purple)
![License](https://img.shields.io/badge/license-MIT-orange)

---

## The Problem

In millions of Indian households, domestic workers are paid monthly — with deductions applied for absences and half-days. The person managing this (typically a homemaker) tracks attendance mentally or on scraps of paper, leading to disputes, errors, and friction at pay time every month.

Existing solutions — spreadsheets, attendance apps — assume digital literacy and English fluency that most users in this context simply don't have.

**This project asks: what if the interface was just a conversation?**

---

## What It Does

Househelp Tracker is a voice-first AI assistant that a non-technical user can speak to naturally — in **Hindi, English, or Hinglish** — to:

- 📝 Log when a worker was absent or came half-day
- ➕ Add new workers with their monthly salary
- 💰 Calculate exact pay at the end of the month with deduction breakdowns
- 🔊 Hear all responses spoken back in Hindi
- ☁️ Have all data automatically saved to Google Sheets — permanently, across devices

No forms. No spreadsheets. No app to install. Just speak.

---

## Demo

```
Mother: "Raju aaj nahi aaya"
Assistant: "Noted! Raju ki aaj ki absence log kar di gayi hai — 29 May 2026."

Mother: "Sunita half day thi kal"
Assistant: "Done! Sunita ka kal ka half day record ho gaya."

Mother: "Raju ka is mahine kitna dena hai?"
Assistant: "Raju ki salary ₹8,000 hai. 2 full absences aur 1 half day ke baad ₹7,077 dena hai."
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        END USER                              │
│              Speaks Hindi / Hinglish / English               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│            HOUSEHELP TRACKER  (Single HTML File)             │
│                  Hosted on GitHub Pages / Netlify            │
│                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │  Groq Whisper│  │ Groq LLaMA   │  │  Web Speech API  │  │
│   │  (Voice STT) │  │ 3.3 70B      │  │  (Hindi TTS)     │  │
│   │  Hinglish ✓  │  │ (Chat Brain) │  │  Browser-native  │  │
│   └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│                    localStorage (cache)                      │
└───────────────────────────┬─────────────────────────────────┘
                            │ Auto-sync
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Google Apps Script (REST endpoint)              │
│                         │                                    │
│                  Google Sheets                               │
│         Workers Sheet  +  Absences Sheet                     │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| Single HTML file | Zero installation, zero build step, trivial deployment |
| Groq for both STT and chat | One API key, one account, completely free |
| Structured JSON from LLM | Deterministic parsing without NLP post-processing |
| localStorage + Sheets dual persistence | Offline-first reads with permanent cloud backup |
| Browser Web Speech API for TTS | Free, no API calls, native Hindi voice support |
| Full overwrite sync to Sheets | Avoids row duplication and conflict resolution complexity |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Voice Input (STT) | [Groq Whisper](https://console.groq.com) — `whisper-large-v3-turbo` |
| Chat Intelligence | [Groq LLaMA](https://console.groq.com) — `llama-3.3-70b-versatile` |
| Voice Output (TTS) | Web Speech Synthesis API (browser-native) |
| Cloud Storage | Google Sheets via Google Apps Script |
| Local Cache | Browser localStorage |
| Hosting | GitHub Pages / Netlify |
| Frontend | Vanilla HTML + CSS + JavaScript (zero dependencies) |

---

## Running Cost

| Service | Usage | Cost |
|---|---|---|
| Groq (LLaMA chat) | ~50 messages/day | **Free** |
| Groq (Whisper STT) | ~10 voice inputs/day | **Free** |
| Web Speech TTS | Unlimited | **Free** |
| Google Sheets | ~50 writes/day | **Free** |
| GitHub Pages / Netlify | Static file hosting | **Free** |
| **Total** | | **₹0 / month** |

---

## Setup Guide

### Prerequisites
- A [Groq account](https://console.groq.com) (free) — for both voice and chat
- A Google account — for Google Sheets storage
- Chrome browser on Android — for voice input on mobile

### Step 1 — Get your Groq API Key
1. Go to [console.groq.com](https://console.groq.com) → sign up free
2. Navigate to **API Keys** → **Create API Key**
3. Copy the key (starts with `gsk_...`)

### Step 2 — Deploy Google Apps Script
1. Go to [script.google.com](https://script.google.com) → **New project**
2. Delete existing code and paste the contents of [`google-apps-script.gs`](#google-apps-script) below
3. Press `Ctrl+S` to save
4. Click **Deploy → New deployment → Web app**
5. Set **Execute as:** Me | **Who has access:** Anyone
6. Click **Deploy** → authorize → copy the **Web App URL**

### Step 3 — Deploy the App
**Option A — GitHub Pages (recommended)**
```
1. Fork or upload househelp-tracker.html to a GitHub repository
2. Go to Settings → Pages → Deploy from main branch
3. Your app is live at https://yourusername.github.io/repo-name/househelp-tracker.html
```

**Option B — Netlify Drop**
```
1. Go to app.netlify.com/drop
2. Drag and drop househelp-tracker.html
3. Get an instant https:// link
```

### Step 4 — Configure the App
1. Open the app URL in **Chrome**
2. Tap **⚙ Settings**
3. Paste your **Groq API key**
4. Paste your **Google Sheets Web App URL**
5. Tap **Save Settings**
6. Done — start speaking!

> **Note:** The app must be opened via an `https://` URL for microphone access to work. This is a hard browser security requirement (`getUserMedia` is restricted to secure contexts).

---

## Google Apps Script

Paste this into [script.google.com](https://script.google.com) and deploy as a Web App:

```javascript
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = getOrCreateSheet();

  if (data.action === 'save') {
    var ws = ss.getSheetByName('Workers') || ss.insertSheet('Workers');
    ws.clearContents();
    ws.appendRow(['Name', 'Monthly Salary']);
    Object.keys(data.workers).forEach(function(n) {
      ws.appendRow([n, data.workers[n].monthlySalary || 0]);
    });
    var as = ss.getSheetByName('Absences') || ss.insertSheet('Absences');
    as.clearContents();
    as.appendRow(['Worker', 'Date', 'Type']);
    Object.keys(data.workers).forEach(function(n) {
      (data.workers[n].absences || []).forEach(function(a) {
        as.appendRow([n, a.date, a.type]);
      });
    });
    return out({ ok: true });
  }

  if (data.action === 'load') {
    var workers = {};
    var ws = ss.getSheetByName('Workers');
    if (ws && ws.getLastRow() > 1) {
      ws.getRange(2, 1, ws.getLastRow() - 1, 2).getValues().forEach(function(r) {
        if (r[0]) workers[r[0]] = { monthlySalary: r[1] || 0, absences: [] };
      });
    }
    var as = ss.getSheetByName('Absences');
    if (as && as.getLastRow() > 1) {
      as.getRange(2, 1, as.getLastRow() - 1, 3).getValues().forEach(function(r) {
        if (r[0] && workers[r[0]]) workers[r[0]].absences.push({ date: r[1], type: r[2] });
      });
    }
    return out({ ok: true, workers: workers });
  }
}

function getOrCreateSheet() {
  var p = PropertiesService.getScriptProperties();
  var id = p.getProperty('SHEET_ID');
  if (id) { try { return SpreadsheetApp.openById(id); } catch(e) {} }
  var ss = SpreadsheetApp.create('Househelp Tracker Data');
  p.setProperty('SHEET_ID', ss.getId());
  return ss;
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput('Househelp Tracker API is running.')
    .setMimeType(ContentService.MimeType.TEXT);
}
```

---

## Payroll Formula

```
Daily Rate      = Monthly Salary ÷ 26    (Indian standard: 26 working days/month)
Full Deduction  = Absent Days × Daily Rate
Half Deduction  = Half Days × (Daily Rate ÷ 2)
Net Payable     = Monthly Salary − Full Deduction − Half Deduction
```

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
| "Hello" / "Namaste" | Any | Friendly greeting response |

---

## Project Structure

```
househelp-tracker/
│
├── househelp-tracker.html     # The entire application (HTML + CSS + JS)
├── README.md                  # This file
└── LICENSE                    # MIT License
```

Everything — UI, voice processing, AI integration, storage sync, payroll engine — lives inside the single HTML file. No build tools. No package manager. No server.

---

## Research Notes

This project was built to validate three hypotheses:

1. **Conversational UI beats forms for low-literacy users** — A user who cannot navigate a spreadsheet can speak naturally to log an absence. The LLM handles all intent parsing, date interpretation, and language switching.

2. **Narrow-domain LLMs don't need to be large** — LLaMA 3.3 70B with a well-engineered system prompt handles this task reliably. The JSON output contract eliminates ambiguity and makes the system deterministic enough for production use.

3. **Zero-cost AI stacks are production-viable** — Every component (Groq, Google Sheets, GitHub Pages, Web Speech API) is free at this usage scale. The total running cost is ₹0/month indefinitely.

---

## Limitations

- Voice requires Chrome browser (Safari and Firefox do not support `MediaRecorder` + `getUserMedia` in all configurations)
- TTS quality depends on Hindi voice packages installed on the device
- No authentication — data is protected only by obscurity of the Apps Script URL
- Single-user design — simultaneous edits from two devices use last-write-wins

---

## Roadmap

- [ ] Multi-worker parallel absence logging in one utterance
- [ ] Monthly PDF payslip generation
- [ ] WhatsApp message integration for logging without opening the app
- [ ] PWA with offline service workers
- [ ] PIN-based authentication
- [ ] Advance and loan tracking
- [ ] Festival bonus management

---

## License

MIT — free to use, modify, and distribute.

---

## Acknowledgements

- [Groq](https://groq.com) for making Whisper and LLaMA accessible at zero cost
- [Meta AI](https://ai.meta.com) for open-sourcing the LLaMA model family
- [OpenAI](https://openai.com) for the original Whisper architecture

---

*Built with the conviction that powerful AI tools should be accessible to everyone — including a homemaker in Bhopal who just wants to know how much to pay Raju this month.*
