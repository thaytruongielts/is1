
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Feedback } from "../types";

export const getIELTSEvaluation = async (audioBase64: string, question: string): Promise<Feedback> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const audioPart = {
    inlineData: {
      mimeType: "audio/webm", // Usually webm from MediaRecorder
      data: audioBase64
    }
  };

  const textPart = {
    text: `Question was: "${question}". Please evaluate my audio response.`
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [audioPart, textPart] },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result as Feedback;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to process your speaking response. Please try again.");
  }
};

export const getSecondaryCorrection = async (previousFeedback: Feedback, newAudioBase64: string): Promise<Feedback> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
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
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [audioPart, textPart] },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
        },
      });
  
      return JSON.parse(response.text || "{}") as Feedback;
    } catch (error) {
      console.error("Gemini Error:", error);
      throw new Error("Failed to correct your practice attempt.");
    }
  };
