import axios from 'axios';

// Plain client for the token-gated customer forms — NO auth header and NO
// 401 → /login interceptor (these pages are used by logged-out customers).
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://crm-api.tapify.co.in/api',
});

export default publicApi;
