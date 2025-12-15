import { GoogleGenAI } from "@google/genai";

// Frontend demo key (in real production use backend)
const apiKey= import.meta.env.VITE_API_KEY ||"AIzaSyDaZEUhwEZLbNfcNfjk-lEiiJk2ZRUqyHE"

const ai = new GoogleGenAI({ apiKey});

export const generateChatResponse = async (history, currentMessage, systemInstruction) => {
  try {
    const modelId = "gemini-2.5-flash";

    // Create chat instance
    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: systemInstruction || "You are AI-Mall, a helpful and intelligent assistant."
      }
    });

    // Send new message
    const result = await chat.sendMessage({
      message: currentMessage
    });

    return result.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I am having trouble connecting to the AI Mall network right now.";
  }
};