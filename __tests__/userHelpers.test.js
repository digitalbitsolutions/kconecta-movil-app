import { 
  aggregateUsersByProperties, 
  calculateTotalPropertiesFromUsers 
} from '../components/users/userHelpers';

describe('userHelpers', () => {
  const mockProperties = [
    { property_id: 1, user_id: 101, user_name: 'Agente A' },
    { property_id: 2, user_id: 101, user_name: 'Agente A' },
    { property_id: 3, user_id: 101, user_name: 'Agente A' },
    { property_id: 4, user_id: 102, user_name: 'Agente B' },
    { property_id: 5, user_id: 102, user_name: 'Agente B' }
  ];

  test('aggregateUsersByProperties groups correctly', () => {
    const result = aggregateUsersByProperties(mockProperties);
    
    expect(result).toHaveLength(2);
    expect(result[0].userId).toBe(101);
    expect(result[1].userId).toBe(102);
    expect(result[0].propertiesCount).toBe(3);
    expect(result[1].propertiesCount).toBe(2);
  });

  test('aggregateUsersByProperties resolves name fallbacks', () => {
    const props = [
      { property_id: 1, user_id: 103, user_first_name: 'Ana', user_last_name: 'Perez' },
      { property_id: 2, user_id: 104 }
    ];
    const result = aggregateUsersByProperties(props);
    expect(result[0].displayName).toBe('Ana Perez');
    expect(result[1].displayName).toBe('Usuario #104');
  });

  test('calculateTotalPropertiesFromUsers computes correctly', () => {
    const users = [
      { propertiesCount: 5 },
      { propertiesCount: 10 }
    ];
    expect(calculateTotalPropertiesFromUsers(users)).toBe(15);
  });

  test('aggregateUsersByProperties handles invalid input gracefully', () => {
    expect(aggregateUsersByProperties(null)).toEqual([]);
    expect(aggregateUsersByProperties(undefined)).toEqual([]);
    expect(aggregateUsersByProperties({})).toEqual([]);
    expect(aggregateUsersByProperties([])).toEqual([]);
  });
});
