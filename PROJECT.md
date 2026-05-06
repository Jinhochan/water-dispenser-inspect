# 饮水机巡检管理系统

## 项目概述

面向企业园区、学校、写字楼场景的饮水机设备数字化巡检维保管理系统，基于 Web 端开发，深度适配飞书办公生态，通过 NFC 技术实现轻量化无感化巡检。

## 技术栈

- **前端**: React 18 + Vite + Tailwind CSS + React Router
- **后端**: Node.js + Express + SQLite (better-sqlite3)
- **飞书集成**: 飞书开放平台 API (多维表格同步)
- **NFC**: URL 跳转方案 (NFC 标签写入设备详情页 URL)

## 核心功能模块

### 1. 总览 - 数据看板（首页）
- 核心指标卡片：设备总数、本月维保数量、逾期维保数量、正常运转设备数量及占比
- 设备状态分布统计：条形进度条展示「正常/维修中/待更换」三类状态
- 楼栋设备分布统计：按楼栋维度统计设备分布
- 最近维保记录列表

### 2. 设备管理
- 设备新增（手动录入 + 从飞书同步）
- 设备筛选与搜索（编码、位置模糊搜索，楼栋/类型/状态筛选）
- 设备卡片展示（编码、品牌、状态、位置）
- 设备详情与编辑
- 设备状态管理（正常/维修中/待更换）

### 3. 维保记录
- 搜索与筛选（设备、人员、内容关键词，维保类型筛选）
- 记录列表展示（表格形式）
- 记录导出 CSV
- 详情查看

### 4. 人员管理
- 权限规则公示
- 人员新增（姓名、工号、手机号、角色）
- 人员列表展示
- 人员编辑/删除
- 身份核验（工号校验）

### 5. NFC 配置
- 工作原理展示
- 标签规格推荐
- URL 规则设定（按设备编码自动生成）

### 6. 飞书配置
- 配置状态展示
- 全流程配置指引
- 凭证配置表单（App ID、App Secret、App Token、Table ID）
- 数据同步能力

## 角色权限

| 角色 | 权限 |
|------|------|
| 系统管理员 | 全模块操作权限 |
| 一线维保人员 | 提交维保记录、查看对应设备信息（需工号核验） |
| 企业管理者 | 数据看板只读权限 |

## 数据库设计

### devices 表
- id, code (设备编码), brand (品牌), type (设备类型), location (位置), building (楼栋), floor (楼层), status (状态: normal/repair/replace), nfc_url, created_at, updated_at

### maintenance_records 表
- id, device_id, maintenance_type (巡检/维保/维修), content (维保内容), handler_name (维保人), handler_id (工号), device_status (设备状态), problem_desc (问题描述), result (处理结果), status (处理状态), created_at

### users 表
- id, name (姓名), employee_id (工号), phone (手机号), role (admin/maintainer/viewer), created_at, updated_at

### feishu_config 表
- id, app_id, app_secret, app_token, table_id, connected (连接状态), last_sync_at

## API 路由设计

### 设备 /api/devices
- GET / - 设备列表（支持筛选、搜索、分页）
- POST / - 新增设备
- GET /:id - 设备详情
- PUT /:id - 更新设备
- DELETE /:id - 删除设备
- POST /sync-feishu - 从飞书同步设备

### 维保记录 /api/maintenance
- GET / - 记录列表（支持筛选、搜索、分页）
- POST / - 新增记录（含工号核验）
- GET /:id - 记录详情
- GET /export - 导出 CSV

### 人员 /api/users
- GET / - 人员列表
- POST / - 新增人员
- PUT /:id - 更新人员
- DELETE /:id - 删除人员
- POST /verify - 工号核验

### 统计 /api/stats
- GET /overview - 总览数据
- GET /device-status - 设备状态分布
- GET /building-distribution - 楼栋分布

### 飞书 /api/feishu
- GET /config - 获取配置
- POST /config - 保存配置
- POST /test - 测试连接
- POST /sync - 手动同步

## 非功能需求

- 移动端优先适配（响应式设计）
- PC 端页面加载 ≤2s，移动端 ≤3s
- 支持 50 人同时在线
- 表单提交响应 ≤1s
- 操作日志留存
- 敏感信息加密存储

## 页面路由

- / - 数据看板
- /devices - 设备管理
- /devices/:id - 设备详情
- /maintenance - 维保记录
- /users - 人员管理
- /nfc-config - NFC 配置
- /feishu-config - 飞书配置
- /submit/:deviceCode - 维保提交页（NFC 跳转目标，无需登录）
