const { query } = require('../config/db');

async function list(req, res, next) {
  try {
    const { rows: packages } = await query(
      `SELECT * FROM membership_packages ORDER BY created_at DESC`
    );
    const { rows: days } = await query(`SELECT * FROM package_days ORDER BY package_id, id`);
    const byPkg = {};
    for (const d of days) {
      if (!byPkg[d.package_id]) byPkg[d.package_id] = [];
      byPkg[d.package_id].push(d);
    }
    res.json(packages.map((p) => ({ ...p, days: byPkg[p.id] || [] })));
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const { rows } = await query('SELECT * FROM membership_packages WHERE id = $1', [req.params.id]);
    if (!rows.length) {
      const e = new Error('Paket bulunamadı');
      e.statusCode = 404;
      throw e;
    }
    const { rows: days } = await query('SELECT * FROM package_days WHERE package_id = $1 ORDER BY id', [
      req.params.id,
    ]);
    res.json({ ...rows[0], days });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  const client = await require('../config/db').pool.connect();
  try {
    await client.query('BEGIN');
    const {
      package_name,
      description,
      weekly_day_count,
      start_time,
      end_time,
      duration_month,
      price,
      is_active,
      days,
    } = req.body;
    const ins = await client.query(
      `INSERT INTO membership_packages
        (package_name, description, weekly_day_count, start_time, end_time, duration_month, price, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8,true)) RETURNING *`,
      [package_name, description || null, weekly_day_count || null, start_time || null, end_time || null, duration_month, price, is_active]
    );
    const pkg = ins.rows[0];
    if (Array.isArray(days)) {
      for (const day_name of days) {
        await client.query(`INSERT INTO package_days (package_id, day_name) VALUES ($1,$2)`, [pkg.id, day_name]);
      }
    }
    await client.query('COMMIT');
    const { rows: drows } = await query('SELECT * FROM package_days WHERE package_id = $1', [pkg.id]);
    res.status(201).json({ ...pkg, days: drows });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

async function update(req, res, next) {
  const client = await require('../config/db').pool.connect();
  try {
    await client.query('BEGIN');
    const {
      package_name,
      description,
      weekly_day_count,
      start_time,
      end_time,
      duration_month,
      price,
      is_active,
      days,
    } = req.body;
    const { rows } = await client.query(
      `UPDATE membership_packages SET
        package_name = COALESCE($1, package_name),
        description = COALESCE($2, description),
        weekly_day_count = COALESCE($3, weekly_day_count),
        start_time = COALESCE($4, start_time),
        end_time = COALESCE($5, end_time),
        duration_month = COALESCE($6, duration_month),
        price = COALESCE($7, price),
        is_active = COALESCE($8, is_active)
       WHERE id = $9 RETURNING *`,
      [package_name, description, weekly_day_count, start_time, end_time, duration_month, price, is_active, req.params.id]
    );
    if (!rows.length) {
      const e = new Error('Paket bulunamadı');
      e.statusCode = 404;
      throw e;
    }
    if (Array.isArray(days)) {
      await client.query('DELETE FROM package_days WHERE package_id = $1', [req.params.id]);
      for (const day_name of days) {
        await client.query(`INSERT INTO package_days (package_id, day_name) VALUES ($1,$2)`, [req.params.id, day_name]);
      }
    }
    await client.query('COMMIT');
    const { rows: drows } = await query('SELECT * FROM package_days WHERE package_id = $1 ORDER BY id', [
      req.params.id,
    ]);
    res.json({ ...rows[0], days: drows });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

async function remove(req, res, next) {
  try {
    const { rowCount } = await query('DELETE FROM membership_packages WHERE id = $1', [req.params.id]);
    if (!rowCount) {
      const e = new Error('Paket bulunamadı');
      e.statusCode = 404;
      throw e;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
