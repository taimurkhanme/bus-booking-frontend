import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatPrice, formatDate, formatTime } from '../utils/helpers';
import { HiArrowLeft, HiPrinter, HiXCircle, HiTicket, HiCalendar, HiUsers, HiExclamation } from 'react-icons/hi';
import toast from 'react-hot-toast';

export const BookingDetail = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const fetchBookingDetails = async (showLoading = false) => {
    // Show spinner if requested or if we don't have any booking data yet
    if (showLoading === true || !booking) setLoading(true);
    try {
      const response = await axiosInstance.get(`/bookings/${bookingId}/`);
      const data = response.data || response;
      setBooking(data);
    } catch (error) {
      console.error('Error loading booking detail', error);
      toast.error('Failed to load booking details.');
      navigate('/my-bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails(true);

      // Auto-poll every 5 seconds silently in the background
      const intervalId = setInterval(() => {
        fetchBookingDetails(false);
      }, 5000);

      return () => clearInterval(intervalId);
    }
  }, [bookingId]);

  const handlePrint = () => {
    window.print();
  };

  const handleCancelBooking = async () => {
    try {
      setLoading(true);
      await axiosInstance.post(`/bookings/${bookingId}/cancel/`);
      toast.success('Booking cancelled successfully!');
      setShowCancelModal(false);
      await fetchBookingDetails(); // reload
    } catch (error) {
      console.error('Error cancelling booking', error);
      setLoading(false);
    }
  };

  if (loading && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const isEligibleForCancellation =
    booking?.status === 'CONFIRMED' && booking?.travel_date > todayStr;

  const getStatusBadge = (status) => {
    if (status === 'CONFIRMED') {
      return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Confirmed</span>;
    }
    if (status === 'PENDING') {
      return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Pending</span>;
    }
    return <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Cancelled</span>;
  };

  return (
    <div className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:py-0 print:max-w-full">
      {/* Back link */}
      <div className="mb-6 print:hidden">
        <Link
          to="/my-bookings"
          className="flex items-center space-x-1 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-premium"
        >
          <HiArrowLeft className="w-4 h-4" />
          <span>Back to My Bookings</span>
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm print:shadow-none print:border-none space-y-8 animate-fade-in-up">
        {/* Header summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-gray-100 gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-1.5">
              <span>Booking Summary</span>
              <span className="text-blue-600 font-extrabold">#{booking?.booking_id}</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1 font-semibold">
              Booked on: {formatDate(booking?.booked_at)}
            </p>
          </div>
          <div className="flex items-center space-x-3 print:hidden">
            <button
              onClick={fetchBookingDetails}
              className="bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-semibold px-4 py-2 rounded-xl text-xs flex items-center space-x-1 transition-premium shadow-sm"
            >
              <span>🔄 Sync Status</span>
            </button>
            {isEligibleForCancellation && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="bg-white hover:bg-red-50 text-red-600 border border-red-200 font-semibold px-4 py-2 rounded-xl text-xs flex items-center space-x-1 transition-premium shadow-sm"
              >
                <HiXCircle className="w-4 h-4" />
                <span>Cancel Ticket</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-semibold px-4 py-2 rounded-xl text-xs flex items-center space-x-1 transition-premium shadow-sm"
            >
              <HiPrinter className="w-4 h-4" />
              <span>Print Ticket</span>
            </button>
          </div>
        </div>

        {/* Detailed stats grids */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          {/* Status block */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-3">
            <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Status</h3>
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Ticket:</span>
                {getStatusBadge(booking?.status)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Payment:</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${booking?.payment_status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {booking?.payment_status}
                </span>
              </div>
            </div>
          </div>

          {/* Journey block */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-3">
            <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Journey</h3>
            <div className="flex items-start space-x-2 text-xs font-semibold text-gray-700">
              <HiCalendar className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <div className="text-[10px] text-gray-400 font-medium uppercase">Date & Operator</div>
                <div className="text-gray-800 mt-0.5">{formatDate(booking?.travel_date)}</div>
                <div className="text-gray-400 text-[10px] font-medium mt-0.5">{booking?.route?.bus?.name}</div>
              </div>
            </div>
          </div>

          {/* Fare block */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-3">
            <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Fare Info</h3>
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-500 font-medium">Fare Paid:</span>
                <span className="text-lg font-black text-blue-600">{formatPrice(booking?.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Departure Details Panel */}
        <div className="border border-gray-200/80 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Boarding Schedule</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] text-gray-400 font-semibold uppercase">Departure</div>
              <div className="font-bold text-gray-800 text-sm mt-1">{formatTime(booking?.route?.departure_time)}</div>
              <div className="text-xs text-gray-400 font-bold mt-0.5">{booking?.route?.source}</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-[9px] font-bold text-gray-400">{booking?.route?.bus?.bus_type}</span>
              <div className="w-16 h-px bg-gray-300 my-1"></div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-semibold uppercase">Arrival</div>
              <div className="font-bold text-gray-800 text-sm mt-1">{formatTime(booking?.route?.arrival_time)}</div>
              <div className="text-xs text-gray-400 font-bold mt-0.5">{booking?.route?.destination}</div>
            </div>
          </div>
        </div>

        {/* Passenger details */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Boarding Passengers</h3>
          <div className="space-y-3">
            {booking?.passengers?.map((p) => (
              <div
                key={p.seat_number}
                className="flex justify-between items-center text-xs text-gray-600 bg-gray-50 border border-gray-150 px-4 py-3.5 rounded-xl"
              >
                <div>
                  <span className="font-bold text-gray-800 text-sm">{p.name}</span>
                  <span className="text-gray-400 font-semibold ml-2">({p.gender}, {p.age} years)</span>
                </div>
                <span className="bg-blue-600 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs">
                  Seat {p.seat_number}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cancellation confirmation modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowCancelModal(false)}></div>
          
          <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative z-10 space-y-6 animate-fade-in-up">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                <HiExclamation className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Cancel Booking?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you sure you want to cancel booking <span className="font-bold text-gray-700">{bookingId}</span>? Your seats will be released immediately and this operation cannot be undone.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-xs transition-premium"
              >
                No, Keep It
              </button>
              <button
                onClick={handleCancelBooking}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-premium shadow-md shadow-red-500/10"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetail;
