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
  SECURITY: "/dashboard/security",
  ADMIN: "/dashboard/admin",
  PROFILE: "/dashboard/profile",
  VENDOR: "/vendor",
  VENDOR_REVENUE: "/vendor/revenue/overview",
  VENDOR_TRANSACTIONS: "/vendor/revenue/transactions",
  agentSoon: "/agentsoon",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password/:token",
};

// Use environment variable for API URL (configured in .env file)
export const API = "https://a-series-backend-561947379084.asia-south1.run.app/api";
// export const API = "http://localhost:5000/api";
// export const API = "http://192.168.29.45:5000/api";

export const apis = {
  emailVerificationApi: `${API}/email_varification`,
  signUp: `${API}/auth/signup`,
  logIn: `${API}/auth/login/`,
  forgotPassword: `${API}/auth/forgot-password`,
  resetPassword: `${API}/auth/reset-password/`,
  user: `${API}/user`,
  getPayments: `${API}/user/payments`,
  notifications: `${API}/notifications`,
  agents: `${API}/agents`,
  buyAgent: `${API}/agents/buy`,
  getUserAgents: `${API}/agents/get_my_agents`,
  getMyAgents: `${API}/agents/me`,
  chatAgent: `${API}/chat`,
  aibiz: `${API}/aibiz`,
  support: `${API}/support`,
  resetPasswordEmail: `${API}/auth/reset-password-email`,
  feedback: `${API}/feedback`,
};
