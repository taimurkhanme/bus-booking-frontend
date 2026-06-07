import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatPrice, formatDate } from '../utils/helpers';
import { HiTicket, HiCalendar, HiUsers, HiCurrencyDollar, HiExclamation } from 'react-icons/hi';
import toast from 'react-hot-toast';

export const MyBookings = () => {
  const navigate = useNavigate();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All'); // All, Upcoming, Completed, Cancelled
  const [cancellingId, setCancellingId] = useState(null); // Triggers confirmation dialogue modal

  const fetchBookings = async (showLoading = false) => {
    // Show spinner if requested or if we don't have any bookings loaded yet
    if (showLoading === true || bookings.length === 0) setLoading(true);
    try {
      const response = await axiosInstance.get('/bookings/');
      const data = response.data || response;
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching bookings list', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(true);

    // Auto-poll every 5 seconds silently to fetch changes made in Django Admin
    const intervalId = setInterval(() => {
      fetchBookings(false);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const handleCancelClick = (bookingId) => {
    setCancellingId(bookingId);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingId) return;
    
    try {
      setLoading(true);
      await axiosInstance.post(`/bookings/${cancellingId}/cancel/`);
      toast.success(`Booking ${cancellingId} cancelled successfully!`);
      setCancellingId(null);
      await fetchBookings(); // Reload list
    } catch (error) {
      console.error('Error cancelling booking', error);
      setLoading(false);
    }
  };

  // Filter logic
  const todayStr = new Date().toISOString().split('T')[0];
  
  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'All') return true;
    
    if (activeTab === 'Upcoming') {
      return (b.status === 'CONFIRMED' || b.status === 'PENDING') && b.travel_date >= todayStr;
    }
    if (activeTab === 'Completed') {
      return b.status === 'CONFIRMED' && b.travel_date < todayStr;
    }
    if (activeTab === 'Cancelled') {
      return b.status === 'CANCELLED';
    }
    return true;
  });

  const getStatusBadge = (status) => {
    if (status === 'CONFIRMED') {
      return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Confirmed</span>;
    }
    if (status === 'PENDING') {
      return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Pending</span>;
    }
    return <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Cancelled</span>;
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-extrabold text-gray-800 flex items-center space-x-2">
          <HiTicket className="w-6 h-6 text-blue-500" />
          <span>My Bookings</span>
        </h2>
        <button
          onClick={fetchBookings}
          className="bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-semibold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-premium shadow-sm"
        >
          <span>🔄 Sync Status</span>
        </button>
      </div>

      {/* Tabs list navigation */}
      <div className="flex space-x-2 border-b border-gray-200 pb-px mb-6 text-sm overflow-x-auto">
        {['All', 'Upcoming', 'Completed', 'Cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 font-semibold border-b-2 transition-premium whitespace-nowrap ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bookings Card List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white border border-gray-200/80 rounded-3xl p-12 text-center shadow-sm space-y-6">
          <div className="text-5xl text-gray-300">🎟️</div>
          <h3 className="text-lg font-bold text-gray-800">No Bookings Found</h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
            We couldn't find any {activeTab.toLowerCase()} bookings. Check other tabs or book a new journey!
          </p>
          <Link
            to="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-premium text-xs"
          >
            Book New Ticket
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const isEligibleForCancellation =
              b.status === 'CONFIRMED' && b.travel_date > todayStr;

            return (
              <div
                key={b.booking_id}
                className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-premium flex flex-col md:flex-row justify-between items-stretch gap-6"
              >
                {/* Booking Core Metadata */}
                <div className="flex-grow space-y-4">
                  <div className="flex justify-between items-center md:justify-start md:space-x-4">
                    <span className="text-sm font-black text-gray-800 tracking-tight">{b.booking_id}</span>
                    {getStatusBadge(b.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-gray-500">
                    <div className="flex items-center space-x-2">
                      <HiCalendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase">Travel Date</div>
                        <div className="text-gray-800 font-bold">{formatDate(b.travel_date)}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <HiTicket className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase">Route</div>
                        <div className="text-gray-800 font-bold">
                          {b.route?.source} &rarr; {b.route?.destination}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <HiUsers className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase">Passengers</div>
                        <div className="text-gray-800 font-bold">{b.passengers?.length || 1} Person(s)</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <HiCurrencyDollar className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase">Fare Paid</div>
                        <div className="text-blue-600 font-black text-sm">{formatPrice(b.total_amount)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Controls */}
                <div className="flex flex-row md:flex-col justify-end md:justify-center items-center gap-3 md:pl-6 md:border-l border-gray-100 min-w-[150px]">
                  <Link
                    to={`/booking/${b.booking_id}`}
                    className="flex-grow text-center md:flex-grow-0 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold px-4 py-2.5 rounded-xl text-xs transition-premium"
                  >
                    View Details
                  </Link>

                  {isEligibleForCancellation && (
                    <button
                      onClick={() => handleCancelClick(b.booking_id)}
                      className="flex-grow md:flex-grow-0 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-semibold px-4 py-2.5 rounded-xl text-xs transition-premium"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation confirmation modal */}
      {cancellingId && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setCancellingId(null)}></div>
          
          <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative z-10 space-y-6 animate-fade-in-up">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                <HiExclamation className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Cancel Booking?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you sure you want to cancel booking <span className="font-bold text-gray-700">{cancellingId}</span>? This action is irreversible, and your seats will be released immediately.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setCancellingId(null)}
                className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-xs transition-premium"
              >
                No, Keep It
              </button>
              <button
                onClick={handleConfirmCancel}
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

export default MyBookings;
