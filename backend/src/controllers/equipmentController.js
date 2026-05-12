const { query } = require('../config/db');

async function list(req, res, next) {
  try {
    const { rows } = await query(`SELECT * FROM equipments ORDER BY created_at DESC`);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const { rows } = await query('SELECT * FROM equipments WHERE id = $1', [req.params.id]);
    if (!rows.length) {
      const e = new Error('Alet bulunamadı');
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
    const {
      equipment_name,
      brand,
      model,
      serial_number,
      purchase_date,
      location,
      status,
    } = req.body;
    const { rows } = await query(
      `INSERT INTO equipments (equipment_name, brand, model, serial_number, purchase_date, location, status)
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,'AKTIF')) RETURNING *`,
      [equipment_name, brand || null, model || null, serial_number || null, purchase_date || null, location || null, status]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    if (req.user.role === 'PERSONEL') {
      const allowed = ['status'];
      const keys = Object.keys(req.body || {});
      const bad = keys.filter((k) => !allowed.includes(k));
      if (bad.length) {
        const e = new Error('Personel yalnızca alet durumunu güncelleyebilir');
        e.statusCode = 403;
        throw e;
      }
    }
    const {
      equipment_name,
      brand,
      model,
      serial_number,
      purchase_date,
      location,
      status,
    } = req.body;
    const { rows } = await query(
      `UPDATE equipments SET
        equipment_name = COALESCE($1, equipment_name),
        brand = COALESCE($2, brand),
        model = COALESCE($3, model),
        serial_number = COALESCE($4, serial_number),
        purchase_date = COALESCE($5, purchase_date),
        location = COALESCE($6, location),
        status = COALESCE($7, status)
       WHERE id = $8 RETURNING *`,
      [
        equipment_name ?? null,
        brand ?? null,
        model ?? null,
        serial_number ?? null,
        purchase_date ?? null,
        location ?? null,
        status ?? null,
        req.params.id,
      ]
    );
    if (!rows.length) {
      const e = new Error('Alet bulunamadı');
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
    const { rowCount } = await query('DELETE FROM equipments WHERE id = $1', [req.params.id]);
    if (!rowCount) {
      const e = new Error('Alet bulunamadı');
      e.statusCode = 404;
      throw e;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
