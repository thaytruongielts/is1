
export interface Feedback {
  transcription: string;
  bandScore: string;
  fluency: string;
  vocabulary: string;
  grammar: string;
  improvedVersion: string;
  suggestions: string[];
}

export interface PracticeSession {
  question: string;
  userAnswer?: string;
  feedback?: Feedback;
  isRecording: boolean;
  status: 'idle' | 'recording' | 'processing' | 'finished';
}

export interface Question {
  id: string;
  category: 'Part 1' | 'Part 2' | 'Part 3';
  topic: string;
  text: string;
}
