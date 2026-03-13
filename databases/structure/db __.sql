
CREATE TABLE "public"."account_verifications" (
  "account_verifications_id" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "verify_token_hash" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "expired_at" timestamp(6) NOT NULL,
  "used_at" timestamp(6),
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for api_permissions
-- ----------------------------
CREATE TABLE "public"."api_permissions" (
  "api_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "method" varchar(10) COLLATE "pg_catalog"."default" NOT NULL,
  "endpoint" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "module" varchar(50) COLLATE "pg_catalog"."default",
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'ACTIVE'::character varying,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp(6)
)
;

-- ----------------------------
-- Table structure for appointment_audit_logs
-- ----------------------------
CREATE TABLE "public"."appointment_audit_logs" (
  "appointment_audit_logs_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "appointment_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "changed_by" varchar(50) COLLATE "pg_catalog"."default",
  "old_status" varchar(50) COLLATE "pg_catalog"."default",
  "new_status" varchar(50) COLLATE "pg_catalog"."default",
  "action_note" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for appointment_slots
-- ----------------------------
CREATE TABLE "public"."appointment_slots" (
  "slot_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "shift_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "start_time" time(6) NOT NULL,
  "end_time" time(6) NOT NULL,
  "is_active" bool DEFAULT true,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for appointments
-- ----------------------------
CREATE TABLE "public"."appointments" (
  "appointments_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "appointment_code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "patient_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "doctor_id" varchar(50) COLLATE "pg_catalog"."default",
  "slot_id" varchar(50) COLLATE "pg_catalog"."default",
  "booking_channel" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "reason_for_visit" text COLLATE "pg_catalog"."default",
  "symptoms_notes" text COLLATE "pg_catalog"."default",
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'PENDING'::character varying,
  "checked_in_at" timestamp(6),
  "cancelled_at" timestamp(6),
  "cancellation_reason" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "room_id" varchar(50) COLLATE "pg_catalog"."default",
  "facility_service_id" varchar(50) COLLATE "pg_catalog"."default",
  "appointment_date" date NOT NULL DEFAULT CURRENT_DATE
)
;

-- ----------------------------
-- Table structure for audit_logs
-- ----------------------------
CREATE TABLE "public"."audit_logs" (
  "log_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" varchar(50) COLLATE "pg_catalog"."default",
  "action_type" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "module_name" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "target_id" varchar(100) COLLATE "pg_catalog"."default",
  "old_value" jsonb,
  "new_value" jsonb,
  "ip_address" varchar(45) COLLATE "pg_catalog"."default",
  "user_agent" text COLLATE "pg_catalog"."default",
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for beds
-- ----------------------------
CREATE TABLE "public"."beds" (
  "bed_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "facility_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "branch_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "department_id" varchar(50) COLLATE "pg_catalog"."default",
  "room_id" varchar(50) COLLATE "pg_catalog"."default",
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "type" varchar(20) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'STANDARD'::character varying,
  "status" varchar(20) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'EMPTY'::character varying,
  "description" text COLLATE "pg_catalog"."default",
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamptz(6)
)
;

-- ----------------------------
-- Table structure for booking_configurations
-- ----------------------------
CREATE TABLE "public"."booking_configurations" (
  "config_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "facility_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "branch_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "max_patients_per_slot" int4,
  "buffer_duration" int4,
  "advance_booking_days" int4,
  "minimum_booking_hours" int4,
  "cancellation_allowed_hours" int4,
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for branches
-- ----------------------------
CREATE TABLE "public"."branches" (
  "branches_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "facility_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "address" text COLLATE "pg_catalog"."default" NOT NULL,
  "phone" varchar(20) COLLATE "pg_catalog"."default",
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'ACTIVE'::character varying,
  "established_date" date,
  "deleted_at" timestamp(6)
)
;

-- ----------------------------
-- Table structure for cashier_shifts
-- ----------------------------
CREATE TABLE "public"."cashier_shifts" (
  "cashier_shifts_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "cashier_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "shift_start" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "shift_end" timestamp(6),
  "opening_balance" numeric(12,2) NOT NULL,
  "system_calculated_balance" numeric(12,2) DEFAULT 0,
  "actual_closing_balance" numeric(12,2),
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'OPEN'::character varying,
  "notes" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for clinic_rooms
-- ----------------------------
CREATE TABLE "public"."clinic_rooms" (
  "clinic_rooms_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "room_code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "room_name" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "room_type" varchar(50) COLLATE "pg_catalog"."default",
  "capacity" int4 DEFAULT 1,
  "is_active" bool DEFAULT true
)
;

-- ----------------------------
-- Table structure for clinical_examinations
-- ----------------------------
CREATE TABLE "public"."clinical_examinations" (
  "clinical_examinations_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "encounter_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "pulse" int4,
  "blood_pressure_systolic" int4,
  "blood_pressure_diastolic" int4,
  "temperature" numeric(4,2),
  "respiratory_rate" int4,
  "spo2" int4,
  "weight" numeric(5,2),
  "height" numeric(5,2),
  "bmi" numeric(4,2),
  "chief_complaint" text COLLATE "pg_catalog"."default",
  "medical_history_notes" text COLLATE "pg_catalog"."default",
  "physical_examination" text COLLATE "pg_catalog"."default",
  "recorded_by" varchar(50) COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for departments
-- ----------------------------
CREATE TABLE "public"."departments" (
  "departments_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "branch_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'ACTIVE'::character varying,
  "deleted_at" timestamp(6)
)
;

-- ----------------------------
-- Table structure for doctor_schedules
-- ----------------------------
CREATE TABLE "public"."doctor_schedules" (
  "doctor_schedules_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "doctor_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "room_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "schedule_date" date NOT NULL,
  "shift_type" varchar(50) COLLATE "pg_catalog"."default",
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'ACTIVE'::character varying,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for doctor_services
-- ----------------------------
CREATE TABLE "public"."doctor_services" (
  "doctor_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "facility_service_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "is_primary" bool DEFAULT true,
  "assigned_by" varchar(50) COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for doctors
-- ----------------------------
CREATE TABLE "public"."doctors" (
  "doctors_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "specialty_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "title" varchar(100) COLLATE "pg_catalog"."default",
  "biography" text COLLATE "pg_catalog"."default",
  "consultation_fee" numeric(12,2),
  "is_active" bool DEFAULT true
)
;

-- ----------------------------
-- Table structure for document_types
-- ----------------------------
CREATE TABLE "public"."document_types" (
  "document_type_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "is_active" bool DEFAULT true,
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamptz(6)
)
;

-- ----------------------------
-- Table structure for drug_categories
-- ----------------------------
CREATE TABLE "public"."drug_categories" (
  "drug_categories_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(150) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "deleted_at" timestamp(6)
)
;

-- ----------------------------
-- Table structure for drug_dispense_details
-- ----------------------------
CREATE TABLE "public"."drug_dispense_details" (
  "drug_dispense_details_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "dispense_order_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "prescription_detail_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "inventory_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "dispensed_quantity" int4 NOT NULL
)
;

-- ----------------------------
-- Table structure for drug_dispense_orders
-- ----------------------------
CREATE TABLE "public"."drug_dispense_orders" (
  "drug_dispense_orders_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "prescription_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "pharmacist_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'COMPLETED'::character varying,
  "dispensed_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for drugs
-- ----------------------------
CREATE TABLE "public"."drugs" (
  "drugs_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "drug_code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "national_drug_code" varchar(100) COLLATE "pg_catalog"."default",
  "brand_name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "active_ingredients" text COLLATE "pg_catalog"."default" NOT NULL,
  "category_id" varchar(50) COLLATE "pg_catalog"."default",
  "route_of_administration" varchar(50) COLLATE "pg_catalog"."default",
  "dispensing_unit" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "is_prescription_only" bool DEFAULT true,
  "is_active" bool DEFAULT true,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for ehr_access_grants
-- ----------------------------
CREATE TABLE "public"."ehr_access_grants" (
  "ehr_access_grants_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "patient_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "granted_to_user_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "access_level" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'READ_ONLY'::character varying,
  "allowed_modules" json,
  "valid_from" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "valid_until" timestamp(6),
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'ACTIVE'::character varying,
  "granted_by" varchar(50) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for emr_signatures
-- ----------------------------
CREATE TABLE "public"."emr_signatures" (
  "emr_signatures_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "encounter_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "signed_by" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "signature_hash" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "certificate_serial" varchar(100) COLLATE "pg_catalog"."default",
  "signed_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "client_ip" varchar(45) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for encounter_diagnoses
-- ----------------------------
CREATE TABLE "public"."encounter_diagnoses" (
  "encounter_diagnoses_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "encounter_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "icd10_code" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "diagnosis_name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "diagnosis_type" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'PRIMARY'::character varying,
  "notes" text COLLATE "pg_catalog"."default",
  "diagnosed_by" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for encounters
-- ----------------------------
CREATE TABLE "public"."encounters" (
  "encounters_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "appointment_id" varchar(50) COLLATE "pg_catalog"."default",
  "patient_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "doctor_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "room_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "encounter_type" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'OUTPATIENT'::character varying,
  "start_time" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "end_time" timestamp(6),
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'IN_PROGRESS'::character varying,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for equipment_maintenance_logs
-- ----------------------------
CREATE TABLE "public"."equipment_maintenance_logs" (
  "log_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "equipment_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "maintenance_date" date NOT NULL,
  "maintenance_type" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "performed_by" varchar(255) COLLATE "pg_catalog"."default",
  "cost" numeric(15,2) DEFAULT 0.00,
  "next_maintenance_date" date,
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for external_health_records
-- ----------------------------
CREATE TABLE "public"."external_health_records" (
  "external_health_records_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "patient_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "provider_name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "integration_protocol" varchar(50) COLLATE "pg_catalog"."default",
  "data_type" varchar(50) COLLATE "pg_catalog"."default",
  "raw_payload" jsonb NOT NULL,
  "sync_status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'PENDING'::character varying,
  "synced_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for facilities
-- ----------------------------
CREATE TABLE "public"."facilities" (
  "facilities_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "tax_code" varchar(50) COLLATE "pg_catalog"."default",
  "email" varchar(100) COLLATE "pg_catalog"."default",
  "phone" varchar(20) COLLATE "pg_catalog"."default",
  "website" varchar(255) COLLATE "pg_catalog"."default",
  "logo_url" text COLLATE "pg_catalog"."default",
  "headquarters_address" text COLLATE "pg_catalog"."default",
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'ACTIVE'::character varying,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp(6)
)
;

-- ----------------------------
-- Table structure for facility_closed_days
-- ----------------------------
CREATE TABLE "public"."facility_closed_days" (
  "closed_day_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "facility_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "day_of_week" int4 NOT NULL,
  "title" varchar(150) COLLATE "pg_catalog"."default" NOT NULL,
  "start_time" time(6) NOT NULL,
  "end_time" time(6) NOT NULL,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp(6)
)
;

-- ----------------------------
-- Table structure for facility_holidays
-- ----------------------------
CREATE TABLE "public"."facility_holidays" (
  "holiday_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "facility_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "holiday_date" date NOT NULL,
  "title" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "is_closed" bool DEFAULT true,
  "special_open_time" time(6),
  "special_close_time" time(6),
  "description" text COLLATE "pg_catalog"."default",
  "is_recurring" bool DEFAULT false,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp(6)
)
;

-- ----------------------------
-- Table structure for facility_operation_hours
-- ----------------------------
CREATE TABLE "public"."facility_operation_hours" (
  "operation_hours_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "facility_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "day_of_week" int4 NOT NULL,
  "open_time" time(6) NOT NULL,
  "close_time" time(6) NOT NULL,
  "is_closed" bool DEFAULT false,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp(6)
)
;

-- ----------------------------
-- Table structure for facility_services
-- ----------------------------
CREATE TABLE "public"."facility_services" (
  "facility_services_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "facility_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "service_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "department_id" varchar(50) COLLATE "pg_catalog"."default",
  "base_price" numeric(12,2) NOT NULL,
  "insurance_price" numeric(12,2),
  "estimated_duration_minutes" int4 DEFAULT 15,
  "is_active" bool DEFAULT true,
  "vip_price" numeric(12,2) DEFAULT 0
)
;
COMMENT ON COLUMN "public"."facility_services"."vip_price" IS 'Giá VIP dành cho khách hàng ưu tiên (VNĐ)';

-- ----------------------------
-- Table structure for health_timeline_events
-- ----------------------------
CREATE TABLE "public"."health_timeline_events" (
  "health_timeline_events_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "patient_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "event_date" timestamp(6) NOT NULL,
  "event_type" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "title" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "summary" text COLLATE "pg_catalog"."default",
  "reference_id" varchar(50) COLLATE "pg_catalog"."default",
  "reference_table" varchar(50) COLLATE "pg_catalog"."default",
  "source_system" varchar(100) COLLATE "pg_catalog"."default" DEFAULT 'INTERNAL_HIS'::character varying,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for insurance_coverages
-- ----------------------------
CREATE TABLE "public"."insurance_coverages" (
  "insurance_coverages_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "coverage_name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "provider_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "coverage_percent" numeric(5,2) NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "is_active" bool DEFAULT true,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for insurance_providers
-- ----------------------------
CREATE TABLE "public"."insurance_providers" (
  "insurance_providers_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "provider_code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "provider_name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "insurance_type" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "contact_phone" varchar(50) COLLATE "pg_catalog"."default",
  "contact_email" varchar(100) COLLATE "pg_catalog"."default",
  "address" text COLLATE "pg_catalog"."default",
  "support_notes" text COLLATE "pg_catalog"."default",
  "is_active" bool DEFAULT true,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for invoice_details
-- ----------------------------
CREATE TABLE "public"."invoice_details" (
  "invoice_details_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "invoice_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "reference_type" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "reference_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "item_name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "quantity" int4 NOT NULL DEFAULT 1,
  "unit_price" numeric(12,2) NOT NULL,
  "subtotal" numeric(12,2) NOT NULL
)
;

-- ----------------------------
-- Table structure for invoices
-- ----------------------------
CREATE TABLE "public"."invoices" (
  "invoices_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "invoice_code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "patient_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "encounter_id" varchar(50) COLLATE "pg_catalog"."default",
  "total_amount" numeric(12,2) NOT NULL DEFAULT 0,
  "discount_amount" numeric(12,2) DEFAULT 0,
  "insurance_amount" numeric(12,2) DEFAULT 0,
  "net_amount" numeric(12,2) NOT NULL,
  "paid_amount" numeric(12,2) DEFAULT 0,
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'UNPAID'::character varying,
  "created_by" varchar(50) COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for leave_requests
-- ----------------------------
CREATE TABLE "public"."leave_requests" (
  "leave_requests_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "reason" text COLLATE "pg_catalog"."default" NOT NULL,
  "status" varchar(20) COLLATE "pg_catalog"."default" DEFAULT 'PENDING'::character varying,
  "approver_id" varchar(50) COLLATE "pg_catalog"."default",
  "approver_note" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp(6)
)
;

-- ----------------------------
-- Table structure for master_data_categories
-- ----------------------------
CREATE TABLE "public"."master_data_categories" (
  "master_data_categories_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "deleted_at" timestamp(6)
)
;

-- ----------------------------
-- Table structure for master_data_items
-- ----------------------------
CREATE TABLE "public"."master_data_items" (
  "master_data_items_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "category_code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "value" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "sort_order" int4 DEFAULT 0,
  "is_active" bool DEFAULT true
)
;

-- ----------------------------
-- Table structure for medical_equipments
-- ----------------------------
CREATE TABLE "public"."medical_equipments" (
  "equipment_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "facility_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "branch_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "serial_number" varchar(100) COLLATE "pg_catalog"."default",
  "manufacturer" varchar(100) COLLATE "pg_catalog"."default",
  "manufacturing_date" date,
  "purchase_date" date,
  "warranty_expiration" date,
  "status" varchar(20) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'ACTIVE'::character varying,
  "current_room_id" varchar(50) COLLATE "pg_catalog"."default",
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamptz(6)
)
;

-- ----------------------------
-- Table structure for medical_order_results
-- ----------------------------
CREATE TABLE "public"."medical_order_results" (
  "medical_order_results_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "order_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "result_summary" text COLLATE "pg_catalog"."default",
  "result_details" json,
  "attachment_urls" json,
  "performed_by" varchar(50) COLLATE "pg_catalog"."default",
  "performed_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for medical_orders
-- ----------------------------
CREATE TABLE "public"."medical_orders" (
  "medical_orders_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "encounter_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "service_code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "service_name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "clinical_indicator" text COLLATE "pg_catalog"."default",
  "priority" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'ROUTINE'::character varying,
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'PENDING'::character varying,
  "ordered_by" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "ordered_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for medical_rooms
-- ----------------------------
CREATE TABLE "public"."medical_rooms" (
  "medical_rooms_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "department_id" varchar(50) COLLATE "pg_catalog"."default",
  "code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "room_type" varchar(50) COLLATE "pg_catalog"."default",
  "capacity" int4 DEFAULT 1,
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'ACTIVE'::character varying,
  "branch_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "deleted_at" timestamp(6)
)
;

-- ----------------------------
-- Table structure for menus
-- ----------------------------
CREATE TABLE "public"."menus" (
  "menus_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "url" varchar(255) COLLATE "pg_catalog"."default",
  "icon" varchar(100) COLLATE "pg_catalog"."default",
  "parent_id" varchar(50) COLLATE "pg_catalog"."default",
  "sort_order" int4 DEFAULT 0,
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'ACTIVE'::character varying,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp(6)
)
;

-- ----------------------------
-- Table structure for notification_categories
-- ----------------------------
CREATE TABLE "public"."notification_categories" (
  "notification_categories_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "is_active" bool DEFAULT true,
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamptz(6)
)
;

-- ----------------------------
-- Table structure for notification_role_configs
-- ----------------------------
CREATE TABLE "public"."notification_role_configs" (
  "notification_role_configs_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "role_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "category_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "allow_inapp" bool DEFAULT true,
  "allow_email" bool DEFAULT false,
  "allow_push" bool DEFAULT false,
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for notification_templates
-- ----------------------------
CREATE TABLE "public"."notification_templates" (
  "notification_templates_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "category_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "title_template" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "body_inapp" text COLLATE "pg_catalog"."default" NOT NULL,
  "body_email" text COLLATE "pg_catalog"."default",
  "body_push" text COLLATE "pg_catalog"."default",
  "is_system" bool DEFAULT false,
  "is_active" bool DEFAULT true,
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamptz(6)
)
;

-- ----------------------------
-- Table structure for password_resets
-- ----------------------------
CREATE TABLE "public"."password_resets" (
  "password_resets_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "reset_token" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "expired_at" timestamp(6) NOT NULL,
  "used_at" timestamp(6),
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for patient_allergies
-- ----------------------------
CREATE TABLE "public"."patient_allergies" (
  "patient_allergies_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "patient_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "allergen_type" varchar(50) COLLATE "pg_catalog"."default",
  "allergen_name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "reaction" text COLLATE "pg_catalog"."default",
  "severity" varchar(50) COLLATE "pg_catalog"."default",
  "notes" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for patient_classification_rules
-- ----------------------------
CREATE TABLE "public"."patient_classification_rules" (
  "rule_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(150) COLLATE "pg_catalog"."default" NOT NULL,
  "criteria_type" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "criteria_operator" varchar(10) COLLATE "pg_catalog"."default" NOT NULL,
  "criteria_value" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "target_tag_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "timeframe_days" int4,
  "is_active" bool DEFAULT true,
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamptz(6)
)
;

-- ----------------------------
-- Table structure for patient_contacts
-- ----------------------------
CREATE TABLE "public"."patient_contacts" (
  "patient_contacts_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "patient_id" uuid NOT NULL,
  "relation_type_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "contact_name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "phone_number" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "address" text COLLATE "pg_catalog"."default",
  "is_emergency_contact" bool DEFAULT false,
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamptz(6),
  "is_legal_representative" bool DEFAULT false,
  "medical_decision_note" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for patient_document_versions
-- ----------------------------
CREATE TABLE "public"."patient_document_versions" (
  "version_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "document_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "version_number" int4 NOT NULL,
  "file_url" text COLLATE "pg_catalog"."default" NOT NULL,
  "file_format" varchar(20) COLLATE "pg_catalog"."default",
  "file_size_bytes" int8,
  "uploaded_by" varchar(50) COLLATE "pg_catalog"."default",
  "uploaded_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for patient_documents
-- ----------------------------
CREATE TABLE "public"."patient_documents" (
  "patient_documents_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "patient_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "document_type" varchar(50) COLLATE "pg_catalog"."default",
  "title" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "file_url" text COLLATE "pg_catalog"."default" NOT NULL,
  "uploaded_by" varchar(50) COLLATE "pg_catalog"."default",
  "uploaded_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "document_type_id" varchar(50) COLLATE "pg_catalog"."default",
  "file_format" varchar(20) COLLATE "pg_catalog"."default",
  "file_size_bytes" int8,
  "notes" text COLLATE "pg_catalog"."default",
  "updated_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamptz(6),
  "version_number" int4 DEFAULT 1
)
;

-- ----------------------------
-- Table structure for patient_health_metrics
-- ----------------------------
CREATE TABLE "public"."patient_health_metrics" (
  "patient_health_metrics_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "patient_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "metric_code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "metric_name" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "metric_value" json NOT NULL,
  "unit" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "measured_at" timestamp(6) NOT NULL,
  "source_type" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'SELF_REPORTED'::character varying,
  "device_info" varchar(255) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for patient_insurances
-- ----------------------------
CREATE TABLE "public"."patient_insurances" (
  "patient_insurances_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "patient_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "insurance_type" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "insurance_number" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "coverage_percent" int4,
  "is_primary" bool DEFAULT true,
  "document_url" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "provider_id" varchar(50) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for patient_medical_histories
-- ----------------------------
CREATE TABLE "public"."patient_medical_histories" (
  "patient_medical_histories_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "patient_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "condition_code" varchar(20) COLLATE "pg_catalog"."default",
  "condition_name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "history_type" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "diagnosis_date" date,
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'ACTIVE'::character varying,
  "notes" text COLLATE "pg_catalog"."default",
  "reported_by" varchar(50) COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for patient_tags
-- ----------------------------
CREATE TABLE "public"."patient_tags" (
  "patient_tags_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "patient_id" uuid NOT NULL,
  "tag_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "assigned_by" varchar(50) COLLATE "pg_catalog"."default",
  "assigned_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for patients
-- ----------------------------
CREATE TABLE "public"."patients" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "patient_code" varchar(30) COLLATE "pg_catalog"."default" NOT NULL,
  "account_id" varchar(255) COLLATE "pg_catalog"."default",
  "full_name" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "date_of_birth" date NOT NULL,
  "gender" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "phone_number" varchar(20) COLLATE "pg_catalog"."default",
  "email" varchar(100) COLLATE "pg_catalog"."default",
  "id_card_number" varchar(50) COLLATE "pg_catalog"."default",
  "address" text COLLATE "pg_catalog"."default",
  "province_id" int4,
  "district_id" int4,
  "ward_id" int4,
  "emergency_contact_name" varchar(100) COLLATE "pg_catalog"."default",
  "emergency_contact_phone" varchar(20) COLLATE "pg_catalog"."default",
  "status" varchar(20) COLLATE "pg_catalog"."default" DEFAULT 'ACTIVE'::character varying,
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamptz(6),
  "has_insurance" bool DEFAULT false
)
;

-- ----------------------------
-- Table structure for payment_transactions
-- ----------------------------
CREATE TABLE "public"."payment_transactions" (
  "payment_transactions_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "transaction_code" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "invoice_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "transaction_type" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'PAYMENT'::character varying,
  "payment_method" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "gateway_transaction_id" varchar(255) COLLATE "pg_catalog"."default",
  "gateway_response" json,
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'PENDING'::character varying,
  "cashier_id" varchar(50) COLLATE "pg_catalog"."default",
  "paid_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for permissions
-- ----------------------------
CREATE TABLE "public"."permissions" (
  "permissions_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "module" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp(6)
)
;

-- ----------------------------
-- Table structure for pharmacy_inventory
-- ----------------------------
CREATE TABLE "public"."pharmacy_inventory" (
  "pharmacy_inventory_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "drug_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "batch_number" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "expiry_date" date NOT NULL,
  "stock_quantity" int4 NOT NULL DEFAULT 0,
  "unit_cost" numeric(12,2),
  "unit_price" numeric(12,2),
  "location_bin" varchar(50) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for prescription_details
-- ----------------------------
CREATE TABLE "public"."prescription_details" (
  "prescription_details_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "prescription_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "drug_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "quantity" int4 NOT NULL,
  "dosage" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "frequency" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "duration_days" int4,
  "usage_instruction" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for prescriptions
-- ----------------------------
CREATE TABLE "public"."prescriptions" (
  "prescriptions_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "prescription_code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "encounter_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "doctor_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "patient_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'DRAFT'::character varying,
  "clinical_diagnosis" text COLLATE "pg_catalog"."default",
  "doctor_notes" text COLLATE "pg_catalog"."default",
  "prescribed_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for promotions
-- ----------------------------
CREATE TABLE "public"."promotions" (
  "promotions_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(150) COLLATE "pg_catalog"."default" NOT NULL,
  "discount_type" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "discount_value" numeric(12,2) NOT NULL,
  "start_date" timestamp(6) NOT NULL,
  "end_date" timestamp(6) NOT NULL,
  "is_active" bool DEFAULT true
)
;

-- ----------------------------
-- Table structure for relation_types
-- ----------------------------
CREATE TABLE "public"."relation_types" (
  "relation_types_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "is_active" bool DEFAULT true,
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamptz(6)
)
;

-- ----------------------------
-- Table structure for role_api_permissions
-- ----------------------------
CREATE TABLE "public"."role_api_permissions" (
  "role_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "api_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for role_menus
-- ----------------------------
CREATE TABLE "public"."role_menus" (
  "role_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "menu_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL
)
;

-- ----------------------------
-- Table structure for role_permissions
-- ----------------------------
CREATE TABLE "public"."role_permissions" (
  "role_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "permission_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL
)
;

-- ----------------------------
-- Table structure for roles
-- ----------------------------
CREATE TABLE "public"."roles" (
  "roles_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "is_system" bool DEFAULT false,
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'ACTIVE'::character varying,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp(6)
)
;

-- ----------------------------
-- Table structure for schedule_slots
-- ----------------------------
CREATE TABLE "public"."schedule_slots" (
  "schedule_slots_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "schedule_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "start_time" time(6) NOT NULL,
  "end_time" time(6) NOT NULL,
  "max_patients" int4 DEFAULT 1,
  "booked_patients" int4 DEFAULT 0,
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'AVAILABLE'::character varying
)
;

-- ----------------------------
-- Table structure for service_categories
-- ----------------------------
CREATE TABLE "public"."service_categories" (
  "service_categories_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for services
-- ----------------------------
CREATE TABLE "public"."services" (
  "services_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "service_group" varchar(50) COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "is_active" bool DEFAULT true,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp(6),
  "insurance_code" varchar(100) COLLATE "pg_catalog"."default",
  "service_type" varchar(50) COLLATE "pg_catalog"."default"
)
;
COMMENT ON COLUMN "public"."services"."insurance_code" IS 'Mã dịch vụ BHYT (Mapping với danh mục BHYT quốc gia)';
COMMENT ON COLUMN "public"."services"."service_type" IS 'Phân loại dịch vụ: CLINICAL, LABORATORY, RADIOLOGY, PROCEDURE';

-- ----------------------------
-- Table structure for shift_swaps
-- ----------------------------
CREATE TABLE "public"."shift_swaps" (
  "swap_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "requester_schedule_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "target_schedule_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "reason" text COLLATE "pg_catalog"."default" NOT NULL,
  "status" varchar(20) COLLATE "pg_catalog"."default" DEFAULT 'PENDING'::character varying,
  "approver_id" varchar(50) COLLATE "pg_catalog"."default",
  "approver_note" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp(6)
)
;

-- ----------------------------
-- Table structure for shifts
-- ----------------------------
CREATE TABLE "public"."shifts" (
  "shifts_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "start_time" time(6) NOT NULL,
  "end_time" time(6) NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'ACTIVE'::character varying,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp(6)
)
;

-- ----------------------------
-- Table structure for specialties
-- ----------------------------
CREATE TABLE "public"."specialties" (
  "specialties_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(150) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "deleted_at" timestamp(6)
)
;

-- ----------------------------
-- Table structure for specialty_services
-- ----------------------------
CREATE TABLE "public"."specialty_services" (
  "specialty_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "service_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for staff_schedules
-- ----------------------------
CREATE TABLE "public"."staff_schedules" (
  "staff_schedules_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "medical_room_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "working_date" date NOT NULL,
  "start_time" time(6) NOT NULL,
  "end_time" time(6) NOT NULL,
  "is_leave" bool DEFAULT false,
  "leave_reason" text COLLATE "pg_catalog"."default",
  "shift_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "status" varchar(20) COLLATE "pg_catalog"."default" DEFAULT 'ACTIVE'::character varying
)
;

-- ----------------------------
-- Table structure for system_config_permissions
-- ----------------------------
CREATE TABLE "public"."system_config_permissions" (
  "id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "role_code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "module" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "updated_by" varchar(50) COLLATE "pg_catalog"."default",
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for system_settings
-- ----------------------------
CREATE TABLE "public"."system_settings" (
  "system_settings_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "setting_key" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "setting_value" json NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "updated_by" varchar(50) COLLATE "pg_catalog"."default",
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "module" varchar(100) COLLATE "pg_catalog"."default" DEFAULT 'GENERAL'::character varying,
  "is_deleted" bool NOT NULL DEFAULT false
)
;

-- ----------------------------
-- Table structure for tags
-- ----------------------------
CREATE TABLE "public"."tags" (
  "tags_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "color_hex" varchar(10) COLLATE "pg_catalog"."default" DEFAULT '#000000'::character varying,
  "description" text COLLATE "pg_catalog"."default",
  "is_active" bool DEFAULT true,
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamptz(6)
)
;

-- ----------------------------
-- Table structure for tele_consultations
-- ----------------------------
CREATE TABLE "public"."tele_consultations" (
  "tele_consultations_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "encounter_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "platform" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'AGORA'::character varying,
  "meeting_id" varchar(100) COLLATE "pg_catalog"."default",
  "meeting_password" varchar(100) COLLATE "pg_catalog"."default",
  "host_url" text COLLATE "pg_catalog"."default",
  "join_url" text COLLATE "pg_catalog"."default" NOT NULL,
  "recording_url" text COLLATE "pg_catalog"."default",
  "recording_duration" int4,
  "call_status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'SCHEDULED'::character varying,
  "actual_start_time" timestamp(6),
  "actual_end_time" timestamp(6),
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for tele_feedbacks
-- ----------------------------
CREATE TABLE "public"."tele_feedbacks" (
  "tele_feedbacks_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "tele_consultation_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "patient_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "doctor_rating" int4,
  "doctor_feedback" text COLLATE "pg_catalog"."default",
  "tech_rating" int4,
  "tech_feedback" text COLLATE "pg_catalog"."default",
  "tech_issues_tags" json,
  "submitted_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for tele_messages
-- ----------------------------
CREATE TABLE "public"."tele_messages" (
  "tele_messages_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "tele_consultation_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "sender_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "sender_type" varchar(50) COLLATE "pg_catalog"."default",
  "message_type" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'TEXT'::character varying,
  "content" text COLLATE "pg_catalog"."default",
  "file_url" text COLLATE "pg_catalog"."default",
  "is_read" bool DEFAULT false,
  "sent_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for user_branch_dept
-- ----------------------------
CREATE TABLE "public"."user_branch_dept" (
  "user_branch_dept_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "branch_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "department_id" varchar(50) COLLATE "pg_catalog"."default",
  "role_title" varchar(100) COLLATE "pg_catalog"."default",
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'ACTIVE'::character varying
)
;

-- ----------------------------
-- Table structure for user_fcm_tokens
-- ----------------------------
CREATE TABLE "public"."user_fcm_tokens" (
  "token_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "fcm_token" text COLLATE "pg_catalog"."default" NOT NULL,
  "device_name" varchar(100) COLLATE "pg_catalog"."default",
  "last_active" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for user_licenses
-- ----------------------------
CREATE TABLE "public"."user_licenses" (
  "licenses_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "license_type" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "license_number" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "issue_date" date NOT NULL,
  "expiry_date" date,
  "issued_by" varchar(255) COLLATE "pg_catalog"."default",
  "document_url" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp(6)
)
;

-- ----------------------------
-- Table structure for user_notifications
-- ----------------------------
CREATE TABLE "public"."user_notifications" (
  "user_notifications_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "template_id" varchar(50) COLLATE "pg_catalog"."default",
  "title" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "content" text COLLATE "pg_catalog"."default" NOT NULL,
  "data_payload" jsonb,
  "is_read" bool DEFAULT false,
  "read_at" timestamptz(6),
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for user_profiles
-- ----------------------------
CREATE TABLE "public"."user_profiles" (
  "user_profiles_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "full_name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "dob" date,
  "gender" varchar(20) COLLATE "pg_catalog"."default",
  "identity_card_number" varchar(50) COLLATE "pg_catalog"."default",
  "avatar_url" text COLLATE "pg_catalog"."default",
  "address" text COLLATE "pg_catalog"."default",
  "preferences" jsonb DEFAULT '{}'::jsonb,
  "signature_url" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for user_roles
-- ----------------------------
CREATE TABLE "public"."user_roles" (
  "user_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "role_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL
)
;

-- ----------------------------
-- Table structure for user_sessions
-- ----------------------------
CREATE TABLE "public"."user_sessions" (
  "user_sessions_id" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "refresh_token_hash" varchar(512) COLLATE "pg_catalog"."default" NOT NULL,
  "device_id" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "device_name" varchar(255) COLLATE "pg_catalog"."default",
  "ip_address" varchar(45) COLLATE "pg_catalog"."default",
  "user_agent" text COLLATE "pg_catalog"."default",
  "last_used_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "expired_at" timestamp(6) NOT NULL,
  "revoked_at" timestamp(6),
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for users
-- ----------------------------
CREATE TABLE "public"."users" (
  "users_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "email" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "phone_number" varchar(20) COLLATE "pg_catalog"."default",
  "password_hash" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "status" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'ACTIVE'::character varying,
  "last_login_at" timestamp(6),
  "failed_login_count" int4 DEFAULT 0,
  "locked_until" timestamp(6),
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp(6)
)