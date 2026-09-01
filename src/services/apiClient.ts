import axios from 'axios';
import { supabase } from '@/services/supabase';

/**
 * Shared Axios client for Flask API.
 * Never put YOUTUBE_API_KEY or SUPABASE_SERVICE_ROLE_KEY here.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});
