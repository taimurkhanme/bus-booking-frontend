import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import useAuth from '../hooks/useAuth';
import SeatMap from '../components/SeatMap';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatPrice, formatDate, formatTime } from '../utils/helpers';
import { HiSearch, HiTicket, HiUserAdd, HiPrinter, HiPlus, HiMinus, HiCheckCircle, HiArrowLeft } from 'react-icons/hi';
import toast from 'react-hot-toast';

const DEFAULT_CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Peshawar', 'Quetta', 'Multan', 'Faisalabad', 'Rawalpindi'];

export const AgentDesk = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if not staff/admin
  useEffect(() => {
    if (user && !user.is_staff) {
      toast.error('Access Denied. Agent Desk is only for staff members.');
      navigate('/');
    }
  }, [user, navigate]);

  // Search parameters state
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [cities, setCities] = useState(DEFAULT_CITIES);

  // Search results and selected route state
  const [routes, setRoutes] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);

  // Seats state for selected route
  const [seatData, setSeatData] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);

  // Walk-in Customer Contact Info
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  // Passenger list details
  const [passengers, setPassengers] = useState([]); // Array of { name, age, gender, seat_number }

  // Booking result for printable receipt modal
  const [bookingResult, setBookingResult] = useState(null);
  const [issuing, setIssuing] = useState(false);

  // Fetch cities list on mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await axiosInstance.get('/buses/cities/');
        const data = res.data || res;
        if (Array.isArray(data) && data.length > 0) {
          setCities([...new Set([...DEFAULT_CITIES, ...data])].sort());
        }
      } catch (err) {
        console.error('Error loading cities', err);
      }
    };
    fetchCities();
  }, []);

  // Sync selected route's seats layouts periodically if one is selected
  useEffect(() => {
    let intervalId;
    if (selectedRoute) {
      const fetchSeats = async () => {
        try {
          const res = await axiosInstance.get(`/routes/${selectedRoute.id}/seats/`);
          const data = res.data || res;
          setSeatData(data);
        } catch (err) {
          console.error('Error refreshing seats layout', err);
        }
      };

      fetchSeats();
      intervalId = setInterval(fetchSeats, 5000); // Poll every 5s
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedRoute]);

  // Fetch routes based on search criteria
  const handleSearchRoutes = async (e) => {
    if (e) e.preventDefault();
    if (!fromCity || !toCity || !date) {
      toast.error('Please fill all search parameters.');
      return;
    }
    if (fromCity === toCity) {
      toast.error('Departure and Destination cannot be same.');
      return;
    }

    setSearching(true);
    setSelectedRoute(null);
    setSeatData(null);
    setSelectedSeats([]);
    setPassengers([]);
    
    try {
      const res = await axiosInstance.get('/buses/search/', {
        params: { source: fromCity, destination: toCity, date }
      });
      const data = res.data || res;
      setRoutes(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length === 0) {
        toast.error('No buses found for this search criteria.');
      }
    } catch (err) {
      console.error('Error searching routes', err);
    } finally {
      setSearching(false);
    }
  };

  // Select a bus route
  const handleSelectRoute = async (route) => {
    setSelectedRoute(route);
    setLoadingSeats(true);
    setSelectedSeats([]);
    setPassengers([]);

    try {
      const res = await axiosInstance.get(`/routes/${route.id}/seats/`);
      const data = res.data || res;
      setSeatData(data);
      toast.success(`Selected operator: ${route.bus.name}`);
    } catch (err) {
      console.error('Error loading seats', err);
      toast.error('Failed to load seats layout.');
    } finally {
      setLoadingSeats(false);
    }
  };

  // Toggle seat clicks
  const handleSeatToggle = (seatNum) => {
    setSelectedSeats((prev) => {
      let updated;
      if (prev.includes(seatNum)) {
        updated = prev.filter((s) => s !== seatNum);
      } else {
        if (prev.length >= 6) {
          toast.error('Maximum 6 seats allowed per booking.');
          return prev;
        }
        updated = [...prev, seatNum];
      }

      // Synchronize passenger form fields with selected seats
      const newPassengers = updated.map((s) => {
        // Reuse existing details if seat was already selected
        const existing = passengers.find((p) => p.seat_number === s);
        return existing || { name: '', age: '', gender: 'Male', seat_number: s };
      });
      setPassengers(newPassengers);

      return updated;
    });
  };

  // Handle passenger input changes
  const handlePassengerChange = (index, field, value) => {
    setPassengers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Handle Book & Issue
  const handleIssueTicket = async (e) => {
    e.preventDefault();

    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat.');
      return;
    }

    if (!guestName || !guestPhone) {
      toast.error('Walk-in Customer Contact Name and Phone are required.');
      return;
    }

    // Validate passenger details
    for (let p of passengers) {
      if (!p.name || !p.age) {
        toast.error(`Please fill passenger details for seat ${p.seat_number}.`);
        return;
      }
    }

    setIssuing(true);
    try {
      const payload = {
        route_id: selectedRoute.id,
        travel_date: selectedRoute.date,
        passengers: passengers.map(p => ({
          name: p.name,
          age: parseInt(p.age),
          gender: p.gender,
          seat_number: p.seat_number
        })),
        is_walkin: true,
        guest_name: guestName,
        guest_phone: guestPhone,
        guest_email: guestEmail || `${guestPhone}@guest.busbook.com` // fallback email
      };

      const res = await axiosInstance.post('/bookings/create/', payload);
      const result = res.data || res;
      
      setBookingResult(result);
      toast.success('Ticket issued successfully!');
    } catch (err) {
      console.error('Error issuing ticket', err);
    } finally {
      setIssuing(false);
    }
  };

  // Reset booking form
  const handleResetForm = () => {
    setBookingResult(null);
    setSelectedSeats([]);
    setPassengers([]);
    setGuestName('');
    setGuestPhone('');
    setGuestEmail('');
    // Refresh seat layouts
    if (selectedRoute) {
      handleSelectRoute(selectedRoute);
    }
  };

  // Print ticket action
  const handlePrint = () => {
    window.print();
  };

  if (user && !user.is_staff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:m-0 animate-fade-in-up">
      {/* Title Header */}
      <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 flex items-center space-x-2">
            <span>💻 BusBook Agent Terminal</span>
            <span className="text-xs bg-blue-600 text-white font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
              Walk-in Booking
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            Book specific seats directly for walk-in passengers without registered user accounts.
          </p>
        </div>
      </div>

      {/* Main Panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start print:hidden">
        
        {/* Left Side: Route Search & Selector */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Route Search Card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Search Bus Routes</h2>
            <form onSubmit={handleSearchRoutes} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">From</label>
                <select
                  value={fromCity}
                  onChange={(e) => setFromCity(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select City</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">To</label>
                <select
                  value={toCity}
                  onChange={(e) => setToCity(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select City</option>
                  {cities.filter(c => c !== fromCity).map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={searching}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-150 disabled:text-gray-400 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1 shadow-md transition-premium"
              >
                <HiSearch className="w-4 h-4" />
                <span>{searching ? 'Searching...' : 'Find Buses'}</span>
              </button>
            </form>
          </div>

          {/* Search Results list */}
          <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Buses Found ({routes.length})</h2>
            {routes.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No search results currently loaded. Search to view buses.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {routes.map((route) => {
                  const isCurrent = selectedRoute?.id === route.id;
                  return (
                    <button
                      key={route.id}
                      onClick={() => handleSelectRoute(route)}
                      className={`w-full text-left p-3.5 rounded-2xl border text-xs flex justify-between items-center transition-all ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                          : 'border-gray-150 bg-white hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="font-extrabold text-gray-800">{route.bus.name}</div>
                        <div className="text-gray-400 font-bold tracking-tight">{route.bus.bus_number} • {route.bus.bus_type}</div>
                        <div className="text-blue-600 font-extrabold mt-1">{formatTime(route.departure_time)} - {formatPrice(route.price)}</div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${route.available_seats > 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {route.available_seats} Left
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Seat Map & Guest/Passenger Details Form */}
        <div className="lg:col-span-2">
          {!selectedRoute ? (
            <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center shadow-sm space-y-4">
              <div className="text-5xl text-gray-300">🚌</div>
              <h3 className="text-lg font-bold text-gray-800">Select a Bus Route</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                Use the search parameters on the left to find buses, and click on a route to view its seat layout.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              
              {/* Interactive Seat Map (45% width) */}
              <div className="md:col-span-5 flex flex-col items-center">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 w-full text-center">
                  Interactive Layout
                </h3>
                {loadingSeats ? (
                  <LoadingSpinner />
                ) : (
                  <SeatMap
                    seats={seatData?.seats || []}
                    selectedSeats={selectedSeats}
                    onSeatToggle={handleSeatToggle}
                  />
                )}
              </div>

              {/* Passenger & Guest Details Fields (55% width) */}
              <form onSubmit={handleIssueTicket} className="md:col-span-7 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
                
                {/* Walk-in Contact Details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider border-b border-gray-100 pb-2">
                    Walk-in Customer details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Contact Name *</label>
                      <input
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Aslam Khan"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Phone Number *</label>
                      <input
                        type="text"
                        required
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="e.g. 03001234567"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Email Address (Optional)</label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="e.g. passenger@domain.com"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Selected Seats Passengers detail */}
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider border-b border-gray-100 pb-2 flex justify-between">
                    <span>Passenger Seats Information</span>
                    <span className="text-gray-400">({selectedSeats.length} Seats)</span>
                  </h3>

                  {selectedSeats.length === 0 ? (
                    <div className="text-xs text-gray-400 italic text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      No seats selected. Click available seats on the layout.
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                      {passengers.map((p, index) => (
                        <div key={p.seat_number} className="bg-gray-50 border border-gray-150 rounded-2xl p-4 space-y-3 relative">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-gray-800">Seat Number: {p.seat_number}</span>
                            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                              Passenger #{index + 1}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-gray-400 uppercase">Name</label>
                              <input
                                type="text"
                                required
                                value={p.name}
                                onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
                                placeholder="Passenger Name"
                                className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-gray-400 uppercase">Age</label>
                              <input
                                type="number"
                                required
                                min="1"
                                max="120"
                                value={p.age}
                                onChange={(e) => handlePassengerChange(index, 'age', e.target.value)}
                                placeholder="Age"
                                className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-gray-400 uppercase">Gender</label>
                              <select
                                value={p.gender}
                                onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                              >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fare Summary & Issue Button */}
                {selectedSeats.length > 0 && (
                  <div className="border-t border-gray-100 pt-4 space-y-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-gray-400 uppercase">Total Walk-in Fare</span>
                      <span className="text-xl font-black text-blue-600">
                        {formatPrice(selectedRoute.price * selectedSeats.length)}
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={issuing}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-150 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-premium"
                    >
                      <HiCheckCircle className="w-5 h-5" />
                      <span>{issuing ? 'Issuing walk-in ticket...' : 'Issue & Confirm Walk-in Ticket'}</span>
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Booking Confirmation / Printable Voucher Modal */}
      {bookingResult && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          {/* Modal backdrop */}
          <div className="fixed inset-0 bg-black/55 backdrop-blur-sm print:hidden" onClick={handleResetForm}></div>
          
          {/* Printable Voucher layout */}
          <div className="bg-white border border-gray-300 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative z-10 space-y-8 animate-fade-in-up print:border-none print:shadow-none print:p-0 print:m-0 print:absolute print:inset-0 print:max-w-full">
            
            {/* Operator Stamp & Booking Code */}
            <div className="flex justify-between items-start border-b-2 border-dashed border-gray-200 pb-5">
              <div>
                <h2 className="text-xl font-black text-blue-600 tracking-tight">{selectedRoute?.bus.name}</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Official Ticket Voucher</p>
              </div>
              <div className="text-right">
                <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1.5 rounded-lg uppercase tracking-wider">
                  PAID (Walk-in)
                </span>
                <div className="text-xs font-black text-gray-800 mt-2">
                  Code: <span className="text-blue-600">{bookingResult.data?.booking_id}</span>
                </div>
              </div>
            </div>

            {/* Journey Details */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Journey Summary</h4>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-[9px] text-gray-400 uppercase font-medium">Route</div>
                  <div className="font-bold text-gray-800 mt-0.5">{selectedRoute?.source} &rarr; {selectedRoute?.destination}</div>
                </div>
                <div>
                  <div className="text-[9px] text-gray-400 uppercase font-medium">Travel Date</div>
                  <div className="font-bold text-gray-800 mt-0.5">{formatDate(selectedRoute?.date)}</div>
                </div>
                <div>
                  <div className="text-[9px] text-gray-400 uppercase font-medium">Departure Time</div>
                  <div className="font-bold text-gray-800 mt-0.5">{formatTime(selectedRoute?.departure_time)}</div>
                </div>
                <div>
                  <div className="text-[9px] text-gray-400 uppercase font-medium">Bus Number / Type</div>
                  <div className="font-bold text-gray-800 mt-0.5">{selectedRoute?.bus.bus_number} ({selectedRoute?.bus.bus_type})</div>
                </div>
              </div>
            </div>

            {/* Walk-in Customer Contact Info */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Customer Contact Info</h4>
              <div className="text-xs border border-gray-150 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-semibold">Contact Name:</span>
                  <span className="font-bold text-gray-800">{guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-semibold">Phone Number:</span>
                  <span className="font-bold text-gray-800">{guestPhone}</span>
                </div>
                {guestEmail && !guestEmail.includes('@guest.busbook.com') && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-semibold">Email:</span>
                    <span className="font-bold text-gray-800">{guestEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Passengers list */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Issued Passenger Seats</h4>
              <div className="space-y-2">
                {passengers.map((p) => (
                  <div
                    key={p.seat_number}
                    className="flex justify-between items-center text-xs text-gray-600 bg-gray-50 border border-gray-150 px-4 py-3 rounded-xl"
                  >
                    <div>
                      <span className="font-bold text-gray-800">{p.name}</span>
                      <span className="text-gray-400 font-semibold ml-2">({p.gender}, {p.age} years)</span>
                    </div>
                    <span className="bg-blue-600 text-white font-extrabold px-2.5 py-1 rounded-lg text-xs">
                      Seat {p.seat_number}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fare summary details */}
            <div className="border-t-2 border-dashed border-gray-200 pt-5 flex justify-between items-baseline">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Fare Received</span>
                <div className="text-[9px] text-emerald-600 font-bold">Cash payment captured</div>
              </div>
              <span className="text-2xl font-black text-blue-600">{formatPrice(bookingResult.data?.total_amount)}</span>
            </div>

            {/* Actions for agent */}
            <div className="flex gap-4 pt-4 print:hidden">
              <button
                onClick={handleResetForm}
                className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-xs transition-premium"
              >
                Close & Next Booking
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 transition-premium"
              >
                <HiPrinter className="w-5 h-5" />
                <span>Print Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDesk;
