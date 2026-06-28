# UI/UX Design Brief — Bolke

## Design Style

**Clean, calm, accessible.** The app is used by a non-technical, paralysed person. Every element must be large, obvious, and distraction-free. The aesthetic is modern but warm — not corporate, not playful. Think WhatsApp-simple with a touch of premium.

## Color Palette

| Role | Hex | Usage |
|---|---|---|
| **Background** | `#F8FAFC` | Page background (light grey-blue) |
| **Surface** | `#FFFFFF` | Cards, chat bubbles, panels |
| **Border** | `#E2E8F0` | Subtle separators, card borders |
| **Primary** | `#6366F1` | Mic button, accents, links, active states |
| **Primary dark** | `#4F46E5` | Hover/pressed states |
| **Primary light** | `#EEF2FF` | Tag backgrounds, subtle highlights |
| **Text** | `#0F172A` | Primary body text (near-black) |
| **Text muted** | `#64748B` | Secondary text, labels |
| **Text subtle** | `#94A3B8` | Timestamps, hints |
| **Success** | `#10B981` | Connected indicator, success messages |
| **Success bg** | `#ECFDF5` | Success message background |
| **Warning** | `#F59E0B` | Warnings |
| **Danger** | `#EF4444` | Error messages, recording indicator |

## Typography

| Element | Font | Size | Weight |
|---|---|---|---|
| **Font family** | `Inter` (Google Fonts), fallback: `system-ui, sans-serif` | — | — |
| **Header title** | Inter | 18px | 700 (bold) |
| **Chat messages** | Inter | 15px | 400 (regular) |
| **Labels** | Inter | 11px | 600 (semibold), uppercase, letter-spacing: 0.05em |
| **Worker names** | Inter | 14px | 600 (semibold) |
| **Input text** | Inter | 15px | 400 |
| **Buttons** | Inter | 14px | 500 (medium) |

## Component Style

### Chat Bubbles
- **User bubbles:** Background `#6366F1` (primary), text white, border-radius: `16px 16px 4px 16px`
- **Bot bubbles:** Background `#FFFFFF` (surface), text `#0F172A`, border: 1px `#E2E8F0`, border-radius: `16px 16px 16px 4px`
- **Shadow:** `0 1px 2px rgba(0,0,0,0.05)` on bot bubbles
- **Max-width:** 85% of chat panel
- **Spacing:** 12px between messages

### Buttons
- **Primary (Send, Save):** Background `#6366F1`, text white, border-radius: 12px, padding: 10px 16px, hover: `#4F46E5`
- **Icon buttons (Mic, TTS):** 48px × 48px circle, border-radius: 50%, centered icon
- **Mic recording state:** Background `#EF4444` (danger red), pulsing animation (scale 1.0 → 1.1, opacity 0.7 → 1.0)

### Input Field
- Border: 1px `#E2E8F0`, border-radius: 12px
- Focus: border-color `#6366F1`, box-shadow: `0 0 0 3px rgba(99,102,241,0.1)`
- Padding: 12px 16px
- Full width minus button space

### Cards (Worker Records)
- Background: `#FFFFFF`
- Border: 1px `#E2E8F0`
- Border-radius: 12px
- Padding: 16px
- Shadow: `0 1px 3px rgba(0,0,0,0.1)`
- Margin-bottom: 12px

### Modals
- Centered overlay with `rgba(0,0,0,0.5)` backdrop
- Background: `#FFFFFF`
- Border-radius: 16px
- Padding: 24px
- Max-width: 480px
- Shadow: `0 10px 15px -3px rgba(0,0,0,0.1)`

## Layout Rules

| Rule | Value |
|---|---|
| **Max width** | None (full viewport) |
| **Desktop layout** | Two-column: Chat panel (flex: 1) + Records panel (360px fixed width) |
| **Mobile layout** | Single column: Chat panel full-width, Records panel below |
| **Breakpoint** | 768px (below = mobile stack) |
| **Header height** | ~56px, sticky top |
| **Chat input bar** | Sticky bottom of chat panel |
| **Spacing scale** | 4px base: 4, 8, 12, 16, 20, 24, 32 |
| **Panel gap** | 0px (border separates panels) |

## Mobile / Desktop Behavior

### Desktop (≥768px)
- Side-by-side: chat left, records right
- Records panel always visible
- Chat input at bottom of chat panel
- Mic button 48px, easily clickable

### Mobile (<768px)
- Chat panel takes full width, full height minus header
- Records panel accessible via scroll below chat
- Chat input bar sticky at bottom
- Mic button 56px (larger for thumb tap)
- Font sizes stay the same (already optimized for mobile)
- `user-scalable=no` in viewport meta (prevents accidental zoom during voice interaction)

## Inspiration References

| Product | What to Borrow |
|---|---|
| **WhatsApp** | Chat bubble layout, message flow, simplicity. The "anyone can use this" energy. |
| **Google Assistant** | Clean cards, voice-first UX, subtle animations. |
| **Notion** | Clean typography, soft borders, calm color palette. |
| **Linear** | Professional but warm. Subtle shadows. Clear hierarchy. |

## Dashboard Design Direction

No dashboard. Bolke has two panels:

1. **Chat panel** — the primary interface. Conversational, scrollable, voice-first.
2. **Records panel** — a live-updating sidebar showing worker cards with attendance data.

The records panel acts as a passive dashboard — it shows the current state of all workers at a glance without requiring interaction. Worker cards show: name, monthly salary, list of absences (date + type), and a visual indicator for workers with zero absences.

## Button and Card Style

### Mic Button (most critical component)
- **Default:** 48px circle, `#6366F1` background, white mic icon, slight shadow
- **Hover:** `#4F46E5` background, scale: 1.05
- **Recording:** `#EF4444` background, pulsing animation (`@keyframes pulse`), glowing box-shadow
- **Accessible:** Large tap target for paralysed user with limited motor control

### Worker Cards (most-used display component)
- White background, 1px border `#E2E8F0`, rounded 12px
- Header: Worker name (semibold 14px) + salary in muted text
- Body: List of absences as small pills/tags (date + absent/half)
- Absent pills: light red background, red text
- Half-day pills: light amber background, amber text
- Empty state: "No absences this month ✓" in success green

## Overall User Experience

### Principles
1. **Voice is primary.** The mic button is the most prominent interactive element. Everything can be done by speaking.
2. **Instant feedback.** Every action produces visible + audible feedback within 2 seconds.
3. **Forgiving.** Misheard words get confirmed in the response ("Noted! Raju ki absence..."). User can correct.
4. **Calm.** No notifications, no badges, no red dots. The app waits patiently until spoken to.
5. **Familiar.** Chat interface matches WhatsApp mental model — no learning curve.

### Accessibility
- Large touch targets (≥48px) for motor-impaired users
- High contrast text (WCAG AA: `#0F172A` on `#F8FAFC` = 15.4:1 ratio)
- TTS on all responses — the app can be used without looking at the screen
- No complex gestures — single taps only
- No time-limited interactions — the app never times out
- Clear error messages in Hindi and English
