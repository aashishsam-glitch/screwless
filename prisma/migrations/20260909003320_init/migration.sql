-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'applicant',
    "officer_department" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "applicant_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "scale" TEXT NOT NULL,
    "location_district" TEXT NOT NULL,
    "in_notified_industrial_zone" BOOLEAN NOT NULL,
    "risk_category" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "applicant_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "approval_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "depends_on_id" TEXT,
    CONSTRAINT "approval_types_depends_on_id_fkey" FOREIGN KEY ("depends_on_id") REFERENCES "approval_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "approval_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "approval_type_id" TEXT NOT NULL,
    "applies_to_sector" TEXT,
    "applies_to_scale" TEXT,
    "applies_to_risk_category" TEXT,
    "applies_to_zone" BOOLEAN,
    "is_self_certifiable" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "approval_rules_approval_type_id_fkey" FOREIGN KEY ("approval_type_id") REFERENCES "approval_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicant_id" TEXT NOT NULL,
    "approval_type_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "risk_category" TEXT NOT NULL,
    "assigned_officer_dept" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "applications_approval_type_id_fkey" FOREIGN KEY ("approval_type_id") REFERENCES "approval_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "schemes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eligibility_sector" TEXT,
    "eligibility_scale" TEXT,
    "eligibility_district" TEXT,
    "subsidy_detail" TEXT NOT NULL,
    "source_url" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "applicant_profiles_user_id_key" ON "applicant_profiles"("user_id");
