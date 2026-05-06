# 饮水机巡检管理系统 - 开发任务

请根据 PROJECT.md 中的需求文档，从零开始构建一个完整的「饮水机巡检管理系统」。

## 技术栈要求
- **前端**: React 18 + Vite + Tailwind CSS + React Router v6
- **后端**: Node.js + Express + better-sqlite3
- **UI**: 使用 Tailwind CSS 构建响应式界面，移动端优先
- **图标**: 使用 Lucide React 图标库
- **图表**: 使用 Chart.js 或 Recharts

## 项目结构
```
water-dispenser-inspect/
├── client/                 # 前端
│   ├── src/
│   │   ├── components/     # 通用组件
│   │   ├── pages/          # 页面组件
│   │   ├── hooks/          # 自定义 hooks
│   │   ├── utils/          # 工具函数
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── server/                 # 后端
│   ├── routes/             # 路由
│   ├── db/                 # 数据库
│   ├── middleware/          # 中间件
│   ├── services/           # 业务逻辑
│   └── index.js
├── package.json            # 根 package.json (scripts)
└── PROJECT.md
```

## 核心开发要求

### 前端
1. **响应式设计**: 完美适配 PC 端和移动端，移动端优先
2. **中文界面**: 所有文字使用中文
3. **配色方案**: 专业的蓝灰色系，不要花哨的渐变
4. **数据看板**: 首页展示核心指标卡片 + 状态分布图 + 楼栋分布图 + 最近维保记录
5. **设备管理**: 卡片式展示，支持搜索、筛选（楼栋/类型/状态）、新增、编辑、详情
6. **维保记录**: 表格展示，支持搜索、筛选、导出 CSV
7. **人员管理**: 表格展示，角色标签差异化显示，支持新增/编辑/删除
8. **NFC 配置**: 步骤化指引展示，URL 自动生成
9. **飞书配置**: 连接状态展示，配置表单，测试连接功能
10. **维保提交页**: NFC 跳转目标，无需登录，仅需工号核验

### 后端
1. **RESTful API**: 按 PROJECT.md 设计实现所有接口
2. **SQLite 数据库**: 使用 better-sqlite3，自动建表
3. **工号核验**: 维保提交时校验工号是否在授权人员列表
4. **CSV 导出**: 维保记录导出功能
5. **操作日志**: 记录关键操作
6. **飞书 API 集成**: 实现飞书多维表格的数据同步（读写）
7. **CORS**: 支持跨域请求
8. **错误处理**: 统一错误响应格式

### 飞书集成
使用飞书开放平台 API：
- 获取 tenant_access_token: POST https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal
- 读取多维表格记录: GET https://open.feishu.cn/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records
- 写入多维表格记录: POST https://open.feishu.cn/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records
- 批量写入: POST https://open.feishu.cn/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_create

### 数据库初始化
创建数据库时自动插入一些示例数据：
- 3-5 台示例设备（不同楼栋、不同状态）
- 2-3 个示例人员（不同角色）
- 5-10 条示例维保记录

## 开发步骤
1. 初始化项目结构，安装依赖
2. 搭建后端 Express 服务 + SQLite 数据库
3. 实现所有 API 路由
4. 搭建前端 Vite + React 项目
5. 实现所有页面组件
6. 联调前后端
7. 确保 `npm run dev` 可以同时启动前端和后端

## 启动命令
最终项目应该可以通过以下命令启动：
```bash
cd water-dispenser-inspect
npm install
npm run dev    # 同时启动前端(5173)和后端(3001)
```

前端 vite.config.js 配置代理，将 /api 请求代理到后端 3001 端口。

## 注意事项
- 不要使用 emoji 作为图标，使用 Lucide React 图标
- 配色使用专业的蓝灰色系
- 所有文字中文
- 移动端优先响应式设计
- 维保提交页（/submit/:deviceCode）无需登录，直接展示设备信息和提交表单
