const { isPastDate } = require('../utils/dateUtils');

function resolveSubscriptionStatus(bodyStatus, endDate) {
  if (bodyStatus === 'IPTAL') return 'IPTAL';
  if (isPastDate(endDate)) return 'SURESI_DOLMUS';
  return bodyStatus && bodyStatus !== 'SURESI_DOLMUS' ? bodyStatus : 'AKTIF';
}

module.exports = { resolveSubscriptionStatus };
