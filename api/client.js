import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const WEB_API_OVERRIDE_KEY = 'kconecta_api_base_url';

const getWebApiOverride = () => {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') {
    return null;
  }

  const value = localStorage.getItem(WEB_API_OVERRIDE_KEY);
  if (!value || typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return null;
  }

  return trimmed.replace(/\/+$/, '');
};

const setWebApiOverride = (url) => {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') {
    return;
  }

  if (!url || typeof url !== 'string') {
    return;
  }

  localStorage.setItem(WEB_API_OVERRIDE_KEY, url.replace(/\/+$/, ''));
};

const unique = (values) => [...new Set(values.filter(Boolean))];

const API_BASE_CANDIDATES = unique([
  getWebApiOverride(),
  process.env.EXPO_PUBLIC_API_BASE_URL,
  // Preferimos www (objetivo final), con fallback por si hay SSL/cert en cliente.
  'https://www.kconecta.com/api',
  'https://kconecta.com/api',
  'https://api.kconecta.com/api',
]);

let activeBaseUrl = API_BASE_CANDIDATES[0] || 'https://www.kconecta.com/api';

export const apiClient = axios.create({
  baseURL: activeBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const setActiveBaseUrl = (url) => {
  activeBaseUrl = url;
  apiClient.defaults.baseURL = url;
};

const isRetryableNetworkError = (error) => {
  // SSL errors in browser are surfaced as network-level errors (sin response).
  return !error?.response;
};

const withBaseUrlFallback = async (requestFn) => {
  const orderedCandidates = unique([activeBaseUrl, ...API_BASE_CANDIDATES]);
  let lastError = null;

  for (let index = 0; index < orderedCandidates.length; index += 1) {
    const candidate = orderedCandidates[index];
    setActiveBaseUrl(candidate);

    try {
      const result = await requestFn(candidate);
      setWebApiOverride(candidate);
      return result;
    } catch (error) {
      lastError = error;
      const hasNext = index < orderedCandidates.length - 1;
      if (!hasNext || !isRetryableNetworkError(error)) {
        throw error;
      }
    }
  }

  throw lastError;
};

const getStoredToken = async () => {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem('auth_token');
  }

  return SecureStore.getItemAsync('auth_token');
};

export const getApiErrorDetails = (error) => {
  const status = error.response?.status ?? null;
  const data = error.response?.data ?? null;
  const headers = error.response?.headers ?? {};
  const url = `${apiClient.defaults.baseURL}${error.config?.url || ''}`;
  const requestId = headers['x-request-id'] || headers['x-correlation-id'] || null;
  const backendMessage = typeof data?.message === 'string' ? data.message : null;
  const messageParts = [];

  if (status) {
    messageParts.push(`HTTP ${status}`);
  }

  if (backendMessage) {
    messageParts.push(backendMessage);
  }

  if (!messageParts.length && error.message) {
    messageParts.push(error.message);
  }

  return {
    status,
    data,
    headers,
    requestId,
    url,
    message: messageParts.join(': ') || 'Error de red',
  };
};

apiClient.interceptors.request.use(async (config) => {
  try {
    if (config.url === '/login') {
      return config;
    }

    const token = await getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    //
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const details = getApiErrorDetails(error);
    console.warn(`API Error [${details.url}]:`, details.data || details.message);
    return Promise.reject(error);
  }
);

export const loginApi = async (email, password) => {
  const response = await withBaseUrlFallback(() => apiClient.post('/login', { email, password }));
  return response.data;
};

export const getMeApi = async () => {
  const response = await withBaseUrlFallback(() => apiClient.get('/me'));
  return response.data;
};

const shouldTryNextPropertiesEndpoint = (status) => {
  // Endpoints can vary between environments. Fallback on non-final statuses.
  return status === 404 || status === 405 || status === 422 || status === 403;
};

export const getPropertiesApi = async (options = {}) => {
  const { adminView = false, perPage } = options;
  const baseParams = {};

  if (perPage) {
    baseParams.per_page = perPage;
  }

  if (!adminView) {
    const response = await withBaseUrlFallback(() =>
      apiClient.get('/agent/properties', { params: baseParams })
    );
    return response.data;
  }

  const candidates = [
    { url: '/agent/properties', params: { ...baseParams, scope: 'all' } },
    { url: '/agent/properties', params: baseParams },
    { url: '/admin/properties', params: baseParams },
  ];

  let lastError = null;

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    try {
      const response = await apiClient.get(candidate.url, { params: candidate.params });
      return response.data;
    } catch (error) {
      lastError = error;
      const status = error?.response?.status ?? null;
      const hasNextCandidate = index < candidates.length - 1;
      if (hasNextCandidate && shouldTryNextPropertiesEndpoint(status)) {
        continue;
      }
      throw error;
    }
  }

  throw lastError;
};

const shouldTryNextEndpoint = (status) => status === 404 || status === 405;

export const getPropertyTypesApi = async () => {
  const candidates = [
    '/agent/property-types',
    '/property-types',
    '/agent/properties/types',
    '/post/types',
  ];

  let lastError = null;

  for (let index = 0; index < candidates.length; index += 1) {
    const endpoint = candidates[index];
    try {
      const response = await withBaseUrlFallback(() => apiClient.get(endpoint));
      return response.data;
    } catch (error) {
      lastError = error;
      const status = error?.response?.status ?? null;
      const hasNext = index < candidates.length - 1;
      if (hasNext && shouldTryNextEndpoint(status)) {
        continue;
      }
      throw error;
    }
  }

  throw lastError;
};

export const createPropertyApi = async (payload) => {
  const response = await withBaseUrlFallback(() => apiClient.post('/agent/properties', payload));
  return response.data;
};

export const processAgentTask = async (taskType, input) => {
  try {
    const response = await withBaseUrlFallback(() =>
      apiClient.post('/agent/process', {
        task_type: taskType,
        input,
      })
    );
    return response.data;
  } catch (error) {
    const details = getApiErrorDetails(error);
    console.warn(`API Error [${details.url}]:`, details.data || details.message);
    throw error;
  }
};
