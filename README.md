# BusBook Pakistan - React.js Frontend (Phase 3)

A modern, responsive, premium React.js frontend for the Online Bus Ticket Booking System built with Vite and Tailwind CSS.

## Features & Pages
- **Home**: Search hero page featuring departure/destination select, date selector, passenger counts, popular routes, and marketing sections.
- **Search Results**: Multi-tiered filters (bus type, pricing, departure times), route sorting options, skeletons loader states, and empty searches layouts.
- **Seat Selection**: Dynamic top-down bus visualization. Features 2+2 rows, drivers dashboard, selectable items, and maximum-limit validation (max 6 seats).
- **Passenger Details**: Passenger name, age, and gender fields for each selected seat. Form validations and checkout summary.
- **Payment Gateway**: Razorpay Checkout Web SDK integration. Features payment script loader, payment processing states, and developer bypass simulation mode.
- **Booking Confirmation**: Success checkmark animation, downloadable printed ticket invoice, and confetti animations.
- **My Bookings Dashboard**: History filter tabs (All, Upcoming, Completed, Cancelled) with immediate ticket cancel capabilities for upcoming trips.
- **User Profile**: Personal settings (name, phone, picture upload), security credentials changes, and stats metrics dashboards.

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Node.js** (v16 or higher) and **npm** installed.

### 2. Install Dependencies
Navigate to the frontend folder and install the required node packages:
```bash
cd bus-booking-frontend
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root of the `bus-booking-frontend` directory (or modify the existing one):
```env
VITE_API_URL=http://localhost:8000/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
```
*Note: Set `VITE_API_URL` to point to your running Django backend server.*

### 4. Run Development Server
Start the Vite local development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173/` (or the port specified in terminal).

### 5. Build for Production
To bundle and compile the application for deployment:
```bash
npm run build
```
The compiled, optimized assets will be generated inside the `dist/` directory.

---

## 🔌 Connecting to Django Backend
The frontend is configured to communicate with the Django REST backend via Axios (configured in `src/api/axios.js`). 
- It automatically attaches JWT access tokens to requests from `localStorage`.
- It intercepts `401 Unauthorized` responses, attempts to refresh expired tokens using refresh tokens via `POST /api/auth/token/refresh/`, and redirects to `/login` if authentication is completely lost.
- Toast notifications are rendered automatically on API request failures.

---

## 🎟️ Complete User Booking Flow
1. **Search**: Select your Departure and Destination cities (e.g. *Karachi* &rarr; *Lahore*) on the Home page, choose a date, and click **Search Buses**.
2. **Select Bus**: Browse the available routes. Filter by price, operator type, or departure times. Click **Select Seats**.
3. **Select Seats**: View the interactive seat map. Click on your seats (e.g. A1, A2). See total price update in real-time. Click **Continue**.
4. **Passenger Details**: Enter Names, Ages, and Genders. Click **Proceed to Payment**. (If not logged in, you will be prompted to Login/Register first and then immediately returned to checkout).
5. **Payment**: Click **Pay with Razorpay** to open checkout. If testing locally without Razorpay credentials, click the **Simulate Successful Payment** developer bypass button.
6. **Confirmation**: Receive your printable digital ticket invoice and confirmation ID (e.g. `BK123456`).
