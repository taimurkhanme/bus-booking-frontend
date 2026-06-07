/**
 * Format numerical price to PKR currency format
 * @param {number|string} amount
 * @returns {string} e.g. Rs. 2,500
 */
export const formatPrice = (amount) => {
  const num = parseFloat(amount) || 0;
  return `Rs. ${num.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
};

/**
 * Format date to standard readable format
 * @param {string|Date} dateStr
 * @returns {string} e.g. Mon, 10 Jun 2025
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format ISO datetime string to time AM/PM format
 * @param {string} dateTimeStr
 * @returns {string} e.g. 08:30 AM
 */
export const formatTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) {
    // If it's already just a time string like "08:30:00"
    const parts = dateTimeStr.split(':');
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    }
    return dateTimeStr;
  }
  
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Calculate duration between two datetime strings
 * @param {string} departureStr
 * @param {string} arrivalStr
 * @returns {string} e.g. "8 hrs 30 mins"
 */
export const calculateDuration = (departureStr, arrivalStr) => {
  if (!departureStr || !arrivalStr) return '';
  const dep = new Date(departureStr);
  const arr = new Date(arrivalStr);
  
  if (isNaN(dep.getTime()) || isNaN(arr.getTime())) {
    return 'N/A';
  }
  
  const diffMs = arr - dep;
  if (diffMs <= 0) return '0 mins';
  
  const totalMins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  
  if (hrs === 0) {
    return `${mins} mins`;
  }
  if (mins === 0) {
    return `${hrs} hrs`;
  }
  return `${hrs} hrs ${mins} mins`;
};

/**
 * Generate a seat label based on row and column number
 * @param {number} row
 * @param {number} col
 * @returns {string} e.g. A1, A2, B1
 */
export const generateSeatLabel = (row, col) => {
  const letter = String.fromCharCode(64 + row); // 1 -> A, 2 -> B
  return `${letter}${col}`;
};
