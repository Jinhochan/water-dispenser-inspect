import { Router } from 'express';
import { getDb } from '../db/init.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const users = getDb().prepare('SELECT * FROM users ORDER BY created_at DESC').all();
    // Parse permissions JSON for each user
    users.forEach(u => {
      try { u.permissions = JSON.parse(u.permissions || '[]'); } catch { u.permissions = []; }
    });
    res.json({ code: 0, data: users });
  } catch (err) { res.status(500).json({ code: 1, message: err.message }); }
});

router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { name, employee_id, phone, role, permissions } = req.body;
    if (!name) return res.status(400).json({ code: 1, message: '姓名不能为空' });
    if (!employee_id) return res.status(400).json({ code: 1, message: '工号不能为空' });
    if (db.prepare('SELECT id FROM users WHERE employee_id = ?').get(employee_id)) return res.status(400).json({ code: 1, message: '工号已存在' });
    const perms = JSON.stringify(permissions || []);
    const r = db.prepare('INSERT INTO users (name, employee_id, phone, role, permissions) VALUES (?, ?, ?, ?, ?)').run(name, employee_id, phone || '', role || 'maintainer', perms);
    db.prepare('INSERT INTO operation_logs (action, target_type, target_id, detail) VALUES (?, ?, ?, ?)').run('新增人员', 'user', r.lastInsertRowid, `新增人员 ${name} (${employee_id})`);
    res.json({ code: 0, data: { id: r.lastInsertRowid }, message: '新增成功' });
  } catch (err) { res.status(500).json({ code: 1, message: err.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { name, employee_id, phone, role, permissions } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ code: 1, message: '人员不存在' });
    if (employee_id && employee_id !== user.employee_id) {
      if (db.prepare('SELECT id FROM users WHERE employee_id = ? AND id != ?').get(employee_id, req.params.id)) return res.status(400).json({ code: 1, message: '工号已存在' });
    }
    const perms = permissions !== undefined ? JSON.stringify(permissions) : user.permissions;
    db.prepare('UPDATE users SET name=?, employee_id=?, phone=?, role=?, permissions=?, updated_at=datetime("now") WHERE id=?')
      .run(name || user.name, employee_id || user.employee_id, phone ?? user.phone, role || user.role, perms, req.params.id);
    db.prepare('INSERT INTO operation_logs (action, target_type, target_id, detail) VALUES (?, ?, ?, ?)').run('更新人员', 'user', req.params.id, `更新人员 ${user.name}`);
    res.json({ code: 0, message: '更新成功' });
  } catch (err) { res.status(500).json({ code: 1, message: err.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ code: 1, message: '人员不存在' });
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    db.prepare('INSERT INTO operation_logs (action, target_type, target_id, detail) VALUES (?, ?, ?, ?)').run('删除人员', 'user', req.params.id, `删除人员 ${user.name} (${user.employee_id})`);
    res.json({ code: 0, message: '删除成功' });
  } catch (err) { res.status(500).json({ code: 1, message: err.message }); }
});

router.post('/verify', (req, res) => {
  try {
    const { employee_id, name } = req.body;
    if (!employee_id) return res.status(400).json({ code: 1, message: '工号不能为空' });
    const user = getDb().prepare('SELECT * FROM users WHERE employee_id = ?').get(employee_id);
    if (!user) return res.json({ code: 1, message: '工号未授权' });
    if (name && user.name !== name) return res.json({ code: 1, message: '工号与姓名不匹配' });
    let permissions = [];
    try { permissions = JSON.parse(user.permissions || '[]'); } catch {}
    res.json({ code: 0, data: { id: user.id, name: user.name, role: user.role, permissions }, message: '核验通过' });
  } catch (err) { res.status(500).json({ code: 1, message: err.message }); }
});

export default router;
