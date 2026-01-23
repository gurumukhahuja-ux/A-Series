import axios from "axios";
import { apis } from "../types";
import { getUserData } from "../userStore/userData";

export const generateChatResponse = async (history, currentMessage, systemInstruction, attachments, language, model = 'gemini') => {
    try {
        const token = getUserData()?.token;

        console.log("🔐 [GeminiService] Token check:", {
            hasToken: !!token,
            tokenLength: token?.length,
            userData: getUserData() ? "exists" : "missing"
        });

        if (!token) {
            console.error("❌ [GeminiService] No authentication token found!");
            throw new Error("Authentication required. Please log in again.");
        }

        // Enhanced system instruction based on user language
        const langInstruction = language ? `You are a helpful AI assistant. Please respond to the user in ${language}. ` : '';
        const combinedSystemInstruction = (langInstruction + (systemInstruction || '')).trim();

        let images = [];
        let documents = [];
        let finalMessage = currentMessage;

        if (attachments && Array.isArray(attachments)) {
            attachments.forEach(attachment => {
                if (attachment.url && attachment.url.startsWith('data:')) {
                    const base64Data = attachment.url.split(',')[1];
                    const mimeType = attachment.url.substring(attachment.url.indexOf(':') + 1, attachment.url.indexOf(';'));

                    if (attachment.type === 'image' || mimeType.startsWith('image/')) {
                        images.push({ mimeType, base64Data });
                    } else {
                        documents.push({ mimeType: mimeType || 'application/pdf', base64Data, name: attachment.name });
                    }
                } else if (attachment.url) {
                    finalMessage += `\n[Shared File: ${attachment.name || 'Link'} - ${attachment.url}]`;
                }
            });
        }

        // Limit history to last 50 messages to prevent token overflow in unlimited chats
        const recentHistory = history.length > 50 ? history.slice(-50) : history;

        const payload = {
            content: finalMessage,
            history: recentHistory,
            systemInstruction: combinedSystemInstruction,
            image: images,
            document: documents,
            model: model
        };

        console.log("📤 [GeminiService] Sending request to:", apis.chatAgent);
        console.log("📤 [GeminiService] Payload:", {
            contentLength: finalMessage.length,
            historyLength: recentHistory.length,
            imagesCount: images.length,
            documentsCount: documents.length,
            model
        });

        const result = await axios.post(apis.chatAgent, payload, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log("📥 [GeminiService] Response received:", result.data);
        return result.data.reply || "I'm sorry, I couldn't generate a response.";

    } catch (error) {
        console.error("Gemini API Error:", error);
        if (error.response?.status === 429) {
            // Allow backend detail to override if present, otherwise default
            const detail = error.response?.data?.details || error.response?.data?.error;
            if (detail) return `System Busy (429): ${detail}`;
            return "The A-Series system is currently busy (Quota limit reached). Please wait 60 seconds and try again.";
        }
        // Return backend error message if available
        if (error.response?.data?.error) {
            const details = error.response.data.details ? JSON.stringify(error.response.data.details) : '';
            return `System Message: ${error.response.data.error}\nDetails: ${details}`;
        }
        if (error.response?.data?.details) {
            return `System Error: ${error.response.data.details}`;
        }
        return "Sorry, I am having trouble connecting to the A-Series network right now. Please check your connection.";
    }
};