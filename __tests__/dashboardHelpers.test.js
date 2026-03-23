import { calculateDashboardMetrics } from '../components/dashboard/dashboardHelpers';

describe('dashboardHelpers', () => {
  const mockProperties = [
    {
      id: 1,
      title: 'Piso Centro',
      type_name: 'Piso',
      status: 'publicado',
      views_count: 10,
      user_id: 101,
      owner_name: 'Agente A'
    },
    {
      id: 2,
      title: 'Casa Playa',
      type_name: 'Casa',
      status: 'inactivo',
      views: 5,
      user_id: 101,
      owner_name: 'Agente A'
    },
    {
      id: 3,
      title: 'Garaje',
      type_name: 'Garaje',
      status: 'publicado',
      visits: 2,
      user_id: 102,
      owner_name: 'Agente B'
    }
  ];

  test('calculateDashboardMetrics computes totals correctly', () => {
    const result = calculateDashboardMetrics(mockProperties, {});
    
    expect(result.publishedCount).toBe(2);
    expect(result.pendingCount).toBe(1);
    expect(result.viewsCount).toBe(17); // 10 + 5 + 2
    expect(result.uniqueViewersCount).toBe(2); // 2 distinct user_ids: 101, 102
  });

  test('calculateDashboardMetrics groups by owner correctly', () => {
    const result = calculateDashboardMetrics(mockProperties, {});
    
    expect(result.ownerMetrics).toHaveLength(2);
    expect(result.ownerMetrics[0].label).toBe('Agente A');
    expect(result.ownerMetrics[0].count).toBe(2);
  });

  test('calculateDashboardMetrics groups by type distribution', () => {
    const result = calculateDashboardMetrics(mockProperties, {});
    
    expect(result.typeDistribution).toHaveLength(3);
    expect(result.maxTypeCount).toBe(1);
    const types = result.typeDistribution.map(d => d.label);
    expect(types).toContain('Piso');
    expect(types).toContain('Casa');
    expect(types).toContain('Garaje');
  });

  test('calculateDashboardMetrics handles empty list', () => {
    const result = calculateDashboardMetrics([], {});
    expect(result.publishedCount).toBe(0);
    expect(result.viewsCount).toBe(0);
    expect(result.typeDistribution).toEqual([]);
  });

  test('calculateDashboardMetrics returns null for invalid input', () => {
    expect(calculateDashboardMetrics(null, {})).toBeNull();
    expect(calculateDashboardMetrics(undefined, {})).toBeNull();
  });
});
