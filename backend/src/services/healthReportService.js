const { addYears, todayISO } = require('../utils/dateUtils');

function deriveExpiryFromReport(reportDate) {
  return addYears(reportDate, 1);
}

function computeHealthStatus({ reportDate, expiryDate }) {
  if (!reportDate || !expiryDate) return 'EKSIK';
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  const today = new Date(todayISO());
  today.setHours(0, 0, 0, 0);
  if (exp < today) return 'SURESI_DOLMUS';
  return 'GECERLI';
}

module.exports = { deriveExpiryFromReport, computeHealthStatus };
