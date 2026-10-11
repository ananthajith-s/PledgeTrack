# PledgeTrack

**PledgeTrack** is a full-stack MERN application designed for institutional and charitable pledge and installment payment tracking. Built with strict role-based access control (Admin & Donor), real-time MongoDB aggregation pipelines, and robust race-condition protection, PledgeTrack manages pledges and records installment payments entirely in Indian Rupee (**INR - ₹**).

---

## Features

### Role-Based Portals & Access Control
- **Unified Authentication**: Single login interface that decodes user roles from JWT and dynamically routes users to their respective dashboards.
- **Donor Portal**:
  - Public registration strictly enforces the `donor` role (server-side protection against role tampering).
  - Donors can create pledges with purpose and target amount in INR (`pending` status).
  - Donors can only view and track progress for their own pledges with interactive progress bars.
  - Itemized installment history access restricted strictly to the pledge owner.
- **Admin Portal**:
  - Provisioned exclusively via a secure server seed script.
  - Real-time **Dashboard KPI cards** aggregating total pledged, total collected, total pending, and status breakdowns.
  - Comprehensive pledge database with instant status filtering (`all`, `pending`, `partial`, `fulfilled`).
  - Modal-based installment payment recorder with live balance calculations and audit notes.

### Core Payment Logic & Concurrency Protection
- **Status State Machine**:
  - `pending`: ₹0 paid so far.
  - `partial`: Greater than ₹0 but less than the total pledged amount.
  - `fulfilled`: Total paid equals the pledged amount (further payments automatically blocked).
- **MongoDB Aggregation as Source of Truth**: The system calculates running balances directly from the `payments` collection rather than incrementing static counters, eliminating balance drift.
- **Race Condition Guard (Post-Insert Verification & Rollback)**: Works reliably on standalone MongoDB setups. If concurrent transactions cause the total sum to exceed the pledge balance, the server automatically rolls back the inserted payment (`findByIdAndDelete`) and rejects the request.
- **Edge-Case Safeguards**:
  - Overpayment attempts rejected with clear INR error messages.
  - Payments on already fulfilled pledges are blocked.
  - UI button disabling and state locking to prevent double-click duplicate submissions.
  - Itemized ledger endpoint (`GET /api/payments/pledge/:pledgeId`) tracking payment method, transaction reference, date, and admin name.

---

## Technologies Used

- **Frontend**:
  - **React 18** with **Vite**
  - **React Router 6** for protected, role-based client-side routing
  - **Axios** with global request/response interceptors for JWT injection and auto-logout
  - **Custom Vanilla CSS** design system with dark mode aesthetics, glassmorphism, and responsive layouts
- **Backend**:
  - **Node.js** & **Express.js** RESTful API architecture
  - **MongoDB** with **Mongoose ODM**
  - **JSON Web Tokens (JWT)** for stateless session management
  - **bcryptjs** with cryptographic salting (cost factor 10) for irreversible password hashing
  - **express-validator** for schema and payload sanitization
- **Currency & Formatting**:
  - Indian Numbering System (`en-IN` / `₹`) via native `Intl.NumberFormat`

---

## Project Structure

```text
PledgeTrack/
├── client/                     # Frontend React + Vite application
│   ├── src/
│   │   ├── api/                # Axios configuration and interceptors
│   │   ├── components/         # Modals, Navbar, ProtectedRoute
│   │   ├── context/            # AuthContext (token & session management)
│   │   ├── pages/              # Login, Register, Dashboard, Pledges, PledgeForm
│   │   ├── utils/              # formatCurrency.js (INR formatter)
│   │   ├── App.jsx             # Route definitions & guards
│   │   ├── App.css & index.css # Design system tokens & stylesheet
│   │   └── main.tsx            # Vite root entry
│   └── package.json
├── server/                     # Backend Express server
│   ├── src/
│   │   ├── controllers/        # auth, pledge, payment, dashboard controllers
│   │   ├── middleware/         # auth (JWT), roleCheck (RBAC), errorHandler
│   │   ├── models/             # User, Pledge, Payment schemas
│   │   ├── routes/             # API routes
│   │   └── scripts/            # seedAdmin.js (Admin provisioner)
│   ├── server.js               # Database connection & server entry
│   └── package.json
├── .env.example                # Sample environment configuration
└── README.md
```

---

## Setup & Installation

### Prerequisites
- **Node.js** (v18+)
- **MongoDB** (running locally on port 27017 or a MongoDB Atlas URI)

### 1. Clone the Repository
```bash
git clone https://github.com/ananthajith-s/PledgeTrack.git
cd PledgeTrack
```

### 2. Install Dependencies
Install dependencies for both server and client:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
cd ..
```

### 3. Configure Environment Variables
Create a `.env` file in the `server/` directory:
```bash
cp .env.example server/.env
```
Ensure `server/.env` contains the following:
```env
MONGO_URI=mongodb://localhost:27017/pledgetrack
PORT=5000
JWT_SECRET=pledgetrack_super_secret_jwt_key_2026_secure
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

### 4. Seed the Admin Account
Run the database seeder to create the default administrative account:
```bash
cd server
node src/scripts/seedAdmin.js
cd ..
```
*Default Admin Credentials:*
- **Email:** `admin@pledgetrack.com`
- **Password:** `Admin@123456`

---

## How to Run the Application

### 1. Start the Backend Server (Terminal 1)
```bash
cd server
npm run dev
```
*Backend runs on `http://localhost:5000`.*

### 2. Start the Frontend Client (Terminal 2)
```bash
cd client
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

### 3. Open in Browser
Visit **[http://localhost:5173](http://localhost:5173)** in your browser:
- Log in with the **Admin credentials** above, or
- Click **"Create an account"** to register a new **Donor account**.

---

## AI Development Experience (Kiro)

During the development of PledgeTrack, **Kiro** was used as the AI coding assistant to accelerate full-stack delivery, specifically for crafting responsive React components and architecting the resilient payment aggregation pipeline.

### Specific Tasks Accomplished with Kiro:

1. **Frontend Component & Modal Development**:
   - Engineered the responsive Admin Dashboard (`Dashboard.jsx`), donor views (`Pledges.jsx`), and pledge creation form (`PledgeForm.jsx`).
   - Developed `RecordPaymentModal.jsx` with real-time remaining balance calculations, quick preset buttons, and submission lock guards to prevent accidental double-clicks.
   - Built `PaymentHistoryModal.jsx` to render itemized installment ledgers formatted in INR.

2. **Payment State Machine & Concurrency Architecture**:
   - Formulated and implemented **Approach B (Post-Insert Verification & Rollback)** inside `paymentController.js`, allowing atomic-like race condition protection on standalone MongoDB instances without requiring replica sets.
   - Enforced status transition rules (`pending` $\rightarrow$ `partial` $\rightarrow$ `fulfilled`) directly tied to real-time payment sums.

3. **MongoDB Aggregation Pipeline Optimization**:
   - Designed multi-stage aggregation queries (`$match`, `$group`, `$sum`, `$cond`) in `dashboardController.js` to compute institutional metrics (`totalPledged`, `totalPaid`, `totalPending`, and status distributions) in a single database round-trip.

4. **Security & Role-Based Middleware Hardening**:
   - Hardened registration endpoints to disallow role privilege escalation, locking public sign-ups strictly to the `donor` role.
   - Configured JWT verification middleware and role restriction middleware (`restrictTo('admin')`) to safeguard financial operations.

5. **End-to-End Automated Testing**:
   - Created automated integration test scripts verifying 11 distinct test cases covering authorization barriers, overpayment rejection, fulfilled pledge locking, and audit trails.

---

## License

This project is licensed under the [MIT License](LICENSE).