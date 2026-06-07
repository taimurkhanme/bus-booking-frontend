import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import SeatMap from '../components/SeatMap';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatPrice, formatDate, formatTime } from '../utils/helpers';
import { HiArrowLeft, HiTicket, HiChevronRight } from 'react-icons/hi';
import toast from 'react-hot-toast';

export const SeatSelection = () => {
  const { routeId } = useParams();
  const navigate = useNavigate();

  const [route, setRoute] = useState(null);
  const [seatData, setSeatData] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRouteAndSeats = async (showLoading = false) => {
    // Show spinner if requested or if we don't have route info yet
    if (showLoading === true || !route) setLoading(true);
    try {
      // Fetch Route details
      const routeRes = await axiosInstance.get(`/routes/${routeId}/`);
      const routeInfo = routeRes.data || routeRes;
      setRoute(routeInfo);

      // Fetch Seats layouts
      const seatsRes = await axiosInstance.get(`/routes/${routeId}/seats/`);
      const seatsInfo = seatsRes.data || seatsRes;
      setSeatData(seatsInfo);
    } catch (error) {
      console.error('Error fetching seats/route details', error);
      toast.error('Failed to load bus seat layout.');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (routeId) {
      fetchRouteAndSeats(true);

      // Auto-poll every 5 seconds silently in the background
      const intervalId = setInterval(() => {
        fetchRouteAndSeats(false);
      }, 5000);

      return () => clearInterval(intervalId);
    }
  }, [routeId, navigate]);

  const handleSeatToggle = (seatNum) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatNum)) {
        return prev.filter((s) => s !== seatNum);
      } else {
        return [...prev, seatNum];
      }
    });
  };

  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat to continue!');
      return;
    }

    // Save selection details into sessionStorage for passenger details page
    sessionStorage.setItem('selected_route', JSON.stringify(route));
    sessionStorage.setItem('selected_seats', JSON.stringify(selectedSeats));
    sessionStorage.setItem('booking_total', route.price * selectedSeats.length);

    navigate('/passengers');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  const pricePerSeat = parseFloat(route?.price || 0);
  const totalAmount = pricePerSeat * selectedSeats.length;

  return (
    <div className="flex-grow bg-slate-50/50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      {/* Back to search link */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-indigo-600 bg-white border border-slate-200/80 px-4 py-2.5 rounded-2xl shadow-sm transition-all"
        >
          <HiArrowLeft className="w-4 h-4" />
          <span>Back to Search Results</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Interactive Seat Map */}
        <div className="lg:col-span-2 flex flex-col items-center bg-white border border-slate-200/80 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
          <span className="text-[9px] bg-indigo-50 px-3 py-1.5 rounded-full font-black text-indigo-700 uppercase tracking-widest">
            Seat Layout Map
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 mt-3 mb-6 flex items-center space-x-1.5">
            <span>Choose Seats for</span>
            <span className="text-indigo-600 font-extrabold">{route?.bus?.name}</span>
          </h2>
          <SeatMap
            seats={seatData?.seats || []}
            selectedSeats={selectedSeats}
            onSeatToggle={handleSeatToggle}
          />
        </div>

        {/* Right Selection Summary Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 shadow-sm space-y-6">
            {/* Stepper Progress Indicator */}
            <div className="flex items-center justify-between px-2 pb-4 border-b border-slate-100">
              <div className="flex flex-col items-center">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shadow-md shadow-indigo-600/20">
                  1
                </span>
                <span className="text-[9px] font-black text-indigo-650 mt-1.5 uppercase tracking-wider">Seats</span>
              </div>
              <div className="flex-grow h-0.5 bg-slate-100 mx-2 mb-4"></div>
              <div className="flex flex-col items-center">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-[10px] font-black flex items-center justify-center">
                  2
                </span>
                <span className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider">Details</span>
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
              <HiTicket className="w-5 h-5 text-indigo-500" />
              <span>Journey Summary</span>
            </h3>

            {/* Route Info */}
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Route</span>
                <span className="font-extrabold text-slate-800">
                  {route?.source} &rarr; {route?.destination}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Date</span>
                <span className="font-extrabold text-slate-800">{formatDate(route?.date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Departure</span>
                <span className="font-extrabold text-slate-800">{formatTime(route?.departure_time)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Bus Class</span>
                <span className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-850 border border-indigo-150 px-2.5 py-1 rounded-lg">
                  {route?.bus?.bus_type}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Fare / Seat</span>
                <span className="font-extrabold text-slate-850">{formatPrice(pricePerSeat)}</span>
              </div>
            </div>

            {/* Selected Seats */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Selected Seats</span>
                {selectedSeats.length === 0 ? (
                  <div className="text-xs text-slate-400 italic mt-1.5">No seats selected yet. (Max 6)</div>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedSeats.map((seat) => (
                      <span
                        key={seat}
                        className="bg-indigo-600 text-white text-xs font-black px-3.5 py-1.5 rounded-xl shadow-md shadow-indigo-600/10"
                      >
                        Seat {seat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Real-time total */}
            <div className="border-t border-slate-100 pt-4 flex justify-between items-baseline">
              <span className="font-bold text-slate-700 text-sm">Total Fare:</span>
              <div className="text-right">
                <span className="text-2xl font-black text-indigo-600">
                  {formatPrice(totalAmount)}
                </span>
                <div className="text-[9px] text-slate-400 font-semibold mt-0.5">Inclusive of all taxes</div>
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              disabled={selectedSeats.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold text-xs uppercase tracking-wider py-4 px-4 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all duration-300 active:scale-95"
            >
              <span>Provide Passenger Details</span>
              <HiChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;
