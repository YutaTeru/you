
import React from 'react';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="text-center animate-fade-in flex flex-col items-center">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-shadow mb-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
        実戦！英検®風クイズ
      </h1>
      <p className="text-xl sm:text-2xl text-[#A1887F] italic mb-8">
        - English Vocabulary Challenge -
      </p>
      <button
        onClick={onStart}
        className="bg-amber-500 text-white font-bold py-4 px-10 rounded-full text-lg uppercase tracking-wider transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-300 shadow-lg"
      >
        挑戦する
      </button>
    </div>
  );
};