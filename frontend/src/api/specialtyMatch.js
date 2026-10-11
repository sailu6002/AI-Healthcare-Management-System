// Pure helper: match real doctor records against the AI service's
// `recommended_specialists`.
//
// Matching is a case-insensitive, whitespace-trimmed exact match on the
// doctor's `specialization`. Specialties for which no doctor is registered
// are returned in `unmatched` so the UI can say so explicitly rather than
// inventing doctors or departments.

function normalize(value) {
  return (value || "").trim().toLowerCase();
}

export function matchDoctorsBySpecialties(doctors, specialties) {
  const wanted = new Set(
    (specialties || []).map(normalize).filter(Boolean)
  );

  const matches = [];
  const matched = new Set();

  (doctors || []).forEach((doctor) => {
    const key = normalize(doctor.specialization);
    if (wanted.has(key)) {
      matches.push(doctor);
      matched.add(key);
    }
  });

  const unmatched = (specialties || []).filter((specialty) => {
    const key = normalize(specialty);
    return key && !matched.has(key);
  });

  return { matches, unmatched };
}
