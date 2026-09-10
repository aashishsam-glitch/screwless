# Screwless — Industrial Approvals & Compliance Platform

> SIH 2026 · Problem Statement SIH26130 — *Efficiency in streamlining industrial approvals, compliance processes, and access to government support services*


A full-stack web application that helps industrial applicants (MSMEs/businesses) in Maharashtra discover which government approvals they need, track their status, and get matched to relevant subsidy schemes — with a live officer-side dashboard for processing applications.

## 📚 Dedicated Documentation Guides

Detailed topic-by-topic documentation is available in the [`/docs`](./docs) directory:
- 🚀 **[Project Execution & Demo Guide (docs/RUNNING_AND_DEMO.md)](./docs/RUNNING_AND_DEMO.md)** — Step-by-step installation, credentials, and 90-second synchronized live walkthrough script.
- 🏗️ **[System Architecture, Tech Stack & Resources (docs/SYSTEM_ARCHITECTURE_AND_STACK.md)](./docs/SYSTEM_ARCHITECTURE_AND_STACK.md)** — Mermaid architecture diagrams, component boundaries, tech stack breakdown, and free/open-source tools used.
- 🗄️ **[Database Architecture, Schema & Seed Specifications (docs/DATABASE_AND_STRUCTURE.md)](./docs/DATABASE_AND_STRUCTURE.md)** — Entity-relationship diagram (ERD), full data dictionary, enums, and pre-seeded domain records.
- 🔄 **[API Reference, Data Flow & Domain Logic (docs/API_AND_DATA_FLOW.md)](./docs/API_AND_DATA_FLOW.md)** — End-to-end Input $\rightarrow$ Process $\rightarrow$ Output lifecycle, sequence diagrams, rules logic, and full REST endpoint documentation.

## Tech Stack

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- **Backend:** Next.js API Routes
- **Database:** SQLite via Prisma ORM (easily switchable to PostgreSQL for production)
- **Auth:** Mock OTP (logged to server console)
- **Real-time:** Polling every 5 seconds (V2: WebSockets)

## Quick Setup

```bash
# 1. Install dependencies
npm install

# 2. Run database migration + seed
npx prisma migrate dev --name init

# 3. Start the dev server
npm run dev
```

The app will be available at **http://localhost:3000**

> **Note:** If the database already exists, you can re-seed with:
> ```bash
> npx prisma db seed
> ```

## Demo Accounts (pre-seeded)

### Officers
| Name | Email | Department |
|------|-------|-----------|
| Rajesh Patil | officer.fire@demo.gov.in | Fire Department |
| Sunita Deshmukh | officer.pollution@demo.gov.in | MPCB (Pollution) |
| Amit Kulkarni | officer.factory@demo.gov.in | DISH (Factory) |
| Priya Joshi | officer.municipal@demo.gov.in | Municipal Corp |
| Vikram Shinde | officer.labour@demo.gov.in | Labour Dept |
| Meena Bhosale | officer.midc@demo.gov.in | MIDC |
| Sanjay Wagh | officer.electricity@demo.gov.in | MSEDCL |
| Kavita Pawar | officer.water@demo.gov.in | Water Resources |

### Applicant
| Name | Email |
|------|-------|
| Demo Applicant | applicant@demo.com |

> **Auth:** Enter any email above → check terminal for the 6-digit OTP → enter it to login.

---

## 90-Second Demo Script

Open **two browser windows** side by side (or two tabs).

### Window 1 — Applicant Flow (60s)

1. **Visit** `http://localhost:3000` → click **"Get Started"**
2. **Login:** Enter `applicant@demo.com` → check terminal for OTP → enter OTP
3. **Onboarding:** Fill the profile:
   - Sector: **Manufacturing**
   - Scale: **Small**
   - District: **Pune**
   - Industrial Zone: **✓ Checked**
   - Risk Category: **Orange** (moderately polluting)
   - Stage: **New Unit**
4. **Dashboard appears** showing:
   - 📋 **Required Approvals** — cards with dependency indicators, self-certifiable badges
   - 🏦 **Matching Schemes** — cards with "why you qualify" explanations
   - ⚡ Progress bar at the top
5. **Submit an application:** Click **"Submit Application →"** on **"Building Plan Approval"**
   - Notice the card status changes from "Not Started" to "Submitted"
   - Notice that Factory License and Fire NOC show 🔒 locked (they depend on Building Plan Approval)

### Window 2 — Officer Flow (30s)

6. **Open new tab** → `http://localhost:3000/login`
7. **Login as officer:** Enter `officer.municipal@demo.gov.in` → check terminal for OTP → enter OTP
8. **Officer Dashboard** loads showing the Building Plan Approval application with:
   - Applicant details
   - Business info (sector, scale, district)
   - 🟠 **Medium Risk** badge (derived from Orange risk category)
   - Approve / Request Info / Reject buttons
9. **Click "✓ Approve"** → application disappears from queue

### Back to Window 1 — Live Update! (the wow moment)

10. **Watch the applicant dashboard** — within 5 seconds, the Building Plan Approval card:
    - Status badge changes from **"Submitted"** → **"Approved"** ✅
    - The card turns green
    - 📅 Renewal date appears
    - 🔓 Factory License and Fire NOC unlock (dependency met!)
    - Progress bar advances

---

## Architecture

```
┌─────────────────────────────────────┐
│           Next.js App               │
│  ┌──────────┐  ┌──────────────────┐ │
│  │ Applicant│  │ Officer          │ │
│  │ Dashboard│  │ Dashboard        │ │
│  └────┬─────┘  └────┬─────────── │ │
│       │              │              │
│  ┌────┴──────────────┴───────────┐ │
│  │     API Routes (/api/*)       │ │
│  └────┬──────────────────────────┘ │
│       │                             │
│  ┌────┴───────────────────┐         │
│  │  Business Logic (/lib) │         │
│  │  • Matching Engine     │         │
│  │  • Risk Badge Logic    │         │
│  │  • Auth (Mock OTP)     │         │
│  └────┬───────────────────┘         │
│       │                             │
│  ┌────┴─────────┐                   │
│  │  Prisma ORM  │                   │
│  └────┬─────────┘                   │
└───────┼─────────────────────────────┘
        │
   ┌────┴────┐
   │ SQLite  │
   │ dev.db  │
   └─────────┘
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Rules-table matching** (no ML) | Compliance-sensitive gov use case — needs full auditability |
| **SQLite for dev** | Zero infrastructure, demoable on any laptop |
| **Polling (not WebSockets)** | Simpler to set up with Next.js App Router; V2 upgrade noted |
| **Mock OTP** | No paid SMS service needed for demo |
| **Self-certification badges** | Reflects Maharashtra's real policy (20 of 33 approvals) |
| **Dependency graph** | Factory License/Fire NOC correctly depend on Building Plan |

## Seed Data

- **10 Approval Types** — Maharashtra industrial approvals (MIDC, building plan, factory license, fire NOC, pollution NOC, electricity, labour, water, shops registration, GST)
- **32 Approval Rules** — Sector/scale/risk mappings with self-certification flags
- **8 Schemes** — Maharashtra MSME/industrial policy schemes (capital subsidy, interest subsidy, electricity duty exemption, stamp duty exemption, technology upgradation, quality certification, employment generation)

> ⚠️ Scheme data uses placeholder values. See `// TODO: verify against actual Maharashtra Industrial Policy` comments in the seed file.

## Switching to PostgreSQL

For production, update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
And set `DATABASE_URL` in `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/screwless"
```
Then run `npx prisma migrate dev`.

## Statutory Compliance & Identity Data Protection (Aadhaar & DPDP Act)

In accordance with Indian regulatory frameworks:
- **Aadhaar Act, 2016 & Regulations**: Storage and display of raw Aadhaar numbers is restricted. In this implementation, Aadhar and PAN identifiers are masked by default across all UI views (`XXXX XXXX 1234`, `XXXXXX1234`).
- **Cryptographic Protection at Rest**: All Aadhar and PAN numbers are encrypted using symmetric **AES-256-GCM** before persistence to the database. Plaintext values are never logged to server consoles, telemetry, or error messages.
- **DPDP Act (Digital Personal Data Protection Act, 2023) & UIDAI Guidelines**: A production deployment of this government platform would interface with UIDAI-authorized Authentication User Agencies (AUA/KUA) or utilize DigiLocker / Aadhaar Paperless Offline e-KYC XML/QR mechanisms rather than direct identifier storage.

## Out of Scope (V2)
- AI/ML-based document verification
- Real SMS/email OTP
- Payment gateway
- Government API integration
- Analytics/reporting dashboards
- Multi-language support
- WebSocket real-time (currently polling)
