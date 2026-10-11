-- ============================================================================
-- Phase 4.2 - Appointment safety migration (explicit, idempotent-ish)
--
-- IMPORTANT: this is applied manually with the mysql client. It is NOT done by
-- Hibernate ddl-auto. Applying it twice is not supported (the ALTER statements
-- will fail the second time); take a backup first.
--
-- What it does:
--   1. Links patients.user_id -> users.user_id (nullable, unique, FK).
--   2. Links ONLY patient 1 to user 1 (verified live match: same email and the
--      user has role PATIENT).
--   3. Creates doctor_schedules and doctor_time_off (availability model).
--   4. Preserves the original appointments rows in appointments_pre_phase4_2.
--   5. Converts appointments date/time VARCHAR columns to DATE/TIME and
--      normalizes status to BOOKED/CANCELLED/COMPLETED.
--   6. Adds a DB-enforced unique active-slot key (generated column) so two
--      active bookings cannot occupy the same doctor/slot.
-- ============================================================================

SET NAMES utf8mb4;

-- ----------------------------------------------------------------------------
-- 1. patients.user_id  (nullable, unique, FK to users)
-- ----------------------------------------------------------------------------
ALTER TABLE patients
    ADD COLUMN user_id BIGINT NULL AFTER patient_id,
    ADD UNIQUE KEY uq_patients_user (user_id),
    ADD CONSTRAINT fk_patients_user
        FOREIGN KEY (user_id) REFERENCES users(user_id);

-- ----------------------------------------------------------------------------
-- 2. Link patient 1 -> user 1, only when the approved live match holds.
--    (same email, user is a PATIENT, and the row is not already linked)
-- ----------------------------------------------------------------------------
UPDATE patients p
    JOIN users u ON u.user_id = 1
    SET p.user_id = u.user_id
    WHERE p.patient_id = 1
      AND p.user_id IS NULL
      AND u.role = 'PATIENT'
      AND LOWER(p.email) = LOWER(u.email);

-- ----------------------------------------------------------------------------
-- 3. Availability model
-- ----------------------------------------------------------------------------
CREATE TABLE doctor_schedules (
    schedule_id  BIGINT      NOT NULL AUTO_INCREMENT,
    doctor_id    BIGINT      NOT NULL,
    day_of_week  TINYINT     NOT NULL COMMENT 'ISO-8601: 1=Mon .. 7=Sun',
    start_time   TIME        NOT NULL,
    end_time     TIME        NOT NULL,
    slot_minutes INT         NOT NULL DEFAULT 30,
    active       TINYINT(1)  NOT NULL DEFAULT 1,
    PRIMARY KEY (schedule_id),
    UNIQUE KEY uq_doctor_schedule (doctor_id, day_of_week, start_time, end_time),
    KEY idx_doctor_schedule_day (doctor_id, day_of_week),
    CONSTRAINT fk_schedule_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id),
    CONSTRAINT chk_schedule_interval CHECK (start_time < end_time),
    CONSTRAINT chk_schedule_slot CHECK (slot_minutes > 0)
) ENGINE=InnoDB;

CREATE TABLE doctor_time_off (
    time_off_id BIGINT       NOT NULL AUTO_INCREMENT,
    doctor_id   BIGINT       NOT NULL,
    off_date    DATE         NOT NULL,
    start_time  TIME         NULL,
    end_time    TIME         NULL,
    reason      VARCHAR(255) NULL,
    PRIMARY KEY (time_off_id),
    KEY idx_time_off_doctor_date (doctor_id, off_date),
    CONSTRAINT fk_time_off_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id),
    CONSTRAINT chk_time_off_interval CHECK (
        start_time IS NULL OR end_time IS NULL OR start_time < end_time
    )
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 4. Preserve the original appointments rows (recoverable backup)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS appointments_pre_phase4_2;
CREATE TABLE appointments_pre_phase4_2 AS SELECT * FROM appointments;

-- ----------------------------------------------------------------------------
-- 5. Normalize status, then convert date/time strings to real SQL types.
--    (preflight verified every existing value is a valid 'YYYY-MM-DD' /
--     'HH:MM:SS' string and that no duplicate active slots exist)
-- ----------------------------------------------------------------------------
UPDATE appointments SET status = UPPER(status);

ALTER TABLE appointments
    MODIFY COLUMN appointment_date DATE NOT NULL,
    MODIFY COLUMN appointment_time TIME NOT NULL,
    MODIFY COLUMN status VARCHAR(20) NOT NULL;

-- ----------------------------------------------------------------------------
-- 6. DB-enforced active-slot uniqueness + lookup index
--    active_slot_key is NULL for non-BOOKED rows, so MySQL's unique index
--    (which allows multiple NULLs) lets cancelled/completed rows coexist while
--    guaranteeing at most one active booking per doctor/slot.
-- ----------------------------------------------------------------------------
ALTER TABLE appointments
    ADD COLUMN active_slot_key VARCHAR(64)
        GENERATED ALWAYS AS (
            CASE
                WHEN status = 'BOOKED'
                THEN CONCAT(doctor_id, '|', appointment_date, '|', appointment_time)
                ELSE NULL
            END
        ) STORED,
    ADD UNIQUE KEY uq_active_slot (active_slot_key),
    ADD KEY idx_appointments_doctor_date (doctor_id, appointment_date);
