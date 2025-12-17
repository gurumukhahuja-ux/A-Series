import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import { apis } from "../types";



export const generateChatResponse = async (history, currentMessage, systemInstruction) => {
    try {
        const result = await axios.post(apis.chatAgent, { content: currentMessage })
        return result.data.reply || "I'm sorry, I couldn't generate a response.";

    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Sorry, I am having trouble connecting to the AI Mall network right now.";
    }
};