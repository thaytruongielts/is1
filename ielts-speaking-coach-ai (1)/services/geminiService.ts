import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Feedback } from "../types";

// QUAN TRỌNG: Sử dụng import.meta.env.VITE_API_KEY cho dự án Vite
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY || '');

export const getIELTSEvaluation = async (audioBase64: string, question: string): Promise<Feedback> => {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", // Sử dụng bản stable mới nhất
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const audioPart = {
    inlineData: {
      mimeType: "audio/webm", // Hoặc "audio/mp3" tùy thuộc vào recorder của bạn
      data: audioBase64
    }
  };

  const textPart = {
    text: `Question was: "${question}". Please evaluate my audio response.`
  };

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [audioPart, textPart] }],
      generationConfig: {
        responseMimeType: "application/json" // Bắt buộc trả về JSON
      }
    });

    const response = await result.response;
    const text = response.text();
    
    // Parse JSON an toàn
    return JSON.parse(text) as Feedback;

  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to process your speaking response. Please check your API Key or try again.");
  }
};

export const getSecondaryCorrection = async (previousFeedback: Feedback, newAudioBase64: string): Promise<Feedback> => {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const audioPart = {
    inlineData: {
      mimeType: "audio/webm",
      data: newAudioBase64
    }
  };

  const textPart = {
    text: `I tried to repeat the 'Improved Version' you suggested: "${previousFeedback.improvedVersion}". How did I do? Compare my new audio with your suggestion and give me updated feedback.`
  };

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [audioPart, textPart] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const response = await result.response;
    const text = response.text();

    return JSON.parse(text) as Feedback;

  } catch (error) {
    console.error("Gemini Error (Secondary):", error);
    throw new Error("Failed to correct your practice attempt.");
  }
};
