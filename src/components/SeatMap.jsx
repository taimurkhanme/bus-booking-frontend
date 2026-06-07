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
    <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-[2rem] p-6 shadow-sm flex flex-col items-center w-full max-w-sm">
      {/* Front of Bus indicator */}
      <div className="w-full border-b border-slate-150 pb-4 mb-6 flex justify-between items-center text-slate-450">
        <span className="text-[10px] uppercase tracking-wider font-black">Driver & Cabin Separator</span>
        <div className="flex items-center space-x-1.5 bg-slate-100 border border-slate-200/50 px-3 py-1.5 rounded-xl text-slate-600">
          <GiSteeringWheel className="w-5 h-5 animate-spin-slow text-indigo-550" />
          <span className="text-[10px] font-black uppercase tracking-wider">Driver</span>
        </div>
      </div>

      {/* Seat Grid */}
      <div className="space-y-3.5 w-full px-2">
        {rows.map((rowSeats, rowIndex) => (
          <div key={rowIndex} className="flex justify-between items-center gap-2">
            {rowSeats.map((seat, colIndex) => {
              const colNumber = colIndex + 1;
              const isAisle = maxCol === 4 && colNumber === 3; // Standard 2+2 aisle before col 3
              
              const seatNum = seat ? seat.seat_number : '';
              const isBooked = seat ? seat.is_booked : false;
              const isSelected = selectedSeats.includes(seatNum);
              const isLadiesSeat = seat && (seat.row_number === 1 || seat.row_number === 2);

              // Seat button classes
              let seatClass = 'w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-sm transition-all duration-300 active:scale-95 ';
              if (!seat) {
                seatClass += 'bg-transparent shadow-none cursor-default';
              } else if (isBooked) {
                if (isLadiesSeat) {
                  seatClass += 'bg-rose-50 text-rose-300 border border-rose-150 cursor-not-allowed';
                } else {
                  seatClass += 'bg-slate-100 text-slate-350 border border-slate-200 cursor-not-allowed';
                }
              } else if (isSelected) {
                seatClass += 'bg-gradient-to-tr from-indigo-500 via-indigo-600 to-indigo-650 text-white hover:from-indigo-600 hover:to-indigo-700 ring-2 ring-indigo-500/40 shadow-md shadow-indigo-600/10 scale-105';
              } else {
                if (isLadiesSeat) {
                  seatClass += 'bg-white text-rose-500 border border-rose-350 hover:bg-rose-50/20 hover:border-rose-400 hover:shadow-sm hover:shadow-rose-450/15';
                } else {
                  seatClass += 'bg-white text-emerald-600 border border-emerald-400 hover:bg-emerald-50/20 hover:border-emerald-500 hover:shadow-sm hover:shadow-emerald-500/15';
                }
              }

              return (
                <React.Fragment key={colIndex}>
                  {/* Render Aisle Spacer */}
                  {isAisle && (
                    <div className="w-6 h-10 flex items-center justify-center">
                      <div className="h-full w-0.5 bg-slate-100 border-l border-dashed border-slate-200"></div>
                    </div>
                  )}

                  {seat ? (
                    <button
                      type="button"
                      disabled={isBooked}
                      onClick={() => handleSeatClick(seat)}
                      className={seatClass}
                      title={`Seat ${seatNum} - ${isBooked ? 'Booked' : isSelected ? 'Selected' : isLadiesSeat ? 'Ladies Preferred' : 'Available'}`}
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
      <div className="w-full border-t border-slate-100 mt-6 pt-5 grid grid-cols-2 gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        <div className="flex items-center space-x-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
          <div className="w-4 h-4 rounded-md border border-emerald-400 bg-white"></div>
          <span className="text-slate-600">Available</span>
        </div>
        <div className="flex items-center space-x-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
          <div className="w-4 h-4 rounded-md border border-rose-350 bg-white"></div>
          <span className="text-rose-500">Ladies</span>
        </div>
        <div className="flex items-center space-x-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
          <div className="w-4 h-4 rounded bg-gradient-to-tr from-indigo-500 to-indigo-650"></div>
          <span className="text-indigo-600">Selected</span>
        </div>
        <div className="flex items-center space-x-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
          <div className="w-4 h-4 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-[8px] text-slate-400">X</div>
          <span className="text-slate-500">Booked</span>
        </div>
      </div>
    </div>
  );
};

export default SeatMap;
