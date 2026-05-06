import { Router } from 'express';
import { getDb } from '../db/init.js';

const router = Router();

router.get('/overview', (req, res) => {
  try {
    const db = getDb();
    const totalDevices = db.prepare('SELECT COUNT(*) as count FROM devices').get().count;
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
    const monthlyMaintenance = db.prepare('SELECT COUNT(*) as count FROM maintenance_records WHERE created_at >= ?').get(monthStart).count;
    const overdueDevices = db.prepare("SELECT COUNT(*) as count FROM devices WHERE status IN ('repair','replace') AND updated_at < datetime('now','-7 days')").get().count;
    const normalDevices = db.prepare("SELECT COUNT(*) as count FROM devices WHERE status='normal'").get().count;
    const normalRate = totalDevices > 0 ? ((normalDevices/totalDevices)*100).toFixed(1) : '0.0';
    res.json({ code: 0, data: { totalDevices, monthlyMaintenance, overdueDevices, normalDevices, normalRate } });
  } catch (err) { res.status(500).json({ code: 1, message: err.message }); }
});

router.get('/device-status', (req, res) => {
  try {
    const db = getDb();
    const total = db.prepare('SELECT COUNT(*) as count FROM devices').get().count;
    const normal = db.prepare("SELECT COUNT(*) as count FROM devices WHERE status='normal'").get().count;
    const repair = db.prepare("SELECT COUNT(*) as count FROM devices WHERE status='repair'").get().count;
    const replace = db.prepare("SELECT COUNT(*) as count FROM devices WHERE status='replace'").get().count;
    res.json({ code: 0, data: { total, items: [
      { label: '正常', value: normal, color: '#10b981', percent: total>0?((normal/total)*100).toFixed(1):'0' },
      { label: '维修中', value: repair, color: '#f59e0b', percent: total>0?((repair/total)*100).toFixed(1):'0' },
      { label: '待更换', value: replace, color: '#ef4444', percent: total>0?((replace/total)*100).toFixed(1):'0' },
    ]}});
  } catch (err) { res.status(500).json({ code: 1, message: err.message }); }
});

router.get('/building-distribution', (req, res) => {
  try {
    const rows = getDb().prepare("SELECT building, COUNT(*) as count FROM devices WHERE building != '' GROUP BY building ORDER BY building").all();
    res.json({ code: 0, data: rows });
  } catch (err) { res.status(500).json({ code: 1, message: err.message }); }
});

router.get('/recent-maintenance', (req, res) => {
  try {
    const records = getDb().prepare("SELECT m.id, m.maintenance_type, m.handler_name, m.created_at, d.code as device_code, d.location FROM maintenance_records m LEFT JOIN devices d ON m.device_id = d.id ORDER BY m.created_at DESC LIMIT 10").all();
    res.json({ code: 0, data: records });
  } catch (err) { res.status(500).json({ code: 1, message: err.message }); }
});

export default router;
