import { } from "../types"; // remove if unused
import { getUserData } from "../userStore/userData";
const userId = getUserData("user")?.id

const API_BASE_URL = "http://localhost:5000/api";

export const chatStorageService = {
  
  async getSessions() {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`);
      if (!response.ok) throw new Error("Backend failed");
      return await response.json();
    } catch (error) {
      console.warn("Backend unavailable. Using LocalStorage fallback.");
      const sessions = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("chat_meta_")) {
          const sessionId = key.replace("chat_meta_", "");
          const meta = JSON.parse(localStorage.getItem(key) || "{}");

          sessions.push({
            sessionId,
            title: meta.title || "New Chat",
            lastModified: meta.lastModified || Date.now(),
          });
        }
      }

      return sessions.sort((a, b) => b.lastModified - a.lastModified);
    }
  },

  async getHistory(sessionId) {
    if (sessionId === "new") return [];

    try {
      const response = await fetch(`${API_BASE_URL}/chat/${sessionId}`);
      if (response.status === 404) return [];

      if (!response.ok) throw new Error("Backend response not ok");

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error("Error fetching history:", error);
      const local = localStorage.getItem(`chat_history_${sessionId}`);
      return local ? JSON.parse(local) : [];
    }
  },

  async saveMessage(sessionId, message, title) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, title, userId }),
      });

      if (!response.ok) throw new Error("Backend save failed");
    } catch (error) {
      console.error("Error saving message:", error);

      // --- LocalStorage fallback ---
      const historyKey = `chat_history_${sessionId}`;
      const metaKey = `chat_meta_${sessionId}`;

      const localHistory = localStorage.getItem(historyKey);
      let messages = localHistory ? JSON.parse(localHistory) : [];

      // Avoid duplicates
      if (!messages.find((m) => m.id === message.id)) {
        messages.push(message);
        localStorage.setItem(historyKey, JSON.stringify(messages));

        const existingMeta = JSON.parse(localStorage.getItem(metaKey) || "{}");

        const meta = {
          title: title || existingMeta.title || "New Chat",
          lastModified: Date.now(),
        };

        localStorage.setItem(metaKey, JSON.stringify(meta));
      }
    }
  },

  async createSession() {
    return (
      Date.now().toString(36) +
      Math.random().toString(36).substr(2)
    );
  },
};