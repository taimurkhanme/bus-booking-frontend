import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { HiUser, HiMail, HiPhone, HiLockClosed, HiEye, HiEyeOff } from 'react-icons/hi';
import toast from 'react-hot-toast';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const validateForm = () => {
    if (!name || name.trim().length < 2) {
      toast.error('Please enter a valid full name (min 2 characters).');
      return false;
    }
    if (!email) {
      toast.error('Please enter a valid email address.');
      return false;
    }
    
    // Pakistani Phone number regex verification matching format 03XX-XXXXXXX
    const phoneRegex = /^03\d{2}-\d{7}$/;
    if (!phoneRegex.test(phone)) {
      toast.error('Please enter phone in Pakistani format: 03XX-XXXXXXX (e.g. 0300-1234567).');
      return false;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return false;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await register(name, email, phone, password);
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Registration error', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-6 animate-fade-in-up">
        {/* Title */}
        <div className="text-center">
          <span className="text-4xl">🚌</span>
          <h2 className="mt-2 text-2xl font-extrabold text-gray-800">Create An Account</h2>
          <p className="mt-1 text-xs text-gray-400 font-medium font-sans">
            Sign up to book bus tickets across Pakistan instantly
          </p>
        </div>

        {/* Registration form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <HiUser className="absolute left-3.5 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                required
                placeholder="e.g. Taimur Khan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-premium"
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <HiMail className="absolute left-3.5 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="e.g. user@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-premium"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Phone Number (03XX-XXXXXXX)
            </label>
            <div className="relative">
              <HiPhone className="absolute left-3.5 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                required
                placeholder="e.g. 0300-1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-premium"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <HiLockClosed className="absolute left-3.5 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-11 py-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-premium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <HiLockClosed className="absolute left-3.5 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-11 py-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-premium"
              />
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10 hover:shadow-blue-500/25 transition-premium text-xs"
          >
            {submitting ? 'Registering Account...' : 'Register'}
          </button>
        </form>

        {/* Footer links */}
        <div className="text-center text-xs text-gray-500">
          <span>Already have an account? </span>
          <Link
            to="/login"
            state={location.state}
            className="text-blue-600 hover:text-blue-700 font-bold hover:underline transition-premium"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
