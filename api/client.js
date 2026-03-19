import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Replace string with environment variables later, hardcoded for initial test
// URL del Backend en Producción (Dokploy)
const API_BASE_URL = 'https://api.kconecta.com/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    //
  }
  return config;
});

export const loginApi = async (email, password) => {
  const response = await apiClient.post('/login', { email, password });
  return response.data;
};

export const getMeApi = async () => {
  const response = await apiClient.get('/me');
  return response.data;
};

export const getPropertiesApi = async () => {
  const response = await apiClient.get('/agent/properties');
  return response.data;
};

export const processAgentTask = async (taskType, input) => {
  try {
    const response = await apiClient.post('/agent/process', {
      task_type: taskType,
      input: input,
    });
    return response.data;
  } catch (error) {
    const fullUrl = `${apiClient.defaults.baseURL}${error.config?.url || ''}`;
    console.error(`API Error [${fullUrl}]:`, error.response?.data || error.message);
    throw error;
  }
};
