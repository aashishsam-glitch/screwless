-- CreateTable
CREATE TABLE "personal_info" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "dob" TEXT,
    "aadhar_encrypted" TEXT,
    "pan_encrypted" TEXT,
    "address" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "alternate_contact" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "personal_info_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "business_info" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "business_type" TEXT NOT NULL,
    "gstin" TEXT,
    "udyam_registration_number" TEXT,
    "incorporation_date" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "business_info_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "uploaded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiry_date" DATETIME,
    CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "approval_type_document_requirements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "approval_type_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "approval_type_document_requirements_approval_type_id_fkey" FOREIGN KEY ("approval_type_id") REFERENCES "approval_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "application_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "application_id" TEXT NOT NULL,
    "document_id" TEXT,
    "document_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'missing',
    CONSTRAINT "application_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "application_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "document_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "application_document_id" TEXT NOT NULL,
    "officer_id" TEXT NOT NULL,
    "comment_text" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_comments_application_document_id_fkey" FOREIGN KEY ("application_document_id") REFERENCES "application_documents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "document_comments_officer_id_fkey" FOREIGN KEY ("officer_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "personal_info_user_id_key" ON "personal_info"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_info_user_id_key" ON "business_info"("user_id");
