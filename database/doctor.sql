USE healthcare_db;

CREATE TABLE doctors (
    doctor_id BIGINT NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(255) DEFAULT NULL,
    experience INT DEFAULT NULL,
    address VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (doctor_id)
);

INSERT INTO doctors
(full_name, specialization, email, phone, experience, address)
VALUES
('Dr. Arun Kumar', 'Cardiologist', 'arun@gmail.com', '9876543201', 10, 'Chennai'),
('Dr. Priya Sharma', 'Dermatologist', 'priya@gmail.com', '9876543202', 7, 'Chennai'),
('Dr. Rahul Verma', 'Neurologist', 'rahul@gmail.com', '9876543203', 8, 'Bangalore');