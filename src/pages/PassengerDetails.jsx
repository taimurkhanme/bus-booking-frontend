import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import useAuth from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatPrice, formatDate, formatTime } from '../utils/helpers';
import { HiArrowLeft, HiUserAdd, HiCreditCard } from 'react-icons/hi';
import toast from 'react-hot-toast';

export const PassengerDetails = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [route, setRoute] = useState(null);
  const [seats, setSeats] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const savedRoute = sessionStorage.getItem('selected_route');
    const savedSeats = sessionStorage.getItem('selected_seats');

    if (!savedRoute || !savedSeats) {
      toast.error('No booking selection found.');
      navigate('/');
      return;
    }

    const parsedRoute = JSON.parse(savedRoute);
    const parsedSeats = JSON.parse(savedSeats);

    setRoute(parsedRoute);
    setSeats(parsedSeats);

    // Initialize passenger forms
    const initialPassengers = parsedSeats.map((seatNumber) => ({
      seat_number: seatNumber,
      name: '',
      age: '',
      gender: 'Male',
    }));
    setPassengers(initialPassengers);
  }, [navigate]);

  const handleInputChange = (index, field, value) => {
    setPassengers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const validateForms = () => {
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.name || p.name.trim().length < 2) {
        toast.error(`Please enter a valid name for seat ${p.seat_number} (min 2 chars).`);
        return false;
      }
      const ageNum = parseInt(p.age, 10);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 100) {
        toast.error(`Please enter a valid age (1-100) for seat ${p.seat_number}.`);
        return false;
      }
      if (!p.gender) {
        toast.error(`Please select a gender for seat ${p.seat_number}.`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForms()) return;

    // Check authentication. If not logged in, redirect them to login first
    if (!isAuthenticated) {
      toast.error('You need to log in to proceed with the booking.');
      // Save passengers temporarily in sessionStorage to restore after login
      sessionStorage.setItem('temp_passengers', JSON.stringify(passengers));
      navigate('/login', { state: { from: '/passengers' } });
      return;
    }

    setSubmitting(true);
    try {
      // Create Booking API Request payload
      const payload = {
        route_id: route.id,
        travel_date: route.date,
        passengers: passengers.map((p) => ({
          name: p.name,
          age: parseInt(p.age, 10),
          gender: p.gender,
          seat_number: p.seat_number,
        })),
      };

      const response = await axiosInstance.post('/bookings/create/', payload);
      const bookingData = response.data || response;

      // Store booking ID and details in sessionStorage for the payment page
      sessionStorage.setItem('booking_id', bookingData.booking_id);
      sessionStorage.setItem('razorpay_order_id', bookingData.razorpay_order_id);
      sessionStorage.setItem('passenger_details', JSON.stringify(passengers));

      // Clean up temporary listings
      sessionStorage.removeItem('temp_passengers');

      toast.success('Booking initialized! Proceeding to payment.');
      navigate('/payment');
    } catch (error) {
      console.error('Error creating booking', error);
      // Backend errors are already toasted by the axios interceptor
    } finally {
      setSubmitting(false);
    }
  };

  // Restore state if returning from login redirection
  useEffect(() => {
    const tempPassengers = sessionStorage.getItem('temp_passengers');
    if (tempPassengers && passengers.length > 0) {
      try {
        const parsed = JSON.parse(tempPassengers);
        if (parsed.length === passengers.length) {
          setPassengers(parsed);
        }
      } catch (e) {
        console.error('Failed to parse temp passengers', e);
      }
    }
  }, [passengers.length]);

  if (!route) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex-grow bg-slate-50/50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-indigo-600 bg-white border border-slate-200/80 px-4 py-2.5 rounded-2xl shadow-sm transition-all"
        >
          <HiArrowLeft className="w-4 h-4" />
          <span>Back to Seat Selection</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Passenger Forms */}
        <div className="lg:col-span-2 space-y-6">
          <span className="text-indigo-600 font-extrabold text-[10px] uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-full">
            Passenger Form
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 mt-2 flex items-center space-x-2">
            <HiUserAdd className="w-6 h-6 text-indigo-500" />
            <span>Passenger Details</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {passengers.map((p, index) => (
              <div
                key={p.seat_number}
                className="bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-sm space-y-5 animate-fade-in-up"
              >
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="font-extrabold text-slate-700 text-xs uppercase tracking-wider">Passenger #{index + 1}</span>
                  <span className="bg-indigo-600 text-white text-xs font-black px-3.5 py-1.5 rounded-xl shadow-sm">
                    Seat {p.seat_number}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Name */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ali Khan"
                      value={p.name}
                      onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>

                  {/* Age */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Age
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      placeholder="e.g. 25"
                      value={p.age}
                      onChange={(e) => handleInputChange(index, 'age', e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>

                  {/* Gender */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Gender
                    </label>
                    <select
                      value={p.gender}
                      onChange={(e) => handleInputChange(index, 'gender', e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            {/* Submission Actions */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold text-xs uppercase tracking-wider py-4 px-6 rounded-2xl flex items-center space-x-2 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all duration-300 active:scale-95"
              >
                {submitting ? (
                  <span>Saving Booking...</span>
                ) : (
                  <>
                    <HiCreditCard className="w-5 h-5" />
                    <span>Proceed to Payment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Booking Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 shadow-sm space-y-6">
            {/* Stepper Progress Indicator */}
            <div className="flex items-center justify-between px-2 pb-4 border-b border-slate-100">
              <div className="flex flex-col items-center">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center border border-emerald-200">
                  ✓
                </span>
                <span className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider">Seats</span>
              </div>
              <div className="flex-grow h-0.5 bg-indigo-100 mx-2 mb-4"></div>
              <div className="flex flex-col items-center">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shadow-md shadow-indigo-600/20">
                  2
                </span>
                <span className="text-[9px] font-black text-indigo-650 mt-1.5 uppercase tracking-wider">Details</span>
              </div>
              <div className="flex-grow h-0.5 bg-slate-100 mx-2 mb-4"></div>
              <div className="flex flex-col items-center">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-[10px] font-black flex items-center justify-center">
                  3
                </span>
                <span className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider">Pay</span>
              </div>
            </div>

            <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center space-x-2">
              <HiCreditCard className="w-5 h-5 text-indigo-500" />
              <span>Checkout Summary</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Route</span>
                <span className="font-extrabold text-slate-800">
                  {route?.source} &rarr; {route?.destination}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Travel Date</span>
                <span className="font-extrabold text-slate-800">{formatDate(route?.date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Departure</span>
                <span className="font-extrabold text-slate-800">{formatTime(route?.departure_time)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Total Seats</span>
                <span className="font-black text-indigo-600 text-sm bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">{seats.length} seats</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-between items-baseline">
              <span className="font-bold text-slate-700 text-sm">Amount to Pay:</span>
              <span className="text-2xl font-black text-indigo-600">
                {formatPrice(route.price * seats.length)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassengerDetails;
