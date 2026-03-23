import { useEffect, useMemo, useState } from 'react';
import { getApiErrorDetails, getPropertyFormCatalogsApi } from '../api/client';

const EMPTY_CATALOGS = Object.freeze({
  plant: [],
  type_floor: [],
  visibility_in_portals: [],
  rental_type: [],
  reason_for_sale: [],
  typology: [],
  orientation: [],
  type_heating: [],
  heating_fuel: [],
  power_consumption_rating: [],
  emissions_rating: [],
  state_conservation: [],
  facade: [],
  feature: [],
  equipment: [],
  plaza_capacity: [],
  type_of_terrain: [],
  wheeled_access: [],
  nearest_municipality_distance: [],
  location_premises: [],
});

const catalogsCache = new Map();

const normalizeOption = (item) => {
  if (!item || typeof item !== 'object') return null;

  const value = item.value ?? item.id ?? item.key ?? null;
  const label = item.label ?? item.name ?? item.title ?? null;

  if (value === null || value === undefined) return null;
  if (label === null || label === undefined) return null;

  const normalizedValue = String(value).trim();
  const normalizedLabel = String(label).trim();

  if (!normalizedValue || !normalizedLabel) return null;

  return {
    value: normalizedValue,
    label: normalizedLabel,
  };
};

const normalizeCatalogs = (payload) => {
  const source =
    payload?.data?.catalogs && typeof payload.data.catalogs === 'object'
      ? payload.data.catalogs
      : payload?.catalogs && typeof payload.catalogs === 'object'
        ? payload.catalogs
        : payload?.data && typeof payload.data === 'object'
          ? payload.data
          : {};

  const normalized = { ...EMPTY_CATALOGS };

  Object.keys(EMPTY_CATALOGS).forEach((key) => {
    const items = Array.isArray(source?.[key]) ? source[key] : [];
    normalized[key] = items.map((item) => normalizeOption(item)).filter(Boolean);
  });

  return normalized;
};

export default function usePropertyFormCatalogs(typeId) {
  const normalizedTypeId = useMemo(() => {
    const parsed = Number(typeId);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [typeId]);
  const [catalogs, setCatalogs] = useState(EMPTY_CATALOGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!normalizedTypeId) {
      setCatalogs(EMPTY_CATALOGS);
      setLoading(false);
      setError('');
      return;
    }

    if (catalogsCache.has(normalizedTypeId) && reloadToken === 0) {
      setCatalogs(catalogsCache.get(normalizedTypeId));
      setLoading(false);
      setError('');
      return;
    }

    let cancelled = false;

    const loadCatalogs = async () => {
      setLoading(true);
      setError('');

      try {
        const payload = await getPropertyFormCatalogsApi(normalizedTypeId);
        if (cancelled) return;

        const normalized = normalizeCatalogs(payload);
        catalogsCache.set(normalizedTypeId, normalized);
        setCatalogs(normalized);
      } catch (requestError) {
        if (cancelled) return;
        const details = getApiErrorDetails(requestError);
        setCatalogs(EMPTY_CATALOGS);
        setError(details.message || 'No se pudieron cargar los catalogos del formulario.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCatalogs();

    return () => {
      cancelled = true;
    };
  }, [normalizedTypeId, reloadToken]);

  return {
    catalogs,
    loading,
    error,
    reload: () => setReloadToken((value) => value + 1),
  };
}
