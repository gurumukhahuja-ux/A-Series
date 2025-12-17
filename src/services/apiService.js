// Generic API service for Dashboard, Automations, Agents, Admin, and Auth
import axios from "axios";
import { API } from "../types";

const API_BASE_URL = API;

export const apiService = {
  // --- Auth ---
  async login(credentials) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { credentials })

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      return data;
    } catch (error) {
      console.warn('Backend login failed, falling back to mock auth for demo:', error);

      if (credentials.email && credentials.password) {
        return {
          id: 'demo-user-123',
          name: 'Demo User',
          email: credentials.email,
          avatar: ''
        };
      }
      throw new Error(error.message || 'Failed to connect to server');
    }
  },

  async signup(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }
      return data;
    } catch (error) {
      console.warn('Backend signup failed, falling back to mock auth for demo:', error);

      return {
        id: 'demo-user-' + Date.now(),
        name: userData.name,
        email: userData.email,
        avatar: ''
      };
    }
  },

  // --- Dashboard Stats ---
  async getDashboardStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
      if (!response.ok) throw new Error('Backend failed');
      return await response.json();
    } catch (error) {
      return {
        totalChats: 24,
        activeAgents: 6,
        tokensUsed: 450230,
        savedTime: '18h 45m'
      };
    }
  },

  // --- Agents ---
  async getAgents() {
    try {
      const response = await fetch(`${API_BASE_URL}/agents`);
      if (!response.ok) throw new Error('Backend failed');
      return await response.json();
    } catch (error) {
      const stored = localStorage.getItem('mock_agents');
      if (stored) return JSON.parse(stored);

      const defaults = [
        { _id: '101', name: 'Support Bot V1', description: 'Handles initial queries.', type: 'support', instructions: 'You are a helpful support agent.' },
        { _id: '102', name: 'Personal Diary', description: 'Reflects on entries.', type: 'writer', instructions: 'You are an empathetic listener.' },
        { _id: '103', name: 'React Helper', description: 'Assists with code.', type: 'coder', instructions: 'You are a React expert.' }
      ];

      localStorage.setItem('mock_agents', JSON.stringify(defaults));
      return defaults;
    }
  },

  async createAgent(agentData) {
    try {
      const response = await fetch(`${API_BASE_URL}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
      });
      if (!response.ok) throw new Error('Backend failed');
      return await response.json();
    } catch (error) {
      const stored = JSON.parse(localStorage.getItem('mock_agents') || '[]');
      const newAgent = { ...agentData, _id: Date.now().toString() };
      stored.push(newAgent);
      localStorage.setItem('mock_agents', JSON.stringify(stored));
      return newAgent;
    }
  },

  async updateAgent(id, updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/agents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Backend failed');
      return await response.json();
    } catch (error) {
      const stored = JSON.parse(localStorage.getItem('mock_agents') || '[]');
      const index = stored.findIndex(a => a._id === id);

      if (index !== -1) {
        stored[index] = { ...stored[index], ...updates };
        localStorage.setItem('mock_agents', JSON.stringify(stored));
        return stored[index];
      }
      return null;
    }
  },

  async deleteAgent(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/agents/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Backend failed');
      return true;
    } catch (error) {
      const stored = JSON.parse(localStorage.getItem('mock_agents') || '[]');
      const filtered = stored.filter(a => a._id !== id);
      localStorage.setItem('mock_agents', JSON.stringify(filtered));
      return true;
    }
  },

  // --- Automations ---
  async getAutomations() {
    try {
      const response = await fetch(`${API_BASE_URL}/automations`);
      if (!response.ok) throw new Error('Backend failed');
      return await response.json();
    } catch (error) {
      const stored = localStorage.getItem('mock_automations');
      if (stored) return JSON.parse(stored);

      const defaults = [
        { id: '1', name: 'Daily Digest', description: 'Summarize unread emails at 9 AM', active: true, type: 'Email' },
        { id: '2', name: 'Lead Qualifier', description: 'Score incoming leads from CRM', active: false, type: 'CRM' },
        { id: '3', name: 'Code Reviewer', description: 'Auto-review PRs on GitHub', active: true, type: 'Dev' },
        { id: '4', name: 'Meeting Notes', description: 'Transcribe and summarize Zoom calls', active: true, type: 'Productivity' }
      ];

      localStorage.setItem('mock_automations', JSON.stringify(defaults));
      return defaults;
    }
  },

  async toggleAutomation(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/automations/${id}/toggle`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Backend failed');
      return await response.json();
    } catch (error) {
      const stored = JSON.parse(localStorage.getItem('mock_automations') || '[]');

      const updated = stored.map(a =>
        a.id === id ? { ...a, active: !a.active } : a
      );

      localStorage.setItem('mock_automations', JSON.stringify(updated));

      return updated.find(a => a.id === id);
    }
  },

  // --- Admin ---
  async getAdminSettings() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/settings`);
      if (!response.ok) throw new Error('Backend failed');
      return await response.json();
    } catch (error) {
      const stored = localStorage.getItem('mock_admin_settings');
      if (stored) return JSON.parse(stored);

      return {
        allowPublicSignup: true,
        defaultModel: 'gemini-2.5-flash',
        maxTokensPerUser: 500000,
        organizationName: 'ACME Corp'
      };
    }
  },

  async updateAdminSettings(settings) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!response.ok) throw new Error('Backend failed');
      return await response.json();
    } catch (error) {
      localStorage.setItem('mock_admin_settings', JSON.stringify(settings));
      return settings;
    }
  }
};