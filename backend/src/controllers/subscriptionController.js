const { query } = require('../config/db');
const { resolveSubscriptionStatus } = require('../services/subscriptionService');

async function hasValidHealthReport(memberId) {
  const { rows } = await query(
    `SELECT 1 FROM health_reports
     WHERE member_id = $1 AND status = 'GECERLI' AND expiry_date >= CURRENT_DATE LIMIT 1`,
    [memberId]
  );
  return rows.length > 0;
}

async function list(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT s.*, m.first_name, m.last_name, p.package_name
       FROM subscriptions s
       JOIN members m ON m.id = s.member_id
       LEFT JOIN membership_packages p ON p.id = s.package_id
       ORDER BY s.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT s.*, m.first_name, m.last_name, p.package_name
       FROM subscriptions s
       JOIN members m ON m.id = s.member_id
       LEFT JOIN membership_packages p ON p.id = s.package_id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (!rows.length) {
      const e = new Error('Abonelik bulunamadı');
      e.statusCode = 404;
      throw e;
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { member_id, package_id, start_date, end_date, status } = req.body;
    const st = resolveSubscriptionStatus(status || 'AKTIF', end_date);
    const okHealth = await hasValidHealthReport(member_id);
    const { rows } = await query(
      `INSERT INTO subscriptions (member_id, package_id, start_date, end_date, status)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [member_id, package_id || null, start_date, end_date, st]
    );
    const payload = { subscription: rows[0] };
    if (!okHealth) {
      payload.warning =
        'Bu abonenin geçerli bir sağlık raporu kaydı bulunmuyor veya süresi dolmuş. Abonelik oluşturuldu; gerekli kontrolleri yapmanız önerilir.';
    }
    res.status(201).json(payload);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { member_id, package_id, start_date, end_date, status } = req.body;
    const existing = await query('SELECT * FROM subscriptions WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) {
      const e = new Error('Abonelik bulunamadı');
      e.statusCode = 404;
      throw e;
    }
    const end = end_date ?? existing.rows[0].end_date;
    const st = status ? resolveSubscriptionStatus(status, end) : resolveSubscriptionStatus(existing.rows[0].status, end);
    const { rows } = await query(
      `UPDATE subscriptions SET
        member_id = COALESCE($1, member_id),
        package_id = COALESCE($2, package_id),
        start_date = COALESCE($3, start_date),
        end_date = COALESCE($4, end_date),
        status = $5
       WHERE id = $6 RETURNING *`,
      [
        member_id,
        package_id,
        start_date,
        end_date,
        st,
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { rowCount } = await query('DELETE FROM subscriptions WHERE id = $1', [req.params.id]);
    if (!rowCount) {
      const e = new Error('Abonelik bulunamadı');
      e.statusCode = 404;
      throw e;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
