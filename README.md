# Wedding Website — Backend & Admin Dashboard

## Project Overview

This project has three separate parts, with a clear division of responsibility:

1. **Wedding frontend — Claude:** The existing guest-facing wedding invitation website will continue to be developed and maintained in Claude.
2. **Backend and database integration — Antigravity:** Antigravity will build and maintain the backend API and connect it to MongoDB Atlas.
3. **Admin dashboard — Antigravity:** Antigravity will build a separate, private dashboard website that retrieves and displays records through the backend API.

The wedding frontend and admin dashboard are separate websites. They communicate with the same backend API, which is the only application allowed to communicate directly with MongoDB Atlas.

> **Scope boundary:** Do not rebuild or redesign the guest-facing frontend in Antigravity. The frontend remains in Claude. Antigravity is responsible for the backend, database integration, and separate dashboard.

---

## 1. Project Goals

- Connect the existing wedding frontend (maintained in Claude) to MongoDB Atlas through a backend API.
- Store guest RSVP submissions and blessings.
- Build a separate admin dashboard for viewing the stored information.
- Keep guest-submitted blessings private and accessible only to authorized administrators.
- Make new submissions available in the dashboard automatically after they are saved.
- Keep the code secure, maintainable, and easy to deploy.

## 2. Responsibilities and Handoff

### Claude — Guest-facing frontend

Claude is responsible for:
- Maintaining the existing wedding invitation website and its design.
- Maintaining the RSVP and blessings forms and their user experience.
- Connecting those forms to the backend endpoints documented by Antigravity.
- Displaying appropriate success, validation, and error messages to guests.

### Antigravity — Backend, database, and dashboard

Antigravity is responsible for:
- Inspecting the frontend files and identifying the actual form fields and submission behaviour.
- Creating the backend API and connecting it to MongoDB Atlas.
- Documenting the API contract so it can be implemented by Claude.
- Testing that submissions reach MongoDB Atlas.
- Building the separate administrator dashboard.
- Protecting private data and administrative endpoints.

### Integration rule

Before changing the frontend integration, Antigravity must provide a clear API contract containing:
- Endpoint URLs and HTTP methods.
- Required and optional request fields.
- Example JSON request and response bodies.
- Validation rules and possible error responses.
- CORS origins required for local development and production.

Share this API contract with Claude so the frontend can call the correct endpoints. Do not assume field names or invent form fields; inspect the real frontend first.

---

## 3. Recommended Technology Stack

| Area | Technology |
|---|---|
| Backend runtime | Node.js |
| Backend framework | Express.js |
| MongoDB integration | Mongoose |
| Database | MongoDB Atlas |
| API style | REST with JSON |
| Dashboard | React |
| Dashboard styling | Tailwind CSS (or a consistent existing dashboard design system) |
| Charts | Recharts, if useful |
| HTTP client | Fetch or Axios |
| Password hashing | bcrypt |
| Authentication | Secure server-side session or appropriately implemented JWT |

Use JavaScript or TypeScript consistently within each application. Do not add unnecessary dependencies.

---

## 4. Architecture

```text
Guest
  |
  v
Wedding invitation frontend
(Maintained in Claude)
  |
  | HTTPS requests to public API
  v
Backend API
(Node.js + Express, maintained in Antigravity)
  |
  v
MongoDB Atlas
(Wedding_Blessings database)

Administrator
  |
  v
Separate admin dashboard
(React, maintained in Antigravity)
  |
  | Authenticated requests
  v
Backend API
  |
  v
MongoDB Atlas
```

Neither frontend may connect directly to MongoDB Atlas. The MongoDB connection string must remain on the backend.

---

## 5. MongoDB Atlas Database

Use the existing MongoDB Atlas cluster and the database named:

`Wedding_Blessings`

First inspect the existing Atlas setup and any existing collections. Do not delete, overwrite, or recreate existing data unnecessarily.

### Suggested collections

#### `rsvps`

Store RSVP form submissions. Finalize the schema only after inspecting the actual frontend form.

Potential fields, only where collected by the existing form:
- `guestName`
- `email`
- `phone`
- `attendance`
- `events`
- `guestCount`
- `additionalMessage`
- `createdAt`
- `updatedAt`

#### `blessings`

Store messages submitted through the blessings form.

Potential fields:
- `guestName`
- `message`
- `createdAt`

#### `admins`

Store administrator account information, if administrator accounts are stored in MongoDB.

Potential fields:
- `username`
- `passwordHash`
- `createdAt`

Never store plain-text passwords.

### Data modelling rules

- Match the actual form fields and their meaning.
- Do not make optional frontend fields mandatory in the backend.
- Validate and normalize submitted data.
- Add timestamps.
- Use indexes where they help common searches or lookups.
- Avoid creating duplicate records from accidental repeat submissions where an appropriate, reliable rule can be established.
- Do not silently discard valid fields submitted by the frontend.
- Do not expose private records through public endpoints.

---

## 6. Backend API

Create a separate backend application, for example in `wedding-backend/`.

### Suggested public endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/rsvp` | Submit an RSVP |
| `POST` | `/api/blessings` | Submit a blessing |

### Suggested protected administrator endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/admin/login` | Authenticate administrator |
| `POST` | `/api/admin/logout` | End administrator session, if using sessions |
| `GET` | `/api/admin/rsvps` | Retrieve paginated RSVP records |
| `GET` | `/api/admin/rsvps/:id` | Retrieve one RSVP |
| `GET` | `/api/admin/blessings` | Retrieve paginated blessings |
| `GET` | `/api/admin/statistics` | Retrieve dashboard summary data |
| `DELETE` | `/api/admin/rsvps/:id` | Delete an RSVP, if this feature is enabled |
| `DELETE` | `/api/admin/blessings/:id` | Delete a blessing, if this feature is enabled |

Only implement update or delete operations when they are genuinely needed. Destructive actions must be authenticated, authorized, validated, and confirmed in the dashboard.

### API standards

- Return consistent JSON responses.
- Use appropriate HTTP status codes.
- Validate all request bodies and route parameters.
- Handle database and server errors safely.
- Do not return stack traces, secrets, or internal database details to clients.
- Add pagination and sensible limits to list endpoints.
- Add rate limiting and spam protection to public submission endpoints.
- Configure CORS for the exact frontend and dashboard origins.
- Keep administrator routes protected by authentication and authorization.

### Example response format

Success:

```json
{
  "success": true,
  "message": "Submission received successfully."
}
```

Error:

```json
{
  "success": false,
  "message": "Please check the submitted information."
}
```

Adapt messages and response fields to the implemented API, then document them for Claude.

---

## 7. Environment Variables and Secrets

Keep secrets in the backend environment. Never place the MongoDB URI, database password, JWT secret, or administrator password in browser-side code or files served to the public.

Example backend `.env.example`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://adityamollick9_db_user:CyQknShhsYn79zuw@cluster0.fdiflju.mongodb.net/?appName=Cluster0
ADMIN_USERNAME=adityamollick9_db_user
ADMIN_PASSWORD=CyQknShhsYn79zuw
FRONTEND_ORIGIN=http://localhost:YOUR_FRONTEND_PORT
DASHBOARD_ORIGIN=http://localhost:YOUR_DASHBOARD_PORT
```

This is a template only. Choose the actual authentication configuration based on the implementation. If using a session-based system, use secure, HTTP-only cookies and configure cookie settings correctly for production. If using JWT, use short-lived tokens and a secure storage strategy; do not casually store sensitive tokens in local storage.

Requirements:
- Create a real `.env` locally; do not commit it.
- Commit `.env.example` with placeholders only.
- Add `.env` and other secret files to `.gitignore`.
- Use a dedicated MongoDB database user with the minimum permissions required.
- Restrict Atlas network access appropriately.
- Use HTTPS in production.
- Rotate any database credentials that have previously been exposed.

Do not ask the user to paste secrets into source files or commit them to Git.

---

## 8. Admin Dashboard Requirements

Build the dashboard as a separate React application, for example in `wedding-dashboard/`. It must not be embedded into or added as an admin section of the guest-facing wedding website.

### 8.1 Login

- Provide an administrator login page.
- Authenticate through the backend.
- Protect all dashboard pages and API requests.
- Provide logout.
- Show useful authentication errors.
- Do not expose administrator credentials in frontend source code.

### 8.2 Overview

Display live summary cards based on actual database records:
- Total RSVP submissions.
- Number of attending responses.
- Number of not-attending responses.
- Total attendee count, only if the form collects guest counts.
- Total blessings received.

Clearly distinguish RSVP submissions from the number of individual attendees.

### 8.3 RSVP records

Provide a table with the fields that actually exist in the database, such as:
- Guest name.
- Email and phone, if collected.
- Attendance response.
- Selected events, if collected.
- Guest count, if collected.
- Submission date.

Useful features:
- Search by guest name.
- Filter by attendance.
- Filter by event, if applicable.
- Sort by submission date.
- Pagination.
- View complete record details.
- Export records to CSV.

### 8.4 Blessings

Provide a private page showing:
- Guest name.
- Full blessing message.
- Submission date.

Useful features:
- Search by guest name or message.
- Sort by latest submission.
- Pagination.
- Read long messages comfortably.

Blessings must only be accessible to authenticated administrators. Do not create a public endpoint that returns the full blessings collection.

### 8.5 Charts and analytics

Use charts only where they communicate useful information. Possible charts:
- Attending versus not attending.
- RSVP submissions over time.
- Event participation, if event selections exist.
- Blessings received over time.

All cards, tables, and charts must use live API data. Do not leave mock or hardcoded sample data in the finished application.

### 8.6 Interface quality

Create a clean, professional, responsive administration interface with:
- Sidebar navigation.
- Clear page titles.
- Consistent spacing and typography.
- Responsive tables or mobile-friendly record layouts.
- Loading states.
- Empty states.
- Error states.
- Confirmation before destructive actions.

The dashboard should look like a private administration tool. It does not need to copy the visual design of the wedding invitation website.

---

## 9. Suggested Project Structure

Keep the applications separate. Adapt the structure to the existing repository rather than moving or renaming existing frontend files without permission.

```text
Wedding-Project/
|
|-- README.md
|
|-- wedding-frontend/
|   |-- (existing frontend, maintained in Claude)
|
|-- wedding-backend/
|   |-- src/
|   |   |-- config/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- services/
|   |   `-- app.js
|   |-- .env.example
|   |-- .gitignore
|   |-- server.js
|   `-- package.json
|
`-- wedding-dashboard/
    |-- src/
    |   |-- components/
    |   |-- pages/
    |   |-- layouts/
    |   |-- services/
    |   |-- hooks/
    |   `-- App.jsx
    |-- .env.example
    |-- .gitignore
    `-- package.json
```

The actual frontend folder name may differ. Inspect the repository before assuming it is named `wedding-frontend`.

---

## 10. Implementation Workflow for Antigravity

Work in the following phases. Do not attempt to build everything at once.

### Phase 1 — Inspect and plan

1. Inspect the repository and identify the existing wedding frontend location.
2. Read its RSVP and blessings form markup and JavaScript.
3. Record the exact fields, input names, validation rules, and current submission behaviour.
4. Check whether MongoDB collections or records already exist, without modifying or deleting them.
5. Propose the database schemas and API contract.
6. Identify any missing configuration and ask the user only for what is essential.

**Deliverable:** A short implementation plan, proposed schemas, and API contract for Claude.

### Phase 2 — Build the backend

1. Create the backend application.
2. Configure the MongoDB Atlas connection using environment variables.
3. Implement the data models.
4. Implement public RSVP and blessings submission endpoints.
5. Implement validation, error handling, rate limiting, and CORS.
6. Implement administrator authentication and protected routes.
7. Implement protected list and statistics endpoints.
8. Add basic automated tests.

**Deliverable:** A working backend API and documented local run instructions.

### Phase 3 — Verify database storage

1. Run the backend locally.
2. Submit representative test requests.
3. Verify that records are saved in the correct Atlas database and collections.
4. Verify timestamps and field values.
5. Test invalid submissions and error handling.
6. Confirm that public requests cannot retrieve private blessings or RSVP records.

**Deliverable:** Verified database storage and working API endpoints.

### Phase 4 — Handoff to Claude

Provide Claude with:
- The API base URL for local development.
- The public RSVP endpoint and exact request body.
- The public blessings endpoint and exact request body.
- Success and error response formats.
- Any required CORS configuration.
- The production API base URL when deployed.

Claude will then connect the existing frontend forms to these endpoints while preserving the current design and functionality.

Do not modify the frontend yourself unless the user explicitly asks you to do so.

### Phase 5 — Build the dashboard

1. Create the independent React dashboard.
2. Implement administrator login.
3. Implement protected routes.
4. Build the overview cards.
5. Build the RSVP records page.
6. Build the private blessings page.
7. Add search, filters, pagination, and CSV export.
8. Add charts based on actual API data.
9. Test session handling, logout, and unauthorized access.
10. Verify mobile and desktop layouts.

**Deliverable:** A separate, functional dashboard connected to the same backend and database.

### Phase 6 — End-to-end testing

Test this complete flow:

1. A guest opens the wedding website.
2. The guest submits an RSVP.
3. The frontend sends the submission to the backend.
4. The backend validates and stores it in MongoDB Atlas.
5. The guest submits a blessing.
6. The backend stores the blessing in MongoDB Atlas.
7. The administrator logs into the separate dashboard.
8. The dashboard retrieves the newly stored records.
9. The overview statistics reflect the real data.

Also test invalid input, duplicate submissions, network errors, pagination, CSV export, logout, and attempts to access protected endpoints without authentication.

---

## 11. Deployment

The applications may be deployed independently:

| Component | Suggested hosting |
|---|---|
| Wedding frontend | Its existing hosting provider |
| Backend API | Render or another Node.js-compatible host |
| Admin dashboard | Vercel or another static/frontend host |
| Database | MongoDB Atlas |

Configure production environment variables separately. Set CORS to the exact production frontend and dashboard origins. Use HTTPS throughout.

Do not deploy the dashboard as publicly accessible data pages. Its data must remain protected by backend authentication.

---

## 12. Completion Checklist

### Backend and database
- [ ] Backend starts successfully.
- [ ] MongoDB Atlas connection succeeds.
- [ ] Correct `Wedding_Blessings` database is used.
- [ ] RSVP submissions are stored.
- [ ] Blessings are stored.
- [ ] Input validation works.
- [ ] Errors are handled safely.
- [ ] Secrets are not exposed.

### Frontend integration handoff
- [ ] Actual frontend fields have been inspected.
- [ ] API contract has been documented.
- [ ] API instructions have been provided to Claude.
- [ ] Claude can connect the forms without redesigning the site.

### Dashboard
- [ ] Administrator login works.
- [ ] Protected routes work.
- [ ] Live RSVP records appear.
- [ ] Private blessings appear only after authentication.
- [ ] Statistics use real database records.
- [ ] Search and filters work.
- [ ] CSV export works.
- [ ] Logout works.
- [ ] Responsive layout works.

### End-to-end
- [ ] A guest RSVP appears in Atlas.
- [ ] A guest blessing appears in Atlas.
- [ ] Both records appear in the dashboard.
- [ ] Unauthorized users cannot retrieve private records.

---

## 13. Final Instructions to Antigravity

Before writing code, inspect the repository and read this README completely.

**Your responsibility is ONLY the backend, MongoDB Atlas integration, API documentation, and the separate admin dashboard. The guest-facing wedding frontend will continue to be developed in Claude.**

Do not rebuild, redesign, or unnecessarily modify the wedding frontend.

Do not assume the form fields. Inspect the actual frontend and build schemas and endpoints to match it.

Do not invent a MongoDB connection string or claim to have connected to Atlas without testing it. Ask for missing configuration securely. Never print credentials in logs or commit them to the repository.

Do not use dummy data as the final source for dashboard cards, tables, or charts. Use actual records retrieved through the backend.

Work phase by phase, test each phase, document the API contract, and report what has been completed and what still requires the Claude frontend integration.

**Final objective:** A guest-facing wedding website maintained in Claude, a backend and MongoDB Atlas integration maintained in Antigravity, and a completely separate, authenticated admin dashboard also maintained in Antigravity — all working together through one backend API and one MongoDB Atlas database.
