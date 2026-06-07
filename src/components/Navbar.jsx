import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { HiMenu, HiX, HiUser, HiLogout, HiTicket, HiHome } from 'react-icons/hi';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsOpen(false);
    setShowDropdown(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass sticky top-0 z-50 border-b border-gray-200/80 shadow-sm transition-premium">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-2xl font-bold tracking-tight">
              <span className="text-blue-600 transition-all duration-300 hover:scale-110">🚌</span>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                BusBook
              </span>
              <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
                PK
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`flex items-center space-x-1 font-medium text-sm transition-premium hover:text-blue-600 ${
                isActive('/') ? 'text-blue-600 border-b-2 border-blue-600 py-1' : 'text-gray-600'
              }`}
            >
              <HiHome className="w-4 h-4" />
              <span>Home</span>
            </Link>

            {isAuthenticated && (
              <Link
                to="/my-bookings"
                className={`flex items-center space-x-1 font-medium text-sm transition-premium hover:text-blue-600 ${
                  isActive('/my-bookings') ? 'text-blue-600 border-b-2 border-blue-600 py-1' : 'text-gray-600'
                }`}
              >
                <HiTicket className="w-4 h-4" />
                <span>My Bookings</span>
              </Link>
            )}

            {isAuthenticated && user?.is_staff && (
              <>
                <Link
                  to="/agent-desk"
                  className={`flex items-center space-x-1 font-medium text-sm transition-premium hover:text-blue-600 ${
                    isActive('/agent-desk') ? 'text-blue-600 border-b-2 border-blue-600 py-1' : 'text-gray-600'
                  }`}
                >
                  <span>💻 Agent Desk</span>
                </Link>
                <Link
                  to="/admin"
                  className={`flex items-center space-x-1 font-medium text-sm transition-premium hover:text-blue-600 ${
                    isActive('/admin') ? 'text-blue-600 border-b-2 border-blue-600 py-1' : 'text-gray-600'
                  }`}
                >
                  <span>🛠️ Admin</span>
                </Link>
              </>
            )}
          </div>

          {/* Desktop User Panel */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 bg-white border border-gray-200/80 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-premium"
                >
                  {user.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={user.first_name || user.username}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      {(user.first_name || user.username || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span>{user.first_name || user.username}</span>
                </button>

                {showDropdown && (
                  <>
                    {/* Backdrop to close dropdown on clicking outside */}
                    <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 animate-fade-in-up">
                      <Link
                        to="/profile"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-premium"
                      >
                        <HiUser className="w-4 h-4 text-gray-400" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        to="/my-bookings"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-premium"
                      >
                        <HiTicket className="w-4 h-4 text-gray-400" />
                        <span>My Bookings</span>
                      </Link>
                      <hr className="border-gray-100 my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-premium"
                      >
                        <HiLogout className="w-4 h-4 text-red-400" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-premium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-premium"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-premium"
            >
              {isOpen ? <HiX className="h-6 w-6" /> : <HiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-fade-in-up">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-base font-medium transition-premium ${
                isActive('/') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
              }`}
            >
              <HiHome className="w-5 h-5" />
              <span>Home</span>
            </Link>

            {isAuthenticated && (
              <Link
                to="/my-bookings"
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-base font-medium transition-premium ${
                  isActive('/my-bookings') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                <HiTicket className="w-5 h-5" />
                <span>My Bookings</span>
              </Link>
            )}

            {isAuthenticated && user?.is_staff && (
              <>
                <Link
                  to="/agent-desk"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-base font-medium transition-premium ${
                    isActive('/agent-desk') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                >
                  <span>💻 Agent Desk</span>
                </Link>
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-base font-medium transition-premium ${
                    isActive('/admin') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                >
                  <span>🛠️ Admin Dashboard</span>
                </Link>
              </>
            )}

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-base font-medium transition-premium ${
                    isActive('/profile') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                >
                  <HiUser className="w-5 h-5" />
                  <span>My Profile</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 transition-premium"
                >
                  <HiLogout className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="pt-4 pb-2 border-t border-gray-100 flex flex-col space-y-2 px-3">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-premium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-premium"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
