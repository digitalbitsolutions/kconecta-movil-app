import { parseNumber } from './dataMappers';

const pickObject = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) return payload.data;
  return payload;
};

const collectCandidateObjects = (payload) => {
  const queue = [payload];
  const visited = new Set();
  const collected = [];
  let depth = 0;

  while (queue.length && depth < 4) {
    const levelSize = queue.length;
    for (let i = 0; i < levelSize; i += 1) {
      const current = queue.shift();
      if (!current || typeof current !== 'object' || Array.isArray(current)) continue;
      if (visited.has(current)) continue;
      visited.add(current);
      collected.push(current);

      const keys = Object.keys(current);
      for (let k = 0; k < keys.length; k += 1) {
        const value = current[keys[k]];
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          queue.push(value);
        }
      }
    }
    depth += 1;
  }

  return collected;
};

const pickNumberFromSources = (sources, keys) => {
  let firstFinite = null;
  for (let s = 0; s < sources.length; s += 1) {
    const source = sources[s];
    if (!source || typeof source !== 'object') continue;
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      if (!(key in source)) continue;
      const value = parseNumber(source[key]);
      if (!Number.isFinite(value)) continue;
      if (firstFinite === null) firstFinite = value;
      if (value > 0) return value;
    }
  }
  return firstFinite ?? 0;
};

const clampMetric = (value) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value));
};

export const mapProviderMetricsResponse = (payload) => {
  const root = payload && typeof payload === 'object' ? payload : {};
  const primary = pickObject(root) || root;
  const sources = collectCandidateObjects(primary);

  const visits = pickNumberFromSources(sources, [
    'visits',
    'visits_count',
    'profile_visits_count',
    'profile_visits',
    'profile_views',
    'views',
    'views_count',
    'visit_count',
    'rating_views',
  ]);

  const clicks = pickNumberFromSources(sources, [
    'clicks',
    'clicks_count',
    'contact_clicks_count',
    'contact_click_count',
    'contact_clicks',
    'contacts_count',
    'whatsapp_clicks',
    'phone_clicks',
    'message_clicks',
  ]);

  const tickets = pickNumberFromSources(sources, [
    'tickets',
    'tickets_count',
    'service_tickets',
    'service_tickets_count',
    'work_codes_count',
    'codes_count',
  ]);

  return {
    visits: clampMetric(visits),
    clicks: clampMetric(clicks),
    tickets: clampMetric(tickets),
  };
};
