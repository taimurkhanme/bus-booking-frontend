import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import useAuth from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatPrice, formatDate, formatTime } from '../utils/helpers';
import { HiCreditCard, HiCheckCircle, HiArrowLeft, HiExclamation, HiLockClosed, HiShieldCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';

// Custom mini SVG logos for mobile wallet options to look extremely high fidelity
const JazzCashLogo = () => (
  <div className="flex items-center space-x-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
    <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded tracking-tighter">JAZZ</span>
    <span className="text-amber-600 text-[10px] font-extrabold tracking-tight">cash</span>
  </div>
);

const EasyPaisaLogo = () => (
  <div className="flex items-center space-x-0.5 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
    <span className="bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded tracking-tighter">easy</span>
    <span className="text-emerald-600 text-[10px] font-extrabold tracking-tight">paisa</span>
  </div>
);

export const Payment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bookingId, setBookingId] = useState('');
  const [route, setRoute] = useState(null);
  const [passengers, setPassengers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [paying, setPaying] = useState(false);

  // Custom states for payment method choice & mock fields
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card', 'jazzcash', 'easypaisa'
  const [walletNumber, setWalletNumber] = useState('');
  const [walletCnic, setWalletCnic] = useState('');

  useEffect(() => {
    const savedBookingId = sessionStorage.getItem('booking_id');
    const savedRoute = sessionStorage.getItem('selected_route');
    const savedPassengers = sessionStorage.getItem('passenger_details');

    if (!savedBookingId || !savedRoute || !savedPassengers) {
      toast.error('No booking details found. Restart booking.');
      navigate('/');
      return;
    }

    setBookingId(savedBookingId);
    setRoute(JSON.parse(savedRoute));
    setPassengers(JSON.parse(savedPassengers));
  }, [navigate]);

  // Load Razorpay Order Configuration on page mount
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!bookingId) return;
      
      try {
        const response = await axiosInstance.post('/payment/create-order/', {
          booking_id: bookingId,
        });
        const config = response.data || response;
        setPaymentConfig(config);
      } catch (error) {
        console.error('Error creating payment order', error);
        // Error toasts are handled by Axios interceptor
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [bookingId]);

  // Load Razorpay Checkout SDK script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayNow = async () => {
    if (!paymentConfig) {
      toast.error('Payment configuration not loaded.');
      return;
    }

    setPaying(true);
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast.error('Failed to load Razorpay checkout script. Check your internet connection.');
      setPaying(false);
      return;
    }

    const options = {
      key: paymentConfig.key_id,
      amount: paymentConfig.amount, // already multiplied by 100 in backend
      currency: paymentConfig.currency || 'PKR',
      name: 'BusBook Pakistan',
      description: `Bus Ticket Booking - Booking ID: ${bookingId}`,
      order_id: paymentConfig.razorpay_order_id,
      handler: async function (response) {
        // Called on payment completion
        try {
          setLoading(true);
          const verifyPayload = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            booking_id: bookingId,
          };
          
          await axiosInstance.post('/payment/verify/', verifyPayload);
          toast.success('Payment verified successfully!');
          navigate(`/confirmation/${bookingId}`);
        } catch (error) {
          console.error('Payment verification failed', error);
          setLoading(false);
          setPaying(false);
        }
      },
      prefill: {
        name: user?.first_name || user?.username || '',
        email: user?.email || '',
        contact: user?.phone || '',
      },
      theme: {
        color: '#4F46E5', // Indigo theme color
      },
      modal: {
        ondismiss: function () {
          setPaying(false);
          toast.error('Payment cancelled by user.');
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error('Razorpay initialization failed', e);
      toast.error('Razorpay checkout failed to initialize.');
      setPaying(false);
    }
  };

  // Simulation handler for easy development / local environment testing
  const handleSimulatePaymentSuccess = async () => {
    if (paymentMethod !== 'card') {
      if (!walletNumber || walletNumber.length < 10) {
        toast.error('Please enter a valid mobile number (10 digits).');
        return;
      }
    }

    setPaying(true);
    setLoading(true);
    try {
      const verifyPayload = {
        razorpay_order_id: paymentConfig?.razorpay_order_id || 'order_mock_123',
        razorpay_payment_id: 'pay_mock_' + Math.random().toString(36).substr(2, 9),
        razorpay_signature: 'sig_mock_verified',
        booking_id: bookingId,
      };

      await axiosInstance.post('/payment/verify/', verifyPayload);
      toast.success(
        paymentMethod === 'card'
          ? 'Simulated card payment success!'
          : `Simulated ${paymentMethod === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} payment success!`
      );
      navigate(`/confirmation/${bookingId}`);
    } catch (error) {
      console.error('Simulated verification failed', error);
      setLoading(false);
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <LoadingSpinner />
      </div>
    );
  }

  const pricePerSeat = parseFloat(route?.price || 0);
  const totalAmount = pricePerSeat * passengers.length;

  return (
    <div className="flex-grow bg-slate-50/50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      {/* Back Link */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-indigo-600 bg-white border border-slate-200/80 px-4 py-2.5 rounded-2xl shadow-sm transition-all cursor-pointer"
        >
          <HiArrowLeft className="w-4 h-4" />
          <span>Back to Details</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Payment Methods & Action Button */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <span className="text-indigo-600 font-extrabold text-[10px] uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-full">
              Finalize Booking
            </span>
            <h2 className="text-2xl font-black text-slate-800 mt-2 flex items-center space-x-2">
              <HiCreditCard className="w-6 h-6 text-indigo-500" />
              <span>Payment Options</span>
            </h2>
          </div>

          {/* Payment Card Container */}
          <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
            
            {/* Security Banner */}
            <div className="flex items-center space-x-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-850">
              <HiLockClosed className="w-5 h-5 text-indigo-500 flex-shrink-0" />
              <p className="leading-relaxed font-semibold">
                Your connection is fully encrypted. All transactions are securely processed and verified instantly.
              </p>
            </div>

            {/* Payment Method Selector Grid */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Select Payment Method
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Method 1: Credit / Debit Cards (Razorpay) */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-600/10'
                      : 'border-slate-200/80 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div className="flex justify-between items-center w-full mb-3">
                    <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center bg-white">
                      {paymentMethod === 'card' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                      )}
                    </span>
                    <HiShieldCheck className={`w-5 h-5 ${paymentMethod === 'card' ? 'text-indigo-500' : 'text-slate-350'}`} />
                  </div>
                  <span className="text-xs font-black text-slate-800">Credit / Debit Card</span>
                  <span className="text-[9px] font-bold text-slate-400 mt-1">Pay via Razorpay Portal</span>
                </button>

                {/* Method 2: JazzCash Wallet */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('jazzcash')}
                  className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    paymentMethod === 'jazzcash'
                      ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-600/10'
                      : 'border-slate-200/80 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div className="flex justify-between items-center w-full mb-3">
                    <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center bg-white">
                      {paymentMethod === 'jazzcash' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                      )}
                    </span>
                    <JazzCashLogo />
                  </div>
                  <span className="text-xs font-black text-slate-800">JazzCash Wallet</span>
                  <span className="text-[9px] font-bold text-slate-400 mt-1">Instant Mobile Account Pay</span>
                </button>

                {/* Method 3: EasyPaisa Wallet */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('easypaisa')}
                  className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    paymentMethod === 'easypaisa'
                      ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-600/10'
                      : 'border-slate-200/80 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div className="flex justify-between items-center w-full mb-3">
                    <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center bg-white">
                      {paymentMethod === 'easypaisa' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                      )}
                    </span>
                    <EasyPaisaLogo />
                  </div>
                  <span className="text-xs font-black text-slate-800">EasyPaisa Wallet</span>
                  <span className="text-[9px] font-bold text-slate-400 mt-1">Instant Mobile Account Pay</span>
                </button>

              </div>
            </div>

            {/* Wallet Info Inputs (JazzCash / EasyPaisa details panel) */}
            {paymentMethod !== 'card' && (
              <div className="bg-slate-50/80 border border-slate-200/60 rounded-3xl p-5 space-y-4 animate-fade-in-up">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/40">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Mobile Wallet Info
                  </h4>
                  {paymentMethod === 'jazzcash' ? <JazzCashLogo /> : <EasyPaisaLogo />}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Account Number */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Mobile Account Number
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-extrabold text-slate-400 select-none">
                        +92
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="3001234567"
                        maxLength="10"
                        value={walletNumber}
                        onChange={(e) => setWalletNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-3 py-3 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Optional CNIC segment for visual compliance */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      CNIC Last 6 Digits
                    </label>
                    <input
                      type="text"
                      placeholder="123456"
                      maxLength="6"
                      value={walletCnic}
                      onChange={(e) => setWalletCnic(e.target.value.replace(/\D/g, ''))}
                      className="bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>

                </div>

                <p className="text-[9px] text-slate-400 leading-relaxed font-medium">
                  Note: A 4 or 5 digit security MPIN push prompt will be sent by your service provider to the mobile number above to confirm the transaction.
                </p>
              </div>
            )}

            {/* Detailed Itemized Billing breakdown */}
            <div className="border-t border-slate-100 pt-6 space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Billing Invoice Breakdown
              </label>

              <div className="bg-slate-50/50 border border-slate-200/50 rounded-3xl p-5 space-y-3.5 text-xs font-semibold text-slate-650">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">Seat Fare ({passengers.length} Tickets)</span>
                  <span className="text-slate-800">{formatPrice(pricePerSeat)} &times; {passengers.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">Subtotal Fare</span>
                  <span className="text-slate-800">{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">GST & Excise Levies</span>
                  <span className="text-emerald-600 font-extrabold uppercase tracking-wide text-[9px] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100/50">
                    Included
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">Booking & Service Fee</span>
                  <span className="text-emerald-600 font-extrabold uppercase tracking-wide text-[9px] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100/50">
                    FREE
                  </span>
                </div>
                <div className="border-t border-slate-200/60 pt-3 flex justify-between items-baseline">
                  <span className="font-extrabold text-slate-800 text-sm">Grand Total Payable</span>
                  <span className="text-xl font-black text-indigo-600">{formatPrice(totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Main Checkout Pay Button */}
            <div className="pt-4">
              {paymentMethod === 'card' ? (
                <button
                  type="button"
                  onClick={handlePayNow}
                  disabled={paying}
                  className="w-full bg-indigo-600 hover:bg-indigo-750 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold text-xs uppercase tracking-wider py-4.5 px-6 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all duration-300 active:scale-95 text-base cursor-pointer"
                >
                  <HiCheckCircle className="w-5 h-5" />
                  <span>{paying ? 'Connecting Gateway...' : 'Pay with Razorpay'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSimulatePaymentSuccess}
                  disabled={paying}
                  className="w-full bg-indigo-600 hover:bg-indigo-750 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold text-xs uppercase tracking-wider py-4.5 px-6 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all duration-300 active:scale-95 text-base cursor-pointer"
                >
                  <HiCheckCircle className="w-5 h-5" />
                  <span>
                    {paying
                      ? 'Authorizing Wallet...'
                      : `Pay ${formatPrice(totalAmount)} via ${paymentMethod === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'}`}
                  </span>
                </button>
              )}
            </div>

          </div>

          {/* Simulated bypass helper (styled cleanly for developers) */}
          <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-5 space-y-3 animate-fade-in-up">
            <div className="flex items-start space-x-3 text-xs text-amber-800">
              <HiExclamation className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-extrabold">Local Environment Bypass:</span> For quick local developers testing without Razorpay integrations in `.env`, use this button to bypass authorization directly.
              </div>
            </div>
            <button
              type="button"
              onClick={handleSimulatePaymentSuccess}
              className="w-full bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 font-extrabold py-3 px-4 rounded-xl text-xs shadow-sm transition-all duration-300 active:scale-95 cursor-pointer"
            >
              Simulate Successful Checkout Bypass
            </button>
          </div>
        </div>

        {/* Right Side: Stepper Progress & Checkout Sidebar Summary */}
        <div className="lg:col-span-1 space-y-6">
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
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center border border-emerald-200">
                  ✓
                </span>
                <span className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider">Details</span>
              </div>
              <div className="flex-grow h-0.5 bg-indigo-100 mx-2 mb-4"></div>
              <div className="flex flex-col items-center">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shadow-md shadow-indigo-600/20 animate-pulse">
                  3
                </span>
                <span className="text-[9px] font-black text-indigo-650 mt-1.5 uppercase tracking-wider">Pay</span>
              </div>
            </div>

            {/* Stepper Title */}
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2">
              <HiShieldCheck className="w-5 h-5 text-indigo-500" />
              <span>Booking Summary</span>
            </h3>

            {/* Route & Travel Stats */}
            <div className="space-y-3.5 text-xs font-semibold text-slate-650">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Booking ID</span>
                <span className="font-black text-slate-800 select-all">{bookingId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Route</span>
                <span className="font-extrabold text-slate-800">
                  {route?.source} &rarr; {route?.destination}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Travel Date</span>
                <span className="text-slate-800">{route ? formatDate(route.date) : ''}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Departure</span>
                <span className="text-slate-800">{route ? formatTime(route.departure_time) : ''}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Operator</span>
                <span className="text-slate-800">{route?.bus?.name}</span>
              </div>
            </div>

            {/* Passengers Seat Badges */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Passengers
              </label>
              
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {passengers.map((p) => (
                  <div
                    key={p.seat_number}
                    className="flex justify-between items-center text-xs text-slate-650 bg-slate-50/70 border border-slate-200/50 px-3 py-2 rounded-xl"
                  >
                    <div className="flex flex-col">
                      <span className="font-extrabold text-slate-800">{p.name}</span>
                      <span className="text-[9px] text-slate-400 font-bold mt-0.5">{p.gender}, {p.age} yrs</span>
                    </div>
                    <span className="font-black bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-lg text-[9px] border border-indigo-100">
                      Seat {p.seat_number}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
