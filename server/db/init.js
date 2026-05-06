import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, 'data.db');

let db;
let SQL;

class DatabaseWrapper {
  constructor(sqlJsDb) {
    this._db = sqlJsDb;
  }

  exec(sql) {
    this._db.run(sql);
  }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        self._db.run(sql, params);
        self._save();
        return {
          get lastInsertRowid() {
            const res = self._db.exec('SELECT last_insert_rowid() as id');
            return res[0]?.values[0]?.[0] || 0;
          }
        };
      },
      get(...params) {
        const stmt = self._db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          stmt.free();
          const row = {};
          cols.forEach((c, i) => row[c] = vals[i]);
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        const stmt = self._db.prepare(sql);
        stmt.bind(params);
        const rows = [];
        const cols = stmt.getColumnNames();
        while (stmt.step()) {
          const vals = stmt.get();
          const row = {};
          cols.forEach((c, i) => row[c] = vals[i]);
          rows.push(row);
        }
        stmt.free();
        return rows;
      }
    };
  }

  pragma(str) {
    try { this._db.run(`PRAGMA ${str}`); } catch {}
  }

  _save() {
    try {
      const data = this._db.export();
      writeFileSync(DB_PATH, Buffer.from(data));
    } catch {}
  }
}

export async function initDatabase() {
  SQL = await initSqlJs();

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new DatabaseWrapper(new SQL.Database(buffer));
  } else {
    db = new DatabaseWrapper(new SQL.Database());
  }

  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      brand TEXT DEFAULT '',
      type TEXT DEFAULT '饮水机',
      location TEXT DEFAULT '',
      building TEXT DEFAULT '',
      floor TEXT DEFAULT '',
      status TEXT DEFAULT 'normal',
      nfc_url TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS maintenance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      maintenance_type TEXT DEFAULT '巡检',
      content TEXT DEFAULT '',
      handler_name TEXT NOT NULL,
      handler_id TEXT NOT NULL,
      device_status TEXT DEFAULT 'normal',
      problem_desc TEXT DEFAULT '',
      result TEXT DEFAULT '',
      status TEXT DEFAULT '已完成',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      employee_id TEXT UNIQUE NOT NULL,
      phone TEXT DEFAULT '',
      role TEXT DEFAULT 'maintainer',
      permissions TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS feishu_config (
      id INTEGER PRIMARY KEY,
      app_id TEXT DEFAULT '',
      app_secret TEXT DEFAULT '',
      app_token TEXT DEFAULT '',
      table_id TEXT DEFAULT '',
      connected INTEGER DEFAULT 0,
      last_sync_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      operator TEXT DEFAULT '',
      detail TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Add permissions column if missing (migration)
  try {
    db.prepare("SELECT permissions FROM users LIMIT 1").get();
  } catch {
    db.exec("ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT '[]'");
  }

  // Seed data
  const count = db.prepare('SELECT COUNT(*) as count FROM devices').get().count;
  if (count === 0) {
    const devices = [
      ['WS-A1-001', '美的', '直饮机', '1楼大厅东侧', 'A栋', '1F', 'normal', '/submit/WS-A1-001'],
      ['WS-A1-002', '沁园', '直饮机', '1楼大厅西侧', 'A栋', '1F', 'normal', '/submit/WS-A1-002'],
      ['WS-A3-001', '安吉尔', '净水器', '3楼茶水间', 'A栋', '3F', 'repair', '/submit/WS-A3-001'],
      ['WS-B2-001', '美的', '直饮机', '2楼休息区', 'B栋', '2F', 'normal', '/submit/WS-B2-001'],
      ['WS-B5-001', '沁园', '净水器', '5楼办公区', 'B栋', '5F', 'replace', '/submit/WS-B5-001'],
      ['WS-C1-001', '安吉尔', '直饮机', '1楼大堂', 'C栋', '1F', 'normal', '/submit/WS-C1-001'],
    ];
    for (const d of devices) {
      db.prepare('INSERT INTO devices (code, brand, type, location, building, floor, status, nfc_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(...d);
    }

    // All pages for admin
    const allPages = '["/","/devices","/maintenance","/users","/nfc-config","/feishu-config"]';
    const viewerPages = '["/"]';
    const maintainerPages = '["/","/devices","/maintenance"]';

    const users = [
      ['张伟', 'EMP001', '13800138001', 'admin', allPages],
      ['李强', 'EMP002', '13800138002', 'maintainer', maintainerPages],
      ['王芳', 'EMP003', '13800138003', 'maintainer', maintainerPages],
      ['赵明', 'EMP004', '13800138004', 'viewer', viewerPages],
    ];
    for (const u of users) {
      db.prepare('INSERT INTO users (name, employee_id, phone, role, permissions) VALUES (?, ?, ?, ?, ?)').run(...u);
    }

    const records = [
      [1, '巡检', '常规巡检，设备运行正常', '李强', 'EMP002', 'normal', '', '设备正常运行', '已完成', '2026-05-01 09:00:00'],
      [2, '巡检', '常规巡检，滤芯使用正常', '李强', 'EMP002', 'normal', '', '设备正常运行', '已完成', '2026-05-01 09:30:00'],
      [3, '维修', '设备漏水，需更换密封圈', '王芳', 'EMP003', 'repair', '出水口漏水', '已更换密封圈，待观察', '处理中', '2026-05-02 14:00:00'],
      [4, '维保', '更换滤芯', '李强', 'EMP002', 'normal', '滤芯到期', '已更换新滤芯', '已完成', '2026-05-03 10:00:00'],
      [5, '巡检', '设备异常，出水量小', '王芳', 'EMP003', 'replace', '出水量明显减小', '建议整机更换', '待处理', '2026-05-04 11:00:00'],
      [1, '维保', '月度保养，清洁消毒', '李强', 'EMP002', 'normal', '', '已完成清洁消毒', '已完成', '2026-04-15 09:00:00'],
      [6, '巡检', '新设备验收', '王芳', 'EMP003', 'normal', '', '验收通过', '已完成', '2026-04-20 15:00:00'],
      [2, '维保', '季度深度清洁', '李强', 'EMP002', 'normal', '', '深度清洁完成', '已完成', '2026-04-25 10:00:00'],
    ];
    for (const r of records) {
      db.prepare('INSERT INTO maintenance_records (device_id, maintenance_type, content, handler_name, handler_id, device_status, problem_desc, result, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(...r);
    }

    db.prepare('INSERT OR IGNORE INTO feishu_config (id) VALUES (1)').run();
    console.log('Seed data inserted');
  }

  return db;
}

export function getDb() {
  return db;
}
