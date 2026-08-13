USE healthcare_db;

CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL
);

INSERT INTO users(full_name,email,password,role)
VALUES
('Adusuru Sailaja','sailaja@gmail.com','123456','PATIENT'),
('Dr. Priya Sharma','priya@gmail.com','doctor123','DOCTOR'),
('Admin','admin@gmail.com','admin123','ADMIN');

SELECT * FROM users;