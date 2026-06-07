import React from 'react';

export const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      <div className="relative w-16 h-16">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-pulse"></div>
        {/* Spinning gradient ring */}
        <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-purple-600 border-b-transparent border-l-transparent animate-spin"></div>
      </div>
      <p className="text-gray-500 font-medium text-sm animate-pulse tracking-wide">
        Loading details...
      </p>
    </div>
  );
};

export default LoadingSpinner;
