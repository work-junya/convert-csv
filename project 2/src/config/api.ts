// API設定
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3001' 
  : window.location.origin;

export { API_BASE_URL };