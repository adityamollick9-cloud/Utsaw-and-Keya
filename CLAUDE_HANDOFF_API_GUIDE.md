# Handoff Documentation for Claude: Guest-Facing Frontend Integration

## Overview
Antigravity has built and tested the Express.js + Mongoose backend connected to MongoDB Atlas (`Wedding_Blessings` database) and a separate React admin dashboard.

The guest frontend remains in Claude. This guide provides all endpoint specifications, request/response formats, and configuration needed to connect the existing guest-facing forms.

---

## 1. Backend API Base URLs

- **Local Development:** `http://localhost:5000`
- **Frontend Configuration:** Configured in [`frontend/config.js`](file:///Users/adityamallickshiba/Documents/ACADEMIC/CODING/WEDS/frontend/config.js):
  ```javascript
  window.RSVP_API_BASE = 'http://localhost:5000';
  ```

---

## 2. Public Endpoints

### 2.1 RSVP & Blessing Submission
- **URL:** `POST /api/rsvp`
- **Content-Type:** `application/json`

#### Request Payload:
```json
{
  "submissionId": "optional-uuid-string",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+8801700000000",
  "attending": "yes",
  "events": [
    "haldi-ceremony",
    "haldi-night-dinner",
    "holy-matrimony",
    "wedding-dinner",
    "farewell"
  ],
  "blessing": "Wishing you both endless joy and God's blessings!"
}
```

#### Field Specifications:
| Field | Type | Required | Description |
|---|---|---|---|
| `submissionId` | String | Optional | Unique ID per form session (UUID or timestamp hash). Used to prevent duplicate submissions on double-clicks or retries. |
| `firstName` | String | **Yes** | Guest first name (1-100 characters). |
| `lastName` | String | Optional | Guest last name (up to 100 characters). |
| `email` | String | Optional | Valid email format if provided. |
| `phone` | String | Optional | Contact phone number (up to 30 characters). |
| `attending` | String | **Yes** | Attendance selection: `"yes"` or `"no"`. |
| `events` | Array[String] | Optional | Selected event codes. Valid values: `'haldi-ceremony'`, `'haldi-night-dinner'`, `'holy-matrimony'`, `'wedding-dinner'`, `'farewell'`. (Ignored if `attending` is `"no"`). |
| `blessing` | String | Optional | Heartfelt blessing message (up to 500 characters). When provided, it is securely archived in the private blessings collection in MongoDB Atlas. |

#### Successful Response (HTTP 201 or 200):
```json
{
  "ok": true,
  "success": true,
  "message": "Submission received successfully.",
  "data": {
    "id": "673f...",
    "firstName": "John",
    "attending": "yes"
  }
}
```
*Note: Both `ok: true` and `success: true` are returned to maintain 100% compatibility with the frontend's check `res.ok && body && body.ok === true`.*

#### Validation Error Response (HTTP 400):
```json
{
  "ok": false,
  "success": false,
  "message": "Please check the submitted information.",
  "fields": {
    "firstName": "First name is required.",
    "attending": "Please let us know if you are attending (\"yes\" or \"no\").",
    "email": "Please provide a valid email address.",
    "blessing": "Blessing cannot exceed 500 characters."
  }
}
```

---

### 2.2 Standalone Blessing Submission
- **URL:** `POST /api/blessings`
- **Content-Type:** `application/json`

#### Request Payload:
```json
{
  "guestName": "Sarah Connor",
  "message": "May your home be filled with laughter and love!"
}
```
*(Also accepts `{ firstName, lastName, blessing }`)*

#### Successful Response (HTTP 201):
```json
{
  "ok": true,
  "success": true,
  "message": "Blessing received with heartfelt thanks.",
  "data": {
    "id": "673f...",
    "guestName": "Sarah Connor"
  }
}
```

---

## 3. CORS Configuration

The backend CORS middleware is pre-configured to allow:
- `http://localhost:5500` / `http://127.0.0.1:5500` (VS Code Live Server)
- `http://localhost:8080` / `http://127.0.0.1:8080` (HTTP Server)
- `http://localhost:3000` / `http://127.0.0.1:3000`
- `http://localhost:5173` / `http://127.0.0.1:5173` (Admin Dashboard)
- Additional production origins can be specified via `FRONTEND_ORIGIN` in `.env`.

---

## 4. Privacy & Security Note

- Blessings and RSVP records are strictly private and cannot be fetched via any public endpoints.
- All retrieval endpoints (`/api/admin/rsvps`, `/api/admin/blessings`, `/api/admin/statistics`) require a valid administrator JWT token.

