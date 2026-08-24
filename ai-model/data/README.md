# Datasets

Public research datasets only — no private patient data is used anywhere in
this module. All three sources are licensed **Creative Commons Attribution 4.0
International (CC BY 4.0)**; academic use requires attribution, listed below.

Raw downloads live in `data/raw/` (gitignored). Cleaned train/test splits go to
`data/processed/` (committed) so training is reproducible from a fresh clone.

## Diabetes — Pima Indians Diabetes

| | |
|---|---|
| File | `pima_diabetes.csv` |
| Source | UCI ML Repository, "Diabetes" (id 34): https://archive.ics.uci.edu/dataset/34/diabetes |
| Mirror used | jbrownlee/Datasets GitHub mirror (identical content) |
| License | CC BY 4.0 |
| Size | 768 rows × 8 features + binary `outcome` (500 negative / 268 positive) |

Features: pregnancies, glucose (mg/dL, oral tolerance test), blood pressure
(diastolic mmHg), skin thickness (triceps mm), insulin (2h mu U/ml), BMI,
diabetes pedigree function, age.

Known quirks: zero values in glucose/BP/skin/insulin/BMI encode *missing* and
are replaced during preprocessing (marked NaN before imputation).

Citation: Smith, J.W., Everhart, J.E., Dickson, W.C., Knowler, W.C., &
Johannes, R.S. (1988). *Using the ADAP learning algorithm to forecast the onset
of diabetes mellitus.* Proc. Annual Symposium on Computer Application in
Medical Care, 261–265.

## Heart disease — UCI Cleveland

| | |
|---|---|
| File | `cleveland_heart.csv` |
| Source | UCI ML Repository, "Heart Disease" (id 45): https://archive.ics.uci.edu/dataset/45/heart+disease (Cleveland subset) |
| License | CC BY 4.0 |
| Size | 303 rows × 13 features + target `num`; 6 cells missing (`ca`, `thal`) |

Features: age, sex, chest pain type (1–4), resting BP (trestbps), cholesterol
(mg/dL), fasting blood sugar >120 (fbs), resting ECG (restecg), max heart rate
(thalach), exercise-induced angina (exang), ST depression (oldpeak), slope of
peak exercise ST, vessels colored by fluoroscopy (ca), thallium stress test
(thal).

Target: `num` ∈ {0..4}; 0 = no disease, 1–4 = increasing severity. For binary
risk prediction we map `num > 0 → 1` (standard practice for this dataset).

Citation: Janosi, A., Steinbrunn, W., Pfisterer, M., & Detrano, R. (1989).
UCI Machine Learning Repository: Heart Disease Data Set.

## Kidney disease — UCI Chronic Kidney Disease

| | |
|---|---|
| File | `chronic_kidney_disease.arff` |
| Source | UCI ML Repository, id 336: https://archive.ics.uci.edu/dataset/336/chronic+kidney+disease (via OpenML did 42972 mirror, identical content) |
| License | CC BY 4.0 |
| Size | 400 rows × 24 features + class; ~1009 missing cells (this dataset is deliberately messy) |

Features: age, blood pressure (bp), urine specific gravity (sg), albumin (al),
sugar (su), red blood cells (rbc), pus cell (pc), pus cell clumps (pcc),
bacteria (ba), blood glucose random (bgr), blood urea (bu), serum creatinine
(sc), sodium (sod), potassium (pot), hemoglobin (hemo), packed cell volume
(pcv), white blood cell count (wc), red blood cell count (rc), hypertension
(htn), diabetes mellitus (dm), coronary artery disease (cad), appetite
(appet), pedal edema (pe), anemia (ane).

Class: `ckd` / `notckd`. Known quirks handled in preprocessing:
- 2 labels contain a stray tab (`'ckd\t'`) → normalised to `ckd`
- `pcv`, `wc`, `rc` are string-typed due to stray `\t?` values → coerced numeric
- `id` column dropped

Citation: Rubini, L.J., Soundararajan, P.S. (2015). UCI Machine Learning
Repository: Chronic Kidney Disease Data Set.

## How each dataset maps to our API input

The unified `PatientHealthProfile` schema (`app/schemas.py`) feeds all three
models; each model consumes the subset it was trained on:

| API field | Diabetes model | Heart model | Kidney model |
|---|---|---|---|
| age | ✓ | ✓ | ✓ |
| gender | – | ✓ (sex) | – |
| systolic_bp | – | ✓ (trestbps) | – |
| diastolic_bp | ✓ (bp) | – | ✓ (bp) |
| bmi | ✓ | – | – |
| fasting_glucose | ✓ (glucose) | ✓ (fbs threshold) | – |
| cholesterol | – | ✓ (chol) | – |
| serum_creatinine | – | – | ✓ (sc) |
| blood_urea | – | – | ✓ (bu) |
| hemoglobin | – | – | ✓ (hemo) |
| pregnancies | ✓ | – | – |
| hypertension | – | – | ✓ (htn) |
| symptoms / lifestyle | rules engine layer (not model features) | | |

Fields required by a model but absent from a request are imputed by the saved
preprocessing pipeline and reported via `features_imputed`.
