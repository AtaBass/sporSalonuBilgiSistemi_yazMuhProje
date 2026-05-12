const { query } = require('../config/db');

async function totalsAllTime() {
  const incomeR = await query(
    `SELECT COALESCE(SUM(paid_amount),0)::numeric AS total FROM payments WHERE status = 'ODENDI'`
  );
  const maintR = await query(
    `SELECT COALESCE(SUM(cost),0)::numeric AS total FROM maintenance_records`
  );
  const repairR = await query(
    `SELECT COALESCE(SUM(cost),0)::numeric AS total FROM repair_records`
  );
  const income = Number(incomeR.rows[0].total);
  const expense = Number(maintR.rows[0].total) + Number(repairR.rows[0].total);
  return { income, expense, maintenanceExpense: Number(maintR.rows[0].total), repairExpense: Number(repairR.rows[0].total), net: income - expense };
}

async function totalsInRange(startDate, endDate) {
  const incomeR = await query(
    `SELECT COALESCE(SUM(paid_amount),0)::numeric AS total FROM payments
     WHERE status = 'ODENDI' AND payment_date IS NOT NULL
       AND payment_date BETWEEN $1::date AND $2::date`,
    [startDate, endDate]
  );
  const maintR = await query(
    `SELECT COALESCE(SUM(cost),0)::numeric AS total FROM maintenance_records
     WHERE maintenance_date BETWEEN $1::date AND $2::date`,
    [startDate, endDate]
  );
  const repairR = await query(
    `SELECT COALESCE(SUM(cost),0)::numeric AS total FROM repair_records
     WHERE sent_date BETWEEN $1::date AND $2::date`,
    [startDate, endDate]
  );
  const income = Number(incomeR.rows[0].total);
  const maintenanceExpense = Number(maintR.rows[0].total);
  const repairExpense = Number(repairR.rows[0].total);
  const expense = maintenanceExpense + repairExpense;
  return { income, expense, maintenanceExpense, repairExpense, net: income - expense };
}

async function movementsInRange(startDate, endDate) {
  const payments = await query(
    `SELECT id, 'GELIR' AS type, payment_date AS movement_date, amount, paid_amount, payment_method AS detail, status
     FROM payments WHERE status = 'ODENDI' AND payment_date IS NOT NULL
       AND payment_date BETWEEN $1::date AND $2::date
     ORDER BY payment_date DESC`,
    [startDate, endDate]
  );
  const maint = await query(
    `SELECT m.id, 'GIDER_BAKIM' AS type, m.maintenance_date AS movement_date, m.cost AS amount, NULL::numeric AS paid_amount,
            CONCAT('Bakım #', e.equipment_name) AS detail, NULL AS status
     FROM maintenance_records m JOIN equipments e ON e.id = m.equipment_id
     WHERE m.maintenance_date BETWEEN $1::date AND $2::date`,
    [startDate, endDate]
  );
  const rep = await query(
    `SELECT r.id, 'GIDER_TAMIR' AS type, r.sent_date AS movement_date, r.cost AS amount, NULL::numeric AS paid_amount,
            CONCAT('Tamir #', e.equipment_name) AS detail, NULL AS status
     FROM repair_records r JOIN equipments e ON e.id = r.equipment_id
     WHERE r.sent_date BETWEEN $1::date AND $2::date`,
    [startDate, endDate]
  );
  return [...payments.rows, ...maint.rows, ...rep.rows].sort(
    (a, b) => new Date(b.movement_date) - new Date(a.movement_date)
  );
}

module.exports = { totalsAllTime, totalsInRange, movementsInRange };
