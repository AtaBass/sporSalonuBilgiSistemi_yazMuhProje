const { query } = require('../config/db');

async function list(req, res, next) {
  try {
    const { upcoming } = req.query;
    let sql = `
      SELECT m.*, e.equipment_name, e.status AS equipment_status
      FROM maintenance_records m
      JOIN equipments e ON e.id = m.equipment_id
    `;
    if (upcoming === 'true') {
      sql += ` WHERE m.next_maintenance_date IS NOT NULL
               AND m.next_maintenance_date <= CURRENT_DATE + INTERVAL '30 days'`;
    }
    sql += ' ORDER BY m.maintenance_date DESC';
    const { rows } = await query(sql);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function listUpcoming(req, res, next) {
  req.query.upcoming = 'true';
  return list(req, res, next);
}

async function create(req, res, next) {
  try {
    const {
      equipment_id,
      maintenance_date,
      staff_name,
      description,
      cost,
      next_maintenance_date,
      mark_equipment_bakimda,
    } = req.body;
    const { rows } = await query(
      `INSERT INTO maintenance_records (equipment_id, maintenance_date, staff_name, description, cost, next_maintenance_date)
       VALUES ($1,$2,$3,$4,COALESCE($5,0),$6) RETURNING *`,
      [equipment_id, maintenance_date, staff_name || null, description || null, cost, next_maintenance_date || null]
    );
    if (mark_equipment_bakimda) {
      await query(`UPDATE equipments SET status = 'BAKIMDA' WHERE id = $1`, [equipment_id]);
    }
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { maintenance_date, staff_name, description, cost, next_maintenance_date } = req.body;
    const { rows } = await query(
      `UPDATE maintenance_records SET
        maintenance_date = COALESCE($1, maintenance_date),
        staff_name = COALESCE($2, staff_name),
        description = COALESCE($3, description),
        cost = COALESCE($4, cost),
        next_maintenance_date = COALESCE($5, next_maintenance_date)
       WHERE id = $6 RETURNING *`,
      [maintenance_date, staff_name, description, cost, next_maintenance_date, req.params.id]
    );
    if (!rows.length) {
      const e = new Error('Bakım kaydı bulunamadı');
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
    const { rowCount } = await query('DELETE FROM maintenance_records WHERE id = $1', [req.params.id]);
    if (!rowCount) {
      const e = new Error('Bakım kaydı bulunamadı');
      e.statusCode = 404;
      throw e;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, listUpcoming, create, update, remove };
