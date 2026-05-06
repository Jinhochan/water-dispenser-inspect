import { Router } from 'express';
import { getDb } from '../db/init.js';

const router = Router();

// GET /api/devices
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { search, building, type, status, page = 1, pageSize = 20 } = req.query;
    let sql = 'SELECT * FROM devices WHERE 1=1';
    const params = [];

    if (search) { sql += ' AND (code LIKE ? OR location LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (building) { sql += ' AND building = ?'; params.push(building); }
    if (type) { sql += ' AND type = ?'; params.push(type); }
    if (status) { sql += ' AND status = ?'; params.push(status); }

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const total = db.prepare(countSql).get(...params).total;

    sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

    const devices = db.prepare(sql).all(...params);
    res.json({ code: 0, data: { list: devices, total, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) { res.status(500).json({ code: 1, message: err.message }); }
});

// GET /api/devices/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
    if (!device) return res.status(404).json({ code: 1, message: '设备不存在' });
    const records = db.prepare('SELECT * FROM maintenance_records WHERE device_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json({ code: 0, data: { ...device, records } });
  } catch (err) { res.status(500).json({ code: 1, message: err.message }); }
});

// POST /api/devices
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { code, brand, type, location, building, floor, status } = req.body;
    if (!code) return res.status(400).json({ code: 1, message: '设备编码不能为空' });
    const existing = db.prepare('SELECT id FROM devices WHERE code = ?').get(code);
    if (existing) return res.status(400).json({ code: 1, message: '设备编码已存在' });
    const nfc_url = `/submit/${code}`;
    const result = db.prepare('INSERT INTO devices (code, brand, type, location, building, floor, status, nfc_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(code, brand || '', type || '饮水机', location || '', building || '', floor || '', status || 'normal', nfc_url);
    db.prepare('INSERT INTO operation_logs (action, target_type, target_id, detail) VALUES (?, ?, ?, ?)')
      .run('新增设备', 'device', result.lastInsertRowid, `新增设备 ${code}`);
    res.json({ code: 0, data: { id: result.lastInsertRowid }, message: '新增成功' });
  } catch (err) { res.status(500).json({ code: 1, message: err.message }); }
});

// PUT /api/devices/:id
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { code, brand, type, location, building, floor, status } = req.body;
    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
    if (!device) return res.status(404).json({ code: 1, message: '设备不存在' });
    db.prepare('UPDATE devices SET code=?, brand=?, type=?, location=?, building=?, floor=?, status=?, updated_at=datetime("now") WHERE id=?')
      .run(code || device.code, brand ?? device.brand, type ?? device.type, location ?? device.location, building ?? device.building, floor ?? device.floor, status ?? device.status, req.params.id);
    db.prepare('INSERT INTO operation_logs (action, target_type, target_id, detail) VALUES (?, ?, ?, ?)')
      .run('更新设备', 'device', req.params.id, `更新设备 ${device.code}`);
    res.json({ code: 0, message: '更新成功' });
  } catch (err) { res.status(500).json({ code: 1, message: err.message }); }
});

// DELETE /api/devices/:id
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
    if (!device) return res.status(404).json({ code: 1, message: '设备不存在' });
    db.prepare('DELETE FROM maintenance_records WHERE device_id = ?').run(req.params.id);
    db.prepare('DELETE FROM devices WHERE id = ?').run(req.params.id);
    db.prepare('INSERT INTO operation_logs (action, target_type, target_id, detail) VALUES (?, ?, ?, ?)')
      .run('删除设备', 'device', req.params.id, `删除设备 ${device.code}`);
    res.json({ code: 0, message: '删除成功' });
  } catch (err) { res.status(500).json({ code: 1, message: err.message }); }
});

export default router;
