USE healthcare_db;

CREATE TABLE medical_records (
    record_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_id BIGINT,
    diagnosis TEXT,
    prescription TEXT,
    test_results TEXT,
    visit_date DATE,

    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id)
);
INSERT INTO medical_records(patient_id, doctor_id, appointment_id, diagnosis, prescription, test_results, visit_date)
VALUES(1, 2, 1, 'Acne', 'Face cream twice daily', 'Blood Test Normal', '2026-08-15');

INSERT INTO medical_records(patient_id, doctor_id, appointment_id, diagnosis, prescription, test_results, visit_date)
VALUES(4, 3, 2, 'Migraine', 'Paracetamol 500mg', 'MRI Normal', '2026-08-16');

INSERT INTO medical_records(patient_id, doctor_id, appointment_id, diagnosis, prescription, test_results, visit_date)
VALUES(5, 4, 3, 'Fever', 'Antibiotics', 'CBC Report Normal', '2026-08-17');