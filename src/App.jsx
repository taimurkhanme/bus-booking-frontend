import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import SeatSelection from './pages/SeatSelection';
import PassengerDetails from './pages/PassengerDetails';
import Payment from './pages/Payment';
import BookingConfirmation from './pages/BookingConfirmation';
import MyBookings from './pages/MyBookings';
import BookingDetail from './pages/BookingDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AgentDesk from './pages/AgentDesk';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Navbar />
      <main className="flex-grow flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/seats/:routeId" element={<SeatSelection />} />
          <Route path="/passengers" element={<PassengerDetails />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/confirmation/:bookingId" element={<BookingConfirmation />} />
          
          {/* Protected Routes */}
          <Route path="/my-bookings" element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          } />
          <Route path="/booking/:bookingId" element={
            <ProtectedRoute>
              <BookingDetail />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/agent-desk" element={
            <ProtectedRoute>
              <AgentDesk />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
