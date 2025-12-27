// Message Type (JSDoc for IntelliSense)
export const MessageRole = {
  USER: "user",
  MODEL: "model",
};

/**
 * @typedef {Object} Message
 * @property {string} id
 * @property {"user" | "model"} role
 * @property {string} content
 * @property {number} timestamp
 */

/**
 * @typedef {Object} ChatSession
 * @property {string} id
 * @property {string} title
 * @property {Message[]} messages
 * @property {string=} agentId
 * @property {number} lastModified
 */

/**
 * @typedef {Object} Agent
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} avatar
 * @property {"productivity" | "creative" | "coding" | "lifestyle"} category
 * @property {boolean} installed
 * @property {string} instructions
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} avatar
 */

// AppRoute Enum → Convert to constant object
export const AppRoute = {
  LANDING: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  E_Verification: "/verification",
  DASHBOARD: "/dashboard",
  MARKETPLACE: "/dashboard/marketplace",
  MY_AGENTS: "/dashboard/agents",
  LIVE_DEMOS: "/dashboard/live-demos",
  SETTINGS: "/dashboard/settings",
  INVOICES: "/dashboard/invoices",
  NOTIFICATIONS: "/dashboard/notifications",
  agentSoon: "/agentsoon",
};

// Use environment variable for API URL (configured in .env file)
// export const API = "https://ai-mall-backend.onrender.com/api";
export const API = "http://localhost:5000/api";

export const apis = {
  emailVerificationApi: `${API}/email_varification`,
  signUp: `${API}/auth/signup`,
  logIn: `${API}/auth/login/`,
  user: `${API}/user`,
  getPayments: `${API}/user/payments`,
  notifications: `${API}/notifications`,
  agents: `${API}/agents`,
  buyAgent: `${API}/agents/buy`,
  getUserAgents: `${API}/agents/get_my_agents`,
  chatAgent: `${API}/chat`,
  aibiz: `${API}/aibiz`,
};