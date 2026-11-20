# How to Run the Wedding Project Locally

This project consists of 3 independent applications that work together:
1. **Backend API** (Node.js + Express + MongoDB Atlas)
2. **Admin Dashboard** (React + Vite + Tailwind CSS)
3. **Guest-Facing Wedding Website** (Static HTML/CSS/JS)

---

## 1. Prerequisites
- **Node.js** (v18 or higher)
- **Terminal** (macOS zsh/bash)
- MongoDB Atlas connection string is already configured in `wedding-backend/.env`.

---

## 2. Start the Applications (3 Terminal Tabs)

### Terminal 1: Start the Backend API (Port 5001)
```bash
cd wedding-backend
npm start
```
> **Note:** The backend runs on port `5001` (to prevent conflicts with macOS AirPlay on port 5000).  
> **Health Check:** Open [http://localhost:5001/api/health](http://localhost:5001/api/health) to verify `status: ok` and `database: connected`.

---

### Terminal 2: Start the Admin Dashboard (Port 5173)
```bash
cd wedding-dashboard
npm run dev
```
> **Access Dashboard:** Open [http://localhost:5173](http://localhost:5173) in your browser.  
> **Admin Login Credentials:**
> - **Primary Admin:**
>   - Username: `adityamollick9_db_user`
>   - Password: `CyQknShhsYn79zuw`
> - **Second Admin:**
>   - Username: `TamalikaKeya`
>   - Password: `Tamalika12345`

---

### Terminal 3: Start the Guest Wedding Frontend (Port 5500)
```bash
python3 -m http.server 5500 --directory frontend
```
*(Or right-click `frontend/index.html` in VS Code and select **"Open with Live Server"**)*

> **Guest Invitation Website:** Open [http://localhost:5500](http://localhost:5500) in your browser.

---

## 3. End-to-End Verification
1. Open the **Guest Frontend** at [http://localhost:5500](http://localhost:5500).
2. Scroll to the **RSVP & Blessings** section, fill in your details, select attendance and ceremonies, write a blessing, and click **"Send with Blessings"**.
3. Open the **Admin Dashboard** at [http://localhost:5173](http://localhost:5173), sign in, and verify:
   - Real-time **Overview** statistics increment immediately.
   - The submission appears in the **RSVP Records** table.
   - The blessing appears in the private **Guest Blessings** tab.

---

## 4. Run Automated Test Suites
To verify all database connections, validations, authentication, and security:
```bash
cd wedding-backend
npm test                  # 12 unit & integration tests
npm run test:e2e          # 9 end-to-end full flow tests
npm run test:admin        # 5 multi-admin login & permission tests
npm run test:resilience   # 4 edge case & search injection tests
```
