import { 
  isPublishedProperty, 
  propertyType, 
  propertyOwner, 
  sumByKeys, 
  parseNumber 
} from '../../utils/dataMappers';

export const calculateDashboardMetrics = (properties, user) => {
  if (!properties || !Array.isArray(properties)) return null;

  const publishedCount = properties.filter((p) => isPublishedProperty(p)).length;
  const pendingCount = Math.max(0, properties.length - publishedCount);

  // Owner Metrics
  const ownerCounts = new Map();
  properties.forEach((p) => {
    const key = propertyOwner(p);
    ownerCounts.set(key, (ownerCounts.get(key) || 0) + 1);
  });
  const ownerMetrics = [...ownerCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Type Distribution
  const typeCounts = new Map();
  properties.forEach((p) => {
    const key = propertyType(p);
    typeCounts.set(key, (typeCounts.get(key) || 0) + 1);
  });
  const typeDistribution = [...typeCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const maxTypeCount = typeDistribution.length ? typeDistribution[0].count : 1;

  // Global KPIs
  const viewsCountRaw = sumByKeys(properties, [
    'views_count', 'view_count', 'views', 'visits', 'counter', 'detail_views', 'ps_views_detail'
  ]);

  const uniqueViewersRaw = sumByKeys(properties, [
    'unique_viewers', 'unique_view_count', 'reviewers_count', 'visitors_count'
  ]);

  const contactClicksRaw = sumByKeys(properties, [
    'contact_clicks', 'contacts_count', 'phone_clicks', 'whatsapp_clicks', 'email_clicks', 'messages_count'
  ]);

  const searchViewsRaw = sumByKeys(properties, [
    'search_views', 'search_view_count', 'views_search_count'
  ]);

  const ownerUserIds = new Set();
  properties.forEach((p) => {
    const id = parseNumber(p?.user_id ?? p?.owner_id);
    if (id > 0) ownerUserIds.add(id);
  });

  const viewsCount = viewsCountRaw > 0 ? viewsCountRaw : properties.length;
  const uniqueViewersCount = uniqueViewersRaw > 0 ? uniqueViewersRaw : ownerUserIds.size;
  const contactClicks = contactClicksRaw > 0 ? contactClicksRaw : publishedCount;
  const searchViewsCount = searchViewsRaw > 0 ? searchViewsRaw : Math.max(properties.length, publishedCount);

  return {
    publishedCount,
    pendingCount,
    ownerMetrics,
    typeDistribution,
    maxTypeCount,
    viewsCount,
    uniqueViewersCount,
    contactClicks,
    searchViewsCount,
    recentProperties: properties.slice(0, 6),
  };
};
