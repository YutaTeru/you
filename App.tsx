
import React, { useState, useCallback, useEffect } from 'react';
import { StartScreen } from './components/StartScreen';
import { QuizScreen } from './components/QuizScreen';
import { ResultScreen } from './components/ResultScreen';
import { Spinner } from './components/Spinner';
import { generateQuizQuestions, generateResultMessage, generateQuizImage } from './services/geminiService';
import type { QuizQuestion, GameState, ResultContent } from './types';
import { NUM_QUESTIONS } from './constants';

type QuizDataWithImage = QuizQuestion & { imageUrl: string };

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [quizData, setQuizData] = useState<QuizDataWithImage[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [resultContent, setResultContent] = useState<ResultContent | null>(null);

  const fetchQuizData = useCallback(async () => {
    try {
      setLoadingMessage('英語クイズを作成中...');
      const questions = await generateQuizQuestions();

      setLoadingMessage('問題の画像を生成中...');
      const questionsWithImages = await Promise.all(
        questions.map(async (question) => {
          const imageUrl = await generateQuizImage(question.image_prompt);
          return { ...question, imageUrl };
        })
      );
      
      setQuizData(questionsWithImages);
      setGameState('quiz');
    } catch (err) {
      const message = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setErrorMessage(message);
      setGameState('error');
    }
  }, []);

  const handleStartQuiz = useCallback(() => {
    setGameState('loading');
    fetchQuizData();
  }, [fetchQuizData]);

  const resetQuiz = useCallback(() => {
    setGameState('start');
    setQuizData([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setLoadingMessage('');
    setErrorMessage('');
    setResultContent(null);
  }, []);

  const handleAnswerSelect = useCallback((answer: string) => {
    if (isAnswered) return;

    setSelectedAnswer(answer);
    setIsAnswered(true);
    if (answer === quizData[currentQuestionIndex].answer) {
      setScore(prev => prev + 1);
    }
  }, [isAnswered, quizData, currentQuestionIndex]);

  const handleNextQuestion = useCallback(async () => {
    if (currentQuestionIndex < quizData.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setGameState('loading');
      setLoadingMessage('結果を分析中...');
      const result = await generateResultMessage(score, quizData.length);
      setResultContent(result);
      setGameState('result');
    }
  }, [currentQuestionIndex, quizData.length, score]);

  const renderGameState = () => {
    switch (gameState) {
      case 'start':
        return <StartScreen onStart={handleStartQuiz} />;
      case 'loading':
        return <Spinner message={loadingMessage} />;
      case 'error':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h2>
            <p className="text-gray-700 mb-6">{errorMessage}</p>
            <button
              onClick={resetQuiz}
              className="bg-amber-500 text-white font-bold py-3 px-8 rounded-full hover:bg-amber-600 transition-transform transform hover:scale-105 shadow-lg"
            >
              ホームに戻る
            </button>
          </div>
        );
      case 'quiz':
        if (quizData.length === 0) return <Spinner message="クイズを読み込み中..." />;
        return (
          <QuizScreen
            questionData={quizData[currentQuestionIndex]}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={quizData.length}
            selectedAnswer={selectedAnswer}
            isAnswered={isAnswered}
            onAnswerSelect={handleAnswerSelect}
            onNext={handleNextQuestion}
          />
        );
      case 'result':
        return <ResultScreen score={score} totalQuestions={quizData.length} onRetry={resetQuiz} resultContent={resultContent}/>;
    }
  };

  return (
    <div className="bg-[#EFEBE9] bg-cover bg-fixed bg-center min-h-screen w-full flex items-center justify-center p-4 overflow-hidden" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/inspiration.png')" }}>
        <main className="w-full max-w-4xl bg-[rgba(255,255,255,0.9)] backdrop-blur-md border-4 border-[#6D4C41] rounded-2xl shadow-2xl p-6 sm:p-10 text-[#6D4C41] transition-all duration-500 ease-in-out">
            {renderGameState()}
        </main>
    </div>
  );
};

export default App;