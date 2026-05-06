import { Router } from 'express';
import { getDb } from '../db/init.js';

const router = Router();

router.get('/config', (req, res) => {
  try {
    const config = getDb().prepare('SELECT * FROM feishu_config WHERE id = 1').get();
    if (config) config.app_secret = config.app_secret ? '***已配置***' : '';
    res.json({ code: 0, data: config || {} });
  } catch (err) { res.status(500).json({ code: 1, message: err.message }); }
});

router.post('/config', (req, res) => {
  try {
    const db = getDb();
    const { app_id, app_secret, app_token, table_id } = req.body;
    const existing = db.prepare('SELECT * FROM feishu_config WHERE id = 1').get();
    // Don't overwrite secret with the masked placeholder
    const secretToSave = (app_secret && app_secret !== '***已配置***') ? app_secret : (existing?.app_secret || '');
    if (existing) {
      db.prepare('UPDATE feishu_config SET app_id=?, app_secret=?, app_token=?, table_id=? WHERE id=1')
        .run(app_id || '', secretToSave, app_token || '', table_id || '');
    } else {
      db.prepare('INSERT INTO feishu_config (id, app_id, app_secret, app_token, table_id) VALUES (1, ?, ?, ?, ?)')
        .run(app_id || '', secretToSave, app_token || '', table_id || '');
    }
    db.prepare('INSERT INTO operation_logs (action, target_type, detail) VALUES (?, ?, ?)').run('更新飞书配置', 'feishu', '飞书配置已更新');
    res.json({ code: 0, message: '配置保存成功' });
  } catch (err) { res.status(500).json({ code: 1, message: err.message }); }
});

router.post('/test', async (req, res) => {
  try {
    const config = getDb().prepare('SELECT * FROM feishu_config WHERE id = 1').get();
    if (!config || !config.app_id || !config.app_secret || !config.app_token || !config.table_id) return res.json({ code: 1, message: '请先完成飞书配置' });
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: config.app_id, app_secret: config.app_secret }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.code !== 0) { getDb().prepare('UPDATE feishu_config SET connected = 0 WHERE id = 1').run(); return res.json({ code: 1, message: `获取 Token 失败: ${tokenData.msg}` }); }
    const tableRes = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${config.app_token}/tables/${config.table_id}/records?page_size=1`, { headers: { Authorization: `Bearer ${tokenData.tenant_access_token}` } });
    const tableData = await tableRes.json();
    if (tableData.code !== 0) { getDb().prepare('UPDATE feishu_config SET connected = 0 WHERE id = 1').run(); return res.json({ code: 1, message: `访问多维表格失败: ${tableData.msg}` }); }
    getDb().prepare('UPDATE feishu_config SET connected = 1, last_sync_at = datetime("now") WHERE id = 1').run();
    res.json({ code: 0, message: '连接成功！' });
  } catch (err) { res.status(500).json({ code: 1, message: `连接测试失败: ${err.message}` }); }
});

router.post('/sync', async (req, res) => {
  try {
    const db = getDb();
    const config = db.prepare('SELECT * FROM feishu_config WHERE id = 1').get();
    if (!config || !config.app_id || !config.app_secret || !config.app_token || !config.table_id) return res.json({ code: 1, message: '请先完成飞书配置' });
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: config.app_id, app_secret: config.app_secret }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.code !== 0) return res.json({ code: 1, message: `获取 Token 失败: ${tokenData.msg}` });
    let allRecords = []; let pageToken = '';
    do {
      const url = new URL(`https://open.feishu.cn/open-apis/bitable/v1/apps/${config.app_token}/tables/${config.table_id}/records`);
      url.searchParams.set('page_size', '100');
      if (pageToken) url.searchParams.set('page_token', pageToken);
      const tableRes = await fetch(url, { headers: { Authorization: `Bearer ${tokenData.tenant_access_token}` } });
      const tableData = await tableRes.json();
      if (tableData.code !== 0) break;
      allRecords = allRecords.concat(tableData.data?.items || []);
      pageToken = tableData.data?.page_token || '';
    } while (pageToken);
    let syncedCount = 0;
    for (const record of allRecords) {
      const f = record.fields || {};
      const code = f['设备编码'] || f['code'] || '';
      if (!code) continue;
      const brand = f['品牌'] || f['brand'] || '';
      const type = f['设备类型'] || f['宿舍类型'] || f['type'] || '饮水机';
      const loc = f['位置'] || f['location'] || '';
      const bld = f['楼栋'] || f['building'] || '';
      const fl = f['楼层'] || f['floor'] || '';
      const st = f['设备状态'] || f['状态'] || f['status'] || 'normal';
      const existing = db.prepare('SELECT id FROM devices WHERE code = ?').get(code);
      if (existing) {
        db.prepare('UPDATE devices SET brand=?, type=?, location=?, building=?, floor=?, updated_at=datetime("now") WHERE code=?')
          .run(brand, type, loc, bld, fl, code);
      } else {
        db.prepare('INSERT INTO devices (code, brand, type, location, building, floor, status, nfc_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .run(code, brand, type, loc, bld, fl, st, `/submit/${code}`);
      }
      syncedCount++;
    }
    db.prepare('UPDATE feishu_config SET last_sync_at = datetime("now") WHERE id = 1').run();
    db.prepare('INSERT INTO operation_logs (action, target_type, detail) VALUES (?, ?, ?)').run('飞书同步', 'feishu', `同步了 ${syncedCount} 台设备`);
    res.json({ code: 0, data: { count: syncedCount }, message: `成功同步 ${syncedCount} 台设备` });
  } catch (err) { res.status(500).json({ code: 1, message: `同步失败: ${err.message}` }); }
});

export default router;
