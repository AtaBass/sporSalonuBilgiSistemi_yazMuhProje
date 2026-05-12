const { query } = require('../config/db');
const { computePaymentStatus } = require('../services/paymentService');

async function list(req, res, next) {
  try {
    const { late } = req.query;
    let sql = `
      SELECT pay.*, s.member_id, m.first_name, m.last_name, p.package_name
      FROM payments pay
      JOIN subscriptions s ON s.id = pay.subscription_id
      JOIN members m ON m.id = s.member_id
      LEFT JOIN membership_packages p ON p.id = s.package_id
    `;
    const params = [];
    if (late === 'true') {
      sql += ` WHERE pay.status = 'GECIKTI'`;
    }
    sql += ' ORDER BY pay.due_date DESC';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function listLate(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT pay.*, s.member_id, m.first_name, m.last_name, p.package_name
       FROM payments pay
       JOIN subscriptions s ON s.id = pay.subscription_id
       JOIN members m ON m.id = s.member_id
       LEFT JOIN membership_packages p ON p.id = s.package_id
       WHERE pay.status = 'GECIKTI'
       ORDER BY pay.due_date ASC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { subscription_id, payment_date, due_date, amount, paid_amount, payment_method } = req.body;
    const status = computePaymentStatus({
      amount,
      paidAmount: paid_amount ?? 0,
      due_date,
    });
    const { rows } = await query(
      `INSERT INTO payments (subscription_id, payment_date, due_date, amount, paid_amount, payment_method, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [subscription_id, payment_date || null, due_date, amount, paid_amount ?? 0, payment_method || null, status]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { payment_date, due_date, amount, paid_amount, payment_method } = req.body;
    const cur = await query('SELECT * FROM payments WHERE id = $1', [req.params.id]);
    if (!cur.rows.length) {
      const e = new Error('Ödeme bulunamadı');
      e.statusCode = 404;
      throw e;
    }
    const c = cur.rows[0];
    const nextAmount = amount ?? c.amount;
    const nextPaid = paid_amount ?? c.paid_amount;
    const nextDue = due_date ?? c.due_date;
    const status = computePaymentStatus({
      amount: nextAmount,
      paidAmount: nextPaid,
      due_date: nextDue,
    });
    const { rows } = await query(
      `UPDATE payments SET
        payment_date = COALESCE($1, payment_date),
        due_date = COALESCE($2, due_date),
        amount = COALESCE($3, amount),
        paid_amount = COALESCE($4, paid_amount),
        payment_method = COALESCE($5, payment_method),
        status = $6
       WHERE id = $7 RETURNING *`,
      [payment_date, due_date, amount, paid_amount, payment_method, status, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { rowCount } = await query('DELETE FROM payments WHERE id = $1', [req.params.id]);
    if (!rowCount) {
      const e = new Error('Ödeme bulunamadı');
      e.statusCode = 404;
      throw e;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, listLate, create, update, remove };
