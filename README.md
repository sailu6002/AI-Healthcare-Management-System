# AI-Based Smart Healthcare Management System

A local, full-stack healthcare demo: a React front end, a Spring Boot API,
a MySQL database, and a FastAPI machine-learning service that produces
screening-level disease-risk assessments and specialist recommendations.

> **Scope:** This project runs locally. It is **not** cloud-deployed.
> AI output is screening-level risk information, **not** a medical diagnosis.

## Architecture

```
frontend/  React 19 + Vite (SPA, dev server :5173)
    |  /api/* proxied to backend (vite.config.js)
    v
backend/   Spring Boot 4 (Java 17, REST API, JWT auth, :8080)
    |            \
    |             \  HTTP -> ai-model/  FastAPI (scikit-learn, :8000)
    v
MySQL 8 (database healthcare_db, InnoDB)
```

- **frontend** — login/registration, patient dashboard, profile, doctor
  discovery, AI assistant, appointment booking and history.
- **backend** — REST API, JWT authentication/authorization, patient profiles,
  doctor schedules and availability, appointment booking with race-safe slot
  handling, and a proxy client for the AI service.
- **ai-model** — offline-trained scikit-learn models served over HTTP; the
  backend calls `POST /api/v1/assess` and `GET /health`.
- **database** — MySQL schema; schema changes are applied with explicit SQL
  migrations under `database/migrations/`.

## Prerequisites

- Java 17, Node.js 18+ (npm), Python 3.10+
- MySQL 8 (the reference setup uses a Docker container named
  `healthcare-mysql` exposing port 3306)

## 1. Database setup and migrations

Create the database and apply the migrations **once** before the first backend
start:

```bash
# start MySQL (example container)
docker run --name healthcare-mysql -e MYSQL_ROOT_PASSWORD=<password> \
  -p 3306:3306 -d mysql:8.4
docker exec -it healthcare-mysql mysql -uroot -p -e \
  "CREATE DATABASE IF NOT EXISTS healthcare_db CHARACTER SET utf8mb4"

# back up first, then apply the Phase 4.2 migration
docker exec healthcare-mysql mysqldump -uroot -p healthcare_db > backup.sql
docker exec -i healthcare-mysql mysql -uroot -p healthcare_db \
  < database/migrations/phase4_2_appointment_safety.sql
```

The Phase 4.2 migration:

- links `patients.user_id` to `users.user_id` (nullable, unique, FK),
- creates `doctor_schedules` and `doctor_time_off`,
- converts `appointments.appointment_date` / `appointment_time` to real SQL
  `DATE` / `TIME` and normalizes `status`,
- adds the generated column `active_slot_key` plus `uq_active_slot` so at most
  one **active** (`BOOKED`) appointment can occupy a given doctor/date/time.

A matching rollback script is
`database/migrations/phase4_2_appointment_safety_rollback.sql`.

> The backend runs Hibernate with `spring.jpa.hibernate.ddl-auto=validate`.
> Hibernate never creates or alters tables; the SQL migrations are the source
> of truth. If you point the backend at a schema that has not been migrated,
> startup fails with a schema-validation error.

## 2. AI service (`ai-model/`)

```bash
cd ai-model
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/health
- Tests: `pytest tests/ -q`

See `ai-model/README.md` for the model details and API contract.

## 3. Backend (`backend/`)

Configure the datasource and secrets, then run:

```bash
cd backend
./mvnw spring-boot:run        # http://localhost:8080
./mvnw test                   # test suite (requires the migrated database)
```

Relevant settings in `backend/src/main/resources/application.properties`:

| Property | Purpose |
|---|---|
| `spring.datasource.url` / `username` / `password` | MySQL connection |
| `jwt.secret` | HMAC signing key for JWTs (base64) |
| `ai.service.base-url` | FastAPI base URL (default `http://127.0.0.1:8000`) |
| `clinic.timezone` | Timezone used for "now"/past-slot checks (default `Asia/Kolkata`) |

**Secrets:** the local properties file contains development credentials. For
any shared or non-local run, inject secrets via environment variables (Spring
relaxed binding, e.g. `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`) or a secret
manager, and rotate any value that has been committed.

## 4. Frontend (`frontend/`)

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173 (proxies /api to :8080)
npm run lint
npm run build      # production build to dist/
```

Optional environment variable (see `frontend/.env.example`):

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Absolute backend base URL for a build served from a different origin. Leave empty for local dev (Vite proxy is used). |

## Using the application

1. **Register / log in.** Public registration always creates a `PATIENT`
   account; a client-supplied `role` is ignored. Login returns a JWT used for
   all authenticated calls.
2. **Create your patient profile** (Profile page, or `POST /api/patients/me`).
   Booking and appointment history require a profile; without one the API
   responds `409 profile_required`.
3. **AI assessment** (Assistant page) — enter health data and optional
   symptoms; the backend forwards them to the AI service and shows risk levels
   and recommended specialist categories, with matching doctors from the
   register.
4. **Doctor availability and booking** (Appointments page) — pick a doctor and
   date; the server returns only real, bookable slots (from the doctor's
   schedule minus time off and existing bookings, excluding past times). Book a
   slot, view your history, and cancel. A slot taken by a concurrent request
   returns `409 slot_conflict`.
5. **Admin schedule configuration** — an `ADMIN` account manages availability
   under `/api/admin/doctors/{doctorId}`:
   - `GET/POST /schedule`, `DELETE /schedule/{scheduleId}`
   - `GET/POST /time-off`, `DELETE /time-off/{timeOffId}`

   There is no separate admin UI in this demo; use the API (e.g. via curl) with
   an admin JWT. Doctor hours and schedules are **not** seeded — a doctor with
   no configured schedule returns no slots.

## API summary (backend)

| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | public |
| GET | `/api/ai/health`, `/api/ai/assess` | authenticated |
| GET | `/api/doctors`, `/api/doctors/{id}` | authenticated |
| GET | `/api/doctors/{doctorId}/availability?date=YYYY-MM-DD` | authenticated |
| GET/POST/PUT | `/api/patients/me` | patient (own) |
| POST | `/api/appointments` | patient |
| GET | `/api/appointments/mine` | patient |
| POST | `/api/appointments/{id}/cancel` | owner patient or admin |
| GET/PUT/DELETE | `/api/appointments/**` | admin |
| `/api/admin/doctors/{id}/...` | schedule/time-off | admin |

Errors use a consistent JSON body: `{timestamp, status, error, message, code?}`
with stable `code` values such as `profile_required`, `slot_conflict`,
`invalid_slot`, `forbidden`, `unauthorized`.

## Tests

| Suite | Command | Notes |
|---|---|---|
| Backend | `cd backend && ./mvnw test` | unit + HTTP security + concurrency tests; needs the migrated MySQL |
| AI | `cd ai-model && pytest tests/ -q` | model/pipeline + API tests |
| Frontend lint | `cd frontend && npm run lint` | ESLint |
| Frontend build | `cd frontend && npm run build` | Vite production build |

## Repository layout

```
backend/     Spring Boot API
frontend/    React + Vite SPA
ai-model/    FastAPI ML service
database/    migrations (SQL)
documentation/ supporting docs
```
