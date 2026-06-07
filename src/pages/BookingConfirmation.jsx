import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatPrice, formatDate, formatTime } from '../utils/helpers';
import { HiCheck, HiPrinter, HiTicket, HiChevronRight } from 'react-icons/hi';

export const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const response = await axiosInstance.get(`/bookings/${bookingId}/`);
        const data = response.data || response;
        setBooking(data);
      } catch (error) {
        console.error('Error fetching booking details', error);
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  // Clean up sessionStorage booking data on successful completion
  useEffect(() => {
    sessionStorage.removeItem('booking_id');
    sessionStorage.removeItem('selected_route');
    sessionStorage.removeItem('selected_seats');
    sessionStorage.removeItem('booking_total');
    sessionStorage.removeItem('passenger_details');
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex-grow max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 print:py-0 print:max-w-full print:px-0">
      {/* Visual Confetti Elements (CSS Animated) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 print:hidden">
        {/* Simple CSS-based colored confetti bits */}
        <div className="confetti-bit bg-red-400 absolute top-10 left-[10%] w-3 h-3 rounded-full animate-bounce"></div>
        <div className="confetti-bit bg-blue-400 absolute top-20 left-[30%] w-2.5 h-4 transform rotate-45 animate-bounce delay-100"></div>
        <div className="confetti-bit bg-yellow-400 absolute top-8 left-[60%] w-4 h-2 animate-bounce delay-300"></div>
        <div className="confetti-bit bg-green-400 absolute top-16 left-[80%] w-3 h-3 rounded-full animate-bounce delay-200"></div>
      </div>

      <div className="bg-white border border-gray-200/80 rounded-3xl p-6 md:p-8 shadow-md relative z-10 print:shadow-none print:border-none space-y-8 animate-fade-in-up">
        {/* Confirmation Banner */}
        <div className="flex flex-col items-center text-center space-y-4 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner animate-pulse">
            <HiCheck className="w-10 h-10 animate-checkmark" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800">Booking Confirmed!</h2>
            <p className="text-xs text-emerald-600 font-bold mt-1 uppercase tracking-widest">
              Safar Mubarak! Have a safe and happy journey.
            </p>
          </div>
        </div>

        {/* E-Ticket Core Details */}
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Booking ID</span>
              <div className="text-2xl font-black text-blue-600 tracking-tight mt-0.5">{booking?.booking_id}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Status</span>
              <div className="mt-1">
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  {booking?.status}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 border border-gray-100 rounded-2xl p-5 text-sm">
            {/* Route Summary */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Journey Details</h3>
              <div>
                <span className="text-gray-400 font-medium">Route:</span>
                <span className="font-bold text-gray-800 ml-1">
                  {booking?.route?.source} &rarr; {booking?.route?.destination}
                </span>
              </div>
              <div>
                <span className="text-gray-400 font-medium">Date:</span>
                <span className="font-bold text-gray-800 ml-1">{formatDate(booking?.travel_date)}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium">Departure:</span>
                <span className="font-bold text-gray-800 ml-1">
                  {formatTime(booking?.route?.departure_time)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 font-medium">Bus Operator:</span>
                <span className="font-bold text-gray-800 ml-1">{booking?.route?.bus?.name}</span>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="space-y-2 md:border-l md:border-gray-200 md:pl-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Details</h3>
              <div>
                <span className="text-gray-400 font-medium">Payment Status:</span>
                <span className="text-emerald-600 font-bold ml-1">{booking?.payment_status}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium">Payment Gateway:</span>
                <span className="font-bold text-gray-800 ml-1">Razorpay Online</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium">Total Amount Paid:</span>
                <span className="text-base font-extrabold text-blue-600 ml-1">
                  {formatPrice(booking?.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Passenger Boarding list */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Passenger Boarding Pass</h3>
            <div className="space-y-3">
              {booking?.passengers?.map((p) => (
                <div
                  key={p.seat_number}
                  className="flex justify-between items-center text-xs text-gray-600 bg-white border border-gray-200 px-4 py-3.5 rounded-xl shadow-sm hover:border-blue-100 transition-premium"
                >
                  <div>
                    <span className="font-bold text-gray-800 text-sm">{p.name}</span>
                    <span className="text-gray-400 font-semibold ml-2">({p.gender}, {p.age} years)</span>
                  </div>
                  <span className="bg-blue-600 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs tracking-wider shadow-sm">
                    Seat {p.seat_number}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transition-premium text-sm border border-gray-200 shadow-sm"
          >
            <HiPrinter className="w-5 h-5 text-gray-500" />
            <span>Print / Download E-Ticket</span>
          </button>

          <Link
            to="/my-bookings"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center space-x-1 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/25 transition-premium text-sm"
          >
            <span>View All Bookings</span>
            <HiChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
