package com.healthcare.backend.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.healthcare.backend.dto.DrugInteractionResultDto;
import com.healthcare.backend.dto.MedicineDto;
import com.healthcare.backend.model.MedicalRecord;
import com.healthcare.backend.model.Prescription;
import com.healthcare.backend.repository.MedicalRecordRepository;
import com.healthcare.backend.repository.PrescriptionRepository;

@Service
public class MedicineService {

    public static final String MANDATORY_SAFETY_WARNING =
            "SAFETY ADVISORY: This verified pharmaceutical directory is strictly for educational " +
            "and informational reference. It does NOT provide personalized dosage adjustments, cannot prescribe " +
            "medicines, and does not suggest changing or substituting prescribed medications. Never modify or " +
            "discontinue your medication regimen without the direct instruction of your attending physician or licensed pharmacist.";

    private final MedicalRecordRepository medicalRecordRepository;
    private final PrescriptionRepository prescriptionRepository;

    private final List<MedicineDto> verifiedMedicines = new ArrayList<>();
    private final List<DrugInteractionRule> interactionRules = new ArrayList<>();

    public record DrugInteractionRule(
            String drugA,
            String drugB,
            String severity,
            String mechanism,
            String action
    ) {}

    public MedicineService(
            MedicalRecordRepository medicalRecordRepository,
            PrescriptionRepository prescriptionRepository
    ) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.prescriptionRepository = prescriptionRepository;
        initializeMedicineCatalog();
        initializeInteractionDatabase();
    }

    private void initializeMedicineCatalog() {
        verifiedMedicines.add(new MedicineDto(
                "med-1",
                "Metformin Hydrochloride",
                "Metformin",
                List.of("Glucophage", "Fortamet", "Glumetza", "Riomet"),
                "Antidiabetic / Biguanide",
                List.of("First-line management of Type 2 Diabetes Mellitus", "Improves glycemic control when combined with diet and exercise"),
                List.of("Risk of lactic acidosis, especially in patients with severe renal impairment", "Temporarily discontinue prior to iodinated contrast radiological procedures", "Monitor eGFR and renal function periodically"),
                List.of("Severe renal impairment (eGFR < 30 mL/min/1.73m²)", "Acute or chronic metabolic acidosis, including diabetic ketoacidosis"),
                List.of("Nausea", "Vomiting", "Diarrhea", "Abdominal discomfort", "Metallic taste", "Vitamin B12 deficiency with prolonged use"),
                "Store at 20°C to 25°C (68°F to 77°F). Excursions permitted to 15°C to 30°C. Protect from moisture.",
                "Take with meals to minimize gastrointestinal discomfort. Avoid excessive acute or chronic alcohol consumption as alcohol potentiates the risk of lactic acidosis.",
                "U.S. FDA Prescribing Information / DailyMed (NIH National Library of Medicine) & WHO Model List of Essential Medicines"
        ));

        verifiedMedicines.add(new MedicineDto(
                "med-2",
                "Lisinopril",
                "Lisinopril",
                List.of("Prinivil", "Zestril", "Qbrelis"),
                "Antihypertensive / ACE Inhibitor",
                List.of("Treatment of Hypertension to lower blood pressure", "Adjunctive therapy in Heart Failure with reduced ejection fraction", "Improvement of survival in hemodynamically stable patients within 24 hours of acute myocardial infarction"),
                List.of("Boxed Warning: Fetal Toxicity – Discontinue as soon as pregnancy is detected", "Risk of angioedema (head and neck, intestinal)", "Risk of hyperkalemia, especially in patients with renal impairment or taking potassium supplements", "Persistent dry cough"),
                List.of("History of angioedema related to previous ACE inhibitor treatment", "Hereditary or idiopathic angioedema", "Concomitant use with aliskiren in patients with diabetes"),
                List.of("Dizziness", "Headache", "Persistent dry cough", "Excessive hypotension", "Hyperkalemia", "Fatigue"),
                "Store at controlled room temperature 20°C to 25°C (68°F to 77°F). Protect from excessive moisture.",
                "May be taken with or without food. Avoid potassium supplements or salt substitutes containing potassium without physician approval.",
                "U.S. FDA Drug Database / American Heart Association (AHA) Clinical Guidelines"
        ));

        verifiedMedicines.add(new MedicineDto(
                "med-3",
                "Atorvastatin Calcium",
                "Atorvastatin",
                List.of("Lipitor", "Atorvaliq"),
                "Cardiovascular / HMG-CoA Reductase Inhibitor (Statin)",
                List.of("Reduction of elevated Total Cholesterol, LDL-C, Apo B, and Triglycerides", "Primary prevention of cardiovascular disease in patients with multiple risk factors", "Secondary prevention in established coronary heart disease"),
                List.of("Risk of myopathy and rhabdomyolysis with acute renal failure", "Rare reports of immune-mediated necrotizing myopathy (IMNM)", "Periodic liver enzyme monitoring recommended before initiation"),
                List.of("Active liver disease or unexplained persistent elevations of hepatic transaminases", "Hypersensitivity to any component", "Pregnancy and lactation"),
                List.of("Nasopharyngitis", "Arthralgia", "Diarrhea", "Dyspepsia", "Myalgia (muscle ache)", "Urinary tract infection"),
                "Store at 20°C to 25°C (68°F to 77°F). Keep in original container.",
                "Can be taken with or without food at any time of day. Avoid drinking large quantities of grapefruit juice (> 1.2 liters daily) as it inhibits CYP3A4 metabolism.",
                "DailyMed / National Center for Biotechnology Information (NCBI) Bookshelf"
        ));

        verifiedMedicines.add(new MedicineDto(
                "med-4",
                "Aspirin (Acetylsalicylic Acid)",
                "Aspirin",
                List.of("Bayer", "Bufferin", "Ecotrin", "Empirin"),
                "Antiplatelet / Non-Steroidal Anti-Inflammatory (NSAID)",
                List.of("Secondary prevention of cardiovascular events in established coronary disease", "Temporary relief of mild to moderate pain, headache, and fever"),
                List.of("Risk of serious gastrointestinal bleeding and peptic ulceration", "Reye's syndrome in children/teens recovering from viral infections (varicella/influenza)", "Increased bleeding risk in surgical procedures"),
                List.of("Known allergy to NSAIDs or aspirin-induced asthma", "Active gastrointestinal bleeding or peptic ulcer disease", "Severe hepatic or renal impairment"),
                List.of("Dyspepsia", "Nausea", "Abdominal pain", "Easy bruising", "Prolonged bleeding time"),
                "Store at room temperature 15°C to 30°C. Protect from excessive heat and humidity.",
                "Take with food or a full glass of water to reduce stomach irritation. Limit alcohol use to decrease gastrointestinal bleeding risk.",
                "WHO Model Formulary & FDA Over-The-Counter Monograph"
        ));

        verifiedMedicines.add(new MedicineDto(
                "med-5",
                "Amoxicillin",
                "Amoxicillin",
                List.of("Amoxil", "Moxatag", "Trimox"),
                "Antibacterial / Beta-Lactam Penicillin",
                List.of("Treatment of susceptible bacterial infections of the ear, nose, throat, genitourinary tract, skin, and lower respiratory tract", "Part of H. pylori eradication combination therapy"),
                List.of("Serious and occasionally fatal hypersensitivity (anaphylactic) reactions", "Clostridioides difficile-associated diarrhea (CDAD)", "Prescribing in the absence of a proven or strongly suspected bacterial infection is unlikely to provide benefit and increases drug-resistant bacteria"),
                List.of("History of serious hypersensitivity reaction to amoxicillin or other beta-lactams (e.g., penicillins, cephalosporins)"),
                List.of("Nausea", "Vomiting", "Diarrhea", "Skin rash", "Urticaria", "Black hairy tongue (transient)"),
                "Capsules/Tablets: Store at room temperature 20°C to 25°C. Suspensions: Refrigerate after reconstitution.",
                "May be taken with or without meals. Complete the full prescribed course even if symptoms improve early.",
                "FDA Prescribing Information / Infectious Diseases Society of America (IDSA)"
        ));

        verifiedMedicines.add(new MedicineDto(
                "med-6",
                "Omeprazole",
                "Omeprazole",
                List.of("Prilosec", "Losec", "Zegerid"),
                "Gastrointestinal / Proton Pump Inhibitor (PPI)",
                List.of("Treatment of Gastroesophageal Reflux Disease (GERD) and erosive esophagitis", "Healing and maintenance of duodenal and gastric ulcers", "Pathological hypersecretory conditions (Zollinger-Ellison syndrome)"),
                List.of("Long-term use may increase risk of bone fractures (hip, wrist, spine)", "Hypomagnesemia with prolonged treatment (> 1 year)", "Risk of Clostridioides difficile infection and vitamin B12 malabsorption"),
                List.of("Known hypersensitivity to omeprazole or substituted benzimidazoles", "Concomitant use with rilpivirine-containing products"),
                List.of("Headache", "Abdominal pain", "Nausea", "Diarrhea", "Vomiting", "Flatulence"),
                "Store at 15°C to 30°C (59°F to 86°F). Protect from light and moisture.",
                "Take 30 to 60 minutes before a meal, ideally before breakfast. Swallow capsules whole; do not chew or crush delayed-release granules.",
                "American College of Gastroenterology (ACG) & FDA Label"
        ));

        verifiedMedicines.add(new MedicineDto(
                "med-7",
                "Paracetamol (Acetaminophen)",
                "Acetaminophen / Paracetamol",
                List.of("Tylenol", "Panadol", "Calpol", "Crocin"),
                "Analgesic & Antipyretic",
                List.of("Temporary relief of mild to moderate pain (headaches, muscular aches, toothaches)", "Reduction of fever"),
                List.of("Boxed Warning: Hepatotoxicity – Exceeding maximum daily dose (4,000 mg in adults) may cause severe liver injury requiring transplant or resulting in death", "Check all OTC medications for acetaminophen content to avoid accidental overdose"),
                List.of("Severe active hepatic impairment or severe acute liver disease", "Hypersensitivity to acetaminophen"),
                List.of("Rarely allergic skin reactions (Stevens-Johnson syndrome)", "Nausea", "Vomiting (in acute overdose)"),
                "Store at room temperature 20°C to 25°C.",
                "Do not combine with other acetaminophen-containing cough/cold products. Avoid alcohol consumption (3 or more drinks daily significantly increases liver damage risk).",
                "FDA Consumer Drug Safety & WHO Guidelines on Pain Management"
        ));

        verifiedMedicines.add(new MedicineDto(
                "med-8",
                "Warfarin Sodium",
                "Warfarin",
                List.of("Coumadin", "Jantoven"),
                "Anticoagulant / Vitamin K Antagonist",
                List.of("Prophylaxis and treatment of venous thrombosis and pulmonary embolism", "Prophylaxis of thromboembolic complications associated with atrial fibrillation or cardiac valve replacement"),
                List.of("Boxed Warning: Major Bleeding – Can cause fatal hemorrhage; requires regular International Normalized Ratio (INR) monitoring", "Numerous significant drug and dietary interactions"),
                List.of("Pregnancy (except women with mechanical heart valves at high thromboembolic risk)", "Active bleeding or hemorrhagic tendencies", "Recent surgery of central nervous system or eye"),
                List.of("Fatal or non-fatal hemorrhage from any tissue/organ", "Necrosis of skin and other tissues", "Systemic atheroemboli / purple toes syndrome"),
                "Store at 20°C to 25°C. Protect from light.",
                "Maintain consistent dietary Vitamin K intake (green leafy vegetables). Avoid alcohol and OTC NSAIDs without doctor guidance.",
                "American College of Chest Physicians (CHEST) & FDA Package Insert"
        ));

        verifiedMedicines.add(new MedicineDto(
                "med-9",
                "Ibuprofen",
                "Ibuprofen",
                List.of("Advil", "Motrin", "Brufen", "Nurofen"),
                "Non-Steroidal Anti-Inflammatory Drug (NSAID)",
                List.of("Relief of mild to moderate pain, dysmenorrhea, dental pain", "Reduction of inflammation in osteoarthritis and rheumatoid arthritis", "Reduction of fever"),
                List.of("Boxed Warning: Cardiovascular Risk – Increased risk of serious cardiovascular thrombotic events (myocardial infarction, stroke)", "Boxed Warning: Gastrointestinal Risk – Bleeding, ulceration, and perforation of stomach or intestines"),
                List.of("Known allergy to ibuprofen or aspirin", "In the setting of coronary artery bypass graft (CABG) surgery", "Active gastrointestinal bleeding"),
                List.of("Dyspepsia", "Nausea", "Epigastric distress", "Fluid retention", "Dizziness", "Tinnitus"),
                "Store at 20°C to 25°C (68°F to 77°F). Protect from excessive heat.",
                "Take with food or milk if stomach upset occurs. Avoid combining with other NSAIDs or alcohol.",
                "FDA OTC Drug Facts & American College of Rheumatology"
        ));

        verifiedMedicines.add(new MedicineDto(
                "med-10",
                "Levothyroxine Sodium",
                "Levothyroxine",
                List.of("Synthroid", "Levoxyl", "Tirosint", "Euthyrox"),
                "Endocrine / Thyroid Hormone (T4)",
                List.of("Replacement therapy in primary, secondary, and tertiary hypothyroidism", "Pituitary TSH suppression in the management of thyroid cancer"),
                List.of("Boxed Warning: Not for treatment of obesity or weight loss – Large doses cause serious or life-threatening toxicity", "Use with caution in patients with cardiovascular disorders; monitor thyroid function tests (TSH)"),
                List.of("Uncorrected adrenal cortical insufficiency", "Untreated thyrotoxicosis", "Acute myocardial infarction"),
                List.of("Symptoms of hyperthyroidism due to therapeutic overdosage: palpitations, tachycardia, nervousness, tremors, weight loss, heat intolerance"),
                "Store at 20°C to 25°C. Protect from light and moisture.",
                "Administer as a single daily dose on an empty stomach, 30 to 60 minutes before breakfast with a full glass of water. Separate from calcium, iron, or antacids by at least 4 hours.",
                "American Thyroid Association (ATA) & FDA Approved Monograph"
        ));
    }

    private void initializeInteractionDatabase() {
        interactionRules.add(new DrugInteractionRule(
                "Aspirin", "Warfarin",
                "MAJOR",
                "Combined antiplatelet and anticoagulant effects synergistically impair hemostasis, substantially elevating the risk of severe or fatal gastrointestinal and intracranial hemorrhage.",
                "Avoid concomitant use unless explicitly managed under specialized cardiology/hematology protocols with strict INR monitoring."
        ));

        interactionRules.add(new DrugInteractionRule(
                "Aspirin", "Ibuprofen",
                "MODERATE",
                "Ibuprofen may competitively interfere with the irreversible platelet COX-1 inhibition of low-dose cardioprotective aspirin, and combining NSAIDs increases gastrointestinal mucosal ulceration.",
                "Take immediate-release cardioprotective aspirin at least 30 minutes before or 8 hours after ibuprofen. Consider alternative analgesics."
        ));

        interactionRules.add(new DrugInteractionRule(
                "Warfarin", "Ibuprofen",
                "MAJOR",
                "NSAIDs displace warfarin from protein binding, inhibit platelet aggregation, and cause gastrointestinal ulceration, greatly compounding bleeding hazards.",
                "Avoid concurrent administration. Acetaminophen (used at lowest effective doses under supervision) is generally preferred for mild analgesia."
        ));

        interactionRules.add(new DrugInteractionRule(
                "Metformin", "Warfarin",
                "MINOR",
                "Minor pharmacokinetic variations; monitor blood glucose and coagulation parameters periodically upon initiation or dose change.",
                "Routine clinical monitoring is recommended."
        ));

        interactionRules.add(new DrugInteractionRule(
                "Lisinopril", "Ibuprofen",
                "MODERATE",
                "NSAIDs attenuate the antihypertensive and renal vasodilatory effects of ACE inhibitors by inhibiting renal prostaglandin synthesis, increasing the risk of acute renal failure and hyperkalemia.",
                "Monitor blood pressure and renal function (BUN, creatinine). Maintain adequate hydration."
        ));

        interactionRules.add(new DrugInteractionRule(
                "Atorvastatin", "Warfarin",
                "MODERATE",
                "Atorvastatin may slightly prolong prothrombin time / INR in patients receiving warfarin through competitive CYP3A4 metabolism.",
                "Check INR when starting or adjusting the dosage of atorvastatin."
        ));

        interactionRules.add(new DrugInteractionRule(
                "Omeprazole", "Aspirin",
                "MINOR",
                "Omeprazole increases gastric pH. It is frequently co-prescribed as a gastroprotective agent with aspirin in high-risk patients to reduce ulcer risk.",
                "Clinically beneficial co-prescription when indicated by a physician for gastric protection."
        ));

        interactionRules.add(new DrugInteractionRule(
                "Paracetamol", "Warfarin",
                "MODERATE",
                "Chronic high-dose acetaminophen (> 2,000 mg/day for several consecutive days) can inhibit warfarin metabolism and elevate INR.",
                "Use lowest effective acetaminophen doses; inform physician if regular use exceeds 2-3 consecutive days."
        ));

        interactionRules.add(new DrugInteractionRule(
                "Levothyroxine", "Omeprazole",
                "MODERATE",
                "PPI-induced gastric acid suppression decreases oral dissolution and absorption of levothyroxine, leading to elevated TSH and under-treatment.",
                "Monitor TSH levels. Take levothyroxine on an empty stomach at least 4 hours apart from acid-suppressing agents."
        ));
    }

    /**
     * Search verified medicines by query term
     */
    public List<MedicineDto> searchMedicines(String query) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.unmodifiableList(verifiedMedicines);
        }
        String q = query.trim().toLowerCase(Locale.ROOT);

        return verifiedMedicines.stream()
                .filter(m -> m.getName().toLowerCase(Locale.ROOT).contains(q)
                        || m.getGenericName().toLowerCase(Locale.ROOT).contains(q)
                        || m.getTherapeuticClass().toLowerCase(Locale.ROOT).contains(q)
                        || m.getBrandNames().stream().anyMatch(b -> b.toLowerCase(Locale.ROOT).contains(q))
                        || m.getApprovedUses().stream().anyMatch(u -> u.toLowerCase(Locale.ROOT).contains(q)))
                .collect(Collectors.toList());
    }

    /**
     * Get specific medicine details by ID or exact name
     */
    public MedicineDto getMedicineByIdOrName(String identifier) {
        if (identifier == null) return null;
        String idClean = identifier.trim().toLowerCase(Locale.ROOT);

        return verifiedMedicines.stream()
                .filter(m -> m.getId().equalsIgnoreCase(idClean)
                        || m.getName().toLowerCase(Locale.ROOT).equals(idClean)
                        || m.getGenericName().toLowerCase(Locale.ROOT).equals(idClean)
                        || m.getBrandNames().stream().anyMatch(b -> b.toLowerCase(Locale.ROOT).equals(idClean)))
                .findFirst()
                .orElse(null);
    }

    /**
     * Check interactions between two or more drugs
     */
    public List<DrugInteractionResultDto> checkInteractions(List<String> drugNames) {
        List<DrugInteractionResultDto> results = new ArrayList<>();
        if (drugNames == null || drugNames.size() < 2) {
            return results;
        }

        // Clean names
        List<String> cleaned = drugNames.stream()
                .filter(d -> d != null && !d.trim().isEmpty())
                .map(String::trim)
                .distinct()
                .collect(Collectors.toList());

        for (int i = 0; i < cleaned.size(); i++) {
            for (int j = i + 1; j < cleaned.size(); j++) {
                String d1 = cleaned.get(i);
                String d2 = cleaned.get(j);

                DrugInteractionRule match = findInteractionRule(d1, d2);
                if (match != null) {
                    results.add(new DrugInteractionResultDto(
                            d1,
                            d2,
                            match.severity(),
                            match.mechanism(),
                            match.action(),
                            MANDATORY_SAFETY_WARNING
                    ));
                }
            }
        }

        return results;
    }

    private DrugInteractionRule findInteractionRule(String name1, String name2) {
        String n1 = name1.toLowerCase(Locale.ROOT);
        String n2 = name2.toLowerCase(Locale.ROOT);

        for (DrugInteractionRule rule : interactionRules) {
            String ra = rule.drugA().toLowerCase(Locale.ROOT);
            String rb = rule.drugB().toLowerCase(Locale.ROOT);

            if ((n1.contains(ra) && n2.contains(rb)) || (n1.contains(rb) && n2.contains(ra))) {
                return rule;
            }
        }
        return null;
    }

    /**
     * Retrieve medications recorded in the patient's medical records or prescriptions
     */
    public Map<String, Object> getRecordedMedicationsForPatient(Long patientId) {
        Map<String, Object> response = new HashMap<>();
        List<String> recordedMeds = new ArrayList<>();

        if (patientId == null || patientId <= 0) {
            response.put("patientId", patientId);
            response.put("medications", Collections.emptyList());
            return response;
        }

        // 1. From prescriptions table
        List<Prescription> prescriptions = prescriptionRepository.findByPatientId(patientId);
        for (Prescription p : prescriptions) {
            if (p.getMedicine() != null && !p.getMedicine().isBlank()) {
                recordedMeds.add(p.getMedicine().trim());
            }
        }

        // 2. From medical records treatment / prescription text
        List<MedicalRecord> records = medicalRecordRepository.findByPatientId(patientId);
        for (MedicalRecord r : records) {
            if (r.getPrescription() != null && !r.getPrescription().isBlank()) {
                recordedMeds.add(r.getPrescription().trim());
            }
            if (r.getTreatment() != null && !r.getTreatment().isBlank()) {
                recordedMeds.add(r.getTreatment().trim());
            }
        }

        // Extract individual recognized medicine names
        List<String> matchedMedNames = new ArrayList<>();
        for (MedicineDto med : verifiedMedicines) {
            String gName = med.getGenericName().toLowerCase(Locale.ROOT);
            for (String rec : recordedMeds) {
                if (rec.toLowerCase(Locale.ROOT).contains(gName)) {
                    if (!matchedMedNames.contains(med.getName())) {
                        matchedMedNames.add(med.getName());
                    }
                }
            }
        }

        // If no direct matches, return fallback sample or the recorded raw lines
        response.put("patientId", patientId);
        response.put("rawPrescriptionEntries", recordedMeds.stream().distinct().collect(Collectors.toList()));
        response.put("matchedVerifiedMedicines", matchedMedNames);
        response.put("safetyWarning", MANDATORY_SAFETY_WARNING);

        return response;
    }
}
