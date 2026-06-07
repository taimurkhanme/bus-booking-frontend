import React, { createContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  // Sync state with logout event from axios interceptor
  useEffect(() => {
    const handleAxiosLogout = () => {
      setUser(null);
    };

    window.addEventListener('auth-logout', handleAxiosLogout);
    return () => {
      window.removeEventListener('auth-logout', handleAxiosLogout);
    };
  }, []);

  // Fetch the latest profile on initial load if we have a token
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await axiosInstance.get('/auth/profile/');
          // Update the user profile info
          const userData = response.data || response;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('Failed to load user profile on startup', error);
          // If profile fails (e.g. token expired and refresh failed)
          // axios interceptor will handle clearing local storage
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/auth/login/', { email, password });
      const data = response.data || response;
      
      const { user: userData, access, refresh } = data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      toast.success(`Welcome back, ${userData.first_name || userData.username || 'User'}!`);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const register = async (name, email, phone, password) => {
    try {
      const response = await axiosInstance.post('/auth/register/', {
        name,
        email,
        phone,
        password,
      });
      const data = response.data || response;
      
      const { user: userData, access, refresh } = data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      toast.success('Registration successful! Welcome to BusBook.');
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    const refresh = localStorage.getItem('refresh_token');
    try {
      if (refresh) {
        await axiosInstance.post('/auth/logout/', { refresh });
      }
    } catch (error) {
      console.error('Failed to blacklist refresh token on logout', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      toast.success('Logged out successfully.');
    }
  };

  const updateProfile = async (formData) => {
    try {
      // Put request will accept multipart data if modifying profile_picture,
      // or standard json. Let's make sure it handles both.
      const headers = formData instanceof FormData 
        ? { 'Content-Type': 'multipart/form-data' }
        : { 'Content-Type': 'application/json' };
        
      const response = await axiosInstance.put('/auth/profile/', formData, { headers });
      const updatedUser = response.data || response;
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success('Profile updated successfully.');
      return updatedUser;
    } catch (error) {
      throw error;
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      await axiosInstance.post('/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      toast.success('Password changed successfully.');
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
export default AuthContext;
