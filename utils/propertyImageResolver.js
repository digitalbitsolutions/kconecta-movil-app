import { apiClient } from '../api/client';

const IMAGE_EXTENSION_REGEX = /\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?.*)?$/i;
const VIDEO_EXTENSION_REGEX = /\.(mp4|mov|webm|m4v|avi|mkv|3gp|mpeg|mpg)(\?.*)?$/i;

const pickString = (...values) => {
  for (let index = 0; index < values.length; index += 1) {
    const current = values[index];
    if (typeof current === 'string' && current.trim()) return current.trim();
  }
  return '';
};

const parseJsonSafe = (value) => {
  try {
    return JSON.parse(value);
  } catch (_error) {
    return null;
  }
};

const getApiOrigin = () => {
  const configuredBase = pickString(apiClient?.defaults?.baseURL);
  if (!configuredBase) return 'https://www.kconecta.com';

  try {
    return new URL(configuredBase).origin;
  } catch (_error) {
    return 'https://www.kconecta.com';
  }
};

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value);
const isProtocolRelative = (value) => /^\/\//.test(value);
const looksLikeImageFile = (value) => IMAGE_EXTENSION_REGEX.test(value);
const looksLikeVideoFile = (value) => VIDEO_EXTENSION_REGEX.test(value);

const normalizePath = (rawValue) => pickString(rawValue).replace(/\\/g, '/');

const makeAbsoluteUploadUrl = (rawValue, defaultFolder, matcher) => {
  const value = normalizePath(rawValue);
  if (!value) return '';

  if (isAbsoluteUrl(value)) return value;
  if (isProtocolRelative(value)) return `https:${value}`;

  const origin = getApiOrigin();

  if (value.startsWith('/')) {
    return `${origin}${value}`;
  }

  if (value.startsWith('img/') || value.startsWith('storage/')) {
    return `${origin}/${value}`;
  }

  if (typeof matcher === 'function' && matcher(value)) {
    return `${origin}/${defaultFolder}/${value}`;
  }

  return '';
};

const makeAbsoluteMediaUrl = (rawValue) => makeAbsoluteUploadUrl(rawValue, 'img/uploads', looksLikeImageFile);

const makeAbsoluteVideoUrl = (rawValue) => {
  const value = normalizePath(rawValue);
  if (!value) return '';

  if (isAbsoluteUrl(value)) return value;
  if (isProtocolRelative(value)) return `https:${value}`;

  const origin = getApiOrigin();

  if (value.startsWith('/')) {
    return `${origin}${value}`;
  }

  if (value.startsWith('video/') || value.startsWith('storage/video/')) {
    return `${origin}/${value}`;
  }

  if (looksLikeVideoFile(value)) {
    return `${origin}/video/uploads/${value}`;
  }

  return '';
};

const pickFromObject = (value) => {
  if (!value || typeof value !== 'object') return '';
  return pickString(
    value.url,
    value.image_url,
    value.image,
    value.path,
    value.src,
    value.cover_image,
    value.file,
    value.filename,
    value.name
  );
};

const extractFirstCandidate = (candidate) => {
  if (!candidate) return '';

  if (typeof candidate === 'string') {
    const trimmed = candidate.trim();
    if (!trimmed) return '';

    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      const parsed = parseJsonSafe(trimmed);
      return extractFirstCandidate(parsed);
    }

    return trimmed;
  }

  if (Array.isArray(candidate)) {
    for (let index = 0; index < candidate.length; index += 1) {
      const resolved = extractFirstCandidate(candidate[index]);
      if (resolved) return resolved;
    }
    return '';
  }

  if (typeof candidate === 'object') {
    const direct = pickFromObject(candidate);
    if (direct) return direct;

    return extractFirstCandidate(
      candidate.data ||
        candidate.attributes ||
        candidate.cover_image ||
        candidate.cover ||
        candidate.images ||
        candidate.more_images
    );
  }

  return '';
};

const extractAllCandidates = (candidate, bucket = []) => {
  if (!candidate) return bucket;

  if (typeof candidate === 'string') {
    const trimmed = candidate.trim();
    if (!trimmed) return bucket;

    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      const parsed = parseJsonSafe(trimmed);
      return extractAllCandidates(parsed, bucket);
    }

    bucket.push(trimmed);
    return bucket;
  }

  if (Array.isArray(candidate)) {
    candidate.forEach((entry) => extractAllCandidates(entry, bucket));
    return bucket;
  }

  if (typeof candidate === 'object') {
    const direct = pickFromObject(candidate);
    if (direct) bucket.push(direct);

    extractAllCandidates(candidate.data, bucket);
    extractAllCandidates(candidate.attributes, bucket);
    extractAllCandidates(candidate.cover_image, bucket);
    extractAllCandidates(candidate.cover, bucket);
    extractAllCandidates(candidate.images, bucket);
    extractAllCandidates(candidate.more_images, bucket);
    extractAllCandidates(candidate.gallery, bucket);
    extractAllCandidates(candidate.files, bucket);
    extractAllCandidates(candidate.video, bucket);
  }

  return bucket;
};

const extractGalleryCandidates = (candidate, bucket = []) => {
  if (!candidate) return bucket;

  if (typeof candidate === 'string') {
    const trimmed = candidate.trim();
    if (!trimmed) return bucket;

    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      const parsed = parseJsonSafe(trimmed);
      return extractGalleryCandidates(parsed, bucket);
    }

    bucket.push(trimmed);
    return bucket;
  }

  if (Array.isArray(candidate)) {
    candidate.forEach((entry) => extractGalleryCandidates(entry, bucket));
    return bucket;
  }

  if (typeof candidate === 'object') {
    const direct = pickString(candidate.url, candidate.image_url, candidate.image, candidate.path, candidate.src, candidate.file, candidate.filename, candidate.name);
    if (direct) bucket.push(direct);

    extractGalleryCandidates(candidate.data, bucket);
    extractGalleryCandidates(candidate.attributes, bucket);
    extractGalleryCandidates(candidate.images, bucket);
    extractGalleryCandidates(candidate.more_images, bucket);
    extractGalleryCandidates(candidate.gallery, bucket);
    extractGalleryCandidates(candidate.files, bucket);
  }

  return bucket;
};

const extractGalleryEntries = (candidate, bucket = []) => {
  if (!candidate) return bucket;

  if (typeof candidate === 'string') {
    const trimmed = candidate.trim();
    if (!trimmed) return bucket;

    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      const parsed = parseJsonSafe(trimmed);
      return extractGalleryEntries(parsed, bucket);
    }

    bucket.push({ id: null, raw: trimmed });
    return bucket;
  }

  if (Array.isArray(candidate)) {
    candidate.forEach((entry) => extractGalleryEntries(entry, bucket));
    return bucket;
  }

  if (typeof candidate === 'object') {
    const direct = pickString(candidate.url, candidate.image_url, candidate.image, candidate.path, candidate.src, candidate.file, candidate.filename, candidate.name);
    if (direct) {
      bucket.push({
        id: candidate.id ?? null,
        raw: direct,
      });
    }

    extractGalleryEntries(candidate.data, bucket);
    extractGalleryEntries(candidate.attributes, bucket);
    extractGalleryEntries(candidate.images, bucket);
    extractGalleryEntries(candidate.more_images, bucket);
    extractGalleryEntries(candidate.gallery, bucket);
    extractGalleryEntries(candidate.files, bucket);
  }

  return bucket;
};

const unique = (values) => [...new Set((values || []).filter(Boolean))];

export const resolvePropertyImageUrl = (property) => {
  if (!property || typeof property !== 'object') return '';

  const candidates = [
    property.photo,
    property.image,
    property.image_url,
    property.cover_image_url,
    property.cover_image,
    property.coverImage,
    property.cover,
  ];

  for (let index = 0; index < candidates.length; index += 1) {
    const rawCandidate = extractFirstCandidate(candidates[index]);
    if (!rawCandidate) continue;

    const resolved = makeAbsoluteMediaUrl(rawCandidate);
    if (resolved) return resolved;
  }

  return '';
};

export const resolvePropertyGalleryImageUrls = (property) => {
  if (!property || typeof property !== 'object') return [];

  const candidates = [
    property.more_images,
    property.moreImages,
    property.gallery,
    property.images,
    property.files,
  ];

  const collected = [];
  candidates.forEach((entry) => extractGalleryCandidates(entry, collected));

  return unique(collected.map((candidate) => makeAbsoluteMediaUrl(candidate)).filter(Boolean));
};

export const resolvePropertyGalleryImages = (property) => {
  if (!property || typeof property !== 'object') return [];

  const candidates = [
    property.more_images,
    property.moreImages,
    property.gallery,
    property.images,
    property.files,
  ];

  const collected = [];
  candidates.forEach((entry) => extractGalleryEntries(entry, collected));

  const seen = new Set();
  return collected.reduce((acc, item) => {
    const url = makeAbsoluteMediaUrl(item?.raw);
    if (!url) return acc;

    const fingerprint = `${item?.id ?? 'no-id'}::${url}`;
    if (seen.has(fingerprint)) return acc;
    seen.add(fingerprint);
    acc.push({
      id: item?.id ?? null,
      url,
    });
    return acc;
  }, []);
};

export const resolvePropertyVideoUrl = (property) => {
  if (!property || typeof property !== 'object') return '';

  const candidates = [
    property.video_url,
    property.video,
    property.video_file,
    property.videoFile,
    property.files,
    property.media,
  ];

  const collected = [];
  candidates.forEach((entry) => extractAllCandidates(entry, collected));

  for (let index = 0; index < collected.length; index += 1) {
    const candidate = collected[index];
    const resolved = makeAbsoluteVideoUrl(candidate) || makeAbsoluteMediaUrl(candidate);
    if (resolved) return resolved;
  }

  return '';
};
