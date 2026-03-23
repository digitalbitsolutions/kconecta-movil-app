import { 
  resolveStatusLabel, 
  filterProperties, 
  getFilterOptions 
} from '../components/property/list/propertyListHelpers';

describe('propertyListHelpers', () => {
  const mockProperties = [
    { 
      id: 1, 
      title: 'Piso Centro', 
      status: 'publicado', 
      type_name: 'Piso', 
      operation_type: 'Venta', 
      updated_at: '2026-03-23T02:00:00Z' 
    },
    { 
      id: 2, 
      title: 'Casa Playa', 
      status: 'pendiente', 
      type_name: 'Casa', 
      operation_type: 'Alquiler', 
      updated_at: '2026-03-22T02:00:00Z' 
    },
    { 
      id: 3, 
      title: 'Garaje 1', 
      status: 'publicado', 
      type_name: 'Garaje', 
      operation_type: 'Venta', 
      updated_at: '2026-03-21T02:00:00Z' 
    }
  ];

  test('resolveStatusLabel handles various status formats', () => {
    expect(resolveStatusLabel('publicado')).toBe('Publicado');
    expect(resolveStatusLabel('1')).toBe('Publicado');
    expect(resolveStatusLabel('active')).toBe('Publicado');
    expect(resolveStatusLabel('0')).toBe('Pendiente');
    expect(resolveStatusLabel('pendiente')).toBe('Pendiente');
    expect(resolveStatusLabel('')).toBe('Pendiente');
    expect(resolveStatusLabel('alquilado')).toBe('alquilado');
  });

  test('filterProperties sorts by date descending', () => {
    const result = filterProperties(mockProperties, { searchText: '', statusFilter: 'Todos', typeFilter: 'Todos', categoryFilter: 'Todas' });
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
    expect(result[2].id).toBe(3);
  });

  test('filterProperties searches by text accurately', () => {
    const filters = { searchText: 'Playa', statusFilter: 'Todos', typeFilter: 'Todos', categoryFilter: 'Todas' };
    const result = filterProperties(mockProperties, filters);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Casa Playa');
  });

  test('filterProperties applies status selection', () => {
    const filters = { searchText: '', statusFilter: 'Publicado', typeFilter: 'Todos', categoryFilter: 'Todas' };
    const result = filterProperties(mockProperties, filters);
    expect(result).toHaveLength(2); // Piso Centro and Garaje 1
    result.forEach(p => expect(resolveStatusLabel(p.status)).toBe('Publicado'));
  });

  test('filterProperties applies type selection', () => {
    const filters = { searchText: '', statusFilter: 'Todos', typeFilter: 'Casa', categoryFilter: 'Todas' };
    const result = filterProperties(mockProperties, filters);
    expect(result).toHaveLength(1);
    expect(result[0].type_name).toBe('Casa');
  });

  test('filterProperties applies category selection', () => {
    const filters = { searchText: '', statusFilter: 'Todos', typeFilter: 'Todos', categoryFilter: 'Venta' };
    const result = filterProperties(mockProperties, filters);
    expect(result).toHaveLength(2); // Piso and Garaje
    expect(result.map(p => p.operation_type)).toContain('Venta');
  });

  test('getFilterOptions generates unique options properly', () => {
    const options = getFilterOptions(mockProperties);
    expect(options.statusOptions).toEqual(['Todos', 'Publicado', 'Pendiente']);
    expect(options.typeOptions).toEqual(['Todos', 'Piso', 'Casa', 'Garaje']);
    expect(options.categoryOptions).toEqual(['Todas', 'Venta', 'Alquiler']);
  });

  test('filterProperties handles null input gracefully', () => {
    expect(filterProperties(null, {})).toEqual([]);
    expect(filterProperties(undefined, {})).toEqual([]);
  });
});
