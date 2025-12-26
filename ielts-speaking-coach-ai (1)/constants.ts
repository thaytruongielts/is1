
import { Question } from './types';

export const IELTS_QUESTIONS: Question[] = [
  { id: '1', category: 'Part 1', topic: 'Hometown', text: 'Where is your hometown?' },
  { id: '2', category: 'Part 1', topic: 'Work/Study', text: 'Do you work or are you a student?' },
  { id: '3', category: 'Part 1', topic: 'Leisure', text: 'What do you like to do in your free time?' },
  { id: '4', category: 'Part 2', topic: 'Events', text: 'Describe a time you were very busy. You should say: When it was, What you had to do, Why you were busy, and explain how you felt about it.' },
  { id: '5', category: 'Part 3', topic: 'Technology', text: 'How has technology changed the way people work in your country?' },
  { id: '6', category: 'Part 3', topic: 'Environment', text: 'What do you think is the most serious environmental problem today?' }
];

export const SYSTEM_INSTRUCTION = `You are an expert IELTS Speaking Examiner. Your goal is to help students improve their speaking skills.
When a student provides an audio response (transcribed), you must:
1. Provide the exact transcription of their words.
2. Estimate a Band Score (0-9).
3. Evaluate Fluency, Lexical Resource (Vocabulary), and Grammatical Range & Accuracy.
4. Provide a much better, native-like "Improved Version" of their answer.
5. List 3 specific bullet points for improvement.

CRITICAL: Return the response strictly in JSON format matching this structure:
{
  "transcription": "the text you heard",
  "bandScore": "7.0",
  "fluency": "Your fluency was good but...",
  "vocabulary": "Try using more academic words like...",
  "grammar": "Be careful with past tense...",
  "improvedVersion": "Actually, I would say...",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}
Respond in Vietnamese for the feedback sections, but keep the improvedVersion in natural English.`;
