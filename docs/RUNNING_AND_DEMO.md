# Project Setup & Execution Guide

This guide provides comprehensive instructions to run, configure, seed, and demo the **Screwless** platform (SIH26130 MVP) locally on any system.

---

## 1. Prerequisites

Before running the application, make sure you have the following installed:
- **Node.js**: v18.18.0 or newer (v20+ recommended)
- **npm**: v9.0.0 or newer
- Optional: **Docker** & **Docker Compose** (only required if running PostgreSQL container; by default, SQLite is pre-configured for zero-friction local execution)

---

## 2. Quickstart (Under 2 Minutes)

### Step 1: Install Dependencies
From the project root:
```bash
npm install
```

### Step 2: Environment Variables
A default `.env` file is already provided. If creating a new one:
```env
# Database connection (SQLite file by default)
DATABASE_URL="file:./dev.db"

# JWT Secret for session signing
JWT_SECRET="dev-secret-do-not-use-in-production-change-me"

# Polling interval for live sync between dashboards (in milliseconds)
NEXT_PUBLIC_POLL_INTERVAL=5000
```

### Step 3: Database Migration & Seeding
Generate Prisma Client, run SQLite migrations, and execute the comprehensive seed script:
```bash
npx prisma migrate dev --name init
```
*(If the database already exists or you want to reset fresh data):*
```bash
npx prisma db seed
```

### Step 4: Run Development Server
Start the Next.js App Router development server:
```bash
npm run dev
```

The application will be live at:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 3. Production Build & Execution

To test or run in production mode:
```bash
# Build optimized Next.js bundle
npm run build

# Start production server
npm run start
```

---

## 4. Switching to PostgreSQL (Optional Docker Mode)

If you prefer to run PostgreSQL in Docker instead of local SQLite:

1. Start PostgreSQL container:
   ```bash
   docker compose up -d
   ```
2. Update `.env`:
   ```env
   DATABASE_URL="postgresql://screwless:screwless_dev@localhost:5432/screwless?schema=public"
   ```
3. Update provider in `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Run migrations and seed:
   ```bash
   npx prisma migrate dev --name init
   ```

---

## 5. Pre-Seeded Demo Accounts

### A. Officers (By Department)

Use any of these emails to log in to the **Officer Dashboard**. When prompted for OTP, check your active terminal console where the mock OTP is displayed in an ASCII box.

| Department | Officer Name | Login Email |
| :--- | :--- | :--- |
| **Fire Department** | Rajesh Patil | `officer.fire@demo.gov.in` |
| **Pollution Control (MPCB)** | Sunita Deshmukh | `officer.pollution@demo.gov.in` |
| **Factory Inspection (DISH)** | Amit Kulkarni | `officer.factory@demo.gov.in` |
| **Municipal Corporation** | Priya Joshi | `officer.municipal@demo.gov.in` |
| **Labour Department** | Vikram Shinde | `officer.labour@demo.gov.in` |
| **MIDC** | Meena Bhosale | `officer.midc@demo.gov.in` |
| **MSEDCL (Electricity)** | Sanjay Wagh | `officer.electricity@demo.gov.in` |
| **Water Resources Dept** | Kavita Pawar | `officer.water@demo.gov.in` |

### B. Industrial Applicant

| Role | Name | Login Identifier |
| :--- | :--- | :--- |
| **Applicant** | Demo Applicant | `applicant@demo.com` (or any custom email/phone) |

---

## 6. Live Interactive Demo Script (90-Second Walkthrough)

Open **two browser windows side-by-side** to showcase the full end-to-end applicant-officer synchronisation loop:

```
┌───────────────────────────────┐     ┌───────────────────────────────┐
│       WINDOW 1 (Applicant)    │     │       WINDOW 2 (Officer)      │
│  http://localhost:3000        │     │  http://localhost:3000/login  │
└───────────────────────────────┘     └───────────────────────────────┘
```

1. **Window 1 (Applicant Login & Onboarding):**
   - Navigate to `http://localhost:3000` and click **"Get Started →"**.
   - Enter email: `applicant@demo.com` and click **"Send OTP"**.
   - Note the 6-digit OTP printed in the terminal console (e.g., `817483`) and enter it.
   - On the onboarding screen, fill out the industrial profile:
     - Sector: `Manufacturing`
     - Scale: `Small`
     - District: `Pune`
     - Notified Industrial Zone: `[x] Checked`
     - Pollution Risk Category: `Orange` (Moderately polluting)
     - Business Stage: `New Unit`
   - Click **"Continue to Dashboard →"**.

2. **Window 1 (Observe Smart Checklist & Locked Dependencies):**
   - Observe the **Required Approvals** generated strictly by transparent rules:
     - *Self-Certifiable* badges for compliant processes.
     - *Factory License* and *Fire NOC* are visibly **locked (🔒)** with a warning tooltip indicating prerequisite **Building Plan Approval** must be completed first.
   - Scroll down to view **Matching Government Schemes** with dynamically generated `"Why you qualify"` rationale.

3. **Window 1 (Submit Application):**
   - Click **"Submit Application →"** on **Building Plan Approval**.
   - Status badge immediately transitions to **"Submitted"**.

4. **Window 2 (Officer Queue & Processing):**
   - In the second window, go to `http://localhost:3000/login`.
   - Log in using `officer.municipal@demo.gov.in` (check terminal for officer OTP).
   - The Municipal Corporation queue immediately displays the newly submitted application from Window 1:
     - Shows Applicant Details, District, Sector, Scale.
     - Automatically derives the **"Medium Risk"** badge (orange indicator based on the applicant's risk tier).
   - Click **"✓ Approve"**. The application clears from the officer's pending queue.

5. **Window 1 (Live Real-Time Update - No Refresh):**
   - Within 5 seconds (via automated sync polling), Window 1 updates automatically:
     - *Building Plan Approval* turns green with status **"Approved"**.
     - Renewal placeholder date is calculated (+1 year offset).
     - *Factory License* and *Fire NOC* **automatically unlock**, allowing the applicant to proceed to the next stage of compliance!
