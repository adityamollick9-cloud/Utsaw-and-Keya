# How to Run the Wedding Project Locally

## 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster (already configured in `wedding-backend/.env`)

---

## 2. Running the Backend API

1. Navigate to the backend directory:
   ```bash
   cd wedding-backend
   ```
2. Start the backend server:
   ```bash
   npm start
   ```
   *(Or for auto-reload during development: `npm run dev`)*

3. The backend runs at:
   - Base URL: `http://localhost:5000`
   - Health check: `http://localhost:5000/api/health`

---

## 3. Running the Admin Dashboard

1. In a new terminal tab, navigate to the dashboard directory:
   ```bash
   cd wedding-dashboard
   ```
2. Start the Vite dev server:
   ```bash
   npm run dev
   ```

3. Open your browser at:
   - `http://localhost:5173`

4. Log in using your administrator credentials:
   - **Username:** `adityamollick9_db_user`
   - **Password:** `CyQknShhsYn79zuw`

---

## 4. Running the Guest-Facing Frontend

1. Open `frontend/index.html` in your browser (or use VS Code Live Server at port 5500).
2. `frontend/config.js` is already configured to point to `http://localhost:5000`.
3. Fill out the RSVP form and submit — your response and blessing will be stored live in MongoDB Atlas and immediately displayed in the Admin Dashboard!

---

## 5. Running Automated Tests

To run the complete test suite verifying database connectivity, validation, authentication, and E2E flows:
```bash
cd wedding-backend
npm test
npm run test:e2e
```

