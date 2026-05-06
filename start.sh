#!/bin/bash
# 饮水机巡检系统 - 启动脚本
cd /vol1/@apphome/trim.openclaw/data/workspace/water-dispenser-inspect

# 启动后端 (Express + 静态前端)
setsid node server/index.js > /tmp/water-dispenser.log 2>&1 &
echo "Backend started on :3001 (PID: $!)"

# 启动 localhost.run 隧道 (注册账号，域名固定)
setsid ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 \
  -i ~/.ssh/id_ed25519 \
  -R 80:localhost:3001 \
  h2nson@foxmail.com@localhost.run > /tmp/tunnel.log 2>&1 &
echo "Tunnel started (PID: $!)"
