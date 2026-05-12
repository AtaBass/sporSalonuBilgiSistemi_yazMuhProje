const { query } = require('../config/db');
const { deriveExpiryFromReport, computeHealthStatus } = require('../services/healthReportService');

async function list(req, res, next) {
  try {
    const { filter } = req.query;
    let where = 'WHERE 1=1';
    if (filter === 'expired') {
      where += ` AND (status = 'SURESI_DOLMUS' OR (expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE AND status <> 'EKSIK'))`;
    }
    if (filter === 'missing') {
      where += ` AND status = 'EKSIK'`;
    }
    const { rows } = await query(
      `SELECT h.*, m.first_name, m.last_name FROM health_reports h
       JOIN members m ON m.id = h.member_id ${where}
       ORDER BY h.report_date DESC NULLS LAST`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function listExpired(req, res, next) {
  req.query.filter = 'expired';
  return list(req, res, next);
}

async function listMissing(req, res, next) {
  req.query.filter = 'missing';
  return list(req, res, next);
}

async function create(req, res, next) {
  try {
    let { member_id, institution_name, report_date, expiry_date, status } = req.body;
    if (report_date && !expiry_date) {
      expiry_date = deriveExpiryFromReport(report_date);
    }
    let st = status;
    if (!st) {
      if (!report_date || !expiry_date) st = 'EKSIK';
      else st = computeHealthStatus({ reportDate: report_date, expiryDate: expiry_date });
    }
    const { rows } = await query(
      `INSERT INTO health_reports (member_id, institution_name, report_date, expiry_date, status)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [member_id, institution_name || null, report_date || null, expiry_date || null, st]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    let { institution_name, report_date, expiry_date, status } = req.body;
    const cur = await query('SELECT * FROM health_reports WHERE id = $1', [req.params.id]);
    if (!cur.rows.length) {
      const e = new Error('Sağlık raporu bulunamadı');
      e.statusCode = 404;
      throw e;
    }
    const c = cur.rows[0];
    const rd = report_date ?? c.report_date;
    let ex = expiry_date ?? c.expiry_date;
    if (report_date && !req.body.expiry_date) {
      ex = deriveExpiryFromReport(rd);
    }
    const st =
      status ||
      computeHealthStatus({
        reportDate: rd,
        expiryDate: ex,
        institutionName: institution_name ?? c.institution_name,
      });
    const { rows } = await query(
      `UPDATE health_reports SET
        institution_name = COALESCE($1, institution_name),
        report_date = COALESCE($2, report_date),
        expiry_date = COALESCE($3, expiry_date),
        status = $4
       WHERE id = $5 RETURNING *`,
      [institution_name ?? null, report_date ?? null, ex, st, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { rowCount } = await query('DELETE FROM health_reports WHERE id = $1', [req.params.id]);
    if (!rowCount) {
      const e = new Error('Sağlık raporu bulunamadı');
      e.statusCode = 404;
      throw e;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, listExpired, listMissing, create, update, remove };
