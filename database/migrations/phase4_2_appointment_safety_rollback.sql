-- ============================================================================
-- Phase 4.2 - Rollback for phase4_2_appointment_safety.sql
--
-- Restores the pre-migration schema and data. Assumes the forward migration
-- was applied and that appointments_pre_phase4_2 still exists.
--
-- NOTE: rows created after the migration (new appointments) have no entry in
-- appointments_pre_phase4_2, so their original varchar values are lost when the
-- columns are converted back to VARCHAR. Restore from the full mysqldump backup
-- in /tmp/opencode/ if that matters.
-- ============================================================================

SET NAMES utf8mb4;

-- 6. drop active-slot key, index and generated column
ALTER TABLE appointments
    DROP INDEX uq_active_slot,
    DROP INDEX idx_appointments_doctor_date,
    DROP COLUMN active_slot_key;

-- 5. restore original varchar values, then restore the column types
UPDATE appointments a
    JOIN appointments_pre_phase4_2 b ON a.appointment_id = b.appointment_id
    SET a.appointment_date = b.appointment_date,
        a.appointment_time = b.appointment_time,
        a.status = b.status;

ALTER TABLE appointments
    MODIFY COLUMN appointment_date VARCHAR(255),
    MODIFY COLUMN appointment_time VARCHAR(255),
    MODIFY COLUMN status VARCHAR(255);

DROP TABLE IF EXISTS appointments_pre_phase4_2;

-- 3. drop availability tables (time_off first: it has the FK)
DROP TABLE IF EXISTS doctor_time_off;
DROP TABLE IF EXISTS doctor_schedules;

-- 1./2. unlink patient 1 and remove the user_id link
UPDATE patients SET user_id = NULL WHERE patient_id = 1;

ALTER TABLE patients
    DROP FOREIGN KEY fk_patients_user,
    DROP INDEX uq_patients_user,
    DROP COLUMN user_id;
