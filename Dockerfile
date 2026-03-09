# 多阶段构建 - 前端
FROM node:20-alpine AS client-builder

WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client/ ./
RUN npm run build

# 多阶段构建 - 后端
FROM node:20-alpine AS server-builder

WORKDIR /app/server

COPY server/package*.json ./
RUN npm install

COPY server/ ./
RUN npm run db:generate
RUN npm run build

# 生产镜像
FROM node:20-alpine

WORKDIR /app

# 安装运行时依赖
COPY server/package*.json ./
RUN npm install --production

# 复制构建产物
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/prisma ./prisma
COPY --from=client-builder /app/client/dist ./client/dist

# 创建数据目录
RUN mkdir -p /app/data /app/uploads

# 环境变量
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/dev.db"
ENV PORT=3001

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "dist/index.js"]
