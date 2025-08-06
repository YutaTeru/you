
export interface QuizQuestion {
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
  image_prompt: string;
}

export type GameState = 'start' | 'loading' | 'quiz' | 'result' | 'error';

export interface ResultContent {
  rank: string;
  message: string;
}