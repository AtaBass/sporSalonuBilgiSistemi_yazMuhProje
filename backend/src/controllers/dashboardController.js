const { query } = require('../config/db');
const { totalsInRange } = require('../services/budgetService');

function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

async function summary(req, res, next) {
  try {
    const [members, subs, late, health, maint, budget] = await Promise.all([
      query(`SELECT COUNT(*)::int AS c FROM members`),
      query(`SELECT COUNT(*)::int AS c FROM subscriptions WHERE status = 'AKTIF'`),
      query(`SELECT COUNT(*)::int AS c FROM payments WHERE status = 'GECIKTI'`),
      query(
        `SELECT COUNT(*)::int AS c FROM health_reports
         WHERE status = 'SURESI_DOLMUS'
            OR (expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE AND status <> 'EKSIK')`
      ),
      query(
        `SELECT COUNT(DISTINCT equipment_id)::int AS c FROM maintenance_records
         WHERE next_maintenance_date IS NOT NULL
           AND next_maintenance_date <= CURRENT_DATE + INTERVAL '30 days'`
      ),
      (async () => {
        const { start, end } = monthRange();
        return totalsInRange(start, end);
      })(),
    ]);

    res.json({
      totalMembers: members.rows[0].c,
      activeSubscriptions: subs.rows[0].c,
      latePayments: late.rows[0].c,
      expiredHealthReports: health.rows[0].c,
      upcomingMaintenanceCount: maint.rows[0].c,
      monthlyIncome: budget.income,
      monthlyExpense: budget.expense,
      netBudget: budget.net,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { summary };
