import { parseNumber, pickString } from './dataMappers';

const extractLevelId = (rawUser) => parseNumber(rawUser?.user_level_id ?? rawUser?.level_id ?? rawUser?.role_id);

const extractPropertyOwnerId = (property) =>
  parseNumber(
    property?.user_id ??
      property?.owner_id ??
      property?.userId ??
      property?.ownerId ??
      property?.user?.id ??
      property?.owner?.id
  );

export const extractUserId = (rawUser) => parseNumber(rawUser?.id ?? rawUser?.user_id ?? rawUser?.userId);

export const isAdminUser = (rawUser) => {
  const levelId = extractLevelId(rawUser);
  if (levelId === 1) return true;
  const roleText = pickString(rawUser?.role, rawUser?.user_level_name).toLowerCase();
  return roleText.includes('admin');
};

export const canManagePropertiesUser = (rawUser) => {
  if (isAdminUser(rawUser)) return true;
  const levelId = extractLevelId(rawUser);
  return levelId === 2 || levelId === 3 || levelId === 5;
};

export const canAccessUsers = (rawUser) => isAdminUser(rawUser);

export const canEditPropertyUser = (rawUser, property) => {
  if (!canManagePropertiesUser(rawUser)) return false;
  if (isAdminUser(rawUser)) return true;

  const currentUserId = extractUserId(rawUser);
  const propertyOwnerId = extractPropertyOwnerId(property);

  return currentUserId > 0 && propertyOwnerId > 0 && currentUserId === propertyOwnerId;
};
