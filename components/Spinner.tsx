
import React from 'react';

interface SpinnerProps {
    message?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 border-4 border-t-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      {message && <p className="mt-4 text-lg font-semibold text-[#A1887F]">{message}</p>}
    </div>
  );
};