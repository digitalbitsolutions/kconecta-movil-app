import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  getApiErrorDetails,
  getProviderMetricsApi,
  registerContactClickApi,
  registerServiceVisitApi,
} from '../api/client';

const METRICS_CACHE_KEY = 'provider_metrics_cache_v1';
const TRACKING_TIMEOUT_MS = 1800;

export const DEFAULT_PROVIDER_METRICS = { visits: 0, clicks: 0, tickets: 0 };

const nowIso = () => new Date().toISOString();

const makeEventId = (prefix, serviceId, providerUserId) => {
  const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${providerUserId}-${serviceId}-${seed}`;
};

const readCacheRaw = async () => {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(METRICS_CACHE_KEY);
  }
  return SecureStore.getItemAsync(METRICS_CACHE_KEY);
};

const writeCacheRaw = async (value) => {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(METRICS_CACHE_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(METRICS_CACHE_KEY, value);
};

export const readProviderMetricsCache = async () => {
  try {
    const raw = await readCacheRaw();
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const metrics = parsed?.metrics || {};
    return {
      metrics: {
        visits: Number.isFinite(metrics?.visits) ? metrics.visits : 0,
        clicks: Number.isFinite(metrics?.clicks) ? metrics.clicks : 0,
        tickets: Number.isFinite(metrics?.tickets) ? metrics.tickets : 0,
      },
      cachedAt: parsed?.cachedAt || null,
    };
  } catch (_error) {
    return null;
  }
};

export const writeProviderMetricsCache = async (metrics) => {
  const safe = {
    visits: Number.isFinite(metrics?.visits) ? metrics.visits : 0,
    clicks: Number.isFinite(metrics?.clicks) ? metrics.clicks : 0,
    tickets: Number.isFinite(metrics?.tickets) ? metrics.tickets : 0,
  };
  const payload = JSON.stringify({ metrics: safe, cachedAt: nowIso() });
  try {
    await writeCacheRaw(payload);
  } catch (_error) {
    // ignore cache write failures
  }
};

export const getProviderMetricsSafe = async () => {
  try {
    const metrics = await getProviderMetricsApi();
    await writeProviderMetricsCache(metrics);
    return { metrics: { ...DEFAULT_PROVIDER_METRICS, ...metrics }, source: 'api', cachedAt: nowIso() };
  } catch (error) {
    const cached = await readProviderMetricsCache();
    if (cached?.metrics) {
      return { metrics: cached.metrics, source: 'cache', cachedAt: cached.cachedAt, error };
    }
    return { metrics: DEFAULT_PROVIDER_METRICS, source: 'default', cachedAt: null, error };
  }
};

const withTimeout = async (promise, timeoutMs = TRACKING_TIMEOUT_MS) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('tracking_timeout')), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

export const trackServiceVisitSafe = async ({ serviceId, providerUserId, source = 'mobile_app' } = {}) => {
  if (!serviceId || !providerUserId) return { skipped: true };
  const eventId = makeEventId('visit', serviceId, providerUserId);
  try {
    await withTimeout(
      registerServiceVisitApi({
        serviceId,
        providerUserId,
        source,
        eventId,
        idempotencyKey: eventId,
      })
    );
    return { ok: true, eventId };
  } catch (error) {
    return { ok: false, eventId, error: getApiErrorDetails(error).message };
  }
};

export const trackContactClickSafe = async ({
  serviceId,
  providerUserId,
  channel = 'whatsapp',
  source = 'mobile_app',
} = {}) => {
  if (!serviceId || !providerUserId) return { skipped: true };
  const eventId = makeEventId('contact', serviceId, providerUserId);
  try {
    await withTimeout(
      registerContactClickApi({
        serviceId,
        providerUserId,
        channel,
        source,
        eventId,
        idempotencyKey: eventId,
      })
    );
    return { ok: true, eventId };
  } catch (error) {
    return { ok: false, eventId, error: getApiErrorDetails(error).message };
  }
};

