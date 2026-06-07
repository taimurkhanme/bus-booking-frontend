import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatPrice, formatDate, formatTime, calculateDuration } from '../utils/helpers';
import { HiOutlineAdjustments, HiWifi, HiLightningBolt, HiCheckCircle, HiChevronRight, HiSortAscending } from 'react-icons/hi';
import toast from 'react-hot-toast';

export const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const source = searchParams.get('source') || '';
  const destination = searchParams.get('destination') || '';
  const date = searchParams.get('date') || '';
  const t = searchParams.get('t') || '';

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [minPrice, setMinPrice] = useState(0);
  const [timeSlots, setTimeSlots] = useState([]); // Morning, Afternoon, Evening, Night
  const [sortBy, setSortBy] = useState('price_asc'); // price_asc, price_desc, duration_asc, departure_asc

  useEffect(() => {
    const fetchRoutes = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('/buses/search/', {
          params: { source, destination, date }
        });
        // Axios interceptor extracts inner response.data or parses it
        const routesData = response.data || response;
        setRoutes(Array.isArray(routesData) ? routesData : []);
        
        // Calculate min/max prices dynamically
        if (routesData && routesData.length > 0) {
          const prices = routesData.map(r => parseFloat(r.price));
          const maxP = Math.max(...prices);
          const minP = Math.min(...prices);
          setMaxPrice(maxP);
          setMinPrice(minP);
        }
      } catch (error) {
        console.error('Error fetching search results', error);
      } finally {
        setLoading(false);
      }
    };

    if (source && destination && date) {
      fetchRoutes();
    } else {
      toast.error('Invalid search parameters!');
      navigate('/');
    }
  }, [source, destination, date, t, navigate]);

  const handleTypeToggle = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleTimeSlotToggle = (slot) => {
    setTimeSlots(prev => 
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  // Check if departure time matches a slot
  const isTimeInSlot = (departureTimeStr, slot) => {
    const depDate = new Date(departureTimeStr);
    const hour = depDate.getHours();
    
    if (slot === 'Morning' && hour >= 6 && hour < 12) return true;
    if (slot === 'Afternoon' && hour >= 12 && hour < 17) return true;
    if (slot === 'Evening' && hour >= 17 && hour < 21) return true;
    if (slot === 'Night' && (hour >= 21 || hour < 6)) return true;
    return false;
  };

  // Filter routes
  const filteredRoutes = routes.filter(route => {
    // 1. Bus Type Filter
    const busType = route.bus?.bus_type || '';
    if (selectedTypes.length > 0 && !selectedTypes.includes(busType)) {
      return false;
    }

    // 2. Price Filter
    const price = parseFloat(route.price);
    if (price < minPrice || price > maxPrice) {
      return false;
    }

    // 3. Time Slot Filter
    if (timeSlots.length > 0) {
      const matchesTime = timeSlots.some(slot => isTimeInSlot(route.departure_time, slot));
      if (!matchesTime) return false;
    }

    return true;
  });

  // Sort routes
  const sortedRoutes = [...filteredRoutes].sort((a, b) => {
    if (sortBy === 'price_asc') {
      return parseFloat(a.price) - parseFloat(b.price);
    }
    if (sortBy === 'price_desc') {
      return parseFloat(b.price) - parseFloat(a.price);
    }
    if (sortBy === 'duration_asc') {
      const durA = new Date(a.arrival_time) - new Date(a.departure_time);
      const durB = new Date(b.arrival_time) - new Date(b.departure_time);
      return durA - durB;
    }
    if (sortBy === 'departure_asc') {
      return new Date(a.departure_time) - new Date(b.departure_time);
    }
    return 0;
  });

  return (
    <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Route Search Details Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 mb-8 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in-up">
        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none"></div>
        <div className="relative z-10">
          <span className="text-[9px] bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            Active Journey
          </span>
          <h2 className="text-xl md:text-2xl font-black mt-2 text-white flex items-center space-x-2.5">
            <span>{source}</span>
            <span className="text-indigo-400 font-normal text-lg">&rarr;</span>
            <span>{destination}</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Travel Date: {formatDate(date)} | Found {filteredRoutes.length} available buses
          </p>
        </div>
        <Link 
          to="/" 
          className="relative z-10 mt-4 md:mt-0 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-3 rounded-2xl flex items-center space-x-1.5 shadow-md shadow-indigo-600/15 hover:shadow-indigo-600/35 transition-all duration-300 active:scale-95"
        >
          <span>Modify Search</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <HiOutlineAdjustments className="w-5 h-5 text-indigo-500" />
                <span>Filters</span>
              </span>
              {(selectedTypes.length > 0 || timeSlots.length > 0) && (
                <button 
                  onClick={() => {
                    setSelectedTypes([]);
                    setTimeSlots([]);
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-bold transition-premium"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Sort by Dropdown */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="departure_asc">Departure Time: Early first</option>
                <option value="duration_asc">Duration: Shortest first</option>
              </select>
            </div>

            {/* Bus Type */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Bus Type</label>
              <div className="space-y-2.5">
                {['AC', 'Non-AC', 'Sleeper', 'Semi-Sleeper'].map((type) => (
                  <label key={type} className="flex items-center space-x-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type)}
                      onChange={() => handleTypeToggle(type)}
                      className="w-4.5 h-4.5 rounded text-indigo-600 focus:ring-indigo-500/30 border-slate-300"
                    />
                    <span className="text-xs text-slate-600 font-semibold">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Filter Slider */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Price Range</label>
              <div className="space-y-1">
                <input
                  type="range"
                  min="500"
                  max="15000"
                  step="250"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-bold mt-2">
                  <span>Rs. 500</span>
                  <span className="text-indigo-600 font-black">{formatPrice(maxPrice)}</span>
                </div>
              </div>
            </div>

            {/* Time Slot Filter */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Departure Time</label>
              <div className="space-y-2.5">
                {[
                  { name: 'Morning', label: 'Morning (06 AM - 12 PM)' },
                  { name: 'Afternoon', label: 'Afternoon (12 PM - 05 PM)' },
                  { name: 'Evening', label: 'Evening (05 PM - 09 PM)' },
                  { name: 'Night', label: 'Night (09 PM - 06 AM)' }
                ].map((slot) => (
                  <label key={slot.name} className="flex items-center space-x-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={timeSlots.includes(slot.name)}
                      onChange={() => handleTimeSlotToggle(slot.name)}
                      className="w-4.5 h-4.5 rounded text-indigo-600 focus:ring-indigo-500/30 border-slate-300"
                    />
                    <span className="text-xs text-slate-600 font-semibold">{slot.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Bus Cards Panel */}
        <div className="lg:col-span-3">
          {loading ? (
            /* Premium Skeletons loading screen */
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-sm animate-pulse space-y-4">
                  <div className="flex justify-between">
                    <div className="w-1/3 h-6 bg-slate-250 rounded-lg"></div>
                    <div className="w-1/6 h-6 bg-slate-250 rounded-lg"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 py-2">
                    <div className="h-10 bg-slate-100 rounded-xl"></div>
                    <div className="h-10 bg-slate-100 rounded-xl"></div>
                    <div className="h-10 bg-slate-100 rounded-xl"></div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="w-1/4 h-8 bg-slate-200 rounded-lg"></div>
                    <div className="w-1/5 h-10 bg-slate-300 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedRoutes.length === 0 ? (
            /* Empty State */
            <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-16 text-center shadow-sm space-y-6 animate-fade-in-up">
              <div className="text-6xl text-slate-300">🚌</div>
              <h3 className="text-lg font-black text-slate-800">No Buses Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                We couldn't find any active buses for this route on your selected date. Try clearing your filters or testing other dates.
              </p>
              <Link
                to="/"
                className="inline-block bg-indigo-650 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-all duration-300"
              >
                Go Back Home
              </Link>
            </div>
          ) : (
            /* Bus Cards Grid */
            <div className="space-y-4">
              {sortedRoutes.map((route) => {
                const busType = route.bus?.bus_type || 'AC';
                // Badges colors
                let typeBadgeColor = 'bg-blue-100 text-blue-800';
                if (busType === 'AC') typeBadgeColor = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
                if (busType === 'Sleeper') typeBadgeColor = 'bg-purple-100 text-purple-800 border border-purple-200';
                if (busType === 'Non-AC') typeBadgeColor = 'bg-amber-100 text-amber-800 border border-amber-200';

                return (
                  <div 
                    key={route.id} 
                    className="bg-white border border-slate-200/80 hover:border-indigo-400 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row justify-between items-stretch animate-fade-in-up"
                  >
                    {/* Bus Info Column */}
                    <div className="flex-grow flex flex-col justify-between space-y-4 md:space-y-0">
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="font-black text-slate-800 text-lg">{route.bus?.name || 'Bus Service'}</h3>
                          <span className={`text-[9px] uppercase font-black px-2.5 py-1 rounded-lg ${typeBadgeColor}`}>
                            {busType}
                          </span>
                        </div>
                        {/* Bus amenities icons list */}
                        <div className="flex items-center space-x-3 text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                          {route.bus?.amenities && route.bus.amenities.toLowerCase().includes('wifi') && (
                            <span className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-xl">
                              <HiWifi className="w-3.5 h-3.5 text-blue-500" />
                              <span>WiFi</span>
                            </span>
                          )}
                          {route.bus?.amenities && route.bus.amenities.toLowerCase().includes('charging') && (
                            <span className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-xl">
                              <HiLightningBolt className="w-3.5 h-3.5 text-purple-500" />
                              <span>Charging</span>
                            </span>
                          )}
                          <span className="bg-slate-50 px-2.5 py-1 rounded-xl">
                            {route.bus?.bus_number}
                          </span>
                        </div>
                      </div>

                      {/* Travel details grid */}
                      <div className="grid grid-cols-3 gap-2 py-4 border-t border-b md:border-t-0 md:border-b-0 border-slate-100 max-w-lg">
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Departure</div>
                          <div className="font-extrabold text-slate-800 text-base mt-1">{formatTime(route.departure_time)}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{source}</div>
                        </div>

                        <div className="flex flex-col items-center justify-center">
                          <div className="text-[10px] text-slate-400 font-extrabold">{calculateDuration(route.departure_time, route.arrival_time)}</div>
                          <div className="w-full flex items-center space-x-1 mt-1.5 px-3">
                            <div className="w-2 h-2 rounded-full border border-indigo-500 bg-white"></div>
                            <div className="flex-grow h-0.5 bg-indigo-100 border-t border-dashed border-indigo-400"></div>
                            <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                          </div>
                          <div className="text-[9px] text-slate-400 font-black tracking-wider uppercase mt-1">Direct</div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Arrival</div>
                          <div className="font-extrabold text-slate-800 text-base mt-1">{formatTime(route.arrival_time)}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{destination}</div>
                        </div>
                      </div>
                    </div>

                    {/* Price and Action Box */}
                    <div className="mt-4 md:mt-0 md:pl-6 border-t md:border-t-0 md:border-l border-slate-100 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end space-y-0 md:space-y-4 min-w-[170px]">
                      <div className="text-left md:text-right">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Ticket Price</div>
                        <div className="text-2xl font-black text-indigo-600 mt-0.5">{formatPrice(route.price)}</div>
                        <div className="text-[10px] text-emerald-600 font-black mt-1.5 flex items-center space-x-1 justify-end">
                          <HiCheckCircle className="w-3.5 h-3.5" />
                          <span>{route.available_seats} seats left</span>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/seats/${route.id}`)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-3.5 rounded-2xl flex items-center space-x-1.5 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 transition-all duration-300 active:scale-95"
                      >
                        <span>Select Seats</span>
                        <HiChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
