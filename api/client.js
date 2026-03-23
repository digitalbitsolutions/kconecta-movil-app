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

const isFormDataPayload = (value) => typeof FormData !== 'undefined' && value instanceof FormData;

apiClient.interceptors.request.use(async (config) => {
  if (isFormDataPayload(config?.data) && config?.headers) {
    if (typeof config.headers.set === 'function') {
      config.headers.set('Content-Type', undefined);
    } else {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  }

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

export const getPropertyFormCatalogsApi = async (typeId) => {
  if (!typeId) {
    throw new Error('Property type id is required');
  }

  const candidates = [
    '/agent/property-form-catalogs',
    '/agent/properties/form-catalogs',
  ];

  let lastError = null;

  for (let index = 0; index < candidates.length; index += 1) {
    const endpoint = candidates[index];
    try {
      const response = await withBaseUrlFallback(() => apiClient.get(endpoint, { params: { type_id: typeId } }));
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

const extractObjectPayload = (payload) => {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
      return extractObjectPayload(payload.data);
    }
    if (payload.property && typeof payload.property === 'object' && !Array.isArray(payload.property)) {
      return payload.property;
    }
    return payload;
  }
  return null;
};

export const getPropertyByIdApi = async (id) => {
  if (!id) {
    throw new Error('Property id is required');
  }
  const response = await withBaseUrlFallback(() => apiClient.get(`/agent/properties/${id}`));
  return extractObjectPayload(response.data) || response.data;
};

export const deletePropertyImageApi = async (imageId) => {
  if (!imageId) {
    throw new Error('Image id is required');
  }

  const response = await withBaseUrlFallback(() => apiClient.delete(`/agent/property-images/${imageId}`));
  return response.data;
};

export const updatePropertyApi = async (id, payload) => {
  if (!id) {
    throw new Error('Property id is required');
  }

  if (isFormDataPayload(payload)) {
    const hasGetter = typeof payload.get === 'function';
    const hasOverride = hasGetter ? Boolean(payload.get('_method')) : false;
    if (!hasOverride) {
      payload.append('_method', 'PATCH');
    }
    const response = await withBaseUrlFallback(() => apiClient.post(`/agent/properties/${id}`, payload));
    return response.data;
  }

  const response = await withBaseUrlFallback(() => apiClient.patch(`/agent/properties/${id}`, payload));
  return response.data;
};

// Agent: DeepSeek
export const getLeadsApi = async (options = {}) => {
  const { perPage = 20 } = options;
  const response = await withBaseUrlFallback(() => 
    apiClient.get('/agent/leads', { params: { per_page: perPage } })
  );
  return response.data;
};
// Agent: DeepSeek
export const uploadMediaApi = async (propertyId, file, onProgress = null) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('property_id', propertyId);

  const response = await withBaseUrlFallback(() => 
    apiClient.post(`/agent/properties/${propertyId}/media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress(progressEvent.loaded / progressEvent.total);
        }
      }
    })
  );
  return response.data;
};

export const deleteMediaApi = async (propertyId, imageId) => {
  const response = await withBaseUrlFallback(() => 
    apiClient.delete(`/agent/properties/${propertyId}/media/${imageId}`)
  );
  return response.data;
};

export const updateMediaOrderApi = async (propertyId, orderMap) => {
  const response = await withBaseUrlFallback(() => 
    apiClient.post(`/agent/properties/${propertyId}/media/reorder`, { order: orderMap })
  );
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
