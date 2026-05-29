const formatClientDate = (value) => {
  if (!value) return '-';
  const parsed = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const extractServiceCode = (item) => {
  if (!item || typeof item !== 'object') return '';
  const candidates = [
    item.work_code,
    item.workCode,
    item.service_code,
    item.serviceCode,
    item.ticket_code,
    item.ticketCode,
    item.service_ticket_code,
    item.serviceTicketCode,
    item.work_order_code,
    item.workOrderCode,
    item.job_code,
    item.jobCode,
    item.code_work,
    item.ticket,
    item.code,
    item.reference,
    item.folio,
    item.order_code,
    item.orderCode,
  ];
  for (let i = 0; i < candidates.length; i += 1) {
    const value = String(candidates[i] ?? '').trim();
    if (value) return value;
  }

  const nestedCandidates = [
    item?.service?.work_code,
    item?.service?.workCode,
    item?.service?.service_code,
    item?.service?.serviceCode,
    item?.service?.ticket_code,
    item?.service?.ticketCode,
    item?.service?.code,
    item?.service?.reference,
    item?.ticket?.code,
    item?.work_order?.code,
    item?.workOrder?.code,
    item?.service_work_code?.code,
    item?.serviceWorkCode?.code,
    item?.service_work_codes?.code,
    item?.serviceWorkCodes?.code,
    item?.service_work_code_code,
    item?.serviceWorkCodeCode,
  ];
  for (let i = 0; i < nestedCandidates.length; i += 1) {
    const value = String(nestedCandidates[i] ?? '').trim();
    if (value) return value;
  }

  const fallbackId = item?.rating_id ?? item?.id ?? item?.service_rating_id ?? null;
  if (fallbackId !== null && fallbackId !== undefined && String(fallbackId).trim()) {
    return `RATING-${String(fallbackId).trim()}`;
  }

  return '';
};

const splitDateTime = (value) => {
  if (!value) return { dateLabel: '-', timeLabel: '-' };
  const parsed = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) {
    return { dateLabel: String(value), timeLabel: '-' };
  }
  return {
    dateLabel: parsed.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    timeLabel: parsed.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
};

export const mapClientDashboardResponse = (payload) => {
  const data = payload?.data || {};
  const ratingsCount = Number.parseInt(String(data?.ratingsCount ?? 0), 10);
  const providersRatedCount = Number.parseInt(String(data?.providersRatedCount ?? 0), 10);
  const averageStars = Number.parseFloat(String(data?.averageStars ?? 0));
  const recentRatings = Array.isArray(data?.recentRatings) ? data.recentRatings : [];

  return {
    stats: {
      ratingsCount: Number.isFinite(ratingsCount) ? ratingsCount : 0,
      providersRatedCount: Number.isFinite(providersRatedCount) ? providersRatedCount : 0,
      averageStars: Number.isFinite(averageStars) ? averageStars : 0,
    },
    recentRatings: recentRatings.map((item, index) => ({
      id: `${item?.provider_user_id ?? 'provider'}-${item?.updated_at ?? index}-${index}`,
      provider: String(item?.provider_name || `Proveedor #${item?.provider_user_id ?? '-'}`),
      stars: Number.parseInt(String(item?.stars ?? 0), 10) || 0,
      updatedAt: formatClientDate(item?.updated_at),
      dateLabel: splitDateTime(item?.updated_at).dateLabel,
      timeLabel: splitDateTime(item?.updated_at).timeLabel,
      workCode: extractServiceCode(item),
    })),
  };
};

export const submitRatingAndReloadDashboard = async ({
  workCode,
  stars,
  submitByCode,
  fetchDashboard,
}) => {
  const cleanCode = String(workCode ?? '').trim();
  if (!cleanCode) {
    throw new Error('WORK_CODE_REQUIRED');
  }
  const safeStars = Number.parseInt(String(stars ?? 0), 10);
  if (!safeStars || safeStars < 1 || safeStars > 5) {
    throw new Error('STARS_REQUIRED');
  }

  const submitPayload = await submitByCode({ workCode: cleanCode, stars: safeStars });
  const dashboardPayload = await fetchDashboard();

  return {
    submitPayload,
    mappedDashboard: mapClientDashboardResponse(dashboardPayload),
  };
};
