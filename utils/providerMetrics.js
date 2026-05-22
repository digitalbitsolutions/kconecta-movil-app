import { parseNumber } from './dataMappers';

const pickObject = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) return payload.data;
  return payload;
};

const pickNumber = (source, keys) => {
  if (!source || typeof source !== 'object') return null;
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (!(key in source)) continue;
    const value = parseNumber(source[key]);
    if (Number.isFinite(value)) return value;
  }
  return null;
};

const clampMetric = (value) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value));
};

export const mapProviderMetricsResponse = (payload) => {
  const root = pickObject(payload) || {};
  const nested = pickObject(root.data) || {};
  const source = { ...root, ...nested };

  const visits = pickNumber(source, [
    'visits',
    'visits_count',
    'profile_visits',
    'profile_views',
    'views',
    'views_count',
    'rating_views',
  ]);

  const clicks = pickNumber(source, [
    'clicks',
    'clicks_count',
    'contact_clicks',
    'contacts_count',
    'whatsapp_clicks',
    'phone_clicks',
  ]);

  const tickets = pickNumber(source, [
    'tickets',
    'tickets_count',
    'service_tickets',
    'work_codes_count',
    'codes_count',
  ]);

  return {
    visits: clampMetric(visits ?? 0),
    clicks: clampMetric(clicks ?? 0),
    tickets: clampMetric(tickets ?? 0),
  };
};
