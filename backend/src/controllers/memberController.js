const { query } = require('../config/db');

async function list(req, res, next) {
  try {
    const { search, active } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (search) {
      params.push(`%${search}%`);
      const i = params.length;
      where += ` AND (
        first_name ILIKE $${i} OR last_name ILIKE $${i} OR phone ILIKE $${i} OR email ILIKE $${i}
        OR CONCAT(first_name, ' ', last_name) ILIKE $${i}
      )`;
    }
    if (active === 'true') where += ' AND is_active = true';
    if (active === 'false') where += ' AND is_active = false';
    const { rows } = await query(
      `SELECT * FROM members ${where} ORDER BY created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const { rows } = await query('SELECT * FROM members WHERE id = $1', [req.params.id]);
    if (!rows.length) {
      const e = new Error('Abone bulunamadı');
      e.statusCode = 404;
      throw e;
    }
    const member = rows[0];
    const [subs, pays, health] = await Promise.all([
      query(
        `SELECT s.*, p.package_name FROM subscriptions s
         LEFT JOIN membership_packages p ON p.id = s.package_id
         WHERE s.member_id = $1 ORDER BY s.start_date DESC`,
        [member.id]
      ),
      query(
        `SELECT pay.* FROM payments pay
         JOIN subscriptions s ON s.id = pay.subscription_id
         WHERE s.member_id = $1 ORDER BY pay.due_date DESC`,
        [member.id]
      ),
      query(
        `SELECT * FROM health_reports WHERE member_id = $1 ORDER BY report_date DESC NULLS LAST`,
        [member.id]
      ),
    ]);
    res.json({
      ...member,
      subscriptions: subs.rows,
      payments: pays.rows,
      healthReports: health.rows,
    });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const {
      first_name,
      last_name,
      phone,
      email,
      birth_date,
      gender,
      registration_date,
      is_active,
    } = req.body;
    const activeFlag = typeof is_active === 'boolean' ? is_active : true;
    const { rows } = await query(
      `INSERT INTO members (first_name, last_name, phone, email, birth_date, gender, registration_date, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7, CURRENT_DATE), $8)
       RETURNING *`,
      [first_name, last_name, phone, email, birth_date || null, gender || null, registration_date || null, activeFlag]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const {
      first_name,
      last_name,
      phone,
      email,
      birth_date,
      gender,
      registration_date,
      is_active,
    } = req.body;
    const { rows } = await query(
      `UPDATE members SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        email = COALESCE($4, email),
        birth_date = COALESCE($5, birth_date),
        gender = COALESCE($6, gender),
        registration_date = COALESCE($7, registration_date),
        is_active = COALESCE($8, is_active)
       WHERE id = $9 RETURNING *`,
      [
        first_name ?? null,
        last_name ?? null,
        phone ?? null,
        email ?? null,
        birth_date ?? null,
        gender ?? null,
        registration_date ?? null,
        typeof is_active === 'boolean' ? is_active : null,
        req.params.id,
      ]
    );
    if (!rows.length) {
      const e = new Error('Abone bulunamadı');
      e.statusCode = 404;
      throw e;
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { rowCount } = await query('DELETE FROM members WHERE id = $1', [req.params.id]);
    if (!rowCount) {
      const e = new Error('Abone bulunamadı');
      e.statusCode = 404;
      throw e;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
