import { Router } from 'express';
import { getDb } from '../db/init.js';

const router = Router();

// GET /api/maintenance
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { search, type, page = 1, pageSize = 20 } = req.query;
    let sql = `SELECT m.*, d.code as device_code, d.location as device_location, d.building FROM maintenance_records m LEFT JOIN devices d ON m.device_id = d.id WHERE 1=1`;
    const params = [];
    if (search) { sql += ' AND (d.code LIKE ? OR m.handler_name LIKE ? OR m.content LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (type) { sql += ' AND m.maintenance_type = ?'; params.push(type); }
    const countSql = sql.replace(/SELECT m\.\*, d\.code as device_code, d\.location as device_location, d\.building/, 'SELECT COUNT(*) as total');
    const total = db.prepare(countSql).get(...params).total;
    sql += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
    const records = db.prepare(sql).all(...params);
    res.json({ code: 0, data: { list: records, total, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) { res.status(500).json({ code: 1, message: err.message }); }
});

// GET /api/maintenance/export
router.get('/export', (req, res) => {
  try {
    const db = getDb();
    const { search, type } = req.query;
    let sql = `SELECT m.*, d.code as device_code, d.location as device_location, d.building FROM maintenance_records m LEFT JOIN devices d ON m.device_id = d.id WHERE 1=1`;
    const params = [];
    if (search) { sql += ' AND (d.code LIKE ? OR m.handler_name LIKE ? OR m.content LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (type) { sql += ' AND m.maintenance_type = ?'; params.push(type); }
    sql += ' ORDER BY m.created_at DESC';
    const records = db.prepare(sql).all(...params);
    const BOM = '\uFEFF';
    const header = '设备编码,位置,楼栋,维保类型,维保内容,维保人,工号,设备状态,问题描述,处理结果,处理状态,日期\n';
    const rows = records.map(r => `${r.device_code},${r.device_location},${r.building},${r.maintenance_type},"${(r.content||'').replace(/"/g,'""')}",${r.handler_name},${r.handler_id},${r.device_status},"${(r.problem_desc||'').replace(/"/g,'""')}","${(r.result||'').replace(/"/g,'""')}",${r.status},${r.created_at}`).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=maintenance_${Date.now()}.csv`);
    res.send(BOM + header + rows);
  } catch (err) { res.status(500).json({ code: 1, message: err.message }); }
});

// GET /api/maintenance/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const record = db.prepare('SELECT m.*, d.code as device_code, d.location as device_location, d.building FROM maintenance_records m LEFT JOIN devices d ON m.device_id = d.id WHERE m.id = ?').get(req.params.id);
    if (!record) return res.status(404).json({ code: 1, message: '记录不存在' });
    res.json({ code: 0, data: record });
  } catch (err) { res.status(500).json({ code: 1, message: err.message }); }
});

// POST /api/maintenance
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { device_code, maintenance_type, content, handler_name, handler_id, device_status, problem_desc, result } = req.body;
    if (!device_code) return res.status(400).json({ code: 1, message: '设备编码不能为空' });
    if (!handler_name) return res.status(400).json({ code: 1, message: '维保人姓名不能为空' });
    if (!handler_id) return res.status(400).json({ code: 1, message: '工号不能为空' });
    const device = db.prepare('SELECT * FROM devices WHERE code = ?').get(device_code);
    if (!device) return res.status(404).json({ code: 1, message: '设备不存在' });
    const user = db.prepare('SELECT * FROM users WHERE employee_id = ?').get(handler_id);
    if (!user) return res.status(403).json({ code: 1, message: '工号未授权，请联系管理员' });
    if (user.name !== handler_name) return res.status(403).json({ code: 1, message: '工号与姓名不匹配' });
    const r = db.prepare('INSERT INTO maintenance_records (device_id, maintenance_type, content, handler_name, handler_id, device_status, problem_desc, result, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(device.id, maintenance_type || '巡检', content || '', handler_name, handler_id, device_status || device.status, problem_desc || '', result || '', '已完成');
    if (device_status && device_status !== device.status) {
      db.prepare('UPDATE devices SET status = ?, updated_at = datetime("now") WHERE id = ?').run(device_status, device.id);
    }
    db.prepare('INSERT INTO operation_logs (action, target_type, target_id, operator, detail) VALUES (?, ?, ?, ?, ?)')
      .run('新增维保记录', 'maintenance', r.lastInsertRowid, handler_name, `设备 ${device_code} 维保记录`);
    res.json({ code: 0, data: { id: r.lastInsertRowid }, message: '提交成功' });
  } catch (err) { res.status(500).json({ code: 1, message: err.message }); }
});

export default router;
