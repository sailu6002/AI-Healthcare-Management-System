package com.healthcare.backend.config;

import java.util.List;
import java.util.Optional;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.healthcare.backend.model.Appointment;
import com.healthcare.backend.model.Doctor;
import com.healthcare.backend.model.MedicalRecord;
import com.healthcare.backend.model.Patient;
import com.healthcare.backend.model.User;
import com.healthcare.backend.repository.AppointmentRepository;
import com.healthcare.backend.repository.DoctorRepository;
import com.healthcare.backend.repository.MedicalRecordRepository;
import com.healthcare.backend.repository.PatientRepository;
import com.healthcare.backend.repository.UserRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            PatientRepository patientRepository,
            DoctorRepository doctorRepository,
            AppointmentRepository appointmentRepository,
            MedicalRecordRepository medicalRecordRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedOriginalDoctors();
        seedOriginalPatients();
        seedOriginalAppointments();
        seedOriginalUsers();
        seedOriginalMedicalRecords();
    }

    private void seedOriginalDoctors() {
        createDoctorIfAbsent("Dr. Arun Kumar", "Cardiology", "arun@gmail.com", "9876543201", 10, "Apollo Heart Centre, Greams Road, Chennai");
        createDoctorIfAbsent("Dr. Priya Sharma", "Dermatology", "doctor@gmail.com", "9876543202", 7, "Skin & Laser Clinic, T. Nagar, Chennai");
        createDoctorIfAbsent("Dr. Rahul Verma", "Neurology", "rahul.doc@gmail.com", "9876543203", 8, "Neuro Wellness Centre, Indiranagar, Bangalore");
        createDoctorIfAbsent("Dr. Ananya Roy", "Pediatrics", "ananya.ped@gmail.com", "9876543204", 6, "Mother & Child Clinic, Bandra West, Mumbai");
        createDoctorIfAbsent("Dr. Rajesh Iyer", "Orthopedics", "rajesh.ortho@gmail.com", "9876543205", 12, "Bone & Joint Care Institute, Connaught Place, Delhi");
        createDoctorIfAbsent("Dr. Sunita Patel", "General Medicine", "sunita.med@gmail.com", "9876543206", 9, "City Care Health Centre, Banjara Hills, Hyderabad");
        createDoctorIfAbsent("Dr. Vikram Singh", "Endocrinology", "vikram.endo@gmail.com", "9876543207", 11, "Diabetes & Endocrine Clinic, Salt Lake, Kolkata");
    }

    private void createDoctorIfAbsent(String fullName, String specialization, String email, String phone, Integer exp, String address) {
        Optional<Doctor> existing = doctorRepository.findByEmail(email);
        if (existing.isEmpty()) {
            existing = doctorRepository.findByFullNameIgnoreCase(fullName);
        }
        if (existing.isEmpty()) {
            Doctor d = new Doctor();
            d.setFullName(fullName);
            d.setSpecialization(specialization);
            d.setEmail(email);
            d.setPhone(phone);
            d.setExperience(exp);
            d.setAddress(address);
            doctorRepository.save(d);
        } else {
            // Update specialization to clean standard name if needed
            Doctor d = existing.get();
            if (d.getSpecialization() == null || !d.getSpecialization().equalsIgnoreCase(specialization)) {
                d.setSpecialization(specialization);
                doctorRepository.save(d);
            }
        }
    }

    private void seedOriginalPatients() {
        createPatientIfAbsent("Adusuru Sailaja", 21, "A+", "sailaja@gmail.com", "Female", "9876543210", "Chennai");
        createPatientIfAbsent("Rahul Kumar", 25, "B+", "rahul@gmail.com", "Male", "9876543211", "Bangalore");
        createPatientIfAbsent("Priya Sharma", 30, "O+", "priya@gmail.com", "Female", "9876543212", "Hyderabad");
    }

    private void createPatientIfAbsent(String fullName, int age, String bloodGroup, String email, String gender, String phone, String address) {
        Optional<Patient> existing = patientRepository.findByEmail(email);
        if (existing.isEmpty()) {
            existing = patientRepository.findByFullNameIgnoreCase(fullName);
        }
        if (existing.isEmpty()) {
            Patient p = new Patient();
            p.setFullName(fullName);
            p.setAge(age);
            p.setBloodGroup(bloodGroup);
            p.setEmail(email);
            p.setGender(gender);
            p.setPhone(phone);
            p.setAddress(address);
            patientRepository.save(p);
        }
    }

    private void seedOriginalAppointments() {
        List<Patient> patients = patientRepository.findAll();
        List<Doctor> doctors = doctorRepository.findAll();

        if (patients.isEmpty() || doctors.isEmpty()) {
            return;
        }

        Long p1Id = findPatientIdByName(patients, "Adusuru Sailaja");
        Long p2Id = findPatientIdByName(patients, "Rahul Kumar");
        Long p3Id = findPatientIdByName(patients, "Priya Sharma");

        Long d1Id = findDoctorIdByName(doctors, "Dr. Arun Kumar");
        Long d2Id = findDoctorIdByName(doctors, "Dr. Priya Sharma");
        Long d3Id = findDoctorIdByName(doctors, "Dr. Rahul Verma");

        if (p1Id != null && d2Id != null) {
            createAppointmentIfAbsent(p1Id, d2Id, "2026-08-15", "10:00:00", "Booked");
        }
        if (p1Id != null && d1Id != null) {
            createAppointmentIfAbsent(p1Id, d1Id, "2026-09-02", "11:00:00", "Completed");
        }
        if (p2Id != null && d3Id != null) {
            createAppointmentIfAbsent(p2Id, d3Id, "2026-08-16", "11:30:00", "Booked");
        }
        if (p3Id != null && d2Id != null) {
            createAppointmentIfAbsent(p3Id, d2Id, "2026-08-17", "03:00:00", "Completed");
        }
    }

    private void createAppointmentIfAbsent(Long patientId, Long doctorId, String date, String time, String status) {
        Optional<Appointment> existing = appointmentRepository
                .findByPatientIdAndDoctorIdAndAppointmentDateAndAppointmentTime(patientId, doctorId, date, time);
        if (existing.isEmpty()) {
            Appointment apt = new Appointment();
            apt.setPatientId(patientId);
            apt.setDoctorId(doctorId);
            apt.setAppointmentDate(date);
            apt.setAppointmentTime(time);
            apt.setStatus(status);
            appointmentRepository.save(apt);
        }
    }

    private void seedOriginalUsers() {
        createUserIfAbsent("Adusuru Sailaja", "sailaja@gmail.com", "password123", "PATIENT");
        createUserIfAbsent("Rahul Kumar", "rahul@gmail.com", "password123", "PATIENT");
        createUserIfAbsent("Priya Sharma", "priya@gmail.com", "password123", "PATIENT");
        createUserIfAbsent("Dr. Priya Sharma", "doctor@gmail.com", "password123", "DOCTOR");
        createUserIfAbsent("System Administrator", "admin@gmail.com", "admin123", "ADMIN");
    }

    private void createUserIfAbsent(String fullName, String email, String plainPassword, String role) {
        if (!userRepository.existsByEmail(email)) {
            User u = new User();
            u.setFullName(fullName);
            u.setEmail(email);
            u.setPassword(passwordEncoder.encode(plainPassword));
            u.setRole(role);
            userRepository.save(u);
        }
    }

    private void seedOriginalMedicalRecords() {
        List<Patient> patients = patientRepository.findAll();
        List<Doctor> doctors = doctorRepository.findAll();

        if (patients.isEmpty() || doctors.isEmpty()) {
            return;
        }

        Long p1Id = findPatientIdByName(patients, "Adusuru Sailaja");
        Long p2Id = findPatientIdByName(patients, "Rahul Kumar");

        Long d1Id = findDoctorIdByName(doctors, "Dr. Arun Kumar");
        Long d2Id = findDoctorIdByName(doctors, "Dr. Priya Sharma");
        Long d3Id = findDoctorIdByName(doctors, "Dr. Rahul Verma");

        if (p1Id != null) {
            List<MedicalRecord> p1Records = medicalRecordRepository.findByPatientId(p1Id);
            if (p1Records.isEmpty()) {
                MedicalRecord r1 = new MedicalRecord();
                r1.setPatientId(p1Id);
                r1.setDoctorId(d2Id != null ? d2Id : doctors.get(0).getDoctorId());
                r1.setDiagnosis("Acute Seasonal Bronchitis");
                r1.setSymptoms("Chest congestion, persistent cough, and mild low-grade fever");
                r1.setTreatment("Steam inhalation twice daily, warm saline gargle, rest, and increased hydration");
                r1.setTestResults("SpO2: 98%, BP: 120/80 mmHg, Auscultation: Mild bilateral rhonchi");
                r1.setVisitDate("2026-08-15");
                medicalRecordRepository.save(r1);

                MedicalRecord r2 = new MedicalRecord();
                r2.setPatientId(p1Id);
                r2.setDoctorId(d1Id != null ? d1Id : doctors.get(0).getDoctorId());
                r2.setDiagnosis("Routine Health Check-up & Wellness Evaluation");
                r2.setSymptoms("Annual routine health screening, general fatigue");
                r2.setTreatment("Balanced nutrition, 30 minutes daily aerobic exercise, adequate sleep");
                r2.setTestResults("Hemoglobin: 13.2 g/dL, Fasting Blood Sugar: 95 mg/dL, Total Cholesterol: 168 mg/dL");
                r2.setVisitDate("2026-06-20");
                medicalRecordRepository.save(r2);
            }
        }

        if (p2Id != null) {
            List<MedicalRecord> p2Records = medicalRecordRepository.findByPatientId(p2Id);
            if (p2Records.isEmpty()) {
                MedicalRecord r3 = new MedicalRecord();
                r3.setPatientId(p2Id);
                r3.setDoctorId(d3Id != null ? d3Id : doctors.get(0).getDoctorId());
                r3.setDiagnosis("Tension Headache & Neck Strain");
                r3.setSymptoms("Bilateral forehead pressure, neck stiffness caused by screen posture");
                r3.setTreatment("Ergonomic desk setup, 10-minute screen breaks hourly, gentle neck stretches");
                r3.setTestResults("Neurological reflexes normal, BP: 122/82 mmHg");
                r3.setVisitDate("2026-08-16");
                medicalRecordRepository.save(r3);
            }
        }
    }

    private Long findPatientIdByName(List<Patient> patients, String name) {
        return patients.stream()
                .filter(p -> p.getFullName() != null && p.getFullName().trim().equalsIgnoreCase(name.trim()))
                .map(Patient::getPatientId)
                .findFirst()
                .orElse(null);
    }

    private Long findDoctorIdByName(List<Doctor> doctors, String name) {
        return doctors.stream()
                .filter(d -> d.getFullName() != null && d.getFullName().trim().equalsIgnoreCase(name.trim()))
                .map(Doctor::getDoctorId)
                .findFirst()
                .orElse(null);
    }
}
