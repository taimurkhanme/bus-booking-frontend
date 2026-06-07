import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { HiSearch, HiLockClosed, HiTicket, HiSupport, HiArrowRight } from 'react-icons/hi';
import toast from 'react-hot-toast';

const CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Peshawar',
  'Quetta',
  'Multan',
  'Faisalabad',
  'Rawalpindi',
];

export const Home = () => {
  const navigate = useNavigate();
  
  // Set default search values
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [cities, setCities] = useState(CITIES);
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [passengers, setPassengers] = useState(1);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await axiosInstance.get('/buses/cities/');
        const data = response.data || response;
        if (Array.isArray(data) && data.length > 0) {
          // Normalize capitalization and remove duplicates
          const normalized = [...new Set([...CITIES, ...data])].sort();
          setCities(normalized);
        }
      } catch (error) {
        console.error('Error fetching dynamic cities list', error);
      }
    };
    fetchCities();
  }, []);

  const minDate = new Date().toISOString().split('T')[0];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!fromCity) {
      toast.error('Please select a departure city!');
      return;
    }
    if (!toCity) {
      toast.error('Please select a destination city!');
      return;
    }
    if (fromCity === toCity) {
      toast.error('Departure and Destination cities cannot be the same.');
      return;
    }
    if (!date) {
      toast.error('Please select a travel date!');
      return;
    }

    // Save search details in session storage for the booking flow
    sessionStorage.setItem('search_passengers', passengers);

    navigate(
      `/search?source=${encodeURIComponent(fromCity)}&destination=${encodeURIComponent(
        toCity
      )}&date=${encodeURIComponent(date)}&t=${Date.now()}`
    );
  };

  const handleQuickRoute = (from, to) => {
    setFromCity(from);
    setToCity(to);
    toast.success(`Selected route: ${from} to ${to}. Choose date & search!`);
  };

  return (
    <div className="flex-grow bg-slate-50/50">
      {/* Hero Header Section with abstract backgrounds */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white py-20 md:py-32 px-4 sm:px-6 lg:px-8">
        {/* Glow circles in the background */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative max-w-5xl mx-auto text-center space-y-6 z-10">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 font-extrabold rounded-full text-[10px] uppercase tracking-wider animate-bounce">
            🚌 Official Ticket Portal
          </span>
          <h1 className="text-4xl md:text-7xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-indigo-100 to-blue-200 bg-clip-text text-transparent drop-shadow-md">
            Book Your Bus Ticket Online
          </h1>
          <p className="text-sm md:text-base font-medium text-slate-300 max-w-xl mx-auto leading-relaxed">
            سفر مبارک! Premium, Safe & Comfortable Bus Journeys Across Pakistan. Compare routes and grab your seats instantly.
          </p>

          {/* Quick Stats Widget */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto pt-6 text-center border-t border-slate-800/60 mt-6">
            <div>
              <div className="text-xl md:text-2xl font-black text-indigo-400">50K+</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Happy Riders</div>
            </div>
            <div>
              <div className="text-xl md:text-2xl font-black text-indigo-400">200+</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Active Buses</div>
            </div>
            <div>
              <div className="text-xl md:text-2xl font-black text-indigo-400">100%</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Secure Pay</div>
            </div>
          </div>
        </div>

        {/* Floating Search Card */}
        <div className="max-w-4xl mx-auto mt-16 bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 shadow-2xl text-slate-800 border border-slate-100 relative z-10 animate-fade-in-up">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* From City */}
            <div className="flex flex-col space-y-1">
              <label htmlFor="from-city" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Departure City
              </label>
              <select
                id="from-city"
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl px-3 py-3.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              >
                <option value="">Select Departure</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* To City */}
            <div className="flex flex-col space-y-1">
              <label htmlFor="to-city" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Destination City
              </label>
              <select
                id="to-city"
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl px-3 py-3.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              >
                <option value="">Select Destination</option>
                {cities.filter((c) => c !== fromCity).map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Travel Date */}
            <div className="flex flex-col space-y-1">
              <label htmlFor="travel-date" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Travel Date
              </label>
              <input
                id="travel-date"
                type="date"
                min={minDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl px-3 py-3 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            {/* Search Button */}
            <div className="flex flex-col justify-end">
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all duration-350 active:scale-95"
              >
                <HiSearch className="w-5 h-5" />
                <span className="text-xs uppercase tracking-wider font-extrabold">Search Buses</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Body content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Popular Routes Section */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <span className="text-indigo-600 font-extrabold text-[10px] uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-full">
              Quick Booking
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 mt-3 tracking-tight">Popular Routes</h2>
            <p className="text-xs text-slate-400 mt-2 font-medium">Instantly search routes with top bus fleet operators in Pakistan</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { from: 'Karachi', to: 'Lahore', label: 'Fastest' },
              { from: 'Lahore', to: 'Islamabad', label: 'Popular' },
              { from: 'Islamabad', to: 'Peshawar', label: 'Comfort' },
            ].map((route) => (
              <button
                key={`${route.from}-${route.to}`}
                onClick={() => handleQuickRoute(route.from, route.to)}
                className="bg-white border border-slate-200/80 hover:border-indigo-500 p-6 rounded-[2rem] flex justify-between items-center group shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-indigo-500/10 text-indigo-700 text-[9px] font-black px-3.5 py-1 rounded-bl-2xl uppercase tracking-wider">
                  {route.label}
                </div>
                
                <div className="space-y-1">
                  <div className="font-extrabold text-slate-800 text-base flex items-center space-x-1.5">
                    <span>{route.from}</span>
                    <span className="text-indigo-500 font-normal">&rarr;</span>
                    <span>{route.to}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Seat Booking Live</div>
                </div>
                
                <div className="w-9 h-9 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                  <HiArrowRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div>
          <div className="text-center mb-16">
            <span className="text-purple-600 font-extrabold text-[10px] uppercase tracking-widest bg-purple-50 px-3 py-1.5 rounded-full">
              Why Choose BusBook
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 mt-3 tracking-tight">Best in Class Journey</h2>
            <p className="text-xs text-slate-400 mt-2 font-medium">Enjoy the smoothest bus ticket booking experience</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 text-xl shadow-sm">
                <HiLockClosed className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm">Safe & Secure Payments</h3>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Payments verified automatically. We integrate top-tier card and online checkout portals.
              </p>
            </div>

            <div className="flex flex-col items-center p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 text-center">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5 text-xl shadow-sm">
                <HiTicket className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm">Instant E-Ticket</h3>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Your bus tickets are generated immediately. Print or show your digital voucher at boarding.
              </p>
            </div>

            <div className="flex flex-col items-center p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 text-xl shadow-sm">
                <HiSupport className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm">24/7 Support Desk</h3>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Our helpline is active around the clock to assist you with booking delays, queries, or route adjustments.
              </p>
            </div>

            <div className="flex flex-col items-center p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5 text-xl shadow-sm">
                <span className="text-lg font-black">&larr;</span>
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm">Easy Cancellations</h3>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Change in plans? Cancel directly from your dashboard and get eligible refunds processed quickly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
