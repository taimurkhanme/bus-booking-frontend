import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { HiMail, HiLockClosed, HiEye, HiEyeOff } from 'react-icons/hi';
import toast from 'react-hot-toast';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Get the redirect path from location state or default to Home
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields!');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      // Redirect to target path
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error', error);
      // Errors are already handled/displayed by Axios interceptor
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-6 animate-fade-in-up">
        {/* Title branding */}
        <div className="text-center">
          <span className="text-4xl">🚌</span>
          <h2 className="mt-2 text-2xl font-extrabold text-gray-800">Login to Your Account</h2>
          <p className="mt-1 text-xs text-gray-400 font-medium">
            Access your bookings and reserve bus tickets instantly
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
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

          {/* Password field */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <HiLockClosed className="absolute left-3.5 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
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

          {/* Submit action */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10 hover:shadow-blue-500/25 transition-premium text-xs"
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Footer links */}
        <div className="text-center text-xs text-gray-500">
          <span>Don't have an account? </span>
          <Link
            to="/register"
            state={location.state}
            className="text-blue-600 hover:text-blue-700 font-bold hover:underline transition-premium"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
