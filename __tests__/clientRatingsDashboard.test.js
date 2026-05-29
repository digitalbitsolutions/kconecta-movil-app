import {
  mapClientDashboardResponse,
  submitRatingAndReloadDashboard,
} from '../utils/clientRatingsDashboard';

describe('clientRatingsDashboard', () => {
  test('maps dashboard payload safely', () => {
    const payload = {
      data: {
        ratingsCount: 3,
        providersRatedCount: 2,
        averageStars: 4.5,
        recentRatings: [
          {
            provider_user_id: 11,
            provider_name: 'Proveedor Uno',
            stars: 5,
            updated_at: '2026-05-29 12:35:00',
            work_code: 'WK-ABC12345',
          },
        ],
      },
    };

    const result = mapClientDashboardResponse(payload);
    expect(result.stats.ratingsCount).toBe(3);
    expect(result.stats.providersRatedCount).toBe(2);
    expect(result.stats.averageStars).toBe(4.5);
    expect(result.recentRatings).toHaveLength(1);
    expect(result.recentRatings[0].provider).toBe('Proveedor Uno');
    expect(result.recentRatings[0].stars).toBe(5);
    expect(result.recentRatings[0].workCode).toBe('WK-ABC12345');
  });

  test('uses fallback code when work_code is missing in legacy payload', () => {
    const payload = {
      data: {
        ratingsCount: 1,
        providersRatedCount: 1,
        averageStars: 5,
        recentRatings: [
          {
            id: 44,
            provider_user_id: 11,
            provider_name: 'Proveedor Uno',
            stars: 5,
            updated_at: '2026-05-29 12:35:00',
          },
        ],
      },
    };

    const result = mapClientDashboardResponse(payload);
    expect(result.recentRatings[0].workCode).toBe('RATING-44');
  });

  test('submit -> refresh flow calls both APIs and returns refreshed dashboard', async () => {
    const submitByCode = jest.fn().mockResolvedValue({
      success: true,
      message: 'Valoracion registrada correctamente.',
    });
    const fetchDashboard = jest.fn().mockResolvedValue({
      data: {
        ratingsCount: 10,
        providersRatedCount: 4,
        averageStars: 4.2,
        recentRatings: [],
      },
    });

    const result = await submitRatingAndReloadDashboard({
      workCode: 'WK-12345',
      stars: 5,
      submitByCode,
      fetchDashboard,
    });

    expect(submitByCode).toHaveBeenCalledTimes(1);
    expect(submitByCode).toHaveBeenCalledWith({ workCode: 'WK-12345', stars: 5 });
    expect(fetchDashboard).toHaveBeenCalledTimes(1);
    expect(result.mappedDashboard.stats.ratingsCount).toBe(10);
    expect(result.mappedDashboard.stats.providersRatedCount).toBe(4);
  });

  test('validates required work code and stars', async () => {
    await expect(
      submitRatingAndReloadDashboard({
        workCode: '',
        stars: 5,
        submitByCode: jest.fn(),
        fetchDashboard: jest.fn(),
      })
    ).rejects.toThrow('WORK_CODE_REQUIRED');

    await expect(
      submitRatingAndReloadDashboard({
        workCode: 'WK-1',
        stars: 0,
        submitByCode: jest.fn(),
        fetchDashboard: jest.fn(),
      })
    ).rejects.toThrow('STARS_REQUIRED');
  });
});
