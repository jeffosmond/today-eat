#!/bin/bash

# 家庭就餐菜品选择系统 - Docker 部署脚本

set -e

IMAGE_NAME="today-eat"
CONTAINER_NAME="today-eat"
PORT="3001"

echo "🚀 开始部署..."

# 停止并删除旧容器
echo "📦 停止旧容器..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# 构建镜像
echo "🔨 构建 Docker 镜像..."
docker build -t $IMAGE_NAME .

# 创建数据目录
echo "📁 创建数据目录..."
mkdir -p ./data
mkdir -p ./uploads

# 运行容器
echo "🏃 启动容器..."
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:3001 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  -e NODE_ENV=production \
  -e DATABASE_URL="file:/app/data/dev.db" \
  --restart unless-stopped \
  $IMAGE_NAME

# 等待启动
sleep 3

# 检查状态
if docker ps | grep -q $CONTAINER_NAME; then
  echo "✅ 部署成功！"
  echo "📍 访问地址：http://localhost:$PORT"
  echo "📋 查看日志：docker logs -f $CONTAINER_NAME"
  echo "🛑 停止服务：docker stop $CONTAINER_NAME"
  echo "🔄 重启服务：docker restart $CONTAINER_NAME"
else
  echo "❌ 部署失败，请检查日志："
  docker logs $CONTAINER_NAME
  exit 1
fi
