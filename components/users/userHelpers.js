import { parseNumber, pickString } from '../../utils/dataMappers';

/**
 * Agrega y cuenta inmuebles por cada usuario a partir de una lista plana de propiedades.
 * @param {Array} properties - Lista de inmuebles devuelta por el API.
 * @returns {Array} - Lista de usuarios agregados con su conteo de inmuebles, ordenada por volumen.
 */
export const aggregateUsersByProperties = (properties) => {
  if (!properties || !Array.isArray(properties)) return [];
  
  const userMap = new Map();

  properties.forEach((property) => {
    const userId = parseNumber(property?.user_id ?? property?.owner_id);
    if (!userId) return;

    // Resolvemos el nombre de forma robusta igualando la logica del mapper
    const displayName = pickString(
      property?.user_name,
      property?.owner_name,
      `${pickString(property?.user_first_name)} ${pickString(property?.user_last_name)}`.trim(),
      `Usuario #${userId}`
    );

    const existing = userMap.get(userId) || {
      userId,
      displayName,
      propertiesCount: 0,
    };

    existing.propertiesCount += 1;
    
    // Si el nombre anteriormente era el fallback generico, intentamos usar el nuevo si es mas rico
    if (existing.displayName.startsWith('Usuario #') && !displayName.startsWith('Usuario #')) {
      existing.displayName = displayName;
    }

    userMap.set(userId, existing);
  });

  return [...userMap.values()].sort((a, b) => b.propertiesCount - a.propertiesCount);
};

/**
 * Calcula el total de inmuebles sumando los conteos individuales de la lista agregada.
 * @param {Array} users - Lista devuelta por aggregateUsersByProperties.
 * @returns {number}
 */
export const calculateTotalPropertiesFromUsers = (users) => {
  return users.reduce((total, u) => total + parseNumber(u.propertiesCount), 0);
};
