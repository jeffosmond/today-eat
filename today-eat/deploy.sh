#!/bin/bash

# 今天吃什么 - Docker 部署脚本

set -e

echo "🚀 开始部署..."

# 进入项目目录
cd "$(dirname "$0")"

# 停止并删除旧容器
echo "📦 停止旧容器..."
docker compose down

# 构建并启动
echo "🔨 构建并启动服务..."
docker compose up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查状态
if docker compose ps | grep -q "Up"; then
    echo ""
    echo "✅ 部署成功！"
    echo ""
    echo "📍 访问地址：http://localhost:3001"
    echo "📋 查看日志：docker compose logs -f"
    echo "🛑 停止服务：docker compose down"
    echo "🔄 重启服务：docker compose restart"
    echo ""
else
    echo "❌ 部署失败，请检查日志："
    docker compose logs
    exit 1
fi
