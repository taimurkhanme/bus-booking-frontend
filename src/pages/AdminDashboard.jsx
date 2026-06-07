import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import useAuth from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatPrice, formatDate, formatTime } from '../utils/helpers';
import {
  HiPlus,
  HiX,
  HiRefresh,
  HiCheck,
  HiTrash,
  HiTruck,
  HiCalendar,
  HiTicket,
  HiTrendingUp,
  HiUsers,
  HiEye,
  HiBan
} from 'react-icons/hi';
import toast from 'react-hot-toast';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if not staff/admin
  useEffect(() => {
    if (user && !user.is_staff) {
      toast.error('Access Denied. Admin Dashboard is only for staff members.');
      navigate('/');
    }
  }, [user, navigate]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [bookings, setBookings] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);

  // Active tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Search/Filters states
  const [bookingSearch, setBookingSearch] = useState('');
  const [routeSearch, setRouteSearch] = useState('');
  const [busSearch, setBusSearch] = useState('');

  // Modals state
  const [showAddBusModal, setShowAddBusModal] = useState(false);
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);

  // New Bus form state
  const [newBus, setNewBus] = useState({
    name: '',
    bus_number: '',
    total_seats: '40',
    bus_type: 'AC',
    amenities: 'wifi, charging point, water bottle',
    is_active: true
  });

  // New Route form state
  const [newRoute, setNewRoute] = useState({
    bus_id: '',
    source: '',
    destination: '',
    departure_time: '',
    arrival_time: '',
    price: '',
    date: '',
    is_active: true
  });

  // Fetch all data
  const fetchData = async (showToast = false) => {
    setRefreshing(true);
    try {
      const [bookingsRes, routesRes, busesRes] = await Promise.all([
        axiosInstance.get('/bookings/'),
        axiosInstance.get('/routes/'),
        axiosInstance.get('/buses/')
      ]);

      const bookingsData = bookingsRes.data || bookingsRes;
      const routesData = routesRes.data || routesRes;
      const busesData = busesRes.data || busesRes;

      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setRoutes(Array.isArray(routesData) ? routesData : []);
      setBuses(Array.isArray(busesData) ? busesData : []);

      if (showToast) {
        toast.success('Dashboard data refreshed!');
      }
    } catch (err) {
      console.error('Error fetching admin data', err);
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.is_staff) {
      fetchData();
    }
  }, [user]);

  // Statistics calculation
  const totalRevenue = bookings
    .filter((b) => b.payment_status === 'PAID')
    .reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);

  const pendingBookingsCount = bookings.filter((b) => b.status === 'PENDING').length;
  const activeRoutesCount = routes.filter((r) => r.is_active).length;
  const fleetSize = buses.length;

  // Handle Bus creation
  const handleCreateBus = async (e) => {
    e.preventDefault();
    if (!newBus.name || !newBus.bus_number || !newBus.total_seats) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      const payload = {
        ...newBus,
        total_seats: parseInt(newBus.total_seats)
      };

      await axiosInstance.post('/buses/', payload);
      toast.success('Bus added successfully to fleet!');
      setShowAddBusModal(false);
      // Reset form
      setNewBus({
        name: '',
        bus_number: '',
        total_seats: '40',
        bus_type: 'AC',
        amenities: 'wifi, charging point, water bottle',
        is_active: true
      });
      fetchData();
    } catch (err) {
      console.error('Error adding bus', err);
      const errors = err.response?.data?.error || err.response?.data;
      if (errors && typeof errors === 'object') {
        const errorMsg = Object.entries(errors)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join('\n');
        toast.error(`Failed to add bus:\n${errorMsg}`);
      } else {
        toast.error('Failed to add bus to fleet.');
      }
    }
  };

  // Handle Route creation
  const handleCreateRoute = async (e) => {
    e.preventDefault();
    if (!newRoute.bus_id || !newRoute.source || !newRoute.destination || !newRoute.departure_time || !newRoute.arrival_time || !newRoute.price || !newRoute.date) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      const payload = {
        bus_id: parseInt(newRoute.bus_id),
        source: newRoute.source,
        destination: newRoute.destination,
        departure_time: newRoute.departure_time,
        arrival_time: newRoute.arrival_time,
        price: parseFloat(newRoute.price),
        date: newRoute.date,
        is_active: newRoute.is_active
      };

      await axiosInstance.post('/routes/', payload);
      toast.success('Route added successfully!');
      setShowAddRouteModal(false);
      // Reset form
      setNewRoute({
        bus_id: '',
        source: '',
        destination: '',
        departure_time: '',
        arrival_time: '',
        price: '',
        date: '',
        is_active: true
      });
      fetchData();
    } catch (err) {
      console.error('Error adding route', err);
      const errors = err.response?.data?.error || err.response?.data;
      if (errors && typeof errors === 'object') {
        const errorMsg = Object.entries(errors)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join('\n');
        toast.error(`Failed to add route:\n${errorMsg}`);
      } else {
        toast.error('Failed to add route.');
      }
    }
  };

  // Handle Booking Status / Payment Status update
  const handleUpdateBookingStatus = async (bookingId, statusVal, paymentStatusVal) => {
    const payload = {};
    if (statusVal) payload.status = statusVal;
    if (paymentStatusVal) payload.payment_status = paymentStatusVal;

    try {
      await axiosInstance.patch(`/bookings/${bookingId}/`, payload);
      toast.success(`Booking ${bookingId} updated successfully.`);
      fetchData();
    } catch (err) {
      console.error('Error updating booking', err);
      toast.error('Failed to update booking status.');
    }
  };

  // Filter lists based on search queries
  const filteredBookings = bookings.filter((b) => {
    const term = bookingSearch.toLowerCase();
    const guestInfo = `${b.guest_name || ''} ${b.guest_phone || ''} ${b.guest_email || ''}`.toLowerCase();
    return (
      b.booking_id.toLowerCase().includes(term) ||
      (b.route?.source || '').toLowerCase().includes(term) ||
      (b.route?.destination || '').toLowerCase().includes(term) ||
      guestInfo.includes(term)
    );
  });

  const filteredRoutes = routes.filter((r) => {
    const term = routeSearch.toLowerCase();
    return (
      r.source.toLowerCase().includes(term) ||
      r.destination.toLowerCase().includes(term) ||
      (r.bus?.name || '').toLowerCase().includes(term) ||
      (r.bus?.bus_number || '').toLowerCase().includes(term)
    );
  });

  const filteredBuses = buses.filter((b) => {
    const term = busSearch.toLowerCase();
    return (
      b.name.toLowerCase().includes(term) ||
      b.bus_number.toLowerCase().includes(term) ||
      b.bus_type.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 flex items-center space-x-2">
            <span>🛠️ Admin Management Dashboard</span>
            <span className="text-xs bg-purple-600 text-white font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
              Control Panel
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            Manage your fleet, routes, and monitor live passenger bookings.
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition-premium disabled:opacity-50"
          >
            <HiRefresh className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'bookings', label: '🎫 Bookings Manager' },
          { id: 'routes', label: '🗺️ Routes Planner' },
          { id: 'buses', label: '🚌 Fleet Manager' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-6 text-sm font-bold border-b-2 whitespace-nowrap transition-all outline-none ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex items-center space-x-5 hover:shadow-md transition-all duration-300">
              <div className="p-4 bg-purple-100 text-purple-600 rounded-2xl">
                <HiTrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Revenue</p>
                <h3 className="text-xl font-black text-gray-800 mt-1">{formatPrice(totalRevenue)}</h3>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex items-center space-x-5 hover:shadow-md transition-all duration-300">
              <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl">
                <HiTicket className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pending Bookings</p>
                <h3 className="text-xl font-black text-gray-800 mt-1">{pendingBookingsCount}</h3>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex items-center space-x-5 hover:shadow-md transition-all duration-300">
              <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl">
                <HiCalendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Routes</p>
                <h3 className="text-xl font-black text-gray-800 mt-1">{activeRoutesCount}</h3>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex items-center space-x-5 hover:shadow-md transition-all duration-300">
              <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl">
                <HiTruck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Buses Fleet Size</p>
                <h3 className="text-xl font-black text-gray-800 mt-1">{fleetSize} Buses</h3>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts / Info Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Recent Bookings Activity</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase">
                      <th className="pb-3">Booking ID</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Route</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.slice(0, 5).map((b) => (
                      <tr key={b.booking_id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="py-3 font-bold text-blue-600">{b.booking_id}</td>
                        <td className="py-3">
                          <span className="font-semibold text-gray-800">
                            {b.guest_name || 'Registered User'}
                          </span>
                          <span className="block text-[10px] text-gray-400 font-medium">
                            {b.guest_phone || 'Account User'}
                          </span>
                        </td>
                        <td className="py-3 font-medium text-gray-700">
                          {b.route?.source} &rarr; {b.route?.destination}
                        </td>
                        <td className="py-3 font-bold text-gray-800">{formatPrice(b.total_amount)}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'CONFIRMED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {bookings.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-6 text-center text-gray-400 italic">
                          No bookings captured yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Quick Actions</h3>
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => {
                    setActiveTab('buses');
                    setShowAddBusModal(true);
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-1.5 shadow-sm transition-all duration-300 text-xs"
                >
                  <HiPlus className="w-4 h-4" />
                  <span>Add New Bus</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('routes');
                    setShowAddRouteModal(true);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-1.5 shadow-sm transition-all duration-300 text-xs"
                >
                  <HiPlus className="w-4 h-4" />
                  <span>Schedule New Route</span>
                </button>
                <button
                  onClick={() => navigate('/agent-desk')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-1.5 shadow-sm transition-all duration-300 text-xs"
                >
                  <span>💻 Open Agent Desk</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">All Bookings ({filteredBookings.length})</h3>
            <div className="w-full md:w-80">
              <input
                type="text"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                placeholder="Search Booking ID, Route, or Customer..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase">
                  <th className="pb-3">ID</th>
                  <th className="pb-3">Customer Contact</th>
                  <th className="pb-3">Route / Travel Date</th>
                  <th className="pb-3">Fare Details</th>
                  <th className="pb-3">Booking Status</th>
                  <th className="pb-3">Payment Status</th>
                  <th className="pb-3 text-center">Manage / Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => (
                  <tr key={b.booking_id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-4 font-black text-blue-600">{b.booking_id}</td>
                    <td className="py-4">
                      <div className="font-bold text-gray-850">{b.guest_name || 'Account User'}</div>
                      <div className="text-[10px] text-gray-400 font-semibold">{b.guest_phone || 'Account Phone'}</div>
                      <div className="text-[9px] text-gray-450 italic">{b.guest_email || 'Account Email'}</div>
                    </td>
                    <td className="py-4">
                      <div className="font-semibold text-gray-800">
                        {b.route?.source} &rarr; {b.route?.destination}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium">
                        Dep: {formatTime(b.route?.departure_time)} ({formatDate(b.travel_date)})
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="font-bold text-gray-800">{formatPrice(b.total_amount)}</div>
                      <div className="text-[10px] text-gray-400 font-semibold">{b.passengers_count} Seats Booked</div>
                    </td>
                    <td className="py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-tight ${
                          b.status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-tight ${
                          b.payment_status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.payment_status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {b.payment_status}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {b.status === 'PENDING' && (
                          <button
                            onClick={() => handleUpdateBookingStatus(b.booking_id, 'CONFIRMED', 'PAID')}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold p-2 rounded-lg border border-emerald-100 shadow-sm transition-all"
                            title="Confirm Booking & Payment"
                          >
                            <HiCheck className="w-4 h-4" />
                          </button>
                        )}
                        {b.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleUpdateBookingStatus(b.booking_id, 'CANCELLED', 'REFUNDED')}
                            className="bg-red-50 hover:bg-red-100 text-red-500 font-bold p-2 rounded-lg border border-red-100 shadow-sm transition-all"
                            title="Cancel Booking & Refund"
                          >
                            <HiBan className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/booking/${b.booking_id}`)}
                          className="bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold p-2 rounded-lg border border-gray-200 shadow-sm transition-all"
                          title="View Details"
                        >
                          <HiEye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBookings.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-400 italic">
                      No matching bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Routes Tab */}
      {activeTab === 'routes' && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Scheduled Routes ({filteredRoutes.length})</h3>
              <button
                onClick={() => setShowAddRouteModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow-md transition-all text-xs"
              >
                <HiPlus className="w-3.5 h-3.5" />
                <span>Add Route</span>
              </button>
            </div>
            <div className="w-full md:w-80">
              <input
                type="text"
                value={routeSearch}
                onChange={(e) => setRouteSearch(e.target.value)}
                placeholder="Search Routes by City or Bus Operator..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase">
                  <th className="pb-3">Route ID</th>
                  <th className="pb-3">Departure &rarr; Destination</th>
                  <th className="pb-3">Travel Date / Times</th>
                  <th className="pb-3">Bus Operator / Vehicle</th>
                  <th className="pb-3">Seat Availability</th>
                  <th className="pb-3">Ticket Price</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoutes.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-4 font-bold text-gray-600">RT-{r.id}</td>
                    <td className="py-4">
                      <div className="font-extrabold text-gray-800">
                        {r.source} &rarr; {r.destination}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="font-bold text-purple-600">{formatDate(r.date)}</div>
                      <div className="text-[10px] text-gray-400 font-medium">
                        Dep: {formatTime(r.departure_time)} | Arr: {formatTime(r.arrival_time)}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="font-semibold text-gray-800">{r.bus?.name || 'Unassigned'}</div>
                      <div className="text-[10px] text-gray-400 font-bold tracking-tight">
                        {r.bus?.bus_number} | {r.bus?.bus_type}
                      </div>
                    </td>
                    <td className="py-4 font-bold text-gray-850">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          (r.available_seats || 0) > 10
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.available_seats} / {r.bus?.total_seats || 0} Left
                      </span>
                    </td>
                    <td className="py-4 font-black text-gray-800">{formatPrice(r.price)}</td>
                    <td className="py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {r.is_active ? 'Active' : 'Cancelled'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredRoutes.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-400 italic">
                      No matching scheduled routes found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Buses Tab */}
      {activeTab === 'buses' && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Fleet Buses ({filteredBuses.length})</h3>
              <button
                onClick={() => setShowAddBusModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow-md transition-all text-xs"
              >
                <HiPlus className="w-3.5 h-3.5" />
                <span>Add Bus</span>
              </button>
            </div>
            <div className="w-full md:w-80">
              <input
                type="text"
                value={busSearch}
                onChange={(e) => setBusSearch(e.target.value)}
                placeholder="Search Buses by Operator, registration, or type..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBuses.map((b) => (
              <div
                key={b.id}
                className="border border-gray-200 bg-white hover:border-purple-300 rounded-3xl p-5 shadow-sm space-y-4 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-850">{b.name}</h4>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                      Reg: {b.bus_number}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      b.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {b.is_active ? 'Active' : 'Suspended'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <span className="text-[9px] text-gray-400 font-bold block uppercase">Seats Capacity</span>
                    <span className="font-extrabold text-gray-800">{b.total_seats} Standard</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <span className="text-[9px] text-gray-400 font-bold block uppercase">Bus Type</span>
                    <span className="font-extrabold text-gray-850">{b.bus_type} Class</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wide">Amenities Installed</span>
                  <p className="text-xs text-gray-600 font-medium capitalize truncate">
                    {b.amenities || 'No amenities declared'}
                  </p>
                </div>
              </div>
            ))}
            {filteredBuses.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400 italic">
                No matching fleet vehicles found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Bus Modal */}
      {showAddBusModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setShowAddBusModal(false)}></div>

          <div className="bg-white border border-gray-250 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative z-10 space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-black text-gray-800 text-base">🚌 Register Fleet Vehicle</h3>
              <button
                onClick={() => setShowAddBusModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBus} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Operator / Bus Name *</label>
                <input
                  type="text"
                  required
                  value={newBus.name}
                  onChange={(e) => setNewBus({ ...newBus, name: e.target.value })}
                  placeholder="e.g. Faisal Movers"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Registration Number *</label>
                <input
                  type="text"
                  required
                  value={newBus.bus_number}
                  onChange={(e) => setNewBus({ ...newBus, bus_number: e.target.value })}
                  placeholder="e.g. BSA-482"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Total Seats *</label>
                  <input
                    type="number"
                    required
                    min="10"
                    max="60"
                    value={newBus.total_seats}
                    onChange={(e) => setNewBus({ ...newBus, total_seats: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Bus Type *</label>
                  <select
                    value={newBus.bus_type}
                    onChange={(e) => setNewBus({ ...newBus, bus_type: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="AC">AC</option>
                    <option value="Non-AC">Non-AC</option>
                    <option value="Sleeper">Sleeper</option>
                    <option value="Semi-Sleeper">Semi-Sleeper</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Amenities (Comma separated)</label>
                <input
                  type="text"
                  value={newBus.amenities}
                  onChange={(e) => setNewBus({ ...newBus, amenities: e.target.value })}
                  placeholder="e.g. wifi, charging point, water bottle"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-purple-600/10 hover:shadow-purple-600/25 transition-all duration-300"
              >
                <span>Register Bus</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Route Modal */}
      {showAddRouteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setShowAddRouteModal(false)}></div>

          <div className="bg-white border border-gray-255 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative z-10 space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-black text-gray-800 text-base">🗺️ Schedule Route</h3>
              <button
                onClick={() => setShowAddRouteModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoute} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Assigned Bus *</label>
                <select
                  required
                  value={newRoute.bus_id}
                  onChange={(e) => setNewRoute({ ...newRoute, bus_id: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">Select Bus</option>
                  {buses
                    .filter((b) => b.is_active)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.bus_number}) - {b.total_seats} seats
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">From (Source) *</label>
                  <input
                    type="text"
                    required
                    value={newRoute.source}
                    onChange={(e) => setNewRoute({ ...newRoute, source: e.target.value })}
                    placeholder="e.g. Lahore"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">To (Destination) *</label>
                  <input
                    type="text"
                    required
                    value={newRoute.destination}
                    onChange={(e) => setNewRoute({ ...newRoute, destination: e.target.value })}
                    placeholder="e.g. Karachi"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Travel Date *</label>
                  <input
                    type="date"
                    required
                    value={newRoute.date}
                    onChange={(e) => setNewRoute({ ...newRoute, date: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Price (PKR) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newRoute.price}
                    onChange={(e) => setNewRoute({ ...newRoute, price: e.target.value })}
                    placeholder="e.g. 2500"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Departure Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newRoute.departure_time}
                    onChange={(e) => setNewRoute({ ...newRoute, departure_time: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Arrival Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newRoute.arrival_time}
                    onChange={(e) => setNewRoute({ ...newRoute, arrival_time: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-purple-600/10 hover:shadow-purple-600/25 transition-all duration-300"
              >
                <span>Schedule Route</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
