# AI Risk Assessment Module

**Product Design and Development — Mini Project Report Section**

**Project:** AI-Based Smart Healthcare Management System

**Component:** AI/ML health risk prediction and recommendation service

---

## 1. Introduction and Product Context

The AI-Based Smart Healthcare Management System is a full-stack product that helps
patients record health information, receive a preliminary health-risk assessment,
discover the right specialist, and book appointments. The **AI/ML module** is the
intelligent core of the product: a standalone Python (FastAPI) microservice that
accepts patient health data and reported symptoms, estimates the risk of three
chronic conditions, and recommends the tests and specialist categories that a
patient should consider.

The three conditions covered are:

- **Diabetes** (metabolic risk)
- **Heart disease** (cardiovascular risk)
- **Kidney disease** (renal risk)

For each condition the module produces a **risk level** of Low, Moderate, or High,
together with the most influential contributing factors. It then produces an
**overall health risk**, a list of **risk areas**, and a set of
**recommended tests** and **specialist categories**.

### Problem Being Addressed

In many settings, a patient who feels unwell does not know (a) whether their
symptoms are serious, (b) which tests are relevant, or (c) which specialist to
consult. The product addresses this gap by providing an accessible, immediate,
screening-level assessment that converts raw health data and symptoms into clear,
actionable guidance.

### Product Positioning and Safety

This is a **screening-level risk assessment, not a medical diagnosis**. The module
never claims to diagnose a condition; it estimates risk and guides the patient
toward appropriate professional care. Every API response carries an explicit
disclaimer, and the product is designed so that AI output *supports* — and never
*replaces* — a qualified healthcare professional.

---

## 2. User Needs to Requirements Mapping

A core product-design activity is tracing each user need to a concrete product
requirement and a design decision. The table below shows this traceability for
the AI module.

| User Need | Product / AI Requirement | Design Decision |
|---|---|---|
| "I don't know if my symptoms are serious." | Convert health data + symptoms into a clear Low/Moderate/High risk level. | Threshold banding with clinically tunable limits; symptoms can raise a risk band. |
| "I don't understand which disease I might be at risk of." | Estimate risk for three common chronic conditions independently. | One dedicated model per disease, each producing an interpretable probability. |
| "I don't know which tests I should get." | Recommend relevant medical tests. | Rule-based test mapping per disease and risk band (`rules.yaml`). |
| "I don't know which doctor to see." | Recommend a specialist category. | Band-to-specialist mapping (e.g., diabetes to Endocrinologist, heart to Cardiologist). |
| "I only know a few details about my health." | Work with incomplete data. | Every clinical value is optional; the pipeline imputes missing values and reports them. |
| "I want to understand what drove my result." | Provide transparent contributing factors. | Per-disease top contributing factors derived from model feature importance. |
| "I have symptoms that don't match a listed disease." | Still guide me somewhere useful. | Symptom-only routes (e.g., skin complaints to Dermatologist). |
| "I want to trust the tool." | Be transparent and reproducible. | Fixed random seed, documented datasets, explicit limitations and disclaimers. |

---

## 3. Design and Architecture of the AI Component

The module is deliberately split into an **offline training stage** and an
**online serving stage**. Training never runs in production; the live service only
loads previously saved model artifacts. This separation improves reliability,
reproducibility, and startup speed.

A second key design decision is the **three-layer pipeline** inside the service:
prediction, assessment, and recommendation are kept as independent layers, each
with a single responsibility.

```
+-----------------------------------------------------------------------+
|                          AI/ML MODULE                                 |
|                                                                       |
|  OFFLINE (training)                ONLINE (serving)                   |
|  ------------------                -------------------                |
|  src/preprocess.py                 app/main.py     (FastAPI entry)    |
|      -> cleaned splits                 |                              |
|  src/train.py                      app/predictor.py  (Layer 1)        |
|      -> model artifacts                |                              |
|                                        v                              |
|  config/rules.yaml                 app/assessment.py (Layer 2)        |
|      -> clinical tunables              |                              |
|                                        v                              |
|  artifacts/*.joblib                app/recommender.py (Layer 3)       |
|      -> trained models +               |                              |
|         fitted preprocessors           v                              |
|                                    JSON response                      |
+-----------------------------------------------------------------------+
```

### Component Responsibilities

| Component | Stage | Responsibility |
|---|---|---|
| `src/preprocess.py` | Offline | Load, clean, split datasets; build preprocessing pipelines. |
| `src/train.py` | Offline | Train candidate models, cross-validate, select and save the winner. |
| `config/rules.yaml` | Both | All clinical thresholds, weights, symptom mappings, tests, specialists. |
| `artifacts/` | Both | Saved model pipelines and metrics (`*.joblib`, `*_metrics.json`). |
| `app/main.py` | Online | FastAPI endpoints; loads models at startup. |
| `app/predictor.py` | Online (Layer 1) | Map patient input to model features; produce raw probabilities. |
| `app/assessment.py` | Online (Layer 2) | Apply symptom boosts, band risks, compute overall risk. |
| `app/recommender.py` | Online (Layer 3) | Recommend tests and specialist categories. |
| `app/schemas.py` | Online | Stable API contract (request/response schemas). |

---

## 4. Algorithms and Techniques

### 4.1 Machine-Learning Classifiers

Two candidate classifiers are trained for each disease inside the same
preprocessing pipeline:

| Algorithm | Configuration | Rationale |
|---|---|---|
| **Logistic Regression** | `max_iter=2000`, `class_weight="balanced"` | Interpretable linear baseline; coefficients are directly explainable. |
| **Random Forest** | `n_estimators=300`, `min_samples_leaf=2`, `class_weight="balanced"` | Captures non-linear relationships; provides feature-importance scores. |

`class_weight="balanced"` compensates for class imbalance (for example, the
kidney dataset is roughly 62% positive). For a screening tool this is the correct
trade-off: missing a true positive is more costly than producing a false alarm.

### 4.2 Preprocessing Algorithms

Preprocessing is split into two stages to prevent data leakage:

1. **Deterministic cleaning** (learns no statistics, so may run before the split):
   - Diabetes: sentinel zeros in `glucose`, `bp`, `skin_thickness`, `insulin`, and
     `bmi` are replaced with `NaN` because they actually encode missing values.
   - Heart: multi-class severity is collapsed to a binary target; missing markers
     (`?`) are handled; columns are read in the dataset's documented order.
   - Kidney: stray-tab labels, string-typed numeric columns, and an irrelevant
     row identifier are repaired.

2. **Statistical preprocessing** (fitted on the training split only):
   - Numeric features: **median imputation** followed by **standard scaling**
     (z-score). Scaling keeps logistic regression well-conditioned and is
     harmless for tree models.
   - Categorical features: **most-frequent imputation** followed by
     **one-hot encoding** that tolerates unseen categories.

### 4.3 Model Selection and Evaluation

- Each candidate is fitted on the **training split only**.
- **5-fold cross-validation** is run on the training split only, scored by ROC-AUC.
- The **test split is consumed once**, for final evaluation.
- **Selection rule:** maximise ROC-AUC, using recall as the tie-breaker.
- Reported metrics: **accuracy, precision, recall, F1, ROC-AUC, and the
  confusion matrix**.

### 4.4 Explainability

Each prediction is accompanied by the patient's **top contributing factors**.
Random Forest exposes `feature_importances_`; Logistic Regression contributes the
absolute value of its coefficients. One-hot encoded columns are folded back onto
their original source feature, so the factors are named in the same vocabulary
the patient sees. Only features the patient actually supplied are reported;
imputed values are not presented as drivers of a risk score.

### 4.5 Rules Layer (Non-Machine-Learning)

Not every decision is made by a learned model. A transparent, configurable rules
layer converts probabilities into user-facing guidance:

- **Symptom boosts:** reported symptoms are grouped into clinically coherent
  clusters (metabolic-diabetic, cardiac, renal, general-systemic). A matched
  cluster adds a bounded boost to the linked disease probability.
- **Threshold banding:** probabilities map to Low / Moderate / High using
  configurable band limits.
- **Weighted overall score:** a weighted sum of the three disease probabilities
  plus a symptom component.
- **Dominant-risk floor:** the overall risk *level* never falls below the highest
  single-disease band, so an acute risk cannot be diluted away by averaging.
- **Recommendation rules:** tests and specialist categories are mapped per disease
  and band, with symptom-only routes and a fallback.

All thresholds and mappings live in `config/rules.yaml`, so clinical logic can be
tuned without changing code.

---

## 5. End-to-End Workflow

### 5.1 Training Workflow

1. **Load and clean** each raw dataset (`src/preprocess.py`).
2. **Split** data into a stratified 80/20 train/test set (fixed seed `42`).
3. **Fit preprocessors** on the training split only; save them to `artifacts/`.
4. **Train both candidates** for each disease inside the pipeline.
5. **Cross-validate** (5-fold) on the training split.
6. **Evaluate once** on the held-out test set.
7. **Select the winner** by ROC-AUC (recall tie-break) and save the full pipeline
   plus a metrics report.

### 5.2 Inference Workflow

```
Patient submits health profile + symptoms
                |
                v
   POST /api/v1/assess  (FastAPI)
                |
                v
   LAYER 1  Predictor (app/predictor.py)
   - Map patient fields to each model's feature names
   - Compute BMI from height/weight when not supplied
   - Load the three saved pipelines and produce raw probabilities
   - Record which values were imputed; extract top contributing factors
                |
                v
   LAYER 2  Assessment (app/assessment.py)
   - Apply symptom boosts (additive and capped) BEFORE banding
   - Band each disease as Low / Moderate / High
   - Compute overall score = sum(weight x probability) + symptom component
   - Apply the dominant-risk floor to the overall level
                |
                v
   LAYER 3  Recommender (app/recommender.py)
   - Map each disease/band to tests and specialist categories
   - Add symptom-only routes (e.g., skin to Dermatologist)
   - Deduplicate and order by specialist priority
                |
                v
   JSON AssessmentResponse
```

### 5.3 API Contract

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness check used by the backend before calling. |
| POST | `/api/v1/assess` | Full risk assessment; returns risks, tests, specialists. |

The Spring Boot backend makes a single call per assessment and maps the returned
specialist categories to real doctors and available appointment slots.

---

## 6. Datasets

| Disease | Dataset | Notes |
|---|---|---|
| Diabetes | Pima Indians Diabetes (Kaggle/UCI) | Sentinel zeros encode missing values. |
| Heart disease | UCI Cleveland Heart Disease | Multi-class severity collapsed to binary. |
| Kidney disease | UCI Chronic Kidney Disease | Contains text/dtype quirks requiring cleaning. |

**Split policy:** stratified 80/20 split with a fixed random seed (`42`) and
shuffling, giving identical class ratios in the train and test sets and a fully
reproducible experiment.

---

## 7. Results and Evaluation

Held-out test-set performance of the selected model per disease:

| Disease | Selected Model | ROC-AUC | Recall |
|---|---|---|---|
| Diabetes | Random Forest | 0.8228 | 0.7222 |
| Heart Disease | Logistic Regression | 0.9665 | 0.9286 |
| Kidney Disease | Logistic Regression | 0.9807 | 1.0000 |

### Design Interpretation

- Heart and kidney models perform strongly (ROC-AUC 0.97-0.98), which is
  appropriate for a screening aid where a clear signal is available.
- Diabetes is the hardest problem (ROC-AUC 0.82), consistent with the Pima
  dataset where several informative clinical values are often absent and must be
  imputed.
- The selected algorithms differ by disease: the more interpretable Logistic
  Regression won for heart and kidney, while the non-linear Random Forest won for
  diabetes. This shows that model selection is data-driven rather than fixed.
- Recall was prioritised alongside ROC-AUC because, for screening, failing to
  flag a genuinely at-risk patient is the costlier error.

---

## 8. Safety, Limitations, and Ethics

- **Screening-only positioning.** Outputs are risk assessments, never diagnoses.
  Every response includes a disclaimer, and recommendations support rather than
  replace professional care.
- **Transparency of imputation.** Missing inputs are imputed inside the pipeline;
  the response reports exactly which fields were inferred (`features_imputed`).
- **Class-mix bias (kidney).** The chronic kidney disease dataset oversamples
  diseased patients, so a request with few clinical values may land near the
  balanced prior and band Moderate. This errs on the safe side for screening but
  must be disclosed.
- **Probability interpretation.** Logistic regression outputs can approach 0 or 1
  for extreme profiles; risk *levels* remain correct, but probabilities should not
  be read as calibrated percentages.
- **Lifestyle flags.** Fields such as smoker or family history feed the rules
  layer, not the current models, because the source datasets contain no matching
  columns. This is intentional and documented.

---

## 9. Product Outcomes and Future Scope

**Delivered in the current version:**

- Trained, leakage-safe models for three diseases with a documented selection rule.
- A configurable rules engine for banding, overall risk, tests, and specialists.
- A FastAPI service exposing `/health` and `/api/v1/assess`.
- A pytest suite covering model, pipeline, and API behaviour.
- Backend integration through a single HTTP call.

**Future scope:**

- Docker and cloud deployment for easy sharing and scaling.
- Additional diseases and additional input features.
- A symptom natural-language-processing (NLP) model to interpret free-text
  symptoms instead of a fixed vocabulary.
- Calibration analysis so probabilities can be trusted as percentages.
- A feedback loop using clinician-confirmed outcomes to periodically retrain and
  validate the models.

---

## 10. References

- Pima Indians Diabetes Dataset (UCI Machine Learning Repository / Kaggle).
- UCI Cleveland Heart Disease Dataset.
- UCI Chronic Kidney Disease Dataset (OpenML mirror of UCI ID 336).
- Scikit-learn: Logistic Regression, Random Forest, pipelines, and model
  evaluation utilities.
- FastAPI and Pydantic for the service layer and request/response validation.
