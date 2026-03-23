import { 
  pickString, 
  propertyType, 
  propertyCategory, 
  propertyTimestamp,
  propertyOwner 
} from '../../../utils/dataMappers';

/**
 * Resuelve una etiqueta legible para el estado de la propiedad.
 */
export const resolveStatusLabel = (rawStatus) => {
  const lowered = pickString(rawStatus).toLowerCase();
  if (!lowered) return 'Pendiente';
  if (lowered.includes('public') || lowered === '1' || lowered === 'active') return 'Publicado';
  if (lowered.includes('pend') || lowered === '0' || lowered === 'inactive') return 'Pendiente';
  return rawStatus;
};

/**
 * Filtra y ordena una lista de inmuebles basada en criterios de búsqueda.
 */
export const filterProperties = (list, { searchText, statusFilter, typeFilter, categoryFilter }) => {
  if (!list || !Array.isArray(list)) return [];

  const search = pickString(searchText).toLowerCase();

  return [...list]
    .sort((a, b) => propertyTimestamp(b).localeCompare(propertyTimestamp(a)))
    .filter((property) => {
      // Búsqueda por texto (Título, Referencia, Propietario)
      if (search) {
        const title = pickString(property?.title ?? property?.name ?? property?.reference).toLowerCase();
        const reference = pickString(property?.reference).toLowerCase();
        const owner = propertyOwner(property).toLowerCase();
        
        if (!title.includes(search) && !reference.includes(search) && !owner.includes(search)) {
          return false;
        }
      }

      // Filtro de Estado
      if (statusFilter !== 'Todos') {
        const status = resolveStatusLabel(pickString(
          property?.status, 
          property?.state, 
          property?.publication_status, 
          property?.visibility, 
          'pendiente'
        ));
        if (status !== statusFilter) return false;
      }

      // Filtro de Tipo
      if (typeFilter !== 'Todos' && propertyType(property) !== typeFilter) {
        return false;
      }

      // Filtro de Categoría
      if (categoryFilter !== 'Todas' && propertyCategory(property) !== categoryFilter) {
        return false;
      }

      return true;
    });
};

/**
 * Genera opciones únicas de filtro basadas en los datos actuales.
 */
export const getFilterOptions = (list) => {
  const statusOpts = new Set(['Todos']);
  const typeOpts = new Set(['Todos']);
  const categoryOpts = new Set(['Todas']);

  list.forEach((p) => {
    statusOpts.add(resolveStatusLabel(pickString(p?.status, p?.state, p?.publication_status, p?.visibility, 'pendiente')));
    typeOpts.add(propertyType(p));
    categoryOpts.add(propertyCategory(p));
  });

  return {
    statusOptions: [...statusOpts],
    typeOptions: [...typeOpts],
    categoryOptions: [...categoryOpts],
  };
};
