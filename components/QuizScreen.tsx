
import React, { useEffect, useState } from 'react';
import type { QuizQuestion } from '../types';
import { ProgressBar } from './ProgressBar';
import { Spinner } from './Spinner';

interface QuizScreenProps {
  questionData: QuizQuestion & { imageUrl: string };
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  isAnswered: boolean;
  onAnswerSelect: (answer: string) => void;
  onNext: () => void;
}

const ChoiceButton: React.FC<{
  choice: string;
  isAnswered: boolean;
  isSelected: boolean;
  isCorrect: boolean;
  onClick: () => void;
}> = ({ choice, isAnswered, isSelected, isCorrect, onClick }) => {
  const getButtonClass = () => {
    if (!isAnswered) {
      return 'bg-white border-[#A1887F] hover:bg-[#A1887F] hover:text-white';
    }
    if (isSelected) {
      return isCorrect
        ? 'bg-green-500 border-green-500 text-white animate-pulse'
        : 'bg-red-500 border-red-500 text-white animate-shake';
    }
    if (isCorrect) {
      return 'bg-green-500 border-green-500 text-white';
    }
    return 'bg-gray-200 border-gray-300 text-gray-500 opacity-70';
  };

  return (
    <button
      onClick={onClick}
      disabled={isAnswered}
      className={`w-full p-4 text-left font-semibold text-lg border-2 rounded-lg transition-all duration-300 transform disabled:cursor-not-allowed hover:scale-103 ${getButtonClass()}`}
      dangerouslySetInnerHTML={{ __html: choice }}
    />
  );
};

const PLACEHOLDER_IMAGE = 'https://picsum.photos/800/450';

export const QuizScreen: React.FC<QuizScreenProps> = ({
  questionData,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  isAnswered,
  onAnswerSelect,
  onNext
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(questionData.imageUrl);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const synth = window.speechSynthesis;
    let voices: SpeechSynthesisVoice[] = [];

    const updateVoices = () => {
      voices = synth.getVoices();
      if (voices.length > 0) {
        const preferredVoice = voices.find(v => v.name === 'Microsoft Clara Online (Natural)');
        const fallbackVoice = voices.find(v => v.lang.startsWith('en'));
        setSelectedVoice(preferredVoice || fallbackVoice || null);
      }
    };
    
    synth.addEventListener('voiceschanged', updateVoices);
    updateVoices();

    return () => {
      synth.removeEventListener('voiceschanged', updateVoices);
      if (synth.speaking) {
        synth.cancel();
      }
    };
  }, []);

  useEffect(() => {
    setImageLoaded(false);
    setImageSrc(questionData.imageUrl || PLACEHOLDER_IMAGE);
    // Cancel speech when question changes
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [questionData]);


  const handleImageError = () => {
    setImageSrc(PLACEHOLDER_IMAGE);
  };

  const handlePlaySpeech = () => {
    const synth = window.speechSynthesis;
    if (!selectedVoice) return;

    if (synth.speaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = new DOMParser().parseFromString(questionData.question, 'text/html').body.textContent || '';
    if (!textToSpeak) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.voice = selectedVoice;
    utterance.rate = 0.85; // Slightly slower
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synth.speak(utterance);
  };


  const currentAnswer = questionData.answer;

  return (
    <div className="animate-fade-in">
      <header className="mb-4">
        <div className="flex justify-between items-center text-xl font-bold mb-2">
          <span>Question {questionNumber}</span>
          <span>{questionNumber} / {totalQuestions}</span>
        </div>
        <ProgressBar progress={ (questionNumber / totalQuestions) * 100 } />
      </header>
      
      <div className="my-6">
        <div className="relative w-full aspect-video bg-gray-200 rounded-lg overflow-hidden shadow-lg mb-6">
          {!imageLoaded && <Spinner message="" />}
          <img 
            src={imageSrc} 
            alt="クイズ画像" 
            onLoad={() => setImageLoaded(true)}
            onError={handleImageError}
            className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>
        <div className="flex items-start gap-4">
            <h2 className="flex-grow text-2xl md:text-3xl font-bold leading-tight" dangerouslySetInnerHTML={{ __html: questionData.question }} />
            <button
                onClick={handlePlaySpeech}
                disabled={!selectedVoice}
                className="flex-shrink-0 mt-1 p-3 rounded-full bg-amber-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-[#EFEBE9] transition-all transform hover:scale-110"
                aria-label={isSpeaking ? "読み上げを停止" : "問題を読み上げる"}
            >
                {isSpeaking ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 5a1 1 0 011-1h8a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1V5z" clipRule="evenodd" />
                </svg>
                ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                )}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        {questionData.choices.map(choice => (
          <ChoiceButton
            key={choice}
            choice={choice}
            isAnswered={isAnswered}
            isSelected={selectedAnswer === choice}
            isCorrect={choice === currentAnswer}
            onClick={() => onAnswerSelect(choice)}
          />
        ))}
      </div>

      {isAnswered && (
        <div className="mt-6 text-center animate-fade-in">
          <div className="bg-[#FFF8E1] p-4 rounded-lg shadow-inner">
            <h3 className="font-bold text-xl text-amber-700 mb-2">
              {selectedAnswer === currentAnswer ? '正解！' : '不正解...'}
            </h3>
            <p className="text-md text-[#6D4C41]">
              <strong>正解:</strong> {currentAnswer}
            </p>
            <p className="mt-2 text-md text-left text-[#6D4C41]">
              {questionData.explanation}
            </p>
          </div>
          <button
            onClick={onNext}
            className="mt-6 bg-amber-500 text-white font-bold py-3 px-8 rounded-full hover:bg-amber-600 transition-transform transform hover:scale-105 shadow-lg"
          >
            {questionNumber < totalQuestions ? '次の問題へ' : '結果を見る'}
          </button>
        </div>
      )}
    </div>
  );
};