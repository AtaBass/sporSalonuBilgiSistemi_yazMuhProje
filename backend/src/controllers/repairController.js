const { query } = require('../config/db');

async function list(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT r.*, e.equipment_name, e.status AS equipment_status
       FROM repair_records r
       JOIN equipments e ON e.id = r.equipment_id
       ORDER BY r.sent_date DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const {
      equipment_id,
      service_name,
      sent_date,
      return_date,
      fault_description,
      repair_description,
      cost,
      set_equipment_tamirde,
    } = req.body;
    const { rows } = await query(
      `INSERT INTO repair_records (equipment_id, service_name, sent_date, return_date, fault_description, repair_description, cost)
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,0)) RETURNING *`,
      [
        equipment_id,
        service_name || null,
        sent_date,
        return_date || null,
        fault_description || null,
        repair_description || null,
        cost,
      ]
    );
    if (set_equipment_tamirde !== false) {
      await query(`UPDATE equipments SET status = 'TAMIRDE' WHERE id = $1`, [equipment_id]);
    }
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const {
      service_name,
      sent_date,
      return_date,
      fault_description,
      repair_description,
      cost,
      activate_equipment,
    } = req.body;
    const cur = await query('SELECT * FROM repair_records WHERE id = $1', [req.params.id]);
    if (!cur.rows.length) {
      const e = new Error('Tamir kaydı bulunamadı');
      e.statusCode = 404;
      throw e;
    }
    const prev = cur.rows[0];
    const nextService = service_name ?? prev.service_name;
    const nextSent = sent_date ?? prev.sent_date;
    const nextReturn = Object.prototype.hasOwnProperty.call(req.body, 'return_date')
      ? return_date
      : prev.return_date;
    const nextFault = fault_description ?? prev.fault_description;
    const nextRepairDesc = repair_description ?? prev.repair_description;
    const nextCost = cost !== undefined && cost !== null ? cost : prev.cost;

    const { rows } = await query(
      `UPDATE repair_records SET
        service_name = $1,
        sent_date = $2,
        return_date = $3,
        fault_description = $4,
        repair_description = $5,
        cost = $6
       WHERE id = $7 RETURNING *`,
      [nextService, nextSent, nextReturn, nextFault, nextRepairDesc, nextCost, req.params.id]
    );
    const finalReturn = nextReturn;
    if (activate_equipment !== false && finalReturn) {
      await query(`UPDATE equipments SET status = 'AKTIF' WHERE id = $1`, [rows[0].equipment_id]);
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { rowCount } = await query('DELETE FROM repair_records WHERE id = $1', [req.params.id]);
    if (!rowCount) {
      const e = new Error('Tamir kaydı bulunamadı');
      e.statusCode = 404;
      throw e;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
