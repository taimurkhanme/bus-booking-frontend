import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and errors
axiosInstance.interceptors.response.use(
  (response) => {
    // If the backend wraps the data in standard error format:
    // Success: { success: true, data: {...}, message: "..." }
    if (response.data && response.data.hasOwnProperty('success')) {
      if (!response.data.success) {
        const errMsg = response.data.error || 'Something went wrong';
        toast.error(errMsg);
        return Promise.reject(new Error(errMsg));
      }
      return response.data; // Return the inner data directly for easy component use
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 (Unauthorized) and we haven't retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          // Attempt to refresh the access token
          const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          
          // Save the new access token
          const newAccessToken = response.data.access;
          localStorage.setItem('access_token', newAccessToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Refresh failed - clean up auth state and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          
          // Trigger a custom event to notify AuthContext to update state
          window.dispatchEvent(new Event('auth-logout'));
          
          toast.error('Session expired. Please log in again.');
          // Redirect to login page if we aren't already there
          if (!window.location.pathname.endsWith('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth-logout'));
        if (!window.location.pathname.endsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }
    
    // Display error message
    let errorMessage = 'An unexpected error occurred.';
    if (error.response) {
      const data = error.response.data;
      if (data && data.error) {
        errorMessage = data.error;
      } else if (data && data.detail) {
        errorMessage = data.detail;
      } else if (data && typeof data === 'object') {
        // Flatten django validation errors
        errorMessage = Object.values(data).flat().join(' ') || errorMessage;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    toast.error(errorMessage);
    return Promise.reject(error);
  }
);

export default axiosInstance;
