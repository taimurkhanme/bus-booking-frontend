import React from 'react';
import toast from 'react-hot-toast';
import { GiSteeringWheel } from 'react-icons/gi';

export const SeatMap = ({ seats = [], selectedSeats = [], onSeatToggle }) => {
  // Find grid dimensions
  const maxRow = Math.max(...seats.map((s) => s.row || s.row_number || 1), 1);
  const maxCol = Math.max(...seats.map((s) => s.col || s.column_number || 4), 4);

  // Group seats by row for rendering
  const rows = [];
  for (let r = 1; r <= maxRow; r++) {
    const rowSeats = [];
    for (let c = 1; c <= maxCol; c++) {
      const seat = seats.find(
        (s) => (s.row || s.row_number) === r && (s.col || s.column_number) === c
      );
      rowSeats.push(seat || null);
    }
    rows.push(rowSeats);
  }

  const handleSeatClick = (seat) => {
    if (!seat) return;
    if (seat.is_booked) {
      toast.error('This seat is already booked!');
      return;
    }

    const seatNum = seat.seat_number;
    const isAlreadySelected = selectedSeats.includes(seatNum);

    if (!isAlreadySelected && selectedSeats.length >= 6) {
      toast.error('You can select a maximum of 6 seats per booking.');
      return;
    }

    onSeatToggle(seatNum);
  };

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm flex flex-col items-center">
      {/* Front of Bus indicator */}
      <div className="w-full max-w-xs border-b-2 border-dashed border-gray-300 pb-4 mb-6 flex justify-between items-center text-gray-400">
        <span className="text-xs uppercase tracking-wider font-semibold">Front / Driver</span>
        <div className="flex items-center space-x-1 bg-gray-100 p-2 rounded-lg text-gray-500">
          <GiSteeringWheel className="w-5 h-5 animate-spin-slow" />
          <span className="text-xs font-medium">Driver</span>
        </div>
      </div>

      {/* Seat Grid */}
      <div className="space-y-3 w-full max-w-xs">
        {rows.map((rowSeats, rowIndex) => (
          <div key={rowIndex} className="flex justify-between items-center">
            {rowSeats.map((seat, colIndex) => {
              const colNumber = colIndex + 1;
              const isAisle = maxCol === 4 && colNumber === 3; // Standard 2+2 aisle before col 3
              
              const seatNum = seat ? seat.seat_number : '';
              const isBooked = seat ? seat.is_booked : false;
              const isSelected = selectedSeats.includes(seatNum);

              // Seat button classes
              let seatClass = 'w-10 h-10 rounded-lg flex items-center justify-center text-xs font-semibold shadow-sm transition-premium ';
              if (!seat) {
                seatClass += 'bg-transparent shadow-none cursor-default';
              } else if (isBooked) {
                seatClass += 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed';
              } else if (isSelected) {
                seatClass += 'bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-500 ring-offset-1';
              } else {
                seatClass += 'bg-white text-emerald-600 border border-emerald-500 hover:bg-emerald-50 hover:border-emerald-600';
              }

              return (
                <React.Fragment key={colIndex}>
                  {/* Render Aisle Spacer */}
                  {isAisle && <div className="w-8 h-10 flex items-center justify-center text-[10px] text-gray-300 font-bold uppercase tracking-wider">Aisle</div>}

                  {seat ? (
                    <button
                      type="button"
                      disabled={isBooked}
                      onClick={() => handleSeatClick(seat)}
                      className={seatClass}
                      title={`Seat ${seatNum} - ${isBooked ? 'Booked' : isSelected ? 'Selected' : 'Available'}`}
                    >
                      {isBooked ? 'X' : seatNum}
                    </button>
                  ) : (
                    <div className="w-10 h-10"></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="w-full max-w-xs border-t border-gray-100 mt-6 pt-4 grid grid-cols-3 gap-2 text-xs font-medium text-gray-500">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded border border-emerald-500 bg-white"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-blue-600"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-gray-200 border border-gray-300 flex items-center justify-center text-[8px] text-gray-400">X</div>
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
};

export default SeatMap;
