# Backend Schema Document — Bolke

## Database Engine
**PostgreSQL** via Supabase (managed, free tier).

## Tables

### 1. `workers`

Stores each domestic worker's identity and salary.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique worker identifier |
| `name` | `TEXT` | `UNIQUE`, `NOT NULL` | Worker name (e.g., "Raju", "Sunita") |
| `monthly_salary` | `INTEGER` | `DEFAULT 0` | Monthly salary in ₹ (e.g., 8000) |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | When the worker was first added |

**Indexes:**
- Primary key index on `id` (automatic)
- Unique index on `name` (automatic from constraint)

---

### 2. `absences`

Stores each absence or half-day record for a worker.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique absence record ID |
| `worker_id` | `UUID` | `REFERENCES workers(id) ON DELETE CASCADE`, `NOT NULL` | FK to workers table |
| `date` | `TEXT` | `NOT NULL` | Date string (e.g., "28 Jun 2026") |
| `type` | `TEXT` | `CHECK (type IN ('absent', 'half'))`, `NOT NULL` | Absence type: full day or half day |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | When the record was created |

**Constraints:**
- `UNIQUE(worker_id, date)` — prevents duplicate entries for the same worker on the same day

**Indexes:**
- Primary key index on `id` (automatic)
- Unique composite index on `(worker_id, date)` (automatic from constraint)
- FK index on `worker_id` (recommended for JOIN performance)

---

## Relationships

```
┌──────────────┐          ┌──────────────────┐
│   workers     │          │    absences       │
│──────────────│          │──────────────────│
│ id (PK)      │◄────────│ worker_id (FK)    │
│ name         │   1:N    │ id (PK)           │
│ monthly_salary│          │ date              │
│ created_at   │          │ type              │
└──────────────┘          │ created_at        │
                           └──────────────────┘
```

- **workers → absences:** One-to-many. One worker can have many absence records.
- **ON DELETE CASCADE:** Deleting a worker automatically deletes all their absence records.
- **Unique constraint on (worker_id, date):** Enables upsert semantics — logging an absence for the same worker on the same date updates the existing record instead of creating a duplicate.

## SQL Setup Script

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

## Permissions / Row Level Security

| Table | RLS | Policy | Effect |
|---|---|---|---|
| `workers` | Enabled | `allow all` — `USING (true) WITH CHECK (true)` | Anyone with the anon key can read/write. |
| `absences` | Enabled | `allow all` — `USING (true) WITH CHECK (true)` | Anyone with the anon key can read/write. |

> Assumption: Since this is a single-household app with 1–2 users, permissive RLS policies are acceptable. The real access control is at the application layer (token auth in `/api/chat` prevents unauthorized users from triggering AI actions that write data). The Supabase anon key is designed to be public.

> Assumption: If multi-household support is added in the future, RLS policies should be tightened to scope rows by a `household_id` or `user_id` column.

## Data Ownership Rules

- **No per-user scoping.** All workers and absences belong to one household. There is no `user_id` column.
- **Application-layer enforcement:** Only authorized users (valid `DEMO_TOKEN`) can trigger `handleAction()` which calls Supabase write functions (`saveWorkerSupa()`, `saveAbsenceSupa()`).
- **Demo visitors** see `DEMO_WORKERS` (hardcoded in JavaScript), never real database data.
- **localStorage** acts as a client-side cache. On page load, authorized users sync from Supabase (overwrites localStorage).

## Client-Side Data Model

In `index.html`, workers are stored in a JavaScript object:

```javascript
workers = {
  "Raju": {
    _id: "uuid-from-supabase",
    monthlySalary: 8000,
    absences: [
      { date: "3 Jun 2026", type: "absent" },
      { date: "10 Jun 2026", type: "half" }
    ]
  },
  "Sunita": { ... },
  "Geeta": { ... }
}
```

**Sync flow:**
1. Page loads → `workers` initialized from `localStorage('bolke_workers')`
2. If authorized + Supabase configured → `loadFromSupa()` fetches from PostgreSQL → overwrites `workers` → updates localStorage
3. On mutation → `saveWorkerSupa()` / `saveAbsenceSupa()` writes to Supabase → `persist()` writes to localStorage → `renderRecords()` updates UI

## Payroll Calculation (derived, not stored)

Payroll is calculated on-the-fly by the LLM, not stored in the database:

```
Daily Rate      = monthly_salary ÷ 26    (Indian standard: 26 working days/month)
Full Deduction  = count(absences where type='absent') × Daily Rate
Half Deduction  = count(absences where type='half') × (Daily Rate ÷ 2)
Net Payable     = monthly_salary − Full Deduction − Half Deduction
```

> Assumption: The ÷26 constant is Indian payroll standard and should not be changed without explicit discussion.
