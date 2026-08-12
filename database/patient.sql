USE healthcare_db;

CREATE TABLE `patients` (
    `patient_id` BIGINT NOT NULL AUTO_INCREMENT,
    `address` VARCHAR(255) DEFAULT NULL,
    `age` INT NOT NULL,
    `blood_group` VARCHAR(255) DEFAULT NULL,
    `email` VARCHAR(255) DEFAULT NULL,
    `full_name` VARCHAR(255) DEFAULT NULL,
    `gender` VARCHAR(255) DEFAULT NULL,
    `phone` VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (`patient_id`)
);
INSERT INTO patients(address, age, blood_group, email, full_name, gender, phone)
VALUES('Chennai', 21, 'A+', 'sailaja@gmail.com','Adusuru Sailaja', 'Female', '9876543210'),
('Bangalore', 25, 'B+', 'rahul@gmail.com','Rahul Kumar', 'Male', '9876543211'),
('Hyderabad', 30, 'O+', 'priya@gmail.com','Priya Sharma', 'Female', '9876543212');