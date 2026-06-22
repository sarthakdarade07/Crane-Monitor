# 🕵️‍♂️ Evidence & API Documentation

This document provides concrete evidence of the application's functionality, including exact HTTP requests, responses, and the threshold alerting mechanism.

---

## 🔑 Test Credentials
The database has been pre-seeded with the following two accounts for testing purposes:
- **Admin User:** Username: `admin` | Password: `admin123`
- **Staff User:** Username: `staff` | Password: `staff123`

---

## 1. API Endpoints: Requests & Responses

### A. Authentication Login (`POST /api/auth/login`)
**Description:** Authenticates a user and returns a JSON Web Token (JWT).

**cURL Request:**
```bash
curl -X POST https://crane-monitor-api.onrender.com/api/auth/login \
-H "Content-Type: application/json" \
-d '{"username": "admin", "password": "your_password"}'
```

**JSON Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwicm9sZS...",
  "role": "admin"
}
```

---

### B. Submit Sensor Reading (`POST /api/readings`)
**Description:** IoT hardware endpoint to submit new telemetry data. Requires JWT Authentication.

**cURL Request:**
```bash
curl -X POST https://crane-monitor-api.onrender.com/api/readings \
-H "Content-Type: application/json" \
-H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
-d '{
  "crane_id": "CR-101",
  "ts": "2026-06-22T12:00:00.000Z",
  "load_kg": 2500,
  "motor_temp_c": 75.5,
  "vibration_mm_s": 2.1,
  "status": "active"
}'
```

**JSON Response (201 Created):**
```json
{
  "id": 154,
  "crane_id": "CR-101",
  "ts": "2026-06-22T12:00:00.000Z",
  "load_kg": 2500,
  "motor_temp_c": 75.5,
  "vibration_mm_s": 2.1,
  "status": "active"
}
```

---

### C. Fetch Latest Readings (`GET /api/readings/latest`)
**Description:** Fetches the most recent telemetry state for all unique cranes to populate the dashboard on initial load.

**cURL Request:**
```bash
curl -X GET https://crane-monitor-api.onrender.com/api/readings/latest \
-H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

**JSON Response (200 OK):**
```json
[
  {
    "id": 154,
    "crane_id": "CR-101",
    "ts": "2026-06-22T12:00:00.000Z",
    "load_kg": 2500,
    "motor_temp_c": 75.5,
    "vibration_mm_s": 2.1,
    "status": "active"
  },
  {
    "id": 142,
    "crane_id": "CR-205",
    "ts": "2026-06-22T11:59:58.000Z",
    "load_kg": 1200,
    "motor_temp_c": 62.0,
    "vibration_mm_s": 1.4,
    "status": "active"
  }
]
```

---

## 2. Threshold Alerting Evidence

We implemented a safety threshold where an alert is triggered if a crane's `motor_temp_c` exceeds **80°C**.

### Triggering the Alert
To simulate an overheating crane, we send a `POST` request with a temperature of `85.5`:

**cURL Request:**
```bash
curl -X POST https://crane-monitor-api.onrender.com/api/readings \
-H "Content-Type: application/json" \
-H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
-d '{
  "crane_id": "CR-101",
  "ts": "2026-06-22T12:01:00.000Z",
  "load_kg": 3000,
  "motor_temp_c": 85.5,
  "vibration_mm_s": 3.2,
  "status": "active"
}'
```

### Logged Server Message
The exact moment the Node.js ingestion server receives this payload, it synchronously detects the violation and prints this strictly formatted log to the Render console:
```text
ALERT: CR-101 motor temp 85.5°C exceeds threshold
```

### Stored Database Alert Record
Simultaneously, the server commits the alert to the PostgreSQL `alerts` table. Querying the database returns the exact stored record:
```json
{
  "id": 42,
  "crane_id": "CR-101",
  "message": "CR-101 motor temp 85.5°C exceeds threshold",
  "created_at": "2026-06-22T12:01:00.050Z"
}
```
*(This record is also instantly broadcasted to the frontend via WebSockets to flash the UI red).*
