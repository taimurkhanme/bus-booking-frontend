import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import useAuth from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import { HiUser, HiPhone, HiMail, HiLockClosed, HiTicket, HiCalendar } from 'react-icons/hi';
import toast from 'react-hot-toast';

export const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  
  // Profile form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [picPreview, setPicPreview] = useState('');
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  // Stats state
  const [stats, setStats] = useState({ totalBookings: 0, upcomingTrips: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Initialize fields
  useEffect(() => {
    if (user) {
      setName(user.first_name || user.username || '');
      setPhone(user.phone || '');
      setPicPreview(user.profile_picture || '');
    }
  }, [user]);

  // Fetch bookings to calculate stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axiosInstance.get('/bookings/');
        const bookings = response.data || response;
        if (Array.isArray(bookings)) {
          const todayStr = new Date().toISOString().split('T')[0];
          const total = bookings.length;
          const upcoming = bookings.filter(
            (b) => (b.status === 'CONFIRMED' || b.status === 'PENDING') && b.travel_date >= todayStr
          ).length;
          setStats({ totalBookings: total, upcomingTrips: upcoming });
        }
      } catch (error) {
        console.error('Failed to load user stats on profile page', error);
      } finally {
        setStatsLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setPicPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!name || name.trim().length < 2) {
      toast.error('Please enter a valid name (min 2 characters).');
      return;
    }

    // Phone format validation
    const phoneRegex = /^03\d{2}-\d{7}$/;
    if (!phoneRegex.test(phone)) {
      toast.error('Please enter phone in format: 03XX-XXXXXXX (e.g. 0300-1234567).');
      return;
    }

    setProfileSubmitting(true);
    try {
      // Support multipart form-data for profile pictures
      let payload;
      if (profilePic) {
        const formData = new FormData();
        formData.append('first_name', name);
        formData.append('phone', phone);
        formData.append('profile_picture', profilePic);
        payload = formData;
      } else {
        payload = {
          first_name: name,
          phone: phone,
        };
      }
      
      await updateProfile(payload);
    } catch (error) {
      console.error('Profile update error', error);
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      toast.error('Please fill in all password fields!');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setPasswordSubmitting(true);
    try {
      await changePassword(oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      console.error('Password change error', error);
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      <h2 className="text-2xl font-extrabold text-gray-800 mb-8 flex items-center space-x-2">
        <HiUser className="w-6 h-6 text-blue-500" />
        <span>My Profile</span>
      </h2>

      {/* Profile page grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Stats and Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* User Profile Card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm text-center flex flex-col items-center space-y-4">
            <div className="relative">
              {picPreview ? (
                <img
                  src={picPreview}
                  alt={user?.first_name || user?.username}
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-50 shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-100 border-4 border-blue-50 text-blue-600 flex items-center justify-center text-4xl font-extrabold shadow-md">
                  {(user?.first_name || user?.username || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-extrabold text-gray-800 text-lg">{user?.first_name || user?.username}</h3>
              <p className="text-xs text-gray-400 font-medium font-sans mt-0.5">{user?.email}</p>
            </div>
          </div>

          {/* Booking Stats Card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Booking Statistics</h3>
            
            {statsLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-2xl p-4 flex flex-col items-center">
                  <HiTicket className="w-6 h-6 text-blue-600 mb-2" />
                  <span className="text-2xl font-black text-blue-800">{stats.totalBookings}</span>
                  <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mt-1">Total Bookings</span>
                </div>

                <div className="bg-emerald-50 rounded-2xl p-4 flex flex-col items-center">
                  <HiCalendar className="w-6 h-6 text-emerald-600 mb-2" />
                  <span className="text-2xl font-black text-emerald-800">{stats.upcomingTrips}</span>
                  <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mt-1">Upcoming Trips</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Edit Profile details */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <h3 className="font-bold text-gray-800 text-base border-b border-gray-100 pb-3">
              Profile Settings
            </h3>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full name input */}
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

                {/* Phone number input */}
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
              </div>

              {/* Profile Pic Upload */}
              <div className="flex flex-col space-y-1 pt-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Update Profile Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePicChange}
                  className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={profileSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-2.5 px-6 rounded-xl text-xs shadow-md transition-premium"
                >
                  {profileSubmitting ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password settings */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <h3 className="font-bold text-gray-800 text-base border-b border-gray-100 pb-3">
              Security Settings (Change Password)
            </h3>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Old password */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Current Password
                </label>
                <div className="relative">
                  <HiLockClosed className="absolute left-3.5 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-premium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* New password */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    New Password
                  </label>
                  <div className="relative">
                    <HiLockClosed className="absolute left-3.5 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-premium"
                    />
                  </div>
                </div>

                {/* Confirm new password */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <HiLockClosed className="absolute left-3.5 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-premium"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-2.5 px-6 rounded-xl text-xs shadow-md transition-premium"
                >
                  {passwordSubmitting ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
