const { totalsAllTime, totalsInRange, movementsInRange } = require('../services/budgetService');

async function summary(req, res, next) {
  try {
    const t = await totalsAllTime();
    res.json(t);
  } catch (err) {
    next(err);
  }
}

async function range(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      const e = new Error('startDate ve endDate zorunludur (YYYY-MM-DD)');
      e.statusCode = 400;
      throw e;
    }
    const totals = await totalsInRange(startDate, endDate);
    const movements = await movementsInRange(startDate, endDate);
    res.json({ ...totals, movements });
  } catch (err) {
    next(err);
  }
}

module.exports = { summary, range };
