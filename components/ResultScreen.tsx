
import React from 'react';
import type { ResultContent } from '../types';
import { Spinner } from './Spinner';

interface ResultScreenProps {
  score: number;
  totalQuestions: number;
  onRetry: () => void;
  resultContent: ResultContent | null;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ score, totalQuestions, onRetry, resultContent }) => {
  return (
    <div className="text-center animate-fade-in flex flex-col items-center">
      <h2 className="text-4xl font-bold mb-4">最終結果</h2>
      <p className="text-lg">あなたのスコア</p>
      <p className="text-7xl font-bold text-amber-500 my-2">
        {score} <span className="text-4xl text-[#A1887F]">/ {totalQuestions}</span>
      </p>
      
      {resultContent ? (
        <div className="mt-4 animate-fade-in">
          <p className="text-3xl font-bold text-[#6D4C41]">{resultContent.rank}</p>
          <p className="text-md md:text-lg max-w-2xl mx-auto mt-4 leading-relaxed">{resultContent.message}</p>
        </div>
      ) : (
        <Spinner message="あなたの称号を生成中..." />
      )}

      <button
        onClick={onRetry}
        className="mt-10 bg-amber-500 text-white font-bold py-4 px-10 rounded-full text-lg uppercase tracking-wider transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-300 shadow-lg"
      >
        もう一度挑戦する
      </button>
    </div>
  );
};