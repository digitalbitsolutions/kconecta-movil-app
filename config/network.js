const stripTrailingSlash = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }
  return value.trim().replace(/\/+$/, '');
};

export const WEB_API_OVERRIDE_KEY = 'kconecta_api_base_url';

export const DEFAULT_API_BASE_URL = 'https://kconecta.com/api';

export const API_BASE_CANDIDATES = [
  process.env.EXPO_PUBLIC_API_BASE_URL,
  'https://kconecta.com/api',
  'https://www.kconecta.com/api',
  'https://api.kconecta.com/api',
]
  .map(stripTrailingSlash)
  .filter(Boolean);

export const LEGAL_URLS = {
  privacy: 'https://kconecta.com/legal/privacy',
  terms: 'https://kconecta.com/legal/terms',
  accountDeletion: 'https://kconecta.com/legal/account-deletion',
};

export const normalizeApiBaseUrl = stripTrailingSlash;
