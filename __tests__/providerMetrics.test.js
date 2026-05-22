import { mapProviderMetricsResponse } from '../utils/providerMetrics';

describe('providerMetrics mapper', () => {
  test('maps nested { data } shape', () => {
    const result = mapProviderMetricsResponse({
      success: true,
      data: {
        visits: 12,
        contact_clicks: 7,
        tickets_count: 3,
      },
    });

    expect(result).toEqual({ visits: 12, clicks: 7, tickets: 3 });
  });

  test('maps legacy flat shape', () => {
    const result = mapProviderMetricsResponse({
      profile_views: '15',
      whatsapp_clicks: '4',
      work_codes_count: '9',
    });

    expect(result).toEqual({ visits: 15, clicks: 4, tickets: 9 });
  });

  test('uses safe defaults when fields are missing', () => {
    const result = mapProviderMetricsResponse({ ok: true, data: {} });
    expect(result).toEqual({ visits: 0, clicks: 0, tickets: 0 });
  });

  test('maps deep nested metrics shape', () => {
    const result = mapProviderMetricsResponse({
      success: true,
      data: {
        profile: {
          metrics: {
            profile_visits_count: 1,
            contact_click_count: 1,
            service_tickets_count: 1,
          },
        },
      },
    });
    expect(result).toEqual({ visits: 1, clicks: 1, tickets: 1 });
  });

  test('prefers nested positive value over top-level zero', () => {
    const result = mapProviderMetricsResponse({
      data: {
        clicks_count: 0,
        stats: {
          contact_clicks_count: 2,
        },
      },
    });
    expect(result).toEqual({ visits: 0, clicks: 2, tickets: 0 });
  });

  test('does not crash on invalid payload', () => {
    expect(mapProviderMetricsResponse(null)).toEqual({ visits: 0, clicks: 0, tickets: 0 });
    expect(mapProviderMetricsResponse(undefined)).toEqual({ visits: 0, clicks: 0, tickets: 0 });
    expect(mapProviderMetricsResponse('bad')).toEqual({ visits: 0, clicks: 0, tickets: 0 });
  });
});
