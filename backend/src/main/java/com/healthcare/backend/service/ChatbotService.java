package com.healthcare.backend.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.healthcare.backend.dto.ChatRequestDto;
import com.healthcare.backend.dto.ChatResponseDto;
import com.healthcare.backend.dto.DrugInteractionResultDto;
import com.healthcare.backend.dto.MedicineDto;
import com.healthcare.backend.dto.PharmacyDto;
import com.healthcare.backend.model.Appointment;
import com.healthcare.backend.model.AppointmentReminder;
import com.healthcare.backend.model.Doctor;
import com.healthcare.backend.repository.AppointmentReminderRepository;
import com.healthcare.backend.repository.AppointmentRepository;
import com.healthcare.backend.repository.DoctorRepository;

@Service
public class ChatbotService {

    public static final String CLINICAL_SAFETY_NOTICE =
            "CLINICAL SAFETY ADVISORY: I am an AI Healthcare Assistant designed for informational " +
            "guidance, appointment scheduling, report extraction, and screening support. " +
            "I do not provide clinical medical diagnoses or write prescriptions. For urgent symptoms, " +
            "please contact emergency services or consult a qualified physician immediately.";

    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentReminderRepository reminderRepository;
    private final MedicineService medicineService;
    private final PharmacyService pharmacyService;

    public ChatbotService(
            DoctorRepository doctorRepository,
            AppointmentRepository appointmentRepository,
            AppointmentReminderRepository reminderRepository,
            MedicineService medicineService,
            PharmacyService pharmacyService
    ) {
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.reminderRepository = reminderRepository;
        this.medicineService = medicineService;
        this.pharmacyService = pharmacyService;
    }

    public ChatResponseDto processMessage(ChatRequestDto request) {
        if (request == null || request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            return new ChatResponseDto(
                    "Hello! I am your AI Healthcare Assistant. How can I assist with your health, appointments, or medical information today?",
                    "GREETING",
                    null,
                    Collections.emptyMap(),
                    List.of("Book an appointment", "Check diabetes risk", "Explain blood report", "Search medicine uses", "Find nearby pharmacy"),
                    CLINICAL_SAFETY_NOTICE
            );
        }

        String msg = request.getMessage().trim().toLowerCase(Locale.ROOT);
        Long patientId = request.getPatientId();

        // 1. APPOINTMENT BOOKING INTENT
        if (msg.contains("book") || msg.contains("appointment slot") || msg.contains("doctor") || msg.contains("schedule a consultation") || msg.contains("cardiologist") || msg.contains("dermatologist") || msg.contains("pediatrician") || msg.contains("orthopedic")) {
            return handleBookingIntent(msg);
        }

        // 2. CHECK UPCOMING APPOINTMENTS INTENT
        if (msg.contains("upcoming appointment") || msg.contains("my appointment") || msg.contains("next appointment") || msg.contains("when is my appointment") || msg.contains("consultation date")) {
            return handleCheckAppointmentsIntent(patientId);
        }

        // 3. APPOINTMENT REMINDERS INTENT
        if (msg.contains("reminder") || msg.contains("remind me") || msg.contains("notification") || msg.contains("alert")) {
            return handleRemindersIntent(patientId);
        }

        // 4. MEDICAL RECORD / LAB REPORT ANALYSIS INTENT
        if (msg.contains("blood report") || msg.contains("medical report") || msg.contains("lab test") || msg.contains("summarize report") || msg.contains("abnormal value") || msg.contains("reference range") || msg.contains("upload report") || msg.contains("pdf")) {
            return handleReportAnalysisIntent();
        }

        // 5. DISEASE RISK PREDICTION INTENT
        if (msg.contains("diabetes") || msg.contains("disease risk") || msg.contains("risk assessment") || msg.contains("predict risk") || msg.contains("blood sugar risk") || msg.contains("bmi risk") || msg.contains("cardiometabolic")) {
            return handleDiseasePredictionIntent();
        }

        // 6. MEDICINE INTERACTIONS INTENT
        if (msg.contains("interaction") || (msg.contains("take") && msg.contains("together")) || (msg.contains("combine") && msg.contains("medicine"))) {
            return handleMedicineInteractionIntent(msg);
        }

        // 7. MEDICINE INFORMATION INTENT
        if (msg.contains("medicine") || msg.contains("drug") || msg.contains("tablet") || msg.contains("side effect") || msg.contains("used for") || msg.contains("metformin") || msg.contains("lisinopril") || msg.contains("atorvastatin") || msg.contains("aspirin") || msg.contains("amoxicillin") || msg.contains("paracetamol") || msg.contains("warfarin") || msg.contains("ibuprofen") || msg.contains("omeprazole")) {
            return handleMedicineInfoIntent(msg);
        }

        // 8. PHARMACY SUGGESTIONS INTENT
        if (msg.contains("pharmacy") || msg.contains("chemist") || msg.contains("drugstore") || msg.contains("store near me") || msg.contains("pharmacies near")) {
            return handlePharmacyIntent(msg);
        }

        // DEFAULT / GENERAL ASSISTANCE
        return handleGeneralQuery(msg);
    }

    private ChatResponseDto handleBookingIntent(String msg) {
        String detectedSpecialty = null;
        if (msg.contains("cardio")) detectedSpecialty = "Cardiology";
        else if (msg.contains("derma")) detectedSpecialty = "Dermatology";
        else if (msg.contains("pedia")) detectedSpecialty = "Pediatrics";
        else if (msg.contains("ortho")) detectedSpecialty = "Orthopedics";
        else if (msg.contains("neuro")) detectedSpecialty = "Neurology";

        List<Doctor> doctors = doctorRepository.findAll();
        if (detectedSpecialty != null) {
            String spec = detectedSpecialty;
            doctors = doctors.stream()
                    .filter(d -> d.getSpecialization() != null && d.getSpecialization().toLowerCase(Locale.ROOT).contains(spec.toLowerCase(Locale.ROOT)))
                    .collect(Collectors.toList());
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("specialty", detectedSpecialty);
        payload.put("matchingDoctorCount", doctors.size());

        String replyText = detectedSpecialty != null
                ? String.format("I found %d doctor(s) specializing in **%s**. I've opened the **AI Appointment Booking** workflow below where you can review available consultation slots and select your preferred time with AI recommendation badges.", doctors.size(), detectedSpecialty)
                : "I have opened the **AI Appointment Booking** workflow below. You can search verified doctors by medical specialization, view open time slots, and schedule your appointment with double-booking validation.";

        return new ChatResponseDto(
                replyText,
                "BOOK_APPOINTMENT",
                "open_booking",
                payload,
                List.of("View available slots", "Show cardiologists", "Check my upcoming visits", "Explain diabetes risk"),
                CLINICAL_SAFETY_NOTICE
        );
    }

    private ChatResponseDto handleCheckAppointmentsIntent(Long patientId) {
        if (patientId == null || patientId <= 0) {
            return new ChatResponseDto(
                    "To view your scheduled consultations, please log in with your patient account. You can also open the Appointment Booking workflow below to view the clinic calendar.",
                    "CHECK_APPOINTMENTS",
                    "open_booking",
                    Collections.emptyMap(),
                    List.of("Log in as patient", "Book new appointment", "Check appointment reminders"),
                    CLINICAL_SAFETY_NOTICE
            );
        }

        List<Appointment> userApts = appointmentRepository.findByPatientId(patientId);
        List<Appointment> upcoming = userApts.stream()
                .filter(a -> !"Cancelled".equalsIgnoreCase(a.getStatus()) && !"Completed".equalsIgnoreCase(a.getStatus()))
                .collect(Collectors.toList());

        Map<String, Object> payload = new HashMap<>();
        payload.put("upcomingCount", upcoming.size());

        if (upcoming.isEmpty()) {
            return new ChatResponseDto(
                    "You have no upcoming consultations currently scheduled. Would you like me to open the Appointment Booking module to schedule a visit with one of our attending specialists?",
                    "CHECK_APPOINTMENTS",
                    "open_booking",
                    payload,
                    List.of("Book appointment now", "Find a doctor", "Check appointment reminders"),
                    CLINICAL_SAFETY_NOTICE
            );
        }

        Appointment nextApt = upcoming.get(0);
        Doctor doc = doctorRepository.findById(nextApt.getDoctorId()).orElse(null);
        String docName = doc != null ? doc.getFullName() : "Physician #" + nextApt.getDoctorId();

        String reply = String.format(
                "You have **%d upcoming appointment(s)**. Your next consultation is with **Dr. %s** on **%s** at **%s** (Status: `%s`). I have opened your appointment schedule below where you can reschedule or cancel if needed.",
                upcoming.size(), docName, nextApt.getAppointmentDate(), nextApt.getAppointmentTime(), nextApt.getStatus()
        );

        return new ChatResponseDto(
                reply,
                "CHECK_APPOINTMENTS",
                "open_booking",
                payload,
                List.of("Reschedule this appointment", "Show appointment reminders", "Prepare medical records"),
                CLINICAL_SAFETY_NOTICE
        );
    }

    private ChatResponseDto handleRemindersIntent(Long patientId) {
        if (patientId != null && patientId > 0) {
            List<AppointmentReminder> reminders = reminderRepository.findByPatientIdOrderBySentAtDesc(patientId);
            Map<String, Object> payload = new HashMap<>();
            payload.put("reminderCount", reminders.size());

            String reply = reminders.isEmpty()
                    ? "Our automated scheduler scans every 60 seconds and triggers 24-hour and 1-hour notifications before every scheduled appointment. You currently have no active pending notifications on file."
                    : String.format("You have **%d recorded appointment notification(s)**. Reminders are tracked for 24-hour and 1-hour pre-visit alerts including clinic details and doctor contact.", reminders.size());

            return new ChatResponseDto(
                    reply + " I've activated the **Appointment Reminders** dashboard below.",
                    "REMINDERS",
                    "open_reminders",
                    payload,
                    List.of("Scan for new reminders now", "View upcoming appointments", "Book consultation"),
                    CLINICAL_SAFETY_NOTICE
            );
        }

        return new ChatResponseDto(
                "The automated reminder system provides 24-hour and 1-hour pre-consultation notifications with doctor, time, and clinic address details to prevent missed visits. I have opened the Reminders view below.",
                "REMINDERS",
                "open_reminders",
                Collections.emptyMap(),
                List.of("Show my upcoming appointments", "Book an appointment"),
                CLINICAL_SAFETY_NOTICE
        );
    }

    private ChatResponseDto handleReportAnalysisIntent() {
        return new ChatResponseDto(
                "I can analyze laboratory diagnostic panels from uploaded **PDF files, images, or text notes**. The AI engine extracts biomarkers (such as Fasting Glucose, HbA1c, Cholesterol, and Creatinine) and compares them against standard published clinical reference ranges (ADA, AHA, NKF). I have activated the **AI Medical Record Analysis** tool below.",
                "REPORT_ANALYSIS",
                "open_reports",
                Collections.emptyMap(),
                List.of("Upload PDF blood report", "Paste lab numbers", "Check diabetes risk"),
                CLINICAL_SAFETY_NOTICE
        );
    }

    private ChatResponseDto handleDiseasePredictionIntent() {
        return new ChatResponseDto(
                "I have loaded the **AI Disease Risk Prediction** module below. Our machine-learning model is trained on the benchmark Pima Indians Diabetes dataset (768 patient records) using a validated Random Forest classifier (**74.03% Accuracy, 82.28% ROC-AUC** on test data). Fill in your physiological parameters below to evaluate cardiometabolic risk factors.",
                "DISEASE_PREDICTION",
                "open_prediction",
                Collections.emptyMap(),
                List.of("What details are required?", "Run assessment with default profile", "View model metrics"),
                CLINICAL_SAFETY_NOTICE
        );
    }

    private ChatResponseDto handleMedicineInteractionIntent(String msg) {
        List<MedicineDto> allMeds = medicineService.searchMedicines("");
        List<String> matchedNames = new ArrayList<>();
        for (MedicineDto m : allMeds) {
            String gen = m.getGenericName().toLowerCase(Locale.ROOT);
            if (msg.contains(gen)) {
                matchedNames.add(m.getGenericName());
            }
        }

        if (matchedNames.size() >= 2) {
            List<DrugInteractionResultDto> inters = medicineService.checkInteractions(matchedNames);
            Map<String, Object> payload = new HashMap<>();
            payload.put("interactions", inters);

            if (!inters.isEmpty()) {
                DrugInteractionResultDto top = inters.get(0);
                String reply = String.format(
                        "⚠️ **Documented Drug Interaction Detected between %s and %s (%s SEVERITY)**:\n\n- **Mechanism**: %s\n- **Clinical Action**: %s\n\nI have loaded the **Medicine Safety Analyzer** below with complete monograph details.",
                        top.getDrugA(), top.getDrugB(), top.getSeverity(), top.getClinicalMechanism(), top.getRecommendedAction()
                );
                return new ChatResponseDto(
                        reply,
                        "MEDICINE_INTERACTION",
                        "open_medicines",
                        payload,
                        List.of("Check more medicines", "Find nearby pharmacy", "Book doctor appointment"),
                        CLINICAL_SAFETY_NOTICE
                );
            }
        }

        return new ChatResponseDto(
                "I can analyze multi-drug pharmacokinetic and pharmacodynamic interactions against our verified clinical safety database. I have opened the **Drug-Drug Interaction Checker** below where you can select or enter any combination of medicines.",
                "MEDICINE_INTERACTION",
                "open_medicines",
                Collections.emptyMap(),
                List.of("Check Aspirin + Warfarin", "Check Lisinopril + Ibuprofen", "Search medicine directory"),
                CLINICAL_SAFETY_NOTICE
        );
    }

    private ChatResponseDto handleMedicineInfoIntent(String msg) {
        List<MedicineDto> matches = medicineService.searchMedicines(msg);
        if (!matches.isEmpty()) {
            MedicineDto top = matches.get(0);
            Map<String, Object> payload = new HashMap<>();
            payload.put("medicine", top);

            String reply = String.format(
                    "### 💊 Verified Monograph: %s (%s)\n" +
                    "- **Therapeutic Class**: %s\n" +
                    "- **Approved Uses**: %s\n" +
                    "- **Key Boxed Warning**: %s\n" +
                    "- **Common Side Effects**: %s\n\n" +
                    "I have opened the **Medicine Information Assistant** below with complete FDA/WHO documentation.",
                    top.getName(), top.getGenericName(), top.getTherapeuticClass(),
                    top.getApprovedUses() != null && !top.getApprovedUses().isEmpty() ? top.getApprovedUses().get(0) : "N/A",
                    top.getWarnings() != null && !top.getWarnings().isEmpty() ? top.getWarnings().get(0) : "Use under prescription",
                    top.getCommonSideEffects() != null ? String.join(", ", top.getCommonSideEffects().subList(0, Math.min(3, top.getCommonSideEffects().size()))) : "N/A"
            );

            return new ChatResponseDto(
                    reply,
                    "MEDICINE_INFO",
                    "open_medicines",
                    payload,
                    List.of("Check interactions for this medicine", "Find nearby pharmacy stocking it", "View full monograph"),
                    CLINICAL_SAFETY_NOTICE
            );
        }

        return new ChatResponseDto(
                "You can search our verified pharmaceutical directory for approved indications, boxed warnings, contraindications, and common adverse effects. I have opened the **Medicine Information Assistant** below.",
                "MEDICINE_INFO",
                "open_medicines",
                Collections.emptyMap(),
                List.of("Information on Metformin", "Information on Lisinopril", "Information on Atorvastatin"),
                CLINICAL_SAFETY_NOTICE
        );
    }

    private ChatResponseDto handlePharmacyIntent(String msg) {
        List<PharmacyDto> nearby = pharmacyService.getNearbyPharmacies(17.385, 78.486, 25.0, null, "distance");
        Map<String, Object> payload = new HashMap<>();
        payload.put("pharmacyCount", nearby.size());

        return new ChatResponseDto(
                String.format("I located **%d verified licensed pharmacies** in the network. You can enable browser GPS or type your neighborhood to sort pharmacies by exact distance, verify in-stock medicine inventory, and get turn-by-turn directions. I've activated the **Nearby Pharmacy Finder** below.", nearby.size()),
                "NEARBY_PHARMACY",
                "open_pharmacies",
                payload,
                List.of("Find 24/7 pharmacies", "Check Metformin availability", "Share my GPS location"),
                CLINICAL_SAFETY_NOTICE
        );
    }

    private ChatResponseDto handleGeneralQuery(String msg) {
        return new ChatResponseDto(
                "I am your AI Healthcare Assistant. I am directly integrated with our clinical appointment system, laboratory report analyzer, machine-learning disease risk models, verified drug library, and local pharmacy network.\n\n" +
                "Which area would you like to explore? You can choose any of the six module cards above, or tell me what you need assistance with.",
                "GENERAL_QUERY",
                null,
                Collections.emptyMap(),
                List.of("Book an appointment", "Check diabetes risk", "Explain blood report", "Check medicine interaction", "Find nearby pharmacy"),
                CLINICAL_SAFETY_NOTICE
        );
    }
}

