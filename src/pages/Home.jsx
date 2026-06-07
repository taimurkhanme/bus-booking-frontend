import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { HiSearch, HiLockClosed, HiTicket, HiSupport, HiArrowRight, HiLocationMarker, HiChevronDown, HiMinus, HiPlus } from 'react-icons/hi';
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
  const [showTestingModal, setShowTestingModal] = useState(false);

  // Custom Autocomplete State & Refs
  const fromRef = React.useRef(null);
  const toRef = React.useRef(null);

  const [fromSearch, setFromSearch] = useState('');
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [fromActiveIndex, setFromActiveIndex] = useState(-1);

  const [toSearch, setToSearch] = useState('');
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [toActiveIndex, setToActiveIndex] = useState(-1);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fromRef.current && !fromRef.current.contains(event.target)) {
        setShowFromDropdown(false);
      }
      if (toRef.current && !toRef.current.contains(event.target)) {
        setShowToDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync searches with cities state on blur / drop-down close
  useEffect(() => {
    if (!showFromDropdown && fromCity !== fromSearch) {
      setFromSearch(fromCity);
    }
  }, [showFromDropdown, fromCity]);

  useEffect(() => {
    if (!showToDropdown && toCity !== toSearch) {
      setToSearch(toCity);
    }
  }, [showToDropdown, toCity]);


  useEffect(() => {
    const dismissed = sessionStorage.getItem('dismissed_testing_modal');
    if (!dismissed) {
      const timer = setTimeout(() => {
        setShowTestingModal(true);
      }, 850);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismissModal = () => {
    sessionStorage.setItem('dismissed_testing_modal', 'true');
    setShowTestingModal(false);
  };

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

  // Autocomplete filtration lists
  const filteredFromCities = cities.filter(city => 
    city.toLowerCase().includes(fromSearch.toLowerCase())
  );

  const filteredToCities = cities.filter(city => 
    city !== fromCity && city.toLowerCase().includes(toSearch.toLowerCase())
  );

  const selectFromCity = (city) => {
    setFromCity(city);
    setFromSearch(city);
    setShowFromDropdown(false);
    setFromActiveIndex(-1);
  };

  const selectToCity = (city) => {
    setToCity(city);
    setToSearch(city);
    setShowToDropdown(false);
    setToActiveIndex(-1);
  };

  const handleFromKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFromActiveIndex(prev => 
        prev < filteredFromCities.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFromActiveIndex(prev => 
        prev > 0 ? prev - 1 : filteredFromCities.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (fromActiveIndex >= 0 && fromActiveIndex < filteredFromCities.length) {
        selectFromCity(filteredFromCities[fromActiveIndex]);
      } else if (filteredFromCities.length > 0) {
        selectFromCity(filteredFromCities[0]);
      }
    } else if (e.key === 'Escape') {
      setShowFromDropdown(false);
    }
  };

  const handleToKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setToActiveIndex(prev => 
        prev < filteredToCities.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setToActiveIndex(prev => 
        prev > 0 ? prev - 1 : filteredToCities.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (toActiveIndex >= 0 && toActiveIndex < filteredToCities.length) {
        selectToCity(filteredToCities[toActiveIndex]);
      } else if (filteredToCities.length > 0) {
        selectToCity(filteredToCities[0]);
      }
    } else if (e.key === 'Escape') {
      setShowToDropdown(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    let finalFrom = fromCity;
    if (!finalFrom && fromSearch) {
      const match = cities.find(c => c.toLowerCase() === fromSearch.toLowerCase());
      if (match) {
        finalFrom = match;
        setFromCity(match);
        setFromSearch(match);
      }
    }

    let finalTo = toCity;
    if (!finalTo && toSearch) {
      const match = cities.find(c => c.toLowerCase() === toSearch.toLowerCase());
      if (match) {
        finalTo = match;
        setToCity(match);
        setToSearch(match);
      }
    }

    if (!finalFrom) {
      toast.error('Please select a departure city!');
      return;
    }
    if (!finalTo) {
      toast.error('Please select a destination city!');
      return;
    }
    if (finalFrom === finalTo) {
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
      `/search?source=${encodeURIComponent(finalFrom)}&destination=${encodeURIComponent(
        finalTo
      )}&date=${encodeURIComponent(date)}&t=${Date.now()}`
    );
  };

  const handleQuickRoute = (from, to) => {
    setFromCity(from);
    setFromSearch(from);
    setToCity(to);
    setToSearch(to);
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
        <div className="max-w-5xl mx-auto mt-16 bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 shadow-2xl text-slate-800 border border-slate-100 relative z-10 animate-fade-in-up">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* From City Autocomplete */}
            <div ref={fromRef} className="flex flex-col space-y-1 relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Departure City
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <HiLocationMarker className="w-4 h-4 text-indigo-500" />
                </span>
                <input
                  type="text"
                  placeholder="Select Departure"
                  value={fromSearch}
                  onFocus={() => setShowFromDropdown(true)}
                  onChange={(e) => {
                    setFromSearch(e.target.value);
                    setFromCity('');
                    setShowFromDropdown(true);
                    setFromActiveIndex(-1);
                  }}
                  onKeyDown={handleFromKeyDown}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-9 pr-8 py-3 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 pointer-events-none">
                  <HiChevronDown className="w-4 h-4" />
                </span>
              </div>

              {showFromDropdown && (
                <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white/95 backdrop-blur-md border border-slate-150 rounded-2xl shadow-xl z-30 max-h-48 overflow-y-auto custom-scrollbar animate-fade-in-up">
                  {filteredFromCities.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 italic text-center">No cities found</div>
                  ) : (
                    filteredFromCities.map((city, idx) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => selectFromCity(city)}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center space-x-2 border-b border-slate-50 last:border-0 autocomplete-item ${
                          idx === fromActiveIndex ? 'autocomplete-item-active' : ''
                        }`}
                      >
                        <span className="text-slate-400 text-xs">📍</span>
                        <span>{city}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* To City Autocomplete */}
            <div ref={toRef} className="flex flex-col space-y-1 relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Destination City
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <HiLocationMarker className="w-4 h-4 text-purple-500" />
                </span>
                <input
                  type="text"
                  placeholder="Select Destination"
                  value={toSearch}
                  onFocus={() => setShowToDropdown(true)}
                  onChange={(e) => {
                    setToSearch(e.target.value);
                    setToCity('');
                    setShowToDropdown(true);
                    setToActiveIndex(-1);
                  }}
                  onKeyDown={handleToKeyDown}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-9 pr-8 py-3 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 pointer-events-none">
                  <HiChevronDown className="w-4 h-4" />
                </span>
              </div>

              {showToDropdown && (
                <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white/95 backdrop-blur-md border border-slate-150 rounded-2xl shadow-xl z-30 max-h-48 overflow-y-auto custom-scrollbar animate-fade-in-up">
                  {filteredToCities.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 italic text-center">No cities found</div>
                  ) : (
                    filteredToCities.map((city, idx) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => selectToCity(city)}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center space-x-2 border-b border-slate-50 last:border-0 autocomplete-item ${
                          idx === toActiveIndex ? 'autocomplete-item-active' : ''
                        }`}
                      >
                        <span className="text-slate-400 text-xs">📍</span>
                        <span>{city}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
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
                className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl px-3 py-3 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all h-[42px] md:h-[46px]"
              />
            </div>

            {/* Passengers Stepper */}
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Passengers
              </label>
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-2xl p-1.5 h-[42px] md:h-[46px]">
                <button
                  type="button"
                  onClick={() => setPassengers(p => Math.max(1, p - 1))}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white hover:bg-slate-105 border border-slate-200 flex items-center justify-center text-slate-650 font-extrabold transition-all active:scale-90 shadow-sm cursor-pointer"
                >
                  <HiMinus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-black text-slate-800 select-none">
                  {passengers} {passengers === 1 ? 'Pass' : 'Pass'}
                </span>
                <button
                  type="button"
                  onClick={() => setPassengers(p => Math.min(6, p + 1))}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white hover:bg-slate-105 border border-slate-200 flex items-center justify-center text-slate-650 font-extrabold transition-all active:scale-90 shadow-sm cursor-pointer"
                >
                  <HiPlus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Search Button */}
            <div className="flex flex-col justify-end">
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all duration-350 active:scale-95 cursor-pointer h-[42px] md:h-[46px]"
              >
                <HiSearch className="w-5 h-5 flex-shrink-0" />
                <span className="text-xs uppercase tracking-wider font-extrabold whitespace-nowrap">Search Buses</span>
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
              <h3 className="font-extrabold text-slate-800 text-sm">24/7 Helpline Support</h3>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Jamshed Software House support is active around the clock. Contact us at <a href="tel:+923299969277" className="text-indigo-600 font-extrabold">+92 329 9969277</a> or <a href="mailto:developer.aipk@gmail.com" className="text-indigo-650 font-semibold">developer.aipk@gmail.com</a>.
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

        {/* Developer & CEO Spotlight Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24 animate-fade-in-up">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-[3.5rem] p-8 md:p-14 shadow-2xl border border-white/10 z-10">
            {/* Subtle background glow effect */}
            <div className="absolute -right-24 -bottom-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -left-24 -top-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Heading and Brand Details */}
              <div className="lg:col-span-7 space-y-5">
                <span className="text-indigo-400 font-extrabold text-[10px] uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full inline-block">
                  Core Leadership & Engineering
                </span>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                  Behind the Platform
                </h2>
                <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-medium max-w-xl">
                  BusBook Pakistan is engineered with state-of-the-art architectures to provide seamless, secure, and rapid transit bookings. Designed and led by pioneering AI engineering and software standards.
                </p>
                
                {/* Organization Badges */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <span className="text-[10px] font-bold bg-slate-800/85 border border-slate-700/50 px-3.5 py-2 rounded-xl text-slate-300 select-none">
                    ⚡ Advanced Agentic Systems
                  </span>
                  <span className="text-[10px] font-bold bg-slate-800/85 border border-slate-700/50 px-3.5 py-2 rounded-xl text-slate-300 select-none">
                    💻 Full-Stack Automation
                  </span>
                </div>
              </div>

              {/* Right Column: Premium Showcase Profile Card */}
              <div className="lg:col-span-5">
                <div className="relative group">
                  {/* Glow ring behind card on hover */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-650 rounded-[2.5rem] blur opacity-25 group-hover:opacity-60 transition duration-500"></div>
                  
                  {/* Glassmorphic Profile Card */}
                  <div className="relative bg-slate-900/85 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 md:p-8 space-y-6">
                    
                    {/* CEO Info Block */}
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-500/20">
                        TK
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white tracking-tight">Taimur Khan</h3>
                        <p className="text-xs text-indigo-400 font-extrabold tracking-wide uppercase mt-0.5">
                          AI Engineer
                        </p>
                      </div>
                    </div>

                    {/* Company, Email & WhatsApp Details */}
                    <div className="space-y-3 pt-2 border-t border-white/5 text-xs text-slate-300">
                      <div className="flex items-center space-x-3 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                        <span className="text-lg select-none">🏢</span>
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Company</span>
                          <span className="font-extrabold text-white">Jamshed Computer Academy & Software House</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                        <span className="text-lg select-none">✉️</span>
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Contact Email</span>
                          <a href="mailto:developer.aipk@gmail.com" className="font-extrabold text-indigo-300 hover:text-indigo-400 transition-colors">
                            developer.aipk@gmail.com
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                        <span className="text-lg select-none">💬</span>
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">WhatsApp</span>
                          <a 
                            href="https://wa.me/923299969277" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="font-extrabold text-emerald-450 hover:text-emerald-350 transition-colors"
                          >
                            03299969277
                          </a>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Developer Testing Modal */}
        {showTestingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with strong blur */}
            <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity duration-300" onClick={handleDismissModal}></div>

            {/* Premium Glassmorphic Card */}
            <div className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-2xl border border-white/10 text-white rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(99,102,241,0.2)] z-10 space-y-6 animate-fade-in-up">
              
              {/* Top Banner (Minimalist & Premium) */}
              <div className="text-center space-y-2">
                <span className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold rounded-full text-[9px] uppercase tracking-widest">
                  ⚠️ Live Demo Environment
                </span>
                <h3 className="text-lg font-black tracking-tight text-white mt-2">
                  Welcome to BusBook PK
                </h3>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                  This platform is running in a simulated mode. Seat selection and ticket flows are fully functional, but no real money is processed.
                </p>
              </div>

              {/* Spotlight: Taimur Khan AI Services (Natural Human English Context) */}
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 space-y-4">
                {/* Accent glow line */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">
                    Custom Software & AI Integration
                  </span>
                  <p className="text-[11.5px] font-semibold text-slate-200 leading-relaxed">
                    If you are looking to build a custom website, office management system, or a project for your FYP, or want to integrate cutting-edge AI into your business operations, feel free to contact us!
                  </p>
                </div>

                {/* Micro Details Badge */}
                <div className="flex flex-wrap gap-2 text-[9px] font-bold text-slate-400">
                  <span className="bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/35">💡 Web & App Dev</span>
                  <span className="bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/35">🧠 AI Integrations</span>
                </div>
              </div>

              {/* Footer Profile Spotlight */}
              <div className="border-t border-slate-800/85 pt-4.5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-650 flex items-center justify-center text-white text-xs font-black shadow-md shadow-indigo-500/10 select-none">
                    TK
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-white">Taimur Khan</h4>
                    <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">AI Engineer</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-slate-500 font-extrabold uppercase">Academy & Software House</p>
                  <p className="text-[10px] text-slate-350 font-bold leading-tight mt-0.5">Jamshed Computer Academy</p>
                </div>
              </div>

              {/* Action Buttons & Contact Pills */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <a 
                    href="https://wa.me/923299969277" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/25 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer select-none active:scale-95"
                  >
                    <span>💬 WhatsApp</span>
                  </a>
                  <a 
                    href="mailto:developer.aipk@gmail.com"
                    className="flex items-center justify-center space-x-2 bg-slate-800/50 hover:bg-slate-800 text-slate-200 border border-slate-700/40 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer select-none active:scale-95"
                  >
                    <span>✉️ Email Us</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={handleDismissModal}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all active:scale-95 cursor-pointer shadow-lg shadow-indigo-600/15"
                >
                  Explore Booking Demo
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Home;
