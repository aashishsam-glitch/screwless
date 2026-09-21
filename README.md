# Screwless — Industrial Approvals, Compliance & Inspection Platform

> **SIH 2026 · Problem Statement SIH26130** — *Efficiency in streamlining industrial approvals, compliance processes, and access to government support services*

A full-stack enterprise single-window clearance portal designed for industrial units (MSMEs and large enterprises) in Maharashtra, India. Screwless transforms fragmented regulatory clearances across multiple government departments into a dependency-aware, document-gated business journey with statutory SLA countdowns, coordinated joint inspections, and multi-tier grievance redressal.

---

## 👥 Demo Access

The prototype uses OTP-based authentication. Pre-seeded test accounts are available for evaluation; OTPs are provided through the development/demo environment (logged directly to the server terminal console).

* **Local Demo:** `http://localhost:3000`
* **Live Demo:** [Add actual URL once deployed]

### 🔑 Pre-Seeded Test Accounts

| Role | Name | Email | Department / Scope |
|------|------|-------|--------------------|
| **Applicant** | Demo Applicant | `applicant@demo.com` | Manufacturing MSME (Orange Category, Pune, MIDC Zone) |
| **Officer** | Sunita Deshmukh | `officer.pollution@demo.gov.in` | Maharashtra Pollution Control Board (MPCB) |
| **Officer** | Amit Kulkarni | `officer.factory@demo.gov.in` | Directorate of Industrial Safety & Health (DISH) |
| **Officer** | Rajesh Patil | `officer.fire@demo.gov.in` | Fire Department |
| **Officer** | Priya Joshi | `officer.municipal@demo.gov.in` | Municipal Corporation / Planning Authority |
| **Officer** | Meena Bhosale | `officer.midc@demo.gov.in` | MIDC Infrastructure |
| **Officer** | Sanjay Wagh | `officer.electricity@demo.gov.in` | MSEDCL (Electricity Distribution) |
| **Officer** | Vikram Shinde | `officer.labour@demo.gov.in` | Labour Department |
| **Officer** | Kavita Pawar | `officer.water@demo.gov.in` | Water Resources Department |

> **Login Instructions:** Visit `/login`, enter any email above, check your server terminal for the 6-digit OTP code, and enter it to log in immediately.

---

## 📚 Dedicated Documentation Guides

Topic-by-topic architectural and technical guides are available in the [`/docs`](./docs) directory:
- 🚀 **[Project Execution & Demo Walkthrough (docs/RUNNING_AND_DEMO.md)](./docs/RUNNING_AND_DEMO.md)** — Step-by-step setup, database seeding, credentials, and synchronized live demo script.
- 🏗️ **[System Architecture, Tech Stack & Design (docs/SYSTEM_ARCHITECTURE_AND_STACK.md)](./docs/SYSTEM_ARCHITECTURE_AND_STACK.md)** — Architectural component diagrams, design decisions, and technology rationale.
- 🗄️ **[Database Architecture, ERD & Seed Data (docs/DATABASE_AND_STRUCTURE.md)](./docs/DATABASE_AND_STRUCTURE.md)** — 13 relational models, Prisma schema, domain enums, and pre-seeded regulatory records.
- 🔄 **[API Reference & Data Flow Pipelines (docs/API_AND_DATA_FLOW.md)](./docs/API_AND_DATA_FLOW.md)** — 26 REST endpoint specifications, sequence diagrams, and validation rules.

---

## 🚀 Core Platform Modules & Features

### 1. Multi-Parameter Clearance Discovery Engine
* **Deterministic Rule Engine (Zero Black-Box AI):** Matches industrial profiles against 32 regulatory rules based on sector, investment scale (MSME), CPCB/MPCB environmental pollution risk category (Red/Orange/Green/White), and notified MIDC industrial zone status (`lib/matching.ts`). Clearance decisions strictly mandate transparent, legal citations rather than probabilistic AI models.
* **AI/NLP Research Scope:** **Phase 2: Automated regulatory text parsing (future scope)** — Future machine-assisted NLP extraction of state regulatory gazette notifications to suggest rule updates.
* **Statutory Self-Certification Badges:** Automatically identifies low-risk Green/White category clearances eligible for deemed approvals or self-certification under Maharashtra Ease of Doing Business (EoDB) policies.
* **Prerequisite Dependency Graph:** Functionally and visually locks downstream clearances until their prerequisite approvals are granted (e.g., Factory License and Fire NOC remain locked until Building Plan approval is completed).

### 2. Central Document Vault & Pre-Application Readiness Gate
* **"Upload Once, Attach Anywhere":** Centralized digital repository for industrial site plans, deeds, and statutory certificates, eliminating repetitive re-uploads across departments.
* **Pre-Application Document Readiness Gate:** Prevents incomplete submissions from clogging government queues. The "Apply for Approval" button remains strictly locked with a live deficit counter until 100% of mandatory vault documents are attached.
* **Dynamic Expiry Tracking:** Documents are dynamically evaluated on read as **Valid**, **Expiring Soon (≤ 30 days)**, or **Expired**, accompanied by a proactive dashboard expiry alert widget.

### 3. Officer Scrutiny & Pre-Approval Verification Lock
* **Department-Isolated Review Queues:** Scrutiny officers access only applications assigned to their respective department.
* **Granular Per-Document Scrutiny:** Officers inspect uploaded files in-browser, marking each document as **Verified (✓)** or **Rejected (✕)** with official deficiency remarks.
* **Enforced Pre-Approval Lock:** The "Approve Application" action is locked on both the UI and backend (HTTP 422) until every single mandatory document has been verified by the officer.

### 4. Central Inspection System (CIS) — Joint Site Visits
* **Synchronized Joint Site Audits:** Harmonizes physical inspection visits across MPCB, DISH, Fire Services, and Labour into a single coordinated factory visit.
* **Multi-Officer Assignment & Duplicate Prevention:** Validates counterpart officer participation and blocks duplicate inspection scheduling for the same unit.
* **Common Inspection Report (CIR):** Dedicated reporting interface for participating inspectors to upload joint findings and compliance observations.

### 5. Citizen's Charter SLAs & State Analytics
* **RTSA Statutory Countdown Clocks:** Real-time countdown clocks tracking statutory delivery deadlines under the Maharashtra Right to Public Services Act (RTSA), with amber alerts (≤ 5 days) and red breach tags for overdue files.
* **State-Level Executive Intelligence:** Macro analytics dashboard aggregating state-wide SLA compliance rates, average turnaround days, department bottleneck rankings, and district-level performance heatmaps (`/analytics`).

### 6. Statutory Grievance Redressal Mechanism
* **Enforced Two-Tier Escalation:** Structured administrative appeals routing initial grievances to the **Tier-1 District Industrial Center (DIC)** and unlocking **Tier-2 State Directorate** escalation only after 7 days of unresolved pendency or upon formal rejection.
* **Application-Linked Audit Trail:** Every grievance is tied directly to a specific clearance application with timestamped officer resolution orders.

### 7. Government Incentive & Subsidy Matching Engine
* Evaluates industrial profiles against Maharashtra Package Scheme of Incentives (PSI) policies, matching eligible MSMEs to capital subsidies, interest subventions, stamp duty waivers, and electricity duty exemptions with transparent explanations.

### 8. Enterprise Identity & PII Protection
* **AES-256-GCM Encryption at Rest:** Symmetric authenticated encryption for sensitive personal and corporate identifiers (Aadhaar, PAN) using dynamic 16-byte IVs and authentication tags (`lib/crypto.ts`).
* **UI Masking:** Masks sensitive numbers by default across all screens (`XXXX XXXX 1234`, `XXXXXX1234`).
* **Secured Local Storage:** Uploads are stored in a private directory (`storage/uploads/`) outside the public web root with magic-byte file signature validation and authenticated streaming.

---

## 🏗️ System Architecture

![System Architecture](./docs/architecture.png)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT / BROWSER                              │
│  ┌───────────────────────────────┐     ┌─────────────────────────────┐  │
│  │     Applicant Workspace       │     │      Officer Dashboard      │  │
│  │  • Profile Intake (4 Steps)   │     │  • Departmental FIFO Queue  │  │
│  │  • Approval Discovery & DAG   │     │  • In-Browser File Scrutiny │  │
│  │  • Document Vault & Readiness │     │  • Pre-Approval Lock Guard  │  │
│  │  • RTSA Statutory SLA Clocks  │     │  • CIS Joint Inspections    │  │
│  │  • Scheme Matching Cards      │     │  • Grievance Resolution     │  │
│  │  • 2-Tier Grievance Lodging   │     │  • State SLA Analytics      │  │
│  └───────────────┬───────────────┘     └──────────────┬──────────────┘  │
└──────────────────┼────────────────────────────────────┼─────────────────┘
                   │ HTTP / JSON API (JWT Cookie Auth)   │
┌──────────────────▼────────────────────────────────────▼─────────────────┐
│                      NEXT.JS 15 (APP ROUTER) BACKEND                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ 26 REST Route Handlers (/app/api/*)                               │  │
│  │ • /api/auth/* (OTP generation, verification, JWT session cookie)  │  │
│  │ • /api/approvals/matching (Deterministic rule engine)             │  │
│  │ • /api/applications/* (Readiness gates, submission, status sync)  │  │
│  │ • /api/officer/* (Scrutiny queues, verify, deficiency comments)   │  │
│  │ • /api/documents/* (Vault, secure file stream, magic-byte check)  │  │
│  │ • /api/inspections/* (CIS joint scheduling & CIR reporting)       │  │
│  │ • /api/grievances/* (Tier-1 / Tier-2 appellate escalation)        │  │
│  │ • /api/analytics/sla (State SLA compliance, bottleneck rankings)  │  │
│  └───────────────────────────────────┬───────────────────────────────┘  │
│                                      │                                  │
│  ┌───────────────────────────────────▼───────────────────────────────┐  │
│  │ Core Domain Logic (/lib)                                          │  │
│  │ • matching.ts (Rule evaluation & Scheme engine)                   │  │
│  │ • applications.ts (Prerequisite DAG & Readiness validation)       │  │
│  │ • documents.ts (Validity calculation: valid / expiring / expired) │  │
│  │ • crypto.ts (AES-256-GCM cipher with dynamic IV & Auth Tag)       │  │
│  │ • validation.ts (Enum, payload & MIME type sanitization)          │  │
│  └───────────────────────────────────┬───────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────┐
│                             DATA LAYER                                  │
│  ┌───────────────────────────────┐     ┌─────────────────────────────┐  │
│  │  Prisma ORM (13 Models)       │     │  Private Storage Disk       │  │
│  │  • SQLite (dev.db for local)  │     │  • storage/uploads/         │  │
│  │  • PostgreSQL (for production)│     │  • UUID-named binary files  │  │
│  └───────────────────────────────┘     └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Tech Stack

* **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS v4
* **Backend:** Next.js Server Components & Route Handlers
* **Database & ORM:** SQLite via Prisma ORM (easily switchable to PostgreSQL)
* **Security & Cryptography:** Node.js native `crypto` (AES-256-GCM), JWT session cookies
* **Real-Time Sync:** 5-second polling interval between applicant and officer views

---

## ⚡ Quick Setup & Local Execution

### 1. Prerequisites
* **Node.js:** v18.18.0 or newer (v20+ recommended)
* **npm:** v9.0.0 or newer

### 2. Installation & Run
```bash
# 1. Install dependencies
npm install

# 2. Initialize database migration and seed pre-configured records
npx prisma migrate dev --name init

# 3. Start the Next.js development server
npm run dev
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**.

> **Resetting Data:** If the database already exists and you want to reset fresh demo data:
> ```bash
> npx prisma db seed
> ```

---

## 🔄 Switching to PostgreSQL (Production / MeghRaj Cloud)

For production deployment on Docker or MeghRaj/NIC Cloud:

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
2. Set your production database URL in `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/screwless"
```
3. Run the production migration:
```bash
npx prisma migrate dev
```

---

## ⏱️ 90-Second Synchronized Live Demo Script

Open **two browser windows side by side** (one for the Applicant, one for the Officer).

### Window 1 — Applicant Flow
1. Visit `http://localhost:3000/login` → Enter `applicant@demo.com` → Check server terminal for the 6-digit OTP → Enter OTP.
2. Complete Profile Intake: Manufacturing / Small / Pune / MIDC Notified Zone / Orange Pollution Category / New Unit.
3. Dashboard loads showing:
   - **Required Approvals:** Notice Building Plan Approval is available, while Factory License and Fire NOC show 🔒 locked (prerequisite dependency).
   - **Pre-Application Readiness Gate:** Click on Building Plan Approval. Notice the "Apply for Approval" button is locked: *"Complete required documents before applying"*.
   - **Document Vault:** Upload the required Land Ownership Proof and Building Plan Copy to the Document Vault.
   - **Ready to Apply:** Document readiness reaches 100%. The "Apply for Approval →" button turns blue. Click to submit!
   - Notice the status updates to "Submitted" and the **RTSA Statutory SLA Countdown Timer** starts ticking live.

### Window 2 — Officer Flow
4. In the second window, visit `http://localhost:3000/login` → Enter `officer.municipal@demo.gov.in` → Enter terminal OTP.
5. The Municipal Corporation Officer Queue displays the newly submitted Building Plan application with an Orange Medium Risk badge.
6. Click the application to open the **Scrutiny & Verification Workspace**:
   - Notice the **"Approve Application" button is disabled**: *"🔒 Approval locked: Verify all mandatory documents first"*.
   - Inspect the submitted site plan and layout files.
   - Click **"✓ Verify"** on each mandatory document.
   - Once all mandatory files are verified, the "Approve Application" button turns green!
   - Click **"Approve Application"** → Confirm modal.

### Live Synchronized Update
7. Look back at **Window 1 (Applicant)**:
   - Within 5 seconds, Building Plan Approval status transitions from "Submitted" to **"Approved" ✅**.
   - Downstream approvals (**Factory License** and **Fire NOC**) instantly **unlock 🔓** because the prerequisite approval is met!
   - Overall compliance progress bar advances.

---

## 🔮 Future Roadmap (Phase 2)

* **Phase 2: Automated regulatory text parsing (future scope)** — Machine-assisted parsing of government regulatory gazettes and state notifications to automatically suggest rule updates.
* **Production SMS / Email Gateway:** CDAC Mobile Seva / Twilio integration for live OTP delivery to citizen mobile devices.
* **DigiLocker & e-Pramaan SSO:** Direct import of verified citizen and enterprise certificates (Aadhaar, Udyam MSME, Incorporation, Land 7/12 extract).
* **Automated Compliance Renewals:** One-click statutory renewal submission engine unlocking 60 days prior to license expiry.
* **WebSocket Real-Time Event Bus:** Instant duplex push notifications replacing the 5-second polling interval.
* **Multi-Language Support (i18n):** Localization in Marathi, Hindi, and English.
