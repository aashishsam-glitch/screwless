-- CreateTable
CREATE TABLE "inspections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "application_id" TEXT NOT NULL,
    "scheduled_date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "findings" TEXT,
    "report_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "inspections_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inspection_officers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspection_id" TEXT NOT NULL,
    "officer_id" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    CONSTRAINT "inspection_officers_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "inspections" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "inspection_officers_officer_id_fkey" FOREIGN KEY ("officer_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "grievances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "application_id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'tier_1_district',
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resolution_remarks" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "grievances_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "grievances_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicant_id" TEXT NOT NULL,
    "approval_type_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "risk_category" TEXT NOT NULL,
    "assigned_officer_dept" TEXT,
    "sla_days" INTEGER NOT NULL DEFAULT 30,
    "sla_due_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "applications_approval_type_id_fkey" FOREIGN KEY ("approval_type_id") REFERENCES "approval_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_applications" ("applicant_id", "approval_type_id", "assigned_officer_dept", "created_at", "id", "risk_category", "status", "updated_at") SELECT "applicant_id", "approval_type_id", "assigned_officer_dept", "created_at", "id", "risk_category", "status", "updated_at" FROM "applications";
DROP TABLE "applications";
ALTER TABLE "new_applications" RENAME TO "applications";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
