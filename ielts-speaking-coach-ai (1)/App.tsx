
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { IELTS_QUESTIONS } from './constants';
import { Feedback, PracticeSession, Question } from './types';
import { getIELTSEvaluation, getSecondaryCorrection } from './services/geminiService';

const App: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState<Question>(IELTS_QUESTIONS[0]);
  const [session, setSession] = useState<PracticeSession>({
    question: IELTS_QUESTIONS[0].text,
    isRecording: false,
    status: 'idle'
  });
  const [history, setHistory] = useState<Feedback[]>([]);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startNewQuestion = () => {
    const randomIdx = Math.floor(Math.random() * IELTS_QUESTIONS.length);
    const nextQ = IELTS_QUESTIONS[randomIdx];
    setCurrentQuestion(nextQ);
    setSession({
      question: nextQ.text,
      isRecording: false,
      status: 'idle'
    });
    setHistory([]);
    setError(null);
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          await processAudio(base64Audio);
        };
      };

      mediaRecorder.start();
      setSession(prev => ({ ...prev, isRecording: true, status: 'recording' }));
    } catch (err) {
      setError("Microphone access denied or error starting recorder.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setSession(prev => ({ ...prev, isRecording: false, status: 'processing' }));
    }
  };

  const processAudio = async (base64Audio: string) => {
    try {
      let feedback: Feedback;
      if (session.feedback) {
        // User is practicing based on previous feedback
        feedback = await getSecondaryCorrection(session.feedback, base64Audio);
      } else {
        // Initial attempt
        feedback = await getIELTSEvaluation(base64Audio, session.question);
      }
      
      setSession(prev => ({
        ...prev,
        status: 'finished',
        feedback: feedback
      }));
      setHistory(prev => [...prev, feedback]);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
      setSession(prev => ({ ...prev, status: 'idle' }));
    }
  };

  const resetSessionForRetry = () => {
    setSession(prev => ({
        ...prev,
        status: 'idle',
        feedback: undefined
    }));
    setHistory([]);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-4xl flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
            <i className="fas fa-microphone-alt"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">IELTS Speaking Coach</h1>
            <p className="text-sm text-slate-500 uppercase tracking-wider font-medium">Powered by Gemini 3</p>
          </div>
        </div>
        <button 
          onClick={startNewQuestion}
          className="px-6 py-2 bg-white border border-slate-200 rounded-full font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
        >
          Đổi Câu Hỏi <i className="fas fa-random ml-2"></i>
        </button>
      </header>

      <main className="w-full max-w-4xl space-y-8">
        {/* Question Section */}
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase">
              {currentQuestion.category}
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-slate-500 text-xs font-medium">{currentQuestion.topic}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 leading-tight">
            {currentQuestion.text}
          </h2>

          <div className="flex flex-col items-center justify-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            {session.status === 'idle' && (
              <>
                <p className="text-slate-500 mb-6 font-medium">Nhấn mic và bắt đầu trả lời...</p>
                <button 
                  onClick={handleStartRecording}
                  className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white text-3xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-90"
                >
                  <i className="fas fa-microphone"></i>
                </button>
              </>
            )}

            {session.status === 'recording' && (
              <>
                <p className="text-red-500 mb-6 font-bold animate-pulse">Đang ghi âm...</p>
                <button 
                  onClick={handleStopRecording}
                  className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-white text-3xl shadow-xl shadow-red-200 recording-pulse transition-all active:scale-90"
                >
                  <i className="fas fa-stop"></i>
                </button>
              </>
            )}

            {session.status === 'processing' && (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-indigo-600 font-semibold italic">Gemini đang phân tích câu trả lời của bạn...</p>
              </div>
            )}

            {session.status === 'finished' && (
                <div className="text-center">
                    <p className="text-green-600 font-bold mb-4">Hoàn thành!</p>
                    <button 
                        onClick={resetSessionForRetry}
                        className="text-slate-500 hover:text-indigo-600 underline text-sm font-medium"
                    >
                        Làm lại từ đầu
                    </button>
                </div>
            )}
          </div>
          {error && <p className="mt-4 text-red-500 text-center font-medium bg-red-50 p-2 rounded-lg">{error}</p>}
        </section>

        {/* Feedback Section */}
        {session.feedback && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-indigo-600 text-white rounded-3xl p-6 flex flex-col items-center justify-center shadow-lg">
                <span className="text-sm font-medium opacity-80 mb-1">Band Score</span>
                <span className="text-5xl font-black">{session.feedback.bandScore}</span>
              </div>
              <div className="md:col-span-3 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 italic text-slate-600 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <i className="fas fa-quote-right text-6xl"></i>
                </div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bản Ghi Âm Của Bạn</h4>
                <p className="text-lg leading-relaxed">"{session.feedback.transcription}"</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <i className="fas fa-chart-line text-indigo-500"></i> Phân Tích Chi Tiết
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-sm text-slate-700 mb-1">Fluency & Coherence</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{session.feedback.fluency}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-700 mb-1">Vocabulary</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{session.feedback.vocabulary}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-700 mb-1">Grammar</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{session.feedback.grammar}</p>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-3xl p-8 border border-indigo-100 shadow-inner">
                <h3 className="text-xl font-bold text-indigo-900 mb-6 flex items-center gap-2">
                  <i className="fas fa-magic text-indigo-500"></i> Phiên Bản Nâng Cấp (Target 8.5+)
                </h3>
                <p className="text-lg font-medium text-indigo-800 leading-relaxed mb-6 italic bg-white/50 p-4 rounded-xl border border-indigo-200">
                  "{session.feedback.improvedVersion}"
                </p>
                
                <h4 className="text-sm font-bold text-indigo-700 uppercase mb-3">Gợi Ý Cải Thiện</h4>
                <ul className="space-y-3">
                  {session.feedback.suggestions.map((s, i) => (
                    <li key={i} className="flex gap-3 text-sm text-indigo-900 font-medium">
                      <span className="flex-shrink-0 w-6 h-6 bg-indigo-200 rounded-full flex items-center justify-center text-xs text-indigo-700">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>

                <div className="mt-8 pt-6 border-t border-indigo-200">
                    <p className="text-xs text-indigo-600 font-bold mb-4 uppercase text-center">Hãy thử đọc to phiên bản nâng cấp này</p>
                    <div className="flex justify-center">
                        <button 
                            onClick={handleStartRecording}
                            disabled={session.status === 'recording'}
                            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <i className="fas fa-redo"></i> Luyện Tập Lại Với Câu Này
                        </button>
                    </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="w-full max-w-4xl mt-20 pb-12 border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center text-slate-400 text-sm gap-4">
        <p>&copy; 2025 IELTS Speaking AI Coach. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-indigo-600 transition-colors">Về Chúng Tôi</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Hướng Dẫn</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Hỗ Trợ</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
