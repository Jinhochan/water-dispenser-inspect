# 饮水机巡检管理系统

面向企业园区、学校、写字楼的饮水机设备数字化巡检维保管理系统。

## 技术栈

- **前端**: React 18 + Vite + Tailwind CSS + Recharts
- **后端**: Node.js + Express + sql.js (SQLite)
- **特色**: NFC 无感巡检、飞书多维表格同步、移动端自适应

## 快速启动

```bash
cd water-dispenser-inspect
npm run install:all   # 安装所有依赖
npm run dev           # 同时启动前端(5173)和后端(3001)
```

访问 http://localhost:5173

## 功能模块

| 模块 | 说明 |
|------|------|
| 总览 | 数据看板，核心指标卡片、状态分布图、楼栋分布图 |
| 设备管理 | 设备增删改查、卡片展示、飞书同步 |
| 维保记录 | 记录查询、筛选、CSV 导出 |
| 人员管理 | 人员增删改查、角色权限管理 |
| NFC 配置 | NFC 标签 URL 生成、操作指引 |
| 飞书配置 | 飞书多维表格连接配置、数据同步 |

## NFC 巡检流程

1. 管理员为每台设备生成唯一 URL 并写入 NFC 标签
2. 维保人员手机触碰 NFC 标签，自动跳转设备详情页
3. 填写维保信息，输入工号完成身份核验
4. 提交后记录自动保存，同步至飞书多维表格

## 项目结构

```
water-dispenser-inspect/
├── client/          # React 前端
│   ├── src/pages/   # 6 个页面组件
│   └── src/utils/   # API 工具
├── server/          # Express 后端
│   ├── routes/      # 5 个 API 模块
│   └── db/          # SQLite 数据库
└── package.json     # 根配置
```

## API 接口

- `GET/POST /api/devices` - 设备管理
- `GET/POST /api/maintenance` - 维保记录
- `GET/POST /api/users` - 人员管理
- `GET /api/stats/*` - 统计数据
- `GET/POST /api/feishu/*` - 飞书配置与同步
