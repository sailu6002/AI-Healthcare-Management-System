CREATE TABLE appointments (
    appointment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(50),

    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
);
INSERT INTO appointments(patient_id, doctor_id, appointment_date, appointment_time, status)
VALUES(1,2,'2026-08-15','10:00:00','Booked');

INSERT INTO appointments(patient_id, doctor_id, appointment_date, appointment_time, status)
VALUES(4,3,'2026-08-16','11:30:00','Booked');

INSERT INTO appointments(patient_id, doctor_id, appointment_date, appointment_time, status)
VALUES(5,4,'2026-08-17','03:00:00','Completed');